/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardButton, getPublicCardUrl } from '../types';
import { downloadVCardFileFromCard } from '../utils/vcard-wrapper';
import { canUseFeature } from '../config/plans';
import { UpgradeModal } from './UpgradeModal';

interface ShareExportModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'de' | 'en';
  isUpdateSharing?: boolean;
}

export function ShareExportModal({ card, isOpen, onClose, lang = 'de', isUpdateSharing = false }: ShareExportModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const [showUpgradeModalShare, setShowUpgradeModalShare] = useState(false);
  const [upgradeFeatureKeyShare, setUpgradeFeatureKeyShare] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);

  // Sharing Text Editor
  const [shareText, setShareText] = useState<string>('');
  const [isCopiedShareText, setIsCopiedShareText] = useState(false);

  // Bottom Sheet/Modal state
  const [subView, setSubView] = useState<'menu' | 'qrcode' | 'pwa_instructions' | 'reel'>('menu');
  const [socialReelShareConfig, setSocialReelShareConfig] = useState<{
    lastCopiedPlatform?: 'instagram' | 'youtubeShorts' | 'facebook' | 'linkedin' | 'cardLink';
    updatedAt?: string;
  }>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // PWA installation interceptor hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => (typeof window !== 'undefined' ? (window as any).deferredPrompt || null : null));

  useEffect(() => {
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e;
      console.log("beforeinstallprompt captured");
    };
    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleSaveAsApp = async () => {
    const prompt = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);
    console.log("Save as app clicked", { publicUrl, canInstall: !!prompt, hasDeferredPrompt: !!deferredPrompt });
    
    if (prompt) {
      prompt.prompt();
      try {
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
          showToast(lang === 'de' ? 'ureel wurde als App gespeichert' : 'ureel saved as app');
        } else {
          showToast(lang === 'de' ? 'Installation abgebrochen' : 'Installation cancelled');
        }
      } catch (err) {
        console.error('Error in install execution:', err);
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).deferredPrompt = null;
      }
    } else {
      console.log("Opening install help modal");
      setShowInstructions(false); // Reset to summary card by default
      setSubView('pwa_instructions');
    }
  };

  // Hidden Refs for Image Generation
  const previewRefOG = useRef<HTMLDivElement>(null);
  const previewRefSquare = useRef<HTMLDivElement>(null);
  const previewRefStory = useRef<HTMLDivElement>(null);
  const previewRefPromo = useRef<HTMLDivElement>(null);

  const publicUrl = getPublicCardUrl(card.slug);

  const instagramText = lang === 'de'
    ? 'Meine digitale Karte findest du über den Link im Profil. Dort kannst du mich direkt kontaktieren.'
    : 'My digital card is available through the link in my profile. You can contact me directly there.';

  const youtubeText = lang === 'de'
    ? `Hier geht’s zu meiner interaktiven Karte: ${publicUrl}`
    : `Open my interactive card here: ${publicUrl}`;

  const facebookText = lang === 'de'
    ? `Hier findest du meine interaktive digitale Karte mit Kontakt, Website und allen Links: ${publicUrl}`
    : `Here is my interactive digital card with contact details, website and all links: ${publicUrl}`;

  const linkedinText = lang === 'de'
    ? `Meine digitale Visitenkarte mit Kontaktmöglichkeiten, Website und weiteren Links: ${publicUrl}`
    : `My digital business card with contact options, website and additional links: ${publicUrl}`;

  const copyPlatformText = (platform: 'instagram' | 'youtubeShorts' | 'facebook' | 'linkedin', text: string) => {
    navigator.clipboard.writeText(text);
    setSocialReelShareConfig({
      lastCopiedPlatform: platform,
      updatedAt: new Date().toISOString()
    });
    
    let label = '';
    if (platform === 'instagram') label = 'Instagram';
    else if (platform === 'youtubeShorts') label = 'YouTube';
    else if (platform === 'facebook') label = 'Facebook';
    else if (platform === 'linkedin') label = 'LinkedIn';

    showToast(lang === 'de' ? `${label}-Text kopiert!` : `${label} text copied!`);
  };

  const handleCopyCardLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setSocialReelShareConfig({
      lastCopiedPlatform: 'cardLink',
      updatedAt: new Date().toISOString()
    });
    showToast(lang === 'de' ? 'Kartenlink kopiert' : 'Card link copied');
  };
  const cardPlan = card?.plan || 'starter';
  const hasBrandingHiddenFeature = canUseFeature(cardPlan, 'brandingHidden');
  const isHidden = hasBrandingHiddenFeature && card.brandingHidden === true;
  const isFree = !hasBrandingHiddenFeature;

  // Manage custom toast feedback
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2000);
  };

  // Safe wrapper for closing modal
  const handleClose = () => {
    setSubView('menu');
    onClose();
  };

  // Set default sharing messages based on profile type
  useEffect(() => {
    if (!card) return;
    const type = (card.profileType || card.type || 'person') as any;
    let text = '';
    
    const cardPlan = card?.plan || 'starter';
    const isBrandingHidden = canUseFeature(cardPlan, 'brandingHidden') && card.brandingHidden === true;

    if (isUpdateSharing) {
      if (type === 'person') {
        text = isBrandingHidden
          ? `Ich habe mein digitales Profil aktualisiert: ${publicUrl}`
          : `Ich habe mein ureel-Profil aktualisiert: ${publicUrl}`;
      } else if (type === 'company' || type === 'business') {
        text = isBrandingHidden
          ? `Neue Infos auf unserer digitalen Karte: ${publicUrl}`
          : `Neue Infos auf unserer ureel-Seite: ${publicUrl}`;
      } else if (type === 'product') {
        text = isBrandingHidden
          ? `Neue Produktinfos auf unserer digitalen Seite: ${publicUrl}`
          : `Neue Produktinfos auf unserer ureel-Seite: ${publicUrl}`;
      } else if (type === 'club' || type === 'event' || type === 'school' || type === 'schule' || type === 'verein') {
        text = isBrandingHidden
          ? `Neue Vereinsinfos auf unserer digitalen Seite: ${publicUrl}`
          : `Neue Vereinsinfos auf unserer ureel-Seite: ${publicUrl}`;
      } else {
        text = isBrandingHidden
          ? `Ich habe meine digitale Seite aktualisiert: ${publicUrl}`
          : `Ich habe meine ureel-Seite aktualisiert: ${publicUrl}`;
      }
    } else {
      if (type === 'person') {
        text = isBrandingHidden
          ? `Hier findest du meine digitale Visitenkarte: ${publicUrl}`
          : `Hier findest du meine ureel-Seite: ${publicUrl}`;
      } else if (type === 'company' || type === 'business') {
        text = isBrandingHidden
          ? `Hier finden Sie unsere digitale Visitenkarte: ${publicUrl}`
          : `Hier finden Sie unsere ureel-Seite: ${publicUrl}`;
      } else if (type === 'product') {
        text = isBrandingHidden
          ? `Hier findest du alle Infos zum Produkt: ${publicUrl}`
          : `Hier findest du alle Infos zum Produkt: ${publicUrl}`;
      } else if (type === 'club' || type === 'event' || type === 'school' || type === 'schule') {
        text = isBrandingHidden
          ? `Alle Vereinsinfos findest du hier: ${publicUrl}`
          : `Alle Vereinsinfos findest du hier: ${publicUrl}`;
      } else if (type === 'project') {
        text = isBrandingHidden
          ? `Hier findest du alle wichtigen Informationen zu unserem Projekt: ${publicUrl}`
          : `Hier findest du alle wichtigen Informationen zu unserem Projekt: ${publicUrl}`;
      } else if (type === 'family') {
        text = isBrandingHidden
          ? `Hier findest du unsere digitale Familienseite: ${publicUrl}`
          : `Hier findest du unsere Familien-ureel-Seite: ${publicUrl}`;
      } else if (type === 'restaurant') {
        text = isBrandingHidden
          ? `Hier findest du Speisekarte, Reservierung und Kontakt: ${publicUrl}`
          : `Hier findest du Speisekarte, Reservierung und Kontakt: ${publicUrl}`;
      } else {
        text = isBrandingHidden
          ? `Hier findest du mein digitales Profil: ${publicUrl}`
          : `Hier findest du meine ureel-Seite: ${publicUrl}`;
      }
    }
    setShareText(text);
  }, [card, publicUrl, isUpdateSharing]);

  // Generate QR Code on load
  useEffect(() => {
    if (publicUrl) {
      QRCode.toDataURL(publicUrl, {
        margin: 1.5,
        width: 600,
        color: {
          dark: '#1C1C1C', // Anthracite
          light: '#F5EFE3' // Cremeweiß
        }
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Failed to generate QR Code PNG:', err));

      QRCode.toString(publicUrl, {
        type: 'svg',
        margin: 1.5,
        color: {
          dark: '#1C1C1C', // Anthracite
          light: '#F5EFE3' // Cremeweiß
        }
      })
        .then((svg) => setQrCodeSvg(svg))
        .catch((err) => console.error('Failed to generate QR Code SVG:', err));
    }
  }, [publicUrl]);

  if (!isOpen) return null;
   const triggerCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showToast(
      lang === 'de'
        ? 'Für Social Media nutze ureel-Werbebild teilen.'
        : 'For social media, use Share ureel promo image.'
    );
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWithPromoImage = async () => {
    const title = card.title || 'ureel';
    const textMsg = lang === 'de'
      ? `Hier ist meine ureel – meine digitale Präsenz in einem Link: ${publicUrl}`
      : `Here is my ureel – my digital presence in one link: ${publicUrl}`;
    const filename = `ureel-promo-${card.slug}.png`;

    setDownloadingImage('promo');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const targetRef = previewRefPromo;
      if (!targetRef.current) throw new Error('Ref not found');

      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        backgroundColor: '#111111',
        pixelRatio: 2,
        fontEmbedCSS: '',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // Fallback Check & Native Share Execution
      if (navigator.share) {
        // Can share files?
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title,
              text: textMsg,
              url: publicUrl,
            });
            showToast(lang === 'de' ? 'Erfolgreich geteilt' : 'Successfully shared');
            return;
          } catch (shareErr) {
            console.warn('Native file share call failed or canceled, falling back:', shareErr);
          }
        }

        // Fallback: Share without files but download image
        try {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          await navigator.share({
            title,
            text: textMsg,
            url: publicUrl,
          });

          showToast(
            lang === 'de'
              ? 'Werbebild heruntergeladen. Link wurde geteilt.'
              : 'Promo image downloaded. Link was shared.'
          );
          return;
        } catch (shareErr2) {
          console.warn('Native share without files cancelled:', shareErr2);
        }
      }

      // No share support: Download and copy
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      navigator.clipboard.writeText(publicUrl);
      showToast(
        lang === 'de'
          ? 'Werbebild heruntergeladen und Link kopiert.'
          : 'Promo image downloaded and link copied.'
      );

    } catch (err) {
      console.error('Failed to generate promo image:', err);
      // Fallback on total failure: Share text & link or copy link
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: textMsg,
            url: publicUrl,
          });
          showToast(
            lang === 'de'
              ? 'Werbebild konnte nicht erstellt werden. Link wurde geteilt.'
              : 'Promo image could not be created. Link was shared.'
          );
          return;
        } catch (shareErr3) {
          console.warn('Fallback share call failed:', shareErr3);
        }
      }

      navigator.clipboard.writeText(publicUrl);
      showToast(
        lang === 'de'
          ? 'Werbebild konnte nicht erstellt werden. Link wurde geteilt.'
          : 'Promo image could not be created. Link was shared.'
      );
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleWhatsAppShare = async () => {
    const title = card.title || 'ureel';
    const textMsg = lang === 'de'
      ? `Schau dir meine ureel an: ${publicUrl}`
      : `Check out my ureel: ${publicUrl}`;
    const filename = `ureel-promo-${card.slug}.png`;

    setDownloadingImage('promo');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const targetRef = previewRefPromo;
      if (!targetRef.current) throw new Error('Ref not found');
      
      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        backgroundColor: '#111111',
        pixelRatio: 2,
        fontEmbedCSS: '',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // Check if native file share is supported and can share this file
      if (navigator.share && (navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title,
            text: textMsg,
          });
          showToast(lang === 'de' ? 'Erfolgreich geteilt' : 'Successfully shared');
          return;
        } catch (shareErr) {
          console.warn('WhatsApp Native file share cancelled, falling back to download:', shareErr);
        }
      }

      // Fallback: Download image and open WhatsApp web
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const encodedText = encodeURIComponent(textMsg);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');

      showToast(
        lang === 'de'
          ? 'Werbebild wurde heruntergeladen. Füge es bei WhatsApp hinzu.'
          : 'Promo image downloaded. Attach it in WhatsApp.'
      );
    } catch (err) {
      console.error('Failed to generate promo image for WhatsApp, falling back:', err);
      const encodedText = encodeURIComponent(textMsg);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      showToast(
        lang === 'de'
          ? 'Werbebild konnte nicht erstellt werden. Link wurde geteilt.'
          : 'Promo image could not be created. Link was shared.'
      );
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleSmsShare = () => {
    const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const smsText = lang === 'de'
      ? `Schau dir meine ureel an: ${publicUrl}`
      : `Check out my ureel: ${publicUrl}`;
    const smsUrl = `sms:${isIos ? '&' : '?'}body=${encodeURIComponent(smsText)}`;
    window.location.href = smsUrl;
  };

  // Web Share Integration
  const handleNativeShare = async () => {
    await handleShareWithPromoImage();
  };;

  // Image Downloads via html-to-image
  const downloadImageExport = async (format: 'og' | 'square' | 'story' | 'promo') => {
    let targetRef: React.RefObject<HTMLDivElement | null>;
    let filename = '';

    if (format === 'og') {
      targetRef = previewRefOG;
      filename = `ureel_og_${card.slug}.png`;
    } else if (format === 'square') {
      targetRef = previewRefSquare;
      filename = `ureel_square_${card.slug}.png`;
    } else if (format === 'story') {
      targetRef = previewRefStory;
      filename = `ureel_story_${card.slug}.png`;
    } else {
      targetRef = previewRefPromo;
      filename = `ureel-promo-${card.slug}.png`;
    }

    if (!targetRef.current) return;
    setDownloadingImage(format);

    try {
      // Small delay to ensure rendering of background components
      await new Promise((resolve) => setTimeout(resolve, 400));
      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        backgroundColor: '#111111',
        pixelRatio: 2, // High DPI capture
        fontEmbedCSS: '', // Disable google fonts CSS embedding to bypass cssRules CORS exceptions
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      let wasShared = false;
      if (format === 'promo' && typeof navigator !== 'undefined' && navigator.share && (navigator as any).canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], filename, { type: 'image/png' });
          const shareTextMsg = lang === 'de'
            ? `Hier ist meine ureel – meine digitale Präsenz in einem Link: ${publicUrl}`
            : `Here is my ureel – my digital presence in one link: ${publicUrl}`;

          const shareData = {
            files: [file],
            title: card.title || 'ureel',
            text: shareTextMsg,
          };

          if ((navigator as any).canShare(shareData)) {
            await navigator.share(shareData);
            wasShared = true;
            showToast(lang === 'de' ? 'Erfolgreich geteilt' : 'Successfully shared');
          }
        } catch (shareErr) {
          console.warn('Native file share failed / cancelled, downloading instead:', shareErr);
        }
      }

      if (!wasShared) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (format === 'promo') {
          // Automatic link copy and special toast for promo as requested
          navigator.clipboard.writeText(publicUrl);
          showToast(
            lang === 'de'
              ? 'Werbebild heruntergeladen und Link kopiert.'
              : 'Promo image downloaded and link copied.'
          );
        } else {
          showToast(lang === 'de' ? 'Bild erfolgreich gespeichert' : 'Image saved successfully');
        }
      }
    } catch (err) {
      console.error('Failed to export image:', err);
      alert(lang === 'de' ? 'Das Bild konnte nicht erzeugt werden.' : 'Failed to generate image export.');
    } finally {
      setDownloadingImage(null);
    }
  };

  const handleDownloadQrPng = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `ureel_qr_${card.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'de' ? 'PNG-Code gespeichert!' : 'PNG Code saved!');
  };

  const handleDownloadQrSvgOrUpgrade = () => {
    const cardPlan = card?.plan || 'starter';
    const hasAdvancedExport = canUseFeature(cardPlan, 'advancedQrExport');
    
    if (!hasAdvancedExport) {
      setUpgradeFeatureKeyShare('advancedQrExport');
      setShowUpgradeModalShare(true);
      return;
    }

    if (!qrCodeSvg) return;
    const blob = new Blob([qrCodeSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ureel_qr_${card.slug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(lang === 'de' ? 'SVG Vektor-Code gespeichert!' : 'SVG Vector Code saved!');
  };

  // Get first 3-6 buttons to display in visual templates as small visual chips
  const activeButtonsToShow = (card.buttons || [])
    .filter(b => b.title && b.isActive !== false)
    .slice(0, 5);

  const fallbackBackground = "radial-gradient(circle at 50% 50%, #1c1c1c 0%, #0c0c0c 100%)";

  const renderOptionRow = ({
    icon,
    title,
    subtitle,
    onClick,
    rightElement,
    disabled = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full text-left bg-stone-900 hover:bg-stone-850 active:bg-black border border-stone-800/80 hover:border-purple-500/30 rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 cursor-pointer disabled:opacity-40 select-none group"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 text-[#A855F7] group-hover:scale-105 transition-transform">
            {icon}
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-xs font-bold text-[#F5EFE3] group-hover:text-white transition-colors">{title}</h4>
            <p className="text-[10px] text-stone-400 font-medium truncate mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center text-stone-500 group-hover:text-purple-400 transition-colors pl-2">
          {rightElement || <LucideIcons.ChevronRight size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />}
        </div>
      </button>
    );
  };

  const isNativeShareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Main Drawer/Modal Content Panel */}
      <div className="relative w-full max-w-md bg-[#121212] border-t border-stone-800 rounded-t-[2rem] md:border md:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] md:max-h-[85vh] text-stone-200 select-none font-sans z-10">
        
        {/* Header Indicator Bar on Mobile */}
        <div className="w-12 h-1 bg-stone-800 rounded-full mx-auto mt-3.5 mb-1.5 md:hidden" />

        {/* Header Section */}
        <div className="px-6 py-4.5 border-b border-stone-900 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-[#F5EFE3] tracking-wider uppercase">
              {lang === 'de' ? 'ureel teilen' : 'Share ureel'}
            </h2>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">
              {lang === 'de' ? 'Ein Link. Deine digitale Präsenz.' : 'One link. Your digital presence.'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:border-stone-700 transition cursor-pointer"
          >
            <LucideIcons.X size={15} />
          </button>
        </div>

        {/* Content Body Container */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-100px)] md:max-h-[calc(85vh-100px)] scrollbar-thin">
          
          {/* Custom Toast Messages */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-950 border border-purple-500/40 text-[#F5EFE3] text-xs font-bold py-2 px-4.5 rounded-full shadow-2xl z-50 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SubView Selector Implementation */}
          {subView === 'menu' ? (
            <div className="space-y-6">
              
              {/* Optional Update Banner/Notice */}
              {isUpdateSharing && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2.5xl p-4 flex items-start gap-3">
                  <LucideIcons.Sparkles size={16} className="shrink-0 text-purple-400 mt-0.5 animate-pulse" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-extrabold uppercase text-[10px] tracking-wider block text-purple-400 mb-0.5">Teile dein Update!</span>
                    <span>Deine ureel wurde erfolgreich aktualisiert. Verkünde deine Neuerungen.</span>
                  </div>
                </div>
              )}

              {/* Public Link Box Component */}
              <div className="bg-stone-950 border border-stone-850/80 p-4.5 rounded-2.5xl space-y-3 shadow-inner">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7] block">
                  Dein öffentlicher ureel-Link
                </span>
                <div className="flex items-center justify-between gap-3 bg-stone-900 border border-stone-850 p-2.5 rounded-xl">
                  <LucideIcons.Link size={14} className="text-[#A855F7] shrink-0" />
                  <span className="text-xs font-mono text-stone-200 select-all truncate flex-1 min-w-0 pr-1">
                    {publicUrl}
                  </span>
                  <button
                    onClick={triggerCopyLink}
                    className="shrink-0 text-[10px] font-extrabold text-stone-950 dark:text-stone-950 bg-purple-600 hover:bg-purple-500 py-1 px-3 rounded-lg transition"
                  >
                    {copiedLink ? 'KOPIERT!' : 'KOPIEREN'}
                  </button>
                </div>
              </div>

               {/* Primäre Option: Mit Werbebild teilen */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={downloadingImage !== null}
                  onClick={handleShareWithPromoImage}
                  className="w-full text-left bg-gradient-to-br from-[#1C1A14] to-[#12110D] hover:from-[#26231A] hover:to-[#171510] active:from-black active:to-black border border-purple-500/40 hover:border-purple-500/80 rounded-2.5xl p-5 flex items-center justify-between transition-all duration-300 cursor-pointer disabled:opacity-50 group relative shadow-[0_4px_20px_rgba(201,166,70,0.1)] overflow-hidden"
                >
                  <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#A855F7]/5 rounded-full blur-2xl group-hover:bg-[#A855F7]/10 transition-all duration-300" />
                  
                  <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center shrink-0 text-[#A855F7] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(201,166,70,0.15)]">
                      {downloadingImage === 'promo' ? (
                        <LucideIcons.Loader2 size={24} className="animate-spin" />
                      ) : (
                        <LucideIcons.Sparkles size={24} className="text-[#A855F7]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-[#F5EFE3] group-hover:text-white transition-colors tracking-wide uppercase">
                          {lang === 'de' ? 'Mit Werbebild teilen' : 'Share with promo image'}
                        </h4>
                        <span className="text-[8px] font-black uppercase bg-[#A855F7] text-stone-950 px-1.5 py-0.5 rounded tracking-widest animate-pulse shrink-0">
                          {lang === 'de' ? 'Empfohlen' : 'PRO'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-semibold mt-1 leading-relaxed">
                        {lang === 'de' ? 'Karte professionell als Bild + Link teilen.' : 'Share your card professionally as image + link.'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center text-[#A855F7] group-hover:text-purple-400-light transition-colors pl-3 relative z-10">
                    {downloadingImage === 'promo' ? (
                      <LucideIcons.Loader2 size={16} className="animate-spin text-purple-400" />
                    ) : (
                      <LucideIcons.ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </button>
              </div>

              {/* Bereich: Reel teilen */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#A855F7] pl-1">
                  {lang === 'de' ? 'Reel teilen' : 'Share reel'}
                </h3>
                {renderOptionRow({
                  icon: <LucideIcons.Film size={15} />,
                  title: lang === 'de' ? 'Reel teilen' : 'Share reel',
                  subtitle: lang === 'de' ? 'Social-Media-Texte kopieren & Reel-Status prüfen' : 'Copy social media texts & check reel status',
                  onClick: () => setSubView('reel')
                })}
              </div>

              {/* Weitere Optionen */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#A855F7] pl-1">
                  {lang === 'de' ? 'Weitere Optionen' : 'More options'}
                </h3>

                {renderOptionRow({
                  icon: <LucideIcons.UserPlus size={15} />,
                  title: lang === 'de' ? 'In Kontakten speichern' : 'Save to contacts',
                  subtitle: lang === 'de' ? 'Kontaktdatei (.vcf) deiner Karte herunterladen' : 'Download contact card file (.vcf)',
                  onClick: () => downloadVCardFileFromCard(card)
                })}

                {renderOptionRow({
                  icon: <LucideIcons.MessageCircle size={15} />,
                  title: lang === 'de' ? 'WhatsApp teilen' : 'Share via WhatsApp',
                  subtitle: lang === 'de' ? 'Teile deine Karte mit Bild und Text bei WhatsApp' : 'Share your card with image and text on WhatsApp',
                  onClick: handleWhatsAppShare,
                  disabled: downloadingImage !== null,
                  rightElement: downloadingImage === 'promo' ? (
                    <LucideIcons.Loader2 size={14} className="animate-spin text-purple-400" />
                  ) : undefined
                })}

                {renderOptionRow({
                  icon: <LucideIcons.QrCode size={15} />,
                  title: lang === 'de' ? 'QR-Code anzeigen' : 'Show QR code',
                  subtitle: lang === 'de' ? 'Zum Scannen auf dem Bildschirm aufrufen' : 'Open on-screen for offline scanning',
                  onClick: () => setSubView('qrcode')
                })}

                {renderOptionRow({
                  icon: <LucideIcons.MessageSquare size={15} />,
                  title: lang === 'de' ? 'SMS teilen' : 'Share via SMS',
                  subtitle: lang === 'de' ? 'Deine Karte per SMS versenden (ohne Bild)' : 'Send your card via SMS (no image)',
                  onClick: handleSmsShare
                })}
              </div>

            </div>
          ) : subView === 'qrcode' ? (
            /* SubView: QRCode Presentation Screen */
            <div className="space-y-6 flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between border-b border-stone-900 pb-3">
                <button
                  type="button"
                  onClick={() => setSubView('menu')}
                  className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <LucideIcons.ArrowLeft size={14} />
                  <span>{lang === 'de' ? 'Teilen-Menü' : 'Share Menu'}</span>
                </button>
                <span className="text-[11px] font-extrabold uppercase text-purple-400 tracking-widest">ureel QR Code</span>
                <div className="w-14" />
              </div>

              {/* Elegant white framed QR representation block */}
              <div className="bg-stone-950 border border-stone-850 p-6 rounded-3xl w-full max-w-sm flex flex-col items-center justify-center text-center shadow-inner space-y-4">
                <div className="p-3 bg-[#F5EFE3] rounded-2xl flex items-center justify-center shadow-lg inline-block">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="ureel QR Code" className="w-44 h-44 object-contain rounded-lg" />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-[#A855F7]">
                      <LucideIcons.Loader className="animate-spin" size={24} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 w-full">
                  <p className="text-xs font-mono text-stone-300 select-all truncate px-2">
                    {publicUrl}
                  </p>
                  <p className="text-[10px] text-stone-500 font-medium">
                    {lang === 'de' ? 'Scanne diesen Code, um meine ureel direkt zu öffnen.' : 'Scan this code to load my ureel immediately.'}
                  </p>
                </div>

                {/* Overlay Branding Row */}
                {!isHidden && (
                  <div className="flex items-center gap-1.5 justify-center pt-2 select-none">
                    <span className="text-purple-400 text-xs font-black tracking-widest border border-purple-500/30 px-1.5 py-0.5 rounded-md">ureel</span>
                    <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">
                      {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom control row for QR Code View */}
              <div className="space-y-3 w-full">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-stone-950 text-xs font-black py-3 px-4.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <LucideIcons.Download size={14} />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQrSvgOrUpgrade}
                    className={`flex-1 text-xs font-black py-3 px-4.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border ${
                      !canUseFeature(cardPlan, 'advancedQrExport')
                        ? 'bg-stone-950 border-stone-900 hover:border-stone-800 text-stone-450'
                        : 'bg-emerald-950 border-emerald-900/60 hover:border-emerald-850 text-emerald-300'
                    }`}
                  >
                    {!canUseFeature(cardPlan, 'advancedQrExport') ? (
                      <>
                        <LucideIcons.Lock size={13} className="text-amber-500" />
                        <span>Download SVG (PRO)</span>
                      </>
                    ) : (
                      <>
                        <LucideIcons.Download size={14} />
                        <span>Download SVG (Vector)</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-purple-500/30 text-stone-200 text-xs py-3 px-4.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LucideIcons.Share2 size={14} className="text-[#A855F7]" />
                  <span>{lang === 'de' ? 'Link teilen' : 'Share link'}</span>
                </button>
              </div>

            </div>
          ) : subView === 'reel' ? (
            /* SubView: Reel teilen */
            <div className="space-y-6 flex flex-col font-sans">
              
              <div className="w-full flex items-center justify-between border-b border-stone-900 pb-3">
                <button
                  type="button"
                  onClick={() => setSubView('menu')}
                  className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <LucideIcons.ArrowLeft size={14} />
                  <span>{lang === 'de' ? 'Teilen-Menü' : 'Share Menu'}</span>
                </button>
                <span className="text-[11px] font-extrabold uppercase text-purple-400 tracking-widest">
                  {lang === 'de' ? 'Reel teilen' : 'Share Reel'}
                </span>
                <div className="w-14" />
              </div>

              {/* Honest Explanation Banner */}
              <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-2xl p-4 flex items-start gap-3">
                <LucideIcons.Info size={16} className="text-[#A855F7] shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[11px] leading-relaxed text-stone-300 font-medium">
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block text-purple-400 mb-1">
                    {lang === 'de' ? 'Wichtiger Hinweis' : 'Important Note'}
                  </span>
                  <span>
                    {lang === 'de'
                      ? 'Im Reel selbst sind Buttons sichtbar, aber nicht klickbar. Füge deinen Kartenlink zur Beschreibung, Bio oder zum Beitrag hinzu. Besucher öffnen darüber deine interaktive Karte und können dort alle Buttons bedienen.'
                      : 'Buttons inside the reel are visible, but not clickable. Add your card link to the description, bio or post. Visitors can open your interactive card there and use all buttons.'}
                  </span>
                </div>
              </div>

              {/* Plan constraints warning for starter */}
              {cardPlan === 'starter' && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <LucideIcons.Lock size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-stone-300 leading-normal font-bold">
                    {lang === 'de'
                      ? 'Die Social-Texte können kopiert werden. Beachte, dass für eine animierte Reel-Visitenkarte der ureel Pro Plan benötigt wird.'
                      : 'Social texts can be copied. Note that an animated reel business card requires the ureel Pro plan.'}
                  </div>
                </div>
              )}

              {/* Status information config preview */}
              {(() => {
                const vBg = card.videoBackgroundConfig;
                const isReelActive = vBg?.enabled === true;
                const vDuration = vBg?.durationSeconds || vBg?.duration || 12;
                const vButtonStart = vBg?.buttonReveal?.enabled ? (vBg.buttonReveal.startSecond ?? 0) : null;
                const vTextStart = vBg?.textReveal?.enabled ? (vBg.textReveal.startSecond ?? 0) : null;

                return (
                  <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl space-y-3 shadow-inner">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F5EFE3] block">
                      {lang === 'de' ? 'Reel-Visitenkarten Status' : 'Reel Business Card Status'}
                    </span>

                    {isReelActive ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-black uppercase text-green-400 font-mono">
                            {lang === 'de' ? 'Aktiviert' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                          <div className="bg-stone-900 border border-stone-850 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-0.5">{lang === 'de' ? 'Dauer' : 'Duration'}</span>
                            <span className="font-black text-white">{vDuration}s</span>
                          </div>
                          <div className="bg-stone-900 border border-stone-850 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-0.5">{lang === 'de' ? 'Buttons ab' : 'Buttons at'}</span>
                            <span className="font-black text-[#A855F7]">
                              {vButtonStart !== null ? `${vButtonStart}s` : (lang === 'de' ? 'Sofort' : 'Immediately')}
                            </span>
                          </div>
                          <div className="bg-stone-900 border border-stone-850 p-2.5 rounded-xl text-center">
                            <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-0.5">{lang === 'de' ? 'Text ab' : 'Text at'}</span>
                            <span className="font-black text-[#A855F7]">
                              {vTextStart !== null ? `${vTextStart}s` : (lang === 'de' ? 'Sofort' : 'Immediately')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-stone-600" />
                          <span className="text-xs font-black uppercase text-stone-400">
                            {lang === 'de' ? 'Nicht aktiv' : 'Not Active'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-semibold leading-relaxed leading-normal">
                          {lang === 'de'
                            ? 'Aktiviere die Reel-Visitenkarte im Hintergrund-Editor, um eine animierte Kartenstory vorzubereiten.'
                            : 'Enable the reel business card in the background editor to prepare an animated card story.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Copy card link and qr code selection */}
              <div className="bg-stone-950 border border-stone-850/80 p-4 rounded-2xl space-y-3 shadow-inner">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7] block">
                  {lang === 'de' ? 'Kartenlink & QR-Code' : 'Card Link & QR Code'}
                </span>
                
                <div className="flex items-center justify-between gap-2.5 bg-stone-900 border border-stone-850 p-2 rounded-xl">
                  <LucideIcons.Link size={14} className="text-[#A855F7] shrink-0 ml-1" />
                  <span className="text-[11px] font-mono text-stone-200 select-all truncate flex-grow min-w-0 pr-1">
                    {publicUrl}
                  </span>
                  <button
                    onClick={handleCopyCardLink}
                    className="shrink-0 text-[10px] font-extrabold text-stone-950 bg-purple-600 hover:bg-purple-500 py-1.5 px-3 rounded-lg transition"
                  >
                    {socialReelShareConfig.lastCopiedPlatform === 'cardLink' ? 'KOPIERT!' : (lang === 'de' ? 'Kartenlink kopieren' : 'Copy card link')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQrPng}
                    className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-[11px] font-black py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcons.Download size={13} className="text-purple-400" />
                    <span>{lang === 'de' ? 'QR herunterladen' : 'Download QR'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView('qrcode')}
                    className="bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-[11px] font-black py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcons.QrCode size={13} className="text-purple-400" />
                    <span>{lang === 'de' ? 'QR Code öffnen' : 'Open QR Code'}</span>
                  </button>
                </div>
              </div>

              {/* Copy platforms texts captions */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7] pl-1 block">
                  {lang === 'de' ? 'Plattform-Texte kopieren' : 'Copy Platform Captions'}
                </span>

                {/* Instagram */}
                <div className="bg-stone-950 border border-stone-850 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-pink-400 flex items-center gap-1.5">
                      <LucideIcons.Instagram size={13} />
                      Instagram Caption
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPlatformText('instagram', instagramText)}
                      className="text-[9px] font-black uppercase bg-purple-600 text-stone-950 py-1 px-2.5 rounded transition cursor-pointer hover:bg-purple-500 font-bold"
                    >
                      {socialReelShareConfig.lastCopiedPlatform === 'instagram' ? 'Kopiert!' : (lang === 'de' ? 'Instagram Text kopieren' : 'Copy Instagram text')}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-relaxed font-semibold italic bg-stone-900 p-2.5 rounded-lg border border-stone-850">
                    "{instagramText}"
                  </p>
                </div>

                {/* YouTube */}
                <div className="bg-stone-950 border border-stone-850 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1.5">
                      <LucideIcons.Youtube size={13} />
                      YouTube Shorts Info
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPlatformText('youtubeShorts', youtubeText)}
                      className="text-[9px] font-black uppercase bg-purple-600 text-stone-950 py-1 px-2.5 rounded transition cursor-pointer hover:bg-purple-500 font-bold"
                    >
                      {socialReelShareConfig.lastCopiedPlatform === 'youtubeShorts' ? 'Kopiert!' : (lang === 'de' ? 'YouTube Text kopieren' : 'Copy YouTube text')}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-relaxed font-semibold italic bg-stone-900 p-2.5 rounded-lg border border-stone-850 break-all">
                    "{youtubeText}"
                  </p>
                </div>

                {/* Facebook */}
                <div className="bg-stone-950 border border-stone-850 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-1.5">
                      <LucideIcons.Facebook size={13} />
                      Facebook Post
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPlatformText('facebook', facebookText)}
                      className="text-[9px] font-black uppercase bg-purple-600 text-stone-950 py-1 px-2.5 rounded transition cursor-pointer hover:bg-purple-500 font-bold"
                    >
                      {socialReelShareConfig.lastCopiedPlatform === 'facebook' ? 'Kopiert!' : (lang === 'de' ? 'Facebook Text kopieren' : 'Copy Facebook text')}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-relaxed font-semibold italic bg-stone-900 p-2.5 rounded-lg border border-stone-850">
                    "{facebookText}"
                  </p>
                </div>

                {/* LinkedIn */}
                <div className="bg-stone-950 border border-stone-850 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-sky-400 flex items-center gap-1.5">
                      <LucideIcons.Linkedin size={13} />
                      LinkedIn Post
                    </span>
                    <button
                      type="button"
                      onClick={() => copyPlatformText('linkedin', linkedinText)}
                      className="text-[9px] font-black uppercase bg-purple-600 text-stone-950 py-1 px-2.5 rounded transition cursor-pointer hover:bg-purple-500 font-bold"
                    >
                      {socialReelShareConfig.lastCopiedPlatform === 'linkedin' ? 'Kopiert!' : (lang === 'de' ? 'LinkedIn Text kopieren' : 'Copy LinkedIn text')}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-relaxed font-semibold italic bg-stone-900 p-2.5 rounded-lg border border-stone-850">
                    "{linkedinText}"
                  </p>
                </div>
              </div>

              {/* Reel Export Notice future coming later */}
              <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl space-y-2 opacity-75">
                <div className="flex items-center gap-2">
                  <LucideIcons.Lock size={14} className="text-stone-500" />
                  <span className="text-[11px] font-black uppercase text-stone-400">
                    {lang === 'de' ? 'Reel-Video exportieren – kommt später' : 'Export reel video – coming later'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                  {lang === 'de'
                    ? 'Der spätere MP4-Export erzeugt ein Video, in dem Buttons sichtbar sind. Klickbar sind sie auf der interaktiven Karte über deinen Link.'
                    : 'The future MP4 export will create a video where buttons are visible. They are clickable on the interactive card through your link.'}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-900">
                <button
                  type="button"
                  onClick={() => setSubView('menu')}
                  className="w-full bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-xs font-black py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LucideIcons.ArrowLeft size={14} />
                  <span>{lang === 'de' ? 'Zurück zum Teilen-Menü' : 'Back to share menu'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* SubView: PWA / Save as App Instructions */
            <div className="space-y-5 flex flex-col">
              
              <div className="w-full flex items-center justify-between border-b border-stone-900 pb-3">
                <button
                  type="button"
                  onClick={() => setSubView('menu')}
                  className="flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <LucideIcons.ArrowLeft size={14} />
                  <span>{lang === 'de' ? 'Teilen-Menü' : 'Share Menu'}</span>
                </button>
                <span className="text-[11px] font-extrabold uppercase text-[#A855F7] tracking-widest">
                  {lang === 'de' ? 'ureel speichern' : 'Save ureel'}
                </span>
                <div className="w-14" />
              </div>

              <div className="bg-stone-950 border border-stone-850 p-4.5 rounded-3xl w-full text-center shadow-inner space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center mx-auto text-[#A855F7] shadow-lg">
                  <LucideIcons.PlusSquare size={20} />
                </div>
                <div className="space-y-2 w-full text-center">
                  <h3 className="text-xs font-black text-white">
                    {lang === 'de' ? 'ureel speichern' : 'Save ureel'}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium leading-relaxed max-w-xs mx-auto">
                    {lang === 'de' 
                      ? 'Du kannst diese ureel-Seite auf deinem Gerät speichern und später direkt über das Icon öffnen.' 
                      : 'You can save this ureel page to your device and open it later directly from the icon.'}
                  </p>
                  
                  {/* Visueller Link als Fallback */}
                  <div className="pt-2">
                    <span className="text-[9px] font-extrabold text-[#A855F7] uppercase tracking-widest block mb-1">
                      {lang === 'de' ? 'Deine öffentliche Adresse:' : 'Your public link:'}
                    </span>
                    <div className="px-2 py-1 bg-stone-900 rounded-lg text-[10px] text-stone-300 font-mono select-all break-all border border-stone-850 inline-block max-w-full">
                      {publicUrl}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Stack is safe for mobile and desktop */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    showToast(lang === 'de' ? 'ureel-Link kopiert' : 'ureel link copied');
                  }}
                  className="flex-1 min-w-[100px] bg-stone-950 hover:bg-stone-900 border border-purple-500/20 hover:border-purple-500/45 text-[#F5EFE3] text-[11px] font-extrabold py-3 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  <LucideIcons.Copy size={13} className="text-[#A855F7]" />
                  <span>{lang === 'de' ? 'Link kopieren' : 'Copy link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className={`flex-1 min-w-[100px] ${showInstructions ? 'bg-purple-600 text-stone-950' : 'bg-stone-950 text-[#F5EFE3] border border-stone-800 hover:border-purple-500/30'} text-[11px] font-extrabold py-3 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none`}
                >
                  <LucideIcons.BookOpen size={13} className={showInstructions ? 'text-stone-950' : 'text-[#A855F7]'} />
                  <span>{showInstructions ? (lang === 'de' ? 'Anleitung ausblenden' : 'Hide instructions') : (lang === 'de' ? 'Anleitung anzeigen' : 'Show instructions')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubView('menu')}
                  className="flex-1 min-w-[100px] bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 text-[11px] font-extrabold py-3 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                >
                  <LucideIcons.X size={13} className="text-stone-400" />
                  <span>{lang === 'de' ? 'Schließen' : 'Close'}</span>
                </button>
              </div>

              {/* Instructions List per device */}
              {showInstructions && (
                <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1 animate-fade-in">
                  
                  {/* Info Indicator */}
                  <div className="text-[10px] text-stone-500 font-mono text-center select-none bg-stone-950/20 py-1.5 rounded-lg border border-stone-850/35">
                    {lang === 'de' ? 'Wähle die passende Anleitung für dein Gerät:' : 'Choose the guide matching your device:'}
                  </div>

                  {/* iOS Safari */}
                  <div className={`p-3.5 rounded-2xl space-y-1.5 shadow-sm transition-all duration-300 ${
                    typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
                      ? 'bg-[#A855F7]/5 border-2 border-[#A855F7]/45'
                      : 'bg-stone-900/40 border border-stone-850'
                  }`}>
                    <div className="flex items-center gap-2 text-[#A855F7]">
                      <LucideIcons.Smartphone size={13} />
                      <span className="text-[10px] font-black uppercase tracking-wider">iPhone / Safari</span>
                      {typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) && (
                        <span className="text-[8px] font-extrabold bg-purple-600 text-stone-950 px-1.5 py-0.5 rounded uppercase tracking-wide ml-auto">Dein Gerät</span>
                      )}
                    </div>
                    <ol className="text-[11px] text-stone-300 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed font-semibold">
                      <li>{lang === 'de' ? 'Teile-Symbol am unteren Bildschirmrand antippen.' : 'Tap Share button (bottom of screen).'}</li>
                      <li>{lang === 'de' ? 'Nach unten scrollen und „Zum Home-Bildschirm“ wählen.' : 'Scroll down and select "Add to Home Screen".'}</li>
                      <li>{lang === 'de' ? 'Oben rechts auf „Hinzufügen“ tippen.' : 'Tap "Add" in the top right corner.'}</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className={`p-3.5 rounded-2xl space-y-1.5 shadow-sm transition-all duration-300 ${
                    typeof window !== 'undefined' && /android/.test(window.navigator.userAgent.toLowerCase())
                      ? 'bg-[#A855F7]/5 border-2 border-[#A855F7]/45'
                      : 'bg-stone-900/40 border border-stone-850'
                  }`}>
                    <div className="flex items-center gap-2 text-[#A855F7]">
                      <LucideIcons.LayoutGrid size={13} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Android / Chrome</span>
                      {typeof window !== 'undefined' && /android/.test(window.navigator.userAgent.toLowerCase()) && (
                        <span className="text-[8px] font-extrabold bg-purple-600 text-stone-950 px-1.5 py-0.5 rounded uppercase tracking-wide ml-auto">Dein Gerät</span>
                      )}
                    </div>
                    <ol className="text-[11px] text-stone-300 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed font-semibold">
                      <li>{lang === 'de' ? 'Browser-Menü (3 Punkte oben rechts) öffnen.' : 'Open Chrome menu (three dots top right).'}</li>
                      <li>{lang === 'de' ? '„App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen.' : 'Select "Install app" or "Add to Home Screen".'}</li>
                      <li>{lang === 'de' ? 'Die Installation bestätigen.' : 'Confirm addition when prompted.'}</li>
                    </ol>
                  </div>

                  {/* Desktop Chrome / Edge */}
                  <div className={`p-3.5 rounded-2xl space-y-1.5 shadow-sm transition-all duration-300 ${
                    typeof window !== 'undefined' && !/iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase())
                      ? 'bg-[#A855F7]/5 border border-[#A855F7]/35'
                      : 'bg-stone-900/40 border border-stone-850'
                  }`}>
                    <div className="flex items-center gap-2 text-[#A855F7]">
                      <LucideIcons.Monitor size={13} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Desktop / Chrome / Edge</span>
                      {typeof window !== 'undefined' && !/iphone|ipad|ipod|android/.test(window.navigator.userAgent.toLowerCase()) && (
                        <span className="text-[8px] font-extrabold bg-purple-600 text-stone-950 px-1.5 py-0.5 rounded uppercase tracking-wide ml-auto">Dein Gerät</span>
                      )}
                    </div>
                    <ol className="text-[11px] text-stone-300 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed font-semibold">
                      <li>{lang === 'de' ? 'Browser-Menü öffnen (oder das Installations-Symbol rechts in der Adressleiste).' : 'Open menu (or the install icon in the address bar).'}</li>
                      <li>{lang === 'de' ? '„App installieren...“ oder „Verknüpfung erstellen...“ wählen.' : 'Select "Install app..." or "Create shortcut...".'}</li>
                      <li>{lang === 'de' ? 'Hinzufügen bestätigen.' : 'Confirm setup.'}</li>
                    </ol>
                  </div>

                  {/* Desktop Safari */}
                  <div className="bg-stone-900/40 border border-stone-850 p-3.5 rounded-2xl space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-2 text-[#A855F7]">
                      <LucideIcons.Compass size={13} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Desktop / Safari</span>
                    </div>
                    <ol className="text-[11px] text-stone-300 space-y-1 list-decimal list-inside pl-0.5 leading-relaxed font-semibold">
                      <li>{lang === 'de' ? 'Teilen-Symbol oben rechts oder das „Ablage“-Menü öffnen.' : 'Click share icon top right or choose "File" menu.'}</li>
                      <li>{lang === 'de' ? '„Zum Dock hinzufügen“ wählen.' : 'Choose "Add to Dock".'}</li>
                    </ol>
                  </div>

                  {/* Fallback info */}
                  <div className="text-[10px] text-stone-500 font-semibold p-2 bg-stone-950/20 text-center leading-relaxed rounded-xl">
                    {lang === 'de' 
                      ? 'Falls dein Browser keine App-Installation anbietet, kopiere den Link und speichere ihn als Lesezeichen.' 
                      : 'If your browser does not offer app installation, copy the link and save it as a bookmark.'}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          HIDDEN CANVAS EXPORT TEMPLATES (Absolute layout, positioned off-screen)
         ========================================================================= */}
      <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none select-none z-0">
        
        {/* TEMPLATE A: OPEN GRAPH (1200 x 630 px) */}
        <div 
          ref={previewRefOG}
          style={{ width: '1200px', height: '630px', background: '#111111' }}
          className="relative flex flex-row p-12 bg-neutral-950 text-white font-sans overflow-hidden border border-amber-900/10"
        >
          {/* Dot Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A855F7 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
          
          <div className="w-7/12 flex flex-col justify-between h-full z-10 pr-6 relative">
            <div className="space-y-4">
              {/* Branding Header */}
              {!isHidden ? (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-lg font-black tracking-widest border border-purple-500/30 px-2 py-0.5 rounded-md">ureel</span>
                  <span className="text-[10px] uppercase font-bold text-stone-450 tracking-widest">Digital-Vibe Profile</span>
                </div>
              ) : (
                <div className="h-6" />
              )}
              
              {/* Title Content */}
              <div className="space-y-2 pt-4">
                <h2 className="text-4xl font-extrabold text-[#F5EFE3] font-sans leading-tight tracking-tight">
                  {card.title || 'Mein LiveCard Profil'}
                </h2>
                {card.subtitle && (
                  <p className="text-xl text-[#A855F7] font-medium font-sans">
                    {card.subtitle}
                  </p>
                )}
                {card.description && (
                  <p className="text-[13px] text-stone-400 font-sans line-clamp-3 leading-relaxed pt-1.5 max-w-md">
                    {card.description}
                  </p>
                )}
              </div>
            </div>

            {/* Slogan & Web Link footer */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-stone-500 font-mono tracking-wide">{publicUrl}</span>
              {!isHidden && (
                <p className="text-xs uppercase tracking-widest text-[#A855F7] font-extrabold">
                  {lang === 'de' ? 'Aus Video wird Aktion.' : 'Your World. One Link.'}
                </p>
              )}
            </div>
          </div>

          <div className="w-5/12 flex flex-col items-center justify-between h-full z-10 pl-6 border-l border-stone-850/60">
            {/* Visual Profile Cover Or Logo */}
            <div className="flex flex-col items-center justify-center flex-grow space-y-4">
              {card.profileImageUrl ? (
                <div className="w-28 h-28 rounded-full border-2 border-[#A855F7] overflow-hidden shadow-lg bg-stone-900">
                  <img src={card.profileImageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border border-stone-800 bg-stone-900 flex items-center justify-center text-[#A855F7] shadow-inner">
                  <LucideIcons.User size={40} />
                </div>
              )}

              {/* QR Image embedded in card */}
              {qrCodeUrl && (
                <div className="p-1.5 bg-[#F5EFE3] rounded-xl shadow-md">
                  <img src={qrCodeUrl} alt="" className="w-[110px] h-[110px] object-contain rounded" />
                </div>
              )}
            </div>

            {!isHidden ? (
              <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold">
                {isFree ? 'Erstellt mit ureel (ureel.me)' : 'ureel.me'}
              </p>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </div>

        {/* TEMPLATE B: SQUARE (1080 x 1080 px) */}
        <div 
          ref={previewRefSquare}
          style={{ width: '1080px', height: '1080px', background: '#111111' }}
          className="relative flex flex-col justify-between p-16 bg-neutral-950 text-white font-sans overflow-hidden"
        >
          {/* Dot Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A855F7 2px, transparent 2px)', backgroundSize: '36px 36px' }} />
          
          {/* Brand Top Header */}
          <div className="flex items-center justify-between z-10">
            {!isHidden ? (
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-2xl font-black tracking-widest border border-purple-500/30 px-3 py-1 rounded-md">ureel</span>
                <span className="text-xs uppercase font-extrabold text-[#A855F7] tracking-widest">
                  {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
                </span>
              </div>
            ) : (
              <div className="h-8" />
            )}
            <span className="text-xs text-stone-500 uppercase tracking-widest font-black">QR-Profilkarte</span>
          </div>

          {/* Central Bento Box profile area */}
          <div className="bg-stone-900/60 border border-stone-850 p-10 rounded-3xl z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto shadow-2xl relative w-full">
            {/* Visual circle preview */}
            {card.profileImageUrl ? (
              <div className="w-36 h-36 rounded-full border-4 border-[#A855F7] overflow-hidden shadow-2xl bg-stone-900">
                <img src={card.profileImageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full border border-stone-800 bg-stone-900 flex items-center justify-center text-[#A855F7]">
                <LucideIcons.User size={45} />
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-[#F5EFE3] tracking-tight">{card.title}</h1>
              {card.subtitle && (
                <p className="text-lg text-[#A855F7] font-bold uppercase tracking-wider">{card.subtitle}</p>
              )}
              {card.description && (
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-3 px-4">{card.description}</p>
              )}
            </div>

            {/* Show dynamic mini actions list */}
            {activeButtonsToShow.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5 w-full pt-2">
                {activeButtonsToShow.map((b) => (
                  <span key={b.id} className="bg-stone-950 border border-stone-800 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#A855F7] rounded-full shrink-0" />
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer QR info area */}
          <div className="flex flex-row items-center justify-between border-t border-stone-850/60 pt-6 z-10">
            <div className="space-y-1">
              <span className="text-[11px] text-stone-500 uppercase tracking-widest font-extrabold">Öffentlicher Link</span>
              <p className="text-base text-[#F5EFE3] font-mono leading-none select-all">{publicUrl}</p>
              {!isHidden && (
                <p className="text-[11px] font-bold text-[#A855F7] tracking-wider uppercase mt-1">
                  {isFree ? 'Erstellt mit ureel · ureel.me' : 'ureel.me'}
                </p>
              )}
            </div>

            {qrCodeUrl && (
              <div className="p-2 bg-[#F5EFE3] rounded-2xl shadow-xl flex items-center gap-1.5 border border-white/5">
                <img src={qrCodeUrl} alt="" className="w-24 h-24 object-contain rounded" />
              </div>
            )}
          </div>
        </div>

        {/* TEMPLATE C: STORY (1080 x 1920 px) */}
        <div 
          ref={previewRefStory}
          style={{ width: '1080px', height: '1920px', background: '#111111' }}
          className="relative flex flex-col justify-between p-24 bg-neutral-950 text-white font-sans overflow-hidden"
        >
          {/* Dot Grid Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A855F7 2.5px, transparent 2.5px)', backgroundSize: '40px 40px' }} />
          
          {/* Gold Glowing ambient accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#A855F7]/5 blur-[120px] pointer-events-none" />

          {/* Brand top logo */}
          {!isHidden ? (
            <div className="flex flex-col items-center justify-center space-y-2 z-10 mt-6">
              <span className="text-purple-400 text-4xl font-black tracking-widest border border-purple-500/45 px-5 py-1.5 rounded-xl">ureel</span>
              <span className="text-xs uppercase font-extrabold text-[#A855F7] tracking-widest">
                {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
              </span>
            </div>
          ) : (
            <div className="h-16" />
          )}

          {/* Massive card block */}
          <div className="w-full flex flex-col items-center space-y-8 z-10 my-12 bg-stone-900/50 border border-stone-850 rounded-[45px] p-12 shadow-2xl">
            {/* Visual circle image */}
            {card.profileImageUrl ? (
              <div className="w-44 h-44 rounded-full border-4 border-[#A855F7] overflow-hidden shadow-2xl bg-stone-900">
                <img src={card.profileImageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full border border-stone-800 bg-stone-900 flex items-center justify-center text-[#A855F7]">
                <LucideIcons.User size={55} />
              </div>
            )}

            <div className="text-center space-y-3 max-w-md">
              <h1 className="text-4xl font-extrabold text-[#F5EFE3] tracking-tight">{card.title}</h1>
              {card.subtitle && (
                <p className="text-lg text-[#A855F7] font-bold uppercase tracking-widest">{card.subtitle}</p>
              )}
              {card.description && (
                <p className="text-sm text-stone-400 leading-relaxed leading-relaxed">{card.description}</p>
              )}
            </div>

            {/* Mini visual mockup of buttons (up to 5 buttons as neat stacked block links) */}
            {activeButtonsToShow.length > 0 && (
              <div className="w-full max-w-sm space-y-3 pt-4 border-t border-stone-850/60">
                {activeButtonsToShow.map((b) => (
                  <div key={b.id} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl py-3.5 px-5 text-stone-300 font-bold text-center text-xs uppercase tracking-wider flex items-center justify-between">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
                    <span className="text-stone-250 truncate block max-w-[200px] mx-auto">{b.title}</span>
                    <LucideIcons.ChevronRight size={14} className="text-stone-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer QR scan directions */}
          <div className="flex flex-col items-center justify-center z-10 mb-8 space-y-4">
            {qrCodeUrl && (
              <div className="p-4 bg-[#F5EFE3] rounded-3xl shadow-2xl border border-white/5 inline-block">
                <img src={qrCodeUrl} alt="" className="w-32 h-32 object-contain rounded-lg" />
              </div>
            )}
            
            <div className="text-center space-y-1">
              <span className="text-[10px] text-[#A855F7] font-extrabold uppercase tracking-widest">Scanne den QR-Code zum Verbinden</span>
              <p className="text-[13px] text-stone-550 font-mono select-all font-semibold">{publicUrl}</p>
              {!isHidden && (
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-2">
                  {isFree ? 'Erstellt mit ureel · ureel.me' : 'ureel.me'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TEMPLATE D: PROMO (1080 x 1350 px) */}
        <div 
          ref={previewRefPromo}
          style={{ width: '1080px', height: '1350px', background: '#0D0D0D' }}
          className="relative flex flex-col justify-between p-16 bg-neutral-950 text-white font-sans overflow-hidden border border-amber-900/10"
        >
          {/* Grids and glowing visual ornaments */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A855F7 2.5px, transparent 2.5px)', backgroundSize: '45px 45px' }} />
          <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#A855F7]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-[#A855F7]/8 blur-[100px] pointer-events-none" />

          {/* Header Branding */}
          <div className="flex items-center justify-between z-10 w-full mb-6 border-b border-stone-850/40 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-purple-400 text-3xl font-black tracking-widest border border-purple-500/45 px-4.5 py-1 rounded-xl">ureel</span>
              <span className="text-xs uppercase font-extrabold text-[#A855F7] tracking-widest">
                {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
              </span>
            </div>
            <span className="text-xs text-stone-500 uppercase tracking-widest font-black">{lang === 'de' ? 'DIGITALE PRÄSENZ' : 'DIGITAL PRESENCE'}</span>
          </div>

          {/* Core split section */}
          <div className="flex flex-row items-center justify-between flex-1 z-10 gap-12 my-4">
            
            {/* Left Content Column (Marketing) */}
            <div className="w-[520px] flex flex-col justify-between h-full py-6 pr-4">
              <div className="space-y-8">
                {/* Headline */}
                <div className="space-y-4">
                  <span className="text-xs font-black uppercase text-[#A855F7] tracking-widest block font-mono">
                    {lang === 'de' ? 'EINFACH & MODERN' : 'SIMPLE & MODERN'}
                  </span>
                  <h1 className="text-5xl font-black text-[#F5EFE3] font-sans leading-tight tracking-tight">
                    {lang === 'de' ? 'Deine digitale Präsenz in einem Link.' : 'Your digital presence in one link.'}
                  </h1>
                </div>

                {/* Slogan details bullet items */}
                <div className="space-y-5">
                  {[
                    lang === 'de' ? 'Visitenkarte' : 'Business card',
                    lang === 'de' ? 'Mini-Webseite' : 'Mini website',
                    lang === 'de' ? 'In Kontakten speichern' : 'Save contact',
                    lang === 'de' ? 'QR-Code' : 'QR code',
                    lang === 'de' ? 'Teilen' : 'Share'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3.5">
                      <div className="w-6 h-6 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/35 flex items-center justify-center">
                        <LucideIcons.Check size={12} className="text-[#A855F7]" />
                      </div>
                      <span className="text-base text-stone-200 font-bold tracking-wide">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to action & branding block */}
              <div className="space-y-6 pt-8 border-t border-stone-850/30">
                <div className="flex items-center gap-3 bg-stone-900/40 border border-stone-850/60 py-3.5 px-6 rounded-2xl w-fit">
                  <span className="text-xs font-black uppercase text-[#A855F7] tracking-widest">
                    {lang === 'de' ? 'Jetzt ansehen' : 'View now'}
                  </span>
                  <LucideIcons.ArrowRight size={14} className="text-purple-400" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs text-stone-500 font-mono tracking-wide select-all block">
                    {publicUrl}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card Mockup Column */}
            <div className="w-[440px] flex flex-col items-center justify-center h-full">
              {/* Device Frame */}
              <div 
                style={{ background: 'linear-gradient(135deg, #1C1C1C 0%, #0D0D0D 100%)' }}
                className="w-[390px] h-[720px] rounded-[50px] border-[6px] border-stone-800 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
              >
                {/* Glowing inner shadow ambient lamp */}
                <div className="absolute top-[10px] left-[10px] right-[10px] h-[220px] rounded-[38px] bg-[#A855F7]/10 blur-[40px] pointer-events-none" />

                {/* Simulated Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-stone-800 rounded-full z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-stone-900 rounded-full" />
                </div>

                <div className="flex flex-col items-center flex-grow pt-8 pb-4 relative z-10">
                  {/* Avatar Profile */}
                  {card.profileImageUrl ? (
                    <div className="w-28 h-28 rounded-full border-4 border-[#A855F7] overflow-hidden shadow-xl bg-stone-900 mb-4">
                      <img src={card.profileImageUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full border border-stone-700 bg-stone-900 flex items-center justify-center text-[#A855F7] mb-4">
                      <LucideIcons.User size={45} />
                    </div>
                  )}

                  {/* Profile info values */}
                  <div className="text-center space-y-1 max-w-[300px] mb-6 font-sans">
                    <h2 className="text-xl font-bold text-[#F5EFE3] truncate">{card.title}</h2>
                    {card.subtitle && (
                      <p className="text-[11px] font-mono tracking-wider font-extrabold uppercase text-[#A855F7] truncate">{card.subtitle}</p>
                    )}
                  </div>

                  {/* Visual mockup of the buttons (up to 4 item columns) */}
                  <div className="w-full space-y-2.5 px-2 flex-grow overflow-hidden font-sans">
                    {activeButtonsToShow.slice(0, 4).map((b) => (
                      <div key={b.id} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-2.5 px-4 text-stone-300 font-bold text-center text-[10px] uppercase tracking-wider flex items-center justify-between">
                        <span className="w-2  h-2 rounded-full bg-[#A855F7]" />
                        <span className="text-stone-300 truncate max-w-[150px] mx-auto">{b.title}</span>
                        <LucideIcons.ChevronRight size={12} className="text-stone-600" />
                      </div>
                    ))}
                    {activeButtonsToShow.length === 0 && (
                      <div className="w-full py-16 text-center text-stone-500 font-mono text-[10px] italic">
                        {lang === 'de' ? 'Keine Buttons aktiv' : 'No active buttons'}
                      </div>
                    )}
                  </div>

                  {/* Minimal QR Code on mockup screen bottom */}
                  {qrCodeUrl && (
                    <div className="mt-4 p-2 bg-[#F5EFE3] rounded-2xl shadow-md border border-stone-800">
                      <img src={qrCodeUrl} alt="" className="w-16 h-16 object-contain rounded" />
                    </div>
                  )}
                </div>

                {/* Navigation mockup bottom bar */}
                <div className="w-28 h-1 bg-stone-800 rounded-full mx-auto mb-1 relative z-10" />
              </div>
            </div>

          </div>

          {/* Footer Attribution Row */}
          <div className="flex items-center justify-between border-t border-stone-850/40 pt-4 z-15 select-none text-[11px] font-bold text-stone-500 tracking-wider">
            <span>ureel.me</span>
            {!isHidden && (
              <span>{isFree ? 'Erstellt mit ureel (ureel.me)' : 'ureel.me'}</span>
            )}
          </div>
        </div>

      </div>
      {showUpgradeModalShare && (
        <UpgradeModal
          isOpen={showUpgradeModalShare}
          onClose={() => setShowUpgradeModalShare(false)}
          lang={lang}
          featureKey={upgradeFeatureKeyShare || 'advancedQrExport'}
        />
      )}
    </div>
  );
}
