/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Load firebase config from local JSON securely
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Support custom project environment variables as fallback
const resolvedConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const dbId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

console.log(`[Firebase Admin Initializer] Connecting to project: ${resolvedConfig.projectId}, database: ${dbId || '(default)'}`);

// Initialize firebase-admin on the server securely
const adminApp = admin.initializeApp({
  projectId: resolvedConfig.projectId,
  storageBucket: resolvedConfig.storageBucket,
});
const adminDb = dbId ? getFirestore(adminApp, dbId) : getFirestore(adminApp);

// Helper utilities to parse Firestore REST API value formats to plain JavaScript values
function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('arrayValue' in value) {
    const list = value.arrayValue.values || [];
    return list.map(parseFirestoreValue);
  }
  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    const obj: any = {};
    for (const key of Object.keys(fields)) {
      obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
  }
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  return null;
}

function parseFirestoreDocument(doc: any): any {
  if (!doc || !doc.fields) return null;
  const data: any = {};
  for (const key of Object.keys(doc.fields)) {
    data[key] = parseFirestoreValue(doc.fields[key]);
  }
  return data;
}

// Core API Gate: Secure server-side validation of password-protected buttons
app.post('/api/verify-password', async (req: express.Request, res: express.Response) => {
  const { buttonId, password } = req.body;
  if (!buttonId || !password) {
    return res.status(400).json({ error: 'Missing buttonId or password' });
  }

  try {
    const docRef = adminDb.collection('protected_buttons').doc(buttonId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Gesperrte Konfiguration nicht gefunden / Protected config not found' });
    }

    const data = docSnap.data();
    if (!data) {
      return res.status(404).json({ error: 'Gesperrte Konfiguration ist leer / Protected config is empty' });
    }

    // Re-hash client password input to match stored SHA-256
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (data.passwordHash === hash) {
      // Authenticated! Hand over original destination details safely
      return res.json({
        success: true,
        actionType: data.actionType,
        actionValue: data.actionValue,
        uploadedFile: data.uploadedFile || null,
        downloadItems: data.downloadItems || null
      });
    } else {
      return res.status(401).json({ error: 'Falsches Passwort / Incorrect password' });
    }
  } catch (err: any) {
    console.error("Error in server-side verify-password:", err);
    return res.status(500).json({ error: 'Server-sided verification error ' + err.message });
  }
});



const PUBLIC_SHARE_ORIGIN = process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://www.ureel.me';

function getPublicOrigin(req: express.Request): string {
  const host = (req.get('host') || '').toLowerCase();
  const protocol = req.protocol || 'https';

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return `${protocol}://${host}`;
  }

  // Social previews must not point to temporary Vercel preview domains.
  return PUBLIC_SHARE_ORIGIN.replace(/\/$/, '');
}

function stripBrandPrefix(value: any): string {
  return String(value || '')
    .replace(/^\s*(ureel(?:\.me)?|konu(?:\.live|\.app)?)\s*[–—-]\s*/i, '')
    .trim();
}

function pickSocialTitle(...values: any[]): string {
  for (const value of values) {
    const clean = stripBrandPrefix(value);
    if (clean) return clean;
  }
  return 'Aus Video wird Aktion.';
}

function pickSocialDescription(...values: any[]): string {
  for (const value of values) {
    const clean = String(value || '').trim();
    if (clean) return clean;
  }
  return 'Interaktive Karten. Ein Link. Unendliche Möglichkeiten.';
}

function escapeHtml(value: any): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(value: any, origin: string): string {
  const raw = String(value || '').trim();
  if (!raw) return `${origin}/brand/ureel-share-og.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return `${origin}/${raw}`;
}

function stripExistingSocialMeta(html: string): string {
  // LinkedIn and WhatsApp can behave unpredictably when static and dynamic
  // Open-Graph tags are duplicated. Keep one authoritative RC3.1.2 block only.
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>\s*/i, '\n')
    .replace(/\s*<meta\s+(?:name|property)=["'](?:title|description|keywords|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<link\s+rel=["']canonical["'][^>]*>\s*/gi, '\n');
}

// SEO & Scraping Gate: Inject dynamic Open-Graph meta tags on demand
app.get(['/u/:slug', '/share/:slug'], async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { slug } = req.params;
  if (!slug) return next();

  try {
    const cleanSlug = slug.toLowerCase().trim();
    // Retrieve associated card document securely via Firestore REST API
    // This avoids cross-project credential and IAM errors in the sandboxed preview environment
    const dbName = dbId || '(default)';
    const restUrl = `https://firestore.googleapis.com/v1/projects/${resolvedConfig.projectId}/databases/${dbName}/documents:runQuery?key=${resolvedConfig.apiKey}`;
    
    const restResponse = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'cards' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: cleanSlug }
            }
          },
          limit: 1
        }
      })
    });

    if (!restResponse.ok) {
      const errText = await restResponse.text();
      console.error(`[OpenGraph REST query] Failed with status ${restResponse.status}:`, errText);
      return next();
    }

    const runQueryResult = await restResponse.json() as any[];
    const firstResult = Array.isArray(runQueryResult) ? runQueryResult[0] : null;

    if (!firstResult || !firstResult.document) {
      return next();
    }

    const card = parseFirestoreDocument(firstResult.document);
    if (!card) return next();

    // Block page generation if card is draft/privatized
    if (!card.isPublished) {
      return res.status(403).send("<h1>Diese Seite ist unveröffentlicht / This page is draft/private</h1>");
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const htmlPath = isDev 
      ? path.join(process.cwd(), 'index.html') 
      : path.join(process.cwd(), 'dist/index.html');

    if (!fs.existsSync(htmlPath)) {
      return next();
    }

    let html = fs.readFileSync(htmlPath, 'utf8');
    html = stripExistingSocialMeta(html);

    // Build responsive, dynamic Open-Graph metadata header snippet with custom SEO if provided
    const origin = getPublicOrigin(req);
    const isShareRoute = req.path.startsWith('/share/');
    const seoTitle = pickSocialTitle(card.metaTitle, card.heroTitle, card.title);
    const seoDescription = pickSocialDescription(card.metaDescription, card.heroSubtitle, card.description);
    
    const dOgTitle = pickSocialTitle(card.ogTitle, card.metaTitle, card.heroTitle, card.title);
    const dOgDescription = pickSocialDescription(card.ogDescription, card.metaDescription, card.heroSubtitle, card.description);
    
    const ogImageCandidate = card.ogImageUrl ||
                    card.shareImageUrl ||
                    card.videoBackgroundConfig?.afterSequence?.imageUrl ||
                    card.videoBackgroundConfig?.afterVideo?.imageUrl ||
                    card.backgroundImageUrl ||
                    card.coverImageUrl ||
                    card.heroImageUrl ||
                    card.profileImageUrl ||
                    "/brand/ureel-share-og.png";
    const ogImage = toAbsoluteUrl(ogImageCandidate, origin);
    const routePrefix = isShareRoute ? 'share' : 'u';
    const ogUrl = `${origin}/${routePrefix}/${card.slug || slug}`;
    const canonicalUrl = `${origin}/u/${card.slug || slug}`;

    const keywordsList = card.keywords && Array.isArray(card.keywords) && card.keywords.length > 0
      ? card.keywords.join(', ')
      : '';

    const ogSnippet = `
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDescription)}" />
  ${keywordsList ? `<meta name="keywords" content="${escapeHtml(keywordsList)}" />` : ''}
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(dOgTitle)}" />
  <meta property="og:description" content="${escapeHtml(dOgDescription)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="627" />
  <meta property="og:image:alt" content="Aus Video wird Aktion." />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(ogUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(dOgTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(dOgDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
`;

    // Inject before the end of the head tag
    html = html.replace('</head>', `${ogSnippet}</head>`);

    if (isDev && viteServer) {
      // Direct Vite dynamic module graph index transformation
      html = await viteServer.transformIndexHtml(req.originalUrl, html);
    }

    return res.send(html);
  } catch (err) {
    console.error("OpenGraph pre-render pipeline error:", err);
    return next();
  }
});

/**
 * Background Video Processing Task executing FFmpeg compression rules on the server
 */
async function processVideoBackground(cardId: string) {
  const cardRef = adminDb.collection('cards').doc(cardId);
  let originalFilePathLocal = '';
  let optimizedFilePathLocal = '';
  let thumbnailFilePathLocal = '';

  try {
    const cardSnap = await cardRef.get();
    if (!cardSnap.exists) {
      console.error(`[VideoProcessor] Card with ID ${cardId} not found.`);
      return;
    }

    const card = cardSnap.data();
    if (!card) return;

    const vBgConfig = card.videoBackgroundConfig;
    if (!vBgConfig) {
      console.error(`[VideoProcessor] Card ${cardId} has no videoBackgroundConfig.`);
      return;
    }

    const job = vBgConfig.videoProcessingJob;
    if (!job) {
      console.error(`[VideoProcessor] Card ${cardId} has no videoProcessingJob.`);
      return;
    }

    // Double check status is processing
    if (job.status !== 'processing') {
      console.error(`[VideoProcessor] Job is not in status "processing", current status: ${job.status}`);
      return;
    }

    const originalStoragePath = job.originalStoragePath;
    const optimizedStoragePath = job.optimizedStoragePath;

    if (!originalStoragePath || !optimizedStoragePath) {
      throw new Error('Original or optimized storage path is missing in videoProcessingJob structure.');
    }

    console.log(`[VideoProcessor] Starting job for card ${cardId}`);
    console.log(`[VideoProcessor] Original path: ${originalStoragePath}`);
    console.log(`[VideoProcessor] Optimized path: ${optimizedStoragePath}`);

    // Download original video from Firebase storage or fetch from local uploads failover
    const bucket = getStorage(adminApp).bucket();
    const originalFile = bucket.file(originalStoragePath);

    originalFilePathLocal = path.join('/tmp', `orig_${crypto.randomBytes(8).toString('hex')}_${path.basename(originalStoragePath).replace(/[^a-zA-Z0-9.\-_]/g, '')}`);
    optimizedFilePathLocal = path.join('/tmp', `opt_${crypto.randomBytes(8).toString('hex')}.mp4`);

    console.log(`[VideoProcessor] Fetching original video file from Firebase Storage path: ${originalStoragePath}`);
    try {
      const [exists] = await originalFile.exists();
      if (!exists) {
        throw new Error(`Original video file not found in Storage at path: ${originalStoragePath}`);
      }
      console.log(`[VideoProcessor] Downloading original file from Firebase Storage to ${originalFilePathLocal}...`);
      await originalFile.download({ destination: originalFilePathLocal });
      console.log(`[VideoProcessor] Original file downloaded successfully from Storage.`);
    } catch (gcsDownloadErr: any) {
      console.error(`[VideoProcessor] Failed to download or verify GCS file:`, gcsDownloadErr.message);
      throw new Error(`Original video file could not be fetched from Storage. Details: ${gcsDownloadErr.message}`);
    }

    // Determine target dimensions and duration based on plan, with high limits validation
    const plan = job.plan || (job.durationLimitSeconds === 12 ? 'pro' : 'business');
    let targetDuration = job.targetDurationSeconds || job.durationLimitSeconds || 10;
    let targetMaxFileSizeMb = job.targetMaxFileSizeMb || (job.targetMaxSizeBytes ? Math.round(job.targetMaxSizeBytes / (1024 * 1024)) : 5);
    let targetResolution = job.targetResolution || '720x1280';
    let audioMode = job.audioMode || (plan === 'pro' ? 'compressed' : 'keep');

    // Server-side strict validation of plan limits to avoid exploitation
    if (plan === 'starter') {
      targetDuration = Math.min(targetDuration, 10);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 5);
      targetResolution = '720x1280';
      audioMode = 'muted';
    } else if (plan === 'pro') {
      targetDuration = Math.min(targetDuration, 12);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 10);
      targetResolution = '720x1280';
      if (audioMode !== 'muted') audioMode = 'compressed';
    } else if (plan === 'business') {
      targetDuration = Math.min(targetDuration, 15);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 15);
      // allows both 720 and 1080 resolution, and moderate copy audio modes
    }

    // Dynamic bitrate calculation: target total size with a 15% safety reserve
    const usableBytes = targetMaxFileSizeMb * 1024 * 1024 * 0.85;
    const totalBitrateBps = (usableBytes * 8) / targetDuration;

    let audioBitrateBps = 0;
    if (audioMode === 'keep') {
      audioBitrateBps = 128 * 1024;
    } else if (audioMode === 'compressed') {
      audioBitrateBps = 64 * 1024;
    }

    let videoBitrateBps = totalBitrateBps - audioBitrateBps;
    if (videoBitrateBps < 150 * 1024) {
      videoBitrateBps = 150 * 1024; // floor at 150 kbps
    }
    const maxCustomCeiling = plan === 'pro' ? 1600 * 1024 : 2400 * 1024;
    if (videoBitrateBps > maxCustomCeiling) {
      videoBitrateBps = maxCustomCeiling; // tighter ceiling for fast startup (approx 2MB - 5MB)
    }

    const videoBitrateKbps = Math.floor(videoBitrateBps / 1024);
    const audioBitrateKbps = Math.floor(audioBitrateBps / 1024);

    console.log(`[VideoProcessor] Bitrates: Video ${videoBitrateKbps} kbps, Audio ${audioBitrateKbps} kbps`);

    // Prepare FFmpeg filters for aspect ratio 9:16 cropping and resizing based on fitMode
    const fitMode = vBgConfig?.videoFitMode || 'contain';
    const videoFilters: string[] = [];
    if (fitMode === 'cover') {
      if (targetResolution === '1080x1920') {
        videoFilters.push('scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920');
      } else {
        videoFilters.push('scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280');
      }
    } else {
      // 'contain' or fallback default
      if (targetResolution === '1080x1920') {
        videoFilters.push('scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1');
      } else {
        videoFilters.push('scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1');
      }
    }

    // Short-video stretching option (e.g. slowed down matching targetDuration)
    let isStretched = false;
    const originalDurationVal = job.originalDurationSeconds;
    if (job.stretchShortVideo && originalDurationVal && originalDurationVal < targetDuration) {
      const speedFactor = originalDurationVal / targetDuration;
      // Stretched if speedFactor is significantly below 1
      if (speedFactor > 0.05 && speedFactor < 0.95) {
        const ptsMultiplier = (1 / speedFactor).toFixed(4);
        videoFilters.push(`setpts=${ptsMultiplier}*PTS`);
        isStretched = true;
        console.log(`[VideoProcessor] Short video stretch active. Original: ${originalDurationVal}s, target: ${targetDuration}s, speedMultiplier: ${speedFactor}`);
      }
    }

    // Construct fluent-ffmpeg command chain
    const command = ffmpeg(originalFilePathLocal);
    command.videoFilters(videoFilters);
    command.videoCodec('libx264');
    command.videoBitrate(`${videoBitrateKbps}k`);
    
    command.outputOptions([
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart'
    ]);

    // Apply audio configurations
    if (audioMode === 'muted' || isStretched) {
      command.noAudio();
    } else {
      command.audioCodec('aac');
      command.audioBitrate(`${audioBitrateKbps}k`);
    }

    // Specify output duration capped at plan limitations
    const finalRenderDuration = isStretched ? targetDuration : Math.min(originalDurationVal || targetDuration, targetDuration);
    command.duration(finalRenderDuration);

    command.output(optimizedFilePathLocal);

    console.log(`[VideoProcessor] Processing with FFmpeg now...`);
    await new Promise<void>((resolve, reject) => {
      command
        .on('start', (cmdline) => {
          console.log(`[FFmpeg Cmd]: ${cmdline}`);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    console.log(`[VideoProcessor] FFmpeg process completed successfully.`);

    // Verify optimized file exists
    if (!fs.existsSync(optimizedFilePathLocal)) {
      throw new Error('Optimized file was not written to local path by FFmpeg.');
    }

    const optStats = fs.statSync(optimizedFilePathLocal);
    console.log(`[VideoProcessor] Optimized file size: ${optStats.size} bytes`);

    // Extract a JPEG thumbnail at 0.5s (or 0.1s if 0.5s fails) of the optimized video
    thumbnailFilePathLocal = path.join('/tmp', `thumb_${crypto.randomBytes(8).toString('hex')}.jpg`);
    console.log(`[VideoProcessor] Extracting thumbnail reference frame from optimized video to ${thumbnailFilePathLocal}`);
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(optimizedFilePathLocal)
          .seekInput('0.5')
          .frames(1)
          .output(thumbnailFilePathLocal)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    } catch (e: any) {
      console.warn(`[VideoProcessor] Seek at 0.5s failed, retrying at 0.1s...`);
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(optimizedFilePathLocal)
            .seekInput('0.1')
            .frames(1)
            .output(thumbnailFilePathLocal)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });
      } catch (e2) {
        console.error(`[VideoProcessor] All thumbnail extraction retries failed.`);
      }
    }

    // Upload optimized video file back to Firebase Storage
    let downloadUrl = '';
    const optimizedBuffer = fs.readFileSync(optimizedFilePathLocal);

    try {
      console.log(`[VideoProcessor] Uploading optimized video to Storage at ${optimizedStoragePath}`);
      const optimizedFileRef = bucket.file(optimizedStoragePath);
      await optimizedFileRef.save(optimizedBuffer, {
        metadata: {
          contentType: 'video/mp4',
          cacheControl: 'public, max-age=31536000'
        }
      });

      try {
        await optimizedFileRef.makePublic();
      } catch (pubErr: any) {
        console.log(`[VideoProcessor] Note: makePublic failed, proceeding with direct URL. Error: ${pubErr.message}`);
      }

      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(optimizedStoragePath)}?alt=media`;
      console.log(`[VideoProcessor] Optimized video uploaded to Firebase Storage. URL: ${downloadUrl}`);
    } catch (gcsOptErr: any) {
      console.error(`[VideoProcessor] Firebase Storage cloud write for optimized video failed completely:`, gcsOptErr.message);
      throw new Error(`Optimized video file could not be uploaded to Firebase Storage. Details: ${gcsOptErr.message}`);
    }

    // Upload thumbnail file to Firebase Storage if extracted
    let thumbnailUrl = '';
    const thumbnailStoragePath = optimizedStoragePath.replace('/reel/video-optimized/', '/reel/video-thumbnail/').replace('.mp4', '.jpg');
    if (fs.existsSync(thumbnailFilePathLocal)) {
      try {
        console.log(`[VideoProcessor] Uploading thumbnail to GCS at ${thumbnailStoragePath}`);
        const thumbBuffer = fs.readFileSync(thumbnailFilePathLocal);
        const thumbFileRef = bucket.file(thumbnailStoragePath);
        await thumbFileRef.save(thumbBuffer, {
          metadata: {
            contentType: 'image/jpeg',
            cacheControl: 'public, max-age=31536000'
          }
        });
        try {
          await thumbFileRef.makePublic();
        } catch (pubErr: any) {
          console.log(`[VideoProcessor] Note: Thumbnail makePublic failed. Error: ${pubErr.message}`);
        }
        thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbnailStoragePath)}?alt=media`;
        console.log(`[VideoProcessor] Thumbnail uploaded to Firebase Storage. URL: ${thumbnailUrl}`);
      } catch (gcsThumbErr: any) {
        console.error(`[VideoProcessor] Upload of thumbnail file to storage failed:`, gcsThumbErr.message);
      }
    }

    // Update Firestore Document with successful statuses
    const finishTime = new Date().toISOString();
    const updateObj: any = {
      'videoBackgroundConfig.videoProcessingJob.status': 'ready',
      'videoBackgroundConfig.videoProcessingJob.updatedAt': finishTime,
      'videoBackgroundConfig.videoProcessingJob.error': FieldValue.delete(),
      'videoBackgroundConfig.videoProcessingJob.errorMessage': FieldValue.delete(),
      'videoBackgroundConfig.upload.optimizedVideoUrl': downloadUrl,
      'videoBackgroundConfig.upload.optimizedStoragePath': optimizedStoragePath,
      'videoBackgroundConfig.upload.processingStatus': 'ready',
      'videoBackgroundConfig.upload.processingError': FieldValue.delete()
    };

    if (thumbnailUrl) {
      updateObj['videoBackgroundConfig.thumbnailUrl'] = thumbnailUrl;
      updateObj['videoBackgroundConfig.upload.thumbnailUrl'] = thumbnailUrl;
      updateObj['videoBackgroundConfig.upload.thumbnailStoragePath'] = thumbnailStoragePath;
    }

    await cardRef.update(updateObj);
    console.log(`[VideoProcessor] Firestore document successfully updated for card ${cardId}.`);

    // Delete Original file from Storage if requested to save costs
    if (job.originalDeleteAfterProcessing && job.originalStoragePath) {
      try {
        console.log(`[VideoProcessor] Deleting original video file from bucket: ${job.originalStoragePath}`);
        await bucket.file(job.originalStoragePath).delete();
        console.log(`[VideoProcessor] Original video successfully deleted from bucket.`);
      } catch (delErr: any) {
        console.error(`[VideoProcessor] Error trying to delete original video:`, delErr.message);
      }
    }

  } catch (err: any) {
    console.error(`[VideoProcessor] CRITICAL FAILURE for card ${cardId}:`, err);
    try {
      const failTime = new Date().toISOString();
      await cardRef.update({
        'videoBackgroundConfig.videoProcessingJob.status': 'failed',
        'videoBackgroundConfig.videoProcessingJob.error': err.message || 'Unknown processing error',
        'videoBackgroundConfig.videoProcessingJob.errorMessage': err.message || 'Unknown processing error',
        'videoBackgroundConfig.videoProcessingJob.updatedAt': failTime,
        'videoBackgroundConfig.upload.processingStatus': 'failed',
        'videoBackgroundConfig.upload.processingError': err.message || 'Unknown processing error'
      } as any);
    } catch (fsErr: any) {
      console.error(`[VideoProcessor] Failed to update failed job status in Firestore for card ${cardId}:`, fsErr);
    }
  } finally {
    // Local filesystem cleanup of temporary downloaded and compiled files
    if (originalFilePathLocal && fs.existsSync(originalFilePathLocal)) {
      try { fs.unlinkSync(originalFilePathLocal); } catch {}
    }
    if (optimizedFilePathLocal && fs.existsSync(optimizedFilePathLocal)) {
      try { fs.unlinkSync(optimizedFilePathLocal); } catch {}
    }
    if (thumbnailFilePathLocal && fs.existsSync(thumbnailFilePathLocal)) {
      try { fs.unlinkSync(thumbnailFilePathLocal); } catch {}
    }
  }
}

/**
 * REST Endpoint for kicking off video compression asynchronously
 */
app.post('/api/process-video-job', async (req: express.Request, res: express.Response) => {
  const { cardId } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: 'Missing cardId' });
  }

  try {
    const cardRef = adminDb.collection('cards').doc(cardId);
    
    // Perform transaction/atomic update to check status and set locking state securely
    const result = await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(cardRef);
      if (!docSnap.exists) {
        throw new Error('Card not found');
      }

      const card = docSnap.data();
      const vBgConfig = card?.videoBackgroundConfig;
      const job = vBgConfig?.videoProcessingJob;

      if (!job) {
        throw new Error('No video processing job initialized for this card');
      }

      // Check current job status
      if (job.status === 'processing') {
        return { started: false, reason: 'Job already in progress', status: 'processing' };
      }
      if (job.status === 'ready') {
        return { started: false, reason: 'Job already completed', status: 'ready' };
      }

      // Only proceed if queued, processing_pending or failed
      if (job.status !== 'queued' && job.status !== 'processing_pending' && job.status !== 'failed') {
        return { started: false, reason: `Invalid status to start processing: ${job.status}`, status: job.status };
      }

      // Atomically update state to 'processing' (Locking active)
      const now = new Date().toISOString();
      transaction.update(cardRef, {
        'videoBackgroundConfig.videoProcessingJob.status': 'processing',
        'videoBackgroundConfig.videoProcessingJob.updatedAt': now,
        'videoBackgroundConfig.upload.processingStatus': 'processing_pending'
      });

      return { started: true, status: 'processing' };
    });

    if (!result.started) {
      return res.status(409).json({ ok: false, error: result.reason, status: result.status });
    }

    // Trigger asynchronous background execution
    processVideoBackground(cardId).catch(asyncErr => {
      console.error(`[processVideoBackground async context handler error]:`, asyncErr);
    });

    return res.json({ ok: true, status: 'processing' });

  } catch (err: any) {
    console.error('Error starting video processing job:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Secure server-side Storage upload fallback to bypass client-side Storage Rule issues.
// Validates Google Auth ID Token to guarantee owner write security.
app.post('/api/upload-file-fallback', async (req: express.Request, res: express.Response) => {
  const { idToken, userId, cardId, type, fileName, contentType, base64Data } = req.body;

  if (!idToken || !userId || !cardId || !type || !fileName || !base64Data) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // ZIEL 4: Strictly block video files from using fallback proxy
  if (type === 'reel-video' || (contentType && contentType.toLowerCase().startsWith('video/'))) {
    return res.status(400).json({ error: 'Video upload fallback is structurally disabled. Videos must be uploaded directly to Firebase Storage.' });
  }

  try {
    // 1. Verify Google Auth ID Token
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    
    // 2. Enforce strict UID path isolation boundary
    if (decodedToken.uid !== userId) {
      return res.status(403).json({ error: 'Permission denied: User mismatch' });
    }

    // 3. Construct unified path based on type
    let storagePath = `users/${userId}/cards/${cardId}/${type}/${fileName}`;
    if (type === 'cover') {
      storagePath = `users/${userId}/cards/${cardId}/cover/cover.webp`;
    } else if (type === 'profile') {
      storagePath = `users/${userId}/cards/${cardId}/profile/profile.webp`;
    } else if (type === 'product') {
      storagePath = `users/${userId}/cards/${cardId}/product/product.webp`;
    } else if (type === 'reel-video') {
      storagePath = `users/${userId}/cards/${cardId}/reel/video-original/${fileName}`;
    } else if (type === 'background') {
      storagePath = `users/${userId}/cards/${cardId}/backgrounds/${fileName}`;
    } else if (type === 'button-images') {
      storagePath = `users/${userId}/cards/${cardId}/buttons/${fileName}`;
    } else if (type === 'after-sequence') {
      storagePath = `users/${userId}/cards/${cardId}/after-sequence/${fileName}`;
    } else if (type === 'slideshow') {
      storagePath = `users/${userId}/cards/${cardId}/slideshow/${fileName}`;
    } else if (type === 'branding') {
      storagePath = `users/${userId}/cards/${cardId}/branding/${fileName}`;
    } else if (type === 'seo') {
      storagePath = `users/${userId}/cards/${cardId}/seo/${fileName}`;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const bucket = getStorage(adminApp).bucket();
    const fileRef = bucket.file(storagePath);

    console.log(`[Backup Uploader] Saving file to Storage: ${storagePath} (${buffer.length} bytes, content-type: ${contentType})`);

    let downloadUrl = '';
    
    // 4. Save file to storage securely bypassing Storage rules with filesystem failover
    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000'
        }
      });

      // 5. Try to make the file public for direct browser fetches
      try {
        await fileRef.makePublic();
      } catch (pubErr: any) {
        console.log(`[Backup Uploader] Note: makePublic skipped or failed:`, pubErr.message);
      }

      // Build optimized media URL
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      console.log(`[Backup Uploader] Successfully uploaded to Firebase Storage. URL: ${downloadUrl}`);
    } catch (gcsSaveErr: any) {
      console.warn(`[Backup Uploader] Firebase Storage write failed: ${gcsSaveErr.message}. Failing over to local filesystem...`);
      
      const safeFilename = storagePath.replace(/\//g, '_');
      const localDiskPath = path.join(path.join(process.cwd(), 'uploads'), safeFilename);
      fs.writeFileSync(localDiskPath, buffer);
      
      // Serve via relative server url path to bypass any hardcoded domain routing rules
      downloadUrl = `/uploads/${encodeURIComponent(safeFilename)}`;
      console.log(`[Backup Uploader] Successfully saved local file as fallback: ${localDiskPath}. Public serving path: ${downloadUrl}`);
    }

    return res.json({
      success: true,
      downloadUrl,
      storagePath
    });

  } catch (err: any) {
    console.error('[Backup Uploader] Failed:', err);
    return res.status(500).json({ error: 'Fallback upload failed: ' + err.message });
  }
});

// Initialize integrated Dev & Production Express/Vite handlers
let viteServer: any = null;
async function startServer() {
  // Serve local filesystem fallback uploads directory
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  if (process.env.NODE_ENV !== 'production') {
    viteServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is booted and listening on http://localhost:${PORT}`);
  });
}

startServer();
