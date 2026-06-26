/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton, getPublicCardUrl, Lead } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { ProfileHeroSection } from './ProfileHeroSection';
import { KonuCardCore } from './KonuCardCore';
import { TRANSLATIONS } from '../translations';
import { downloadVCardFile } from '../utils/vcard';
import { db } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { downloadVCardFileFromCard } from '../utils/vcard-wrapper';
import { ShareExportModal } from './ShareExportModal';
import { KonuLogo } from './KonuLogo';
import { ButtonRenderer } from './ButtonRenderer';
import { UnifiedMobileLiveCardSurface } from './UnifiedMobileLiveCardSurface';
import { ErrorBoundary } from './ErrorBoundary';
import QRCode from 'qrcode';
import { parseVideoUrl } from '../utils/video';
import { executeButtonAction as runButtonAction, normalizeButtons, buildButtonActionUrl } from '../utils/buttonUtils';
import { hydrateCardMobileLayout } from '../utils/mobileLayoutPersistence';
import { getSafeLocalStorage, setSafeLocalStorage } from '../utils/safeStorage';
import { canUseFeature } from '../config/plans';
import { trackCardView, trackButtonClick } from '../utils/analytics';



const PublicRecoveryFallback: React.FC<{ card: Card; lang: 'de' | 'en'; onRetry?: () => void }> = ({ card, lang, onRetry }) => {
  const title = card.heroTitle || card.title || card.businessName || 'ureel';
  const subtitle = card.heroSubtitle || card.subtitle || '';
  const description = card.heroDescription || card.description || '';
  const buttons = normalizeButtons(card.buttons || []).filter((b: any) => b?.isVisible !== false).slice(0, 6);
  const bg = card.ureelScene?.posterUrl || card.imageUrl || card.logoUrl || '';
  return (
    <main className="fixed inset-0 h-[100svh] w-screen overflow-hidden bg-black text-[#F5F2EA] flex items-center justify-center">
      <div className="relative h-[100svh] w-screen sm:h-[min(96svh,760px)] sm:w-auto sm:aspect-[9/16] overflow-hidden bg-[#0B0B0B] sm:rounded-[36px] sm:border-[8px] sm:border-[#111]">
        {bg ? <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /> : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55" />
        <div className="absolute left-[8%] right-[8%] top-[24%] rounded-[28px] border border-white/20 bg-black/55 p-5 text-center backdrop-blur-md">
          <div className="text-[26px] leading-[0.95] font-black uppercase tracking-tight whitespace-pre-line">{title}</div>
          {subtitle ? <div className="mt-3 text-[18px] leading-tight font-extrabold uppercase tracking-wider">{subtitle}</div> : null}
          {description ? <div className="mt-3 text-[14px] leading-snug font-bold text-white/90">{description}</div> : null}
        </div>
        <div className="absolute left-[7%] right-[7%] bottom-[7%] grid grid-cols-3 gap-3">
          {buttons.map((b: any) => (
            <button key={b.id || b.label} type="button" className="aspect-square rounded-[18px] border border-white/25 bg-[#2F6074]/75 text-white shadow-lg backdrop-blur-sm flex flex-col items-center justify-center px-2 text-center">
              <span className="text-[12px] font-black leading-tight break-words">{b.label || b.text || b.title || 'Button'}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={onRetry || (() => window.location.reload())} className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/55 px-4 py-2 text-[11px] font-black uppercase tracking-wider">
          {lang === 'de' ? 'Neu laden' : 'Reload'}
        </button>
      </div>
    </main>
  );
};

interface PublicCardViewProps {
  card: Card;
  lang: 'de' | 'en';
  setLang: (l: 'de' | 'en') => void;
  onBackToDashboard?: () => void;
  isPreview?: boolean;
}

export const PublicCardView: React.FC<PublicCardViewProps> = ({
  card,
  lang,
  setLang,
  onBackToDashboard,
  isPreview = false
}) => {
  const { user, submitAbuseReport, logAnalyticsEvent } = useFirebase();
  const t = TRANSLATIONS[lang];

  const cardPlan = card.plan || 'starter';
  const hasBrandingHiddenFeature = canUseFeature(cardPlan, 'brandingHidden');
  const isHidden = hasBrandingHiddenFeature && card.brandingHidden === true;

  // UI state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportMessage, setReportMessage] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [externalLinkToOpen, setExternalLinkToOpen] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Password protect modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activePasswordButton, setActivePasswordButton] = useState<CardButton | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [unlockedButtonSecrets, setUnlockedButtonSecrets] = useState<Record<string, {
    actionType: string;
    actionValue: string;
    uploadedFile?: any;
    downloadItems?: any[];
  }>>({});

  // Gallery state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedGalleryButton, setSelectedGalleryButton] = useState<CardButton | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Availability state
  const [activeAvailabilityButton, setActiveAvailabilityButton] = useState<CardButton | null>(null);

  // Download Area overlay state
  const [activeDownloadAreaButton, setActiveDownloadAreaButton] = useState<CardButton | null>(null);
  const [downloadAreaCheckbox, setDownloadAreaCheckbox] = useState(false);
  const [downloadAreaError, setDownloadAreaError] = useState(false);

  // Log views
  // Cookie State Managers
  const [cookieConsent, setCookieConsent] = useState<{
    necessary: boolean;
    statistics: boolean;
    marketing: boolean;
  } | null>(null);
  const [showCookieDetails, setShowCookieDetails] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Form Config modals (Prompt 6B PRO features)
  const [activeFormButton, setActiveFormButton] = useState<CardButton | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formPreferredTime, setFormPreferredTime] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = getSafeLocalStorage('livecard_cookie_consent');
    if (saved) {
      try {
        setCookieConsent(JSON.parse(saved));
      } catch (e) {
        // Fallback fallback
      }
    }
  }, []);

  // Log views
  useEffect(() => {
    if (!isPreview) {
      const consentStr = getSafeLocalStorage('livecard_cookie_consent');
      let allowStats = true;
      if (consentStr) {
        try {
          const parsed = JSON.parse(consentStr);
          allowStats = !!parsed.statistics;
        } catch (e) {
          allowStats = true;
        }
      }
      if (allowStats) {
        logAnalyticsEvent(card.cardId, undefined, 'view');
        trackCardView(card.cardId);
      }
    }
  }, [card.cardId, isPreview]);

  // v52.5.42: Public/share links must render from the same hydrated card shape
  // as the editor preview. This prevents stale publicLayoutSnapshot values or
  // legacy raw Firestore documents from producing a different button/text layout
  // when the user opens the copied share link in a fresh tab.
  const hydratedPublicCard = React.useMemo(() => hydrateCardMobileLayout(card) as Card, [card]);

  // Generate QR Code representation
  useEffect(() => {
    const cardUrl = getPublicCardUrl(card.slug);
    QRCode.toDataURL(cardUrl, { width: 300, margin: 1, color: { dark: '#1E1E1E', light: '#F5F0E6' } })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [card.slug]);

  // Translate specific icons to Lucide dynamic components
  const renderIcon = (iconId: string, color: string, size = 24) => {
    const IconComponent = (LucideIcons as any)[iconId];
    if (IconComponent) {
      return <IconComponent size={size} style={{ color }} />;
    }
    return <LucideIcons.Globe size={size} style={{ color }} />;
  };

  const handleButtonClick = (btn: CardButton) => {
    if (isPreview) return; // Disallow interactions in dashboard editor mode

    if (btn.actionType === 'none' || !btn.actionType) {
      showToast(lang === 'de' 
        ? 'Für diesen Button wurde noch keine Funktion hinterlegt.' 
        : 'No action has been set for this button yet.');
      return;
    }

    // Log engagement with statistics cookie consent check
    const consentStr = getSafeLocalStorage('livecard_cookie_consent');
    let allowStats = true;
    if (consentStr) {
      try {
        const parsed = JSON.parse(consentStr);
        allowStats = !!parsed.statistics;
      } catch (e) {
        allowStats = true;
      }
    }
    if (allowStats) {
      logAnalyticsEvent(card.cardId, btn.id, 'click');
      trackButtonClick(card.cardId, btn.id);
    }

    // Password verification gate
    const isProtected = !!btn.isProtected || !!btn.passwordProtected;
    if (isProtected) {
      const secret = unlockedButtonSecrets[btn.id];
      if (secret) {
        executeButtonAction({
          ...btn,
          actionType: secret.actionType,
          actionValue: secret.actionValue,
          uploadedFile: secret.uploadedFile,
          downloadItems: secret.downloadItems
        });
        return;
      }

      setActivePasswordButton(btn);
      setEnteredPassword('');
      setPasswordError('');
      setShowPasswordModal(true);
      return;
    }

    executeButtonAction(btn);
  };

  const executeButtonAction = (btn: CardButton) => {
    // 6. FEHLENDE LINKS
    const isLinkAction = [
      'website', 'external_url', 'custom_url',
      'external_file_link', 'dropbox_file', 'dropbox_folder',
      'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder',
      'pdf_link', 'pdf_upload', 'file', 'video_link'
    ].includes(btn.actionType);

    if (isLinkAction && !(btn.actionValue || '').trim()) {
      showToast(lang === 'de'
        ? 'Für diesen Button wurde noch kein Link hinterlegt.'
        : 'No link has been set for this button yet.');
      return;
    }

    if (btn.actionType === 'availability' || btn.actionType === 'calendar_availability') {
      setActiveAvailabilityButton(btn);
      return;
    }

    if (['contact_form', 'inquiry_form', 'callback_request'].includes(btn.actionType)) {
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormTopic('');
      setFormMessage('');
      setFormPreferredTime('');
      setFormErrors({});
      setActiveFormButton(btn);
      return;
    }

    if (btn.actionType === 'download_area') {
      setActiveDownloadAreaButton(btn);
      setDownloadAreaCheckbox(false);
      setDownloadAreaError(false);
      return;
    }

    if (btn.actionType === 'maps' || btn.actionType === 'location') {
      const val = (btn.actionValue || '').trim();
      if (!val) {
        showToast(lang === 'de'
          ? 'Für diesen Standort wurde noch keine Adresse hinterlegt.'
          : 'No address has been set for this location yet.');
        return;
      }
      if (val.startsWith('http://') || val.startsWith('https://')) {
        window.open(val, '_blank', 'noopener,noreferrer');
      } else {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`;
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // 7. EXTERNAL WARNING MODAL (OPTIONAL)
    if ([
      'external_file_link', 'dropbox_file', 'dropbox_folder',
      'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder'
    ].includes(btn.actionType)) {
      const targetUrl = buildButtonActionUrl(btn, card);
      if (targetUrl && targetUrl !== '#') {
        setExternalLinkToOpen(targetUrl);
        return;
      }
    }

    runButtonAction(btn, card, {
      onOpenGallery: (b) => {
        showToast(lang === 'de' ? 'Diese Galerie-Funktion ist nicht mehr aktiv.' : 'This gallery feature is no longer active.');
      }
    });
  };

  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVerifyPassword = async () => {
    if (!activePasswordButton) return;
    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buttonId: activePasswordButton.id,
          password: enteredPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the unlocked button secrets in component memory state so successive taps in this view session work cleanly
        setUnlockedButtonSecrets(prev => ({
          ...prev,
          [activePasswordButton.id]: {
            actionType: data.actionType,
            actionValue: data.actionValue,
            uploadedFile: data.uploadedFile || undefined,
            downloadItems: data.downloadItems || undefined
          }
        }));

        setShowPasswordModal(false);
        setEnteredPassword('');
        
        // Execute the button action with the true targets obtained safely from the server
        executeButtonAction({
          ...activePasswordButton,
          actionType: data.actionType,
          actionValue: data.actionValue,
          uploadedFile: data.uploadedFile || undefined,
          downloadItems: data.downloadItems || undefined
        });
        setActivePasswordButton(null);
      } else {
        setPasswordError(lang === 'de' ? 'Das Passwort ist nicht korrekt.' : 'The password is not correct.');
      }
    } catch (err: any) {
      console.error("Verification failed:", err);
      setPasswordError(lang === 'de' ? 'Das Passwort ist nicht korrekt.' : 'The password is not correct.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSubmitVisitorForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormButton) return;

    const errors: Record<string, string> = {};
    const actType = activeFormButton.actionType;

    if (actType === 'contact_form') {
      if (!formName.trim()) {
        errors.name = TRANSLATIONS[lang].err_name_required;
      }
      if (!formEmail.trim()) {
        errors.email = TRANSLATIONS[lang].err_email_required;
      } else if (!formEmail.includes('@')) {
        errors.email = TRANSLATIONS[lang].err_email_invalid;
      }
      if (!formMessage.trim()) {
        errors.message = TRANSLATIONS[lang].err_message_required;
      }
    } else if (actType === 'inquiry_form') {
      if (!formName.trim()) {
        errors.name = TRANSLATIONS[lang].err_name_required;
      }
      if (!formEmail.trim()) {
        errors.email = TRANSLATIONS[lang].err_email_required;
      } else if (!formEmail.includes('@')) {
        errors.email = TRANSLATIONS[lang].err_email_invalid;
      }
      if (!formTopic.trim()) {
        errors.topic = TRANSLATIONS[lang].err_topic_required;
      }
      if (!formMessage.trim()) {
        errors.message = TRANSLATIONS[lang].err_message_required;
      }
    } else if (actType === 'callback_request') {
      if (!formName.trim()) {
        errors.name = TRANSLATIONS[lang].err_name_required;
      }
      if (!formPhone.trim()) {
        errors.phone = TRANSLATIONS[lang].err_phone_required;
      } else if (!/^[+0-9\s()-]{3,24}$/.test(formPhone.trim())) {
        errors.phone = TRANSLATIONS[lang].err_phone_invalid;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Resolve target email
    let targetEmail = '';
    const btnTarget = actType === 'callback_request'
      ? activeFormButton.callbackConfig?.targetEmail
      : activeFormButton.formConfig?.targetEmail;

    if (btnTarget && btnTarget.trim()) {
      targetEmail = btnTarget.trim();
    } else if (activeFormButton.actionValue && activeFormButton.actionValue.trim()) {
      targetEmail = activeFormButton.actionValue.trim();
    } else {
      // Fallback to card's email button
      const cardEmailBtn = card.buttons?.find(b => b.actionType === 'email' && b.actionValue);
      if (cardEmailBtn && cardEmailBtn.actionValue?.trim()) {
        targetEmail = cardEmailBtn.actionValue.trim();
      } else if (user?.email) {
        targetEmail = user.email;
      }
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      showToast(TRANSLATIONS[lang].err_no_target_email);
      return;
    }

    // Compose subject and body
    const publicUrl = getPublicCardUrl(card.slug) || window.location.href;
    let subject = '';
    let body = '';

    if (actType === 'contact_form') {
      subject = activeFormButton.formConfig?.subject || (lang === 'de' ? 'Kontakt über ureel' : 'Contact via ureel');
      if (lang === 'de') {
        body = `Neue Kontaktanfrage über ureel\n\nName: ${formName}\nE-Mail: ${formEmail}\nNachricht: ${formMessage}\n\nureel-Seite:\n${publicUrl}`;
      } else {
        body = `New contact request via ureel\n\nName: ${formName}\nEmail: ${formEmail}\nMessage: ${formMessage}\n\nureel card:\n${publicUrl}`;
      }
    } else if (actType === 'inquiry_form') {
      subject = activeFormButton.formConfig?.subject || (lang === 'de' ? 'Anfrage über ureel' : 'Inquiry via ureel');
      if (lang === 'de') {
        body = `Neue Anfrage über ureel\n\nName: ${formName}\nE-Mail: ${formEmail}\nTelefon: ${formPhone || '-'}\nWorum geht es: ${formTopic}\nNachricht: ${formMessage}\n\nureel-Seite:\n${publicUrl}`;
      } else {
        body = `New inquiry via ureel\n\nName: ${formName}\nEmail: ${formEmail}\nPhone: ${formPhone || '-'}\nWhat is it about: ${formTopic}\nMessage: ${formMessage}\n\nureel card:\n${publicUrl}`;
      }
    } else if (actType === 'callback_request') {
      subject = activeFormButton.callbackConfig?.subject || (lang === 'de' ? 'Rückrufanfrage über ureel' : 'Callback request via ureel');
      if (lang === 'de') {
        body = `Neue Rückrufanfrage über ureel\n\nName: ${formName}\nTelefonnummer: ${formPhone}\nWunschzeit: ${formPreferredTime || '-'}\nNachricht: ${formMessage || '-'}\n\nureel-Seite:\n${publicUrl}`;
      } else {
        body = `New callback request via ureel\n\nName: ${formName}\nPhone number: ${formPhone}\nPreferred time: ${formPreferredTime || '-'}\nMessage: ${formMessage || '-'}\n\nureel card:\n${publicUrl}`;
      }
    }

    // Determine if the lead should be saved to Firestore under KONU Business leads
    const isBusinessCard = (card.plan === 'business' || card.plan === 'enterprise') && !!card.companyId;
    const storeLeadEnabled = !!activeFormButton.formConfig?.storeLead || !!activeFormButton.callbackConfig?.storeLead;

    if (isBusinessCard && storeLeadEnabled && card.companyId) {
      const companyId = card.companyId;
      const leadId = doc(collection(db, 'companies', companyId, 'leads')).id;
      const leadPayload: Lead = {
        leadId,
        companyId,
        cardId: card.cardId || '',
        cardTitle: card.title || '',
        buttonId: activeFormButton.id || '',
        buttonLabel: activeFormButton.title || '',
        formType: actType === 'contact_form' ? 'contact_form' : actType === 'inquiry_form' ? 'inquiry_form' : 'callback_request',
        status: 'new',
        name: formName || '',
        email: formEmail || '',
        phone: formPhone || '',
        topic: formTopic || '',
        message: formMessage || '',
        preferredTime: formPreferredTime || '',
        sourceUrl: publicUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Non-blocking Firestore save so if a network error occurs, the user is not blocked
      setDoc(doc(db, 'companies', companyId, 'leads', leadId), leadPayload)
        .then(() => {
          showToast(lang === 'de' ? 'Ihre Anfrage wurde erfolgreich gespeichert!' : 'Your request was successfully saved!');
        })
        .catch((err) => {
          console.error("Non-blocking error saving lead item on public card form submission:", err);
        });
    }

    const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setActiveFormButton(null);
  };

  const triggerVCardDownload = () => {
    if (isPreview) return;
    downloadVCardFile(card);
    showToast(t.toast_vcardDownloaded);
  };

  const triggerCopyLink = () => {
    const targetUrl = getPublicCardUrl(card.slug);
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const triggerShareWhatsapp = () => {
    const publicUrl = getPublicCardUrl(card.slug);
    const appCreateUrl = `${window.location.origin}/signup?start=create`;
    const msg = `Hier ist meine digitale ureel-Seite: ${publicUrl}\n\nErstelle deine eigene ureel-Seite: ${appCreateUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleReportCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportEmail || !reportMessage) return;
    await submitAbuseReport(card.cardId, reportReason, reportMessage, reportEmail);
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
      setReportEmail('');
      setReportMessage('');
    }, 3000);
  };

  const handleCtaClick = () => {
    if (user) {
      window.location.href = window.location.origin;
    } else {
      window.location.href = `${window.location.origin}/signup?start=create`;
    }
  };

  // Determine elegant style options
  const bgEnabled = card.cardBackgroundEnabled !== false;
  const rootStyle: React.CSSProperties = {};
  let darkenOpacity = 0;
  let saturationFilter = '';

  if (bgEnabled) {
    if (card.cardBackgroundImageUrl) {
      rootStyle.backgroundImage = `url(${card.cardBackgroundImageUrl})`;
      const fit = card.cardBackgroundMode || 'cover';
      rootStyle.backgroundSize = fit;
      rootStyle.backgroundRepeat = 'no-repeat';
      
      const offX = card.cardBackgroundOffsetX !== undefined ? card.cardBackgroundOffsetX : 0;
      const offY = card.cardBackgroundOffsetY !== undefined ? card.cardBackgroundOffsetY : 0;
      rootStyle.backgroundPosition = `calc(50% + ${offX}px) calc(50% + ${offY}px)`;
      
      if (card.cardBackgroundSaturation !== undefined) {
        saturationFilter = `saturate(${card.cardBackgroundSaturation}%)`;
      }
      
      darkenOpacity = (card.cardBackgroundDarken !== undefined ? card.cardBackgroundDarken : 25) / 100;
    } else if (card.cardBackgroundGradientEnabled && card.cardBackgroundGradientColor) {
      const gDir = card.cardBackgroundGradientDirection || '135deg';
      rootStyle.background = `linear-gradient(${gDir}, ${card.cardBackgroundColor || '#1C1C1E'} 0%, ${card.cardBackgroundGradientColor} 100%)`;
    } else if (card.cardBackgroundColor) {
      rootStyle.background = card.cardBackgroundColor;
    } else {
      rootStyle.background = card.backgroundColor || '#1C1C1E';
    }
  } else {
    const backgroundFit = card.backgroundImageFit || 'cover';
    if (card.backgroundType === 'image' && card.backgroundImageUrl) {
      rootStyle.backgroundImage = `url(${card.backgroundImageUrl})`;
      rootStyle.backgroundSize = backgroundFit === 'contain' ? 'contain' : backgroundFit === 'repeat' ? 'auto' : 'cover';
      rootStyle.backgroundRepeat = backgroundFit === 'repeat' ? 'repeat' : 'no-repeat';
      rootStyle.backgroundPosition = 'center';

      if (card.overlay === 'dark') darkenOpacity = 0.6;
      else if (card.overlay === 'light') darkenOpacity = 0.2;
    } else {
      rootStyle.background = card.backgroundColor || '#1E1E1E';
    }
  }

  if (!isPreview) {
    // v52.5.42 Public timing parity:
    // Public/live links render the same final visual scale as the studio preview,
    // but keep timelineMode="live". The previous v52.5.41 path forced
    // timelineMode="final", so title/subtitle/description/buttons were visible
    // immediately and ignored the timing sliders.
    return (
      <>
        <main className="fixed inset-0 h-[100svh] w-screen overflow-hidden bg-black text-[#F5F2EA] flex items-center justify-center">
          <div
            className="relative h-[100svh] w-screen sm:h-[min(96svh,760px)] sm:w-auto sm:aspect-[9/16] overflow-hidden bg-black sm:rounded-[36px] sm:border-[8px] sm:border-[#111] sm:shadow-2xl"
            aria-label="ureel public unified mobile live card"
          >
            <ErrorBoundary lang={lang} fallbackNode={<PublicRecoveryFallback card={hydratedPublicCard} lang={lang} />}>
              <UnifiedMobileLiveCardSurface
                card={hydratedPublicCard}
                lang={lang}
                isPreview={false}
                cleanPreview={true}
                previewFocus="full"
                visualMode="final"
                timelineMode="live"
                showLayoutDebug={false}
                debugLabel="public-view"
                onButtonClick={handleButtonClick}
                onContactSave={triggerVCardDownload}
                onShare={() => setShowShareModal(true)}
              />
            </ErrorBoundary>
          </div>
        </main>
        <AnimatePresence>{showShareModal && <ShareExportModal card={hydratedPublicCard} lang={lang} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />}</AnimatePresence>
      </>
    );
  }

  return (
    <div 
      className="relative min-h-screen flex flex-col items-center justify-between text-cream overflow-x-hidden p-0 sm:p-4 md:p-6 bg-[#0B0B0B]"
    >
      {/* Profile Card Center Content (Visual Card) */}
      <div 
        className="w-full max-w-md flex flex-col items-stretch z-10 flex-grow justify-start rounded-none sm:rounded-[23px] border-0 sm:border sm:border-stone-850/80 bg-stone-900 shadow-none sm:shadow-2xl overflow-hidden relative"
      >
        {/* Compact Top-Bar for mobile (<768px) */}
        <div className="flex md:hidden h-11 items-center justify-between px-3.5 bg-[#111111] border-b border-stone-850/60 z-30 shrink-0 select-none w-full">
          <div>
            {onBackToDashboard ? (
              <button 
                onClick={onBackToDashboard}
                className="flex items-center gap-1 bg-black/30 border border-white/5 text-[10px] text-[#A855F7] px-2.5 py-1 rounded-full hover:bg-black transition font-semibold"
              >
                <LucideIcons.ArrowLeft size={11} />
                <span>{lang === 'de' ? 'Zurück' : 'Back'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <img 
                  src="/brand/ureel-icon-512.png" 
                  alt="ureel" 
                  className="w-4.5 h-4.5 rounded bg-stone-950 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] tracking-widest font-black text-[#A855F7]">ureel</span>
              </div>
            )}
          </div>

          {/* Compact, smaller language selector on mobile */}
          <div className="flex gap-1 bg-stone-950 p-0.5 rounded-md border border-white/5 text-[9px]">
            <button 
              type="button"
              onClick={() => setLang('de')}
              className={`cursor-pointer px-2 py-0.5 rounded transition duration-150 font-black ${lang === 'de' ? 'bg-[#A855F7] text-stone-950 font-extrabold shadow-sm' : 'text-stone-300 hover:text-white'}`}
            >
              DE
            </button>
            <button 
              type="button"
              onClick={() => setLang('en')}
              className={`cursor-pointer px-2 py-0.5 rounded transition duration-150 font-black ${lang === 'en' ? 'bg-[#A855F7] text-stone-950 font-extrabold shadow-sm' : 'text-stone-300 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Floating navigation and toolbars embedded natively in card layout on Desktop (no vertical push!) */}
        <div className="hidden md:flex absolute top-4 left-4 right-4 items-center justify-between z-30 pointer-events-auto">
          {onBackToDashboard ? (
            <button 
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-purple-400 px-3.5 py-1.5 rounded-full hover:bg-stone-950 transition font-bold shadow-lg cursor-pointer"
            >
              <LucideIcons.ArrowLeft size={13} />
              {t.backToDashboard}
            </button>
          ) : <div />}

          {/* Dual language picker */}
          <div className="flex gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 text-[10px] shadow-lg">
            <button 
              type="button"
              onClick={() => setLang('de')}
              className={`cursor-pointer px-2.5 py-1 rounded-md transition duration-150 font-black ${lang === 'de' ? 'bg-purple-600 text-stone-950 shadow-sm font-extrabold' : 'text-stone-300 hover:text-white'}`}
            >
              DE
            </button>
            <button 
              type="button"
              onClick={() => setLang('en')}
              className={`cursor-pointer px-2.5 py-1 rounded-md transition duration-150 font-black ${lang === 'en' ? 'bg-purple-600 text-stone-950 shadow-sm font-extrabold' : 'text-stone-300 hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Unified Card Core Content Container */}
        <KonuCardCore
          card={card}
          lang={lang}
          isPreview={isPreview}
          handleButtonClick={handleButtonClick}
          triggerVCardDownload={triggerVCardDownload}
          handleCtaClick={handleCtaClick}
          setShowShareModal={setShowShareModal}
          visualMode="final"
        />
      </div> {/* closing visual card container */}

      <p className="text-[11px] text-[#CFCFCF]/50 uppercase tracking-widest text-center mt-3.5 flex items-center justify-center gap-1 z-10 w-full max-w-md">
        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        {t.liveProfileNotice}
      </p>

      {/* Platform Branding at the bottom */}
      {!isPreview && (
        <div className="w-full max-w-sm mt-8 border-t border-stone-800/80 pt-4 pb-2 z-10 flex flex-col items-center">
          {/* Subtle gold CTA button */}
          {!isHidden && (
            <button
              onClick={handleCtaClick}
              className="cursor-pointer group flex items-center gap-1.5 bg-[#121212]/90 hover:bg-black border border-purple-500/40 hover:border-purple-500 text-[11px] font-bold text-purple-400 px-4 py-2 rounded-xl mb-4 transition-all duration-200 shadow-md active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              <span>{lang === 'de' ? 'Erstelle deine eigene ureel' : 'Create your own ureel'}</span>
              <LucideIcons.ChevronRight size={12} className="text-purple-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {!isHidden && (
            <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
              <span>Hosted with</span> <span className="text-[#A855F7]">★</span> <span className="font-bold text-stone-400">ureel</span>
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-stone-500 items-center">
            <a href={`/${lang}/impressum`} className="hover:text-[#A855F7]" target="_blank" rel="noreferrer">
              {lang === 'de' ? 'Impressum' : 'Imprint / Legal'}
            </a>
            <a href={`/${lang}/datenschutz`} className="hover:text-[#A855F7]" target="_blank" rel="noreferrer">
              {lang === 'de' ? 'Datenschutz' : 'Privacy'}
            </a>
            <a href={`/${lang}/agb`} className="hover:text-[#A855F7]" target="_blank" rel="noreferrer">
              {lang === 'de' ? 'AGB' : 'Terms'}
            </a>
            <button 
              type="button" 
              onClick={() => setShowCookieDetails(true)} 
              className="hover:text-[#A855F7] cursor-pointer bg-transparent border-0 font-medium text-[10px]"
            >
              {lang === 'de' ? 'Cookie-Einstellungen' : 'Cookie Settings'}
            </button>
          </div>
        </div>
      )}

      {/* SHARE DRAWER DIALOG POPUP */}
      <AnimatePresence>
        {showShareDrawer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end justify-center z-50">
            <div className="absolute inset-0" onClick={() => setShowShareDrawer(false)} />
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#2A2A2A] w-full max-w-md rounded-t-3xl border-t border-stone-800 p-6 z-10 relative"
            >
              <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto mb-5" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">{t.sharing}</h3>
                <button onClick={() => setShowShareDrawer(false)} className="text-stone-400 hover:text-white">
                  <LucideIcons.X size={20} />
                </button>
              </div>

              {/* QR Code Container */}
              {qrCodeUrl && (
                <div className="flex flex-col items-center justify-center mb-6 bg-[#1E1E1E] p-4 rounded-2xl border border-stone-800">
                  <img src={qrCodeUrl} alt="ureel QR Code" className="w-48 h-48 rounded-lg shadow-md" />
                  <a 
                    href={qrCodeUrl} 
                    download={`qr_${card.slug}.png`}
                    className="mt-3 flex items-center gap-1.5 text-[#A855F7] text-xs font-semibold uppercase hover:underline"
                  >
                    <LucideIcons.Download size={14} />
                    {t.downloadQr}
                  </a>
                </div>
              )}

              {/* Share links */}
              <div className="space-y-3">
                <button 
                  onClick={triggerCopyLink}
                  className="w-full bg-[#1E1E1E] hover:bg-stone-900 text-stone-200 py-3.5 px-4 rounded-xl border border-stone-800 flex items-center justify-between text-sm font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Copy size={16} className="text-[#A855F7]" />
                    {copiedLink ? t.copied : t.copyLink}
                  </span>
                  <LucideIcons.Check size={16} className={copiedLink ? "text-green-400" : "opacity-0"} />
                </button>

                <button 
                  onClick={triggerShareWhatsapp}
                  className="w-full bg-green-900/40 hover:bg-green-900/60 text-green-200 py-3.5 px-4 rounded-xl border border-green-800/50 flex items-center gap-2.5 text-sm font-semibold transition"
                >
                  <LucideIcons.MessageSquare size={16} className="text-green-400" />
                  {t.shareWhatsapp}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ABUSE REPORT TRIGGER FORM MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0" onClick={() => setShowReportModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#2A2A2A] w-full max-w-sm rounded-2xl border border-stone-800 p-6 z-10 relative text-left"
            >
              <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                <LucideIcons.AlertTriangle className="text-red-400" size={18} />
                {t.reportCard}
              </h3>
              <p className="text-xs text-[#CFCFCF] mb-4">{t.reportInstruction}</p>

              {reportSuccess ? (
                <div className="bg-emerald-900/40 border border-emerald-800 text-emerald-300 p-4 rounded-xl text-center text-xs">
                  {t.reportSuccess}
                </div>
              ) : (
                <form onSubmit={handleReportCard} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">email</label>
                    <input 
                      type="email" 
                      required
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="deine@adresse.de"
                      className="w-full bg-[#1E1E1E] border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Kategorie</label>
                    <select 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-[#1E1E1E] border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-[#A855F7]"
                    >
                      <option value="spam">Spam / Missbrauch</option>
                      <option value="illegal">Illegale Inhalte</option>
                      <option value="scam">Betrug / Phishing</option>
                      <option value="harassment">Hassrede / Mobbing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Meldung</label>
                    <textarea 
                      required
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      rows={3}
                      placeholder="Beschreibung des missbräuchlichen Verhaltens..."
                      className="w-full bg-[#1E1E1E] border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowReportModal(false)}
                      className="bg-[#1E1E1E] text-stone-300 px-4 py-2 rounded-xl text-xs hover:bg-stone-900 cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit"
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                    >
                      <LucideIcons.Send size={12} />
                      {t.submitReport}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PASSWORD PROTECTION TRIGGER DIALOG MODAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0" onClick={() => !isVerifyingPassword && setShowPasswordModal(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#2A2A2A] w-full max-w-sm rounded-2xl border border-stone-800 p-6 z-10 relative text-left"
            >
              <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                <LucideIcons.Lock className="text-[#A855F7]" size={18} />
                {t.passwordRequiredTitle}
              </h3>
              <p className="text-xs text-[#CFCFCF] mb-4">
                {t.passwordPlaceholderText}
              </p>

              {activePasswordButton?.passwordHint && (
                <div className="bg-[#1E1E1E] p-3 rounded-xl border border-stone-800 text-stone-400 text-[11px] mb-4 flex items-start gap-1.5 leading-relaxed font-sans">
                  <LucideIcons.HelpCircle size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase text-[9px] text-stone-500 tracking-wider block mb-0.5">
                      {t.passwordHintLabel}
                    </span>
                    <span>{activePasswordButton.passwordHint}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <input 
                    type="password"
                    disabled={isVerifyingPassword}
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder={t.passwordLabel}
                    className="w-full bg-[#1E1E1E] border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-[#A855F7] disabled:opacity-55"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyPassword();
                    }}
                  />
                  {passwordError && (
                    <p className="text-xs text-red-400 mt-1">{passwordError}</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button 
                    type="button" 
                    disabled={isVerifyingPassword}
                    onClick={() => {
                      setShowPasswordModal(false);
                      setActivePasswordButton(null);
                    }}
                    className="bg-[#1E1E1E] text-stone-300 px-4 py-2 rounded-xl text-xs hover:bg-stone-900 cursor-pointer disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="button"
                    disabled={isVerifyingPassword}
                    onClick={handleVerifyPassword}
                    className="cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] text-[#1E1E1E] font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    {isVerifyingPassword && <LucideIcons.Loader2 size={12} className="animate-spin" />}
                    {isVerifyingPassword ? (lang === 'de' ? 'Prüfen...' : 'Verifying...') : t.open}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GALLERY POP-UP MODAL */}
      <AnimatePresence>
        {showGalleryModal && selectedGalleryButton && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50">
            {/* Absolute close overlay trigger */}
            <div className="absolute inset-0 z-10" onClick={() => setShowGalleryModal(false)} />
            
            {/* Header Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 text-white bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider font-mono">
                  {lang === 'de' ? 'Galerie' : 'Gallery'}
                </span>
                <h4 className="text-sm font-bold text-stone-100 truncate max-w-[200px] sm:max-w-[400px]">
                  {selectedGalleryButton.title || (lang === 'de' ? 'Bildergalerie' : 'Image gallery')}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {selectedGalleryButton.galleryDropboxUrl && (
                  <a 
                    href={selectedGalleryButton.galleryDropboxUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-[10px] sm:text-xs font-extrabold uppercase rounded-lg tracking-wider transition-all duration-155 cursor-pointer mr-2"
                  >
                    <LucideIcons.FolderOpen size={13} />
                    <span>Dropbox</span>
                  </a>
                )}
                <button
                  onClick={() => setShowGalleryModal(false)}
                  className="p-2 text-stone-400 hover:text-white hover:bg-stone-900/60 transition rounded-xl cursor-pointer"
                  title={lang === 'de' ? 'Schließen' : 'Close'}
                >
                  <LucideIcons.X size={20} />
                </button>
              </div>
            </div>

            {/* Inner Content Component (Stops Propagation) */}
            <div className="relative z-15 w-full max-w-4xl h-full flex flex-col items-center justify-center pointer-events-none mt-12 mb-16">
              {(() => {
                const galleryImgList = selectedGalleryButton.galleryImages || [];
                if (galleryImgList.length === 0) {
                  return (
                    <div className="text-center p-8 bg-[#1A1A1A] rounded-2xl border border-stone-800 max-w-sm pointer-events-auto shadow-2xl">
                      <LucideIcons.ImageOff className="mx-auto text-stone-500 mb-3" size={40} />
                      <p className="text-xs text-stone-300 font-bold">
                        {lang === 'de'
                          ? 'Für diese Galerie wurden noch keine Bilder hinterlegt.'
                          : 'No images have been added to this gallery yet.'}
                      </p>
                      {selectedGalleryButton.galleryDropboxUrl && (
                        <div className="mt-4">
                          <p className="text-[10px] text-stone-400 mb-3 block leading-relaxed">
                            {lang === 'de'
                              ? 'Dropbox-Links werden als externer Ordner geöffnet. Direkter Bildimport folgt später.'
                              : 'Dropbox links open as an external folder. Direct image import will be added later.'}
                          </p>
                          <a
                            href={selectedGalleryButton.galleryDropboxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-550 text-white text-xs font-bold uppercase rounded-xl tracking-wider transition duration-150 cursor-pointer"
                          >
                            <LucideIcons.FolderOpen size={14} />
                            <span>Dropbox öffnen</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                }

                const currentImg = galleryImgList[currentImageIndex];

                return (
                  <div className="w-full h-full flex flex-col items-center justify-center relative pointer-events-auto">
                    {/* Main Active image frame */}
                    <div className="relative max-w-full max-h-[70vh] sm:max-h-[80vh] flex items-center justify-center">
                      <motion.img
                        key={currentImageIndex}
                        src={currentImg.url}
                        alt={currentImg.name || 'Gallery item'}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-full max-h-[60vh] sm:max-h-[75vh] object-contain rounded-xl select-none shadow-2xl bg-black"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Navigation controllers - Left & Right (Desktop layout floats, Mobile layout rests underneath or uses overlays) */}
                    {galleryImgList.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImgList.length - 1))}
                          className="absolute left-1 sm:-left-12 p-3.5 sm:p-5 rounded-full bg-stone-900/80 hover:bg-stone-850 text-[#A855F7] hover:text-white transition shadow-xl cursor-pointer border border-stone-800"
                          title={lang === 'de' ? 'Vorheriges Bild' : 'Previous image'}
                        >
                          <LucideIcons.ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev < galleryImgList.length - 1 ? prev + 1 : 0))}
                          className="absolute right-1 sm:-right-12 p-3.5 sm:p-5 rounded-full bg-stone-900/80 hover:bg-stone-850 text-[#A855F7] hover:text-white transition shadow-xl cursor-pointer border border-stone-800"
                          title={lang === 'de' ? 'Nächstes Bild' : 'Next image'}
                        >
                          <LucideIcons.ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    {/* Image metadata & Counter footer */}
                    <div className="mt-4 text-center space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#A855F7] font-mono">
                        {currentImageIndex + 1} / {galleryImgList.length}
                      </span>
                      {currentImg.name && (
                        <p className="text-xs text-stone-400 font-sans truncate max-w-[280px] sm:max-w-md">
                          {currentImg.name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* COOKIES DIRECT CONSENT BANNER */}
      {cookieConsent === null && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E1E1E] border-t border-stone-800 p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-4xl mx-auto md:rounded-t-3xl text-left">
          <div className="space-y-1">
            <h4 className="text-white font-extrabold text-sm flex items-center gap-1.5 font-sans">
              <LucideIcons.Cookie className="text-[#A855F7]" size={16} />
              Datenschutz & Cookies
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
              Wir verwenden technisch notwendige Cookies zur Nutzersitzung sowie optionale Statistiken/Klicks, um Besucherzahlen pseudonymisiert aufzubereiten.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => setShowCookieDetails(true)}
              className="bg-stone-850 hover:bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Anpassen
            </button>
            <button
              onClick={() => {
                const acceptAll = { necessary: true, statistics: true, marketing: true };
                setSafeLocalStorage('livecard_cookie_consent', JSON.stringify(acceptAll));
                setCookieConsent(acceptAll);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-anthracite text-xs font-black px-4.5 py-2.5 rounded-xl transition cursor-pointer shadow-md"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      )}

      {/* DETAILED PRIVACY CONFIGURATION DRAWER / MODAL */}
      <AnimatePresence>
        {showCookieDetails && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCookieDetails(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#2A2A2A] border border-stone-800 rounded-3xl p-6 w-full max-w-md text-left space-y-4 shadow-2xl z-10 relative font-sans"
            >
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <LucideIcons.Settings className="text-[#A855F7]" size={18} />
                Cookie-Einwilligung verwalten
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Wählen Sie aus, welche optionale Kategorien Sie zulassen möchten. Essenzielle Cookies lassen sich nicht abwählen.
              </p>

              <div className="space-y-3 pt-1">
                {/* Essential */}
                <div className="bg-[#1E1E1E] p-3 rounded-xl border border-stone-800 flex items-start gap-3">
                  <input type="checkbox" checked disabled className="mt-0.5 rounded text-purple-400 focus:ring-0 opacity-60" />
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Notwendig (Essenziell)</h4>
                    <p className="text-[10px] text-stone-500 font-medium">Fuer den Login-Status und grundlegende Sicherheitsfunktionen unentbehrlich.</p>
                  </div>
                </div>

                {/* Statistics */}
                <label className="bg-[#1E1E1E] p-3 rounded-xl border border-stone-800 flex items-start gap-3 cursor-pointer select-none border-stone-750">
                  <input 
                    type="checkbox" 
                    id="stats-consent"
                    defaultChecked={cookieConsent?.statistics ?? true}
                    className="mt-0.5 rounded text-purple-400 focus:ring-0" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Pseudonyme Klick-Statistiken</h4>
                    <p className="text-[10px] text-stone-400 font-medium">Erlaubt es dem Profilinhaber zu sehen, wie oft Klicks auf Buttons erfolgen.</p>
                  </div>
                </label>

                {/* Marketing */}
                <label className="bg-[#1E1E1E] p-3 rounded-xl border border-stone-800 flex items-start gap-3 cursor-pointer select-none border-stone-750">
                  <input 
                    type="checkbox" 
                    id="marketing-consent"
                    defaultChecked={cookieConsent?.marketing ?? true}
                    className="mt-0.5 rounded text-purple-400 focus:ring-0" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">Komfortfunktionen & Marketing</h4>
                    <p className="text-[10px] text-stone-400 font-medium">Erleichtert die lückenlose Darstellung externer Kartendienste und Widgets.</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-stone-805">
                <button
                  type="button"
                  onClick={() => setShowCookieDetails(false)}
                  className="bg-transparent text-stone-405 hover:text-white text-xs font-extrabold px-3 py-1.5"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const stats = (document.getElementById('stats-consent') as HTMLInputElement)?.checked ?? true;
                    const market = (document.getElementById('marketing-consent') as HTMLInputElement)?.checked ?? true;
                    const consentObj = { necessary: true, statistics: stats, marketing: market };
                    setSafeLocalStorage('livecard_cookie_consent', JSON.stringify(consentObj));
                    setCookieConsent(consentObj);
                    setShowCookieDetails(false);
                    // Reload to let preferences propagate
                    window.location.reload();
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-anthracite text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CALENDAR & AVAILABILITY / ABSENCE MODAL */}
      <AnimatePresence>
        {activeAvailabilityButton && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0" onClick={() => setActiveAvailabilityButton(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#2A2A2A] w-full max-w-sm rounded-[24px] border border-stone-800 p-6 z-10 relative text-left shadow-2xl space-y-5"
            >
              {/* Header Icon & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                  <LucideIcons.CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#F5F0E6] text-sm uppercase tracking-wide leading-tight">
                    {activeAvailabilityButton.title || (lang === 'de' ? 'Terminkalender' : 'Availability')}
                  </h3>
                  <span className="text-[10px] text-stone-400 font-bold tracking-wide uppercase">
                    {lang === 'de' ? 'Aktuelle Erreichbarkeit' : 'Current Schedule Details'}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-1">
                {(() => {
                  const status = activeAvailabilityButton.availabilityStatus || 'available';
                  let label = '';
                  let colorClasses = '';
                  let StatusIcon = LucideIcons.CalendarCheck;

                  if (status === 'available') {
                     label = lang === 'de' ? 'Verfügbar' : 'Available';
                     colorClasses = 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
                     StatusIcon = LucideIcons.CheckCircle2;
                  } else if (status === 'vacation') {
                     label = lang === 'de' ? 'Im Urlaub' : 'On vacation';
                     colorClasses = 'bg-amber-500/10 border border-amber-500/30 text-[#A855F7]';
                     StatusIcon = LucideIcons.Plane;
                  } else if (status === 'unavailable') {
                     label = lang === 'de' ? 'Nicht verfügbar' : 'Not available';
                     colorClasses = 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
                     StatusIcon = LucideIcons.AlertCircle;
                  } else if (status === 'appointment') {
                     label = lang === 'de' ? 'Nur nach Termin' : 'By appointment only';
                     colorClasses = 'bg-sky-500/10 border border-sky-500/30 text-sky-400';
                     StatusIcon = LucideIcons.CalendarRange;
                  }

                  return (
                    <div className={`p-3 rounded-xl flex items-center gap-2.5 ${colorClasses}`}>
                      <StatusIcon size={16} className="shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Duration / Period if available */}
              {(activeAvailabilityButton.availabilityFrom || activeAvailabilityButton.availabilityTo) && (
                <div className="space-y-1.5 bg-[#1E1E1E] p-3.5 rounded-xl border border-stone-850">
                  <span className="block text-[9px] uppercase text-stone-500 tracking-wider font-extrabold">
                    {lang === 'de' ? 'Zeitraum' : 'Duration / Period'}
                  </span>
                  <div className="flex items-start gap-2 text-xs text-stone-300">
                    <LucideIcons.Clock size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">
                      {(() => {
                        const fromVal = activeAvailabilityButton.availabilityFrom;
                        const toVal = activeAvailabilityButton.availabilityTo;
                        if (fromVal && toVal) {
                          return lang === 'de'
                            ? `Vom ${fromVal} bis ${toVal}`
                            : `From ${fromVal} until ${toVal}`;
                        } else if (fromVal) {
                          return lang === 'de' ? `Ab ${fromVal}` : `From ${fromVal}`;
                        } else if (toVal) {
                          return lang === 'de' ? `Bis ${toVal}` : `Until ${toVal}`;
                        }
                        return '';
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Personal Note */}
              {activeAvailabilityButton.availabilityNote && (
                <div className="space-y-1 bg-[#1E1E1E] p-3.5 rounded-xl border border-stone-850">
                  <span className="block text-[9px] uppercase text-stone-500 tracking-wider font-extrabold">
                    {lang === 'de' ? 'Hinweis' : 'Personal Note'}
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed font-sans whitespace-pre-line">
                    {activeAvailabilityButton.availabilityNote}
                  </p>
                </div>
              )}

              {/* Backup Contact Replacement */}
              {activeAvailabilityButton.availabilityBackupContact && (
                <div className="space-y-2 bg-[#1E1E1E] p-3.5 rounded-xl border border-stone-850">
                  <span className="block text-[9px] uppercase text-stone-500 tracking-wider font-extrabold">
                    {lang === 'de' ? 'Vertretung / Ersatzkontakt' : 'Backup Contact'}
                  </span>
                  <div className="flex items-start gap-2.5">
                     <LucideIcons.UserCheck size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                     <div className="text-xs text-stone-300 min-w-0 flex-1">
                       {(() => {
                         const contact = activeAvailabilityButton.availabilityBackupContact.trim();
                         const isEmail = contact.includes('@') && !contact.includes(' ');
                         const isPhone = /^[+0-9\s()-]{5,20}$/.test(contact);
                         
                         if (isEmail) {
                           return (
                             <a
                               href={`mailto:${contact}`}
                               className="text-[#A855F7] hover:underline font-bold flex items-center gap-1 break-all"
                             >
                               <LucideIcons.Mail size={12} className="shrink-0" />
                               <span>{contact}</span>
                             </a>
                           );
                         } else if (isPhone) {
                           return (
                             <a
                               href={`tel:${contact.replace(/\s+/g, '')}`}
                               className="text-[#A855F7] hover:underline font-bold flex items-center gap-1"
                             >
                               <LucideIcons.Phone size={12} className="shrink-0" />
                               <span>{contact}</span>
                             </a>
                           );
                         } else {
                           return <span className="font-semibold leading-relaxed break-words">{contact}</span>;
                         }
                       })()}
                     </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAvailabilityButton(null)}
                  className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <span>{lang === 'de' ? 'Schließen' : 'Close'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DOWNLOAD AREA OVERLAY MODAL */}
      <AnimatePresence>
        {activeDownloadAreaButton && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="absolute inset-0" onClick={() => setActiveDownloadAreaButton(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#2A2A2A] w-full max-w-sm rounded-[24px] border border-stone-800 p-6 z-10 relative text-left shadow-2xl space-y-4"
            >
              {/* Header Icon & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                  <LucideIcons.DownloadCloud size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#F5F0E6] text-sm uppercase tracking-wide leading-tight">
                    {lang === 'de' ? 'Download-Bereich' : 'Download area'}
                  </h3>
                  <span className="text-[10px] text-stone-400 font-bold tracking-wide uppercase">
                    {activeDownloadAreaButton.title || (lang === 'de' ? 'Dateien & Dokumente' : 'Files & Documents')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {(() => {
                  const items = activeDownloadAreaButton.downloadItems || [];
                  if (items.length === 0) {
                    return (
                      <p className="text-xs text-stone-400 italic text-center py-4">
                        {lang === 'de' ? 'Keine Links hinterlegt.' : 'No links set.'}
                      </p>
                    );
                  }
                  return items.map((item, idx) => {
                    let providerDe = 'Extern';
                    let providerEn = 'External';
                    if (item.provider === 'dropbox') {
                      providerDe = 'Dropbox';
                      providerEn = 'Dropbox';
                    } else if (item.provider === 'google_drive') {
                      providerDe = 'Google Drive';
                      providerEn = 'Google Drive';
                    } else if (item.provider === 'onedrive') {
                      providerDe = 'OneDrive';
                      providerEn = 'OneDrive';
                    }
                    const providerLabel = lang === 'de' ? providerDe : providerEn;

                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-stone-850 rounded-xl gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-stone-200 truncate leading-tight">
                            {item.title}
                          </span>
                          <span className="block text-[9px] text-stone-500 font-bold tracking-wider uppercase mt-0.5">
                            {providerLabel}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!downloadAreaCheckbox) {
                              setDownloadAreaError(true);
                              return;
                            }
                            setDownloadAreaError(false);
                            
                            const lowerUrl = item.url.toLowerCase();
                            let targetUrl = item.url;
                            if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
                              targetUrl = 'https://' + item.url;
                            }
                            setExternalLinkToOpen(targetUrl);
                          }}
                          className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg cursor-pointer transition shrink-0"
                        >
                          {lang === 'de' ? 'Öffnen' : 'Open'}
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Rights clearance confirmation */}
              <div className="bg-[#1E1E1E] p-3 rounded-xl border border-stone-850 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadAreaCheckbox}
                    onChange={(e) => {
                      setDownloadAreaCheckbox(e.target.checked);
                      if (e.target.checked) setDownloadAreaError(false);
                    }}
                    className="mt-0.5 rounded border-stone-800 bg-[#2A2A2A] text-[#A855F7] focus:ring-0 accent-[#A855F7] cursor-pointer"
                  />
                  <span className="text-[10.5px] text-stone-300 font-medium leading-relaxed select-none animate-fadeIn">
                    {lang === 'de'
                      ? 'Ich bestätige, dass ich berechtigt bin, auf diese externe Datei zuzugreifen.'
                      : 'I confirm that I am authorized to access this external file.'}
                  </span>
                </label>

                {downloadAreaError && (
                  <p className="text-[10px] font-bold text-red-400 animate-fadeIn ml-6">
                    {lang === 'de'
                      ? 'Bitte bestätige die Rechteklärung.'
                      : 'Please confirm the rights clearance.'}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDownloadAreaButton(null)}
                  className="w-full bg-[#1E1E1E] hover:bg-stone-800 text-stone-400 hover:text-stone-300 border border-stone-850 font-bold text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <span>{lang === 'de' ? 'Schließen' : 'Close'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* External Redirection Warning Modal */}
      <AnimatePresence>
        {externalLinkToOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExternalLinkToOpen(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1C1E] border border-stone-800 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 z-10 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-[#A855F7]">
                <LucideIcons.ExternalLink size={20} />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {lang === 'de' ? 'Externer Inhalt' : 'External content'}
                </h3>
              </div>

              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                {lang === 'de'
                  ? 'Du öffnest jetzt einen externen Link. Bitte vergewissere dich, dass du dem verlinkten Ziel vertraust.'
                  : 'You are about to open an external link. Please make sure you trust the linked destination.'}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExternalLinkToOpen(null)}
                  className="flex-1 bg-stone-900 border border-stone-850 hover:bg-stone-800 hover:text-stone-100 text-[#A855F7] py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                >
                  {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(externalLinkToOpen, '_blank', 'noopener,noreferrer');
                    setExternalLinkToOpen(null);
                  }}
                  className="flex-1 bg-[#A855F7] hover:bg-[#d9b85c] text-stone-950 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                >
                  {lang === 'de' ? 'Weitergehen' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. PUBLIC VIEW FORM MODAL FOR VISITORS (PRO FEATURES) */}
      <AnimatePresence>
        {activeFormButton && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFormButton(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1C1E] border border-stone-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 z-10 space-y-4 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 text-[#A855F7]">
                  {activeFormButton.actionType === 'contact_form' && <LucideIcons.Mail size={22} />}
                  {activeFormButton.actionType === 'inquiry_form' && <LucideIcons.FileText size={22} />}
                  {activeFormButton.actionType === 'callback_request' && <LucideIcons.PhoneCall size={22} />}
                  
                  <h3 className="text-base font-black uppercase tracking-wider">
                    {activeFormButton.actionType === 'contact_form' && TRANSLATIONS[lang].contact_title}
                    {activeFormButton.actionType === 'inquiry_form' && TRANSLATIONS[lang].inquiry_title}
                    {activeFormButton.actionType === 'callback_request' && TRANSLATIONS[lang].callback_title}
                  </h3>
                </div>
                
                <button
                  onClick={() => setActiveFormButton(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 rounded-full transition cursor-pointer"
                >
                  <LucideIcons.X size={18} />
                </button>
              </div>

              {/* Form Intro or description text configured in editor */}
              <p className="text-xs text-stone-300 font-medium leading-relaxed bg-stone-900/40 p-3 rounded-xl border border-stone-850">
                {activeFormButton.actionType === 'contact_form' && (activeFormButton.formConfig?.introText || TRANSLATIONS[lang].contact_intro)}
                {activeFormButton.actionType === 'inquiry_form' && (activeFormButton.formConfig?.introText || TRANSLATIONS[lang].inquiry_intro)}
                {activeFormButton.actionType === 'callback_request' && (activeFormButton.callbackConfig?.introText || TRANSLATIONS[lang].callback_intro)}
              </p>

              <form onSubmit={handleSubmitVisitorForm} className="space-y-3.5 pt-1">
                {/* 1. Name Input (All) */}
                <div className="space-y-1">
                  <label htmlFor="visitor-name" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {TRANSLATIONS[lang].field_name} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="visitor-name"
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder={lang === 'de' ? 'z. B. Max Mustermann' : 'e.g. John Doe'}
                    className={`w-full h-11 bg-[#121214] border rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7] ${formErrors.name ? 'border-red-500/80 bg-red-950/5' : 'border-stone-800'}`}
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-400 font-bold ml-1 animate-fadeIn">{formErrors.name}</p>
                  )}
                </div>

                {/* 2. Email Address Input (Contact & Inquiry Forms) */}
                {['contact_form', 'inquiry_form'].includes(activeFormButton.actionType) && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-email" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_email} <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="visitor-email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => {
                        setFormEmail(e.target.value);
                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="mail@company.com"
                      className={`w-full h-11 bg-[#121214] border rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7] ${formErrors.email ? 'border-red-500/80 bg-red-950/5' : 'border-stone-800'}`}
                    />
                    {formErrors.email && (
                      <p className="text-[10px] text-red-400 font-bold ml-1 animate-fadeIn">{formErrors.email}</p>
                    )}
                  </div>
                )}

                {/* 3. Phone Number Input (Inquiry: optional, Callback: required) */}
                {activeFormButton.actionType === 'inquiry_form' && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-phone-opt" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_phone_optional}
                    </label>
                    <input
                      id="visitor-phone-opt"
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+49 170 1234567"
                      className="w-full h-11 bg-[#121214] border border-stone-800 rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                  </div>
                )}

                {activeFormButton.actionType === 'callback_request' && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-phone-req" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_phone} <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="visitor-phone-req"
                      type="text"
                      value={formPhone}
                      onChange={(e) => {
                        setFormPhone(e.target.value);
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="+49 170 1234567"
                      className={`w-full h-11 bg-[#121214] border rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7] ${formErrors.phone ? 'border-red-500/80 bg-red-950/5' : 'border-stone-800'}`}
                    />
                    {formErrors.phone && (
                      <p className="text-[10px] text-red-400 font-bold ml-1 animate-fadeIn">{formErrors.phone}</p>
                    )}
                  </div>
                )}

                {/* 4. Preferred Callback Time Input (Callback: optional) */}
                {activeFormButton.actionType === 'callback_request' && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-preferred-time" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_preferred_time}
                    </label>
                    <input
                      id="visitor-preferred-time"
                      type="text"
                      value={formPreferredTime}
                      onChange={(e) => setFormPreferredTime(e.target.value)}
                      placeholder={lang === 'de' ? 'z. B. Werktags ab 14 Uhr' : 'e.g. Weekdays after 2 PM'}
                      className="w-full h-11 bg-[#121214] border border-stone-800 rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                  </div>
                )}

                {/* 5. Topic Selector/Input (Inquiry: required) */}
                {activeFormButton.actionType === 'inquiry_form' && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-topic" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_topic} <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="visitor-topic"
                      type="text"
                      value={formTopic}
                      onChange={(e) => {
                        setFormTopic(e.target.value);
                        if (formErrors.topic) setFormErrors(prev => ({ ...prev, topic: '' }));
                      }}
                      placeholder={lang === 'de' ? 'z. B. Zusammenarbeitsanfrage' : 'e.g. Partnership request'}
                      className={`w-full h-11 bg-[#121214] border rounded-xl px-3.5 text-xs text-stone-200 focus:outline-[#A855F7] ${formErrors.topic ? 'border-red-500/80 bg-red-950/5' : 'border-stone-800'}`}
                    />
                    {formErrors.topic && (
                      <p className="text-[10px] text-red-400 font-bold ml-1 animate-fadeIn">{formErrors.topic}</p>
                    )}
                  </div>
                )}

                {/* 6. Message TextArea (Contact, Inquiry: required; Callback: optional) */}
                {['contact_form', 'inquiry_form'].includes(activeFormButton.actionType) && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-message-req" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_message} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="visitor-message-req"
                      value={formMessage}
                      onChange={(e) => {
                        setFormMessage(e.target.value);
                        if (formErrors.message) setFormErrors(prev => ({ ...prev, message: '' }));
                      }}
                      placeholder={lang === 'de' ? 'Deine Ausführungen...' : 'Your inputs here...'}
                      rows={3}
                      className={`w-full bg-[#121214] border rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-[#A855F7] ${formErrors.message ? 'border-red-500/80 bg-red-950/5' : 'border-stone-800'}`}
                    />
                    {formErrors.message && (
                      <p className="text-[10px] text-red-400 font-bold ml-1 animate-fadeIn">{formErrors.message}</p>
                    )}
                  </div>
                )}

                {activeFormButton.actionType === 'callback_request' && (
                  <div className="space-y-1">
                    <label htmlFor="visitor-message-opt" className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {TRANSLATIONS[lang].field_message_optional}
                    </label>
                    <textarea
                      id="visitor-message-opt"
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder={lang === 'de' ? 'Spezifisches Anliegen (optional)...' : 'Additional context (optional)...'}
                      rows={2}
                      className="w-full bg-[#121214] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                  </div>
                )}

                {/* Privacy Warning Label */}
                <div className="bg-[#151517] p-3 text-[10px] text-stone-400 leading-normal rounded-xl border border-stone-850 flex items-start gap-2 select-none">
                  <LucideIcons.ShieldAlert size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                  <span>{TRANSLATIONS[lang].privacy_notice}</span>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormButton(null)}
                    className="flex-1 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-300 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                  >
                    {TRANSLATIONS[lang].cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#A855F7] hover:bg-[#d4b355] text-stone-950 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LucideIcons.Send size={13} />
                    <span>
                      {activeFormButton.actionType === 'contact_form' && TRANSLATIONS[lang].btn_prepare_email}
                      {activeFormButton.actionType === 'inquiry_form' && TRANSLATIONS[lang].btn_prepare_inquiry}
                      {activeFormButton.actionType === 'callback_request' && TRANSLATIONS[lang].btn_prepare_callback}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE SHARING & EXPORTS DRAWER / MODAL */}
      <ShareExportModal
        card={card}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        lang={lang}
      />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur-md border border-[#A855F7]/40 px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-100 flex items-center gap-3 max-w-[90vw] text-stone-200"
          >
            <LucideIcons.Info size={16} className="text-[#A855F7] shrink-0" />
            <span className="text-[11px] font-bold tracking-wide leading-normal">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
