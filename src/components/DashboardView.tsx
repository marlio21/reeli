/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { canUseFeature, isFeatureLocked, getUserPlan } from '../config/plans';
import { UpgradeModal } from './UpgradeModal';
import { TRANSLATIONS } from '../translations';
import { PLANS, CARD_CATEGORIES, LIBRARY_ICONS } from '../data';
import { Card, CardButton, CardType, BackgroundType, VisibilityType, OverlayType, PlanType, getPublicCardUrl, normalizeProfileType } from '../types';
import { compressAndSquareImage, compressImageKeepAspect, compressImageBeforeUpload, formatImageOptimizationToast } from '../utils/image';
import { parseVideoUrl } from '../utils/video';
import { ProfileHeroSection } from './ProfileHeroSection';
import { ShareExportModal } from './ShareExportModal';
import { HelpCenterModal } from './HelpCenterModal';
import { downloadVCardFileFromCard } from '../utils/vcard-wrapper';
import * as LucideIcons from 'lucide-react';
import { KonuLogo } from './KonuLogo';
import { ButtonRenderer } from './ButtonRenderer';
import { KonuCardCore } from './KonuCardCore';
import { UreelStudioShell } from './UreelStudioShell';
import { ButtonDesigner } from './ButtonDesigner';
import { ProfileHeroDesigner } from './ProfileHeroDesigner';
import { CardBackgroundDesigner } from './CardBackgroundDesigner';
import { SeoSharingModule } from './SeoSharingModule';
import { createDefaultButton, sanitizeButtonForFirestore, normalizeButton } from '../utils/buttonUtils';
import { BusinessHub } from './BusinessHub';
import { normalizeSlug } from '../utils/slugUtils';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getTodayDateString } from '../utils/analytics';
import QRCode from 'qrcode';

const COLOR_PRESETS = [
  { name: 'Slate', value: '#121212' },
  { name: 'Charcoal', value: '#1C1917' },
  { name: 'Burgundy', value: '#1C0D0D' },
  { name: 'Navy', value: '#0F172A' },
  { name: 'Forest', value: '#022C22' },
  { name: 'Schokobraun', value: '#1C160E' },
];

const GRADIENT_PRESETS = [
  { name: 'Nachtgold', value: 'linear-gradient(135deg, #121212 0%, #2C2515 50%, #121212 100%)' },
  { name: 'Luxury Amber', value: 'linear-gradient(135deg, #1C1917 0%, #45391F 100%)' },
  { name: 'Cosmic Slate', value: 'linear-gradient(135deg, #0C0A09 0%, #2D2D30 100%)' },
  { name: 'Midnight Violet', value: 'linear-gradient(135deg, #090514 0%, #22143B 100%)' },
  { name: 'Deep Emerald', value: 'linear-gradient(135deg, #041410 0%, #0F3224 100%)' },
  { name: 'Warm Copper', value: 'linear-gradient(135deg, #1C0F0B 0%, #452115 100%)' },
];

interface DashboardViewProps {
  lang: 'de' | 'en';
  setLang: (l: 'de' | 'en') => void;
  onGoToAdmin: () => void;
  onGoToRoute: (r: string) => void;
}

const copyTextToClipboard = (text: string): boolean => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn("navigator.clipboard failed, attempting fallback:", e);
    }
  }
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Copy fallback error:", err);
    return false;
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  setLang,
  onGoToAdmin,
  onGoToRoute
}) => {
  const {
    user,
    profile,
    cards,
    updateUserProfile,
    createCard,
    updateCard,
    deleteCard,
    saveCurrentCard,
    createNewCard,
    publishCard,
    updatePublishedCard,
    getCardBySlug,
    uploadFile,
    logout,
    fetchUserCards,
    simulatedPlan,
    setSimulatedPlan,
    simulatedOverrides,
    setSimulatedOverrides,
    effectivePlanId,
    loading,
    cardsLoaded
  } = useFirebase();

  const t = TRANSLATIONS[lang];

  // Active Card for editing (defaults to first card)
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Reel Export Customizer States (Teil B, C, D, E, F)
  const [previewMode, setPreviewMode] = useState<'card' | 'reel'>('card');
  const [reelConfig, setReelConfig] = useState<any | null>(null);
  const [socialOverlay, setSocialOverlay] = useState<'none' | 'instagram' | 'tiktok' | 'youtube'>('none');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStepName, setExportStepName] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);

  // Sync separate Reel Config from active Card (Teil E)
  useEffect(() => {
    setExportedVideoUrl(null);
    setExportedVideoBlob(null);
    if (activeCard) {
      if (activeCard.reelExportConfig) {
        setReelConfig({
          includeVideo: activeCard.reelExportConfig.includeVideo ?? true,
          includeProfileSection: activeCard.reelExportConfig.includeProfileSection ?? true,
          includeProfileImage: activeCard.reelExportConfig.includeProfileImage ?? true,
          includeLogo: activeCard.reelExportConfig.includeLogo ?? true,
          includeTitle: activeCard.reelExportConfig.includeTitle ?? true,
          includeDescription: activeCard.reelExportConfig.includeDescription ?? true,
          includeButtons: activeCard.reelExportConfig.includeButtons ?? true,
          hiddenButtonIds: activeCard.reelExportConfig.hiddenButtonIds ?? [],
          includeContactButton: activeCard.reelExportConfig.includeContactButton ?? false,
          includeQrCode: activeCard.reelExportConfig.includeQrCode ?? false,
          includeBranding: activeCard.reelExportConfig.includeBranding ?? true,
          includeCta: activeCard.reelExportConfig.includeCta ?? true,
          ctaText: activeCard.reelExportConfig.ctaText ?? 'Karte über den Link öffnen',
          durationSeconds: activeCard.reelExportConfig.durationSeconds ?? 12,
          format: activeCard.reelExportConfig.format ?? 'vertical',
          resolution: activeCard.reelExportConfig.resolution ?? '720x1280',
          useCardTimeline: activeCard.reelExportConfig.useCardTimeline ?? true
        });
      } else {
        setReelConfig({
          includeVideo: true,
          includeProfileSection: true,
          includeProfileImage: true,
          includeLogo: true,
          includeTitle: true,
          includeDescription: true,
          includeButtons: true,
          hiddenButtonIds: [],
          includeContactButton: false,
          includeQrCode: false,
          includeBranding: true,
          includeCta: true,
          ctaText: 'Karte über den Link öffnen',
          durationSeconds: 12,
          format: 'vertical',
          resolution: '720x1280',
          useCardTimeline: true
        });
      }
    } else {
      setReelConfig(null);
    }
  }, [activeCard?.cardId]);

  useEffect(() => {
    if (activeCard) {
      setSidebarActiveTab('editor');
    }
  }, [activeCard?.cardId]);

  const handleToggleElementInReel = async (elementKey: string, buttonId?: string) => {
    if (!reelConfig || !activeCard) return;
    
    let updatedConfig = { ...reelConfig };
    if (elementKey === 'button' && buttonId) {
      const hidden = updatedConfig.hiddenButtonIds || [];
      if (hidden.includes(buttonId)) {
        updatedConfig.hiddenButtonIds = hidden.filter((id: string) => id !== buttonId);
      } else {
        updatedConfig.hiddenButtonIds = [...hidden, buttonId];
      }
    } else {
      updatedConfig[elementKey] = !updatedConfig[elementKey];
    }
    
    setReelConfig(updatedConfig);
    await syncCardUpdate({ reelExportConfig: updatedConfig });
  };

  const triggerReelVideoExport = async () => {
    if (!activeCard) return;
    
    // 1. Initialise Export States
    setIsExportingVideo(true);
    setExportProgress(1);
    setExportStepName(lang === 'de' ? 'Bereite Assets vor...' : 'Preparing assets...');
    setExportedVideoUrl(null);
    setExportedVideoBlob(null);

    const duration = reelConfig?.durationSeconds || 12;
    const fps = 30;
    const totalFrames = duration * fps;
    const width = 720;
    const height = 1280;

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExportingVideo(false);
      triggerToast(lang === 'de' ? 'Fehler: Canvas-Context konnte nicht erstellt werden.' : 'Error: Could not create canvas render context.', 'error');
      return;
    }

    // Helper functions for Asset preloading
    const loadAssetImage = (url: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!url) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn("Failed to load asset image (likely CORS):", url);
          resolve(null); // Resolve with null to let pipeline proceed gracefully
        };
        img.src = url;
      });
    };

    const loadAssetVideo = (url: string): Promise<HTMLVideoElement | null> => {
      return new Promise((resolve) => {
        if (!url) {
          resolve(null);
          return;
        }
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 0;
        
        video.load();
        
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
          resolve(video);
        };
        
        const onError = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
          console.warn("Error loading background video asset:", url);
          resolve(null);
        };
        
        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onError);
        
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoaded);
          video.removeEventListener('error', onError);
          resolve(null);
        }, 4000);
      });
    };

    const seekVideo = (vid: HTMLVideoElement, time: number): Promise<void> => {
      return new Promise((resolve) => {
        const onSeeked = () => {
          vid.removeEventListener('seeked', onSeeked);
          resolve();
        };
        vid.addEventListener('seeked', onSeeked);
        vid.currentTime = time;
        setTimeout(resolve, 80); // timeout fallback to prevent stalls
      });
    };

    // 2. Preload assets
    const renderStartedAt = new Date().toISOString();
    const brandIconLoaded = await loadAssetImage('/brand/konu-icon-512.png');
    
    const profileUrl = activeCard?.profileImageUrl || activeCard?.heroProfileImageUrl || '';
    const profileImageLoaded = await loadAssetImage(profileUrl);

    const mediaMode = activeCard?.videoBackgroundConfig?.mediaMode || 'upload';
    let videoElement: HTMLVideoElement | null = null;
    const slideshowImagesLoaded: HTMLImageElement[] = [];
    let bgImageLoaded: HTMLImageElement | null = null;

    const usedOptimizedVideoUrl = mediaMode === 'upload' && !!activeCard?.videoBackgroundConfig?.upload?.optimizedVideoUrl;

    if (usedOptimizedVideoUrl) {
      setExportStepName(lang === 'de' ? 'Lade optimierten Video-Hintergrund...' : 'Loading optimized video background...');
      videoElement = await loadAssetVideo(activeCard.videoBackgroundConfig?.upload?.optimizedVideoUrl || '');
    }

    // Fallback to static or slideshow if video couldn't load or media mode is slideshow
    if (!videoElement) {
      if (mediaMode === 'slideshow' && activeCard?.videoBackgroundConfig?.slideshow?.images?.length) {
        setExportStepName(lang === 'de' ? 'Lade Bilder der Diashow...' : 'Loading slideshow images...');
        const imageSources = activeCard.videoBackgroundConfig.slideshow.images;
        for (const item of imageSources) {
          const imageUrl = typeof item === 'string' ? item : (item as any)?.url || '';
          if (imageUrl) {
            const img = await loadAssetImage(imageUrl);
            if (img) slideshowImagesLoaded.push(img);
          }
        }
      }
      
      if (slideshowImagesLoaded.length === 0) {
        setExportStepName(lang === 'de' ? 'Lade Hintergrundbild...' : 'Loading background fallback image...');
        const bgUrl = activeCard?.coverImageUrl || activeCard?.heroImageUrl || '/brand/fallback-bg.jpg';
        bgImageLoaded = await loadAssetImage(bgUrl);
      }
    }

    // QR Code generation
    let qrImageLoaded: HTMLImageElement | null = null;
    if (reelConfig?.includeQrCode !== false) {
      setExportStepName(lang === 'de' ? 'Generiere QR-Code...' : 'Generating card QR-Code...');
      const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
      const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=c9a646&bgcolor=000000&data=" + encodeURIComponent(pubUrl);
      qrImageLoaded = await loadAssetImage(qrUrl);
    }

    setExportStepName(lang === 'de' ? 'Rendere Frame-Buffer...' : 'Rendering frame buffers...');

    // 3. Render frame core draw function
    const renderFrame = async (frameIdx: number) => {
      const t = frameIdx / fps; // current timestamp in seconds
      
      // Clear with dark tone base
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, width, height);

      // --- background layer ---
      if (videoElement) {
        await seekVideo(videoElement, t % videoElement.duration);
        const videoWidth = videoElement.videoWidth || width;
        const videoHeight = videoElement.videoHeight || height;
        const scale = Math.max(width / videoWidth, height / videoHeight);
        const w = videoWidth * scale;
        const h = videoHeight * scale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        ctx.drawImage(videoElement, x, y, w, h);
      } else if (slideshowImagesLoaded.length > 0) {
        const totalSlides = slideshowImagesLoaded.length;
        const durationPerSlide = duration / totalSlides;
        const slideIdx = Math.floor(t / durationPerSlide) % totalSlides;
        const nextSlideIdx = (slideIdx + 1) % totalSlides;
        const timeInSlide = t % durationPerSlide;
        const transitionTime = 0.8; // 0.8s crossfade duration

        const currentImg = slideshowImagesLoaded[slideIdx];
        const nextImg = slideshowImagesLoaded[nextSlideIdx];

        const drawImg = (img: HTMLImageElement, alpha: number) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          const zoom = 1 + 0.06 * (timeInSlide / durationPerSlide);
          const w = width * zoom;
          const h = height * zoom;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
        };

        if (timeInSlide > durationPerSlide - transitionTime && totalSlides > 1) {
          const progress = (timeInSlide - (durationPerSlide - transitionTime)) / transitionTime;
          drawImg(currentImg, 1 - progress);
          drawImg(nextImg, progress);
        } else {
          drawImg(currentImg, 1.0);
        }
      } else if (bgImageLoaded) {
        const zoom = 1 + 0.1 * (t / duration);
        const w = width * zoom;
        const h = height * zoom;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        ctx.drawImage(bgImageLoaded, x, y, w, h);
      } else {
        // Aesthetic fallback gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(0.5, '#0c0a09');
        grad.addColorStop(1, '#1c1917');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Golden sparkles drifting elegantly
        ctx.fillStyle = 'rgba(201, 166, 70, 0.12)';
        for (let i = 0; i < 15; i++) {
          const px = ((i * 123) + t * 25) % width;
          const py = (height - ((i * 197) + t * 45)) % height;
          const pr = 4 + (i % 6);
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vignette to secure contrast
      const vig = ctx.createLinearGradient(0, 0, 0, height);
      vig.addColorStop(0, 'rgba(12, 10, 9, 0.5)');
      vig.addColorStop(0.2, 'rgba(12, 10, 9, 0)');
      vig.addColorStop(0.65, 'rgba(12, 10, 9, 0.15)');
      vig.addColorStop(0.85, 'rgba(12, 10, 9, 0.75)');
      vig.addColorStop(1, 'rgba(12, 10, 9, 0.95)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // Rounded rectangle drawer helper
      const drawRoundRect = (rx: number, ry: number, rw: number, rh: number, rr: number) => {
        ctx.beginPath();
        ctx.moveTo(rx + rr, ry);
        ctx.lineTo(rx + rw - rr, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
        ctx.lineTo(rx + rw, ry + rh - rr);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
        ctx.lineTo(rx + rr, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
        ctx.lineTo(rx, ry + rr);
        ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      // --- profile layer block ---
      let textHeightAdjustment = 0;
      if (reelConfig?.includeProfileSection !== false) {
        if (reelConfig?.includeProfileImage !== false && profileImageLoaded) {
          const cx = width / 2;
          const cy = 200;
          const r = 64;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(profileImageLoaded, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();

          // golden circle boundary
          ctx.strokeStyle = '#A855F7';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Title
        if (reelConfig?.includeTitle !== false) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 10;
          ctx.fillText(activeCard.title || 'ureel Card', width / 2, 305);
        }

        // Subtitle
        if (activeCard.subtitle && reelConfig?.includeTitle !== false) {
          ctx.fillStyle = '#A855F7';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(activeCard.subtitle, width / 2, 335);
        }

        // Description
        if (reelConfig?.includeDescription !== false && activeCard.description) {
          ctx.fillStyle = '#e7e5e4'; // stone-200
          ctx.font = '500 17px sans-serif';
          
          const maxTextWidth = 530;
          const words = activeCard.description.split(' ');
          let line = '';
          let y = 370;
          const lineSpacing = 24;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxTextWidth && n > 0) {
              ctx.fillText(line, width / 2, y);
              line = words[n] + ' ';
              y += lineSpacing;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, width / 2, y);
          textHeightAdjustment = Math.min(y - 370, 75);
        }
      }

      // --- cards buttons block ---
      if (reelConfig?.includeButtons !== false) {
        const visibleButtons = (activeCard.buttons || []).filter(
          (btn: any) => !reelConfig?.hiddenButtonIds?.includes(btn.id)
        ).slice(0, 4);

        let buttonYStart = 460 + textHeightAdjustment;
        visibleButtons.forEach((btn: any) => {
          ctx.fillStyle = 'rgba(15, 12, 10, 0.75)';
          ctx.strokeStyle = 'rgba(201, 166, 70, 0.28)';
          ctx.lineWidth = 1.5;
          drawRoundRect(85, buttonYStart, 550, 75, 16);

          // button label text
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 18px sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          const trimmedButtonText = btn.title && btn.title.length > 40 ? btn.title.substring(0, 38) + '...' : btn.title || '';
          ctx.fillText(trimmedButtonText, 135, buttonYStart + 44);

          // Little forward pointer glyph
          ctx.fillStyle = '#A855F7';
          ctx.beginPath();
          const targetX = 590;
          const targetY = buttonYStart + 37;
          ctx.moveTo(targetX - 5, targetY - 8);
          ctx.lineTo(targetX + 6, targetY);
          ctx.lineTo(targetX - 5, targetY + 8);
          ctx.closePath();
          ctx.fill();

          // Side capsule accent
          ctx.fillStyle = '#A855F7';
          drawRoundRect(95, buttonYStart + 22, 10, 30, 5);

          buttonYStart += 92;
        });
      }

      // --- action widget block (save contact / scan QR-Code) ---
      let widgetY = 885 + Math.min(textHeightAdjustment, 30);
      const isContactActive = reelConfig?.includeContactButton !== false;
      const isQrActive = reelConfig?.includeQrCode !== false;

      if (isContactActive && isQrActive) {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.strokeStyle = 'rgba(201, 166, 70, 0.2)';
        ctx.lineWidth = 1.5;

        // Save Contact card (Left half)
        drawRoundRect(85, widgetY, 265, 80, 16);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#A855F7';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(lang === 'de' ? 'KONTAKT SPEICHERN' : 'SAVE CONTACT', 217, widgetY + 46);

        // QR Code module (Right half)
        drawRoundRect(370, widgetY, 265, 80, 16);
        if (qrImageLoaded) {
          ctx.drawImage(qrImageLoaded, 395, widgetY + 12, 56, 56);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('SCAN', 470, widgetY + 38);
        ctx.fillStyle = '#A855F7';
        ctx.font = '900 13px sans-serif';
        ctx.fillText('QR-CODE', 470, widgetY + 54);
      } else if (isContactActive) {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.strokeStyle = 'rgba(201, 166, 70, 0.25)';
        ctx.lineWidth = 1.5;
        drawRoundRect(85, widgetY, 550, 80, 16);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#A855F7';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(lang === 'de' ? '+ KONTAKT SPEICHERN' : '+ SAVE CONTACT', 360, widgetY + 47);
      } else if (isQrActive) {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.strokeStyle = 'rgba(201, 166, 70, 0.25)';
        ctx.lineWidth = 1.5;
        drawRoundRect(85, widgetY, 550, 80, 16);

        if (qrImageLoaded) {
          ctx.drawImage(qrImageLoaded, 120, widgetY + 10, 60, 60);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(lang === 'de' ? 'QR-CODE SCANNEN FÜR MEINE CARD' : 'SCAN QR-CODE FOR THE CARD', 200, widgetY + 47);
      }

      // --- footer element ( branding KONU ) ---
      if (reelConfig?.includeBranding !== false) {
        if (brandIconLoaded) {
          ctx.drawImage(brandIconLoaded, 275, 1010, 24, 24);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#A855F7';
        ctx.font = '950 14px sans-serif';
        ctx.fillText('ureel', 312, 1027);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#78716c';
        ctx.font = 'semibold 13px sans-serif';
        const sloganString = lang === 'de' ? 'DEINE DIGITALE CARD' : 'YOUR DIGITAL HIGHLIGHT';
        ctx.fillText(sloganString, width / 2, 1056);
      }

      // --- CTA End banner text line ---
      if (reelConfig?.includeCta !== false) {
        const ctagrad = ctx.createLinearGradient(85, 0, 635, 0);
        ctagrad.addColorStop(0, 'rgba(201, 166, 70, 0.15)');
        ctagrad.addColorStop(0.5, 'rgba(201, 166, 70, 0.35)');
        ctagrad.addColorStop(1, 'rgba(201, 166, 70, 0.15)');
        ctx.fillStyle = ctagrad;
        ctx.strokeStyle = 'rgba(201, 166, 70, 0.5)';
        ctx.lineWidth = 2;
        drawRoundRect(85, 1120, 550, 65, 16);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffdf80';
        ctx.font = 'bold 14px sans-serif';
        
        ctx.save();
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * Math.PI * 2);
        const userCtaText = reelConfig?.ctaText || (lang === 'de' ? 'Karte über den Link öffnen' : 'Open card via link');
        ctx.fillText(userCtaText.toUpperCase(), width / 2, 1158);
        ctx.restore();
      }
    };

    // 4. Create Capture Stream and MediaRecorder pipeline
    const mediaStream = canvas.captureStream(fps);
    let chosenMimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      chosenMimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      chosenMimeType = 'video/webm;codecs=h264';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      chosenMimeType = 'video/webm;codecs=vp8';
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: chosenMimeType,
      videoBitsPerSecond: 2800000 // 2.8 Mbps high bit-rate stream
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const generatedBlob = new Blob(recordedChunks, { type: chosenMimeType });
      const completedVideoUrl = URL.createObjectURL(generatedBlob);
      setExportedVideoUrl(completedVideoUrl);
      setExportedVideoBlob(generatedBlob);

      setIsExportingVideo(false);
      setExportProgress(100);
      setExportStepName('');

      // TECHNICAL VALIDATION METRIC COMPLIANT TO DEVELOPER LOG MANDATE
      const renderFinishedAt = new Date().toISOString();
      console.log("=== REEL EXPORT COMPLETE ===");
      console.log("exportFormat:", "webm");
      console.log("mimeType:", chosenMimeType);
      console.log("durationSeconds:", duration);
      console.log("fps:", fps);
      console.log("resolution:", "720x1280");
      console.log("blobSizeBytes:", generatedBlob.size);
      console.log("sourceType:", usedOptimizedVideoUrl ? "video" : (slideshowImagesLoaded.length > 0 ? "slideshow" : "image"));
      console.log("usedOptimizedVideoUrl:", usedOptimizedVideoUrl ? "ja" : "nein");
      console.log("hiddenElements:", {
        profileSection: reelConfig?.includeProfileSection === false,
        profileImage: reelConfig?.includeProfileImage === false,
        title: reelConfig?.includeTitle === false,
        description: reelConfig?.includeDescription === false,
        buttons: reelConfig?.includeButtons === false,
        hiddenButtonIds: reelConfig?.hiddenButtonIds || [],
        branding: reelConfig?.includeBranding === false,
        qrCode: reelConfig?.includeQrCode === false,
        contactButton: reelConfig?.includeContactButton === false,
        cta: reelConfig?.includeCta === false
      });
      console.log("renderStartedAt:", renderStartedAt);
      console.log("renderFinishedAt:", renderFinishedAt);

      triggerToast(lang === 'de' ? 'Reelvideo wurde erfolgreich erstellt!' : 'Reel video generated successfully!', 'success');
    };

    // Begin recording stream
    mediaRecorder.start();

    // 5. Progressive rendering clock loop
    let currentFrameIndex = 0;
    const processFrameLoop = async () => {
      if (currentFrameIndex >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      await renderFrame(currentFrameIndex);

      // Increment progress state
      const percentage = Math.floor((currentFrameIndex / totalFrames) * 100);
      setExportProgress(percentage);

      // Status notifications
      if (currentFrameIndex < totalFrames * 0.2) {
        setExportStepName(lang === 'de' ? 'Analysiere Video-Hintergrund...' : 'Analyzing video backdrop...');
      } else if (currentFrameIndex < totalFrames * 0.5) {
        setExportStepName(lang === 'de' ? 'Bilde Overlays & Avatare...' : 'Building overlays & avatar...');
      } else if (currentFrameIndex < totalFrames * 0.8) {
        setExportStepName(lang === 'de' ? 'Kompiliere Buttons & Branding...' : 'Compiling widgets & branding...');
      } else {
        setExportStepName(lang === 'de' ? 'Rendere Frame Buffer...' : 'Compressing video frames...');
      }

      currentFrameIndex++;
      
      // Yield thread loop to keep client app fast and responsive
      setTimeout(processFrameLoop, 1000 / fps);
    };

    // run frame recursive solver
    processFrameLoop();
  };

  const [dashboardActiveTab, setDashboardActiveTab] = useState<'my-cards' | 'card-status' | 'seo-sharing' | 'business-hub'>('my-cards');
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'editor' | 'my-ureels' | 'users' | 'seo' | 'share' | 'stats' | 'settings'>('my-ureels');
  const [activeTile, setActiveTile] = useState<'scene' | 'texts' | 'buttons' | 'endcard' | 'design'>('scene');
  const [showCreateChoiceModal, setShowCreateChoiceModal] = useState(false);
  const [isCreatingState, setIsCreatingState] = useState(false);
  const hasProcessedStartCreateRef = useRef(false);

  // Mobile scrolling and focus-reset handlers (Ziel 1 & Ziel 2)
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolledRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait until loading finishes, cards load, active card is chosen, and user details exist
    if (loading || !cardsLoaded || !activeCard || !user) return;

    const currentUserId = user.uid;
    // Only scroll if we haven't scrolled for this user during this session/mount
    if (hasInitialScrolledRef.current !== currentUserId) {
      hasInitialScrolledRef.current = currentUserId;

      // target max-width 900px as mobile view, matching project Breakpoint
      const isMobileView = window.innerWidth < 900;
      if (isMobileView) {
        console.log("Mobile login detected, setting scroll to card preview area...");
        
        // Reset scroll position on viewport
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Scroll target card view in smooth/auto block
        setTimeout(() => {
          if (cardPreviewRef.current) {
            cardPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const el = document.getElementById('interactive-device-view');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 150);
      }
    }
  }, [loading, cardsLoaded, activeCard?.cardId, user?.uid]);

  // Slug management states
  const [slugDraft, setSlugDraft] = useState('');
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'empty' | 'invalid' | 'available' | 'checking' | 'taken'>('idle');
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  // Sync draft slug when active card changes (different card id selected)
  useEffect(() => {
    if (activeCard) {
      setSlugDraft(activeCard.slug || '');
      setSlugCheckStatus('idle');
    }
  }, [activeCard?.cardId]);

  // Prompt 6C: Analytics summary states
  const [analyticsSummary, setAnalyticsSummary] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Synchronize analytics summary reactively
  useEffect(() => {
    if (!activeCard?.cardId) {
      setAnalyticsSummary(null);
      return;
    }

    const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'starter';
    const hasAnalytics = canUseFeature(activePlanId, 'simpleAnalytics');

    if (!hasAnalytics) {
      setAnalyticsSummary(null);
      return;
    }

    setIsLoadingAnalytics(true);
    const docRef = doc(db, 'cards', activeCard.cardId, 'analytics', 'summary');

    const unsubscribe = onSnapshot(docRef, (snap) => {
      setIsLoadingAnalytics(false);
      if (snap.exists()) {
        setAnalyticsSummary(snap.data());
      } else {
        setAnalyticsSummary(null);
      }
    }, (error) => {
      setIsLoadingAnalytics(false);
      console.warn("Analytics onSnapshot error:", error);
    });

    return () => unsubscribe();
  }, [activeCard?.cardId, simulatedOverrides.simulatedPlan, effectivePlanId]);

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugDraft(e.target.value);
    setSlugCheckStatus('idle');
  };

  const handleCheckSlugAvailability = async () => {
    if (!activeCard) return;
    const normalized = normalizeSlug(slugDraft);
    if (!normalized) {
      setSlugCheckStatus('empty');
      return;
    }

    setSlugCheckStatus('checking');
    try {
      const existing = await getCardBySlug(normalized);
      if (existing && existing.cardId !== activeCard.cardId) {
        setSlugCheckStatus('taken');
      } else {
        setSlugCheckStatus('available');
      }
    } catch (e) {
      console.error('Error checking slug', e);
      setSlugCheckStatus('invalid');
    }
  };

  const handleSaveSlug = async () => {
    if (!activeCard) return;
    const normalized = normalizeSlug(slugDraft);
    
    if (!normalized) {
      setSlugCheckStatus('empty');
      return;
    }

    setIsSavingSlug(true);
    try {
      const existing = await getCardBySlug(normalized);
      if (existing && existing.cardId !== activeCard.cardId) {
        setSlugCheckStatus('taken');
        setIsSavingSlug(false);
        return;
      }

      setSlugCheckStatus('available');
      await syncCardUpdate({ slug: normalized });
      
      // Update local state and draft with normalized value
      setSlugDraft(normalized);
      
      triggerToast(
        lang === 'de' ? 'Linkname erfolgreich gespeichert' : 'Link name saved successfully',
        'success'
      );
    } catch (err: any) {
      triggerToast(
        (lang === 'de' ? 'Speichern fehlgeschlagen: ' : 'Saving failed: ') + (err.message || String(err)),
        'error'
      );
    } finally {
      setIsSavingSlug(false);
    }
  };

  // Helper functions for Card CRUD
  const handleAddNewCard = async () => {
    if (isCreatingState) return;
    try {
      setIsCreatingState(true);
      const activePlan = PLANS[effectivePlanId] || PLANS['starter'];
      if (cards.length >= activePlan.maxCards) {
        setUpgradeFeatureKey('multipleCards');
        setShowUpgradeModal(true);
        triggerToast(
          lang === 'de' 
            ? `Limit erreicht! Ihr Tarif '${activePlan.name}' erlaubt maximal ${activePlan.maxCards} LiveCard(s). Bitte upgraden.`
            : `Limit reached! Your plan '${activePlan.name}' allows at most ${activePlan.maxCards} LiveCard(s). Please upgrade.`,
          'error'
        );
        return;
      }

      const rawSlug = (profile?.displayName || user?.displayName || 'meine-seite').toLowerCase().replace(/[^a-z0-9]/g, '') || 'page';
      let uniqueSlug = rawSlug;
      let suffix = 1;
      while (true) {
        const sameSlug = await getCardBySlug(uniqueSlug);
        if (!sameSlug) break;
        uniqueSlug = `${rawSlug}-${Math.floor(100 + Math.random() * 900)}-${suffix}`;
        suffix++;
      }

      const newCard = await createNewCard({
        title: `${profile?.displayName || user?.displayName || 'Meine ureel-Seite'} ${cards.length + 1}`,
        slug: uniqueSlug,
      });

      if (newCard) {
        setActiveCard(newCard);
        triggerToast(
          lang === 'de' ? 'Neue Karte erstellt' : 'New card created',
          'success'
        );
      }
    } catch (err: any) {
      triggerToast(
        (lang === 'de' ? 'Erstellen fehlgeschlagen: ' : 'Creation failed: ') + err.message,
        'error'
      );
    } finally {
      setIsCreatingState(false);
    }
  };

  const handleDuplicateCard = async (sourceCard: Card) => {
    if (isCreatingState) return;
    try {
      setIsCreatingState(true);
      const activePlan = PLANS[effectivePlanId] || PLANS['starter'];
      if (cards.length >= activePlan.maxCards) {
        setUpgradeFeatureKey('multipleCards');
        setShowUpgradeModal(true);
        triggerToast(
          lang === 'de' 
            ? `Limit erreicht! Ihr Tarif '${activePlan.name}' erlaubt maximal ${activePlan.maxCards} LiveCard(s).`
            : `Limit reached! Your plan '${activePlan.name}' allows at most ${activePlan.maxCards} LiveCard(s).`,
          'error'
        );
         return;
      }

      const cleanSlugBase = `${sourceCard.slug}-copy`;
      let uniqueSlug = cleanSlugBase;
      let suffix = 2;
      while (true) {
        const sameSlug = await getCardBySlug(uniqueSlug);
        if (!sameSlug) break;
        uniqueSlug = `${cleanSlugBase}-${suffix}`;
        suffix++;
      }

      const duplicatePayload: Partial<Card> = {
        ...sourceCard,
        title: `${sourceCard.title} (${lang === 'de' ? 'Kopie' : 'Copy'})`,
        slug: uniqueSlug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const starter = await createNewCard(duplicatePayload);
      if (starter) {
        setActiveCard(starter);
        triggerToast(
          lang === 'de' ? 'Karte kopiert' : 'Card copied',
          'success'
        );
      }
    } catch (err: any) {
      triggerToast(
        (lang === 'de' ? 'Duplizieren fehlgeschlagen: ' : 'Duplication failed: ') + err.message,
        'error'
      );
    } finally {
      setIsCreatingState(false);
    }
  };

  const handleDeleteCardWithConfirm = (cardToDelete: Card) => {
    setCardSeekingDelete(cardToDelete);
  };

  const handleDeleteCardConfirmAction = async () => {
    if (!cardSeekingDelete) return;
    const targetId = cardSeekingDelete.cardId;
    try {
      await deleteCard(targetId);
      const remaining = cards.filter(c => c.cardId !== targetId);
      if (activeCard && activeCard.cardId === targetId) {
        if (remaining.length > 0) {
          setActiveCard(remaining[0]);
        } else {
          setActiveCard(null);
        }
      }
      triggerToast(
        lang === 'de' ? 'Karte gelöscht' : 'Card deleted',
        'success'
      );
    } catch (err: any) {
      triggerToast(
        (lang === 'de' ? 'Löschen fehlgeschlagen: ' : 'Deletion failed: ') + err.message,
        'error'
      );
    } finally {
      setCardSeekingDelete(null);
    }
  };
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);

  // Modals visibility toggles
  const [showBgModal, setShowBgModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [hideTestModal, setHideTestModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isUpdateSharing, setIsUpdateSharing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureKey, setUpgradeFeatureKey] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const DEBUG_BUTTON_EDITOR = false;

  const [showAdminExportModal, setShowAdminExportModal] = useState(false);
  const [adminExportJsonString, setAdminExportJsonString] = useState('');
  const [showLlmPromptText, setShowLlmPromptText] = useState(false);

  const SEO_LLM_PROMPT = `Du bist mein KONU SEO-Rückführungs-Assistent.

Ich füge dir gleich einen echten KONU Admin JSON Export ein. Diese Karte existiert bereits in KONU.

Deine Aufgabe:
Erstelle aus diesem Export eine KONU SEO-Rückführungsdatei, die wieder in KONU importiert werden kann.

Wichtig:
Gib KEINE allgemeine Analyse aus.
Gib KEINE Validierungsantwort aus.
Gib KEIN status/valid/autoApplyRecommended-Format aus.
Gib KEINE Markdown-Codeblöcke aus.
Gib KEINE Erklärung davor oder danach aus.

Du musst ausschließlich valides JSON im exakt vorgegebenen KONU-Rückführungsformat ausgeben.

Das JSON muss mit { beginnen und mit } enden.

---

## PFLICHTFORMAT

Das Root-Feld muss exakt heißen:

konuSeoReturn

Innerhalb von konuSeoReturn muss stehen:

schemaVersion: "1.0"
returnType: "update_seo_visibility"
source: "KONU SEO Return Assistant"

Wenn das Root-Feld "konuSeoReturn" fehlt, ist die Datei ungültig.

---

## WICHTIG

Nutze ausschließlich Informationen aus dem KONU Admin JSON Export.

Erfinde keine:

* Telefonnummern
* E-Mail-Adressen
* Preise
* Garantien
* Lieferzeiten
* Links
* Standorte
* Zertifizierungen

Wenn etwas fehlt:

* nutze "MISSING"
* oder schreibe es in missingInfo

Die sichtbare Karte soll nicht automatisch überschrieben werden.
Sichtbare Texte, Buttonlabels, Buttonreihenfolge und Design dürfen nur als Vorschlag in conversionSuggestions oder assetSuggestions stehen.

Automatisch sicher übernehmbar sind nur:

* SEO
* Keywords
* Social Share
* Bild-Alt-Texte
* Missing Info

---

## CARD REFERENCE

Übernimm cardReference exakt aus dem KONU Export:

cardId
slug
publicUrl
title

Diese Werte dürfen nicht verändert werden.

---

## ZEICHENLIMITS

metaTitle:
maximal 70 Zeichen

metaDescription:
maximal 170 Zeichen

shareText:
maximal 220 Zeichen

keywords:
maximal 30 Begriffe

hashtags:
maximal 15 Hashtags

Sichtbare Textvorschläge:
title maximal 32 Zeichen
subtitle maximal 48 Zeichen
slogan maximal 42 Zeichen
description maximal 120 Zeichen
button label maximal 24 Zeichen
benefits maximal 3

---

## ERLAUBTES AUSGABEFORMAT

Gib exakt dieses JSON-Format aus:

{
  "konuSeoReturn": {
    "schemaVersion": "1.0",
    "returnType": "update_seo_visibility",
    "source": "KONU SEO Return Assistant"
  },
  "cardReference": {
    "cardId": "",
    "slug": "",
    "publicUrl": "",
    "title": ""
  },
  "seo": {
    "metaTitle": "",
    "metaDescription": "",
    "keywords": [],
    "longTailKeywords": [],
    "localKeywords": [],
    "brandKeywords": [],
    "alternativeKeywords": [],
    "imageAltTexts": {
      "hero": "",
      "logo": "",
      "profileImage": "",
      "productImage": "",
      "openGraphImage": ""
    }
  },
  "socialShare": {
    "ogTitle": "",
    "ogDescription": "",
    "shareText": "",
    "hashtags": []
  },
  "conversionSuggestions": {
    "primaryButtonLabel": "",
    "recommendedButtonOrder": [],
    "missingCtas": [],
    "visibleTextSuggestions": {
      "title": "",
      "subtitle": "",
      "slogan": "",
      "description": "",
      "benefits": []
    },
    "buttonLabelSuggestions": []
  },
  "assetSuggestions": {
    "heroPrompt": "",
    "profileImagePrompt": "",
    "productImagePrompt": "",
    "openGraphPrompt": "",
    "logoAltText": ""
  },
  "missingInfo": [],
  "warnings": [],
  "importNotes": {
    "safeToAutoApply": {
      "seo": true,
      "socialShare": true,
      "imageAltTexts": true,
      "visibleTextSuggestions": false,
      "buttonSuggestions": false,
      "assetPrompts": false
    },
    "requiresUserReview": true
  }
}

---

## BUTTON-LABEL-VORSCHLÄGE

Wenn du bessere Buttonlabels vorschlägst, schreibe sie nur in:

conversionSuggestions.buttonLabelSuggestions

Format:

[
  {
    "buttonId": "",
    "currentLabel": "",
    "suggestedLabel": "",
    "reason": ""
  }
]

Wichtig:
Buttonlabels dürfen nicht automatisch übernommen werden.

---

## SEO-QUALITÄT

Erstelle SEO-Daten so, dass sie wirklich zur Karte passen.

Achte besonders auf:

* Hauptkeyword
* Produktname oder Markenname
* Zielgruppe
* Standort oder Region, falls im Export vorhanden
* wichtige Buttonlinks
* Website
* PDF/Flyer
* vorhandene Social-Links
* vorhandene Bilder
* bestehende Kartentexte

Keywords sollen sinnvoll sein.
Keine Keyword-Spam-Liste.
Keine irrelevanten Trendbegriffe.

---

## SOCIAL SHARE

Erstelle:

* ogTitle
* ogDescription
* shareText
* hashtags

Die Texte sollen gut für WhatsApp, LinkedIn, Facebook und Messenger funktionieren.

---

## WARNINGS

Falls du Unsicherheiten erkennst, schreibe sie in warnings.

Beispiele:

* Produktname prüfen
* Standort fehlt
* Logo fehlt
* OpenGraph-Bild fehlt
* PDF-Bezeichnung könnte klarer sein
* Website-Link prüfen

---

## AUSGABE

Gib jetzt ausschließlich die KONU SEO-Rückführungsdatei als valides JSON aus.

Keine Analyse.
Keine Erklärung.
Keine Markdown-Codeblöcke.
Keine Kommentare.
Kein Text vor oder nach dem JSON.

Jetzt kommt der KONU Admin JSON Export:`;

  // Admin-only SEO import states
  const [showAdminImportModal, setShowAdminImportModal] = useState(false);
  const [importInputJson, setImportInputJson] = useState('');
  const [importValidatedData, setImportValidatedData] = useState<any | null>(null);
  const [importValidationError, setImportValidationError] = useState<string | null>(null);
  const [importValidationWarnings, setImportValidationWarnings] = useState<string[]>([]);
  const [applyEmptyValues, setApplyEmptyValues] = useState(false);
  const [importSelectedFields, setImportSelectedFields] = useState<Record<string, boolean>>({});
  const [cardReferenceMismatch, setCardReferenceMismatch] = useState(false);
  const [byPassMismatch, setByPassMismatch] = useState(false);

  // Metadata definition for single-field import selection
  const IMPORTABLE_FIELDS_METADATA = [
    { id: 'metaTitle', path: 'seo.metaTitle', group: 'SEO', limit: 70, isArray: false, label: 'Meta Title' },
    { id: 'metaDescription', path: 'seo.metaDescription', group: 'SEO', limit: 170, isArray: false, label: 'Meta Description' },

    { id: 'keywords', path: 'seo.keywords', group: 'KEYWORDS', limit: 30, isArray: true, label: 'Keywords' },
    { id: 'longTailKeywords', path: 'seo.longTailKeywords', group: 'KEYWORDS', limit: 30, isArray: true, label: 'Longtail Keywords' },
    { id: 'localKeywords', path: 'seo.localKeywords', group: 'KEYWORDS', limit: 30, isArray: true, label: 'Lokale Keywords' },
    { id: 'brandKeywords', path: 'seo.brandKeywords', group: 'KEYWORDS', limit: 30, isArray: true, label: 'Marken-Keywords' },
    { id: 'alternativeKeywords', path: 'seo.alternativeKeywords', group: 'KEYWORDS', limit: 30, isArray: true, label: 'Alternative Keywords' },

    { id: 'alt_hero', path: 'seo.imageAltTexts.hero', group: 'ALT_TEXTS', isArray: false, label: 'Alt-Text: Hero' },
    { id: 'alt_logo', path: 'seo.imageAltTexts.logo', group: 'ALT_TEXTS', isArray: false, label: 'Alt-Text: Logo' },
    { id: 'alt_profileImage', path: 'seo.imageAltTexts.profileImage', group: 'ALT_TEXTS', isArray: false, label: 'Alt-Text: Profilbild' },
    { id: 'alt_productImage', path: 'seo.imageAltTexts.productImage', group: 'ALT_TEXTS', isArray: false, label: 'Alt-Text: Produktbild' },
    { id: 'alt_openGraphImage', path: 'seo.imageAltTexts.openGraphImage', group: 'ALT_TEXTS', isArray: false, label: 'Alt-Text: OpenGraph-Bild' },

    { id: 'ogTitle', path: 'socialShare.ogTitle', group: 'SOCIAL', limit: 70, isArray: false, label: 'OpenGraph Title' },
    { id: 'ogDescription', path: 'socialShare.ogDescription', group: 'SOCIAL', limit: 170, isArray: false, label: 'OpenGraph Description' },
    { id: 'shareText', path: 'socialShare.shareText', group: 'SOCIAL', limit: 220, isArray: false, label: 'Share Text' },
    { id: 'hashtags', path: 'socialShare.hashtags', group: 'SOCIAL', limit: 15, isArray: true, label: 'Hashtags' },

    { id: 'missingInfo', path: 'missingInfo', group: 'MISSING_INFO', isArray: true, label: 'Missing Info' }
  ];

  const getIncomingValue = (fieldId: string, data: any) => {
    if (!data) return undefined;
    if (fieldId === 'metaTitle') return data.seo?.metaTitle;
    if (fieldId === 'metaDescription') return data.seo?.metaDescription;
    if (fieldId === 'keywords') return data.seo?.keywords;
    if (fieldId === 'longTailKeywords') return data.seo?.longTailKeywords;
    if (fieldId === 'localKeywords') return data.seo?.localKeywords;
    if (fieldId === 'brandKeywords') return data.seo?.brandKeywords;
    if (fieldId === 'alternativeKeywords') return data.seo?.alternativeKeywords;
    if (fieldId === 'alt_hero') return data.seo?.imageAltTexts?.hero;
    if (fieldId === 'alt_logo') return data.seo?.imageAltTexts?.logo;
    if (fieldId === 'alt_profileImage') return data.seo?.imageAltTexts?.profileImage;
    if (fieldId === 'alt_productImage') return data.seo?.imageAltTexts?.productImage;
    if (fieldId === 'alt_openGraphImage') return data.seo?.imageAltTexts?.openGraphImage;
    if (fieldId === 'ogTitle') return data.socialShare?.ogTitle;
    if (fieldId === 'ogDescription') return data.socialShare?.ogDescription;
    if (fieldId === 'shareText') return data.socialShare?.shareText;
    if (fieldId === 'hashtags') return data.socialShare?.hashtags;
    if (fieldId === 'missingInfo') return data.missingInfo;
    return undefined;
  };

  const getCurrentValue = (fieldId: string) => {
    if (!activeCard) return undefined;
    if (fieldId === 'alt_hero') return activeCard.imageAltTexts?.hero;
    if (fieldId === 'alt_logo') return activeCard.imageAltTexts?.logo;
    if (fieldId === 'alt_profileImage') return activeCard.imageAltTexts?.profileImage;
    if (fieldId === 'alt_productImage') return activeCard.imageAltTexts?.productImage;
    if (fieldId === 'alt_openGraphImage') return activeCard.imageAltTexts?.openGraphImage;
    return (activeCard as any)[fieldId];
  };

  const generateCardJsonString = (): string => {
    if (!activeCard) return "";
    try {
      const cardRef = activeCard as any;
      const rawCard = { ...activeCard } as any;
      delete rawCard.ownerId;
      if ('passwordHash' in rawCard) {
        delete rawCard.passwordHash;
      }

      const buttonsArr = (cardRef.buttons || []).map((b: any, idx: number) => {
        const labelVal = b.title || b.label || "";
        const titleVal = b.title || b.label || "";
        const typeVal = b.actionType || b.type || "";
        const actionTypeVal = b.actionType || b.type || "";
        const valueVal = b.actionValue || b.value || b.url || "";
        const actionValueVal = b.actionValue || b.value || b.url || "";
        const isUrlAction = [
          'website', 'custom_link', 'external_file_link', 'pdf_link', 
          'pdf_upload', 'direct_file_upload', 'cloud_link', 'url', 'link'
        ].includes(actionTypeVal);
        const urlVal = b.url || (isUrlAction ? (b.actionValue || b.value || "") : "");
        const orderVal = b.position !== undefined ? b.position : (b.order !== undefined ? b.order : idx);
        const priorityVal = b.priority !== undefined ? b.priority : (b.position !== undefined ? b.position : idx + 1);
        const visibleVal = b.isActive !== false;

        let configVal = null;
        if (b.formConfig || b.callbackConfig || b.pdfConfig || b.fileConfig || b.config) {
          configVal = { ...(b.formConfig || b.callbackConfig || b.pdfConfig || b.fileConfig || b.config) };
          const sensitiveKeys = [
            'password', 'passwordHash', 'privateToken', 'token', 'secret', 'secretKey', 
            'apiKey', 'private', 'pw', 'pass', 'auth', 'authToken'
          ];
          sensitiveKeys.forEach(k => {
            if (k in configVal) delete configVal[k];
            Object.keys(configVal).forEach(existingKey => {
              if (existingKey.toLowerCase() === k.toLowerCase()) {
                delete configVal[existingKey];
              }
            });
          });
        }

        return {
          id: b.id || "",
          title: titleVal,
          label: labelVal,
          type: typeVal,
          actionType: actionTypeVal,
          value: valueVal,
          url: urlVal,
          actionValue: actionValueVal,
          priority: priorityVal,
          order: orderVal,
          visible: visibleVal,
          config: configVal
        };
      });

      // Extract card level values (fallback defensively if they are directly on the card)
      let phoneVal = cardRef.phone || cardRef.phoneNumber || "";
      let emailVal = cardRef.email || "";
      let waVal = cardRef.whatsapp || "";
      let webVal = cardRef.website || cardRef.url || "";

      // Address: "Falls contact.phone leer ist, aber ein phone-Button existiert: contact.phone aus phone Button actionValue ableiten"
      const phoneBtn = (cardRef.buttons || []).find((b: any) => b.actionType === 'phone' || b.id === 'phone');
      if (phoneBtn) {
        const derived = phoneBtn.actionValue || phoneBtn.phoneNumber || phoneBtn.value || "";
        if (derived && !phoneVal) {
          phoneVal = derived;
        }
      }

      // Address: "Falls contact.email leer ist, aber ein email-Button existiert: contact.email aus email Button actionValue ableiten"
      const emailBtn = (cardRef.buttons || []).find((b: any) => b.actionType === 'email' || b.id === 'email');
      if (emailBtn) {
        const derived = emailBtn.actionValue || emailBtn.email || emailBtn.value || "";
        if (derived && !emailVal) {
          emailVal = derived;
        }
      }

      // Address: "Falls contact.website leer ist, aber ein website Button existiert: contact.website aus erstem Website-Button ableiten"
      const webBtn = (cardRef.buttons || []).find((b: any) => b.actionType === 'website' || b.actionType === 'link' || b.actionType === 'custom_link');
      if (webBtn) {
        const derived = webBtn.actionValue || webBtn.url || webBtn.value || "";
        if (derived && !webVal) {
          webVal = derived;
        }
      }

      // Address: "Falls contact.whatsapp leer ist, aber ein whatsapp Button existiert: contact.whatsapp aus whatsapp Button actionValue ableiten"
      const waBtn = (cardRef.buttons || []).find((b: any) => b.actionType === 'whatsapp');
      if (waBtn) {
        const derived = waBtn.actionValue || waBtn.phoneNumber || waBtn.value || "";
        if (derived && !waVal) {
          waVal = derived;
        }
      }

      const fileRefs = (cardRef.buttons || [])
        .filter((b: any) => b.actionType === 'pdf_upload' || b.actionType === 'file_upload')
        .map((b: any) => b.fileUrl || b.pdfUrl || b.url || "");

      const missing: string[] = [];
      if (!cardRef.metaTitle) missing.push("SEO metaTitle fehlt (SEO metaTitle missing)");
      if (!cardRef.metaDescription) missing.push("SEO metaDescription fehlt (SEO metaDescription missing)");
      if (!cardRef.keywords || cardRef.keywords.length === 0) missing.push("Keywords fehlen (Keywords missing)");
      if (!phoneVal) missing.push("Telefonnummer fehlt (Phone number missing)");
      if (!emailVal) missing.push("E-Mail-Adresse fehlt (Email address missing)");
      if (!webVal) missing.push("Website fehlt (Website missing)");
      if (!cardRef.ogTitle && !cardRef.ogDescription) missing.push("OpenGraph-Daten fehlen (OpenGraph data missing)");
      if (!cardRef.customLogoUrl) missing.push("Logo fehlt (Logo missing)");
      if (!cardRef.heroImageUrl && !cardRef.coverImageUrl) missing.push("Hero-Bild fehlt (Hero image missing)");

      const detailedButtonsList = (cardRef.buttons || []).map((b: any, idx: number) => {
        const labelVal = b.title || b.label || "";
        const titleVal = b.title || b.label || "";
        const typeVal = b.actionType || b.type || "";
        const actionTypeVal = b.actionType || b.type || "";
        const valueVal = b.actionValue || b.value || b.url || "";
        const actionValueVal = b.actionValue || b.value || b.url || "";
        const isUrlAction = [
          'website', 'custom_link', 'external_file_link', 'pdf_link', 
          'pdf_upload', 'direct_file_upload', 'cloud_link', 'url', 'link'
        ].includes(actionTypeVal);
        const urlVal = b.url || (isUrlAction ? (b.actionValue || b.value || "") : "");
        const orderVal = b.position !== undefined ? b.position : (b.order !== undefined ? b.order : idx);
        const priorityVal = b.priority !== undefined ? b.priority : (b.position !== undefined ? b.position : idx + 1);
        const visibleVal = b.isActive !== false;

        return {
          id: b.id || "",
          title: titleVal,
          label: labelVal,
          type: typeVal,
          actionType: actionTypeVal,
          value: valueVal,
          url: urlVal,
          actionValue: actionValueVal,
          priority: priorityVal,
          order: orderVal,
          visible: visibleVal,
          styleOverrides: b.styleVariant || null,
          icon: b.icon || null,
          colorOverrides: b.bgColor || b.backgroundColor || null,
          radiusOverrides: b.radius || null
        };
      });

      const layoutContext = {
        "cardWidth": "100%",
        "cardMaxWidth": "480px",
        "mobileViewportHint": "optimized_for_portrait",
        "cardBorderRadius": cardRef.heroRadius || "24px",
        "cardPadding": cardRef.heroPadding || "4",
        "sectionSpacing": "space-y-6",
        "contentAlignment": cardRef.heroTextAlign || "center",
        "safeAreaNotes": "designed_for_notch_and_home_indicator",
        "computedDefaultsUsed": true
      };

      const designContext = {
        "theme": cardRef.theme || cardRef.profileType || "default",
        "primaryColor": cardRef.heroBackgroundColor || cardRef.backgroundColor || "",
        "secondaryColor": cardRef.heroGradientColor || "",
        "backgroundColor": cardRef.backgroundColor || cardRef.cardBackgroundColor || "",
        "textColor": cardRef.heroTextColor || "white",
        "mutedTextColor": cardRef.heroDescTextColor || "cream",
        "buttonColor": cardRef.buttonColor || "",
        "buttonTextColor": cardRef.buttonTextColor || "",
        "accentColor": cardRef.heroAccentColor || "",
        "fontStyle": cardRef.heroFontStyle || cardRef.heroFontFamily || "",
        "visualMood": cardRef.backgroundType === "image" ? "immersive_image" : "solid_minimalist",
        "contrastNotes": "high_contrast_dark"
      };

      const buttonStyleContext = {
        "buttonStyle": cardRef.buttonStyle || "filled",
        "buttonRadius": cardRef.buttonRadius || "rounded-xl",
        "buttonHeight": "48px",
        "buttonGap": "12px",
        "buttonPaddingX": "16px",
        "buttonPaddingY": "12px",
        "buttonShadow": "soft",
        "buttonBorder": "border border-stone-800",
        "buttonAlignment": "center",
        "buttonIconStyle": "left_icon",
        "buttonCount": (cardRef.buttons || []).length,
        "buttonVisualDensity": "balanced",
        "buttons": detailedButtonsList
      };

      const profileAreaContext = {
        "profileMode": cardRef.profileType || "person",
        "profileImageUrl": cardRef.profileImageUrl || "",
        "logoUrl": cardRef.customLogoUrl || cardRef.logoUrl || "",
        "productImageUrl": cardRef.productImageUrl || "",
        "profileImageSize": cardRef.heroProfileImageSize ? `${cardRef.heroProfileImageSize}px` : "80px",
        "profileImageShape": cardRef.profileImageShape || "circle",
        "profileImageBorderRadius": cardRef.profileImageShape === 'square' ? "0px" : (cardRef.profileImageShape === 'rounded' ? "12px" : "50%"),
        "profileImageBorder": cardRef.profileImageBorder || "none",
        "profileAreaPosition": cardRef.profileImagePosition || "center",
        "profileAreaSpacing": "mb-4",
        "titlePosition": "main_body",
        "subtitlePosition": "main_body",
        "sloganPosition": "main_body"
      };

      const heroContext = {
        "heroImageUrl": cardRef.heroImageUrl || cardRef.coverImageUrl || "",
        "heroMobileUrl": cardRef.heroImageUrl || "",
        "heroStyle": cardRef.heroLayout || "klassisch",
        "heroHeight": cardRef.heroHeight || cardRef.heroSize || "normal",
        "heroOverlay": cardRef.heroOverlay || 0,
        "heroOverlayColor": cardRef.heroGradientColor || "",
        "heroPosition": cardRef.heroMediaPosition || "center",
        "heroFit": cardRef.heroImageMode || "cover",
        "heroFocalPoint": cardRef.heroImagePosition || "center",
        "backgroundType": cardRef.backgroundType || "",
        "backgroundImageUrl": cardRef.backgroundImageUrl || "",
        "backgroundFit": cardRef.backgroundImageFit || "cover"
      };

      const visualStructure = {
        "layoutOrder": [
          "hero",
          "profileArea",
          "title",
          "subtitle",
          "slogan",
          "description",
          "benefits",
          "buttons",
          "footer"
        ],
        "notAllowed": [
          "no flyer layout",
          "no poster layout",
          "no infographic layout",
          "no price boxes",
          "no QR code inside card body",
          "no long visible SEO text",
          "no logo in footer",
          "no images inside button list"
        ],
        "visibleTextLimits": {
          "title": 32,
          "subtitle": 48,
          "slogan": 42,
          "description": 120,
          "buttonLabel": 24,
          "visibleBenefits": 3
        }
      };

      const designLlmInstructions = {
        "purpose": "Use this design context to suggest improved visual styles for the existing KONU card. Do not invent a new layout. Keep the KONU mobile card structure. Return design suggestions only or a KONU design return file if asked.",
        "safeDesignFields": [
          "theme",
          "primaryColor",
          "secondaryColor",
          "backgroundColor",
          "buttonColor",
          "buttonTextColor",
          "buttonRadius",
          "buttonStyle",
          "fontStyle",
          "heroStyle",
          "heroOverlay"
        ],
        "reviewRequiredFields": [
          "layoutContext",
          "profileAreaContext",
          "heroContext",
          "buttonStyleContext",
          "assets",
          "visibleContent"
        ],
        "rules": [
          "Do not turn the KONU card into a flyer, poster or infographic.",
          "Do not place logos in the footer.",
          "Do not place images inside the button list.",
          "Do not make visible texts longer.",
          "Keep the mobile-first card layout.",
          "Only propose design changes that fit the existing card."
        ]
      };

      const payload = {
        "konuCardExport": {
          "schemaVersion": "1.0",
          "exportType": "current_card_full_context",
          "exportedAt": new Date().toISOString(),
          "exportedBy": user?.email || "nfctagsproducts@gmail.com",
          "source": "KONU Admin Export"
        },
        "cardReference": {
          "cardId": cardRef.cardId || "",
          "slug": cardRef.slug || "",
          "publicUrl": cardRef.slug ? `${window.location.origin}/u/${cardRef.slug}` : "",
          "title": cardRef.title || ""
        },
        "card": {
          "raw": rawCard,
          "cardType": cardRef.type || "",
          "plan": cardRef.plan || "",
          "language": lang || "de",
          "status": cardRef.isPublished ? "published" : "draft"
        },
        "visibleContent": {
          "title": cardRef.title || "",
          "subtitle": cardRef.subtitle || "",
          "slogan": cardRef.slogan || "",
          "description": cardRef.description || "",
          "benefits": cardRef.benefits || []
        },
        "buttons": buttonsArr,
        "contact": {
          "phone": phoneVal,
          "email": emailVal,
          "whatsapp": waVal,
          "website": webVal,
          "location": cardRef.location || ""
        },
        "seo": {
          "metaTitle": cardRef.metaTitle || "",
          "metaDescription": cardRef.metaDescription || "",
          "keywords": cardRef.keywords || []
        },
        "socialShare": {
          "ogTitle": cardRef.ogTitle || "",
          "ogDescription": cardRef.ogDescription || "",
          "shareText": cardRef.shareText || "",
          "hashtags": cardRef.hashtags || []
        },
        "design": {
          "backgroundType": cardRef.backgroundType || "",
          "backgroundColor": cardRef.backgroundColor || "",
          "backgroundImageUrl": cardRef.backgroundImageUrl || "",
          "theme": cardRef.theme || cardRef.profileType || "",
          "buttonColor": cardRef.buttonColor || "",
          "buttonTextColor": cardRef.buttonTextColor || "",
          "buttonStyle": cardRef.buttonStyle || ""
        },
        "assets": {
          "logo": cardRef.customLogoUrl || cardRef.logoUrl || null,
          "hero": cardRef.heroImageUrl || cardRef.coverImageUrl || null,
          "profile": cardRef.profileImageUrl || null,
          "product": cardRef.productImageUrl || null,
          "files": fileRefs
        },
        "missingInfo": missing,
        "llmInstructions": {
          "purpose": "Use this JSON as context for an external LLM to improve SEO, keywords, social sharing, image alt texts, button labels, conversion suggestions and design suggestions. Do not invent contact details, prices, guarantees or links. Return only a KONU SEO/visibility return file if asked.",
          "visibleTextLimits": {
            "title": 32,
            "subtitle": 48,
            "slogan": 42,
            "description": 120,
            "buttonLabel": 24,
            "visibleBenefits": 3
          },
          "safeAutoApplyFields": [
            "seo.metaTitle",
            "seo.metaDescription",
            "seo.keywords",
            "seo.longTailKeywords",
            "seo.localKeywords",
            "seo.brandKeywords",
            "seo.alternativeKeywords",
            "seo.imageAltTexts",
            "socialShare.ogTitle",
            "socialShare.ogDescription",
            "socialShare.shareText",
            "socialShare.hashtags"
          ],
          "reviewRequiredFields": [
            "visibleContent",
            "buttons",
            "design",
            "assets",
            "conversionSuggestions"
          ]
        },
        "layoutContext": layoutContext,
        "designContext": designContext,
        "buttonStyleContext": buttonStyleContext,
        "profileAreaContext": profileAreaContext,
        "heroContext": heroContext,
        "visualStructure": visualStructure,
        "designLlmInstructions": designLlmInstructions
      };

      return JSON.stringify(payload, null, 2);
    } catch (err) {
      console.error("Error generating card JSON payload:", err);
      return "";
    }
  };

  const handleExportCardJson = async (action: 'download' | 'copy' | 'view') => {
    if (!activeCard) {
      triggerToast(lang === 'de' ? 'Export nicht verfügbar.' : 'Export not available.', 'error');
      return;
    }

    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
    if (!isKonuAdmin) {
      triggerToast(lang === 'de' ? 'Export nicht verfügbar.' : 'Export not available.', 'error');
      return;
    }

    try {
      const jsonStr = generateCardJsonString();
      if (!jsonStr) {
        triggerToast(lang === 'de' ? 'Export nicht verfügbar.' : 'Export not available.', 'error');
        return;
      }

      if (action === 'copy') {
        const success = copyTextToClipboard(jsonStr);
        if (success) {
          triggerToast(lang === 'de' ? 'JSON wurde kopiert.' : 'JSON copied successfully.', 'success');
        } else {
          setAdminExportJsonString(jsonStr);
          setShowAdminExportModal(true);
          triggerToast(lang === 'de' ? 'JSON wurde kopiert (Fallback-Anzeige).' : 'JSON copied (fallback display).', 'success');
        }
      } else if (action === 'download') {
        const cleanIdent = (activeCard.slug || activeCard.cardId || 'card')
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\-]/g, '');
        const todayStr = new Date().toISOString().split('T')[0];
        const filename = `konu-card-export-${cleanIdent}-${todayStr}.json`;

        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        triggerToast(lang === 'de' ? 'JSON wurde heruntergeladen.' : 'JSON was downloaded.', 'success');
      } else {
        setAdminExportJsonString(jsonStr);
        setShowAdminExportModal(true);
      }
    } catch (e) {
      console.error("General error in JSON card export handler:", e);
      triggerToast(lang === 'de' ? 'Export nicht verfügbar.' : 'Export not available.', 'error');
    }
  };

  const handleCopyLlmPromptOnly = () => {
    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
    if (!isKonuAdmin) {
      triggerToast(lang === 'de' ? 'Aktion nicht erlaubt.' : 'Action not allowed.', 'error');
      return;
    }
    const success = copyTextToClipboard(SEO_LLM_PROMPT);
    if (success) {
      triggerToast(
        lang === 'de' ? 'LLM SEO-Prompt wurde kopiert.' : 'LLM SEO prompt copied.',
        'success'
      );
    } else {
      triggerToast(
        lang === 'de' ? 'Prompt konnte nicht kopiert werden. Prompt wird unten angezeigt.' : 'Prompt could not be copied. Displayed below.',
        'error'
      );
      setShowLlmPromptText(true);
    }
  };

  const handleCopyLlmCombined = () => {
    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
    if (!isKonuAdmin) {
      triggerToast(lang === 'de' ? 'Aktion nicht erlaubt.' : 'Action not allowed.', 'error');
      return;
    }
    const cardJson = generateCardJsonString();
    if (!cardJson) {
      triggerToast(
        lang === 'de' ? 'Karten-JSON nicht verfügbar.' : 'Card JSON not available.',
        'error'
      );
      return;
    }
    const combinedText = `${SEO_LLM_PROMPT}\n\n${cardJson}`;
    const success = copyTextToClipboard(combinedText);
    if (success) {
      triggerToast(
        lang === 'de' ? 'LLM SEO-Prompt + Karten-JSON wurde kopiert.' : 'LLM SEO Prompt + Card JSON copied.',
        'success'
      );
    } else {
      triggerToast(
        lang === 'de' ? 'Inhalt konnte nicht direkt kopiert werden. Versuche es manuell über "Prompt anzeigen".' : 'Content could not be copied. Try manually via "View prompt".',
        'error'
      );
      setShowLlmPromptText(true);
    }
  };

  const selectAllFields = () => {
    const next: Record<string, boolean> = {};
    IMPORTABLE_FIELDS_METADATA.forEach(f => {
      next[f.id] = true;
    });
    setImportSelectedFields(next);
  };

  const deselectAllFields = () => {
    const next: Record<string, boolean> = {};
    IMPORTABLE_FIELDS_METADATA.forEach(f => {
      next[f.id] = false;
    });
    setImportSelectedFields(next);
  };

  const selectOnlySeoFields = () => {
    const next: Record<string, boolean> = {};
    IMPORTABLE_FIELDS_METADATA.forEach(f => {
      next[f.id] = f.group === 'SEO';
    });
    setImportSelectedFields(next);
  };

  const selectOnlySocialFields = () => {
    const next: Record<string, boolean> = {};
    IMPORTABLE_FIELDS_METADATA.forEach(f => {
      next[f.id] = f.group === 'SOCIAL';
    });
    setImportSelectedFields(next);
  };

  const selectOnlyAltTextFields = () => {
    const next: Record<string, boolean> = {};
    IMPORTABLE_FIELDS_METADATA.forEach(f => {
      next[f.id] = f.group === 'ALT_TEXTS';
    });
    setImportSelectedFields(next);
  };

  const renderValuePreview = (val: any, isArray: boolean, limit?: number) => {
    if (isArray) {
      const arr = Array.isArray(val) ? val : [];
      if (arr.length === 0) {
        return <span className="text-stone-600 italic">[{lang === 'de' ? 'Leer' : 'Empty'}]</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {arr.map((item: string, idx: number) => (
            <span key={idx} className="bg-stone-850 text-stone-300 text-[9px] px-1.5 py-0.5 rounded border border-stone-800">
              {item}
            </span>
          ))}
        </div>
      );
    } else {
      const s = val !== null && val !== undefined ? String(val).trim() : '';
      if (!s) {
        return <span className="text-stone-600 italic">[{lang === 'de' ? 'Leer' : 'Empty'}]</span>;
      }
      if (limit && s.length > limit) {
        return (
          <span title={s}>
            {s.substring(0, limit)}
            <span className="text-rose-400 font-bold" title="Truncated">...</span>
          </span>
        );
      }
      return <span>"{s}"</span>;
    }
  };

  const getFieldStatus = (f: any, data: any) => {
    const currentVal = getCurrentValue(f.id);
    const rawIncoming = getIncomingValue(f.id, data);
    
    const cleanString = (str: any, limit?: number) => {
      if (str === null || str === undefined) return '';
      let res = String(str).trim();
      if (limit && res.length > limit) {
        res = res.substring(0, limit);
      }
      return res;
    };

    const cleanArray = (arr: any, limit?: number) => {
      if (!Array.isArray(arr)) return [];
      let res = arr
        .map(x => (x === null || x === undefined) ? '' : String(x).trim())
        .filter(x => x.length > 0);
      res = Array.from(new Set(res));
      if (limit && res.length > limit) {
        res = res.slice(0, limit);
      }
      return res;
    };

    const isArr = f.isArray;
    const limit = f.limit;

    if (isArr) {
      const arrIncoming = cleanArray(rawIncoming, limit);
      const arrCurrent = Array.isArray(currentVal) ? currentVal : [];
      
      if (arrIncoming.length === 0) {
        if (applyEmptyValues) {
          if (arrCurrent.length === 0) {
            return { label: lang === 'de' ? 'Unverändert' : 'Unchanged', css: 'bg-stone-850 text-stone-400 border border-stone-800/60' };
          } else {
            return { label: lang === 'de' ? 'Geändert' : 'Changed', css: 'bg-amber-950 text-amber-300 border border-amber-900/60' };
          }
        }
        return { label: lang === 'de' ? 'Wird nicht übernommen' : 'Will not import', css: 'bg-stone-900 text-stone-500 border border-stone-800' };
      }

      if (arrCurrent.length === 0) {
        return { label: lang === 'de' ? 'Neu' : 'New', css: 'bg-emerald-950 text-emerald-300 border border-emerald-950' };
      }

      const jsonEqual = JSON.stringify(arrIncoming) === JSON.stringify(arrCurrent);
      if (jsonEqual) {
        return { label: lang === 'de' ? 'Unverändert' : 'Unchanged', css: 'bg-stone-850 text-stone-400 border border-stone-800/60' };
      } else {
        return { label: lang === 'de' ? 'Geändert' : 'Changed', css: 'bg-amber-950 text-amber-300 border border-amber-900/60' };
      }
    } else {
      const sIncoming = cleanString(rawIncoming, limit);
      const sCurrent = (currentVal === null || currentVal === undefined) ? '' : String(currentVal).trim();

      if (!sIncoming) {
        if (applyEmptyValues) {
          if (!sCurrent) {
            return { label: lang === 'de' ? 'Unverändert' : 'Unchanged', css: 'bg-stone-850 text-stone-400 border border-stone-800/60' };
          } else {
            return { label: lang === 'de' ? 'Geändert' : 'Changed', css: 'bg-amber-950 text-amber-300 border border-amber-900/60' };
          }
        }
        return { label: lang === 'de' ? 'Wird nicht übernommen' : 'Will not import', css: 'bg-stone-900 text-stone-500 border border-stone-805' };
      }

      if (!sCurrent) {
        return { label: lang === 'de' ? 'Neu' : 'New', css: 'bg-emerald-950 text-emerald-300 border border-emerald-950' };
      }

      if (sIncoming === sCurrent) {
        return { label: lang === 'de' ? 'Unverändert' : 'Unchanged', css: 'bg-stone-850 text-stone-400 border border-stone-800/60' };
      } else {
        return { label: lang === 'de' ? 'Geändert' : 'Changed', css: 'bg-amber-950 text-amber-300 border border-amber-900/60' };
      }
    }
  };

  // Admin-only: Validate SEO return JSON structure & limits
  const validateSeoReturnJson = (jsonStr: string) => {
    setImportValidationError(null);
    setImportValidationWarnings([]);
    setImportValidatedData(null);
    setCardReferenceMismatch(false);
    setByPassMismatch(false);

    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
    if (!isKonuAdmin) {
      setImportValidationError(lang === 'de' ? 'Aktion nicht erlaubt.' : 'Action not allowed.');
      return;
    }

    if (!jsonStr.trim()) {
      setImportValidationError(lang === 'de' ? 'Das Eingabefeld ist leer.' : 'The input field is empty.');
      return;
    }

    try {
      const data = JSON.parse(jsonStr);

      // 1. Root check
      if (!data.konuSeoReturn) {
        setImportValidationError(lang === 'de' ? 'Ungültiges JSON: Root-Feld "konuSeoReturn" fehlt.' : 'Invalid JSON: Root field "konuSeoReturn" is missing.');
        return;
      }

      // 2. returnType check
      if (data.konuSeoReturn.returnType !== 'update_seo_visibility') {
        setImportValidationError(lang === 'de' ? 'Ungültiges JSON: "returnType" muss "update_seo_visibility" sein.' : 'Invalid JSON: "returnType" must be "update_seo_visibility".');
        return;
      }

      // 3. cardReference matching check
      const ref = data.cardReference || {};
      const refId = ref.cardId || '';
      const refSlug = ref.slug || '';
      
      const warnings: string[] = [];
      if (activeCard) {
        const activeId = activeCard.cardId || '';
        const activeSlug = activeCard.slug || '';
        const idMatch = refId && activeId && refId === activeId;
        const slugMatch = refSlug && activeSlug && refSlug === activeSlug;

        if (!idMatch && !slugMatch) {
          setCardReferenceMismatch(true);
          warnings.push(
            lang === 'de' 
              ? `Warnung: Die Rückführungs-Referenz (ID: "${refId}", Slug: "${refSlug}") entspricht nicht der aktuell geöffneten Karte (ID: "${activeId}", Slug: "${activeSlug}").`
              : `Warning: The return reference (ID: "${refId}", Slug: "${refSlug}") does not match the currently open card (ID: "${activeId}", Slug: "${activeSlug}").`
          );
        }
      }

      // 4. Validate structures of seo & socialShare
      if (data.seo && typeof data.seo !== 'object') {
        setImportValidationError(lang === 'de' ? '"seo" muss ein Objekt sein.' : '"seo" must be an object.');
        return;
      }
      if (data.socialShare && typeof data.socialShare !== 'object') {
        setImportValidationError(lang === 'de' ? '"socialShare" muss ein Objekt sein.' : '"socialShare" must be an object.');
        return;
      }

      // 5. Check limitations and populate warnings
      if (data.seo) {
        const seo = data.seo;
        if (seo.metaTitle && seo.metaTitle.length > 70) {
          warnings.push(
            lang === 'de' 
              ? `metaTitle überschreitet 70 Zeichen (${seo.metaTitle.length} Zeichen). Er wird gekürzt.` 
              : `metaTitle exceeds 70 characters (${seo.metaTitle.length} characters). It will be truncated.`
          );
        }
        if (seo.metaDescription && seo.metaDescription.length > 170) {
          warnings.push(
            lang === 'de' 
              ? `metaDescription überschreitet 170 Zeichen (${seo.metaDescription.length} Zeichen). Sie wird gekürzt.` 
              : `metaDescription exceeds 170 characters (${seo.metaDescription.length} characters). It will be truncated.`
          );
        }
        if (seo.keywords && Array.isArray(seo.keywords) && seo.keywords.length > 30) {
          warnings.push(
            lang === 'de' 
              ? `Keywords überschreiten das Limit von 30 (${seo.keywords.length}). Die Liste wird auf die ersten 30 gekürzt.` 
              : `Keywords exceed the limit of 30 (${seo.keywords.length}). List will be truncated to the first 30.`
          );
        }
      }

      if (data.socialShare) {
        const ss = data.socialShare;
        if (ss.shareText && ss.shareText.length > 220) {
          warnings.push(
            lang === 'de' 
              ? `shareText überschreitet 220 Zeichen (${ss.shareText.length} Zeichen). Er wird gekürzt.` 
              : `shareText exceeds 220 characters (${ss.shareText.length} characters). It will be truncated.`
          );
        }
        if (ss.hashtags && Array.isArray(ss.hashtags) && ss.hashtags.length > 15) {
          warnings.push(
            lang === 'de' 
              ? `Hashtags überschreiten das Limit von 15 (${ss.hashtags.length}). Die Liste wird auf die ersten 15 gekürzt.` 
              : `Hashtags exceed the limit of 15 (${ss.hashtags.length}). List will be truncated to the first 15.`
          );
        }
      }

      setImportValidationWarnings(warnings);
      setImportValidatedData(data);

      const cleanString = (str: any, limit?: number) => {
        if (str === null || str === undefined) return '';
        let res = String(str).trim();
        if (limit && res.length > limit) {
          res = res.substring(0, limit);
        }
        return res;
      };

      const cleanArray = (arr: any, limit?: number) => {
        if (!Array.isArray(arr)) return [];
        let res = arr
          .map(x => (x === null || x === undefined) ? '' : String(x).trim())
          .filter(x => x.length > 0);
        res = Array.from(new Set(res));
        if (limit && res.length > limit) {
          res = res.slice(0, limit);
        }
        return res;
      };

      // Pre-select non-empty fields by default
      const initialSelected: Record<string, boolean> = {};
      IMPORTABLE_FIELDS_METADATA.forEach(f => {
        const rawIncoming = getIncomingValue(f.id, data);
        let hasValue = false;
        
        if (f.isArray) {
          const arr = cleanArray(rawIncoming, f.limit);
          hasValue = arr.length > 0;
        } else {
          const s = cleanString(rawIncoming, f.limit);
          hasValue = s.length > 0;
        }

        initialSelected[f.id] = hasValue;
      });
      setImportSelectedFields(initialSelected);

      triggerToast(lang === 'de' ? 'JSON erfolgreich geprüft!' : 'JSON successfully validated!', 'success');
    } catch (err) {
      setImportValidationError(lang === 'de' ? 'Ungültiges JSON-Format. Bitte überpüfe die Syntax.' : 'Invalid JSON format. Please check syntax.');
    }
  };

  // Convert and safe apply of valid SEO fields
  const handleApplyImportData = async (onlySelected: boolean = false) => {
    if (!activeCard || !importValidatedData) {
      triggerToast(lang === 'de' ? 'Keine sicheren Felder zum Übernehmen gefunden.' : 'No safe fields found to apply.', 'error');
      return;
    }

    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
    if (!isKonuAdmin) {
      triggerToast(lang === 'de' ? 'Aktion nicht erlaubt.' : 'Action not allowed.', 'error');
      return;
    }

    if (cardReferenceMismatch && !byPassMismatch) {
      triggerToast(
        lang === 'de' 
          ? 'Bitte bestätige das Kontrollkästchen, da die Karte nicht übereinstimmt.' 
          : 'Please confirm the bypass checkbox due to card mismatch warning.', 
        'error'
      );
      return;
    }

    try {
      const cleanString = (str: any, limit?: number) => {
        if (str === null || str === undefined) return '';
        let res = String(str).trim();
        if (limit && res.length > limit) {
          res = res.substring(0, limit);
        }
        return res;
      };

      const cleanArray = (arr: any, limit?: number) => {
        if (!Array.isArray(arr)) return [];
        let res = arr
          .map(x => (x === null || x === undefined) ? '' : String(x).trim())
          .filter(x => x.length > 0);
        
        // Deduplicate
        res = Array.from(new Set(res));

        if (limit && res.length > limit) {
          res = res.slice(0, limit);
        }
        return res;
      };

      const updates: any = {};
      const importedFields: string[] = [];

      IMPORTABLE_FIELDS_METADATA.forEach(f => {
        if (onlySelected && !importSelectedFields[f.id]) {
          return;
        }

        const rawIncoming = getIncomingValue(f.id, importValidatedData);
        if (f.isArray) {
          const arr = cleanArray(rawIncoming, f.limit);
          if (applyEmptyValues) {
            updates[f.id] = arr;
            importedFields.push(f.path);
          } else if (arr.length > 0) {
            updates[f.id] = arr;
            importedFields.push(f.path);
          }
        } else {
          const s = cleanString(rawIncoming, f.limit);
          if (f.id.startsWith('alt_')) {
            const altKey = f.id.replace('alt_', '');
            if (!updates.imageAltTexts) {
              updates.imageAltTexts = { ...(activeCard.imageAltTexts || {}) };
            }
            if (applyEmptyValues) {
              updates.imageAltTexts[altKey] = s;
              importedFields.push(f.path);
            } else if (s) {
              updates.imageAltTexts[altKey] = s;
              importedFields.push(f.path);
            }
          } else {
            if (applyEmptyValues) {
              updates[f.id] = s;
              importedFields.push(f.path);
            } else if (s) {
              updates[f.id] = s;
              importedFields.push(f.path);
            }
          }
        }
      });

      // Logging details
      updates.lastSeoImportAt = new Date().toISOString();
      updates.lastSeoImportSource = (importValidatedData.konuSeoReturn && importValidatedData.konuSeoReturn.source) || "KONU SEO & Visibility Assistant";
      updates.lastSeoImportFields = importedFields;
      updates.updatedAt = new Date().toISOString();

      // Check if anything has been changed
      const hasActualSeo = Object.keys(updates).some(k => 
        k !== 'lastSeoImportAt' && 
        k !== 'lastSeoImportSource' && 
        k !== 'lastSeoImportFields' && 
        k !== 'updatedAt'
      );

      if (!hasActualSeo && !applyEmptyValues) {
        triggerToast(lang === 'de' ? 'Keine sicheren Felder zum Übernehmen gefunden.' : 'No safe fields found to apply.', 'info');
        return;
      }

      await syncCardUpdate(updates);
      setShowAdminImportModal(false);
      triggerToast(lang === 'de' ? 'SEO-Rückführung wurde übernommen.' : 'SEO return was applied.', 'success');
    } catch (err: any) {
      console.error("Error applying import SEO data:", err);
      triggerToast(lang === 'de' ? 'Import konnte nicht gespeichert werden.' : 'Import could not be saved.', 'error');
    }
  };

  // Upload file handler
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setImportInputJson(text);
        validateSeoReturnJson(text);
      }
    };
    reader.onerror = () => {
      triggerToast(lang === 'de' ? 'Fehler beim Lesen der Datei.' : 'Error reading file.', 'error');
    };
    reader.readAsText(file);
  };

  // Background Editor states
  const [bgType, setBgType] = useState<BackgroundType>('color');
  const [bgColor, setBgColor] = useState('#1C1C1E');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [isBgUploading, setIsBgUploading] = useState(false);

  // Profile Editor states
  const [profileName, setProfileName] = useState('');
  const [profileSubtitle, setProfileSubtitle] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileType, setProfileType] = useState<'person' | 'business' | 'product' | 'project' | 'family'>('person');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isProfileUploading, setIsProfileUploading] = useState(false);

  // Cover / Header Editor states for business / project / family
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverOverlayDarken, setCoverOverlayDarken] = useState(false);
  const [coverImagePosition, setCoverImagePosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  // Product custom properties states
  const [productMediaType, setProductMediaType] = useState<'image' | 'video'>('image');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productVideoUrl, setProductVideoUrl] = useState('');
  const [showProductText, setShowProductText] = useState(true);
  const [productTitle, setProductTitle] = useState('');
  const [productSubtitle, setProductSubtitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productMediaPosition, setProductMediaPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [productHeroSize, setProductHeroSize] = useState<'compact' | 'normal' | 'large'>('normal');
  const [isProductUploading, setIsProductUploading] = useState(false);

  // Hero Media/Title Image Editor states
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroColor, setHeroColor] = useState('#222222');
  const [isHeroUploading, setIsHeroUploading] = useState(false);

  // Button Editor states
  const [editingButton, setEditingButton] = useState<CardButton | null>(null);
  const [btnEditorTab, setBtnEditorTab] = useState<'content' | 'design' | 'media' | 'protection'>('content');
  const [btnTitle, setBtnTitle] = useState('');
  const [btnIcon, setBtnIcon] = useState('Globe');
  const [btnColor, setBtnColor] = useState('#F5EFE3');
  const [btnTextColor, setBtnTextColor] = useState('#1A1A1A');
  const [btnActionType, setBtnActionType] = useState('url');
  const [btnActionValue, setBtnActionValue] = useState('');
  const [btnGoldBorder, setBtnGoldBorder] = useState(true);
  const [btnProtected, setBtnProtected] = useState(false);
  const [btnPassword, setBtnPassword] = useState('');
  const [btnPasswordHint, setBtnPasswordHint] = useState('');
  const [btnImageStyle, setBtnImageStyle] = useState<'icon' | 'background'>('icon');
  const [btnImageOverlay, setBtnImageOverlay] = useState<'none' | 'light' | 'dark'>('dark');
  const [btnUploadedUrl, setBtnUploadedUrl] = useState('');
  const [isBtnImageUploading, setIsBtnImageUploading] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Advanced Button Image custom property states
  const [btnImageMode, setBtnImageMode] = useState<'cover' | 'contain'>('cover');
  const [btnShowLabel, setBtnShowLabel] = useState(true);
  const [btnLabelOverlay, setBtnLabelOverlay] = useState(false);
  const [btnLabelPosition, setBtnLabelPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [btnDarkOverlay, setBtnDarkOverlay] = useState(true);
  const [btnShowBorder, setBtnShowBorder] = useState(true);

  // Custom Border and file upload states for individual buttons
  const [btnBorderWidth, setBtnBorderWidth] = useState<'none' | 'thin' | 'medium' | 'thick'>('none');
  const [btnBorderColor, setBtnBorderColor] = useState('#A855F7');
  const [btnBorderStyle, setBtnBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [isBtnFileUploading, setIsBtnFileUploading] = useState(false);

  // Toast indicator
  const [saveToast, setSaveToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Toast notification state
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const [cardSeekingDelete, setCardSeekingDelete] = useState<Card | null>(null);

  // Screen resize tracking for responsive layout (Ziel 1)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [desktopEditorTab, setDesktopEditorTab] = useState<'profile' | 'background' | 'buttons' | 'share'>('profile');

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reordering & Sorting Mode States
  const [isSortingMode, setIsSortingMode] = useState(false);
  const [draggedButtonId, setDraggedButtonId] = useState<string | null>(null);
  const [dragOverButtonId, setDragOverButtonId] = useState<string | null>(null);
  const [swapSelectionId, setSwapSelectionId] = useState<string | null>(null);

  const touchTimerRef = useRef<any>(null);

  // Helper to determine if we are in Admin/Owner mode
  const isRoleAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';

  const isCustomBgEnabled = () => {
    return true;
  };

  const isPasswordButtonsEnabled = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.overridePasswordButtons) {
      return simulatedOverrides.overridePasswordButtonsValue;
    }
    const currentPlan = simulatedOverrides.simulatedPlan || effectivePlanId;
    if (currentPlan === 'enterprise') return true;
    const planInfo = PLANS[currentPlan] || PLANS[effectivePlanId];
    return planInfo?.passwordButtonsEnabled ?? false;
  };

  const isPdfUploadEnabled = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.overridePdfUpload) {
      return simulatedOverrides.overridePdfUploadValue;
    }
    const currentPlan = simulatedOverrides.simulatedPlan || effectivePlanId;
    if (currentPlan === 'enterprise') return true;
    const planInfo = PLANS[currentPlan] || PLANS[effectivePlanId];
    return planInfo?.maxPdfFiles && planInfo.maxPdfFiles > 1 ? true : false;
  };

  const getButtonsLimit = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.overrideButtons) {
      return simulatedOverrides.overrideButtonsValue;
    }
    const currentPlan = simulatedOverrides.simulatedPlan || effectivePlanId;
    if (currentPlan === 'enterprise') return 250;
    const planInfo = PLANS[currentPlan] || PLANS[effectivePlanId];
    return planInfo?.maxButtonsPerCard ?? 6;
  };

  const getStorageLimit = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.overrideStorage) {
      return simulatedOverrides.overrideStorageValue;
    }
    const currentPlan = simulatedOverrides.simulatedPlan || effectivePlanId;
    if (currentPlan === 'enterprise') return 5000;
    const planInfo = PLANS[currentPlan] || PLANS[effectivePlanId];
    return planInfo?.storageLimitMB ?? 20;
  };

  const isBrandingRequired = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.overrideBranding) {
      return simulatedOverrides.overrideBrandingValue === 'on';
    }
    const currentPlan = simulatedOverrides.simulatedPlan || effectivePlanId;
    if (currentPlan === 'enterprise') return false;
    const planInfo = PLANS[currentPlan] || PLANS[effectivePlanId];
    return planInfo?.brandingRequired ?? true;
  };

  const effectiveProfileType = () => {
    if (isRoleAdminOrOwner && simulatedOverrides.simulatedProfileType) {
      return simulatedOverrides.simulatedProfileType;
    }
    return profileType || activeCard?.type || 'person';
  };

  // Sync activeCard and handle `start=create` parameter safely
  useEffect(() => {
    if (loading || !cardsLoaded) return;

    if (cards.length > 0) {
      if (!activeCard) {
        setActiveCard(cards[0]);
      } else {
        // Sync fresh structural properties from Cards Array if they change
        const currentVersion = cards.find(c => c.cardId === activeCard.cardId);
        if (currentVersion) {
          if (JSON.stringify(currentVersion) !== JSON.stringify(activeCard)) {
            setActiveCard(currentVersion);
          }
        }
      }
    }

    // Process start=create once cards have fully loaded and only once
    const params = new URLSearchParams(window.location.search);
    if (params.get('start') === 'create' && !hasProcessedStartCreateRef.current) {
      hasProcessedStartCreateRef.current = true;
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      if (cards.length > 0) {
        triggerToast(
          lang === 'de'
            ? "Du hast bereits Karten. Wähle eine Karte aus oder erstelle bewusst eine neue."
            : "You already have cards. Choose a card or create a new one intentionally.",
          'info'
        );
      } else {
        handleAddNewCard();
      }
    }
  }, [cards, loading, cardsLoaded]);

  // Real-time synchronization for activeCard to capture back-end video processing results
  useEffect(() => {
    if (!activeCard || !activeCard.cardId) return;

    const cardId = activeCard.cardId;
    // Don't listen to static demo profiles
    if (['ceo', 'autohaus', 'schwimmverband'].includes(activeCard.slug)) return;

    const unsubscribe = onSnapshot(doc(db, 'cards', cardId), (snapshot) => {
      if (snapshot.exists()) {
        const updatedCard = snapshot.data() as Card;
        if (JSON.stringify(updatedCard) !== JSON.stringify(activeCard)) {
          setActiveCard(updatedCard);
        }
      }
    }, (error) => {
      console.warn("[ActiveCard Real-time Sync] Error listening to active card:", error);
    });

    return () => unsubscribe();
  }, [activeCard?.cardId]);

  // Sync editor fields once activeCard loads
  useEffect(() => {
    if (activeCard) {
      setBgType(activeCard.backgroundType || 'color');
      setBgColor(activeCard.backgroundColor || '#1C1C1E');
      setBgImageUrl(activeCard.backgroundImageUrl || '');

      setProfileName(activeCard.heroTitle || activeCard.title || '');
      setProfileSubtitle(activeCard.heroSubtitle || activeCard.subtitle || '');
      setProfileDescription(activeCard.heroDescription || activeCard.description || '');
      setProfileType(normalizeProfileType(activeCard.profileType || activeCard.type) as any);
      setProfileImageUrl(activeCard.profileImageUrl || '');
      setCoverImageUrl(activeCard.coverImageUrl || '');
      setCoverOverlayDarken(activeCard.coverOverlayDarken !== false);
      setCoverImagePosition(activeCard.coverImagePosition || 'center');

      // Hydrate Product properties
      setProductMediaType(activeCard.productMediaType || 'image');
      setProductImageUrl(activeCard.productImageUrl || '');
      setProductVideoUrl(activeCard.productVideoUrl || '');
      setShowProductText(activeCard.showProductText !== false);
      setProductTitle(activeCard.productTitle || '');
      setProductSubtitle(activeCard.productSubtitle || '');
      setProductDescription(activeCard.productDescription || '');
      setProductMediaPosition(activeCard.productMediaPosition || 'center');
      setProductHeroSize(activeCard.productHeroSize || 'normal');

      setHeroImageUrl(activeCard.heroImageUrl || '');
      setHeroColor((activeCard as any).heroColor || '#222222');

      // Generate local preview variables like QR
      const cardUrl = getPublicCardUrl(activeCard.slug);
      QRCode.toDataURL(cardUrl, { width: 300, margin: 1, color: { dark: '#1A1A1A', light: '#F5EFE3' } })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR Code error: ', err));
    }
  }, [activeCard]);

  // Toast confirmation
  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 4000);
  };

  // Synchronous database updates with UI toast
  const syncCardUpdate = async (updates: Partial<Card>) => {
    if (!activeCard) return;
    try {
      await updateCard(activeCard.cardId, updates);
      setActiveCard((prev) => (prev ? { ...prev, ...updates } : null));
      triggerSaveToast();
    } catch (err: any) {
      triggerToast(
        (lang === 'de' ? 'Speichern fehlgeschlagen: ' : 'Saving failed: ') + (err.message || String(err)),
        'error'
      );
    }
  };

  const handleApplySimulatedPlanPermanent = async () => {
    if (!simulatedPlan || !profile) return;

    try {
      const targetMB = PLANS[simulatedPlan].storageLimitMB;
      await updateUserProfile({
        plan: simulatedPlan,
        storageLimitMB: targetMB
      });
      triggerSaveToast();
    } catch (err: any) {
      console.error("Fehler beim Tarif-Anwenden: " + (err.message || String(err)));
    }
  };

  // Secure Password Hashing Helper
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Upload Background Image
  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    if (!isCustomBgEnabled()) {
      setUpgradeFeatureKey('fullAppBackgroundImage');
      setShowUpgradeModal(true);
      return;
    }
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsBgUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'background');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'background');
      setBgImageUrl(url);
      
      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, background: meta } : currentMeta;

      await syncCardUpdate({
        backgroundType: 'image',
        backgroundImageUrl: url,
        imageMeta: updatedMeta
      });

      if (meta) {
        triggerToast(formatImageOptimizationToast(meta, lang), 'success');
      } else {
        triggerToast(lang === 'de' ? 'Hintergrund erfolgreich hochgeladen' : 'Background uploaded successfully', 'success');
      }
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsBgUploading(false);
    }
  };

  // Remove Background Image
  const handleRemoveBgImage = async () => {
    if (!activeCard) return;
    setBgImageUrl('');
    await syncCardUpdate({
      backgroundType: 'color',
      backgroundImageUrl: ''
    });
  };

  // Upload Profile Avatar
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsProfileUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'profile');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'profile');
      setProfileImageUrl(url);

      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, profile: meta } : currentMeta;

      await syncCardUpdate({ 
        profileImageUrl: url,
        imageMeta: updatedMeta
      });

      if (meta) {
        triggerToast(formatImageOptimizationToast(meta, lang), 'success');
      } else {
        triggerToast(lang === 'de' ? 'Profilbild erfolgreich hochgeladen' : 'Profile image uploaded successfully', 'success');
      }
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsProfileUploading(false);
    }
  };

  // Remove Profile Avatar
  const handleRemoveProfileImage = async () => {
    if (!activeCard) return;
    setProfileImageUrl('');
    await syncCardUpdate({ profileImageUrl: '' });
  };

  // Upload Cover Image
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsCoverUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'background');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'cover');
      setCoverImageUrl(url);

      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, cover: meta } : currentMeta;

      await syncCardUpdate({ 
        coverImageUrl: url,
        imageMeta: updatedMeta
      });

      if (meta) {
        triggerToast(formatImageOptimizationToast(meta, lang), 'success');
      } else {
        triggerToast(lang === 'de' ? 'Titelbild erfolgreich hochgeladen' : 'Cover image uploaded successfully', 'success');
      }
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsCoverUploading(false);
    }
  };

  // Remove Cover Image
  const handleRemoveCoverImage = async () => {
    if (!activeCard) return;
    setCoverImageUrl('');
    await syncCardUpdate({ coverImageUrl: '' });
  };

  // Upload Product Image
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsProductUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'gallery');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'product');
      setProductImageUrl(url);

      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, product: meta } : currentMeta;

      await syncCardUpdate({ 
        productImageUrl: url, 
        productMediaType: 'image',
        imageMeta: updatedMeta
      });

      if (meta) {
        triggerToast(formatImageOptimizationToast(meta, lang), 'success');
      } else {
        triggerToast(lang === 'de' ? 'Produktbild erfolgreich hochgeladen' : 'Product image uploaded successfully', 'success');
      }
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsProductUploading(false);
    }
  };

  // Remove Product Image
  const handleRemoveProductImage = async () => {
    if (!activeCard) return;
    setProductImageUrl('');
    await syncCardUpdate({
      productImageUrl: '',
      productImagePath: '',
      productMediaType: 'image'
    });
  };

  // Remove Product Video Link
  const handleRemoveProductVideo = async () => {
    if (!activeCard) return;
    setProductVideoUrl('');
    setProductMediaType('image');
    await syncCardUpdate({
      productVideoUrl: '',
      productVideoType: undefined,
      productMediaType: 'image'
    });
  };

  // Upload Central Title Image
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsHeroUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'logo');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'background');
      setHeroImageUrl(url);

      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, logo: meta } : currentMeta;

      await syncCardUpdate({ 
        heroImageUrl: url,
        imageMeta: updatedMeta
      });

      if (meta) {
        triggerToast(formatImageOptimizationToast(meta, lang), 'success');
      } else {
        triggerToast(lang === 'de' ? 'Logo erfolgreich hochgeladen und optimiert' : 'Logo uploaded and optimized successfully', 'success');
      }
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsHeroUploading(false);
    }
  };

  // Remove Title Image
  const handleRemoveHeroImage = async () => {
    if (!activeCard) return;
    setHeroImageUrl('');
    await syncCardUpdate({ heroImageUrl: '' });
  };

  // Button Image Upload
  const handleButtonImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      triggerToast(
        lang === 'de'
          ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!'
          : 'Only JPG, PNG or WebP images are allowed!',
        'error'
      );
      return;
    }

    setIsBtnImageUploading(true);
    try {
      triggerToast(
        lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...',
        'info'
      );
      const optimizedBlob = await compressImageBeforeUpload(file, 'gallery');
      const url = await uploadFile(activeCard.cardId, optimizedBlob as File, 'button-images');
      setBtnUploadedUrl(url);

      const meta = (optimizedBlob as any).imageMeta;
      const currentMeta = activeCard.imageMeta || {};
      const updatedMeta = meta ? { ...currentMeta, button: meta } : currentMeta;

      await syncCardUpdate({ 
        imageMeta: updatedMeta
      });
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsBtnImageUploading(false);
    }
  };

  // File Action Upload (PDFs, menu guides, brochures, zip, mp3 etc.)
  const handleFileActionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeCard) return;
    setIsBtnFileUploading(true);
    try {
      const file = e.target.files[0];
      // Direct raw upload of documents without image cropping/compression!
      const url = await uploadFile(activeCard.cardId, file, 'documents');
      setBtnActionValue(url);
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setIsBtnFileUploading(false);
    }
  };

  // Save current Profile detail values
  const handleSaveProfile = async () => {
    if (!activeCard) return;
    await syncCardUpdate({
      title: profileName.trim(),
      subtitle: profileSubtitle.trim(),
      description: profileDescription.trim(),
      heroTitle: profileName.trim(),
      heroSubtitle: profileSubtitle.trim(),
      heroDescription: profileDescription.trim(),
      type: profileType as any,
      profileType: profileType,
      coverImageUrl,
      coverOverlayDarken,
      coverImagePosition,
      productMediaType,
      productImageUrl,
      productVideoUrl,
      showProductText,
      productTitle: productTitle.trim(),
      productSubtitle: productSubtitle.trim(),
      productDescription: productDescription.trim(),
      productMediaPosition,
      productHeroSize
    });
    setShowProfileModal(false);
  };

  const openNewButtonDesigner = () => {
    setConfirmingDeleteId(null);
    const defBtn = createDefaultButton(undefined, activeCard?.buttons?.length || 0);
    setEditingButton(defBtn);
    setBtnEditorTab('content');
    setBtnTitle('');
    setBtnIcon('Globe');
    setBtnColor('#F5EFE3');
    setBtnTextColor('#111111');
    setBtnActionType('none');
    setBtnActionValue('');
    setBtnGoldBorder(false);
    setBtnProtected(false);
    setBtnPassword('');
    setBtnPasswordHint('');
    setBtnImageStyle('icon');
    setBtnImageOverlay('dark');
    setBtnUploadedUrl('');
    // Reset Advanced Image Button states
    setBtnImageMode('cover');
    setBtnShowLabel(true);
    setBtnLabelOverlay(false);
    setBtnLabelPosition('bottom');
    setBtnDarkOverlay(true);
    setBtnShowBorder(true);
    setBtnBorderWidth('thin');
    setBtnBorderColor('#A855F7');
    setBtnBorderStyle('solid');
    setHideTestModal(false);
    setShowButtonModal(true);
  };

  // Open Button modal for creating list entry
  const handleOpenAddButton = () => {
    openNewButtonDesigner();
  };

  // Open Button modal for editing existing element
  const handleOpenEditButton = (btn: CardButton) => {
    if (DEBUG_BUTTON_EDITOR) {
      console.log("BUTTON EDIT CLICK", btn);
      triggerToast("Button-Klick erkannt: " + (btn?.title || "Namenloser Button"), "info");
    }
    setConfirmingDeleteId(null);
    const safeBtn = normalizeButton(btn || {});
    setEditingButton(safeBtn);
    setBtnEditorTab('content');

    try {
      setBtnTitle(safeBtn.title || '');
      setBtnIcon(safeBtn.iconId || safeBtn.icon || 'Globe');
      setBtnColor(safeBtn.backgroundColor || safeBtn.bgColor || '#F5EFE3');
      setBtnTextColor(safeBtn.textColor || '#1A1A1A');
      setBtnActionType(safeBtn.actionType || 'url');

      setBtnActionValue(safeBtn.actionValue || '');
      setBtnGoldBorder(!!safeBtn.hasGoldBorder);
      setBtnProtected(!!safeBtn.isProtected);
      setBtnPassword(safeBtn.isProtected ? '••••••••' : '');
      setBtnPasswordHint(safeBtn.passwordHint || '');
      setBtnImageStyle(safeBtn.imageStyle || 'icon');
      setBtnImageOverlay((safeBtn.imageOverlay || 'dark') as any);
      setBtnUploadedUrl(safeBtn.imageUrl || '');
      // Hydrate Advanced Image Button states
      setBtnImageMode(safeBtn.imageMode || 'cover');
      setBtnShowLabel(safeBtn.showLabel !== false);
      setBtnLabelOverlay(!!safeBtn.labelOverlay);
      setBtnLabelPosition(safeBtn.labelPosition || 'bottom');
      setBtnDarkOverlay(safeBtn.darkOverlay !== false);
      setBtnShowBorder(safeBtn.showBorder !== false);
      setBtnBorderWidth((safeBtn.borderWidth || 'none') as any);
      setBtnBorderColor(safeBtn.borderColor || '#A855F7');
      setBtnBorderStyle(safeBtn.borderStyle || 'solid');
    } catch (outerErr) {
      console.error("Defensive catch triggered during handleOpenEditButton hydration: ", outerErr);
    }

    setHideTestModal(false);
    setShowButtonModal(true);

    if (safeBtn.isProtected && safeBtn.id && db) {
      getDoc(doc(db, 'protected_buttons', safeBtn.id))
        .then((snap) => {
          if (snap.exists()) {
            const secretData = snap.data();
            setBtnActionValue(secretData.actionValue || '');
            setBtnPassword('••••••••');
            setBtnPasswordHint(secretData.passwordHint || safeBtn.passwordHint || '');
            
            // Hydrate the editingButton state so that the ButtonDesigner receives all hidden properties
            setEditingButton({
              ...safeBtn,
              actionValue: secretData.actionValue || '',
              uploadedFile: secretData.uploadedFile || safeBtn.uploadedFile,
              downloadItems: secretData.downloadItems || safeBtn.downloadItems,
              passwordHash: secretData.passwordHash || safeBtn.passwordHash,
              buttonPassword: secretData.password || safeBtn.buttonPassword || '••••••••'
            });
          }
        })
        .catch((err) => {
          console.error('Error fetching secret payload in handleOpenEditButton: ', err);
        });
    }
  };

  // Save changes to card buttons using the designer payload
  const handleSaveButtonFromDesigner = async (
    payload: CardButton,
    cleanFields: { passwordHash?: string; rawPassword?: string; imageMeta?: any }
  ) => {
    if (!activeCard) return;

    const updated = [...(activeCard.buttons || [])];
    const buttonId = payload.id;
    const existingBtn = (activeCard.buttons || []).find(b => b.id === buttonId);

    // Handle Password protection details
    if (payload.isProtected) {
      if (cleanFields.passwordHash) {
        payload.passwordHash = cleanFields.passwordHash;
      } else if (existingBtn?.passwordHash) {
        payload.passwordHash = existingBtn.passwordHash;
      }

      // Safe write to protected_buttons collection containing all genuine routing attributes
      try {
        const secretObj: any = {
          id: buttonId,
          cardId: activeCard.cardId,
          ownerId: user?.uid || '',
          passwordHint: payload.passwordHint || '',
          actionType: payload.actionType,
          actionValue: payload.actionValue || '',
          uploadedFile: payload.uploadedFile || null,
          downloadItems: payload.downloadItems || null
        };

        if (cleanFields.passwordHash) {
          secretObj.passwordHash = cleanFields.passwordHash;
          await setDoc(doc(db, 'protected_buttons', buttonId), secretObj);
        } else {
          if (existingBtn?.passwordHash) {
            secretObj.passwordHash = existingBtn.passwordHash;
          }
          await setDoc(doc(db, 'protected_buttons', buttonId), secretObj, { merge: true });
        }
      } catch (err) {
        console.warn("Could not write falling copy to protected_buttons collection: ", err);
      }
    } else {
      // Remove protected document if it was protected before
      try {
        await deleteDoc(doc(db, 'protected_buttons', buttonId));
      } catch (_) {}
      payload.passwordHash = '';
    }

    const idx = updated.findIndex((b) => b.id === buttonId);
    if (idx !== -1) {
      updated[idx] = payload;
    } else {
      const limit = getButtonsLimit();
      if (updated.length >= limit) {
        let upgradeKey = 'buttons_pro';
        if (limit >= 20) upgradeKey = 'buttons_business';
        setUpgradeFeatureKey(upgradeKey);
        setShowUpgradeModal(true);
        return;
      }
      payload.position = updated.length;
      updated.push(payload);
    }

    // Strictly sanitize all buttons for the public card config before saving to Firestore
    const sanitizedButtons = updated.map((btn) => sanitizeButtonForFirestore(btn));

    const currentMeta = activeCard.imageMeta || {};
    let updatedMeta = currentMeta;
    if (cleanFields.imageMeta) {
      updatedMeta = { ...currentMeta, [`button_${buttonId}`]: cleanFields.imageMeta };
    }

    await syncCardUpdate({
      buttons: sanitizedButtons,
      ...(cleanFields.imageMeta ? { imageMeta: updatedMeta } : {})
    });
  };

  // Delete individual button completely
  const handleDeleteButtonImmediate = async (btnId: string) => {
    if (!activeCard) return;
    const filtered = (activeCard.buttons || []).filter((b) => b.id !== btnId);
    try {
      await deleteDoc(doc(db, 'protected_buttons', btnId));
    } catch (_) {}

    await syncCardUpdate({ buttons: filtered });
  };

  // Duplicate an existing button
  const handleDuplicateButton = async (btn: CardButton) => {
    if (!activeCard) return;
    const currentButtons = activeCard.buttons || [];
    const limit = getButtonsLimit();
    if (currentButtons.length >= limit) {
      let upgradeKey = 'buttons_pro';
      if (limit >= 20) upgradeKey = 'buttons_business';
      setUpgradeFeatureKey(upgradeKey);
      setShowUpgradeModal(true);
      return;
    }
    
    const newId = Math.random().toString(36).substring(2, 11);
    
    // Copy the button with a new position at the end of the list and a new ID
    const maxPosition = currentButtons.reduce((max, b) => Math.max(max, b.position || 0), -1);
    
    const duplicated: CardButton = {
      ...btn,
      id: newId,
      position: maxPosition + 1,
      title: btn.title ? `${btn.title} (Kopie)` : (lang === 'de' ? 'Kopie' : 'Copy'),
    };
    
    // Check if the source button is PIN/password protected: duplicate Firestore document if so
    if (btn.isProtected) {
      try {
        const docSnap = await getDoc(doc(db, 'protected_buttons', btn.id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          await setDoc(doc(db, 'protected_buttons', newId), data);
        }
      } catch (err) {
        console.error('Error duplicating protected button meta:', err);
      }
    }
    
    const updated = [...currentButtons, duplicated];
    const sanitizedButtons = updated.map((b) => sanitizeButtonForFirestore(b));
    await syncCardUpdate({ buttons: sanitizedButtons });
  };

  // Copy unique Card URL to clipboard
  const handleCopyLink = () => {
    if (!activeCard) return;
    const url = getPublicCardUrl(activeCard.slug);
    const successful = copyTextToClipboard(url);
    if (successful) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      console.error('Link copy failed');
    }
  };

  // --- REORDERING & DRAG-AND-DROP HANDLERS ---
  
  // Touch timer for mobile long-press
  const handleTouchStart = (btnId: string) => {
    if (isSortingMode) return;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    
    touchTimerRef.current = setTimeout(() => {
      setIsSortingMode(true);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch (_) {}
      }
    }, 350); // 350ms hold triggers sorting jiggle mode
  };

  const handleTouchEndOrCancel = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleDragStart = (e: React.DragEvent, btnId: string) => {
    setIsSortingMode(true);
    setDraggedButtonId(btnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', btnId);
  };

  const handleDragOver = (e: React.DragEvent, btnId: string) => {
    e.preventDefault();
    if (draggedButtonId && draggedButtonId !== btnId) {
      setDragOverButtonId(btnId);
    }
  };

  const handleDragEnd = () => {
    setDraggedButtonId(null);
    setDragOverButtonId(null);
    setIsSortingMode(false); // Reset sorting state of cards when released
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedButtonId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId || !activeCard) {
      handleDragEnd();
      setIsSortingMode(false);
      return;
    }

    const updated = [...(activeCard.buttons || [])];
    const sourceIndex = updated.findIndex((b) => b.id === sourceId);
    const targetIndex = updated.findIndex((b) => b.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Reorder buttons dynamically
      const [movedBtn] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedBtn);

      // Reassign position values consecutively
      const finalButtons = updated.map((btn, idx) => sanitizeButtonForFirestore({
        ...btn,
        position: idx
      }));

      await syncCardUpdate({ buttons: finalButtons });
    }

    handleDragEnd();
    setIsSortingMode(false); // Reset sorting state after drop
  };

  // Tactile touch-based / mouse alternate Tap-to-Swap for accessibility and safe mobile sorting
  const handleButtonTapOrClickInSortMode = async (btnId: string) => {
    if (!activeCard) return;

    if (!swapSelectionId) {
      setSwapSelectionId(btnId);
    } else {
      if (swapSelectionId === btnId) {
        setSwapSelectionId(null);
        return;
      }

      // Perform direct swap between swapSelectionId and current btnId
      const updated = [...(activeCard.buttons || [])];
      const indexA = updated.findIndex((b) => b.id === swapSelectionId);
      const indexB = updated.findIndex((b) => b.id === btnId);

      if (indexA !== -1 && indexB !== -1) {
        const itemA = updated[indexA];
        const itemB = updated[indexB];

        // Swap position properties
        const posA = itemA.position;
        const posB = itemB.position;

        updated[indexA] = { ...itemB, position: posA };
        updated[indexB] = { ...itemA, position: posB };

        // Sort to maintain order consistency
        updated.sort((a, b) => a.position - b.position);

        const sanitized = updated.map((b) => sanitizeButtonForFirestore(b));
        await syncCardUpdate({ buttons: sanitized });
        setSwapSelectionId(null);
      }
    }
  };

  // Dynamically map and display Lucide Icons
  const renderIcon = (iconId: string, color: string, size = 20) => {
    const IconComponent = (LucideIcons as any)[iconId];
    if (IconComponent) {
      return <IconComponent size={size} style={{ color }} />;
    }
    return <LucideIcons.Globe size={size} style={{ color }} />;
  };

  // --- DETAILED LAYOUT AND DESIGN FORMS FOR DESKTOP AND MODALS ---
  const renderBackgroundForm = () => {
    return (
      <div className="space-y-5 text-sans text-stone-200">
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Hintergrund-Typ</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                setBgType('color');
                await syncCardUpdate({ backgroundType: 'color' });
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${bgType === 'color' ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]' : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'}`}
            >
              <LucideIcons.Droplet size={14} />
              Farbe
            </button>
            <button
              onClick={async () => {
                if (!isCustomBgEnabled()) {
                  setUpgradeFeatureKey('fullAppBackgroundImage');
                  setShowUpgradeModal(true);
                  return;
                }
                setBgType('image');
                await syncCardUpdate({ backgroundType: 'image' });
              }}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${bgType === 'image' ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]' : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'}`}
            >
              <LucideIcons.Image size={14} />
              Hintergrundbild
            </button>
          </div>
        </div>

        {bgType === 'color' ? (
          <div className="space-y-4">
            <div className="space-y-3 bg-stone-900/60 p-3.5 rounded-xl border border-stone-850">
              {/* Custom Color Range Picker */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Farbe / Verlauf wählen</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor.startsWith('linear-gradient') ? '#1C1C1E' : (bgColor || '#1C1C1E')}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setBgColor(val);
                      await syncCardUpdate({ backgroundColor: val });
                    }}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-stone-400">Eigene Farbe</span>
                </div>
              </div>

              {/* Solid Presets */}
              <div>
                <span className="block text-[9px] uppercase font-semibold text-stone-450 mb-1.5">Einfarbige Presets</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive = bgColor === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={async () => {
                          setBgColor(preset.value);
                          await syncCardUpdate({ backgroundColor: preset.value });
                        }}
                        className={`h-8 rounded-lg border relative transition ${isActive ? 'border-[#A855F7]' : 'border-stone-800 hover:border-stone-700'}`}
                        style={{ background: preset.value }}
                        title={preset.name}
                      >
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                            <LucideIcons.Check size={11} className="text-[#A855F7]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gradient Presets */}
              <div>
                <span className="block text-[9px] uppercase font-semibold text-stone-450 mb-1.5">Premium Farbverläufe</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRADIENT_PRESETS.map((preset) => {
                    const isActive = bgColor === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={async () => {
                          setBgColor(preset.value);
                          await syncCardUpdate({ backgroundColor: preset.value });
                        }}
                        className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-medium truncate relative transition ${
                          isActive ? 'border-[#A855F7] text-[#A855F7]' : 'border-stone-800 text-stone-350 hover:border-stone-750'
                        }`}
                        style={{ background: preset.value }}
                        title={preset.name}
                      >
                        <span className="mix-blend-difference filter invert text-white scale-95 block">
                          {preset.name}
                        </span>
                        {isActive && (
                          <div className="absolute inset-y-0 right-1.5 flex items-center">
                            <LucideIcons.Check size={10} className="text-[#A855F7]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Gradient String Entry */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Eigener CSS-Verlauf / Code</label>
                <input
                  type="text"
                  value={bgColor}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setBgColor(val);
                    await syncCardUpdate({ backgroundColor: val });
                  }}
                  placeholder="z.B. linear-gradient(135deg, #121212 0%, #45391F 100%)"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Hintergrundbild hochladen</label>
              <div className="relative border border-dashed border-stone-800 rounded-xl p-6 bg-stone-950 flex flex-col items-center justify-center text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={isBgUploading}
                />
                <LucideIcons.Upload size={22} className="text-[#A855F7] mb-2" />
                <span className="text-[11px] text-stone-300 font-semibold">Tippe zum Auswählen</span>
                <span className="text-[9px] text-stone-500 mt-1 font-sans">PNG, JPG bis 2MB</span>
              </div>
            </div>

            {isBgUploading && (
              <div className="py-2 text-center text-xs text-stone-400 font-mono flex items-center justify-center gap-1.5 bg-stone-950/40 rounded-xl">
                <LucideIcons.Loader className="animate-spin text-[#A855F7]" size={14} />
                <span>Wird komprimiert & hochgeladen...</span>
              </div>
            )}

            {bgImageUrl && (
              <div className="space-y-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-850">
                <div className="relative border border-stone-800 rounded-xl p-2 flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-850">
                    <img src={bgImageUrl} alt="Background Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={handleRemoveBgImage}
                    className="bg-red-950/50 hover:bg-red-900 border border-red-900 text-red-350 py-1.5 px-3 rounded-lg text-[10px] font-bold"
                  >
                    Bild löschen
                  </button>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-stone-850/60">
                  <label className="block text-[10px] uppercase font-bold text-[#A855F7] tracking-wider mb-1">Displaygröße / Ausrichtung des Bildes</label>
                  <select
                    value={activeCard?.backgroundImageFit || 'cover'}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await syncCardUpdate({ backgroundImageFit: val as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="cover">Ausfüllen (Cover)</option>
                    <option value="contain">Einpassen (Contain)</option>
                    <option value="repeat">Nebeneinander (Kachel/Repeat)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderUnifiedProfileForm = () => {
    return (
      <div className="space-y-5 text-sans text-stone-200">
        {/* Core Profile Type (Single option representation) */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Profil-Layouttyp</label>
          <div className="w-full bg-stone-950/40 border border-stone-850 px-3.5 py-2.5 rounded-xl text-xs text-[#A855F7] font-bold flex items-center gap-2">
            <LucideIcons.Layers size={13} />
            <span>Profilseite (Standardlayout - Voll konfigurierbar)</span>
          </div>
        </div>

        {/* Banner/Header Media Selector for layouts */}
        <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-850 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] block">
            Kopfbereich Medienhintergrund
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={async () => {
                setProductMediaType('image');
                await syncCardUpdate({ heroBackgroundType: 'image', productMediaType: 'image' });
              }}
              className={`py-2 px-1 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                (activeCard?.heroBackgroundType === 'image' || activeCard?.productMediaType === 'image' || (!activeCard?.heroBackgroundType && coverImageUrl))
                  ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              <LucideIcons.Image size={12} />
              Bilddatei
            </button>
            <button
              type="button"
              onClick={async () => {
                setProductMediaType('video');
                await syncCardUpdate({ heroBackgroundType: 'video', productMediaType: 'video' });
              }}
              className={`py-2 px-1 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                (activeCard?.heroBackgroundType === 'video' || activeCard?.productMediaType === 'video')
                  ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              <LucideIcons.Video size={12} />
              Video Link
            </button>
            <button
              type="button"
              onClick={async () => {
                await syncCardUpdate({ heroBackgroundType: 'color', productMediaType: 'image', coverImageUrl: '', productImageUrl: '', productVideoUrl: '', heroVideoUrl: '' });
                setCoverImageUrl('');
                setProductImageUrl('');
                setProductVideoUrl('');
              }}
              className={`py-2 px-1 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                activeCard?.heroBackgroundType === 'color'
                  ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              <LucideIcons.Palette size={12} />
              Nur Farbe
            </button>
          </div>

          {(activeCard?.heroBackgroundType === 'video' || activeCard?.productMediaType === 'video') ? (
            <div className="space-y-2 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
              <label className="block text-[9px] uppercase font-bold text-stone-450">Video Link / URL</label>
              <input
                type="text"
                value={productVideoUrl}
                onChange={async (e) => {
                  const val = e.target.value;
                  setProductVideoUrl(val);
                  await syncCardUpdate({ productVideoUrl: val, heroVideoUrl: val, heroBackgroundType: 'video', productMediaType: 'video' });
                }}
                placeholder="YouTube, Vimeo oder MP4-URL..."
                className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
              />
              {productVideoUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#A855F7] font-semibold">Video aktiv</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setProductVideoUrl('');
                      await syncCardUpdate({ productVideoUrl: '', heroVideoUrl: '', heroBackgroundType: 'image' });
                    }}
                    className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Entfernen
                  </button>
                </div>
              )}
            </div>
          ) : activeCard?.heroBackgroundType === 'color' ? (
            <div className="space-y-4 bg-stone-900/60 p-3.5 rounded-xl border border-stone-850">
              <div className="space-y-3">
                {/* Custom Color Range Picker */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Farbe / Verlauf wählen</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeCard?.heroBackgroundColor?.startsWith('linear-gradient') ? '#121212' : (activeCard?.heroBackgroundColor || '#121212')}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await syncCardUpdate({ heroBackgroundColor: val });
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono text-stone-400">Eigene Farbe</span>
                  </div>
                </div>

                {/* Solid Presets */}
                <div>
                  <span className="block text-[9px] uppercase font-semibold text-stone-450 mb-1.5">Einfarbige Presets</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isActive = (activeCard?.heroBackgroundColor || '#111111') === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={async () => {
                            await syncCardUpdate({ heroBackgroundColor: preset.value });
                          }}
                          className={`h-8 rounded-lg border relative transition ${isActive ? 'border-[#A855F7]' : 'border-stone-800 hover:border-stone-700'}`}
                          style={{ background: preset.value }}
                          title={preset.name}
                        >
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                              <LucideIcons.Check size={11} className="text-[#A855F7]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gradient Presets */}
                <div>
                  <span className="block text-[9px] uppercase font-semibold text-stone-450 mb-1.5">Premium Farbverläufe</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GRADIENT_PRESETS.map((preset) => {
                      const isActive = (activeCard?.heroBackgroundColor || '') === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={async () => {
                            await syncCardUpdate({ heroBackgroundColor: preset.value });
                          }}
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium truncate relative transition ${
                            isActive ? 'border-[#A855F7] text-[#A855F7]' : 'border-stone-800 text-stone-350 hover:border-stone-750'
                          }`}
                          style={{ background: preset.value }}
                          title={preset.name}
                        >
                          <span className="mix-blend-difference filter invert text-white scale-95 block">
                             {preset.name}
                          </span>
                          {isActive && (
                            <div className="absolute inset-y-0 right-1.5 flex items-center">
                              <LucideIcons.Check size={10} className="text-[#A855F7]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Gradient String Entry */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Eigener CSS-Verlauf / Code</label>
                  <input
                    type="text"
                    value={activeCard?.heroBackgroundColor || ''}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await syncCardUpdate({ heroBackgroundColor: val });
                    }}
                    placeholder="z.B. linear-gradient(135deg, #121212 0%, #45391F 100%)"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-stone-600 focus:outline-none focus:border-[#A855F7]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-black border border-stone-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <LucideIcons.Image size={18} className="text-stone-600" />
                  )}
                </div>
                
                <div className="relative flex-grow">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isCoverUploading}
                  />
                  <div className="bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-350 text-xs font-bold text-center py-2 px-3 rounded-xl cursor-pointer">
                    {isCoverUploading ? 'Lädt...' : 'Bild hochladen'}
                  </div>
                </div>

                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-400 p-2 rounded-xl transition"
                  >
                    <LucideIcons.Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sizing and alignment for Layout cover */}
          {activeCard?.heroBackgroundType !== 'color' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1 mt-1">Fokuslage</label>
                <select
                  value={coverImagePosition}
                  onChange={async (e) => {
                    const val = e.target.value as any;
                    setCoverImagePosition(val);
                    await syncCardUpdate({ coverImagePosition: val, productMediaPosition: val, heroMediaPosition: val });
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
                >
                  <option value="top">Oben (Top)</option>
                  <option value="center">Mitte (Center)</option>
                  <option value="bottom">Unten (Bottom)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#A855F7] tracking-wider mb-1 mt-1">Displaygröße</label>
                <select
                  value={activeCard?.heroSize || 'normal'}
                  onChange={async (e) => {
                    const val = e.target.value as any;
                    await syncCardUpdate({ heroSize: val, productHeroSize: val });
                  }}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
                >
                  <option value="compact">Kompakt</option>
                  <option value="normal">Normal</option>
                  <option value="large">Großflächig</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / Logo Uploader and styling properties */}
        <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-850 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] block">
              Logo / Profilbild konfigurieren
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-stone-400">Aktivieren</span>
              <button
                type="button"
                onClick={async () => {
                  const current = activeCard?.showProfileImage !== false;
                  await syncCardUpdate({ showProfileImage: !current });
                }}
                className={`w-9 h-5 rounded-full flex items-center transition-colors p-[2px] ${
                  (activeCard?.showProfileImage !== false) ? 'bg-[#A855F7]' : 'bg-stone-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                  (activeCard?.showProfileImage !== false) ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 bg-stone-900 border border-stone-800 overflow-hidden flex items-center justify-center relative flex-shrink-0 ${ (activeCard?.profileImageShape || 'circle') === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <LucideIcons.User size={18} className="text-stone-600" />
              )}
            </div>
            
            <div className="relative flex-grow">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={isProfileUploading}
              />
              <div className="bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 text-xs font-bold text-center py-2 px-3 rounded-xl cursor-pointer">
                {isProfileUploading ? 'Wird geladen...' : 'Bild hochladen'}
              </div>
            </div>

            {profileImageUrl && (
              <button
                type="button"
                onClick={handleRemoveProfileImage}
                className="bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-400 p-2 rounded-xl transition"
              >
                <LucideIcons.Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Custom Shapes for advanced design */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Avatar Form</label>
              <select
                value={activeCard?.profileImageShape || 'circle'}
                onChange={async (e) => {
                  const shape = e.target.value as any;
                  await syncCardUpdate({ profileImageShape: shape });
                }}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
              >
                <option value="circle">Rund (Circle)</option>
                <option value="rounded">Abgerundet (Squircle)</option>
                <option value="square">Eckig (Square)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Positionierung</label>
              <select
                value={activeCard?.profileImagePosition || 'center'}
                onChange={async (e) => {
                  const pos = e.target.value as any;
                  await syncCardUpdate({ profileImagePosition: pos });
                }}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1.5 px-2.5 text-xs text-white"
              >
                <option value="center">Mittig (Klassisch)</option>
                <option value="bottom-left">Links unten</option>
                <option value="bottom-right">Rechts unten</option>
                <option value="top-left">Links oben</option>
                <option value="top-right">Rechts oben</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Area (Title, Subtitle, bio) */}
        <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-850 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] block">Profil-Texte</span>
          
          <div>
            <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Anzeigename / Titel</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Geben Sie einen Namen ein..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Slogan / Untertitel</label>
            <input
              type="text"
              value={profileSubtitle}
              onChange={(e) => setProfileSubtitle(e.target.value)}
              placeholder="Berufsbezeichnung / Slogan..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#A855F7]"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Kurzbeschreibung (Biografie)</label>
            <textarea
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              placeholder="Erzähle deinen Besuchern kurz etwas über dich..."
              rows={3}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#A855F7] resize-none"
            />
          </div>

          {/* Per-field design options for Title, Subtitle, Description in sidebar */}
          <div className="space-y-3 pt-3 border-t border-stone-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-[#A855F7] block">Text-Gestaltung pro Feld</span>
            
            {/* Title */}
            <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-850 space-y-2">
              <span className="text-[9px] font-bold uppercase text-[#A855F7]">1. Anzeigename / Titel</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftart</label>
                  <select
                    value={activeCard?.heroTitleFontStyle || activeCard?.heroFontStyle || 'modern'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroTitleFontStyle: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="modern">Modern (Standard)</option>
                    <option value="elegant">Elegant (Serif)</option>
                    <option value="bold">Markant / Fett</option>
                    <option value="minimal">Minimalistisch (Mono)</option>
                    <option value="montserrat">Montserrat (Geometrisch)</option>
                    <option value="cinzel">Cinzel (Römisch)</option>
                    <option value="grotesk">Space Grotesk (Tech)</option>
                    <option value="playful">Pacifico (Schreibschrift)</option>
                    <option value="bebas">Bebas Neue (Extrem Fett)</option>
                    <option value="typewriter">Courier (Typewriter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftfarbe</label>
                  <select
                    value={activeCard?.heroTitleTextColor || activeCard?.heroTextColor || 'white'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroTitleTextColor: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="white">Weiß</option>
                    <option value="cream">Creme-Weiß</option>
                    <option value="gold">Edles Gold</option>
                    <option value="silver">Platin-Silber</option>
                    <option value="bronze">Warmes Bronze</option>
                    <option value="emerald">Smaragd-Grün</option>
                    <option value="ruby">Rubin-Rot</option>
                    <option value="sapphire">Saphir-Blau</option>
                    <option value="purple">Vibrantes Violett</option>
                    <option value="orange">Vibrantes Orange</option>
                    <option value="pink">Sanftes Pink</option>
                    <option value="mint">Pastell-Minze</option>
                    <option value="peach">Süßer Pfirsich</option>
                    <option value="dark">Dunkelgrau</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-850 space-y-2">
              <span className="text-[9px] font-bold uppercase text-[#A855F7]">2. Untertitel</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftart</label>
                  <select
                    value={activeCard?.heroSubtitleFontStyle || activeCard?.heroFontStyle || 'modern'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroSubtitleFontStyle: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="modern">Modern (Standard)</option>
                    <option value="elegant">Elegant (Serif)</option>
                    <option value="bold">Markant / Fett</option>
                    <option value="minimal">Minimalistisch (Mono)</option>
                    <option value="montserrat">Montserrat (Geometrisch)</option>
                    <option value="cinzel">Cinzel (Römisch)</option>
                    <option value="grotesk">Space Grotesk (Tech)</option>
                    <option value="playful">Pacifico (Schreibschrift)</option>
                    <option value="bebas">Bebas Neue (Extrem Fett)</option>
                    <option value="typewriter">Courier (Typewriter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftfarbe</label>
                  <select
                    value={activeCard?.heroSubtitleTextColor || 'gold'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroSubtitleTextColor: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="gold">Edles Gold</option>
                    <option value="white">Weiß</option>
                    <option value="cream">Creme-Weiß</option>
                    <option value="silver">Platin-Silber</option>
                    <option value="bronze">Warmes Bronze</option>
                    <option value="emerald">Smaragd-Grün</option>
                    <option value="ruby">Rubin-Rot</option>
                    <option value="sapphire">Saphir-Blau</option>
                    <option value="purple">Vibrantes Violett</option>
                    <option value="orange">Vibrantes Orange</option>
                    <option value="pink">Sanftes Pink</option>
                    <option value="mint">Pastell-Minze</option>
                    <option value="peach">Süßer Pfirsich</option>
                    <option value="dark">Dunkelgrau</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-850 space-y-2">
              <span className="text-[9px] font-bold uppercase text-[#A855F7]">3. Biografie / Beschreibung</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftart</label>
                  <select
                    value={activeCard?.heroDescFontStyle || activeCard?.heroFontStyle || 'modern'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroDescFontStyle: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="modern">Modern (Standard)</option>
                    <option value="elegant">Elegant (Serif)</option>
                    <option value="bold">Markant / Fett</option>
                    <option value="minimal">Minimalistisch (Mono)</option>
                    <option value="montserrat">Montserrat (Geometrisch)</option>
                    <option value="cinzel">Cinzel (Römisch)</option>
                    <option value="grotesk">Space Grotesk (Tech)</option>
                    <option value="playful">Pacifico (Schreibschrift)</option>
                    <option value="bebas">Bebas Neue (Extrem Fett)</option>
                    <option value="typewriter">Courier (Typewriter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-stone-400 mb-0.5">Schriftfarbe</label>
                  <select
                    value={activeCard?.heroDescTextColor || 'white'}
                    onChange={async (e) => {
                      await syncCardUpdate({ heroDescTextColor: e.target.value as any });
                    }}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                  >
                    <option value="white">Weiß</option>
                    <option value="cream">Creme-Weiß</option>
                    <option value="gold">Edles Gold</option>
                    <option value="silver">Platin-Silber</option>
                    <option value="bronze">Warmes Bronze</option>
                    <option value="emerald">Smaragd-Grün</option>
                    <option value="ruby">Rubin-Rot</option>
                    <option value="sapphire">Saphir-Blau</option>
                    <option value="purple">Vibrantes Violett</option>
                    <option value="orange">Vibrantes Orange</option>
                    <option value="pink">Sanftes Pink</option>
                    <option value="mint">Pastell-Minze</option>
                    <option value="peach">Süßer Pfirsich</option>
                    <option value="dark">Dunkelgrau</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save indicators */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSaveProfile}
            className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-[#1A1A1A] font-extrabold text-xs py-3 px-5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow"
          >
            <LucideIcons.Check size={14} />
            Einträge Speichern
          </button>
        </div>
      </div>
    );
  };

  const renderButtonsForm = () => {
    // If we're editing or creating a button
    if (false && showButtonModal) {
      return (
        <div className="space-y-4 font-sans text-stone-200">
          <div className="flex items-center justify-between pb-3 border-b border-stone-850">
            <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <LucideIcons.Edit3 size={14} className="text-[#A855F7]" />
              {editingButton ? 'Button Bearbeiten' : 'Neuer Button'}
            </span>
            <button
              onClick={() => setShowButtonModal(false)}
              className="text-stone-450 hover:text-white transition text-[10px] font-bold tracking-widest uppercase flex items-center gap-1"
            >
              <LucideIcons.ArrowLeft size={12} />
              Zurück
            </button>
          </div>

          {/* Button Details Form */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Button Titel (Bezeichnung)</label>
              <input
                type="text"
                value={btnTitle}
                onChange={(e) => setBtnTitle(e.target.value)}
                placeholder="z.B. Portfolio ansehen"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Aktionstyp</label>
              <select
                value={btnActionType}
                onChange={(e) => setBtnActionType(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="url">Web-Link (Standard URL)</option>
                <option value="email">E-Mail schreiben (mailto)</option>
                <option value="phone">Telefonnummer anrufen (tel)</option>
                <option value="whatsapp">Direkter WhatsApp-Chat</option>
                <option value="vcard">Kontaktkarte herunterladen</option>
              </select>
            </div>

            {btnActionType !== 'vcard' && (
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Aktions-Link / Wert</label>
                <input
                  type="text"
                  value={btnActionValue}
                  onChange={(e) => setBtnActionValue(e.target.value)}
                  placeholder={
                    btnActionType === 'email' ? 'hallo@domain.de' :
                    btnActionType === 'phone' ? '+49 170 123456' :
                    'https://domain.de/seite'
                  }
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            )}

            {/* Design & Icons selection block */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Symbol (Icon)</label>
                <select
                  value={btnIcon}
                  onChange={(e) => setBtnIcon(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-xs text-stone-200"
                >
                  {['Globe', 'User', 'Mail', 'Phone', 'Camera', 'Video', 'MessageSquare', 'Layers', 'FileText', 'Calendar', 'Heart', 'Award', 'MapPin', 'ShoppingBag'].map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Border Gold Rand</label>
                <div className="flex items-center h-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={btnGoldBorder}
                      onChange={(e) => setBtnGoldBorder(e.target.checked)}
                      className="rounded border-stone-700 text-[#A855F7] focus:ring-[#A855F7] bg-stone-800 w-4 h-4"
                    />
                    <span className="text-xs text-stone-300 font-sans">Goldrahmen</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Color Selectors */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-850">
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Hintergrundfarbe</label>
                <input
                  type="color"
                  value={btnColor}
                  onChange={(e) => setBtnColor(e.target.value)}
                  className="w-full h-8 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer p-0.5"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-455 mb-1">Schriftfarbe</label>
                <input
                  type="color"
                  value={btnTextColor}
                  onChange={(e) => setBtnTextColor(e.target.value)}
                  className="w-full h-8 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer p-0.5"
                />
              </div>
            </div>

            {/* Passwort Schutz details */}
            <div className="p-3 bg-stone-950/50 rounded-xl border border-stone-855 space-y-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={btnProtected}
                  onChange={(e) => {
                    if (!isPasswordButtonsEnabled()) {
                      setUpgradeFeatureKey('passwordProtectedButtons');
                      setShowUpgradeModal(true);
                      return;
                    }
                    setBtnProtected(e.target.checked);
                  }}
                  className="rounded border-stone-700 text-[#A855F7] focus:ring-[#A855F7] bg-stone-800 w-4 h-4"
                />
                <span className="text-xs text-[#C83E4C] font-semibold">Passwortschutz einrichten</span>
              </label>

              {btnProtected && (
                <div className="animate-fade-in">
                  <input
                    type="password"
                    placeholder="Zugangsschutz-Passwort..."
                    value={btnPassword}
                    onChange={(e) => setBtnPassword(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            {editingButton && (
              <button
                onClick={() => handleDeleteButtonImmediate(editingButton.id)}
                className="bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-350 font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                Löschen
              </button>
            )}
            <button
              onClick={() => {}}
              className="flex-grow bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <LucideIcons.CheckCircle size={14} />
              Sichern
            </button>
          </div>
        </div>
      );
    }

    // Default button tiles list
    return (
      <div className="space-y-4 font-sans text-[#EAEAEA]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-stone-450 tracking-wider">Erstellte Kacheln</span>
        </div>

        {/* Dynamic button blocks matching cream theme styling constraint */}
        <div className="grid grid-cols-2 gap-3">
          {(activeCard.buttons || []).map((btn) => (
            <div
              key={btn.id}
              onClick={() => handleOpenEditButton(btn)}
              className="relative cursor-pointer aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-[#A855F7]/20 bg-[#FDFBF7] hover:bg-[#FAF7F0] hover:scale-[1.03] transition-all duration-155 p-3 shadow group text-stone-900"
            >
              {/* Floating edit pencil */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#A855F7] text-stone-950 p-1 rounded-full shadow">
                <LucideIcons.Edit2 size={9} />
              </div>

              {/* Floating duplicate button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateButton(btn);
                }}
                title={lang === 'de' ? 'Kachel duplizieren' : 'Duplicate tile'}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 hover:bg-stone-850 hover:border-stone-750 text-[#A855F7] p-1.5 rounded-full shadow border border-stone-800 z-10"
              >
                <LucideIcons.Copy size={9} />
              </button>

              <div className="w-8 h-8 rounded-full border border-stone-200 bg-stone-100 flex items-center justify-center shadow-inner">
                {renderIcon(btn.icon || btn.iconId || 'Sparkles', '#1A1A1A', 15)}
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-850 truncate text-center w-full block">
                {btn.title || (lang === 'de' ? 'Ohne Titel' : 'Untitled')}
              </span>

              {btn.isProtected && (
                <div className="absolute bottom-2 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded text-[7px] text-red-700 uppercase font-black tracking-widest flex items-center gap-0.5">
                  <LucideIcons.Lock size={7} />
                  Safe
                </div>
              )}
            </div>
          ))}

          {/* Add tile */}
          <button
            onClick={handleOpenAddButton}
            className="aspect-square rounded-2xl bg-stone-900 border border-dashed border-[#A855F7]/45 hover:border-[#A855F7] hover:bg-stone-905 transition flex flex-col items-center justify-center gap-1 p-3 text-stone-300"
          >
            <div className="w-8 h-8 rounded-full bg-stone-950 text-[#A855F7] flex items-center justify-center border border-stone-800 shadow-inner">
              <LucideIcons.Plus size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">Hinzufügen</span>
          </button>
        </div>
      </div>
    );
  };

  const renderShareForm = () => {
    return (
      <div className="space-y-4 text-sans text-stone-200">
        <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">Card-Link kopieren</label>
        
        <div className="flex items-center gap-2 bg-stone-900 p-2.5 rounded-xl border border-stone-800">
          <span className="text-xs font-mono text-[#A855F7] truncate select-all">{currentSlugUrl}</span>
          <button
            onClick={handleCopyLink}
            className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-xs font-extrabold py-1.5 px-3 rounded-lg transition shrink-0"
          >
            {copiedLink ? 'Kopiert!' : 'Kopieren'}
          </button>
        </div>

        <div className="p-4 bg-stone-950/60 rounded-xl border border-stone-850 text-center space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] block">Dein QR-Code</span>
          <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-inner flex items-center justify-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="KONU QR Code" className="w-[100%] h-[100%] object-contain" />
            ) : (
              <div className="text-stone-400 text-xs font-sans">Generiere QR-Code...</div>
            )}
          </div>
          <p className="text-[10px] text-stone-400 max-w-xs mx-auto font-sans leading-relaxed">
            Platziere diesen erstklassigen QR-Code auf Flyern, Fahrzeugfolierungen oder deiner Visitenkarte.
          </p>
        </div>
      </div>
    );
  };

  if (!activeCard) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
        <LucideIcons.Loader className="animate-spin text-[#A855F7] mb-3" size={32} />
        <span className="text-stone-500 text-xs font-mono uppercase tracking-widest text-center">
          Erstelle KONU-Instanz für dich...
        </span>
      </div>
    );
  }

  const bgEnabled = activeCard?.cardBackgroundEnabled !== false;
  const cardStyle: React.CSSProperties = {};
  let darkenOpacity = 0;
  let saturationFilter = '';

  if (bgEnabled && activeCard) {
    if (activeCard.cardBackgroundImageUrl) {
      cardStyle.backgroundImage = `url(${activeCard.cardBackgroundImageUrl})`;
      const fit = activeCard.cardBackgroundMode || 'cover';
      cardStyle.backgroundSize = fit;
      cardStyle.backgroundRepeat = 'no-repeat';
      
      const offX = activeCard.cardBackgroundOffsetX !== undefined ? activeCard.cardBackgroundOffsetX : 0;
      const offY = activeCard.cardBackgroundOffsetY !== undefined ? activeCard.cardBackgroundOffsetY : 0;
      cardStyle.backgroundPosition = `calc(50% + ${offX}px) calc(50% + ${offY}px)`;
      
      if (activeCard.cardBackgroundSaturation !== undefined) {
        saturationFilter = `saturate(${activeCard.cardBackgroundSaturation}%)`;
      }
      
      darkenOpacity = (activeCard.cardBackgroundDarken !== undefined ? activeCard.cardBackgroundDarken : 25) / 100;
    } else if (activeCard.cardBackgroundGradientEnabled && activeCard.cardBackgroundGradientColor) {
      const gDir = activeCard.cardBackgroundGradientDirection || '135deg';
      cardStyle.background = `linear-gradient(${gDir}, ${activeCard.cardBackgroundColor || '#1C1C1E'} 0%, ${activeCard.cardBackgroundGradientColor} 100%)`;
    } else if (activeCard.cardBackgroundColor) {
      cardStyle.background = activeCard.cardBackgroundColor;
    } else {
      cardStyle.background = activeCard.backgroundColor || '#1C1C1E';
    }
  } else if (activeCard) {
    const backgroundFit = activeCard.backgroundImageFit || 'cover';
    if (activeCard.backgroundType === 'image' && activeCard.backgroundImageUrl) {
      cardStyle.backgroundImage = `url(${activeCard.backgroundImageUrl})`;
      cardStyle.backgroundSize = backgroundFit === 'contain' ? 'contain' : backgroundFit === 'repeat' ? 'auto' : 'cover';
      cardStyle.backgroundRepeat = backgroundFit === 'repeat' ? 'repeat' : 'no-repeat';
      cardStyle.backgroundPosition = 'center';

      if (activeCard.overlay === 'dark') darkenOpacity = 0.6;
      else if (activeCard.overlay === 'light') darkenOpacity = 0.2;
    } else {
      cardStyle.background = activeCard.backgroundColor || '#1E1E1E';
    }
  }

  const renderActiveTileForm = () => {
    if (!activeCard) return null;
    switch (activeTile) {
      case 'scene':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Video / Szene</h3>
              <p className="text-[10.5px] text-stone-400 mt-1">Stelle das Hintergrund-Thema deines Clips ein (Video, Bild, Farbe oder Verlauf).</p>
            </div>

            {/* Background Type Radio Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-450 tracking-wider">Hintergrund-Typ</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'video', label: 'Reel Video', icon: LucideIcons.Video },
                  { id: 'image', label: 'Bild', icon: LucideIcons.Image },
                  { id: 'color', label: 'Vollfarbe', icon: LucideIcons.Palette },
                ].map((bgBtn) => {
                  const Icon = bgBtn.icon;
                  const selected = activeCard.backgroundType === bgBtn.id || (bgBtn.id === 'video' && activeCard.videoBackgroundConfig?.enabled);
                  return (
                    <button
                      key={bgBtn.id}
                      type="button"
                      onClick={async () => {
                        if (bgBtn.id === 'video') {
                          await syncCardUpdate({
                            backgroundType: 'video',
                            cardBackgroundEnabled: false,
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              enabled: true,
                              mediaMode: 'youtube'
                            }
                          });
                        } else if (bgBtn.id === 'image') {
                          await syncCardUpdate({
                            backgroundType: 'image',
                            cardBackgroundEnabled: true,
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              enabled: false
                            }
                          });
                        } else {
                          await syncCardUpdate({
                            backgroundType: 'color',
                            cardBackgroundEnabled: true,
                            cardBackgroundImageUrl: '',
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              enabled: false
                            }
                          });
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold text-[10px] gap-1.5 transition duration-150 cursor-pointer ${
                        selected
                          ? 'border-purple-600 bg-purple-950/10 text-purple-400'
                          : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-white hover:bg-stone-800/80'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{bgBtn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video-hintergrund Einstellungen */}
            {(activeCard.backgroundType === 'video' || activeCard.videoBackgroundConfig?.enabled) && (
              <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-850 space-y-4">
                <div className="flex items-center gap-2 text-purple-400 text-[10.5px] font-black uppercase tracking-wider">
                  <LucideIcons.Tv size={14} />
                  <span>Video-Reel Einstellungen</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Video-Quelle</label>
                    <div className="flex bg-stone-900 border border-stone-800 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await syncCardUpdate({
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              mediaMode: 'youtube'
                            }
                          });
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition duration-150 ${
                          activeCard.videoBackgroundConfig?.mediaMode !== 'upload'
                            ? 'bg-stone-800 text-purple-400'
                            : 'text-stone-400 hover:text-stone-250'
                        }`}
                      >
                        YouTube-Link
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await syncCardUpdate({
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              mediaMode: 'upload'
                            }
                          });
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition duration-150 ${
                          activeCard.videoBackgroundConfig?.mediaMode === 'upload'
                            ? 'bg-stone-800 text-purple-400'
                            : 'text-stone-400 hover:text-stone-250'
                        }`}
                      >
                        Video Upload
                      </button>
                    </div>
                  </div>

                  {activeCard.videoBackgroundConfig?.mediaMode !== 'upload' ? (
                    <div className="space-y-2">
                      <label className="block text-[9px] uppercase font-mono text-stone-450">YouTube Video URL</label>
                      <input
                        type="text"
                        value={activeCard.videoBackgroundConfig?.youtubeUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          syncCardUpdate({
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              youtubeUrl: val
                            }
                          });
                        }}
                        placeholder="z.B. https://www.youtube.com/watch?v=..."
                        className="w-full bg-stone-800 border border-stone-700 h-9 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-[9px] uppercase font-mono text-stone-450">Reel Video-Datei (Max 10MB)</label>
                      <div className="relative border border-dashed border-stone-800 bg-stone-900/40 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                        <LucideIcons.Upload size={20} className="text-purple-400 mb-1.5" />
                        <span className="text-[10px] text-stone-300 font-bold">Wähle eine MP4-Datei aus</span>
                        <input
                          type="file"
                          accept="video/mp4"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              triggerToast(lang === 'de' ? 'Video wird hochgeladen...' : 'Uploading video...', 'info');
                              const path = `reel/video-original/${user?.uid}_${Date.now()}.mp4`;
                              try {
                                const url = await uploadFile(activeCard.cardId, file, 'reel-video');
                                await syncCardUpdate({
                                  videoBackgroundConfig: {
                                    ...activeCard.videoBackgroundConfig,
                                    mediaMode: 'upload',
                                    youtubeUrl: url,
                                    upload: {
                                      ...activeCard.videoBackgroundConfig?.upload,
                                      fileUrl: url,
                                      storagePath: path,
                                      originalFileName: file.name,
                                      originalSizeBytes: file.size
                                    }
                                  }
                                });
                                triggerToast(lang === 'de' ? 'Video erfolgreich hochgeladen!' : 'Video uploaded successfully!', 'success');
                              } catch (err) {
                                console.error(err);
                                triggerToast(lang === 'de' ? 'Fehler beim Hochladen' : 'Error uploading video', 'error');
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Slider config */}
                  <div className="space-y-1 pt-2 border-t border-stone-900/60">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-stone-400">Clip-Dauer:</span>
                      <span className="text-purple-400 font-mono">{activeCard.videoBackgroundConfig?.durationSeconds || 12} Sek.</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={15}
                      value={activeCard.videoBackgroundConfig?.durationSeconds || 12}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        syncCardUpdate({
                          videoBackgroundConfig: {
                            ...activeCard.videoBackgroundConfig,
                            durationSeconds: val,
                            duration: val
                          }
                        });
                      }}
                      className="w-full accent-purple-600 h-1 cursor-pointer bg-stone-800 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Standard backup color image fallback properties */}
            <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-stone-300 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.Image size={14} className="text-purple-400" />
                <span>Statische Fallbacks & Aussehen</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Hintergrundfarbe</label>
                  <div className="flex items-center gap-2 h-9 bg-stone-800 border border-stone-700 rounded-xl px-2">
                    <input
                      type="color"
                      value={activeCard.cardBackgroundColor || '#121212'}
                      onChange={(e) => {
                        syncCardUpdate({ cardBackgroundColor: e.target.value });
                      }}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase">{activeCard.cardBackgroundColor || '#121212'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Sättigung (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={activeCard.cardBackgroundSaturation !== undefined ? activeCard.cardBackgroundSaturation : 100}
                    onChange={(e) => {
                      syncCardUpdate({ cardBackgroundSaturation: parseInt(e.target.value) || 100 });
                    }}
                    className="w-full h-9 bg-stone-800 border border-stone-700 rounded-xl px-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-900/60">
                <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider">Hintergrundbild hochladen</label>
                <div className="flex items-center gap-3">
                  <div className="relative bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1">
                    <LucideIcons.Upload size={12} />
                    <span>Bild wählen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFile(activeCard.cardId, file, 'background');
                          await syncCardUpdate({ cardBackgroundImageUrl: url, cardBackgroundEnabled: true });
                          triggerToast(lang === 'de' ? 'Bild hochgeladen!' : 'Image uploaded successfully!', 'success');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                  </div>
                  {activeCard.cardBackgroundImageUrl && (
                    <button
                      type="button"
                      onClick={() => syncCardUpdate({ cardBackgroundImageUrl: '' })}
                      className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer"
                    >
                      Bild löschen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'texts':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Texte & Timeline</h3>
              <p className="text-[10.5px] text-stone-400 mt-1">Konfiguriere Schriftzüge, die ureel Werbeschrift, und das zeitgesteuerte Fade-In.</p>
            </div>

            {/* Profile Detail inputs */}
            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.User size={14} />
                <span>Profil Details</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Anzeigename / Überschrift</label>
                  <input
                    type="text"
                    value={activeCard.title || ''}
                    onChange={(e) => syncCardUpdate({ title: e.target.value })}
                    placeholder="z.B. Markus Meier"
                    className="w-full h-9 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Untertitel / Beruf</label>
                  <input
                    type="text"
                    value={activeCard.subtitle || ''}
                    onChange={(e) => syncCardUpdate({ subtitle: e.target.value })}
                    placeholder="z.B. Marketing-Berater & Coach"
                    className="w-full h-9 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Beschreibung / Slogan</label>
                  <textarea
                    rows={2}
                    value={activeCard.description || ''}
                    onChange={(e) => syncCardUpdate({ description: e.target.value })}
                    placeholder="Klicke unten auf meine Aktionen!"
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Werbeschriften Vorlagen */}
            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-900 pb-1.5">
                <div className="flex items-center gap-2 text-purple-400 text-[10.5px] font-black uppercase tracking-wider">
                  <LucideIcons.Sparkles size={14} />
                  <span>Werbeschriften & Textvorlagen</span>
                </div>
                <span className="text-[8.5px] font-black uppercase text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">VIP</span>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-2">Vorlage anwenden:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'teaser', label: 'Eilmeldung Teaser', cat: 'Kategorie 1' },
                    { id: 'headline', label: 'Bold Headline Card', cat: 'Kategorie 2' },
                    { id: 'promotion', label: 'Rabatt & Gutschein', cat: 'Kategorie 3' },
                    { id: 'appointment', label: 'Termin-Buchungs Call', cat: 'Kategorie 4' }
                  ].map((preset) => {
                    const isSelected = activeCard.textTemplateStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={async () => {
                          await syncCardUpdate({
                            textTemplateStyle: preset.id,
                            textTemplateConfig: {
                              ...activeCard.textTemplateConfig,
                              style: preset.id,
                              animation: 'scaleUpFade',
                              color: '#A855F7',
                              bgColor: '#141416',
                              fontSize: 'lg',
                              borderRadius: '2xl'
                            }
                          });
                          triggerToast(lang === 'de' ? `Werbeschrift "${preset.label}" applied!` : `Werbeschrift "${preset.label}" applied!`, 'success');
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-950/10 text-purple-350'
                            : 'border-stone-850 bg-stone-900 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <span className="text-[8.5px] font-mono text-stone-550 lowercase">{preset.cat}</span>
                        <span className="text-[10px] font-black uppercase mt-1 leading-none">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TIMELINE TIMINGS */}
            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.Clock size={14} />
                <span>Timeline & Zeit-Balken</span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-stone-400">Profilbild Delay:</span>
                    <span className="text-blue-400 font-mono">{activeCard.profileImageReveal?.startSecond || 0}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={activeCard.profileImageReveal?.startSecond || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      syncCardUpdate({
                        profileImageReveal: {
                          ...activeCard.profileImageReveal,
                          startSecond: val,
                          enabled: val > 0
                        }
                      });
                    }}
                    className="w-full accent-blue-500 cursor-pointer bg-stone-800 h-1 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-stone-400">Buttons Delay:</span>
                    <span className="text-blue-400 font-mono">{activeCard.videoBackgroundConfig?.buttonReveal?.startSecond || 0}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={activeCard.videoBackgroundConfig?.buttonReveal?.startSecond || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      syncCardUpdate({
                        videoBackgroundConfig: {
                          ...activeCard.videoBackgroundConfig,
                          buttonReveal: {
                            ...activeCard.videoBackgroundConfig?.buttonReveal,
                            startSecond: val,
                            enabled: val > 0
                          }
                        }
                      });
                    }}
                    className="w-full accent-blue-500 cursor-pointer bg-stone-800 h-1 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'buttons':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Buttons & Aktionen</h3>
              <p className="text-[10.5px] text-stone-400 mt-1">Füge Aktionen für Messenger-Dienste, Websites, Formulare oder Dateidownloads hinzu.</p>
            </div>

            {/* Layout Setting */}
            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-green-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.Layout size={14} />
                <span>Layout & Raster-Größe</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'list', label: 'Liste', desc: 'Klassische Liste' },
                  { id: 'grid3', label: '3er-Raster', desc: 'Quadratische Kacheln' }
                ].map((rasterPreset) => {
                  const isSelected = activeCard.buttonLayout === rasterPreset.id || (rasterPreset.id === 'list' && !activeCard.buttonLayout);
                  return (
                    <button
                      key={rasterPreset.id}
                      type="button"
                      onClick={() => syncCardUpdate({ buttonLayout: rasterPreset.id })}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-green-600 bg-green-950/10 text-green-300'
                          : 'border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-wide leading-none">{rasterPreset.label}</span>
                      <span className="text-[9px] mt-1 leading-none text-stone-400">{rasterPreset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Button list UI */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-stone-450 tracking-wider">Aktive Schaltflächen ({activeCard.buttons?.length || 0})</span>
                <button
                  type="button"
                  onClick={handleOpenAddButton}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  <LucideIcons.Plus size={11} className="stroke-[3]" />
                  <span>Hinzufügen</span>
                </button>
              </div>

              {(!activeCard.buttons || activeCard.buttons.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-stone-850 rounded-2xl text-stone-500 font-medium text-xs">
                  Noch keine Buttons erstellt.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCard.buttons.map((btn: any, index: number) => (
                    <div
                      key={btn.id || index}
                      className="bg-stone-950/60 border border-stone-850 py-2.5 px-3.5 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center shrink-0 font-bold text-white text-xs"
                          style={{ backgroundColor: btn.bgColor || '#A855F7', color: btn.textColor || '#ffffff' }}
                        >
                          <LucideIcons.Link size={12} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-bold text-white truncate leading-tight">{btn.title}</h4>
                          <span className="text-[8.5px] text-stone-550 block font-mono truncate">{btn.actionValue}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditButton(btn)}
                          className="w-6 h-6 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-blue-400 flex items-center justify-center cursor-pointer"
                        >
                          <LucideIcons.Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const filtered = activeCard.buttons.filter((b: any) => b.id !== btn.id);
                            await syncCardUpdate({ buttons: filtered });
                            triggerToast(lang === 'de' ? 'Button gelöscht' : 'Button deleted', 'success');
                          }}
                          className="w-6 h-6 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 flex items-center justify-center cursor-pointer"
                        >
                          <LucideIcons.Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'endcard':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Endkarte</h3>
              <p className="text-[10.5px] text-stone-400 mt-1">Konfiguriere das visuelle Verhalten, nachdem das Video / die Timeline abgespielt wurde.</p>
            </div>

            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-orange-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.VideoOff size={14} />
                <span>Verhalten am Ende des Clips</span>
              </div>

              <div>
                <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Aktion nach Sequenz</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'video_last_frame', label: 'Video loopen', desc: 'Standard Loop' },
                    { id: 'image', label: 'Statisches Bild', desc: 'End-Bild einblenden' },
                    { id: 'color', label: 'Vollfarbe', desc: 'Farbe anzeigen' },
                    { id: 'gradient', label: 'Farbverlauf', desc: 'Gradient anzeigen' }
                  ].map((actType) => {
                    const isSelected = activeCard.afterSequence?.backgroundType === actType.id || (actType.id === 'video_last_frame' && !activeCard.afterSequence?.backgroundType);
                    return (
                      <button
                        key={actType.id}
                        type="button"
                        onClick={async () => {
                          await syncCardUpdate({
                            afterSequence: {
                              ...activeCard.afterSequence,
                              backgroundType: actType.id
                            }
                          });
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-orange-600 bg-orange-950/10 text-orange-300'
                            : 'border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wide leading-none">{actType.label}</span>
                        <span className="text-[8.5px] text-stone-450 mt-1 leading-none">{actType.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeCard.afterSequence?.backgroundType === 'image' && (
                <div className="space-y-3 pt-3 border-t border-stone-900">
                  <label className="block text-[9.5px] uppercase font-bold text-stone-400">Endkarte Bild hochladen</label>
                  <div className="relative bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-[10.5px] font-bold text-stone-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1">
                    <LucideIcons.Upload size={12} className="text-orange-400" />
                    <span>End-Bild hochladen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadFile(activeCard.cardId, file, 'background');
                          await syncCardUpdate({
                            afterSequence: {
                              ...activeCard.afterSequence,
                              backgroundType: 'image',
                              imageUrl: url
                            }
                          });
                          triggerToast(lang === 'de' ? 'Bild hochgeladen!' : 'Uploaded successfully!', 'success');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-orange-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.MousePointer size={14} />
                <span>Call-To-Action (CTA) Overlay</span>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] uppercase font-bold text-stone-450">CTA Text Beschriftung</label>
                <input
                  type="text"
                  value={reelConfig?.ctaText || 'Karte über den Link öffnen'}
                  onChange={async (e) => {
                    const textVal = e.target.value;
                    const newConfig = { ...reelConfig, ctaText: textVal };
                    setReelConfig(newConfig);
                    await syncCardUpdate({ reelExportConfig: newConfig });
                  }}
                  className="w-full h-9 bg-stone-800 border border-stone-700 rounded-lg px-2.5 text-xs text-stone-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
        );
      case 'design':
        return (
          <div className="space-y-5">
            <div className="pb-3 border-b border-stone-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Design & Look</h3>
              <p className="text-[10.5px] text-stone-400 mt-1">Steuere das branding, die Farben, Schriften und feine Premium-Linien.</p>
            </div>

            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-pink-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.Sparkles size={14} />
                <span>Akzent-Farbe (Signature)</span>
              </div>

              <div className="flex items-center gap-3.5 bg-stone-900 border border-stone-800 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-purple-600 border border-purple-400 shrink-0 select-all" />
                <div>
                  <h4 className="text-[11px] font-black uppercase text-purple-400 leading-none">ureel Lila Violett</h4>
                  <p className="text-[9px] text-stone-500 mt-1">Optimiert für OLED Smartphone Displays.</p>
                </div>
              </div>
            </div>

            <div className="bg-stone-950/60 p-4.5 rounded-2xl border border-stone-850 space-y-4">
              <div className="flex items-center gap-2 text-pink-400 text-[10.5px] font-black uppercase tracking-wider">
                <LucideIcons.CaseSensitive size={14} />
                <span>Typografie & Schriften</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'inter', label: 'Inter (Sans-Serif)', desc: 'Clean & minimalistisch' },
                  { id: 'space-grotesk', label: 'Space Grotesk (Tech)', desc: 'Futuristischer Tech-Look' },
                  { id: 'mono', label: 'Fira Code (Mono)', desc: 'Brutalistischer Code-Stil' }
                ].map((fnt) => {
                  const isSelected = activeCard.textFontFamily === fnt.id || (fnt.id === 'inter' && !activeCard.textFontFamily);
                  return (
                    <button
                      key={fnt.id}
                      type="button"
                      onClick={() => syncCardUpdate({ textFontFamily: fnt.id })}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-950/10 text-purple-300'
                          : 'border-stone-850 bg-stone-900 text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wide leading-none">{fnt.label}</h4>
                        <span className="text-[9px] text-stone-550 block mt-1">{fnt.desc}</span>
                      </div>
                      {isSelected && <LucideIcons.Check size={14} className="text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderUsersManagement = () => {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="pb-3 border-b border-stone-800">
          <h2 className="text-base font-black text-white uppercase tracking-wider">Nutzerverwaltung & Team</h2>
          <p className="text-[11px] text-stone-400 mt-1">Mitglieder deines ureel.me Studio Accounts verwalten.</p>
        </div>

        <div className="bg-[#121214] border border-stone-850 rounded-2xl p-5 space-y-4 shadow">
          <div className="flex items-center justify-between border-b border-stone-900 pb-3">
            <span className="text-xs font-bold text-stone-300">Aktives Team</span>
            <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-900/30">Zuweisung aktiv</span>
          </div>

          <div className="divide-y divide-stone-900">
            {[
              { email: user?.email || 'admin@example.com', role: 'Inhaber / Administrator', status: 'Aktiv', char: 'A' },
              { email: 'collab@ureel.me', role: 'Editor / Redakteur', status: 'Berechtigt', char: 'E' },
              { email: 'kunde@ureel.me', role: 'Viewer (Gast)', status: 'Lesezugriff', char: 'G' }
            ].map((member, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center font-bold text-xs text-purple-400">
                    {member.char}
                  </div>
                  <div>
                    <h4 className="text-[11.5px] font-bold text-white">{member.email}</h4>
                    <p className="text-[9.5px] text-stone-500 font-medium">{member.role}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase bg-[#18181b] border border-stone-800 text-stone-400 px-2 py-0.5 rounded">
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-stone-950/40 border border-stone-850 p-4.5 rounded-2xl space-y-3.5">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Neues Mitglied einladen</h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="E-Mail eingeben..."
              className="flex-1 bg-stone-900 border border-stone-800 h-9.5 rounded-xl px-3 text-xs text-white placeholder:text-stone-600 focus:outline-none"
            />
            <button
              onClick={() => triggerToast(lang === 'de' ? 'Einladungslink wurde versendet!' : 'Invitation sent!', 'success')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 rounded-xl transition cursor-pointer"
            >
              Einladen
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStatsDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="pb-3 border-b border-stone-800">
          <h2 className="text-base font-black text-white uppercase tracking-wider">Aufruf-Statistiken</h2>
          <p className="text-[11px] text-stone-400 mt-1">Echtzeit-Interaktionsauswertung deiner klickbaren Werbecard.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { label: 'Gesamt Aufrufe', count: '1.420', change: '+24%', color: 'text-purple-400', desc: 'Impressions & Reels' },
            { label: 'Button Clicks', count: '966 Clicks', change: '+18%', color: 'text-blue-400', desc: 'Interaktionen gesamt' },
            { label: 'CTR-Aktionsrate', count: '68%', change: '+5%', color: 'text-emerald-400', desc: 'Click-Through-Rate' },
            { label: 'Generierte Leads', count: '12 Kontakte', change: '+3', color: 'text-orange-400', desc: 'VCards & Formulare' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#121214] border border-stone-850 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-stone-450 tracking-wider block">{stat.label}</span>
              <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
                <span className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.count}</span>
                <span className="text-[9px] font-extrabold text-emerald-400 shrink-0">{stat.change}</span>
              </div>
              <p className="text-[9px] text-stone-550 leading-tight mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#121214] border border-stone-850 rounded-2xl p-5 space-y-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">Interaktionsverlauf (30 Tage)</h4>
              <p className="text-[9px] text-stone-500 mt-1">Durchschnittliches Wachstum über den letzten Monat.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[9px] font-black text-purple-400"><span className="w-2 h-2 rounded bg-purple-500" /> Aufrufe</span>
              <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-400"><span className="w-2 h-2 rounded bg-blue-500" /> Klicks</span>
            </div>
          </div>

          <div className="w-full h-44 bg-[#0A0A0C] border border-[#1e1e24] rounded-xl relative p-3">
            <svg viewBox="0 0 500 150" className="w-full h-full text-stone-600 overflow-visible" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="500" y2="20" stroke="#16161a" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#16161a" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#16161a" strokeDasharray="3 3" />
              
              <path
                d="M 0,120 Q 75,70 150,90 T 300,45 T 450,110 T 500,40"
                fill="none"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0,150 L 0,120 Q 75,70 150,90 T 300,45 T 450,110 T 500,40 L 500,150 Z"
                fill="url(#statPurpleGrad)"
                opacity="0.12"
              />

              <path
                d="M 0,140 Q 75,120 150,125 T 300,90 T 450,135 T 500,85"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient id="statPurpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#0a0a0c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-1 left-2.5 right-2.5 flex justify-between text-[8px] font-mono text-stone-600 font-bold">
              <span>01. Juni</span>
              <span>15. Juni</span>
              <span>30. Juni</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeviceMockupArea = () => {
    return (
      <div className="space-y-4">
        {/* Toggle preview modes */}
        <div className="flex justify-center">
          <div className="flex bg-[#121214] border border-stone-850 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setPreviewMode('card')}
              className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wide transition duration-150 cursor-pointer ${
                previewMode === 'card' ? 'bg-purple-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Smartphone-Card
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('reel')}
              className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wide transition duration-150 cursor-pointer ${
                previewMode === 'reel' ? 'bg-purple-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Reel-Export File
            </button>
          </div>
        </div>

        {previewMode === 'card' ? (
          <div className="relative mx-auto w-[270px] h-[558px] bg-black rounded-[38px] border-[8px] border-stone-850 shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-b-xl z-20" />

            <div className="w-full h-full overflow-y-auto select-none bg-[#141414] text-stone-200 scrollbar-none flex flex-col justify-between relative">
              <KonuCardCore
                card={activeCard}
                lang={lang}
                reelConfig={reelConfig}
                onButtonActionClick={async (a, b) => {
                  console.log("Mock action click", a, b);
                }}
                isDesktopPreview={true}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#121214] border border-stone-850 rounded-2xl p-4.5 space-y-4 shadow">
            <h4 className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Video-Reel Export-Studio</h4>
            <p className="text-[9.5px] text-stone-400 leading-snug">Rendere deine ureel Card in ein 9:16 hochauflösendes Video, perfekt für Reels, TikToks & Shorts.</p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={triggerReelVideoExport}
                disabled={isExportingVideo}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10.5px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer uppercase tracking-wider shadow-lg"
              >
                {isExportingVideo ? (
                  <>
                    <LucideIcons.Loader className="animate-spin text-white" size={13} />
                    <span>Rendere Video ({exportProgress}%)</span>
                  </>
                ) : (
                  <>
                    <LucideIcons.Video size={13} />
                    <span>Video Clip exportieren (MP4)</span>
                  </>
                )}
              </button>

              {exportedVideoUrl && (
                <div className="space-y-3 p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl">
                  <span className="text-[9.5px] font-black uppercase text-purple-300 block">Fertiges Reel Video:</span>
                  <video src={exportedVideoUrl} controls className="w-full rounded-lg aspect-[9/16] bg-black" />
                  <a
                    href={exportedVideoUrl}
                    download={`ureel_${activeCard.slug}.mp4`}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <LucideIcons.Download size={12} />
                    Speichern (MP4)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentSlugUrl = activeCard ? getPublicCardUrl(activeCard.slug) : '';

  if (activeCard) {
    return (
      <>
        {saveToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#121214] text-stone-200 font-bold px-5 py-3.5 rounded-2xl text-xs shadow-2xl flex items-center gap-3.5 border border-purple-900/30 animate-slide-in max-w-sm w-[90%] justify-between">
            <div className="flex items-center gap-2">
              <LucideIcons.CheckCircle size={15} className="text-emerald-500 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-white font-black leading-tight">Automatisch gespeichert!</span>
                <span className="text-[9px] text-stone-450 font-normal mt-0.5 leading-none">Alle Änderungen sind sofort live.</span>
              </div>
            </div>
          </div>
        )}
        <UreelStudioShell
          activeCard={activeCard}
          cards={cards}
          setActiveCard={setActiveCard}
          syncCardUpdate={syncCardUpdate}
          lang={lang}
          setLang={setLang}
          user={user}
          profile={profile}
          effectivePlanId={effectivePlanId}
          triggerToast={triggerToast}
          logout={logout}
          onGoToAdmin={onGoToAdmin}
          onGoToRoute={onGoToRoute}
          createNewCard={createNewCard}
          deleteCard={deleteCard}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0F0F0F] text-stone-200 flex flex-col justify-between">
      {/* Dynamic Saving Notification Toast */}
      {saveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1C] text-stone-200 font-bold px-5 py-3.5 rounded-2xl text-xs shadow-2xl flex items-center gap-3.5 border border-stone-800/80 animate-slide-in max-w-sm w-[90%] justify-between">
          <div className="flex items-center gap-2">
            <LucideIcons.CheckCircle size={15} className="text-green-500 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-white font-black leading-tight">Automatisch gespeichert!</span>
              <span className="text-[9px] text-stone-400 font-normal mt-0.5 leading-none">Alle Änderungen sind live.</span>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUpdateSharing(true);
              setShowShareModal(true);
              setSaveToast(false);
            }}
            className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-extrabold text-[10px] py-1.5 px-3 rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <LucideIcons.Share2 size={11} />
            <span>{lang === 'de' ? 'Update teilen' : 'Share update'}</span>
          </button>
        </div>
      )}

      {/* Editor Header Workspace Bar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <KonuLogo size="sm" variant="gold" showSlogan={false} />
          </div>
          <div className="hidden sm:block border-l border-stone-800/80 pl-3">
            <h1 className="text-sm font-black text-stone-100 tracking-wide uppercase">ureel.me Studio</h1>
            <p className="text-[10px] text-stone-400 font-medium font-sans">{t.brandSlogan}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <button
              onClick={onGoToAdmin}
              className="bg-purple-950/40 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <LucideIcons.ShieldAlert size={14} />
              Admin
            </button>
          )}

          {/* DEBUG Button */}
          {DEBUG_BUTTON_EDITOR && (
            <button
              type="button"
              onClick={() => {
                console.log("HARD DEBUG BUTTON CLICKED");
                const safeBtn = normalizeButton({
                  id: 'debug_test_button',
                  title: 'Test Button',
                  actionType: 'website',
                  actionValue: 'https://example.com',
                  textColor: '#ffffff',
                  bgColor: '#A855F7',
                  radius: 'rounded',
                  isActive: true
                });
                setEditingButton(safeBtn);
                
                setBtnTitle('Test Button');
                setBtnActionType('website');
                setBtnActionValue('https://example.com');
                setBtnTextColor('#ffffff');
                setBtnColor('#A855F7');
                setBtnProtected(false);
                setBtnPassword('');
                setBtnPasswordHint('');
                setBtnImageStyle('icon');
                setBtnUploadedUrl('');
                setBtnIcon('Link');
                
                setHideTestModal(false);
                setShowButtonModal(true);
              }}
              className="bg-[#3a1010] hover:bg-red-900 border border-red-800 text-red-400 font-bold text-[10px] py-2 px-3 rounded-lg uppercase tracking-wider transition"
            >
              DEBUG: ButtonEditor öffnen
            </button>
          )}

          {/* Quick Language Toggle */}
          <button
            onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold py-2 px-2.5 rounded-lg border border-stone-700 uppercase"
          >
            {lang}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="relative w-full flex-grow py-5 px-3 md:py-8 md:px-6">
        <div className="w-full max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: MEINE KARTEN & ACTIVE CONFIG (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1 w-full">
            
            {/* COMPACT INTEGRATED PROFILE AREA */}
            {(() => {
              const activePlan = PLANS[effectivePlanId] || PLANS['starter'];
              const cardsCount = cards.length;
              const maxCardsLimit = activePlan.maxCards;
              const userLetter = user?.email?.charAt(0).toUpperCase() || 'U';
              
              return (
                <div className="bg-[#121212] border border-stone-850 rounded-3xl p-4 md:p-5 shadow-xl relative overflow-hidden font-sans flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Subtle gold decorative background glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#A855F7]/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3.5 select-none w-full sm:w-auto">
                    {/* User Circular Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-850 to-stone-900 border border-stone-750 flex items-center justify-center shadow text-[#A855F7] font-black font-mono text-base tracking-widest shrink-0">
                      {userLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#A855F7] text-[10px] font-black uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-0.5 rounded-md">
                          {lang === 'de' ? `Plan: ${activePlan.name}` : `Your current plan: ${activePlan.name}`}
                        </span>
                        {profile?.role === 'owner' && (
                          <span className="text-amber-400 text-[9px] font-black uppercase tracking-widest bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                            Owner
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-black text-white truncate mt-1 tracking-wide font-sans">
                        {user?.email || 'ureel-Mitglied'}
                      </h3>
                      <div className="flex items-center gap-4 text-stone-500 text-[10px] font-bold font-mono mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-stone-600">●</span>
                          <span>
                            {lang === 'de' 
                              ? `Karten: ${cardsCount} / ${maxCardsLimit}` 
                              : `Cards: ${cardsCount} / ${maxCardsLimit}`}
                          </span>
                        </div>
                        {activeCard && (
                          <div className="flex items-center gap-1">
                            <span className="text-stone-600">●</span>
                            <span>
                              {lang === 'de'
                                ? `Buttons: ${(activeCard.buttons || []).length} / ${activePlan.maxButtonsPerCard}`
                                : `Buttons: ${(activeCard.buttons || []).length} / ${activePlan.maxButtonsPerCard}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Upgrade */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-stone-850 pt-3 sm:pt-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] hover:text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-xl cursor-pointer transition flex items-center gap-1 shrink-0"
                    >
                      <LucideIcons.Sparkles size={11} className="stroke-[2.5]" />
                      <span>{lang === 'de' ? 'Upgrade öffnen' : 'Open Upgrade'}</span>
                    </button>
                    
                    <a
                      href="#my-cards-section"
                      className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
                      title={lang === 'de' ? 'Karten-Verwaltung' : 'Manage Cards'}
                    >
                      <LucideIcons.Settings size={13} />
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* NEW CONSOLIDATED DASHBOARD MENU PANEL */}
            {activeCard && (
              <div className="bg-[#121212] border border-stone-850 rounded-3xl p-5 md:p-6 shadow-xl font-sans relative">
                <div className="flex items-center gap-2 pb-4 border-b border-stone-850 mb-4">
                  <LucideIcons.Grid size={16} className="text-[#A855F7]" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    {lang === 'de' ? 'Dashboard Menü' : 'Dashboard Menu'}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* 4. Teilen / Share */}
                  <button
                    onClick={() => {
                      setIsUpdateSharing(false);
                      setShowShareModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900 border border-stone-880/60 hover:border-[#A855F7]/45 hover:bg-stone-850/80 transition duration-155 text-center cursor-pointer group"
                  >
                    <LucideIcons.Share2 size={16} className="text-[#A855F7] group-hover:scale-110 transition shrink-0 mb-1.5" />
                    <span className="text-[10px] font-bold text-stone-300 truncate w-full">
                      {lang === 'de' ? 'Teilen' : 'Share'}
                    </span>
                  </button>

                  {/* 5. QR-Code generieren / Generate QR code */}
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900 border border-stone-880/60 hover:border-[#A855F7]/45 hover:bg-stone-850/80 transition duration-155 text-center cursor-pointer group"
                  >
                    <LucideIcons.QrCode size={16} className="text-[#A855F7] group-hover:scale-110 transition shrink-0 mb-1.5" />
                    <span className="text-[10px] font-bold text-stone-300 truncate w-full">
                      {lang === 'de' ? 'QR-Code generieren' : 'Generate QR code'}
                    </span>
                  </button>

                  {/* 6. Upgrade / Upgrade */}
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900 border border-stone-880/60 hover:border-[#A855F7]/45 hover:bg-stone-850/80 transition duration-155 text-center cursor-pointer group"
                  >
                    <LucideIcons.Zap size={16} className="text-[#A855F7] group-hover:scale-110 transition shrink-0 mb-1.5" />
                    <span className="text-[10px] font-bold text-stone-300 truncate w-full">
                      {lang === 'de' ? 'Upgrade' : 'Upgrade'}
                    </span>
                  </button>

                  {/* 7. Hilfe / Help */}
                  <button
                    onClick={() => setShowHelpModal(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900 border border-stone-880/60 hover:border-[#A855F7]/45 hover:bg-[#A855F7]/10 transition duration-155 text-center cursor-pointer group"
                  >
                    <LucideIcons.HelpCircle size={16} className="text-[#A855F7] group-hover:scale-110 transition shrink-0 mb-1.5" />
                    <span className="text-[10px] font-bold text-stone-300 truncate w-full">
                      {lang === 'de' ? 'Hilfe' : 'Help'}
                    </span>
                  </button>

                  {/* 8. Abmelden / Sign out */}
                  <button
                    onClick={logout}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900/40 border border-red-950/25 hover:border-red-900/40 hover:bg-red-950/20 transition duration-155 text-center cursor-pointer group"
                  >
                    <LucideIcons.LogOut size={16} className="text-red-400 group-hover:scale-110 transition shrink-0 mb-1.5" />
                    <span className="text-[10px] font-bold text-red-300 truncate w-full">
                      {lang === 'de' ? 'Abmelden' : 'Sign out'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Developer / Test-Account setup notice - STRICTLY ADMIN ONLY */}
            {user && typeof user.email === 'string' && user.email.trim().toLowerCase() === "nfctagsproducts@gmail.com" && (!profile || profile.role !== 'owner') && (
              <div className="bg-stone-900/60 border border-amber-900/40 p-4 rounded-2xl space-y-2 text-stone-300">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <LucideIcons.Info size={14} />
                  <span>Testaccount Einrichten</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-400">
                  Um deinen Account zum Owner zu machen, setze in Firestore in der Collection <code className="bg-stone-950 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px]">users/{user.uid}</code> das Feld <code className="bg-stone-950 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px]">role</code> auf <code className="bg-stone-950 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px]">owner</code>.
                </p>
                <div className="flex items-center justify-between gap-1.5 bg-stone-950 px-2.5 py-1.5 rounded-xl border border-stone-850">
                  <span className="text-[10px] text-stone-400 font-mono select-all truncate">UID: {user.uid}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.uid);
                      alert('UID kopiert!');
                    }}
                    className="text-[10px] text-[#A855F7] hover:text-amber-400 font-bold shrink-0"
                  >
                    Kopieren
                  </button>
                </div>
              </div>
            )}

            {/* Admin Test Bar - STRICTLY ADMIN ONLY */}
            {user && typeof user.email === 'string' && user.email.trim().toLowerCase() === "nfctagsproducts@gmail.com" && profile && (profile.role === 'admin' || profile.role === 'owner') && (
              <div className="bg-gradient-to-r from-purple-950 to-stone-900 text-white p-3 rounded-2xl border border-purple-800/80 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="bg-[#A855F7] text-stone-950 p-1.5 rounded-lg shrink-0">
                    <LucideIcons.ShieldAlert size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold tracking-wide">Admin-Testmodus</h4>
                    <p className="text-[10px] text-purple-300">
                      Simuliere various plans for testing.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-stone-950/40 p-2 rounded-xl border border-stone-800/40">
                  <div className="flex items-center justify-between gap-2.5">
                    <label className="text-[10px] uppercase font-bold text-stone-400">Tarif simulieren:</label>
                    <select
                      value={simulatedPlan || 'real'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSimulatedPlan(val === 'real' ? null : val as PlanType);
                      }}
                      className="bg-stone-900 border border-purple-700/40 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#A855F7]"
                    >
                      <option value="real">Keine Simulation (Echt: {PLANS[profile.plan]?.name || 'Starter'})</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  {simulatedPlan && simulatedPlan !== profile.plan && (
                    <button
                      onClick={handleApplySimulatedPlanPermanent}
                      className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-bold text-[10px] py-1.5 px-2.5 rounded-lg transition"
                    >
                      Diesen Tarif wirklich auf meine Testkarte anwenden
                    </button>
                  )}
                </div>
              </div>
            )}

            {previewMode === 'reel' ? (
              exportedVideoUrl ? (
                <div className="bg-[#121212] border border-stone-850 rounded-[32px] p-5 md:p-6 shadow-xl font-sans relative animate-fadeIn flex flex-col gap-4 text-left w-full">
                  {/* Success Header */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-stone-850 gap-2.5">
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl animate-pulse">
                      <LucideIcons.CheckCircle size={32} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white uppercase tracking-wider">
                        {lang === 'de' ? 'Reelvideo erstellt!' : 'Reel Video Exported!'}
                      </h2>
                      <p className="text-[9px] text-[#A855F7] mt-1 uppercase tracking-widest font-black">
                        {lang === 'de' ? 'Format: WebM Video (720x1280)' : 'Format: WebM Video (720x1280)'}
                      </p>
                    </div>
                  </div>

                  {/* Big Primary Action: Download Video */}
                  <button
                    onClick={() => {
                      if (!exportedVideoUrl) return;
                      const link = document.createElement('a');
                      link.href = exportedVideoUrl;
                      link.download = `konu-reel-${activeCard.slug || 'card'}.webm`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-705 text-stone-950 font-black text-[12px] uppercase tracking-widest py-3.5 rounded-2xl transition duration-150 flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    <LucideIcons.Download size={14} className="stroke-[3]" />
                    <span>{lang === 'de' ? 'Video herunterladen' : 'Download Video'}</span>
                  </button>

                  {/* Platform Note */}
                  <div className="bg-[#A855F7]/5 border border-[#A855F7]/15 rounded-2xl p-3.5 space-y-1.5">
                    <span className="block text-[8px] font-black uppercase text-[#A855F7] tracking-wider leading-none">
                      {lang === 'de' ? 'Empfehlungs-Leitfaden' : 'Placement Guide'}
                    </span>
                    <p className="text-[10px] text-stone-300 font-medium leading-relaxed">
                      {lang === 'de'
                        ? 'Poste das Reelvideo und füge den Kartenlink in den Beitragstext ein. Die klickbaren Buttons findest du auf deiner Karte.'
                        : 'Post the reel video and include the card link in the post text. The clickable buttons reside on your live card.'}
                    </p>
                    <p className="text-[9px] text-stone-400 italic">
                      {lang === 'de'
                        ? 'Bitte beachten: Buttons im reinen Video-File sind technisch nicht klickbar.'
                        : 'Please note: Buttons within raw video files are not hoverable or clickable.'}
                    </p>
                  </div>

                  {/* Secondary Sharing Actions */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-stone-500 uppercase tracking-widest pl-1">
                      {lang === 'de' ? 'Karten-Link & Social Texte' : 'Card Link & Social Texts'}
                    </span>

                    {/* Copy Card Link */}
                    <button
                      onClick={() => {
                        const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                        navigator.clipboard.writeText(pubUrl);
                        triggerToast(lang === 'de' ? 'Link in die Zwischenablage kopiert!' : 'Link copied to clipboard!', 'success');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-250 font-bold text-[11px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LucideIcons.Link size={13} className="text-[#A855F7]" />
                        <span>{lang === 'de' ? 'Kartenlink kopieren' : 'Copy Card Link'}</span>
                      </span>
                      <span className="text-[9px] text-[#A855F7] uppercase font-mono tracking-wider">Kopieren</span>
                    </button>

                    {/* Copy LinkedIn Template */}
                    <button
                      onClick={() => {
                        const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                        const text = lang === 'de'
                          ? `Entdecke meine neue digitale Kontaktkarte auf ureel.me! 🚀 Mit nur einem Klick gelangst du zu all meinen Kontaktdaten, Projekten und Social Links. 👇\n${pubUrl}\n\n#networking #ureel #digitalcard #visitenkarte`
                          : `Discover my new digital contact card on ureel.me! 🚀 One click gets you straight to my latest contacts, portfolios, and social links. Check it here 👇\n${pubUrl}\n\n#networking #highlights #ureel #digitalcard`;
                        navigator.clipboard.writeText(text);
                        triggerToast(lang === 'de' ? 'LinkedIn-Beitragstext kopiert!' : 'LinkedIn text template copied!', 'success');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-250 font-bold text-[11px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LucideIcons.Linkedin size={13} className="text-sky-400" />
                        <span>{lang === 'de' ? 'LinkedIn Text kopieren' : 'Copy LinkedIn Post'}</span>
                      </span>
                      <span className="text-[9px] text-[#A855F7] uppercase font-mono tracking-wider">Kopieren</span>
                    </button>

                    {/* Copy Instagram Template */}
                    <button
                      onClick={() => {
                        const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                        const text = lang === 'de'
                          ? `Mein neues digitales Profil ist live! Check den Link in Bio, um meine interaktive Karte mit allen wichtigen Links & Kontakten zu sehen. ⚡️ Erstellt mit ureel.me.\n${pubUrl}`
                          : `My digital ureel.me highlight hub is live! Tap the link in bio to browse all contacts, projects, and active portfolios instantly! ⚡️\n${pubUrl}`;
                        navigator.clipboard.writeText(text);
                        triggerToast(lang === 'de' ? 'Instagram-Text kopiert!' : 'Instagram text template copied!', 'success');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-250 font-bold text-[11px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LucideIcons.Instagram size={13} className="text-pink-400" />
                        <span>{lang === 'de' ? 'Instagram Text kopieren' : 'Copy Instagram Text'}</span>
                      </span>
                      <span className="text-[9px] text-[#A855F7] uppercase font-mono tracking-wider">Kopieren</span>
                    </button>

                    {/* Copy WhatsApp Template */}
                    <button
                      onClick={() => {
                        const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                        const text = lang === 'de'
                          ? `Hallo! Schau dir doch mal meine neue digitale Kontakkarte an: ${pubUrl} - Hier findest du alle meine Links und Kontaktdaten auf einen Blick!`
                          : `Check out my new digital contact card: ${pubUrl} - This is where I share my active contacts and links!`;
                        navigator.clipboard.writeText(text);
                        triggerToast(lang === 'de' ? 'WhatsApp-Text kopiert!' : 'WhatsApp text template copied!', 'success');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-250 font-bold text-[11px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LucideIcons.MessageSquare size={13} className="text-emerald-400" />
                        <span>{lang === 'de' ? 'WhatsApp Text kopieren' : 'Copy WhatsApp Text'}</span>
                      </span>
                      <span className="text-[9px] text-[#A855F7] uppercase font-mono tracking-wider">Kopieren</span>
                    </button>
                  </div>

                  {/* Reset / Erneut anpassen */}
                  <button
                    onClick={() => {
                      setExportedVideoUrl(null);
                      setExportedVideoBlob(null);
                    }}
                    className="w-full bg-stone-900 hover:bg-[#1a1816] border border-stone-850 text-stone-400 hover:text-stone-300 font-bold text-[10px] uppercase py-2.5 rounded-xl transition mt-2 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LucideIcons.RefreshCw size={11} />
                    <span>{lang === 'de' ? 'Erneut anpassen' : 'Re-customize Video'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#121212] border border-stone-850 rounded-[32px] p-5 md:p-6 shadow-xl font-sans relative animate-fadeIn flex flex-col gap-5 text-left w-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-850 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#A855F7]/10 p-2 rounded-xl text-[#A855F7]">
                      <LucideIcons.Video size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">
                        Reel Video Designer
                      </h2>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {lang === 'de' ? 'Optimiere deine Karte als 9:16 Video.' : 'Optimize your card for 9:16 social videos.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewMode('card')}
                    className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer"
                  >
                    <LucideIcons.ArrowLeft size={12} />
                    <span>{lang === 'de' ? 'Zurück' : 'Back'}</span>
                  </button>
                </div>

                {/* Simulated Rendering Track - Teil F */}
                {isExportingVideo ? (
                  <div className="bg-stone-950/60 border border-[#A855F7]/25 rounded-2xl p-4 text-center space-y-3 animate-pulse z-10 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7]">Rendere Reel-Video...</span>
                      <span className="text-xs font-mono font-black text-[#A855F7]">{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-850">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 font-mono tracking-wide animate-pulse">
                      {exportStepName}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={triggerReelVideoExport}
                    className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 px-4 rounded-2xl transition duration-150 flex items-center justify-center gap-2 shadow-2xl shrink-0 cursor-pointer animate-fade-in"
                  >
                    <LucideIcons.Download size={14} className="stroke-[3]" />
                    <span>{lang === 'de' ? 'Als Video exportieren (MP4)' : 'Export as Video (MP4)'}</span>
                  </button>
                )}

                {/* Section 1: Dynamic Safe Zone Template Overlays - Teil J */}
                <div className="space-y-2.5 bg-stone-950/40 p-4 rounded-2xl border border-stone-850/50">
                  <h3 className="text-[10px] font-extrabold text-stone-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-850/40 pb-1.5">
                    <LucideIcons.Layers size={13} className="text-[#A855F7]" />
                    <span>Plattform-Overlay simulieren</span>
                  </h3>
                  <p className="text-[9px] text-stone-400 leading-normal">
                    {lang === 'de' 
                      ? 'Simuliere die GUI-Balken von Social Apps, um sicherzustellen, dass deine Buttons oder Texte nicht verdeckt werden.'
                      : 'Simulate the GUI overlays of social apps to make sure buttons and texts are fully readable.'}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'none', label: 'Aus / Clear', icon: LucideIcons.EyeOff },
                      { key: 'instagram', label: 'Instagram', icon: LucideIcons.Instagram },
                      { key: 'tiktok', label: 'TikTok', icon: LucideIcons.Music },
                      { key: 'youtube', label: 'YouTube', icon: LucideIcons.Youtube }
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = socialOverlay === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setSocialOverlay(item.key as any)}
                          className={`flex flex-col items-center justify-center gap-1 border py-2 px-1 rounded-xl transition cursor-pointer select-none text-center ${
                            active
                              ? 'bg-[#A855F7]/10 border-[#A855F7] text-[#A855F7] font-bold text-[9px]'
                              : 'bg-stone-900 border-stone-850 hover:bg-stone-850 text-stone-450 font-semibold text-[9px]'
                          }`}
                        >
                          <Icon size={11} />
                          <span className="text-[8px] truncate max-w-full tracking-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* On-screen visual hint - Teil D */}
                <div className="bg-[#A855F7]/5 border border-[#A855F7]/15 rounded-2xl p-3 flex gap-2 text-stone-300">
                  <LucideIcons.Info size={14} className="text-[#A855F7] shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[9px] leading-relaxed font-semibold">
                    {lang === 'de'
                      ? 'Tipp: Du kannst Elemente (wie den Profilblock, Buttons oder das Footer-Branding) ein- oder ausblenden, indem du sie direkt im nebenstehenden 9:16 Video anklickst!'
                      : 'Tip: Toggle elements (such as profile details, buttons or brand footers) by clicking directly inside the 9:16 video mockup on the right!'}
                  </p>
                </div>

                {/* Section 2: Properties & Controls */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-850/60 pb-1">
                    <LucideIcons.Sliders size={13} className="text-[#A855F7]" />
                    <span>Verhalten & Timing-Steuerung</span>
                  </h3>

                  {/* Duration customizer (stopwatch stop timing) */}
                  <div className="space-y-1.5 bg-stone-950/40 p-3 rounded-xl border border-stone-850/50">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-stone-300">Video-Anzeigedauer:</span>
                      <span className="font-mono text-[#A855F7] font-bold">{reelConfig?.durationSeconds || 12} Sek.</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={15}
                      step={1}
                      value={reelConfig?.durationSeconds || 12}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setReelConfig((prev: any) => ({ ...prev, durationSeconds: val }));
                      }}
                      onMouseUp={async () => {
                        await syncCardUpdate({ reelExportConfig: reelConfig });
                      }}
                      onTouchEnd={async () => {
                        await syncCardUpdate({ reelExportConfig: reelConfig });
                      }}
                      className="w-full accent-[#A855F7] cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-stone-500 font-bold">
                      <span>5 Sek (Quick Loop)</span>
                      <span>15 Sek (Max Story)</span>
                    </div>
                  </div>

                  {/* CTA Text Customizer - Teil H & I */}
                  {reelConfig?.includeCta !== false && (
                    <div className="space-y-1 bg-stone-950/40 p-3 rounded-xl border border-stone-850/50">
                      <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                        End-CTA Banner Text:
                      </label>
                      <input
                        type="text"
                        value={reelConfig?.ctaText || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReelConfig((prev: any) => ({ ...prev, ctaText: val }));
                        }}
                        onBlur={async () => {
                          await syncCardUpdate({ reelExportConfig: reelConfig });
                        }}
                        maxLength={50}
                        placeholder="z.B. Link in Bio öffnen"
                        className="w-full bg-stone-900 border border-stone-850 focus:border-[#A855F7] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A855F7]/20 font-semibold"
                      />
                      <p className="text-[8px] text-stone-500">
                        Dieser Slogan erscheint als auffälliger Banneraufruf ganz unten im exportierten Video.
                      </p>
                    </div>
                  )}

                  {/* Toggle switches list for manual control */}
                  <div className="space-y-2.5 bg-stone-950/40 p-3.5 rounded-xl border border-stone-850/50 text-[10.5px]">
                    <span className="block font-extrabold text-stone-300 uppercase tracking-wider text-[9px] mb-2 border-b border-[#A855F7]/10 pb-1.5 text-[#A855F7]">
                      Manuelle Element-Umschalter
                    </span>
                    
                    {[
                      { key: 'includeProfileSection', label: lang === 'de' ? 'Profilbereich einblenden' : 'Include Profile section' },
                      { key: 'includeButtons', label: lang === 'de' ? 'Button/Kachel-Gruppe einblenden' : 'Include Buttons Group' },
                      { key: 'includeQrCode', label: lang === 'de' ? 'QR-Code einblenden' : 'Include QR-Code' },
                      { key: 'includeBranding', label: lang === 'de' ? 'ureel-Branding einblenden' : 'Include Branding' },
                      { key: 'includeCta', label: lang === 'de' ? 'End-CTA Banner einblenden' : 'Include CTA banner' }
                    ].map((item) => {
                      const enabled = reelConfig?.[item.key] !== false;
                      return (
                        <div key={item.key} className="flex items-center justify-between">
                          <span className="text-stone-300 font-bold">{item.label}</span>
                          <button
                            onClick={() => handleToggleElementInReel(item.key)}
                            className={`p-1 w-9 rounded-full transition-colors flex ${
                              enabled ? 'bg-[#A855F7] justify-end' : 'bg-stone-800 justify-start'
                            } cursor-pointer`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-stone-950 block shadow-md" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              )
            ) : (
              <>
                {/* 4 SLEEK MAIN CATEGORY SELECTORS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 select-none">
              {/* Category 1: Meine ureels */}
              <button
                type="button"
                onClick={() => setDashboardActiveTab('my-cards')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition duration-150 text-center cursor-pointer border shadow-sm ${
                  dashboardActiveTab === 'my-cards' 
                    ? 'bg-[#A855F7] border-[#A855F7] text-stone-950 font-black' 
                    : 'bg-[#121212] hover:bg-stone-900 border-stone-850 text-stone-350 hover:text-white font-bold'
                }`}
              >
                <LucideIcons.FolderHeart size={16} className={dashboardActiveTab === 'my-cards' ? 'text-stone-950' : 'text-[#A855F7]'} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {lang === 'de' ? 'Meine ureels' : 'My ureels'}
                </span>
              </button>

              {/* Category 2: ureel-Status */}
              <button
                type="button"
                onClick={() => setDashboardActiveTab('card-status')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition duration-150 text-center cursor-pointer border shadow-sm ${
                  dashboardActiveTab === 'card-status' 
                    ? 'bg-[#A855F7] border-[#A855F7] text-stone-950 font-black' 
                    : 'bg-[#121212] hover:bg-stone-900 border-stone-850 text-stone-350 hover:text-white font-bold'
                }`}
              >
                <LucideIcons.Settings size={16} className={dashboardActiveTab === 'card-status' ? 'text-stone-950' : 'text-[#A855F7]'} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {lang === 'de' ? 'ureel-Status' : 'Card Status'}
                </span>
              </button>

              {/* Category 3: SEO und Teilen */}
              <button
                type="button"
                onClick={() => setDashboardActiveTab('seo-sharing')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition duration-150 text-center cursor-pointer border shadow-sm ${
                  dashboardActiveTab === 'seo-sharing' 
                    ? 'bg-[#A855F7] border-[#A855F7] text-stone-950 font-black' 
                    : 'bg-[#121212] hover:bg-stone-900 border-stone-850 text-stone-350 hover:text-white font-bold'
                }`}
              >
                <LucideIcons.Search size={16} className={dashboardActiveTab === 'seo-sharing' ? 'text-stone-950' : 'text-[#A855F7]'} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {lang === 'de' ? 'SEO und Teilen' : 'SEO & Share'}
                </span>
              </button>

              {/* Category 4: Business-Zentrale */}
              <button
                type="button"
                onClick={() => setDashboardActiveTab('business-hub')}
                className={`py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition duration-150 text-center cursor-pointer border shadow-sm ${
                  dashboardActiveTab === 'business-hub' 
                    ? 'bg-[#A855F7] border-[#A855F7] text-stone-950 font-black' 
                    : 'bg-[#121212] hover:bg-stone-900 border-stone-850 text-stone-350 hover:text-white font-bold'
                }`}
              >
                <LucideIcons.Briefcase size={16} className={dashboardActiveTab === 'business-hub' ? 'text-stone-950' : 'text-[#A855F7]'} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                  {lang === 'de' ? 'Business-Zentrale' : 'Business Hub'}
                </span>
              </button>
            </div>

            {/* Meine ureels (My Cards) panel */}
            {dashboardActiveTab === 'my-cards' && (
              <div id="my-cards-section" className="bg-[#121212] border border-stone-850 rounded-3xl p-5 md:p-6 shadow-xl font-sans relative animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-850">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <LucideIcons.FolderHeart size={16} className="text-[#A855F7]" />
                    {t.myCards}
                  </h2>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {lang === 'de' 
                      ? 'Verwalte alle deine digitalen Visitenkarten.' 
                      : 'Manage all your digital business cards.'}
                  </p>
                </div>
                <button
                  onClick={handleAddNewCard}
                  disabled={isCreatingState}
                  className={`bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-extrabold text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow ${
                    isCreatingState ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isCreatingState ? (
                    <LucideIcons.Loader className="animate-spin text-stone-950" size={13} />
                  ) : (
                    <LucideIcons.Plus size={13} className="stroke-[3]" />
                  )}
                  {isCreatingState ? (lang === 'de' ? 'Erstelle...' : 'Creating...') : t.createNewCard}
                </button>
              </div>

              {/* Cards Grid */}
              <div className="mt-5">
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-stone-800 rounded-3xl bg-stone-950/40">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-850 flex items-center justify-center mb-4 text-stone-500">
                      <LucideIcons.FolderOpen size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1.5">
                      {lang === 'de' ? 'Noch keine ureel-Karte vorhanden' : 'No ureel card yet'}
                    </h3>
                    <p className="text-xs text-stone-400 font-semibold mb-6 max-w-xs leading-relaxed">
                      {lang === 'de' ? 'Erstelle deine erste digitale Karte.' : 'Create your first digital card.'}
                    </p>
                    <button
                      onClick={handleAddNewCard}
                      disabled={isCreatingState}
                      className="cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-55 text-stone-950 font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow border-0"
                    >
                      {isCreatingState ? (
                        <LucideIcons.Loader className="animate-spin text-stone-950" size={14} />
                      ) : (
                        <LucideIcons.Plus size={14} className="stroke-[3]" />
                      )}
                      <span>{lang === 'de' ? 'Erste ureel-Karte erstellen' : 'Create first ureel card'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto max-h-[550px] pr-4 pb-4">
                    {/* Compact Premium Create Card Tile */}
                    <button
                      type="button"
                      onClick={handleAddNewCard}
                      disabled={isCreatingState}
                      className="flex flex-col justify-center p-4.5 min-h-[120px] rounded-2xl border border-dashed border-[#A855F7]/30 hover:border-[#A855F7] bg-stone-950/30 hover:bg-[#A855F7]/5 text-left transition duration-200 select-none cursor-pointer group focus:outline-none w-full"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] group-hover:bg-[#A855F7] group-hover:text-stone-950 transition duration-150 shrink-0">
                          {isCreatingState ? (
                            <LucideIcons.Loader className="animate-spin" size={15} />
                          ) : (
                            <LucideIcons.Plus size={15} className="stroke-[3]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#A855F7] transition">
                            {lang === 'de' ? 'Neue ureel erstellen' : 'New ureel'}
                          </h4>
                          <p className="text-[10px] text-stone-400 font-semibold group-hover:text-stone-300 transition mt-0.5">
                            {lang === 'de' ? 'Starte eine neue Seite' : 'Start a brand new page'}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Active Cards Grid */}
                    {cards.map((c) => {
                      const isActive = activeCard?.cardId === c.cardId;
                      const cardUrl = getPublicCardUrl(c.slug);
                      const formattedDate = c.updatedAt 
                        ? new Date(c.updatedAt).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—';

                      return (
                        <div 
                          key={c.cardId}
                          onClick={() => {
                            setActiveCard(c);
                            triggerToast(
                              lang === 'de' ? 'Karte geöffnet' : 'Card opened',
                              'success'
                            );
                          }}
                          className={`flex flex-col justify-between p-4.5 min-h-[120px] rounded-2xl border bg-stone-950 cursor-pointer select-none transition-all duration-200 hover:shadow-md relative overflow-hidden group
                            ${isActive 
                              ? 'border-[#A855F7] ring-1 ring-[#A855F7]/25 bg-stone-900/40' 
                              : 'border-stone-850 hover:border-stone-800 hover:bg-stone-900/50'}`}
                        >
                          {/* Name and Status */}
                          <div className="space-y-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between gap-1 w-full">
                              <span className="text-xs font-black text-white block truncate uppercase tracking-widest leading-tight">
                                {c.title || 'Muster-Seite'}
                              </span>
                              
                              {/* Status Badge */}
                              <div className="shrink-0 flex items-center">
                                {c.isPublished ? (
                                  <span className="bg-emerald-950/45 border border-emerald-950/20 text-emerald-450 font-black text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    {lang === 'de' ? 'Aktiv' : 'Active'}
                                  </span>
                                ) : (
                                  <span className="bg-stone-900 border border-stone-800 text-stone-500 font-black text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-stone-650" />
                                    {lang === 'de' ? 'Entwurf' : 'Draft'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[9px] font-mono lowercase text-stone-500 block truncate">
                              /u/{c.slug}
                            </span>
                          </div>

                          {/* Date & Icons Bottom Section */}
                          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-stone-900/80">
                            <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider">
                              {formattedDate}
                            </span>

                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Action 1: Duplicate */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateCard(c);
                                }}
                                className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition duration-150 cursor-pointer"
                                title={lang === 'de' ? 'Kopieren' : 'Copy'}
                              >
                                <LucideIcons.Copy size={13} />
                              </button>

                              {/* Action 2: Edit */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCard(c);
                                  triggerToast(
                                    lang === 'de' ? 'Karte geöffnet' : 'Card opened',
                                    'success'
                                  );
                                }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition duration-150 cursor-pointer
                                  ${isActive
                                    ? 'bg-[#A855F7]/10 border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/20'
                                    : 'bg-stone-900 hover:bg-stone-800 border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white'}`}
                                title={lang === 'de' ? 'Bearbeiten' : 'Edit'}
                              >
                                <LucideIcons.Pencil size={13} />
                              </button>

                              {/* Action 3: Delete */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCardWithConfirm(c);
                                }}
                                className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-red-950/60 border border-stone-800 hover:border-red-900/60 text-stone-400 hover:text-red-400 flex items-center justify-center transition duration-150 cursor-pointer"
                                title={lang === 'de' ? 'Löschen' : 'Delete'}
                              >
                                <LucideIcons.Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Prompt 7A: Business-Zentrale */}
            {dashboardActiveTab === 'business-hub' && (
              <BusinessHub 
                user={user}
                profile={profile}
                lang={lang}
                effectivePlanId={effectivePlanId}
                cards={cards}
                simulatedOverrides={{ simulatedPlan }}
                onUpdateCards={fetchUserCards}
              />
            )}

            {/* Active Card Configuration Details Panel */}
            {activeCard && (dashboardActiveTab === 'card-status' || dashboardActiveTab === 'seo-sharing') && (
              <div className="bg-[#121212] border border-stone-850 rounded-3xl p-5 md:p-6 shadow-xl font-sans relative animate-fadeIn">
                <div className="flex items-center justify-between pb-3.5 border-b border-stone-850 mb-5">
                  <div className="flex items-center gap-2">
                    {dashboardActiveTab === 'card-status' ? (
                      <>
                        <LucideIcons.Settings size={15} className="text-[#A855F7]" />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {lang === 'de' ? 'Karten-Status & Slug' : 'Card Status & Slug'}
                        </h3>
                      </>
                    ) : (
                      <>
                        <LucideIcons.Search size={15} className="text-[#A855F7]" />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {lang === 'de' ? 'SEO-Optimierung & Teilen' : 'SEO & Sharing'}
                        </h3>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {dashboardActiveTab === 'card-status' && (
                    <>
                  {/* Status Block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-850">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeCard.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                      <div>
                        <span className="text-[9px] uppercase font-mono font-black text-stone-500 block leading-none mb-1">Status</span>
                        <span className="text-xs font-black text-white leading-none">
                          {activeCard.isPublished 
                            ? (lang === 'de' ? 'Veröffentlicht (Live)' : 'Published (Live)')
                            : (lang === 'de' ? 'Entwurf (Offline)' : 'Draft (Offline)')
                          }
                        </span>
                      </div>
                    </div>

                    {activeCard.isPublished ? (
                      <button
                        onClick={() => syncCardUpdate({ isPublished: false })}
                        className="bg-amber-950/40 hover:bg-amber-900/40 border border-amber-900/60 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Entwurf schalten' : 'Switch to Draft'}
                      </button>
                    ) : (
                      <button
                        onClick={() => syncCardUpdate({ isPublished: true })}
                        className="bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/60 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Veröffentlichen' : 'Publish'}
                      </button>
                    )}
                  </div>

                  {/* Slug input block */}
                  {(() => {
                    const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'free';
                    const isSlugLocked = !canUseFeature(activePlanId, 'customSlug');
                    const normalizedDisplay = normalizeSlug(slugDraft);

                    let statusText = '';
                    let statusColor = 'text-stone-450';
                    if (slugCheckStatus === 'empty') {
                      statusText = lang === 'de' ? 'Bitte gib einen Linknamen ein.' : 'Please enter a link name.';
                      statusColor = 'text-red-400 font-bold';
                    } else if (slugCheckStatus === 'invalid') {
                      statusText = lang === 'de' ? 'Dieser Linkname ist nicht gültig.' : 'This link name is not valid.';
                      statusColor = 'text-red-400 font-bold';
                    } else if (slugCheckStatus === 'taken') {
                      statusText = lang === 'de' ? 'Dieser Link ist bereits vergeben.' : 'This link is already taken.';
                      statusColor = 'text-red-400 font-bold';
                    } else if (slugCheckStatus === 'available') {
                      statusText = lang === 'de' ? 'Dieser Link ist verfügbar.' : 'This link is available.';
                      statusColor = 'text-emerald-400 font-bold';
                    } else if (slugCheckStatus === 'checking') {
                      statusText = lang === 'de' ? 'Prüfung läuft...' : 'Checking availability...';
                      statusColor = 'text-[#A855F7] font-bold animate-pulse';
                    }

                    return (
                      <div className="space-y-3.5 pt-4 border-t border-stone-850">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            {lang === 'de' ? 'Öffentlicher Link' : 'Public link'}
                            {isSlugLocked && <span className="text-amber-500 font-bold text-[10px] uppercase">🔒 (ab PRO)</span>}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                            {lang === 'de' ? 'Passe den Link deiner aktiven ureel-Seite an.' : 'Customize the link of your active ureel card.'}
                          </p>
                        </div>

                        <div 
                          className="space-y-2"
                          onClick={() => {
                            if (isSlugLocked) {
                              setUpgradeFeatureKey('customSlug');
                              setShowUpgradeModal(true);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-stone-950 border border-stone-850 rounded-xl px-3 py-2 text-stone-500 text-xs shrink-0 font-mono">
                              /u/
                            </div>
                            <input
                              type="text"
                              placeholder="dein-linkname"
                              value={slugDraft}
                              disabled={isSlugLocked}
                              onChange={handleSlugInputChange}
                              onBlur={() => {
                                if (!isSlugLocked) {
                                  setSlugDraft(normalizeSlug(slugDraft));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSlug();
                                }
                              }}
                              className={`flex-grow border rounded-xl px-3 py-2 text-xs transition font-sans ${
                                isSlugLocked 
                                  ? 'bg-stone-950 border-stone-850 text-stone-500 cursor-not-allowed select-none' 
                                  : 'bg-stone-900 border-stone-800 hover:border-stone-750 focus:border-[#A855F7] text-white focus:outline-none'
                              }`}
                            />
                          </div>

                          {/* Dynamic Domain/Path display mapping */}
                          <div className="bg-stone-950/60 border border-stone-900 px-3 py-2 rounded-xl text-[10.5px] text-stone-400 font-medium font-mono truncate">
                            <span className="text-stone-600">URL: </span>
                            <span className="text-[#A855F7]">{window.location.origin}/u/</span>
                            <span className="text-stone-200 font-bold">{normalizedDisplay || '[dein-linkname]'}</span>
                          </div>

                          {statusText && (
                            <p className={`text-[10px] font-sans px-1 ${statusColor}`}>
                              {statusText}
                            </p>
                          )}

                          {/* Action Controls layout (compact & sleek) */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {!isSlugLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckSlugAvailability();
                                  }}
                                  disabled={slugCheckStatus === 'checking'}
                                  className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition cursor-pointer"
                                >
                                  {lang === 'de' ? 'Verfügbarkeit prüfen' : 'Check availability'}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveSlug();
                                  }}
                                  disabled={isSavingSlug}
                                  className="bg-[#A855F7] hover:bg-[#b08e35] text-stone-950 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 inline-flex"
                                >
                                  {isSavingSlug ? (
                                    <LucideIcons.Loader className="animate-spin shrink-0" size={11} />
                                  ) : (
                                    <LucideIcons.Check size={11} className="shrink-0" />
                                  )}
                                  <span>{lang === 'de' ? 'Speichern' : 'Save'}</span>
                                </button>
                              </>
                            )}

                            {activeCard.slug && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                                    navigator.clipboard.writeText(pubUrl);
                                    triggerToast(lang === 'de' ? 'Link in die Zwischenablage kopiert!' : 'Link copied to clipboard!', 'success');
                                  }}
                                  className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 inline-flex"
                                >
                                  <LucideIcons.Copy size={11} className="shrink-0" />
                                  <span>{lang === 'de' ? 'Link kopieren' : 'Copy link'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const pubUrl = `${window.location.origin}/u/${activeCard.slug}`;
                                    window.open(pubUrl, '_blank');
                                  }}
                                  className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 inline-flex"
                                >
                                  <LucideIcons.ExternalLink size={11} className="shrink-0" />
                                  <span>{lang === 'de' ? 'Link öffnen' : 'Open link'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Prompt 6C: KONU Branding Selection */}
                  {(() => {
                    const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'starter';
                    const isBrandingLocked = !canUseFeature(activePlanId, 'brandingHidden');
                    const brandingHidden = !!activeCard.brandingHidden;

                    return (
                      <div className="pt-4 border-t border-stone-850">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            {t.brandingSectionTitle}
                            {isBrandingLocked && <span className="text-amber-500 font-bold text-[10px] uppercase">🔒 (ab PRO)</span>}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                            {lang === 'de' ? 'Entferne das ureel-Logo und Wasserzeichen von deiner öffentlichen Karte.' : 'Remove the ureel logo and watermark from your public card.'}
                          </p>
                        </div>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (isBrandingLocked) {
                                setUpgradeFeatureKey('brandingHidden');
                                setShowUpgradeModal(true);
                              } else {
                                syncCardUpdate({ brandingHidden: !brandingHidden });
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 border rounded-2xl transition text-left cursor-pointer ${
                              isBrandingLocked
                                ? 'bg-stone-950/40 border-stone-900/60 hover:border-stone-850 text-stone-450'
                                : brandingHidden
                                  ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                                  : 'bg-stone-900 border-stone-800 hover:border-stone-750 text-stone-200'
                            }`}
                          >
                            <span className="text-xs font-semibold">
                              {t.brandingToggleLabel}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {isBrandingLocked ? (
                                <LucideIcons.Lock size={13} className="text-amber-500" />
                              ) : brandingHidden ? (
                                <LucideIcons.EyeOff size={15} className="text-emerald-400" />
                              ) : (
                                <LucideIcons.Eye size={15} className="text-stone-400" />
                              )}
                              <div className={`w-8 h-4.5 rounded-full p-0.5 transition duration-205 ${
                                brandingHidden && !isBrandingLocked ? 'bg-emerald-500' : 'bg-stone-800'
                              }`}>
                                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition duration-205 ${
                                  brandingHidden && !isBrandingLocked ? 'translate-x-[14px]' : 'translate-x-[0px]'
                                }`} />
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Prompt 6C: Simple Visitor Statistics */}
                  {(() => {
                    const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'starter';
                    const isStatsLocked = !canUseFeature(activePlanId, 'simpleAnalytics');

                    const todayStr = getTodayDateString();
                    const todayViews = analyticsSummary?.dailyViews?.[todayStr] || 0;
                    const totalViews = analyticsSummary?.totalViews || 0;
                    const totalClicks = analyticsSummary?.totalButtonClicks || 0;

                    const buttonClicksObj = analyticsSummary?.buttonClicks || {};
                    const sortedButtons = (activeCard?.buttons || [])
                      .map(b => {
                        const normalized = normalizeButton(b);
                        return {
                          id: normalized.id,
                          title: normalized.title || normalized.actionType,
                          clicks: buttonClicksObj[normalized.id] || 0
                        };
                      })
                      .filter(b => b.clicks > 0)
                      .sort((a, b) => b.clicks - a.clicks)
                      .slice(0, 3);

                    return (
                      <div className="pt-4 border-t border-stone-850">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            {t.analyticsSectionTitle}
                            {isStatsLocked && <span className="text-amber-500 font-bold text-[10px] uppercase">🔒 (ab PRO)</span>}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                            {lang === 'de' ? 'Echtzeit-Einblicke in deine Kartenaufrufe und Interaktionen.' : 'Real-time insights on your card views and interactions.'}
                          </p>
                        </div>

                        {isStatsLocked ? (
                          <div className="mt-3 relative overflow-hidden rounded-2xl border border-stone-900 bg-stone-950/40 p-4 min-h-[140px] flex flex-col items-center justify-center text-center">
                            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
                              <LucideIcons.Lock size={18} className="text-amber-500 mb-1.5" />
                              <span className="text-xs font-bold text-stone-200">
                                {lang === 'de' ? 'Besucherstatistiken freischalten' : 'Unlock visitor statistics'}
                              </span>
                              <span className="text-[10px] text-stone-450 mt-0.5 mb-2.5 max-w-[220px]">
                                {t.analyticsProOnlyUpgrade}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUpgradeFeatureKey('simpleAnalytics');
                                  setShowUpgradeModal(true);
                                }}
                                className="cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-[10px] uppercase tracking-wider font-extrabold px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1"
                              >
                                <span>{lang === 'de' ? 'Jetzt upgraden' : 'Upgrade now'}</span>
                                <LucideIcons.ArrowRight size={10} className="stroke-[2.5]" />
                              </button>
                            </div>

                            <div className="w-full grid grid-cols-3 gap-2 opacity-25">
                              <div className="bg-stone-900 p-2.5 rounded-xl text-center">
                                <span className="text-stone-500 text-[10px]">Aufrufe</span>
                                <div className="text-sm font-bold text-white">1,240</div>
                              </div>
                              <div className="bg-stone-900 p-2.5 rounded-xl text-center">
                                <span className="text-stone-500 text-[10px]">Heute</span>
                                <div className="text-sm font-bold text-white">45</div>
                              </div>
                              <div className="bg-stone-900 p-2.5 rounded-xl text-center">
                                <span className="text-stone-500 text-[10px]">Klicks</span>
                                <div className="text-sm font-bold text-white">389</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-stone-950 border border-stone-850/80 p-3 rounded-2xl text-center">
                                <div className="text-[10px] text-stone-500 uppercase font-bold leading-none mb-1">
                                  {lang === 'de' ? 'Gesamt' : 'Total'}
                                </div>
                                <div className="text-sm font-black text-stone-100 font-mono">
                                  {totalViews}
                                </div>
                              </div>
                              <div className="bg-stone-950 border border-stone-850/80 p-3 rounded-2xl text-center">
                                <div className="text-[10px] text-stone-500 uppercase font-bold leading-none mb-1">
                                  {t.analyticsToday}
                                </div>
                                <div className="text-sm font-black text-[#A855F7] font-mono">
                                  {todayViews}
                                </div>
                              </div>
                              <div className="bg-stone-950 border border-stone-850/80 p-3 rounded-2xl text-center">
                                <div className="text-[10px] text-stone-500 uppercase font-bold leading-none mb-1">
                                  {lang === 'de' ? 'Klicks' : 'Clicks'}
                                </div>
                                <div className="text-sm font-black text-emerald-400 font-mono">
                                  {totalClicks}
                                </div>
                              </div>
                            </div>

                            <div className="bg-stone-950/40 border border-stone-900 p-3.5 rounded-2xl space-y-2.5">
                              <h5 className="text-[10px] uppercase font-black tracking-wider text-stone-400 flex items-center justify-between">
                                <span>{t.analyticsTopButtons}</span>
                                <LucideIcons.TrendingUp size={11} className="text-emerald-400" />
                              </h5>

                              {sortedButtons.length === 0 ? (
                                <p className="text-[10px] text-stone-500 text-center py-2 italic font-sans font-semibold">
                                  {t.analyticsNoDataYet}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {sortedButtons.map((btn) => {
                                    const maxClicks = Math.max(...sortedButtons.map(b => b.clicks)) || 1;
                                    const pct = Math.round((btn.clicks / maxClicks) * 100);
                                    return (
                                      <div key={btn.id} className="space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-medium px-0.5 font-sans">
                                          <span className="text-stone-300 truncate max-w-[170px]">{btn.title}</span>
                                          <span className="text-stone-450 font-mono font-bold shrink-0">{btn.clicks} Clicks</span>
                                        </div>
                                        <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                                          <div 
                                            className="bg-gradient-to-r from-[#A855F7] to-emerald-500 h-full rounded-full transition-all duration-300" 
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  </>
                )}

                {/* SEO & Sharing Module inside the same parent card structure */}
                {dashboardActiveTab === 'seo-sharing' && (() => {
                  const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'starter';
                  const isSeoLocked = !canUseFeature(activePlanId, 'seoSettings');
                  
                  return (
                    <SeoSharingModule
                      activeCard={activeCard}
                      lang={lang}
                      syncCardUpdate={syncCardUpdate}
                      isLocked={isSeoLocked}
                      onTriggerUpgrade={() => {
                        setUpgradeFeatureKey('seoSettings');
                        setShowUpgradeModal(true);
                      }}
                    />
                  );
                })()}

                  {/* Admin Tools Block */}
                  {(() => {
                    const isKonuAdmin = user?.email?.trim().toLowerCase() === "nfctagsproducts@gmail.com";
                    if (!isKonuAdmin) return null;

                    return (
                      <div className="pt-4 border-t border-stone-850">
                        <div className="border-b border-stone-850 pb-2 mb-3">
                          <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                            <LucideIcons.ShieldAlert size={14} />
                            <span>Admin Tools</span>
                          </h4>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                            {lang === 'de' 
                              ? 'Spezielle Admin-Funktionen zur JSON-Extraktion für llm-assoziierte Kontextoptimierung.' 
                              : 'Special admin tools for JSON extraction to enable LLM-based context improvements.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleExportCardJson('download')}
                            className="bg-rose-950/20 hover:bg-rose-900/35 border border-rose-900/40 text-rose-200 font-extrabold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <LucideIcons.Download size={13} />
                            <span>{lang === 'de' ? 'Karte als JSON exportieren' : 'Export card as JSON'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportCardJson('copy')}
                            className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <LucideIcons.Copy size={13} />
                            <span>{lang === 'de' ? 'JSON kopieren' : 'Copy JSON'}</span>
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleExportCardJson('view')}
                          className="w-full mt-2 bg-stone-950 hover:bg-stone-900/60 border border-stone-900 text-stone-400 font-normal text-[10.5px] uppercase tracking-wider py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <LucideIcons.Code size={12} />
                          <span>{lang === 'de' ? 'Inhalte anzeigen' : 'Show JSON content'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setImportInputJson('');
                            setImportValidatedData(null);
                            setImportValidationError(null);
                            setImportValidationWarnings([]);
                            setApplyEmptyValues(false);
                            setShowAdminImportModal(true);
                          }}
                          className="w-full mt-2 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 text-rose-300 font-bold text-[10.5px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <LucideIcons.Upload size={12} />
                          <span>{lang === 'de' ? 'SEO-Rückführung importieren' : 'Import SEO return'}</span>
                        </button>

                        {/* LLM SEO-Prompt Section */}
                        <div className="mt-3.5 pt-3.5 border-t border-stone-850/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">SEO LLM Prompt Tools</span>
                            <button
                              type="button"
                              onClick={() => setShowLlmPromptText(!showLlmPromptText)}
                              className="text-[10px] text-stone-500 hover:text-stone-300 underline font-normal transition cursor-pointer"
                            >
                              {showLlmPromptText 
                                ? (lang === 'de' ? 'Prompt ausblenden' : 'Hide prompt') 
                                : (lang === 'de' ? 'Prompt anzeigen' : 'View prompt')}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={handleCopyLlmPromptOnly}
                              className="bg-rose-950/25 hover:bg-rose-900/40 border border-rose-900/40 text-stone-200 font-extrabold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <LucideIcons.Copy size={13} />
                              <span>{lang === 'de' ? 'LLM SEO-Prompt kopieren' : 'Copy LLM SEO prompt'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleCopyLlmCombined}
                              className="bg-stone-900 hover:bg-[#A855F7]/10 border border-[#A855F7]/25 text-[#A855F7] font-extrabold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <LucideIcons.Sparkles size={13} />
                              <span>{lang === 'de' ? 'Prompt + Karten-JSON kopieren' : 'Copy prompt + card JSON'}</span>
                            </button>
                          </div>

                          <p className="text-[10px] text-stone-500 font-light leading-relaxed">
                            {lang === 'de' 
                              ? 'Diesen Prompt zuerst in eine externe LLM einfügen. Danach den KONU JSON-Export darunter einfügen. Die LLM erzeugt daraus eine importierbare SEO-Rückführung.'
                              : 'Paste this prompt into an external LLM first. Then paste the KONU JSON export below it. The LLM will generate an importable SEO return file.'}
                          </p>

                          {showLlmPromptText && (
                            <div className="mt-2 text-left bg-stone-950 border border-stone-900 p-3 rounded-xl">
                              <label className="block text-[10px] uppercase font-black text-rose-500 mb-1.5 tracking-wider">
                                {lang === 'de' ? 'SEO-Prompt Text' : 'SEO Prompt Text'}
                              </label>
                              <textarea
                                readOnly
                                value={SEO_LLM_PROMPT}
                                className="w-full h-40 bg-stone-900/60 border border-stone-850 text-stone-300 rounded p-2 text-[10.5px] font-mono leading-relaxed focus:outline-none"
                                onClick={(e) => (e.target as any).select()}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {!activeCard && (dashboardActiveTab === 'card-status' || dashboardActiveTab === 'seo-sharing') && (
              <div className="bg-[#121212] border border-stone-850 rounded-3xl p-6 shadow-xl font-sans text-center text-stone-400 space-y-4 animate-fadeIn items-center justify-center flex flex-col">
                <LucideIcons.FolderHeart size={28} className="mx-auto text-[#A855F7]" />
                <h3 className="font-extrabold uppercase tracking-wider text-sm text-white">
                  {lang === 'de' ? 'Keine Karte aktiv' : 'No card active'}
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                  {lang === 'de' 
                    ? 'Bitte wähle zuerst unter „Meine ureels“ ein ureel aus, um deren Einstellungen zu bearbeiten.'
                    : 'Please select a ureel from “My ureels” first to edit its settings.'}
                </p>
                <button
                  type="button"
                  onClick={() => setDashboardActiveTab('my-cards')}
                  className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-extrabold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer"
                >
                  {lang === 'de' ? 'Zu meinen ureels' : 'Go to My ureels'}
                </button>
              </div>
            )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: INTERACTIVE DEVICE VIEW (7 cols on desktop) */}
          <div 
            ref={cardPreviewRef}
            id="interactive-device-view"
            className="lg:col-span-7 flex flex-col items-center gap-5 order-1 lg:order-2 w-full lg:max-w-none lg:mx-auto"
          >
            
            {activeCard && (
              <div className="text-center w-full max-w-[430px] lg:max-w-[500px] xl:max-w-[525px] flex flex-col items-center gap-2 px-2">
                <p className="text-stone-400 text-xs flex items-center justify-center gap-1.5 bg-stone-900/60 border border-stone-800/80 px-4 py-2.5 rounded-xl font-medium w-full font-semibold">
                  <LucideIcons.Sparkles size={13} className="text-[#A855F7] shrink-0" />
                  <span>{lang === 'de' ? 'Passe deine Inhalte direkt innerhalb deiner Karten-Vorschau an.' : 'Customize your content directly within your card preview below.'}</span>
                </p>
              </div>
            )}

                {/* Mode Selector Tabs (Karte vs. Reel) - Teil C */}
                {activeCard && (
                  <div className="flex bg-[#161616] border border-stone-850 p-1 rounded-2xl mb-4 gap-1 select-none w-full max-w-[430px] lg:max-w-[500px] xl:max-w-[525px]">
                    <button
                      onClick={() => setPreviewMode('card')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${
                        previewMode === 'card'
                          ? 'bg-[#A855F7] text-stone-950 shadow-md'
                          : 'text-stone-400 hover:text-stone-200 bg-transparent'
                      }`}
                    >
                      <LucideIcons.Tv size={12} />
                      <span>{lang === 'de' ? 'Interaktive Karte' : 'Interactive Card'}</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('reel')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer ${
                        previewMode === 'reel'
                          ? 'bg-[#A855F7] text-stone-950 shadow-md'
                          : 'text-[#A855F7] hover:bg-stone-900 bg-transparent border border-[#A855F7]/25'
                      }`}
                    >
                      <LucideIcons.Video size={12} />
                      <span>{lang === 'de' ? 'Interaktive Karte' : 'Interactive Card'}</span>
                    </button>
                  </div>
                )}

                {activeCard ? (
                  <div className={`relative w-full md:shadow-2xl rounded-none md:rounded-3xl border-0 md:border md:border-stone-850 p-0 md:p-[1px] bg-none md:bg-gradient-to-b md:from-stone-800 md:to-stone-950 overflow-hidden transition-all duration-300 ${
                    previewMode === 'reel' 
                      ? 'max-w-[375px]' 
                      : 'max-w-[430px] lg:max-w-[500px] xl:max-w-[525px]'
                  }`}>
                    
                    {/* Simulated Compact Top-Bar for Mock Device in Editor Preview to match Mobile exactly */}
                    <div className="flex h-11 items-center justify-between px-3.5 bg-[#111111] border-b border-stone-850/60 z-30 shrink-0 select-none w-full">
                       <div className="flex items-center gap-1.5">
                        <img 
                          src="/brand/ureel-icon-512.png" 
                          alt="ureel" 
                          className="w-4.5 h-4.5 rounded bg-stone-950 object-contain animate-pulse"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] tracking-widest font-black text-[#A855F7] font-mono uppercase">ureel live</span>
                      </div>
                      {/* Premium mobile system status bar (Wifi, Signal, Battery) */}
                      <div className="flex items-center gap-2.5 text-stone-500 text-[10px] font-bold font-mono">
                        <span>12:00</span>
                        <div className="flex items-center gap-1">
                          <LucideIcons.Signal size={12} className="stroke-[2]" />
                          <LucideIcons.Wifi size={12} className="stroke-[2]" />
                          <LucideIcons.Battery size={12} className="stroke-[2]" />
                        </div>
                      </div>
                    </div>

                    {/* Subtle Golden Dot Grid Layout over entire mockup container */}
                    <div
                      className={`relative px-0 py-0 flex flex-col items-stretch justify-start cursor-pointer select-none transition-all duration-500 overflow-hidden bg-stone-950 border-0 sm:border sm:border-stone-850/80 shadow-none sm:shadow-2xl ${
                        previewMode === 'reel'
                          ? 'aspect-[9/16] min-h-[580px] w-full'
                          : 'min-h-[720px]'
                      }`}
                    >
                      {/* Social Media Safe Zones Grid Overlay (Teil J) */}
                      {previewMode === 'reel' && socialOverlay === 'instagram' && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 bg-transparent animate-fadeIn">
                          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-extrabold tracking-wider font-sans">
                            <span>Reels</span>
                            <LucideIcons.Camera size={13} />
                          </div>
                          <div className="self-end flex flex-col gap-3.5 items-center mr-1 text-white/80">
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Heart size={18} className="fill-transparent stroke-white" /><span className="text-[9px] font-black">12.5K</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.MessageCircle size={18} /><span className="text-[9px] font-black">198</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Send size={18} /></div>
                            <div className="items-center"><LucideIcons.MoreVertical size={18} /></div>
                          </div>
                          <div className="bg-black/55 backdrop-blur-xs p-2 rounded-xl text-left space-y-1 max-w-[75%]">
                            <span className="text-[9px] font-black text-white">@mein_profil</span>
                            <p className="text-[7.5px] text-stone-200 line-clamp-2">Hier liegen Instagram Reel Captions, Profilinfos & Audiosysteme, die untere Widgets verdecken können.</p>
                          </div>
                          <div className="absolute inset-x-4 top-14 bottom-28 border border-dashed border-[#A855F7]/50 flex items-center justify-center rounded-xl pointer-events-none">
                            <div className="text-[8px] tracking-wider uppercase font-black text-[#A855F7]/80 bg-stone-950 border border-[#A855F7]/30 px-2 py-0.5 rounded">Instagram Safe Zone Area</div>
                          </div>
                        </div>
                      )}

                      {previewMode === 'reel' && socialOverlay === 'tiktok' && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 bg-transparent animate-fadeIn">
                          <div className="flex items-center justify-center gap-3 text-white/40 text-[9px] uppercase font-black tracking-widest font-sans">
                            <span>Folge ich</span>
                            <span className="text-white border-b-2 border-white pb-0.5">Für dich</span>
                          </div>
                          <div className="self-end flex flex-col gap-3.5 items-center mr-0 text-white/90">
                            <div className="w-8 h-8 rounded-full border border-white/60 bg-stone-900 flex items-center justify-center"><LucideIcons.Plus size={12} /></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Heart size={20} className="fill-red-500 stroke-transparent" /><span className="text-[9px] font-black">48K</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.MessageCircle size={20} className="fill-white stroke-transparent" /><span className="text-[9px] font-black">1.1K</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Bookmark size={20} className="fill-amber-500 stroke-transparent" /><span className="text-[9px] font-black">630</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Share2 size={20} /><span className="text-[9px] font-black">Share</span></div>
                          </div>
                          <div className="bg-black/55 backdrop-blur-xs p-2 rounded-xl text-left space-y-1 max-w-[75%] mb-1">
                            <span className="text-[9px] font-black text-white">@mein_profil • TikTok</span>
                            <p className="text-[7.5px] text-[#F5EFE3] leading-normal font-medium">TikTok Active Interface. Hier liegende Texte oder QR-Codes können vom Swipe-Overlay beschnitten werden!</p>
                          </div>
                          <div className="absolute inset-x-4 top-12 bottom-32 border border-dashed border-red-500/50 flex items-center justify-center rounded-xl pointer-events-none">
                            <div className="text-[8px] tracking-wider uppercase font-black text-red-500/80 bg-stone-950 border border-red-500/30 px-2 py-0.5 rounded">TikTok Active Safe Area</div>
                          </div>
                        </div>
                      )}

                      {previewMode === 'reel' && socialOverlay === 'youtube' && (
                        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 bg-transparent animate-fadeIn">
                          <div className="flex items-center justify-between text-white/50 text-xs">
                            <LucideIcons.ChevronLeft size={16} />
                            <LucideIcons.Search size={16} />
                          </div>
                          <div className="self-end flex flex-col gap-3.5 items-center mr-1 text-white/80">
                            <div className="flex flex-col items-center gap-1"><LucideIcons.ThumbsUp size={18} /><span className="text-[9px] font-bold">120K</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.ThumbsDown size={18} /><span className="text-[9px] font-bold">Dislike</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.MessageCircle size={18} /><span className="text-[9px] font-bold">87</span></div>
                            <div className="flex flex-col items-center gap-1"><LucideIcons.Share size={18} /><span className="text-[9px] font-bold">Share</span></div>
                          </div>
                          <div className="bg-stone-950/60 backdrop-blur-xs p-2 rounded-xl text-left max-w-[75%]">
                            <p className="text-[7.5px] text-stone-200">YouTube Shorts overlay system check. Elemente unterhalb dieser Kante können nicht fokussiert werden.</p>
                          </div>
                          <div className="absolute inset-x-4 top-12 bottom-24 border border-dashed border-teal-500/50 flex items-center justify-center rounded-xl pointer-events-none">
                            <div className="text-[8px] tracking-wider uppercase font-black text-teal-400/80 bg-stone-950 border border-teal-500/30 px-2 py-0.5 rounded">Shorts Safe Area</div>
                          </div>
                        </div>
                      )}

                      <KonuCardCore
                        card={{
                          ...activeCard,
                          title: profileName || activeCard?.title || '',
                          subtitle: profileSubtitle || activeCard?.subtitle || '',
                          description: profileDescription || activeCard?.description || '',
                          heroTitle: profileName || activeCard?.heroTitle || activeCard?.title || '',
                          heroSubtitle: profileSubtitle || activeCard?.heroSubtitle || activeCard?.subtitle || '',
                          heroDescription: profileDescription || activeCard?.heroDescription || activeCard?.description || '',
                          profileType: (profileType || activeCard?.profileType || activeCard?.type || 'person') as any,
                          productMediaType: productMediaType || activeCard?.productMediaType || 'image',
                          productImageUrl: productImageUrl || activeCard?.productImageUrl || '',
                          productVideoUrl: productVideoUrl || activeCard?.productVideoUrl || '',
                          coverImageUrl: coverImageUrl || activeCard?.coverImageUrl || '',
                          coverImagePosition: coverImagePosition || activeCard?.coverImagePosition || 'center',
                          productMediaPosition: coverImagePosition || activeCard?.productMediaPosition || 'center',
                          profileImageUrl: profileImageUrl || activeCard?.profileImageUrl || '',
                          
                          // Match high-fidelity fallback property sync from MiniCardPreview and PublicCardView
                          heroSize: (activeCard?.heroSize || activeCard?.heroHeight || activeCard?.productHeroSize || activeCard?.heroBackgroundSize || 'medium') as any,
                          heroHeight: (activeCard?.heroSize || activeCard?.heroHeight || activeCard?.productHeroSize || activeCard?.heroBackgroundSize || 'medium') as any,
                          productHeroSize: (activeCard?.heroSize || activeCard?.heroHeight || activeCard?.productHeroSize || activeCard?.heroBackgroundSize || 'medium') as any,
                          heroBackgroundSize: (activeCard?.heroSize || activeCard?.heroHeight || activeCard?.productHeroSize || activeCard?.heroBackgroundSize || 'medium') as any,
                          
                          heroBackgroundType: activeCard?.heroBackgroundType || productMediaType || activeCard?.productMediaType || 'color',
                          
                          heroProfileImageUrl: profileImageUrl || activeCard?.heroProfileImageUrl || activeCard?.profileImageUrl || '',
                          
                          heroImageUrl: activeCard?.heroImageUrl || coverImageUrl || activeCard?.coverImageUrl || '',
                          
                          heroVideoUrl: activeCard?.heroVideoUrl || productVideoUrl || activeCard?.productVideoUrl || '',
                        }}
                        lang={lang}
                        isPreview={true}

                        isReelView={previewMode === 'reel'}
                        reelModeConfig={reelConfig}
                        onToggleElementInReel={handleToggleElementInReel}

                        isSortingMode={isSortingMode}
                    onEditBackground={() => setShowBgModal(true)}
                    onEditProfileHero={() => setShowProfileModal(true)}
                    onEditButton={handleOpenEditButton}
                    onAddButton={handleOpenAddButton}

                    draggedButtonId={draggedButtonId}
                    dragOverButtonId={dragOverButtonId}
                    swapSelectionId={swapSelectionId}

                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    handleDrop={handleDrop}
                    handleTouchStart={handleTouchStart}
                    handleTouchEndOrCancel={handleTouchEndOrCancel}
                    handleButtonTapOrClickInSortMode={handleButtonTapOrClickInSortMode}

                    triggerVCardDownload={() => downloadVCardFileFromCard(activeCard)}
                    handleCtaClick={() => {}}
                    setShowShareModal={setShowShareModal}
                  />
                </div>

                {/* Simulated Floating Device HUD bar under phone preview */}
                <div className="w-full bg-[#111111] border-t border-[#A855F7]/25 p-3.5 flex items-center justify-between gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black tracking-wide text-[#F5EFE3] truncate">
                      {profileName || 'Vorschau'}
                    </h4>
                    <p className="text-[10px] text-stone-400 truncate">
                      {lang === 'de' ? 'Live auf: ' : 'Live at: '}
                      {getPublicCardUrl(activeCard.slug)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadVCardFileFromCard(activeCard);
                      }}
                      className="bg-[#1C1C1C] hover:bg-[#252525] text-stone-200 border border-[#A855F7]/30 hover:border-[#A855F7] rounded-xl p-2.5 transition shrink-0 cursor-pointer"
                      title={lang === 'de' ? 'vCard herunterladen' : 'Download vCard'}
                    >
                      <LucideIcons.UserCheck size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUpdateSharing(false);
                        setShowShareModal(true);
                      }}
                      className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 p-2.5 rounded-xl border border-[#A855F7] transition shrink-0 font-bold text-xs cursor-pointer"
                      title="Teilen"
                    >
                      <LucideIcons.Share2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[430px] bg-stone-950 border border-stone-850 rounded-3xl p-8 py-24 text-center text-stone-500 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <LucideIcons.AlertCircle className="text-[#A855F7]/70 animate-pulse" size={44} />
                <p className="font-bold text-xs uppercase tracking-wider">
                  {lang === 'de' ? 'Keine Karte aktiv' : 'No card active'}
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed max-w-xs">
                  {lang === 'de' 
                    ? 'Wähle im linken Panel eine Karte zum Bearbeiten aus oder erstelle eine neue.'
                    : 'Select a card from the left panel to edit or create a brand new one.'}
                </p>
                <button
                  onClick={handleAddNewCard}
                  disabled={isCreatingState}
                  className={`bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-xs py-2.5 px-5 rounded-xl shadow transition ${
                    isCreatingState ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isCreatingState ? (lang === 'de' ? 'Erstelle...' : 'Creating...') : t.createNewCard}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FLOATING ACTION UTILITY DOCK (FOOTER) */}
      <footer className="sticky bottom-0 z-30 bg-stone-950/95 backdrop-blur-md border-t border-stone-850 p-3.5 flex items-center justify-around gap-1">
        <button
          onClick={handleCopyLink}
          className="flex-1 max-w-[100px] flex flex-col items-center gap-1 text-stone-400 hover:text-[#A855F7] transition text-center"
        >
          <LucideIcons.Copy size={18} className={copiedLink ? 'text-green-400' : ''} />
          <span className="text-[9px] font-medium tracking-wide">
            {copiedLink ? (lang === 'de' ? 'Kopiert!' : 'Copied!') : (lang === 'de' ? 'Kopieren' : 'Copy')}
          </span>
        </button>

        <button
          onClick={() => setShowQrModal(true)}
          className="flex-1 max-w-[100px] flex flex-col items-center gap-1 text-stone-400 hover:text-[#A855F7] transition text-center"
        >
          <LucideIcons.QrCode size={18} />
          <span className="text-[9px] font-medium tracking-wide">
            {lang === 'de' ? 'QR-Code' : 'QR code'}
          </span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex-1 max-w-[100px] flex flex-col items-center gap-1 text-stone-400 hover:text-[#A855F7] transition text-center"
        >
          <LucideIcons.Share2 size={18} />
          <span className="text-[9px] font-medium tracking-wide">
            {t.share}
          </span>
        </button>

        <a
          href={`/u/${activeCard.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 max-w-[100px] flex flex-col items-center gap-1 text-stone-400 hover:text-[#A855F7] transition text-center"
        >
          <LucideIcons.ExternalLink size={18} />
          <span className="text-[9px] font-medium tracking-wide">
            {t.preview}
          </span>
        </a>

        <button
          onClick={logout}
          className="flex-1 max-w-[100px] flex flex-col items-center gap-1 text-stone-400 hover:text-red-400 transition text-center"
        >
          <LucideIcons.LogOut size={18} />
          <span className="text-[9px] font-medium tracking-wide">
            {t.logout}
          </span>
        </button>
      </footer>


      {/* MODAL 1: CARD BACKGROUND DESIGNER */}
      {showBgModal && activeCard && (
        <CardBackgroundDesigner
          isOpen={showBgModal}
          onClose={() => setShowBgModal(false)}
          activeCard={activeCard}
          onSave={syncCardUpdate}
          lang={lang}
        />
      )}

      {/* MODAL 2: VISUAL PROFILE HERO DESIGNER */}
      {showProfileModal && activeCard && (
        <ProfileHeroDesigner
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          activeCard={activeCard}
          onSave={syncCardUpdate}
          lang={lang}
        />
      )}


      {/* MODAL 3: HERO BANNER / LOGO EDITOR */}
      {showHeroModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#A855F7]">
                <LucideIcons.ImagePlay size={18} />
                <h3 className="font-bold text-sm text-white">Titelbild / Medienbereich</h3>
              </div>
              <button onClick={() => setShowHeroModal(false)} className="text-stone-500 hover:text-white transition">
                <LucideIcons.X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-2">Titelbild hochladen</label>
                <div className="relative border border-dashed border-stone-700 rounded-xl p-6 bg-stone-950 flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-[100%]"
                    disabled={isHeroUploading}
                  />
                  <LucideIcons.Upload size={22} className="text-[#A855F7] mb-2" />
                  <span className="text-[11px] text-stone-300 font-semibold">Tippe zum Auswählen</span>
                  <span className="text-[9px] text-stone-500 mt-1">Bilder, Grafiken oder Logos bis 3MB</span>
                </div>
              </div>

              {isHeroUploading && (
                <div className="py-2 text-center text-xs text-stone-400 font-mono flex items-center justify-center gap-1.5">
                  <LucideIcons.Loader className="animate-spin text-[#A855F7]" size={14} />
                  <span>Bild wird hochgeladen, bitte warten...</span>
                </div>
              )}

              {heroImageUrl ? (
                <div className="relative border border-stone-800 p-2.5 rounded-xl bg-stone-950 flex items-center justify-between gap-3">
                  <div className="w-16 h-12 rounded overflow-hidden border border-stone-850">
                    <img src={heroImageUrl} alt="Cover" className="w-[100%] h-[100%] object-cover" />
                  </div>
                  <button
                    onClick={handleRemoveHeroImage}
                    className="bg-red-950/50 hover:bg-red-900 border border-red-900 text-red-350 py-1.5 px-3 rounded-xl text-[10.5px] font-bold"
                  >
                    Bild entfernen
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-2">Alternativer Platzhalter-Farbwert</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={heroColor}
                      onChange={(e) => setHeroColor(e.target.value)}
                      onBlur={async () => {
                        await syncCardUpdate({ heroBackgroundColor: heroColor });
                      }}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={heroColor}
                      onChange={(e) => setHeroColor(e.target.value)}
                      onBlur={async () => {
                        await syncCardUpdate({ heroBackgroundColor: heroColor });
                      }}
                      className="flex-grow bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-[#A855F7]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#A855F7]/10 bg-stone-950/60 flex items-center justify-end">
              <button
                onClick={() => setShowHeroModal(false)}
                className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-bold text-xs py-2 px-5 rounded-xl transition"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}


       {/* TEST MODAL FIRST LINE OF DEFENSE */}
      {DEBUG_BUTTON_EDITOR && showButtonModal && !hideTestModal && (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-[28px] p-6 max-w-md w-full text-center shadow-2xl space-y-5 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
              <LucideIcons.Layers size={22} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-white text-base font-black uppercase tracking-wider">
                ButtonEditor Test geöffnet
              </h3>
              <p className="text-stone-400 text-xs text-center">
                Der Button-Editor-Trigger wurde erfolgreich geladen.
              </p>
            </div>

            <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-850/60 text-[11px] text-stone-300 space-y-2.5 text-left font-mono">
              <div>
                <span className="text-stone-500">showButtonModal:</span> <span className="text-emerald-400">true</span>
              </div>
              <div>
                <span className="text-stone-500">activeCard:</span> <span className={activeCard ? "text-emerald-400" : "text-rose-400"}>{activeCard ? '✓ Vorhanden' : '✗ FEHLT!'}</span>
              </div>
              <div>
                <span className="text-stone-500">editingButton:</span> <span className="text-amber-400">{editingButton ? `"${editingButton.title || '(Unbenannt)'}" (ID: ${editingButton.id})` : 'Keiner (Neu)'}</span>
              </div>
              {editingButton && (
                <div className="border-t border-stone-850 pt-2 space-y-1">
                  <div><span className="text-stone-500">actionType:</span> {editingButton.actionType}</div>
                  <div><span className="text-stone-500">actionValue:</span> {editingButton.actionValue}</div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  console.log("HARD DEBUG: Launching echten ButtonDesigner");
                  setHideTestModal(true);
                }}
                className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-sans font-black text-xs py-3 px-4 rounded-xl transition cursor-pointer"
              >
                Echten ButtonDesigner laden
              </button>
              
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="w-full bg-stone-800 hover:bg-stone-750 text-stone-300 font-sans font-bold text-xs py-3 px-4 rounded-xl transition cursor-pointer"
              >
                Abbrechen & Schließen
              </button>
            </div>
          </div>
        </div>
      )}

       {/* NEW INTERACTIVE VISUAL BUTTON DESIGNER */}
      {showButtonModal && activeCard && (hideTestModal || !DEBUG_BUTTON_EDITOR) && (
        <ButtonDesigner
          isOpen={showButtonModal && (hideTestModal || !DEBUG_BUTTON_EDITOR)}
          onClose={() => setShowButtonModal(false)}
          activeCard={activeCard}
          editingButton={editingButton}
          onSave={handleSaveButtonFromDesigner}
          onDelete={handleDeleteButtonImmediate}
          onDuplicate={async (b) => {
            await handleDuplicateButton(b);
            setShowButtonModal(false);
          }}
          lang={lang}
          onSaveAllButtons={async (buttons, extraCardFields) => {
            const sanitizedButtons = buttons.map((btn) => sanitizeButtonForFirestore(btn));
            await syncCardUpdate({ buttons: sanitizedButtons, ...extraCardFields });
          }}
        />
      )}

      {/* MODAL 4: BUTTONS CREATION/EDITION BOX BYPASSED */}
      {false && showButtonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl h-[95vh] md:h-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-stone-950">
              <div className="flex items-center gap-2 text-[#A855F7]">
                <LucideIcons.Layers size={18} />
                <h3 className="font-bold text-sm text-white">
                  {editingButton ? 'Button anpassen' : 'Neuen Button anlegen'}
                </h3>
              </div>
              <button onClick={() => setShowButtonModal(false)} className="text-stone-500 hover:text-white transition">
                <LucideIcons.X size={18} />
              </button>
            </div>

            {/* Main Area: Two-Column Form */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-900">
              
              {/* Left Column: Form Fields (flexible layout with tabs) */}
              <div className="flex-1 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-stone-800">
                {/* Horizontal Tab Navigation Bar */}
                <div className="flex border-b border-stone-800 shrink-0 bg-stone-950 px-2 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'content', label: 'Inhalt', icon: LucideIcons.Type },
                    { id: 'design', label: 'Design', icon: LucideIcons.Palette },
                    { id: 'media', label: 'Medien', icon: LucideIcons.Image },
                    { id: 'protection', label: 'Schutz', icon: LucideIcons.ShieldAlert },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = btnEditorTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBtnEditorTab(tab.id as any)}
                        className={`flex items-center gap-1.5 py-3 px-3.5 border-b-2 font-bold text-xs transition duration-150 whitespace-nowrap cursor-pointer ${
                          active
                            ? 'border-[#A855F7] text-[#A855F7] bg-[#A855F7]/5'
                            : 'border-transparent text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Left Inner Core Fields Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                  
                  {btnEditorTab === 'content' && (
                    <>
                      {/* section: Title & text color */}
                      <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                        <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                          <LucideIcons.Type size={13} className="text-[#A855F7]" />
                          <span>Inhalt & Texte</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Button-Text / Beschriftung</label>
                            <input
                              type="text"
                              value={btnTitle}
                              onChange={(e) => setBtnTitle(e.target.value)}
                              placeholder="z.B. Meine Webseite, Instagram, etc."
                              className="w-full h-10 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#A855F7] font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Schriftfarbe</label>
                            <div className="flex items-center gap-2 h-10 bg-stone-800 border border-stone-700 rounded-xl px-2">
                              <div className="relative w-6 h-6 rounded-md overflow-hidden border border-stone-650 shrink-0">
                                <input
                                  type="color"
                                  value={btnTextColor}
                                  onChange={(e) => setBtnTextColor(e.target.value)}
                                  className="absolute inset-0 w-16 h-16 -translate-x-3 -translate-y-3 cursor-pointer scale-150"
                                />
                              </div>
                              <input
                                type="text"
                                value={btnTextColor}
                                onChange={(e) => setBtnTextColor(e.target.value)}
                                className="w-full bg-transparent text-[10px] font-mono font-bold text-[#A855F7] uppercase focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sektion Links & Aktion */}
                      <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                        <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                          <LucideIcons.Link size={13} className="text-[#A855F7]" />
                          <span>Aktion & Ziel</span>
                        </div>

                        {/* Action Type */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Aktions-Typ</label>
                          <select
                            value={btnActionType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBtnActionType(val);
                              if (val === 'file') {
                                setBtnActionValue('');
                              }
                            }}
                            className="w-full h-10 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                          >
                            <option value="url">Link / Webseite (https://...)</option>
                            <option value="tel">Telefon anrufen (tel:...)</option>
                            <option value="mailto">E-Mail schreiben (mailto:...)</option>
                            <option value="whatsapp">Direkter WhatsApp-Chat</option>
                            <option value="sms">SMS senden (sms:...)</option>
                            <option value="vcard">Kontaktkarte herunterladen (.vcf)</option>
                            <option value="file">Datei hochladen / teilen (PDF, Bilder, Docs, zip...)</option>
                          </select>
                        </div>

                        {/* Action Value / File Upload */}
                        {btnActionType === 'file' ? (
                          <div className="space-y-2 bg-stone-900 p-3 rounded-lg border border-stone-800">
                            <label className="block text-[10px] uppercase font-bold text-[#A855F7] tracking-wider mb-0.5">
                              Datei hochladen (PDF, Bilder, Dokumente etc.)
                            </label>
                            
                            <div className="relative border-2 border-dashed border-stone-750 hover:border-[#A855F7] rounded-xl p-4 bg-stone-950 hover:bg-stone-900/80 transition flex flex-col items-center justify-center cursor-pointer">
                              <input
                                type="file"
                                id="action-file-upload-input"
                                onChange={handleFileActionUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                disabled={isBtnFileUploading}
                              />
                              <LucideIcons.Upload size={22} className="text-[#A855F7]/80 mb-1.5" />
                              <span className="text-xs text-stone-300 font-bold text-center">
                                {isBtnFileUploading ? 'Datei wird hochgeladen...' : 'Klicken oder Datei hineinziehen'}
                              </span>
                              <span className="text-[9px] text-stone-500 mt-1 text-center">Sicherer Cloud-Upload, bis zu 10MB</span>
                            </div>

                            {btnActionValue && btnActionValue !== '[LOCKED]' && (
                              <div className="flex items-center justify-between gap-3 bg-stone-950 p-2 rounded-lg border border-stone-800 text-[10px] font-mono text-stone-300">
                                <span className="truncate flex-1" title={btnActionValue}>
                                  ID: {btnActionValue.split('/').pop()?.split('?')[0] || 'Datei hochgeladen'}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={btnActionValue}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#A855F7] hover:underline hover:text-[#e0ba58] font-bold"
                                  >
                                    Ansehen
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setBtnActionValue('')}
                                    className="text-red-400 hover:text-red-350 font-bold"
                                  >
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : btnActionType === 'vcard' ? (
                          <div className="p-3.5 bg-stone-900/65 rounded-xl border border-stone-800 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[#A855F7]">Dynamischer vCard Kontakt</span>
                            <p className="text-[10px] text-stone-400 leading-normal font-sans">
                              Auf der öffentlichen Karte lädt dieser Button die Visitenkarte des Profiles direkt aus den Profildaten herunter. Ein manueller Zielwert ist nicht notwendig.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">
                              Zielwert (URL, Telefonnummer oder E-Mail)
                            </label>
                            <input
                              type="text"
                              value={btnActionValue}
                              onChange={(e) => setBtnActionValue(e.target.value)}
                              placeholder={btnActionType === 'tel' ? '+491701234567' : btnActionType === 'mailto' ? 'info@example.com' : 'https://example.com'}
                              className="w-full h-10 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {btnEditorTab === 'design' && (
                    <>
                      {/* Sektion Design & Hintergrundfarbe */}
                      <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                        <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                          <LucideIcons.Palette size={13} className="text-[#A855F7]" />
                          <span>Farb-Gestaltung</span>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-2">Button-Hintergrundfarbe</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Visual Picker */}
                            <div className="flex items-center gap-2 h-10 bg-stone-800 border border-stone-700 rounded-xl px-3">
                              <div className="relative w-6 h-6 rounded-md overflow-hidden border border-stone-650 shrink-0">
                                <input
                                  type="color"
                                  value={btnColor}
                                  onChange={(e) => setBtnColor(e.target.value)}
                                  className="absolute inset-0 w-16 h-16 -translate-x-3 -translate-y-3 cursor-pointer scale-150"
                                />
                              </div>
                              <input
                                type="text"
                                value={btnColor}
                                onChange={(e) => setBtnColor(e.target.value)}
                                className="w-full bg-transparent text-xs font-mono font-bold text-[#A855F7] uppercase focus:outline-none"
                              />
                            </div>
                            
                            {/* Presets */}
                            <div className="flex items-center justify-around bg-stone-900 px-2 rounded-xl border border-stone-800 h-10">
                              {[
                                { hex: '#F5EFE3', name: 'Cream' },
                                { hex: '#1C1C1C', name: 'Charcoal' },
                                { hex: '#A855F7', name: 'Gold' },
                                { hex: '#FFFFFF', name: 'White' },
                              ].map((preset) => (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  onClick={() => setBtnColor(preset.hex)}
                                  className={`w-6 h-6 rounded-full border border-stone-800 hover:scale-110 transition-all ${btnColor.toUpperCase() === preset.hex.toUpperCase() ? 'outline-2 outline-[#A855F7] outline-offset-1 ring-1 ring-gold/45' : ''}`}
                                  style={{ backgroundColor: preset.hex }}
                                  title={preset.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sektion Rahmen & Kontur */}
                      <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                        <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                          <LucideIcons.Square size={13} className="text-[#A855F7]" />
                          <span>Kontur & Rahmen</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-stone-400 mb-1.5">Rahmenstärke</label>
                            <select
                              value={btnBorderWidth}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setBtnBorderWidth(val);
                                if (val === 'none') {
                                  setBtnGoldBorder(false);
                                }
                              }}
                              className="w-full bg-stone-850 border border-stone-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                            >
                              <option value="none">Kein Rahmen (Vollflächig)</option>
                              <option value="thin">Diskret / Fein (1px)</option>
                              <option value="medium">Sichtbar (2px)</option>
                              <option value="thick">Kräftig (3px)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-stone-400 mb-1.5">Konturstil</label>
                            <select
                              value={btnBorderStyle}
                              onChange={(e) => setBtnBorderStyle(e.target.value as any)}
                              className="w-full bg-stone-850 border border-stone-700 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                            >
                              <option value="solid">Moderne Linie (Solid)</option>
                              <option value="dashed">Gestrichelt (Dashed)</option>
                              <option value="dotted">Gepunktet (Dotted)</option>
                            </select>
                          </div>
                        </div>

                        {btnBorderWidth !== 'none' && (
                          <div className="flex items-center gap-3 pt-2 bg-stone-900 p-2.5 rounded-lg border border-stone-800">
                            <div className="flex-1">
                              <label className="block text-[8px] uppercase font-black text-stone-500 mb-1">Rahmenfarbe</label>
                              <div className="flex items-center gap-2">
                                <div className="relative w-6 h-6 rounded overflow-hidden border border-stone-700 shrink-0">
                                  <input
                                    type="color"
                                    value={btnBorderColor}
                                    onChange={(e) => setBtnBorderColor(e.target.value)}
                                    className="absolute inset-0 w-16 h-16 -translate-x-3 -translate-y-3 cursor-pointer scale-150"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={btnBorderColor}
                                  onChange={(e) => setBtnBorderColor(e.target.value)}
                                  className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-[10px] font-mono text-[#A855F7] uppercase focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setBtnBorderColor('#A855F7')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 text-[10px] font-extrabold text-[#A855F7] uppercase tracking-wider transition self-end h-[28px]"
                            >
                              Gold-Preset
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 border-t border-stone-900">
                          <input
                            type="checkbox"
                            id="gold-border-check"
                            checked={btnGoldBorder}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setBtnGoldBorder(checked);
                              if (checked) {
                                setBtnBorderWidth('medium');
                                setBtnBorderColor('#A855F7');
                                setBtnBorderStyle('solid');
                              }
                            }}
                            className="rounded bg-stone-850 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor="gold-border-check" className="text-[10px] text-stone-400 font-semibold cursor-pointer select-none">
                            Schnellauswahl: Edler goldener Rahmen (#A855F7)
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {btnEditorTab === 'media' && (
                    <>
                      {/* Sektion Symbol & Bild */}
                      <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                        <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                          <LucideIcons.Image size={13} className="text-[#A855F7]" />
                          <span>Bild & Symbole</span>
                        </div>

                        {/* Style selector */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-2">Darstellungsart</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setBtnImageStyle('icon')}
                              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${btnImageStyle === 'icon' ? 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]' : 'bg-stone-850 border-stone-750 text-stone-400 hover:text-white'}`}
                            >
                              <LucideIcons.Globe size={14} className="text-[#A855F7]" />
                              <span>Icon / Symbol</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBtnImageStyle('background')}
                              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${btnImageStyle === 'background' ? 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]' : 'bg-stone-850 border-stone-750 text-stone-400 hover:text-white'}`}
                            >
                              <LucideIcons.Image size={14} className="text-[#A855F7]" />
                              <span>Bildhintergrund</span>
                            </button>
                          </div>
                        </div>

                        {/* Icon library */}
                        {btnImageStyle === 'icon' && (
                          <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-stone-455 tracking-wider">Symbol aus Bibliothek wählen</label>
                            <div className="grid grid-cols-7 gap-1.5 bg-stone-900 p-2.5 rounded-xl border border-stone-800 max-h-[140px] overflow-y-auto scrollbar-thin">
                              {LIBRARY_ICONS.map((licon) => (
                                <button
                                  key={licon.id}
                                  type="button"
                                  onClick={() => setBtnIcon(licon.id)}
                                  className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${btnIcon === licon.id ? 'bg-[#A855F7]/20 border-[#A855F7] scale-105 shadow-md' : 'border-transparent text-stone-400 hover:text-white hover:scale-105'}`}
                                  title={licon.name}
                                >
                                  {renderIcon(licon.id, btnIcon === licon.id ? '#A855F7' : '#9ca3af', 18)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Image Upload */}
                        <div className="bg-stone-900 p-3 rounded-lg border border-stone-800 space-y-3">
                          <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Eigene Hintergrund-Bilddatei hochladen</label>
                          
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleButtonImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              disabled={isBtnImageUploading}
                            />
                            <div className="bg-stone-800 hover:bg-stone-750 text-stone-250 border border-stone-700 text-[10px] font-bold text-center py-2 px-3 rounded-lg cursor-pointer transition">
                              {isBtnImageUploading ? 'Bild wird hochgeladen...' : 'Eigene Bilddatei hochladen'}
                            </div>
                          </div>

                          {btnUploadedUrl && (
                            <div className="flex items-center justify-between gap-2 border-t border-stone-800 pt-2 bg-stone-950 p-2 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="w-8 h-8 rounded border border-stone-800 overflow-hidden shrink-0">
                                  <img src={btnUploadedUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] text-stone-400 font-medium">Eigenes Bild aktiv</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setBtnUploadedUrl('')}
                                className="text-red-400 hover:text-red-350 text-[10px] font-bold"
                              >
                                Entfernen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sektion 5: Erweiterte Hintergrund-Kacheleinstellungen */}
                      {btnImageStyle === 'background' && btnUploadedUrl && (
                        <div className="bg-stone-950/60 p-4.5 rounded-xl border border-[#A855F7]/20 space-y-4 shadow-inner">
                          <div className="flex items-center gap-1.5 text-[#A855F7] text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-[#A855F7]/10">
                            <LucideIcons.Settings size={13} />
                            <span>Hintergrundbild Spezial-Optionen</span>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Bild-Verhältnis</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setBtnImageMode('cover')}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${btnImageMode === 'cover' ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'}`}
                              >
                                Bedeckend (Cover)
                              </button>
                              <button
                                type="button"
                                onClick={() => setBtnImageMode('contain')}
                                className={`py-1.5 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${btnImageMode === 'contain' ? 'bg-[#A855F7] text-stone-950 border-[#A855F7]' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'}`}
                              >
                                Einpassen (Contain)
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-stone-900">
                            <input
                              type="checkbox"
                              id="dark-overlay-check"
                              checked={btnDarkOverlay}
                              onChange={(e) => setBtnDarkOverlay(e.target.checked)}
                              className="rounded bg-stone-800 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="dark-overlay-check" className="text-xs text-stone-300 font-semibold cursor-pointer">
                              Dunkles Lese-Schutz-Overlay über Bild (besserer Kontrast)
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="show-border-check"
                              checked={btnShowBorder}
                              onChange={(e) => setBtnShowBorder(e.target.checked)}
                              className="rounded bg-stone-800 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="show-border-check" className="text-xs text-stone-300 font-semibold cursor-pointer">
                              Äußeren Kachelrahmen anzeigen
                            </label>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-stone-900">
                            <input
                              type="checkbox"
                              id="btn-show-label-check"
                              checked={btnShowLabel}
                              onChange={(e) => setBtnShowLabel(e.target.checked)}
                              className="rounded bg-stone-800 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="btn-show-label-check" className="text-xs text-stone-300 font-semibold cursor-pointer">
                              Buttontitel (Schild) einblenden
                            </label>
                          </div>

                          {btnShowLabel && (
                            <div className="pl-6 space-y-2.5 pt-1 border-l-2 border-[#A855F7]/20 col-span-1">
                              <div>
                                <label className="block text-[9px] uppercase font-bold text-stone-450 mb-1">Text-Ausrichtung (Overlay-Position)</label>
                                <select
                                  value={btnLabelPosition}
                                  onChange={(e) => setBtnLabelPosition(e.target.value as any)}
                                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                                >
                                  <option value="top">Oben (Top)</option>
                                  <option value="center">Mittig (Center)</option>
                                  <option value="bottom">Unten (Bottom)</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="btn-label-overlay-check"
                                  checked={btnLabelOverlay}
                                  onChange={(e) => setBtnLabelOverlay(e.target.checked)}
                                  className="rounded bg-stone-800 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                />
                                <label htmlFor="btn-label-overlay-check" className="text-[11px] text-stone-400 font-medium cursor-pointer">
                                  Mattiertes Hintergrundband (Glassmorphism)
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {btnEditorTab === 'protection' && (
                    <div className="bg-stone-950/60 p-4.5 rounded-xl border border-stone-800/80 space-y-4">
                      <div className="flex items-center gap-1.5 text-stone-300 text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-stone-900">
                        <LucideIcons.ShieldAlert size={13} className="text-[#A855F7]" />
                        <span>Passwort-Schutz & VIP-Inhalte</span>
                      </div>

                      <div className="bg-stone-900/65 p-4 rounded-xl border border-stone-805 space-y-3.5">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            id="protected-btn-check-tab"
                            checked={btnProtected}
                            onChange={(e) => setBtnProtected(e.target.checked)}
                            className="rounded bg-stone-800 border-stone-700 text-[#A855F7] focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5 cursor-pointer"
                          />
                          <label htmlFor="protected-btn-check-tab" className="text-xs text-stone-250 font-bold cursor-pointer">
                            Diese Kachel mit PIN / Passwort sperren
                          </label>
                        </div>

                        {btnProtected && (
                          <div className="space-y-3.5 pt-2 border-t border-stone-800">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Sicherheits-PIN / Passwort</label>
                              <input
                                type="text"
                                value={btnPassword}
                                onChange={(e) => setBtnPassword(e.target.value)}
                                placeholder="Passwort festlegen (z.B. VIP123)"
                                className="w-full h-10 bg-stone-800 border border-stone-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#A855F7] tracking-wide"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Passwort-Hinweis (öffentlich)</label>
                              <input
                                type="text"
                                value={btnPasswordHint}
                                onChange={(e) => setBtnPasswordHint(e.target.value)}
                                placeholder="z.B. Dein Geburtsjahr"
                                className="w-full h-10 bg-stone-800 border border-stone-705 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                              />
                              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed font-sans">
                                Hilft deinen Gästen, wenn sie das Passwort vergessen haben. Echte Passwörter sind vollständig hashes-verschlüsselt.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column: Live visual preview & guide */}
              <div className="w-full md:w-[320px] shrink-0 bg-stone-950 p-5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-stone-800 select-none">
                <div className="text-center mb-4">
                  <span className="text-[10px] uppercase font-extrabold text-[#A855F7] tracking-widest block mb-1">Live-Vorschau</span>
                  <p className="text-[9px] text-stone-450 font-bold">Deine Kachel erscheint zentriert in Echtzeit</p>
                </div>

                {/* Live simulation button card */}
                <div className="p-6 bg-stone-900 border border-stone-800/80 rounded-2xl flex items-center justify-center w-48 h-48 shadow-2xl relative overflow-hidden bg-[radial-gradient(circle_at_center,_#252525_0%,_#141414_100%)]">
                  <div
                    className={`relative cursor-pointer aspect-square w-32 h-32 rounded-3xl flex flex-col items-center justify-center gap-2 select-none group shadow-xl transition-all duration-150 overflow-hidden ${
                      btnImageStyle === 'background' && btnUploadedUrl ? 'p-0' : 'p-3'
                    }`}
                    style={{
                      backgroundColor: btnImageStyle === 'background' ? '#121212' : btnColor || '#F5EFE3',
                      color: btnTextColor || '#1A1A1A',
                      borderWidth: btnBorderWidth === 'thin' ? '1px' : btnBorderWidth === 'medium' ? '2px' : btnBorderWidth === 'thick' ? '3px' : '0px',
                      borderColor: btnBorderColor || '#A855F7',
                      borderStyle: btnBorderStyle || 'solid',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {btnImageStyle === 'background' && btnUploadedUrl ? (
                      <>
                        <img
                          src={btnUploadedUrl}
                          alt={btnTitle}
                          className={`absolute inset-0 w-full h-full ${btnImageMode === 'contain' ? 'object-contain' : 'object-cover'} z-0`}
                        />
                        {btnDarkOverlay && (
                          <div className="absolute inset-0 z-10 bg-black/45" />
                        )}
                        {btnShowLabel && (
                          <div className={`absolute inset-x-0 ${
                            btnLabelOverlay ? 'z-20 bg-black/50 backdrop-blur-[2px]' : 'z-20'
                          } p-1.5 text-center flex flex-col items-center justify-center ${
                            btnLabelPosition === 'top'
                              ? 'top-0 pt-1.5 pb-2 bg-gradient-to-b from-black/80 to-transparent'
                              : btnLabelPosition === 'center'
                              ? 'top-1/2 -translate-y-1/2'
                              : 'bottom-0 pb-1.5 pt-2 bg-gradient-to-t from-black/80 to-transparent'
                          }`}>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-white line-clamp-2 leading-tight px-1 font-sans">
                              {btnTitle || 'Titel'}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="z-10 flex items-center justify-center">
                          {renderIcon(
                            btnIcon,
                            btnImageStyle === 'background' ? '#F5EFE3' : btnTextColor || '#1A1A1A',
                            22
                          )}
                        </div>

                        <span className="z-10 text-[9px] font-bold text-center line-clamp-2 leading-tight uppercase tracking-wider px-1 font-sans">
                          {btnTitle || 'Beschriftung'}
                        </span>
                      </>
                    )}

                    {btnProtected && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 p-0.5 rounded text-[#A855F7] z-10 border border-[#A855F7]/20">
                        <LucideIcons.Lock size={8} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Helpful directions / info labels */}
                <div className="mt-5 space-y-2.5 max-w-[240px] text-center md:text-left">
                  <div className="flex items-start gap-1.5 text-[9px] text-stone-400">
                    <LucideIcons.CheckCircle size={10} className="text-[#A855F7] mt-0.5 shrink-0" />
                    <span>Hervorragend strukturiert auf einer Seite – ganz ohne verwirrende Unter-Tabs.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[9px] text-stone-400">
                    <LucideIcons.CheckCircle size={10} className="text-[#A855F7] mt-0.5 shrink-0" />
                    <span>Löschen & Speichern sind unten im Fußbereich jederzeit mit einem Klick erreichbar!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with delete button */}
            <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between shrink-0">
              <div>
                <button type="button" onClick={() => handleDeleteButtonImmediate(editingButton?.id || '')}>Löschen</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowButtonModal(false)}>Abbrechen</button>
                <button type="button" onClick={() => {}}>Speichern</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 5: PREMIUM SHARE & EXPORTS POPUP */}
      {activeCard && (
        <ShareExportModal
          card={activeCard}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setIsUpdateSharing(false);
          }}
          isUpdateSharing={isUpdateSharing}
          lang={lang}
        />
      )}


      {/* MODAL 6: QR-CODE LARGE PREVIEW */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl text-center">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white tracking-wide">Ihr QR-Code</span>
              <button onClick={() => setShowQrModal(false)} className="text-stone-500 hover:text-white transition">
                <LucideIcons.X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-stone-950">
              {qrCodeUrl ? (
                <div className="p-3 bg-white border border-stone-800 rounded-2xl shadow-xl mb-4">
                  <img src={qrCodeUrl} alt="ureel QR Code" className="w-48 h-48 animate-scale-up" />
                </div>
              ) : (
                <LucideIcons.Loader className="animate-spin text-[#A855F7]" size={28} />
              )}
              <h4 className="text-xs font-bold text-white mb-1">
                {lang === 'de' ? 'Einfach scannen' : 'Scan to open'}
              </h4>
              <p className="text-[10px] text-stone-400 font-medium mb-4">
                {lang === 'de' ? 'Verlinkt direkt auf deine ureel-Seite' : 'Links directly to your ureel card'}
              </p>

              {/* Clickable Public URL Display */}
              <div className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-left">
                <span className="text-[10px] font-mono text-[#A855F7] break-all select-all truncate">
                  {getPublicCardUrl(activeCard.slug)}
                </span>
                <button
                  onClick={() => {
                    const pubUrl = getPublicCardUrl(activeCard.slug);
                    const res = copyTextToClipboard(pubUrl);
                    if (res) {
                      triggerToast(lang === 'de' ? 'Link kopiert!' : 'Link copied!', 'success');
                    }
                  }}
                  className="bg-stone-800 hover:bg-stone-750 text-[#A855F7] hover:text-white p-1.5 rounded-lg border border-stone-700 transition cursor-pointer"
                  title={lang === 'de' ? 'Link kopieren' : 'Copy Link'}
                >
                  <LucideIcons.Copy size={12} />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-stone-800 bg-stone-900 flex items-center justify-end gap-2">
              {qrCodeUrl && (
                <a
                  href={qrCodeUrl}
                  download={`ureel_qr_${activeCard.slug}.png`}
                  className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-bold text-xs py-2 px-4.5 rounded-xl transition flex items-center gap-1.5 border-0"
                >
                  <LucideIcons.Download size={14} />
                  QR herunterladen
                </a>
              )}
              <button
                onClick={() => setShowQrModal(false)}
                className="bg-stone-805 hover:bg-stone-750 text-stone-300 text-xs font-bold py-2 px-4 rounded-xl border border-stone-705 transition"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: PREMIUM UPGRADE / PLANS */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setUpgradeFeatureKey('');
          }}
          lang={lang}
          featureKey={upgradeFeatureKey || undefined}
        />
      )}

      {/* MODAL 8: HELP / TIPS SUPPORT */}
      <HelpCenterModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        lang={lang}
      />

      {/* ADMIN-ONLY JSON EXPORT MODAL */}
      {showAdminExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-stone-850 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col font-sans animate-scaleUp">
            <div className="p-5 border-b border-stone-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LucideIcons.ShieldAlert className="text-rose-500" size={18} />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {lang === 'de' ? 'ureel-Karte als JSON (Admin)' : 'ureel Card JSON Export'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAdminExportModal(false)}
                className="text-stone-450 hover:text-white transition cursor-pointer"
              >
                <LucideIcons.X size={18} />
              </button>
            </div>

            <div className="p-5 flex-grow overflow-y-auto space-y-4">
              <p className="text-xs text-stone-450">
                {lang === 'de' 
                  ? 'Hier ist das generierte JSON-Dokument deiner aktuellen Karte. Du kannst es manuell kopieren oder herunterladen.' 
                  : 'Here is the generated JSON document of your current card. You can copy it manually or download.'}
              </p>

              <div className="relative">
                <pre className="text-[10.5px] font-mono text-stone-300 max-h-[45vh] overflow-auto bg-stone-950 p-4 rounded-2xl border border-stone-850 whitespace-pre-wrap select-all">
                  {adminExportJsonString}
                </pre>
                
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminExportJsonString);
                    triggerToast(lang === 'de' ? 'JSON wurde kopiert.' : 'JSON copied successfully.', 'success');
                  }}
                  className="absolute top-3 right-3 bg-stone-900/90 hover:bg-stone-800 text-stone-300 p-2 rounded-xl transition border border-stone-800 cursor-pointer"
                  title={lang === 'de' ? 'JSON kopieren' : 'Copy JSON'}
                >
                  <LucideIcons.Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-stone-850 bg-stone-950/40 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(adminExportJsonString);
                  triggerToast(lang === 'de' ? 'JSON wurde kopiert.' : 'JSON copied successfully.', 'success');
                }}
                className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Copy size={14} />
                <span>{lang === 'de' ? 'JSON kopieren' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={() => handleExportCardJson('download')}
                className="bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 text-rose-300 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Download size={14} />
                <span>{lang === 'de' ? 'Datei herunterladen' : 'Download file'}</span>
              </button>

              <button
                onClick={() => setShowAdminExportModal(false)}
                className="bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold py-2.5 px-4 rounded-xl border border-stone-700 transition cursor-pointer"
              >
                {lang === 'de' ? 'Schließen' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN-ONLY JSON IMPORT/VALIDATION MODAL */}
      {showAdminImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-stone-850 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col font-sans animate-scaleUp">
            
            {/* Header */}
            <div className="p-5 border-b border-stone-850 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <LucideIcons.ShieldAlert className="text-rose-500" size={18} />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {lang === 'de' ? 'SEO-Rückführungsimport (Admin)' : 'SEO Return Import (Admin)'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAdminImportModal(false)}
                className="text-stone-450 hover:text-white transition cursor-pointer"
              >
                <LucideIcons.X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 flex-grow overflow-y-auto space-y-4 text-xs">
              <p className="text-stone-400">
                {lang === 'de' 
                  ? 'Importiere die SEO- und Social-Optimierungen, die du im externen LLM generiert hast. Nur unbedenkliche Metadaten (Titel, Description, Keywords, Alt-Texte) werden automatisch eingespielt. Layout, Inhalte und Design bleiben vollkommen unverändert.' 
                  : 'Import the SEO and social updates generated in your external LLM. Only safe metadata fields (Title, Description, Keywords, Alt texts) will be automatically imported. Layout, design, and visible content remain unchanged.'}
              </p>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-stone-500">
                  {lang === 'de' ? 'JSON-Inhalt einfügen:' : 'Paste JSON content:'}
                </label>
                <textarea
                  value={importInputJson}
                  onChange={(e) => {
                    setImportInputJson(e.target.value);
                    // Clear previous states unless they click Check/Validate
                    setImportValidatedData(null);
                    setImportValidationError(null);
                    setImportValidationWarnings([]);
                  }}
                  placeholder='{ "konuSeoReturn": { "schemaVersion": "1.0", "returnType": "update_seo_visibility" ... } }'
                  className="w-full h-32 px-3 py-2 bg-stone-950 border border-stone-850 rounded-xl focus:border-stone-750 focus:outline-none font-mono text-[10px] text-stone-300 resize-none"
                />
              </div>

              {/* File Upload and Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5">
                  <LucideIcons.FileCode size={13} />
                  <span>{lang === 'de' ? 'JSON-Datei hochladen' : 'Upload JSON file'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => validateSeoReturnJson(importInputJson)}
                  className="bg-rose-950/35 hover:bg-rose-900/45 border border-rose-900/50 text-rose-300 font-extrabold py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <LucideIcons.CheckCircle2 size={13} />
                  <span>{lang === 'de' ? 'JSON prüfen' : 'Validate JSON'}</span>
                </button>
              </div>

              {/* Error Box */}
              {importValidationError && (
                <div className="p-3.5 bg-red-950/20 border border-red-900/45 rounded-2xl flex items-start gap-2.5 text-red-350">
                  <LucideIcons.AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider">{lang === 'de' ? 'Validierungsfehler' : 'Validation Error'}</h5>
                    <p className="mt-0.5 text-[11px]">{importValidationError}</p>
                  </div>
                </div>
              )}

              {/* Warnings Box */}
              {importValidationWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-950/20 border border-amber-900/45 rounded-2xl flex items-start gap-2.5 text-amber-300">
                  <LucideIcons.AlertCircle className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider">{lang === 'de' ? 'Hinweise / Warnungen' : 'Warnings / Cautions'}</h5>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[10.5px]">
                      {importValidationWarnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Validated Details & Comparison */}
              {importValidatedData && (
                <div className="space-y-4 animate-scaleUp">
                  
                  {/* Empty States Overwrite Option */}
                  <div className="p-3 bg-stone-900/50 border border-stone-850 rounded-2xl flex items-center gap-2.5 select-none">
                    <input
                      type="checkbox"
                      id="apply-empty-values-opt"
                      checked={applyEmptyValues}
                      onChange={(e) => setApplyEmptyValues(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                    />
                    <label htmlFor="apply-empty-values-opt" className="text-[10.5px] font-bold text-stone-300 cursor-pointer">
                      {lang === 'de' 
                        ? 'Leere zurückgelieferte Felder übernehmen (überschreibt bestehende Daten mit Leerwerten)' 
                        : 'Overwrite fields with blank values if provided (replaces existing content with blank strings/arrays)'}
                    </label>
                  </div>

                  {/* Mismatch Warning & Bypass selection */}
                  {cardReferenceMismatch && (
                    <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl space-y-3">
                      <div className="flex items-start gap-2.5 text-rose-300">
                        <LucideIcons.AlertTriangle className="shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="font-bold text-[11px] uppercase tracking-wider">
                            {lang === 'de' ? 'Karten-Referenz Abweichung' : 'Card Reference Mismatch'}
                          </p>
                          <p className="mt-0.5 text-[10.5px] font-medium leading-relaxed">
                            {lang === 'de' 
                              ? 'Diese Rückführung gehört möglicherweise nicht zur aktuell geöffneten Karte.' 
                              : 'This return file may not belong to the currently opened card.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5 pl-0.5 select-none text-[10.5px] font-bold text-rose-200">
                        <input
                          type="checkbox"
                          id="bypass-mismatch-opt"
                          checked={byPassMismatch}
                          onChange={(e) => setByPassMismatch(e.target.checked)}
                          className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-rose-800"
                        />
                        <label htmlFor="bypass-mismatch-opt" className="cursor-pointer">
                          {lang === 'de' ? 'Trotz Warnung übernehmen (Erlaubt den Import für diese Karte)' : 'Import anyway (Bypass card mismatch safety check)'}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Root info */}
                  <div className="p-3 bg-stone-950 border border-stone-850 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-bold uppercase text-[9.5px]">{lang === 'de' ? 'Rückführungstyp:' : 'Return Type:'}</span>
                      <span className="font-mono text-stone-350">{importValidatedData.konuSeoReturn ? importValidatedData.konuSeoReturn.returnType : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-bold uppercase text-[9.5px]">{lang === 'de' ? 'Quelle:' : 'Source:'}</span>
                      <span className="text-stone-355">{(importValidatedData.konuSeoReturn && importValidatedData.konuSeoReturn.source) || 'Unknown'}</span>
                    </div>
                    {importValidatedData.cardReference && (
                      <div className="flex justify-between items-center border-t border-stone-900 pt-1 mt-1 text-[10.5px]">
                        <span className="text-stone-400 font-medium">{lang === 'de' ? 'Abgeglichene Karte:' : 'Applied matching card:'}</span>
                        <span className="text-stone-200 font-bold">
                          {importValidatedData.cardReference.title || importValidatedData.cardReference.slug || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Preset Selection Buttons Row */}
                  <div className="p-3 bg-stone-900/40 border border-stone-850 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase text-stone-400 block">{lang === 'de' ? 'Fortgeschrittene Mehrfach-Auswahl:' : 'Advanced Bulk Selection:'}</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={selectAllFields}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Alle auswählen' : 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFields}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Alle abwählen' : 'Deselect All'}
                      </button>
                      <button
                        type="button"
                        onClick={selectOnlySeoFields}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Nur SEO auswählen' : 'Select Only SEO'}
                      </button>
                      <button
                        type="button"
                        onClick={selectOnlySocialFields}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Nur Social Share auswählen' : 'Select Only Social Share'}
                      </button>
                      <button
                        type="button"
                        onClick={selectOnlyAltTextFields}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-stone-700 transition cursor-pointer"
                      >
                        {lang === 'de' ? 'Nur Bild-Alt-Texte auswählen' : 'Select Only Alt Texts'}
                      </button>
                    </div>
                  </div>

                  {/* Group 1: SEO */}
                  {importValidatedData.seo && (
                    <div className="border border-stone-850 bg-stone-900/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-1.5">
                        <LucideIcons.CheckSquare size={13} />
                        <span>1. SEO</span>
                      </h4>
                      <div className="space-y-3">
                        {IMPORTABLE_FIELDS_METADATA.filter(f => f.group === 'SEO').map(f => {
                          const statusInfo = getFieldStatus(f, importValidatedData);
                          return (
                            <div key={f.id} className="p-3 bg-[#121212] border border-stone-850 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-1.5">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={!!importSelectedFields[f.id]}
                                    onChange={(e) => setImportSelectedFields(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                                  />
                                  <span>{f.label}</span>
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusInfo.css}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Aktuell:' : 'Current:'}</span>
                                  <div className="text-stone-400 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5">
                                    {renderValuePreview(getCurrentValue(f.id), f.isArray)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Neu aus JSON:' : 'New from JSON:'}</span>
                                  <div className="text-stone-300 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5 font-semibold">
                                    {renderValuePreview(getIncomingValue(f.id, importValidatedData), f.isArray, f.limit)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 2: KEYWORDS */}
                  {importValidatedData.seo && (
                    <div className="border border-stone-850 bg-stone-900/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-1.5">
                        <LucideIcons.KeyRound size={13} />
                        <span>2. Keywords</span>
                      </h4>
                      <div className="space-y-3">
                        {IMPORTABLE_FIELDS_METADATA.filter(f => f.group === 'KEYWORDS').map(f => {
                          const statusInfo = getFieldStatus(f, importValidatedData);
                          return (
                            <div key={f.id} className="p-3 bg-[#121212] border border-stone-850 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-1.5">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={!!importSelectedFields[f.id]}
                                    onChange={(e) => setImportSelectedFields(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                                  />
                                  <span>{f.label}</span>
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusInfo.css}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Aktuell:' : 'Current:'}</span>
                                  <div className="text-stone-400 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5">
                                    {renderValuePreview(getCurrentValue(f.id), f.isArray)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Neu aus JSON:' : 'New from JSON:'}</span>
                                  <div className="text-stone-300 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5 font-semibold">
                                    {renderValuePreview(getIncomingValue(f.id, importValidatedData), f.isArray, f.limit)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 3: SOCIAL SHARE */}
                  {importValidatedData.socialShare && (
                    <div className="border border-stone-850 bg-stone-900/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-1.5">
                        <LucideIcons.Share2 size={13} />
                        <span>3. Social Share</span>
                      </h4>
                      <div className="space-y-3">
                        {IMPORTABLE_FIELDS_METADATA.filter(f => f.group === 'SOCIAL').map(f => {
                          const statusInfo = getFieldStatus(f, importValidatedData);
                          return (
                            <div key={f.id} className="p-3 bg-[#121212] border border-stone-850 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-1.5">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={!!importSelectedFields[f.id]}
                                    onChange={(e) => setImportSelectedFields(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                                  />
                                  <span>{f.label}</span>
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusInfo.css}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Aktuell:' : 'Current:'}</span>
                                  <div className="text-stone-400 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5">
                                    {renderValuePreview(getCurrentValue(f.id), f.isArray)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Neu aus JSON:' : 'New from JSON:'}</span>
                                  <div className="text-stone-300 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5 font-semibold">
                                    {renderValuePreview(getIncomingValue(f.id, importValidatedData), f.isArray, f.limit)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 4: BILD-ALT-TEXTE */}
                  {importValidatedData.seo && (
                    <div className="border border-stone-850 bg-stone-900/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-1.5">
                        <LucideIcons.Image size={13} />
                        <span>4. Bild-Alt-Texte</span>
                      </h4>
                      <div className="space-y-3">
                        {IMPORTABLE_FIELDS_METADATA.filter(f => f.group === 'ALT_TEXTS').map(f => {
                          const statusInfo = getFieldStatus(f, importValidatedData);
                          return (
                            <div key={f.id} className="p-3 bg-[#121212] border border-stone-850 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-1.5">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={!!importSelectedFields[f.id]}
                                    onChange={(e) => setImportSelectedFields(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                                  />
                                  <span>{f.label}</span>
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusInfo.css}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Aktuell:' : 'Current:'}</span>
                                  <div className="text-stone-400 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5">
                                    {renderValuePreview(getCurrentValue(f.id), f.isArray)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Neu aus JSON:' : 'New from JSON:'}</span>
                                  <div className="text-stone-300 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5 font-semibold">
                                    {renderValuePreview(getIncomingValue(f.id, importValidatedData), f.isArray, f.limit)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 5: MISSING INFO */}
                  {importValidatedData.missingInfo && (
                    <div className="border border-stone-850 bg-stone-900/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 border-b border-stone-850 pb-1.5">
                        <LucideIcons.HelpCircle size={13} />
                        <span>5. Missing Info</span>
                      </h4>
                      <div className="space-y-3">
                        {IMPORTABLE_FIELDS_METADATA.filter(f => f.group === 'MISSING_INFO').map(f => {
                          const statusInfo = getFieldStatus(f, importValidatedData);
                          return (
                            <div key={f.id} className="p-3 bg-[#121212] border border-stone-850 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-1.5">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-300">
                                  <input
                                    type="checkbox"
                                    checked={!!importSelectedFields[f.id]}
                                    onChange={(e) => setImportSelectedFields(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                    className="w-3.5 h-3.5 rounded accent-rose-600 bg-stone-950 border-stone-800"
                                  />
                                  <span>{f.label}</span>
                                </label>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusInfo.css}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Aktuell:' : 'Current:'}</span>
                                  <div className="text-stone-400 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5">
                                    {renderValuePreview(getCurrentValue(f.id), f.isArray)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-stone-500 font-bold uppercase text-[8.5px] block">{lang === 'de' ? 'Neu aus JSON:' : 'New from JSON:'}</span>
                                  <div className="text-stone-300 bg-stone-950/40 p-1 rounded font-mono text-[10px] break-all max-h-16 overflow-y-auto mt-0.5 font-semibold">
                                    {renderValuePreview(getIncomingValue(f.id, importValidatedData), f.isArray, f.limit)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 2: suggestions (NOT auto applied) */}
                  <div className="border border-amber-900/40 bg-stone-950 rounded-2xl p-4 space-y-3">
                    <div className="border-b border-stone-850 pb-1.5 flex items-center justify-between animate-pulse">
                      <h4 className="text-[11px] font-black uppercase text-amber-50 tracking-wider flex items-center gap-1.5">
                        <LucideIcons.Sparkles size={13} className="text-amber-400" />
                        <span>{lang === 'de' ? 'Vorschläge (nicht automatisch übernommen)' : 'Suggestions (not auto-applied)'}</span>
                      </h4>
                      <span className="bg-amber-950/70 border border-amber-900/60 text-amber-300 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {lang === 'de' ? 'NUR ZUR SEITE' : 'REVIEW ONLY'}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-500 leading-normal">
                      {lang === 'de' 
                        ? 'Diese Bereiche enthalten strategische Vorschläge für deine Karte. Aus Sicherheitsgründen werden diese nicht automatisch übernommen und können nur gelesen werden.' 
                        : 'These sections describe strategic improvements for your brand. Out of safety and layout protection, these fields are not auto-applied and are displayed for user review.'}
                    </p>

                    {/* Conversion Suggestions */}
                    {importValidatedData.conversionSuggestions && (
                      <div className="space-y-2 bg-stone-900/40 p-3 rounded-xl border border-stone-850 text-stone-300">
                        <span className="text-[10px] font-black uppercase text-amber-400 block">{lang === 'de' ? 'Konversions- & CTA-Vorschläge' : 'Conversion & CTA Proposals'}</span>
                        
                        {importValidatedData.conversionSuggestions.primaryButtonLabel && (
                          <div>
                            <span className="text-stone-500 text-[9px] font-semibold">{lang === 'de' ? 'Empfohlener primärer Button-Label:' : 'Recommended Primary Button Label:'}</span>
                            <span className="ml-1 text-stone-200">"{importValidatedData.conversionSuggestions.primaryButtonLabel}"</span>
                          </div>
                        )}

                        {importValidatedData.conversionSuggestions.recommendedButtonOrder && Array.isArray(importValidatedData.conversionSuggestions.recommendedButtonOrder) && importValidatedData.conversionSuggestions.recommendedButtonOrder.length > 0 && (
                          <div>
                            <span className="text-stone-500 text-[9px] font-semibold block">{lang === 'de' ? 'Empfohlene Button-Reihenfolge:' : 'Recommended Button Order:'}</span>
                            <div className="flex items-center gap-1 mt-0.5 text-[9.5px]">
                              {importValidatedData.conversionSuggestions.recommendedButtonOrder.map((step: any, i: number) => (
                                <React.Fragment key={i}>
                                  {i > 0 && <span className="text-stone-600">→</span>}
                                  <span className="bg-stone-850 text-stone-300 px-1.5 py-0.5 rounded font-mono">{String(step)}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Visible Text Suggestions */}
                        {importValidatedData.conversionSuggestions.visibleTextSuggestions && typeof importValidatedData.conversionSuggestions.visibleTextSuggestions === 'object' && (
                          <div className="mt-2 pt-2 border-t border-stone-850 space-y-1">
                            <span className="text-stone-405 text-[9.5px] font-bold block">{lang === 'de' ? 'Vorgeschlagene visuelle Texte:' : 'Proposed visual texts:'}</span>
                            {Object.entries(importValidatedData.conversionSuggestions.visibleTextSuggestions).map(([tk, tv]) => tv && (
                              <div key={tk} className="text-[10px]">
                                <span className="text-stone-500 font-bold">{tk}:</span>
                                {Array.isArray(tv) ? (
                                  <ul className="list-disc pl-3 mt-0.5 space-y-0.5 text-stone-350">
                                    {tv.map((b: any, bi: number) => <li key={bi}>{String(b)}</li>)}
                                  </ul>
                                ) : (
                                  <span className="text-stone-300 italic ml-1">"{String(tv)}"</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Missing CTAs */}
                        {importValidatedData.conversionSuggestions.missingCtas && Array.isArray(importValidatedData.conversionSuggestions.missingCtas) && importValidatedData.conversionSuggestions.missingCtas.length > 0 && (
                          <div className="mt-1 text-[10px]">
                            <span className="text-stone-550 font-bold block">{lang === 'de' ? 'Empfohlene fehlende Handlungsaufforderungen (CTAs):' : 'Recommended missing Calls-To-Action (CTAs):'}</span>
                            <ul className="list-disc pl-3 mt-0.5 space-y-0.5 text-stone-350">
                              {importValidatedData.conversionSuggestions.missingCtas.map((cta: string, i: number) => (
                                <li key={i}>{cta}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Creative prompts suggestions */}
                    {importValidatedData.assetSuggestions && typeof importValidatedData.assetSuggestions === 'object' && (
                      <div className="space-y-1.5 bg-stone-900/40 p-3 rounded-xl border border-stone-850 text-stone-300">
                        <span className="text-[10px] font-black uppercase text-amber-400 block">{lang === 'de' ? 'Generative KI-Bild-Prompts (für Midjourney/Gemini)' : 'Generative AI Asset Prompts (for Midjourney/Gemini)'}</span>
                        {Object.entries(importValidatedData.assetSuggestions).map(([ak, av]) => av && (
                          <div key={ak} className="text-[10px]">
                            <span className="text-stone-500 font-bold block">{ak}:</span>
                            <p className="text-stone-300 italic bg-[#101010] p-1.5 rounded border border-stone-900 font-mono mt-0.5 text-[9.5px]">
                              {String(av)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-850 bg-stone-950/40 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAdminImportModal(false)}
                className="bg-[#1C1C1C] hover:bg-stone-850 text-stone-300 text-xs font-bold py-2.5 px-4 rounded-xl border border-stone-800 transition cursor-pointer"
              >
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>

              {importValidatedData && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApplyImportData(false)}
                    disabled={cardReferenceMismatch && !byPassMismatch}
                    className={`text-[#D6D6D6] hover:text-white bg-[#1A1A1A] hover:bg-[#242424] text-xs font-bold py-2.5 px-4 rounded-xl border border-stone-800 transition flex items-center gap-1.5 cursor-pointer ${
                      cardReferenceMismatch && !byPassMismatch ? 'opacity-40 cursor-not-allowed bg-stone-900' : ''
                    }`}
                  >
                    <span>{lang === 'de' ? 'Sichere SEO-Felder übernehmen' : 'Apply safe SEO fields'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyImportData(true)}
                    disabled={cardReferenceMismatch && !byPassMismatch}
                    className={`text-white text-xs font-black py-2.5 px-5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                      cardReferenceMismatch && !byPassMismatch ? 'bg-stone-800 text-stone-500 opacity-40 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/35'
                    }`}
                  >
                    <LucideIcons.Check size={14} />
                    <span>{lang === 'de' ? 'Ausgewählte Felder übernehmen' : 'Apply selected fields'}</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 text-stone-200 font-bold px-5 py-3.5 rounded-2xl text-xs shadow-2xl flex items-center gap-3.5 border animate-slide-in max-w-sm w-[90%] justify-between ${
          toastNotification.type === 'error' 
            ? 'bg-red-950 border-red-900/60' 
            : toastNotification.type === 'info'
            ? 'bg-blue-950 border-blue-900/60'
            : 'bg-[#1C1C1C] border-stone-800/85'
        }`}>
          <div className="flex items-center gap-2.5 text-left">
            {toastNotification.type === 'error' ? (
              <LucideIcons.AlertTriangle size={15} className="text-red-550 shrink-0" />
            ) : toastNotification.type === 'info' ? (
              <LucideIcons.Info size={15} className="text-blue-400 shrink-0" />
            ) : (
              <LucideIcons.CheckCircle size={15} className="text-[#A855F7] shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-black leading-tight">
                {toastNotification.type === 'error' ? (lang === 'de' ? 'Achtung' : 'Alert') : (lang === 'de' ? 'Abgeschlossen' : 'Completed')}
              </span>
              <span className="text-[10px] text-stone-300 font-medium mt-0.5 leading-snug">
                {toastNotification.message}
              </span>
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-stone-500 hover:text-white transition p-1 shrink-0"
          >
            <LucideIcons.X size={13} />
          </button>
        </div>
      )}

      {/* MODAL: DELETE CARD CONFIRMATION */}
      {cardSeekingDelete && (
        <div className="fixed inset-0 z-55 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121212] border border-stone-850 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-stone-850 flex items-center justify-between bg-stone-900">
              <div className="flex items-center gap-2">
                <LucideIcons.Trash2 size={16} className="text-red-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {lang === 'de' ? 'Karte löschen' : 'Delete Card'}
                </h3>
              </div>
              <button 
                onClick={() => setCardSeekingDelete(null)} 
                className="text-stone-500 hover:text-white transition"
              >
                <LucideIcons.X size={18} />
              </button>
            </div>

            <div className="p-6 bg-stone-950 text-left">
              <p className="text-xs text-stone-300 font-medium mb-4 leading-relaxed">
                {lang === 'de' 
                  ? `Bist du sicher, dass du die Karte "${cardSeekingDelete.title}" unwiderruflich löschen möchtest? Alle hinterlegten Daten auf dieser Seite gehen damit unwiderruflich verloren.` 
                  : `Are you sure you want to permanently delete the card "${cardSeekingDelete.title}"? This cannot be undone.`}
              </p>
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2.5">
                <LucideIcons.AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span className="text-[10px] text-red-300 leading-snug font-medium">
                  {lang === 'de' 
                    ? 'Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden!' 
                    : 'This action is final and can never be restored!'}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-stone-850 bg-stone-900 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCardSeekingDelete(null)}
                className="bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold py-2.5 px-4 rounded-xl border border-stone-700 transition cursor-pointer"
              >
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteCardConfirmAction}
                className="bg-red-700 hover:bg-red-650 text-white text-xs font-black py-2.5 px-5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Trash2 size={13} />
                {lang === 'de' ? 'Endgültig löschen' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
