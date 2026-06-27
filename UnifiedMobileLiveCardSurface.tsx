import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { compressImageBeforeUpload } from '../utils/image';

// Canvas drawing helper for rounded rectangles/bezel borders
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Canvas drawing helper to safely wrap and draw text block with ellipsis capping capability
const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number => {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  
  const linesToDraw = lines.slice(0, maxLines);
  for (let i = 0; i < linesToDraw.length; i++) {
    let textToDraw = linesToDraw[i];
    if (i === maxLines - 1 && lines.length > maxLines) {
      textToDraw += '...';
    }
    ctx.fillText(textToDraw, x, y + (i * lineHeight));
  }
  return linesToDraw.length * lineHeight;
};

interface SeoSharingModuleProps {
  activeCard: Card;
  lang: 'de' | 'en';
  syncCardUpdate: (updates: Partial<Card>) => Promise<void>;
  isLocked: boolean; // Managed by DashboardView plan feature checks
  onTriggerUpgrade: () => void;
}

export function SeoSharingModule({
  activeCard,
  lang = 'de',
  syncCardUpdate,
  isLocked,
  onTriggerUpgrade,
}: SeoSharingModuleProps) {
  const { uploadFile } = useFirebase();

  // Local input states
  const [metaTitle, setMetaTitle] = useState(activeCard.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(activeCard.metaDescription || '');
  const [keywordsRaw, setKeywordsRaw] = useState(
    activeCard.keywords && Array.isArray(activeCard.keywords) ? activeCard.keywords.join(', ') : ''
  );
  const [ogTitle, setOgTitle] = useState(activeCard.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(activeCard.ogDescription || '');
  const [ogImageUrl, setOgImageUrl] = useState(activeCard.ogImageUrl || '');
  const [isOgUploading, setIsOgUploading] = useState(false);
  const [shareText, setShareText] = useState(activeCard.shareText || '');
  const [hashtagsRaw, setHashtagsRaw] = useState(
    activeCard.hashtags && Array.isArray(activeCard.hashtags) ? activeCard.hashtags.join(', ') : ''
  );

  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle auto-generation of high-fidelity social share preview image (1200x630 pixel JPG)
  const handleGenerateSocialPreview = async () => {
    if (isLocked) {
      onTriggerUpgrade();
      return;
    }

    try {
      setIsGenerating(true);
      
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not retrieve 2D rendering context');

      // 1. Gather URLs
      const bgImgUrl = activeCard.videoBackgroundConfig?.afterSequence?.imageUrl || 
                       activeCard.videoBackgroundConfig?.afterVideo?.imageUrl || 
                       activeCard.backgroundImageUrl || 
                       activeCard.coverImageUrl || 
                       activeCard.heroImageUrl;

      const profileImgUrl = activeCard.profileImageUrl || activeCard.customLogoUrl;

      // Safe image loading
      const loadImgSafe = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          if (!url) { resolve(null); return; }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.log('Failed to load asset or CORS issue with:', url);
            resolve(null);
          };
          img.src = url;
        });
      };

      const [loadedBg, loadedProfile] = await Promise.all([
        loadImgSafe(bgImgUrl),
        loadImgSafe(profileImgUrl),
      ]);

      // 2. Draw global background
      if (loadedBg) {
        // Draw image covering 1200x630
        const scale = Math.max(1200 / loadedBg.width, 630 / loadedBg.height);
        const w = loadedBg.width * scale;
        const h = loadedBg.height * scale;
        const x = (1200 - w) / 2;
        const y = (630 - h) / 2;
        ctx.drawImage(loadedBg, x, y, w, h);
        
        ctx.fillStyle = 'rgba(11, 11, 12, 0.88)';
        ctx.fillRect(0, 0, 1200, 630);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 1200, 630);
        grad.addColorStop(0, '#1E1E22');
        grad.addColorStop(1, '#0B0B0C');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 630);
      }

      // Golden vertical bar decoration on left side
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(50, 80, 5, 470);

      // 3. Left Textual Content Zone (Starting X = 90)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 46px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const cTitle = derivedGoogleTitle;
      const titleHeight = drawWrappedText(ctx, cTitle, 90, 100, 540, 54, 2);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '400 20px Inter, system-ui, sans-serif';
      const cDesc = derivedGoogleDesc;
      const descY = 100 + titleHeight + 25;
      const descHeight = drawWrappedText(ctx, cDesc, 90, descY, 540, 28, 3);

      const isVideoReel = !!(activeCard.videoBackgroundConfig?.upload?.optimizedVideoUrl || activeCard.heroVideoUrl);
      ctx.fillStyle = '#A855F7';
      ctx.font = '900 12px Inter, system-ui, sans-serif';
      const badgeY = Math.max(descY + descHeight + 40, 480);
      ctx.fillText(isVideoReel ? 'U-REEL INTERAKTIVE VIDEO-KARTE' : 'KONU DIGITALE VCARD-VISITENKARTE', 90, badgeY);

      ctx.fillStyle = '#6B7280';
      ctx.font = '500 15px Inter, system-ui, sans-serif';
      ctx.fillText(`konu.live/u/${activeCard.slug || 'slug'}`, 90, badgeY + 25);

      // 4. Right Zone: Phone Mockup Frame
      const phoneW = 340;
      const phoneH = 490;
      const phoneX = 810;
      const phoneY = 70;
      const phoneRadius = 32;

      // Outer bezel blur shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;

      drawRoundedRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius);
      ctx.fillStyle = '#1A1A1E';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Inside Screen Clip (with rounded corners inset)
      ctx.save();
      const bezelInset = 6;
      const screenX = phoneX + bezelInset;
      const screenY = phoneY + bezelInset;
      const screenW = phoneW - (bezelInset * 2);
      const screenH = phoneH - (bezelInset * 2);
      const screenRadius = phoneRadius - bezelInset;
      
      drawRoundedRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
      ctx.clip();

      if (loadedBg) {
        const scale = Math.max(screenW / loadedBg.width, screenH / loadedBg.height);
        const w = loadedBg.width * scale;
        const h = loadedBg.height * scale;
        const x = screenX + (screenW - w) / 2;
        const y = screenY + (screenH - h) / 2;
        ctx.drawImage(loadedBg, x, y, w, h);
        
        ctx.fillStyle = 'rgba(10, 10, 12, 0.45)';
        ctx.fillRect(screenX, screenY, screenW, screenH);
      } else {
        const screenGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
        screenGrad.addColorStop(0, '#222227');
        screenGrad.addColorStop(1, '#0F0F10');
        ctx.fillStyle = screenGrad;
        ctx.fillRect(screenX, screenY, screenW, screenH);
      }

      // Crop Avatar Circle
      const avatarR = 38;
      const avatarX = screenX + (screenW / 2);
      const avatarY = screenY + 70;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (loadedProfile) {
        const scale = Math.max((avatarR * 2) / loadedProfile.width, (avatarR * 2) / loadedProfile.height);
        const w = loadedProfile.width * scale;
        const h = loadedProfile.height * scale;
        const x = avatarX - w / 2;
        const y = avatarY - h / 2;
        ctx.drawImage(loadedProfile, x, y, w, h);
      } else {
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        ctx.fillStyle = '#0B0B0C';
        ctx.font = '700 28px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = ((activeCard.title || '').substring(0, 2) || 'K').toUpperCase();
        ctx.fillText(initials, avatarX, avatarY);
      }
      ctx.restore();

      // Avatar Outer Ring Line
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarR + 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Card Title/Brand
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 17px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const maxScreenTextW = screenW - 40;
      const sTitleY = avatarY + avatarR + 15;
      const sTitleHeight = drawWrappedText(ctx, activeCard.title || 'KONU', avatarX, sTitleY, maxScreenTextW, 20, 1);

      // Card Tagline / Description
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '400 10.5px Inter, system-ui, sans-serif';
      const inlineTagline = activeCard.description || activeCard.subtitle || (lang === 'de' ? 'Klicke für Kontakte.' : 'Click to see profile.');
      drawWrappedText(ctx, inlineTagline, avatarX, sTitleY + sTitleHeight + 4, maxScreenTextW, 14, 2);

      // Pill Buttons
      const numButtonsToDraw = activeCard.buttons && activeCard.buttons.length > 0 
        ? Math.min(activeCard.buttons.length, 2) 
        : 1;

      const btnW = screenW - 60;
      const btnX = screenX + (screenW - btnW) / 2;
      const firstBtnY = screenY + 235;

      for (let i = 0; i < numButtonsToDraw; i++) {
        const curBtnY = firstBtnY + (i * 54);
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;

        drawRoundedRect(ctx, btnX, curBtnY, btnW, 38, 19);
        ctx.fillStyle = 'rgba(201, 166, 70, 0.9)';
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0B0B0C';
        ctx.font = '700 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let label = lang === 'de' ? 'Kontaktdaten speichern' : 'Add to Contacts';
        if (activeCard.buttons && activeCard.buttons[i]) {
          label = activeCard.buttons[i].title;
        } else if (i === 1) {
          label = lang === 'de' ? 'Interaktive Karte' : 'Interactive Card';
        }

        ctx.fillText(label, btnX + btnW / 2, curBtnY + 19);
        ctx.restore();
      }

      // Video play overlay
      if (isVideoReel) {
        const playRadius = 24;
        const playX = screenX + (screenW / 2);
        const playY = firstBtnY + (numButtonsToDraw * 54) + 24;

        if (playY + playRadius < screenY + screenH - 10) {
          ctx.beginPath();
          ctx.arc(playX, playY, playRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fillStyle = 'rgba(18, 18, 20, 0.75)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          const triSide = 12;
          ctx.moveTo(playX - triSide/3 + 2, playY - triSide/2);
          ctx.lineTo(playX + triSide * 2/3 + 2, playY);
          ctx.lineTo(playX - triSide/3 + 2, playY + triSide/2);
          ctx.closePath();
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(lang === 'de' ? 'uReel ansehen' : 'Watch uReel', playX, playY + playRadius + 6);
        }
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '500 8.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('POWERED BY KONU.LIVE', screenX + (screenW / 2), screenY + screenH - 12);
      }

      ctx.restore(); // Restore clip context safely

      // Bezel Gold Outline Frame
      drawRoundedRect(ctx, phoneX, phoneY, phoneW, phoneH, phoneRadius);
      ctx.strokeStyle = 'rgba(201, 166, 70, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Convert and upload
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Blob empty');
        const rawFile = new File([blob], `${activeCard.slug || 'slug'}_preview.jpg`, { type: 'image/jpeg' });
        const downloadUrl = await uploadFile(activeCard.cardId, rawFile, 'seo');

        setOgImageUrl(downloadUrl);
        await syncCardUpdate({ ogImageUrl: downloadUrl });
        setIsGenerating(false);
      }, 'image/jpeg', 0.9);

    } catch (err: any) {
      console.error('Error auto-generating preview:', err);
      alert(lang === 'de' 
        ? 'Fehler beim Generieren der Live-Vorschau: ' + err.message
        : 'Error generating automated thumbnail preview: ' + err.message
      );
      setIsGenerating(false);
    }
  };

  // Sync state if card changes on parent
  useEffect(() => {
    setMetaTitle(activeCard.metaTitle || '');
    setMetaDescription(activeCard.metaDescription || '');
    setKeywordsRaw(
      activeCard.keywords && Array.isArray(activeCard.keywords) ? activeCard.keywords.join(', ') : ''
    );
    setOgTitle(activeCard.ogTitle || '');
    setOgDescription(activeCard.ogDescription || '');
    setOgImageUrl(activeCard.ogImageUrl || '');
    setShareText(activeCard.shareText || '');
    setHashtagsRaw(
      activeCard.hashtags && Array.isArray(activeCard.hashtags) ? activeCard.hashtags.join(', ') : ''
    );
  }, [activeCard]);

  // Handle Save
  const handleSave = async () => {
    if (isLocked) {
      onTriggerUpgrade();
      return;
    }

    try {
      setSaving(true);

      // 1. Process limits and trim strings
      const updates: Partial<Card> = {
        metaTitle: metaTitle.trim().slice(0, 70),
        metaDescription: metaDescription.trim().slice(0, 170),
        ogTitle: ogTitle.trim().slice(0, 70),
        ogDescription: ogDescription.trim().slice(0, 170),
        ogImageUrl: ogImageUrl,
        shareText: shareText.trim().slice(0, 220),
        updatedAt: new Date().toISOString(),
      };

      // 2. Process Keywords: split, trim, compact, unique, cap at 30
      const parsedKeywords = keywordsRaw
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
      const uniqueKeywords: string[] = Array.from(new Set<string>(parsedKeywords)).slice(0, 30);
      updates.keywords = uniqueKeywords;

      // 3. Process Hashtags: split, trim, strip #, compact, unique, cap at 15
      const parsedHashtags = hashtagsRaw
        .split(',')
        .map((h) => h.trim().replace(/^#+/, ''))
        .filter((h) => h.length > 0);
      const uniqueHashtags: string[] = Array.from(new Set<string>(parsedHashtags)).slice(0, 15);
      updates.hashtags = uniqueHashtags;

      // Call parent update
      await syncCardUpdate(updates);
    } catch (err) {
      console.error('Error saving SEO updates:', err);
    } finally {
      setSaving(false);
    }
  };

  // Helper values for dynamically evaluating text status warnings
  const getTitleStatus = () => {
    const len = metaTitle.length;
    if (len === 0) return { label: lang === 'de' ? 'fehlt' : 'missing', color: 'text-amber-500 bg-amber-500/10' };
    if (len >= 45 && len <= 65) return { label: lang === 'de' ? 'gut' : 'good', color: 'text-emerald-400 bg-emerald-500/10' };
    if (len > 70) return { label: lang === 'de' ? 'zu lang' : 'too long', color: 'text-red-400 bg-red-500/10' };
    return { label: lang === 'de' ? 'teilweise' : 'partial', color: 'text-stone-400 bg-stone-500/10' };
  };

  const getDescStatus = () => {
    const len = metaDescription.length;
    if (len === 0) return { label: lang === 'de' ? 'fehlt' : 'missing', color: 'text-amber-500 bg-amber-500/10' };
    if (len >= 120 && len <= 160) return { label: lang === 'de' ? 'gut' : 'good', color: 'text-emerald-400 bg-emerald-500/10' };
    if (len > 170) return { label: lang === 'de' ? 'zu lang' : 'too long', color: 'text-red-400 bg-red-500/10' };
    return { label: lang === 'de' ? 'teilweise' : 'partial', color: 'text-stone-400 bg-stone-500/10' };
  };

  const getKeywordsStatus = () => {
    const parsed = keywordsRaw.split(',').map(k => k.trim()).filter(Boolean);
    const count = parsed.length;
    if (count === 0) return { label: lang === 'de' ? 'fehlt' : 'missing', color: 'text-amber-500 bg-amber-500/10' };
    if (count >= 3 && count <= 12) return { label: lang === 'de' ? 'gut' : 'good', color: 'text-emerald-400 bg-emerald-500/10' };
    if (count > 30) return { label: lang === 'de' ? 'zu viele' : 'too many', color: 'text-red-400 bg-red-500/10' };
    return { label: `${count} ${lang === 'de' ? 'Tag(s)' : 'tag(s)'}`, color: 'text-stone-400 bg-stone-500/10' };
  };

  // Preview derivations (using fallback elements elegantly)
  const previewSlugUrl = activeCard.slug 
    ? `${window.location.origin}/u/${activeCard.slug}` 
    : `${window.location.origin}/u/ihr-name`;

  const derivedGoogleTitle = metaTitle.trim() || activeCard.title || 'KONU Karte';
  const derivedGoogleDesc = metaDescription.trim() || activeCard.description || activeCard.subtitle || (lang === 'de' ? 'Dies ist meine digitale VCard-Visitenkarte von KONU.' : 'This is my corporate digital business card on KONU.');

  const derivedShareTitle = ogTitle.trim() || metaTitle.trim() || activeCard.title || 'KONU - Digitale Visitenkarte';
  const derivedShareDesc = ogDescription.trim() || metaDescription.trim() || activeCard.description || activeCard.subtitle || (lang === 'de' ? 'Vernetzte Kontakte in Sekunden.' : 'Connecting professionals in seconds.');

  // Sharing preview image logic
  const previewImage = ogImageUrl || activeCard.ogImageUrl || activeCard.heroImageUrl || activeCard.coverImageUrl || activeCard.profileImageUrl || '';

  return (
    <div className="pt-4 border-t border-stone-850">
      <div className="flex items-center justify-between pb-2 mb-3">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <LucideIcons.Globe size={14} className="text-[#A855F7]" />
          <span>{lang === 'de' ? 'SEO & Teilen' : 'SEO & Sharing'}</span>
          {isLocked && <span className="text-amber-500 font-bold text-[10px] uppercase">🔒 (ab PRO)</span>}
        </h4>
        <p className="text-[10px] text-stone-500 font-normal">
          {lang === 'de' ? 'Optimierung für Google & Social Media' : 'Google & Social Share Optimizations'}
        </p>
      </div>

      {isLocked ? (
        // GATED VIEW
        <div className="relative overflow-hidden rounded-2xl border border-stone-900 bg-stone-950/40 p-5 min-h-[160px] flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
            <LucideIcons.Lock size={20} className="text-amber-500 mb-2" />
            <span className="text-xs font-black text-stone-200">
              {lang === 'de' ? 'SEO & Link-Vorschau anpassen' : 'Unlock SEO & Sharing Customizations'}
            </span>
            <p className="text-[10px] text-stone-450 mt-1 mb-4 max-w-[280px] leading-relaxed">
              {lang === 'de' 
                ? 'Mit KONU Pro kannst du deine eigene Meta-Beschreibung, Custom-Keywords und Teilen-Texte für ein optimales Google-Ranking festlegen.'
                : 'With KONU Pro, set custom web page titles, target search keywords, and bespoke message text templates when sending in messaging apps.'}
            </p>
            <button
              type="button"
              onClick={onTriggerUpgrade}
              className="cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-[10px] uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl transition inline-flex items-center gap-1 shadow-md border-0"
            >
              <span>{lang === 'de' ? 'Jetzt freischalten' : 'Upgrade now'}</span>
              <LucideIcons.ArrowRight size={10} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Background Blurred Placeholder elements for Gated View */}
          <div className="w-full space-y-2 opacity-15 select-none pointer-events-none">
            <div className="h-6 bg-stone-800 rounded w-1/3"></div>
            <div className="h-9 bg-stone-900 rounded"></div>
            <div className="h-9 bg-stone-900 rounded"></div>
          </div>
        </div>
      ) : (
        // ACTIVE UNLOCKED EDITOR
        <div className="space-y-4">
          <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-850/60 space-y-4 font-sans text-stone-300">
            
            {/* Field 1: metaTitle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '1. Browser-/Suchmaschinentitel' : '1. Page Meta Title'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded ${getTitleStatus().color}`}>
                    {getTitleStatus().label}
                  </span>
                  <span className="text-[9.5px] text-stone-500 font-mono">
                    {metaTitle.length}/70
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))}
                placeholder={activeCard.title || 'KONU digitale Visitenkarte'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
              />
              <p className="text-[9.5px] text-stone-500 mt-1">
                {lang === 'de' 
                  ? 'Titel für Google und Browser. Ideal: 45–65 Zeichen.' 
                  : 'Title for Google and tabs. Ideal: 45–65 characters.'}
              </p>
            </div>

            {/* Field 2: metaDescription */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '2. SEO-Beschreibung (Google)' : '2. SEO Meta Description'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded ${getDescStatus().color}`}>
                    {getDescStatus().label}
                  </span>
                  <span className="text-[9.5px] text-stone-500 font-mono">
                    {metaDescription.length}/170
                  </span>
                </div>
              </div>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value.slice(0, 170))}
                rows={2}
                placeholder={activeCard.description || (lang === 'de' ? 'Entdecke meine digitale Visitenkarte.' : 'Check out my professional contact page.')}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7] resize-none"
              />
              <p className="text-[9.5px] text-stone-500 mt-1">
                {lang === 'de'
                  ? 'Beschreibung für Google und Link-Vorschauen. Ideal: 120–160 Zeichen.'
                  : 'Description snippet for link previews. Ideal: 120–160 characters.'}
              </p>
            </div>

            {/* Field 3: keywords */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '3. Suchbegriffe / Keywords' : '3. Search Keywords'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded ${getKeywordsStatus().color}`}>
                    {getKeywordsStatus().label}
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={keywordsRaw}
                onChange={(e) => setKeywordsRaw(e.target.value)}
                placeholder="Heizungstechnik, Sanitär, Berlin-Mitte, Notdienst"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
              />
              <p className="text-[9.5px] text-stone-500 mt-1">
                {lang === 'de' ? 'Begriffe mit Komma trennen (maximal 30).' : 'Separate tags with commas (maximum 30).'}
              </p>
            </div>

            {/* Field 4: ogTitle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '4. Teilen-Titel (OpenGraph)' : '4. Share Preview Title'}
                </label>
                <span className="text-[9.5px] text-stone-500 font-mono">
                  {ogTitle.length}/70
                </span>
              </div>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value.slice(0, 70))}
                placeholder={derivedGoogleTitle}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
              />
              <p className="text-[9.5px] text-stone-500 mt-1">
                {lang === 'de'
                  ? 'Titel für WhatsApp, LinkedIn und Facebook.'
                  : 'Title template shown in WhatsApp, LinkedIn, and Facebook threads.'}
              </p>
            </div>

            {/* Field 5: ogDescription */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '5. Teilen-Beschreibung' : '5. Share Preview Description'}
                </label>
                <span className="text-[9.5px] text-stone-500 font-mono">
                  {ogDescription.length}/170
                </span>
              </div>
              <textarea
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value.slice(0, 170))}
                rows={2}
                placeholder={derivedGoogleDesc}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7] resize-none"
              />
            </div>

            {/* Field 6: shareText */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '6. Teilen-Standardtext' : '6. Share Text Body Template'}
                </label>
                <span className="text-[9.5px] text-stone-500 font-mono">
                  {shareText.length}/220
                </span>
              </div>
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value.slice(0, 220))}
                rows={2}
                placeholder={lang === 'de' ? 'Hallo, anbei meine digitale Visitenkarte.' : 'Hello, here is my digital business card.'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7] resize-none"
              />
            </div>

            {/* Field 7: hashtags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-wider">
                  {lang === 'de' ? '7. Hashtags beim Teilen' : '7. Post Hashtags'}
                </label>
                <span className="text-[9.5px] text-stone-500 font-mono">
                  {hashtagsRaw.split(',').map(h => h.trim().replace(/^#+/, '')).filter(Boolean).length}/15
                </span>
              </div>
              <input
                type="text"
                value={hashtagsRaw}
                onChange={(e) => setHashtagsRaw(e.target.value)}
                placeholder="networking, digitalcard, business"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
              />
              <p className="text-[9.5px] text-stone-500 mt-1">
                {lang === 'de' ? 'Begriffe getrennt durch Komma angeben (maximal 15).' : 'Include comma separated list (max 15).'}
              </p>
            </div>

            {/* Field 8: ogImageUrl (OpenGraph / Social Share Bild) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10.5px] font-extrabold text-[#A855F7] uppercase tracking-wider h-4">
                  {lang === 'de' ? '8. Social Share Link-Vorschau' : '8. Social Share Link Preview'}
                </label>
                {(isOgUploading || isGenerating) && (
                  <span className="text-[9.5px] text-[#A855F7] font-black animate-pulse uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <LucideIcons.Loader size={11} className="animate-spin" />
                    <span>{lang === 'de' ? 'Bild wird erstellt...' : 'Generating preview...'}</span>
                  </span>
                )}
              </div>
              
              {/* Informational disclaimers to set proper expectations */}
              <div className="mb-3 bg-stone-900/60 p-3 rounded-xl border border-stone-850 space-y-1.5 text-[10px] leading-relaxed text-stone-400">
                <div className="flex items-start gap-2">
                  <LucideIcons.Info size={13} className="text-[#A855F7] shrink-0 mt-0.5" />
                  <p>
                    {lang === 'de'
                      ? 'Reel / Video-Links: Auf Sozialen Medien wie LinkedIn wird das Video nicht direkt abgespielt. Stattdessen wird dieses Vorschaubild angezeigt. Deine Besucher sehen die interaktive Karte & uReel, sobald sie auf diesen Link klicken.'
                      : 'Reel / Video-Links: When sharing links on LinkedIn, the video will not play inline. Instead, this rich preview card image is displayed. Your interactive card & uReel will play immediately as soon as a visitor taps your shared link.'}
                  </p>
                </div>
                <div className="flex items-start gap-2 border-t border-stone-850/80 pt-1.5">
                  <LucideIcons.Image size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                  <p>
                    {lang === 'de'
                      ? 'Dieses Bild wird als Linkvorschau auf Linkedin, WhatsApp, Facebook, X/Twitter und anderen Plattformen verwendet.'
                      : 'This image appears as the link thumbnail cover card on LinkedIn, WhatsApp, Facebook, X/Twitter, and others.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-stone-900 border border-stone-800 rounded-2xl p-4">
                {/* Visual Thumbnail */}
                <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-950 border border-stone-850 flex items-center justify-center relative group">
                  {ogImageUrl ? (
                    <>
                      <img src={ogImageUrl} alt="SEO Thumbnail" className="w-full h-full object-cover transition duration-300 group-hover:scale-102" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold bg-stone-900/90 py-1.5 px-3 rounded-lg border border-stone-800">
                          {lang === 'de' ? '1200x630px JPG aktiv' : '1200x630px JPG active'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center text-stone-500 space-y-2">
                      <LucideIcons.Sparkles size={28} className="text-[#A855F7]/50 animate-bounce" />
                      <span className="text-[10px] font-bold text-stone-400">
                        {lang === 'de' ? 'Kein Social Share Bild gesetzt' : 'No Social Share image active'}
                      </span>
                      <p className="text-[9px] text-stone-500 max-w-[240px] leading-tight">
                        {lang === 'de'
                          ? 'Erstelle ein wunderschönes, automatisiertes Vorschaubild im KONU-Kartenlayout oder lade ein eigenes hoch.'
                          : 'Generate a high-fidelity image in our beautiful card format automatically or upload your own.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Companion Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Button: Auto Generate High-Fi Social Preview */}
                  <button
                    type="button"
                    disabled={isGenerating || isOgUploading}
                    onClick={handleGenerateSocialPreview}
                    className="cursor-pointer bg-stone-900 hover:bg-[#A855F7]/10 border border-[#A855F7]/20 hover:border-[#A855F7]/50 text-[#A855F7] hover:text-[#e4be54] text-[10px] uppercase tracking-wider font-extrabold py-2 px-3 rounded-lg transition inline-flex items-center justify-center gap-1.5"
                  >
                    {isGenerating ? (
                      <LucideIcons.Loader size={12} className="animate-spin text-[#A855F7]" />
                    ) : (
                      <LucideIcons.Sparkles size={12} />
                    )}
                    <span>{lang === 'de' ? 'Vorschaubild generieren' : 'Generate Preview'}</span>
                  </button>

                  {/* Button: Manual Upload */}
                  <label className="cursor-pointer bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-350 hover:text-white text-[10px] uppercase tracking-wider font-extrabold py-2 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition">
                    <LucideIcons.Upload size={12} />
                    <span>{lang === 'de' ? 'Vorschaubild hochladen' : 'Upload custom'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isOgUploading || isGenerating}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate mime types: only JPG, PNG, WebP allowed
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!validTypes.includes(file.type.toLowerCase())) {
                          alert(lang === 'de' 
                            ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt! Andere Dateiendungen wurden blockiert.' 
                            : 'Only JPG, PNG or WebP images are allowed! Other extensions are blocked for security.'
                          );
                          return;
                        }

                        setIsOgUploading(true);
                        try {
                          const optimizedBlob = await compressImageBeforeUpload(file, 'og');
                          const downloadUrl = await uploadFile(activeCard.cardId, optimizedBlob, 'background');
                          setOgImageUrl(downloadUrl);
                          
                          // Store metadata in card imageMeta safely
                          const meta = (optimizedBlob as any).imageMeta;
                          if (meta) {
                            const currentMeta = activeCard.imageMeta || {};
                            const updatedMeta = { ...currentMeta, og: meta };
                            await syncCardUpdate({ ogImageUrl: downloadUrl, imageMeta: updatedMeta });
                          } else {
                            await syncCardUpdate({ ogImageUrl: downloadUrl });
                          }
                        } catch (err: any) {
                          alert(err.message || String(err));
                        } finally {
                          setIsOgUploading(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {ogImageUrl && (
                  <div className="flex items-center justify-between border-t border-stone-800/80 pt-2 font-mono text-[9px] text-stone-500">
                    <span className="truncate max-w-[180px]">{ogImageUrl}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        setOgImageUrl('');
                        await syncCardUpdate({ ogImageUrl: '' });
                      }}
                      className="text-rose-400 hover:text-rose-350 text-[9.5px] uppercase font-bold transition px-2 py-0.5 cursor-pointer"
                    >
                      {lang === 'de' ? 'Entfernen' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>

              {/* LinkedIn Cache / Inspector Helper (Goal 5) */}
              <div className="mt-3 bg-stone-950/40 p-3 rounded-xl border border-stone-850 space-y-1.5 text-[10px] leading-relaxed text-stone-400">
                <div className="flex items-start gap-1.5 text-[#A855F7] font-bold uppercase tracking-wider text-[9px]">
                  <LucideIcons.RefreshCw size={11} className="mt-0.5" />
                  <span>LinkedIn Cache Inspector & Refresh (Cache)</span>
                </div>
                <p className="text-stone-400 text-[10px] leading-relaxed">
                  {lang === 'de'
                    ? 'LinkedIn speichert Linkvorschauen zwischen. Wenn dein Bild nach einer Änderung nicht sofort aktualisiert wird, öffne den LinkedIn Post Inspector und lade die Vorschau neu.'
                    : 'LinkedIn caches rich previews aggressively. If your preview card image does not update immediately after edits, check it in the LinkedIn Post Inspector to flush the social database cache.'}
                </p>
                <div className="pt-1 flex">
                  <a
                    href="https://www.linkedin.com/post-inspector/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/30 text-[#4396eb] font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded-md transition cursor-pointer"
                  >
                    <span>{lang === 'de' ? 'LinkedIn Vorschau neu laden' : 'Run Post Inspector'}</span>
                    <LucideIcons.ExternalLink size={10} />
                  </a>
                </div>
              </div>

            </div>

            {/* Submit save button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-55 text-stone-950 font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md border-0"
              >
                {saving ? (
                  <LucideIcons.Loader className="animate-spin text-stone-950" size={14} />
                ) : (
                  <LucideIcons.Save size={13} className="stroke-[2.5]" />
                )}
                <span>
                  {saving 
                    ? (lang === 'de' ? 'Wird gespeichert...' : 'Saving...') 
                    : (lang === 'de' ? 'SEO-Daten speichern' : 'Save SEO Data')}
                </span>
              </button>
            </div>

          </div>

          {/* DYNAMIC LIVE VIEWS PREVIEWS SECTION */}
          <div className="space-y-4 pt-3">
            <h5 className="text-[10px] uppercase font-black tracking-widest text-[#A855F7] flex items-center gap-1.5">
              <LucideIcons.Eye size={12} />
              <span>{lang === 'de' ? 'Echtzeit-Sichtbarkeits-Vorschauboxen' : 'Real-time Rich Preview Cards'}</span>
            </h5>

            {/* 1. Google Search Results Preview */}
            <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-900 space-y-2.5">
              <span className="text-[9px] uppercase font-black text-stone-500 tracking-wider flex items-center gap-1">
                <span>Google-Vorschau</span>
                <span className="text-[8px] text-stone-600">● Web Search</span>
              </span>

              <div className="bg-white p-4.5 rounded-xl border border-stone-200/40 text-left font-sans select-none">
                <div className="flex flex-col gap-1">
                  {/* Google breadcrumb */}
                  <div className="flex items-center gap-1 text-[11px] text-[#202124] font-normal truncate">
                    <span className="font-medium">https://konu.app</span>
                    <span className="text-stone-400 font-mono font-black text-[9px]">•</span>
                    <span className="text-[#5f6368] truncate">u/{activeCard.slug || 'ihr-name'}</span>
                  </div>
                  
                  {/* Google title */}
                  <h3 className="text-blue-800 hover:underline text-[17px] font-medium leading-snug tracking-normal line-clamp-2 cursor-pointer font-sans">
                    {derivedGoogleTitle}
                  </h3>

                  {/* Google snippet description */}
                  <p className="text-[#4d5156] text-[12px] leading-relaxed line-clamp-3 mt-1 font-sans">
                    {derivedGoogleDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Messenger / Rich Link Card (eg WhatsApp / LinkedIn / Slack) */}
            <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-900 space-y-2.5">
              <span className="text-[9px] uppercase font-black text-stone-500 tracking-wider flex items-center gap-1">
                <span>Teilen-Vorschau</span>
                <span className="text-[8px] text-stone-600">● Messenger Link card</span>
              </span>

              <div className="bg-[#1e2329] p-3 rounded-xl border border-stone-800 text-left font-sans flex flex-col sm:flex-row gap-3 select-none">
                {/* Visual Thumbnail on left if previewImage exists */}
                <div className="w-full sm:w-20 h-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="SEO Thumbnail" className="w-[100%] h-[100%] object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <LucideIcons.User size={24} className="text-[#A855F7]/40" />
                  )}
                </div>

                {/* Meta text on right */}
                <div className="flex-grow flex flex-col justify-center min-w-0">
                  <span className="text-[#B0B3B8] text-[9.5px] uppercase font-bold tracking-wider truncate mb-1">
                    konu.app
                  </span>
                  <h4 className="text-white text-xs font-semibold truncate leading-tight">
                    {derivedShareTitle}
                  </h4>
                  <p className="text-[#A2A4A7] text-[10.5px] line-clamp-2 leading-relaxed mt-1">
                    {derivedShareDesc}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
