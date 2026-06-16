var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_storage = require("firebase-admin/storage");
var import_auth = require("firebase-admin/auth");
var import_crypto = __toESM(require("crypto"), 1);
var import_fluent_ffmpeg = __toESM(require("fluent-ffmpeg"), 1);
var import_ffmpeg = __toESM(require("@ffmpeg-installer/ffmpeg"), 1);
var import_ffprobe = __toESM(require("@ffprobe-installer/ffprobe"), 1);
import_dotenv.default.config();
import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg.default.path);
import_fluent_ffmpeg.default.setFfprobePath(import_ffprobe.default.path);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "100mb" }));
app.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
var firebaseConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
var firebaseConfig = JSON.parse(import_fs.default.readFileSync(firebaseConfigPath, "utf8"));
var resolvedConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId
};
var dbId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;
console.log(`[Firebase Admin Initializer] Connecting to project: ${resolvedConfig.projectId}, database: ${dbId || "(default)"}`);
var adminApp = import_firebase_admin.default.initializeApp({
  projectId: resolvedConfig.projectId,
  storageBucket: resolvedConfig.storageBucket
});
var adminDb = dbId ? (0, import_firestore.getFirestore)(adminApp, dbId) : (0, import_firestore.getFirestore)(adminApp);
function parseFirestoreValue(value) {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return parseInt(value.integerValue, 10);
  if ("doubleValue" in value) return parseFloat(value.doubleValue);
  if ("arrayValue" in value) {
    const list = value.arrayValue.values || [];
    return list.map(parseFirestoreValue);
  }
  if ("mapValue" in value) {
    const fields = value.mapValue.fields || {};
    const obj = {};
    for (const key of Object.keys(fields)) {
      obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
  }
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  return null;
}
function parseFirestoreDocument(doc) {
  if (!doc || !doc.fields) return null;
  const data = {};
  for (const key of Object.keys(doc.fields)) {
    data[key] = parseFirestoreValue(doc.fields[key]);
  }
  return data;
}
app.post("/api/verify-password", async (req, res) => {
  const { buttonId, password } = req.body;
  if (!buttonId || !password) {
    return res.status(400).json({ error: "Missing buttonId or password" });
  }
  try {
    const docRef = adminDb.collection("protected_buttons").doc(buttonId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Gesperrte Konfiguration nicht gefunden / Protected config not found" });
    }
    const data = docSnap.data();
    if (!data) {
      return res.status(404).json({ error: "Gesperrte Konfiguration ist leer / Protected config is empty" });
    }
    const hash = import_crypto.default.createHash("sha256").update(password).digest("hex");
    if (data.passwordHash === hash) {
      return res.json({
        success: true,
        actionType: data.actionType,
        actionValue: data.actionValue,
        uploadedFile: data.uploadedFile || null,
        downloadItems: data.downloadItems || null
      });
    } else {
      return res.status(401).json({ error: "Falsches Passwort / Incorrect password" });
    }
  } catch (err) {
    console.error("Error in server-side verify-password:", err);
    return res.status(500).json({ error: "Server-sided verification error " + err.message });
  }
});
app.get("/u/:slug", async (req, res, next) => {
  const { slug } = req.params;
  if (!slug) return next();
  try {
    const cleanSlug = slug.toLowerCase().trim();
    const dbName = dbId || "(default)";
    const restUrl = `https://firestore.googleapis.com/v1/projects/${resolvedConfig.projectId}/databases/${dbName}/documents:runQuery?key=${resolvedConfig.apiKey}`;
    const restResponse = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "cards" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
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
    const runQueryResult = await restResponse.json();
    const firstResult = Array.isArray(runQueryResult) ? runQueryResult[0] : null;
    if (!firstResult || !firstResult.document) {
      return next();
    }
    const card = parseFirestoreDocument(firstResult.document);
    if (!card) return next();
    if (!card.isPublished) {
      return res.status(403).send("<h1>Diese KONU-Seite ist unver\xF6ffentlicht / This KONU page is draft/private</h1>");
    }
    const isDev = process.env.NODE_ENV !== "production";
    const htmlPath = isDev ? import_path.default.join(process.cwd(), "index.html") : import_path.default.join(process.cwd(), "dist/index.html");
    if (!import_fs.default.existsSync(htmlPath)) {
      return next();
    }
    let html = import_fs.default.readFileSync(htmlPath, "utf8");
    const domain = req.get("host") || "konu.live";
    const protocol = req.protocol || "https";
    const seoTitle = card.metaTitle || card.heroTitle || card.title || "KONU";
    const seoDescription = card.metaDescription || card.heroSubtitle || card.description || "Deine Welt. Ein Link.";
    const dOgTitle = card.ogTitle || card.metaTitle || card.heroTitle || card.title || "KONU";
    const dOgDescription = card.ogDescription || card.metaDescription || card.heroSubtitle || card.description || "Deine Welt. Ein Link.";
    const ogImage = card.ogImageUrl || card.videoBackgroundConfig?.afterSequence?.imageUrl || card.videoBackgroundConfig?.afterVideo?.imageUrl || card.shareImageUrl || card.backgroundImageUrl || card.coverImageUrl || card.heroImageUrl || card.profileImageUrl || "/brand/konu-share-og.png";
    const ogUrl = `${protocol}://${domain}/u/${card.slug || slug}`;
    const keywordsList = card.keywords && Array.isArray(card.keywords) && card.keywords.length > 0 ? card.keywords.join(", ") : "";
    const ogSnippet = `
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDescription}" />
  ${keywordsList ? `<meta name="keywords" content="${keywordsList}" />` : ""}
  <meta property="og:title" content="${dOgTitle}" />
  <meta property="og:description" content="${dOgDescription}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${ogUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${dOgTitle}" />
  <meta name="twitter:description" content="${dOgDescription}" />
  <meta name="twitter:image" content="${ogImage}" />
`;
    html = html.replace("</head>", `${ogSnippet}</head>`);
    if (isDev && viteServer) {
      html = await viteServer.transformIndexHtml(req.originalUrl, html);
    }
    return res.send(html);
  } catch (err) {
    console.error("OpenGraph pre-render pipeline error:", err);
    return next();
  }
});
async function processVideoBackground(cardId) {
  const cardRef = adminDb.collection("cards").doc(cardId);
  let originalFilePathLocal = "";
  let optimizedFilePathLocal = "";
  let thumbnailFilePathLocal = "";
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
    if (job.status !== "processing") {
      console.error(`[VideoProcessor] Job is not in status "processing", current status: ${job.status}`);
      return;
    }
    const originalStoragePath = job.originalStoragePath;
    const optimizedStoragePath = job.optimizedStoragePath;
    if (!originalStoragePath || !optimizedStoragePath) {
      throw new Error("Original or optimized storage path is missing in videoProcessingJob structure.");
    }
    console.log(`[VideoProcessor] Starting job for card ${cardId}`);
    console.log(`[VideoProcessor] Original path: ${originalStoragePath}`);
    console.log(`[VideoProcessor] Optimized path: ${optimizedStoragePath}`);
    const bucket = (0, import_storage.getStorage)(adminApp).bucket();
    const originalFile = bucket.file(originalStoragePath);
    originalFilePathLocal = import_path.default.join("/tmp", `orig_${import_crypto.default.randomBytes(8).toString("hex")}_${import_path.default.basename(originalStoragePath).replace(/[^a-zA-Z0-9.\-_]/g, "")}`);
    optimizedFilePathLocal = import_path.default.join("/tmp", `opt_${import_crypto.default.randomBytes(8).toString("hex")}.mp4`);
    console.log(`[VideoProcessor] Fetching original video file from Firebase Storage path: ${originalStoragePath}`);
    try {
      const [exists] = await originalFile.exists();
      if (!exists) {
        throw new Error(`Original video file not found in Storage at path: ${originalStoragePath}`);
      }
      console.log(`[VideoProcessor] Downloading original file from Firebase Storage to ${originalFilePathLocal}...`);
      await originalFile.download({ destination: originalFilePathLocal });
      console.log(`[VideoProcessor] Original file downloaded successfully from Storage.`);
    } catch (gcsDownloadErr) {
      console.error(`[VideoProcessor] Failed to download or verify GCS file:`, gcsDownloadErr.message);
      throw new Error(`Original video file could not be fetched from Storage. Details: ${gcsDownloadErr.message}`);
    }
    const plan = job.plan || (job.durationLimitSeconds === 12 ? "pro" : "business");
    let targetDuration = job.targetDurationSeconds || job.durationLimitSeconds || 10;
    let targetMaxFileSizeMb = job.targetMaxFileSizeMb || (job.targetMaxSizeBytes ? Math.round(job.targetMaxSizeBytes / (1024 * 1024)) : 5);
    let targetResolution = job.targetResolution || "720x1280";
    let audioMode = job.audioMode || (plan === "pro" ? "compressed" : "keep");
    if (plan === "starter") {
      targetDuration = Math.min(targetDuration, 10);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 5);
      targetResolution = "720x1280";
      audioMode = "muted";
    } else if (plan === "pro") {
      targetDuration = Math.min(targetDuration, 12);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 10);
      targetResolution = "720x1280";
      if (audioMode !== "muted") audioMode = "compressed";
    } else if (plan === "business") {
      targetDuration = Math.min(targetDuration, 15);
      targetMaxFileSizeMb = Math.min(targetMaxFileSizeMb, 15);
    }
    const usableBytes = targetMaxFileSizeMb * 1024 * 1024 * 0.85;
    const totalBitrateBps = usableBytes * 8 / targetDuration;
    let audioBitrateBps = 0;
    if (audioMode === "keep") {
      audioBitrateBps = 128 * 1024;
    } else if (audioMode === "compressed") {
      audioBitrateBps = 64 * 1024;
    }
    let videoBitrateBps = totalBitrateBps - audioBitrateBps;
    if (videoBitrateBps < 150 * 1024) {
      videoBitrateBps = 150 * 1024;
    }
    const maxCustomCeiling = plan === "pro" ? 1600 * 1024 : 2400 * 1024;
    if (videoBitrateBps > maxCustomCeiling) {
      videoBitrateBps = maxCustomCeiling;
    }
    const videoBitrateKbps = Math.floor(videoBitrateBps / 1024);
    const audioBitrateKbps = Math.floor(audioBitrateBps / 1024);
    console.log(`[VideoProcessor] Bitrates: Video ${videoBitrateKbps} kbps, Audio ${audioBitrateKbps} kbps`);
    const fitMode = vBgConfig?.videoFitMode || "contain";
    const videoFilters = [];
    if (fitMode === "cover") {
      if (targetResolution === "1080x1920") {
        videoFilters.push("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920");
      } else {
        videoFilters.push("scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280");
      }
    } else {
      if (targetResolution === "1080x1920") {
        videoFilters.push("scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1");
      } else {
        videoFilters.push("scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1");
      }
    }
    let isStretched = false;
    const originalDurationVal = job.originalDurationSeconds;
    if (job.stretchShortVideo && originalDurationVal && originalDurationVal < targetDuration) {
      const speedFactor = originalDurationVal / targetDuration;
      if (speedFactor > 0.05 && speedFactor < 0.95) {
        const ptsMultiplier = (1 / speedFactor).toFixed(4);
        videoFilters.push(`setpts=${ptsMultiplier}*PTS`);
        isStretched = true;
        console.log(`[VideoProcessor] Short video stretch active. Original: ${originalDurationVal}s, target: ${targetDuration}s, speedMultiplier: ${speedFactor}`);
      }
    }
    const command = (0, import_fluent_ffmpeg.default)(originalFilePathLocal);
    command.videoFilters(videoFilters);
    command.videoCodec("libx264");
    command.videoBitrate(`${videoBitrateKbps}k`);
    command.outputOptions([
      "-preset",
      "fast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart"
    ]);
    if (audioMode === "muted" || isStretched) {
      command.noAudio();
    } else {
      command.audioCodec("aac");
      command.audioBitrate(`${audioBitrateKbps}k`);
    }
    const finalRenderDuration = isStretched ? targetDuration : Math.min(originalDurationVal || targetDuration, targetDuration);
    command.duration(finalRenderDuration);
    command.output(optimizedFilePathLocal);
    console.log(`[VideoProcessor] Processing with FFmpeg now...`);
    await new Promise((resolve, reject) => {
      command.on("start", (cmdline) => {
        console.log(`[FFmpeg Cmd]: ${cmdline}`);
      }).on("end", () => resolve()).on("error", (err) => reject(err)).run();
    });
    console.log(`[VideoProcessor] FFmpeg process completed successfully.`);
    if (!import_fs.default.existsSync(optimizedFilePathLocal)) {
      throw new Error("Optimized file was not written to local path by FFmpeg.");
    }
    const optStats = import_fs.default.statSync(optimizedFilePathLocal);
    console.log(`[VideoProcessor] Optimized file size: ${optStats.size} bytes`);
    thumbnailFilePathLocal = import_path.default.join("/tmp", `thumb_${import_crypto.default.randomBytes(8).toString("hex")}.jpg`);
    console.log(`[VideoProcessor] Extracting thumbnail reference frame from optimized video to ${thumbnailFilePathLocal}`);
    try {
      await new Promise((resolve, reject) => {
        (0, import_fluent_ffmpeg.default)(optimizedFilePathLocal).seekInput("0.5").frames(1).output(thumbnailFilePathLocal).on("end", () => resolve()).on("error", (err) => reject(err)).run();
      });
    } catch (e) {
      console.warn(`[VideoProcessor] Seek at 0.5s failed, retrying at 0.1s...`);
      try {
        await new Promise((resolve, reject) => {
          (0, import_fluent_ffmpeg.default)(optimizedFilePathLocal).seekInput("0.1").frames(1).output(thumbnailFilePathLocal).on("end", () => resolve()).on("error", (err) => reject(err)).run();
        });
      } catch (e2) {
        console.error(`[VideoProcessor] All thumbnail extraction retries failed.`);
      }
    }
    let downloadUrl = "";
    const optimizedBuffer = import_fs.default.readFileSync(optimizedFilePathLocal);
    try {
      console.log(`[VideoProcessor] Uploading optimized video to Storage at ${optimizedStoragePath}`);
      const optimizedFileRef = bucket.file(optimizedStoragePath);
      await optimizedFileRef.save(optimizedBuffer, {
        metadata: {
          contentType: "video/mp4",
          cacheControl: "public, max-age=31536000"
        }
      });
      try {
        await optimizedFileRef.makePublic();
      } catch (pubErr) {
        console.log(`[VideoProcessor] Note: makePublic failed, proceeding with direct URL. Error: ${pubErr.message}`);
      }
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(optimizedStoragePath)}?alt=media`;
      console.log(`[VideoProcessor] Optimized video uploaded to Firebase Storage. URL: ${downloadUrl}`);
    } catch (gcsOptErr) {
      console.error(`[VideoProcessor] Firebase Storage cloud write for optimized video failed completely:`, gcsOptErr.message);
      throw new Error(`Optimized video file could not be uploaded to Firebase Storage. Details: ${gcsOptErr.message}`);
    }
    let thumbnailUrl = "";
    const thumbnailStoragePath = optimizedStoragePath.replace("/reel/video-optimized/", "/reel/video-thumbnail/").replace(".mp4", ".jpg");
    if (import_fs.default.existsSync(thumbnailFilePathLocal)) {
      try {
        console.log(`[VideoProcessor] Uploading thumbnail to GCS at ${thumbnailStoragePath}`);
        const thumbBuffer = import_fs.default.readFileSync(thumbnailFilePathLocal);
        const thumbFileRef = bucket.file(thumbnailStoragePath);
        await thumbFileRef.save(thumbBuffer, {
          metadata: {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000"
          }
        });
        try {
          await thumbFileRef.makePublic();
        } catch (pubErr) {
          console.log(`[VideoProcessor] Note: Thumbnail makePublic failed. Error: ${pubErr.message}`);
        }
        thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(thumbnailStoragePath)}?alt=media`;
        console.log(`[VideoProcessor] Thumbnail uploaded to Firebase Storage. URL: ${thumbnailUrl}`);
      } catch (gcsThumbErr) {
        console.error(`[VideoProcessor] Upload of thumbnail file to storage failed:`, gcsThumbErr.message);
      }
    }
    const finishTime = (/* @__PURE__ */ new Date()).toISOString();
    const updateObj = {
      "videoBackgroundConfig.videoProcessingJob.status": "ready",
      "videoBackgroundConfig.videoProcessingJob.updatedAt": finishTime,
      "videoBackgroundConfig.videoProcessingJob.error": import_firestore.FieldValue.delete(),
      "videoBackgroundConfig.videoProcessingJob.errorMessage": import_firestore.FieldValue.delete(),
      "videoBackgroundConfig.upload.optimizedVideoUrl": downloadUrl,
      "videoBackgroundConfig.upload.optimizedStoragePath": optimizedStoragePath,
      "videoBackgroundConfig.upload.processingStatus": "ready",
      "videoBackgroundConfig.upload.processingError": import_firestore.FieldValue.delete()
    };
    if (thumbnailUrl) {
      updateObj["videoBackgroundConfig.thumbnailUrl"] = thumbnailUrl;
      updateObj["videoBackgroundConfig.upload.thumbnailUrl"] = thumbnailUrl;
      updateObj["videoBackgroundConfig.upload.thumbnailStoragePath"] = thumbnailStoragePath;
    }
    await cardRef.update(updateObj);
    console.log(`[VideoProcessor] Firestore document successfully updated for card ${cardId}.`);
    if (job.originalDeleteAfterProcessing && job.originalStoragePath) {
      try {
        console.log(`[VideoProcessor] Deleting original video file from bucket: ${job.originalStoragePath}`);
        await bucket.file(job.originalStoragePath).delete();
        console.log(`[VideoProcessor] Original video successfully deleted from bucket.`);
      } catch (delErr) {
        console.error(`[VideoProcessor] Error trying to delete original video:`, delErr.message);
      }
    }
  } catch (err) {
    console.error(`[VideoProcessor] CRITICAL FAILURE for card ${cardId}:`, err);
    try {
      const failTime = (/* @__PURE__ */ new Date()).toISOString();
      await cardRef.update({
        "videoBackgroundConfig.videoProcessingJob.status": "failed",
        "videoBackgroundConfig.videoProcessingJob.error": err.message || "Unknown processing error",
        "videoBackgroundConfig.videoProcessingJob.errorMessage": err.message || "Unknown processing error",
        "videoBackgroundConfig.videoProcessingJob.updatedAt": failTime,
        "videoBackgroundConfig.upload.processingStatus": "failed",
        "videoBackgroundConfig.upload.processingError": err.message || "Unknown processing error"
      });
    } catch (fsErr) {
      console.error(`[VideoProcessor] Failed to update failed job status in Firestore for card ${cardId}:`, fsErr);
    }
  } finally {
    if (originalFilePathLocal && import_fs.default.existsSync(originalFilePathLocal)) {
      try {
        import_fs.default.unlinkSync(originalFilePathLocal);
      } catch {
      }
    }
    if (optimizedFilePathLocal && import_fs.default.existsSync(optimizedFilePathLocal)) {
      try {
        import_fs.default.unlinkSync(optimizedFilePathLocal);
      } catch {
      }
    }
    if (thumbnailFilePathLocal && import_fs.default.existsSync(thumbnailFilePathLocal)) {
      try {
        import_fs.default.unlinkSync(thumbnailFilePathLocal);
      } catch {
      }
    }
  }
}
app.post("/api/process-video-job", async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: "Missing cardId" });
  }
  try {
    const cardRef = adminDb.collection("cards").doc(cardId);
    const result = await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(cardRef);
      if (!docSnap.exists) {
        throw new Error("Card not found");
      }
      const card = docSnap.data();
      const vBgConfig = card?.videoBackgroundConfig;
      const job = vBgConfig?.videoProcessingJob;
      if (!job) {
        throw new Error("No video processing job initialized for this card");
      }
      if (job.status === "processing") {
        return { started: false, reason: "Job already in progress", status: "processing" };
      }
      if (job.status === "ready") {
        return { started: false, reason: "Job already completed", status: "ready" };
      }
      if (job.status !== "queued" && job.status !== "processing_pending" && job.status !== "failed") {
        return { started: false, reason: `Invalid status to start processing: ${job.status}`, status: job.status };
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      transaction.update(cardRef, {
        "videoBackgroundConfig.videoProcessingJob.status": "processing",
        "videoBackgroundConfig.videoProcessingJob.updatedAt": now,
        "videoBackgroundConfig.upload.processingStatus": "processing_pending"
      });
      return { started: true, status: "processing" };
    });
    if (!result.started) {
      return res.status(409).json({ ok: false, error: result.reason, status: result.status });
    }
    processVideoBackground(cardId).catch((asyncErr) => {
      console.error(`[processVideoBackground async context handler error]:`, asyncErr);
    });
    return res.json({ ok: true, status: "processing" });
  } catch (err) {
    console.error("Error starting video processing job:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
app.post("/api/upload-file-fallback", async (req, res) => {
  const { idToken, userId, cardId, type, fileName, contentType, base64Data } = req.body;
  if (!idToken || !userId || !cardId || !type || !fileName || !base64Data) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  if (type === "reel-video" || contentType && contentType.toLowerCase().startsWith("video/")) {
    return res.status(400).json({ error: "Video upload fallback is structurally disabled. Videos must be uploaded directly to Firebase Storage." });
  }
  try {
    const decodedToken = await (0, import_auth.getAuth)(adminApp).verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      return res.status(403).json({ error: "Permission denied: User mismatch" });
    }
    let storagePath = `users/${userId}/cards/${cardId}/${type}/${fileName}`;
    if (type === "cover") {
      storagePath = `users/${userId}/cards/${cardId}/cover/cover.webp`;
    } else if (type === "profile") {
      storagePath = `users/${userId}/cards/${cardId}/profile/profile.webp`;
    } else if (type === "product") {
      storagePath = `users/${userId}/cards/${cardId}/product/product.webp`;
    } else if (type === "reel-video") {
      storagePath = `users/${userId}/cards/${cardId}/reel/video-original/${fileName}`;
    } else if (type === "background") {
      storagePath = `users/${userId}/cards/${cardId}/backgrounds/${fileName}`;
    } else if (type === "button-images") {
      storagePath = `users/${userId}/cards/${cardId}/buttons/${fileName}`;
    } else if (type === "after-sequence") {
      storagePath = `users/${userId}/cards/${cardId}/after-sequence/${fileName}`;
    } else if (type === "slideshow") {
      storagePath = `users/${userId}/cards/${cardId}/slideshow/${fileName}`;
    } else if (type === "branding") {
      storagePath = `users/${userId}/cards/${cardId}/branding/${fileName}`;
    } else if (type === "seo") {
      storagePath = `users/${userId}/cards/${cardId}/seo/${fileName}`;
    }
    const buffer = Buffer.from(base64Data, "base64");
    const bucket = (0, import_storage.getStorage)(adminApp).bucket();
    const fileRef = bucket.file(storagePath);
    console.log(`[Backup Uploader] Saving file to Storage: ${storagePath} (${buffer.length} bytes, content-type: ${contentType})`);
    let downloadUrl = "";
    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: contentType || "application/octet-stream",
          cacheControl: "public, max-age=31536000"
        }
      });
      try {
        await fileRef.makePublic();
      } catch (pubErr) {
        console.log(`[Backup Uploader] Note: makePublic skipped or failed:`, pubErr.message);
      }
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      console.log(`[Backup Uploader] Successfully uploaded to Firebase Storage. URL: ${downloadUrl}`);
    } catch (gcsSaveErr) {
      console.warn(`[Backup Uploader] Firebase Storage write failed: ${gcsSaveErr.message}. Failing over to local filesystem...`);
      const safeFilename = storagePath.replace(/\//g, "_");
      const localDiskPath = import_path.default.join(import_path.default.join(process.cwd(), "uploads"), safeFilename);
      import_fs.default.writeFileSync(localDiskPath, buffer);
      downloadUrl = `/uploads/${encodeURIComponent(safeFilename)}`;
      console.log(`[Backup Uploader] Successfully saved local file as fallback: ${localDiskPath}. Public serving path: ${downloadUrl}`);
    }
    return res.json({
      success: true,
      downloadUrl,
      storagePath
    });
  } catch (err) {
    console.error("[Backup Uploader] Failed:", err);
    return res.status(500).json({ error: "Fallback upload failed: " + err.message });
  }
});
var viteServer = null;
async function startServer() {
  const UPLOADS_DIR = import_path.default.join(process.cwd(), "uploads");
  if (!import_fs.default.existsSync(UPLOADS_DIR)) {
    import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use("/uploads", import_express.default.static(UPLOADS_DIR));
  if (process.env.NODE_ENV !== "production") {
    viteServer = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and listening on http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
