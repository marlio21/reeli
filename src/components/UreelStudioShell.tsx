import React, { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton, UreelScene, UreelTimeline, UreelEndCard, UreelTextTemplate, getPublicCardUrl } from '../types';
import { KonuCardCore } from './KonuCardCore';
import { ButtonRenderer } from './ButtonRenderer';
import { PublicDesktopPageRenderer } from './PublicDesktopPageRenderer';
import { createDefaultButton, sanitizeButtonForFirestore } from '../utils/buttonUtils';
import { UREEL_TEXT_TEMPLATES, normalizeUreelTextTemplate } from '../utils/textTemplates';
import { storage } from '../firebase';

interface UreelStudioShellProps {
  activeCard: Card;
  cards: Card[];
  setActiveCard: (card: Card | null) => void;
  syncCardUpdate: (updates: Partial<Card>) => Promise<void>;
  lang: 'de' | 'en';
  setLang: (lang: 'de' | 'en') => void;
  user: any;
  profile: any;
  effectivePlanId: string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  logout: () => void;
  onGoToAdmin?: () => void;
  onGoToRoute?: (route: string) => void;
  createNewCard: (template?: Partial<Card>, lang?: 'de' | 'en') => Promise<Card>;
  deleteCard?: (cardId: string) => Promise<void>;
  updateUserProfile?: (updates: any) => Promise<void>;
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

type MainModule = 'scene' | 'timeline' | 'buttons' | 'endcard' | 'design' | 'cards';

const UREEL_ICON_CHOICES = [
  'Phone','Smartphone','Mail','Send','MessageCircle','MessagesSquare','Globe','ExternalLink','Link','MapPin','Navigation','Calendar','Clock','User','Users','Contact','ContactRound','Building2','Briefcase','Home','Store','ShoppingBag','ShoppingCart','CreditCard','Euro','BadgePercent','Gift','Sparkles','Star','Heart','ThumbsUp','Megaphone','Play','Video','Image','Camera','Music','Mic','Headphones','FileText','File','Files','Folder','FolderOpen','Download','UploadCloud','BookOpen','Newspaper','Shield','Lock','KeyRound','QrCode','Share2','Instagram','Facebook','Linkedin','Youtube','MessageSquareText','Wrench','Utensils','Car','Plane','Train','Bike','Dumbbell','GraduationCap','Handshake','Award','Trophy','Lightbulb','Palette','Paintbrush','Zap','Rocket','Crown'
];

export const UreelStudioShell: React.FC<UreelStudioShellProps> = ({
  activeCard,
  cards,
  setActiveCard,
  syncCardUpdate,
  lang,
  setLang,
  user,
  profile,
  effectivePlanId,
  triggerToast,
  logout,
  onGoToAdmin,
  onGoToRoute,
  createNewCard,
  deleteCard,
  updateUserProfile,
}) => {
  const currentSlugUrl = activeCard ? getPublicCardUrl(activeCard.slug) : '';

  const makeSafeSlug = (value?: string) => {
    const cleaned = (value || 'ureel')
      .toLowerCase()
      .trim()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    return cleaned || `ureel-${Date.now().toString(36).slice(-5)}`;
  };

  const [activeTab, setActiveTab] = useState<MainModule>('scene');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [cardManagerOpen, setCardManagerOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [accountManagerTab, setAccountManagerTab] = useState<'profile' | 'billing' | 'team' | 'settings'>('profile');
  const [profileDraft, setProfileDraft] = useState({
    displayName: profile?.displayName || profile?.name || '',
    companyName: profile?.companyName || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    city: profile?.city || '',
    country: profile?.country || '',
  });
  const [buttonPreviewMode, setButtonPreviewMode] = useState<'card' | 'button' | 'grid'>('button');
  const [textPreviewMode, setTextPreviewMode] = useState<'card' | 'text' | 'fit'>('text');
  const [textAnimationSeed, setTextAnimationSeed] = useState(0);
  const [textDraft, setTextDraft] = useState({ title: activeCard.title || '', subtitle: activeCard.subtitle || '', description: activeCard.description || '' });
  const [textDirty, setTextDirty] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<string>('scene-video');
  const [mobileOrbitOpen, setMobileOrbitOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileOrbitModule, setMobileOrbitModule] = useState<MainModule | null>(null);
  const [mobileActiveTextLayer, setMobileActiveTextLayer] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [mobileActiveSetting, setMobileActiveSetting] = useState<string | null>(null);
  const [mobileOrbitLevel, setMobileOrbitLevel] = useState<'main' | 'sub' | 'setting'>('main');
  
  // Local state for actively selected button being edited
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);
  const [buttonFileUploadProgress, setButtonFileUploadProgress] = useState<number | null>(null);
  const [buttonFileUploading, setButtonFileUploading] = useState(false);
  const [sceneImageUploadProgress, setSceneImageUploadProgress] = useState<number | null>(null);
  const [sceneImageUploading, setSceneImageUploading] = useState(false);
  const [endCardImageUploadProgress, setEndCardImageUploadProgress] = useState<number | null>(null);
  const [endCardImageUploading, setEndCardImageUploading] = useState(false);
  const [desktopBgUploadProgress, setDesktopBgUploadProgress] = useState<number | null>(null);
  const [desktopBgUploading, setDesktopBgUploading] = useState(false);
  const [desktopButtonBgUploadProgress, setDesktopButtonBgUploadProgress] = useState<number | null>(null);
  const [desktopButtonBgUploading, setDesktopButtonBgUploading] = useState(false);
  
  // Timeline/Video playback simulation states for Vorschau column
  const [timelineSec, setTimelineSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Sync Default Subsections on Active Tab Switch
  useEffect(() => {
    if (activeTab === 'scene') setActiveSubSection('scene-video');
    else if (activeTab === 'timeline') setActiveSubSection('timeline-texts');
    else if (activeTab === 'buttons') {
      setActiveSubSection('buttons-list');
      // Auto-select first button if exists
      if ((activeCard?.buttons?.length || 0) > 0) {
        setEditingBtnId(activeCard.buttons?.[0]?.id || null);
      } else {
        setEditingBtnId(null);
      }
    }
    else if (activeTab === 'endcard') setActiveSubSection('endcard-general');
    else if (activeTab === 'design') setActiveSubSection('design-desktop');
    else if (activeTab === 'cards') setActiveSubSection('cards-list');
  }, [activeTab]);

  useEffect(() => {
    setProfileDraft({
      displayName: profile?.displayName || profile?.name || '',
      companyName: profile?.companyName || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      city: profile?.city || '',
      country: profile?.country || '',
    });
  }, [profile?.displayName, profile?.name, profile?.companyName, profile?.phone, profile?.website, profile?.city, profile?.country]);

  const saveProfileDraft = async () => {
    if (!updateUserProfile) {
      triggerToast('Profil-Speicherung ist in dieser Version nicht verbunden.', 'info');
      return;
    }
    try {
      await updateUserProfile({
        displayName: profileDraft.displayName,
        name: profileDraft.displayName,
        companyName: profileDraft.companyName,
        phone: profileDraft.phone,
        website: profileDraft.website,
        city: profileDraft.city,
        country: profileDraft.country,
      });
      triggerToast('Nutzerdaten gespeichert.', 'success');
    } catch (e) {
      console.error(e);
      triggerToast('Nutzerdaten konnten nicht gespeichert werden.', 'error');
    }
  };

  useEffect(() => {
    if (!textDirty) {
      setTextDraft({
        title: activeCard.title || '',
        subtitle: activeCard.subtitle || '',
        description: activeCard.description || '',
      });
    }
  }, [activeCard.id, activeCard.title, activeCard.subtitle, activeCard.description, textDirty]);

  const buildTextRevealConfig = (nextDraft = textDraft) => {
    const current = activeCard.videoBackgroundConfig?.profileTextReveals || [];
    const startMap: Record<string, number> = { title: timeline.titleAt, subtitle: timeline.subtitleAt, description: timeline.descriptionAt };
    const valueMap: Record<string, string> = { title: nextDraft.title || '', subtitle: nextDraft.subtitle || '', description: nextDraft.description || '' };
    return (['title', 'subtitle', 'description'] as const).map((key) => {
      const existing = current.find((r: any) => r.fieldKey === key) || {};
      const hasValue = valueMap[key].trim().length > 0;
      return {
        ...existing,
        fieldKey: key,
        // v32: If a user types a slogan/title/text, that layer becomes visible again.
        // Empty fields are treated as inactive, but the text itself is never deleted.
        enabled: hasValue,
        startSecond: existing.startSecond ?? startMap[key],
        fadeDuration: existing.fadeDuration ?? 0.8,
        staysVisibleAfterSequence: existing.staysVisibleAfterSequence ?? true,
      };
    });
  };

  const flushTextDraft = async () => {
    const nextDraft = {
      title: textDraft.title,
      subtitle: textDraft.subtitle,
      description: textDraft.description,
    };
    setTextDirty(false);
    await syncCardUpdate({
      ...nextDraft,
      heroTitle: nextDraft.title,
      heroSubtitle: nextDraft.subtitle,
      heroDescription: nextDraft.description,
      videoBackgroundConfig: {
        ...(activeCard.videoBackgroundConfig || {}),
        profileTextReveals: buildTextRevealConfig(nextDraft),
      } as any,
    });
  };

  // Handle Playback Simulation Loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineSec((prev) => {
          const limit = Number(activeCard.videoBackgroundConfig?.durationSeconds || activeCard.ureelScene?.video?.duration || 12);
          if (prev >= limit) {
            setIsPlaying(false);
            return limit;
          }
          const next = Math.round((prev + 0.5) * 10) / 10;
          if (next >= limit) {
            setIsPlaying(false);
            return limit;
          }
          return next;
        });
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeCard.videoBackgroundConfig?.durationSeconds, activeCard.ureelScene?.video?.duration]);

  // Helper: Get active button object being edited
  const editingButton = activeCard?.buttons?.find(b => b.id === editingBtnId) || null;

  const currentTextTemplate = normalizeUreelTextTemplate(activeCard?.ureelTextTemplate);
  const selectedTextTemplatePreset = currentTextTemplate.style && UREEL_TEXT_TEMPLATES[currentTextTemplate.style]
    ? UREEL_TEXT_TEMPLATES[currentTextTemplate.style]
    : null;
  const isAdCopyBlockEnabled = ((activeCard.ureelTextTemplate as any)?.blockModeEnabled ?? false) === true;
  const adAnimationDuration = Math.max(0.2, Math.min(3, Number((activeCard.ureelTextTemplate as any)?.animationDuration ?? 0.8)));

  const updateTextTemplate = async (fields: any) => {
    const current = normalizeUreelTextTemplate(activeCard?.ureelTextTemplate);
    await syncCardUpdate({
      ureelTextTemplate: {
        ...current,
        ...fields,
      } as any,
    });
  };

  const applyTextTemplatePreset = async (styleId: string) => {
    if (styleId === 'none') {
      await syncCardUpdate({ ureelTextTemplate: { id: '', style: 'none', animation: 'fade' } as any });
      return;
    }
    const preset = UREEL_TEXT_TEMPLATES[styleId];
    if (!preset) return;
    await syncCardUpdate({
      ureelTextTemplate: {
        id: preset.id,
        style: preset.id,
        animation: preset.defaultAnimation,
        emphasis: { ...preset.defaultEmphasis, word: currentTextTemplate.emphasis?.word || '' },
        frame: { type: preset.defaultFrame, color: currentTextTemplate.frame?.color || '#E8DCC2', opacity: 100 },
        box: { type: preset.defaultBox, opacity: currentTextTemplate.box?.opacity || 85 },
        fontStyle: preset.defaultFontStyle,
        animationDuration: (activeCard.ureelTextTemplate as any)?.animationDuration ?? 0.8,
        blockModeEnabled: (activeCard.ureelTextTemplate as any)?.blockModeEnabled ?? false,
      } as any,
    });
  };

  const applyCopyPreset = async (kind: 'product' | 'offer' | 'event' | 'contact' | 'gastro' | 'realestate' | 'recruiting' | 'service') => {
    const base = (activeCard.title || activeCard.companyName || activeCard.heroCompany || 'Dein Angebot').trim();
    const presets = {
      product: {
        title: base,
        subtitle: 'Das Angebot, das sofort verstanden wird.',
        description: 'Zeige Nutzen, Qualität und nächsten Schritt in einer klickbaren Werbekarte.',
        template: 'premium_product',
      },
      offer: {
        title: 'Jetzt Angebot sichern',
        subtitle: base,
        description: 'Kurz ansehen, direkt reagieren und mit einem Klick anfragen.',
        template: 'offer_action',
      },
      event: {
        title: base,
        subtitle: 'Vor Ort sichtbar. Online sofort klickbar.',
        description: 'Perfekt für Messe, Bühne, Event und Produktpräsentation.',
        template: 'event_messe',
      },
      contact: {
        title: base,
        subtitle: 'Kontakt aufnehmen, speichern oder direkt anfragen.',
        description: 'Alle wichtigen Aktionen kompakt auf einer interaktiven Karte.',
        template: 'contact_premium',
      },
      gastro: {
        title: 'Heute reservieren',
        subtitle: base,
        description: 'Speisekarte öffnen, Tisch buchen und direkt Kontakt aufnehmen.',
        template: 'social_reel',
      },
      realestate: {
        title: base,
        subtitle: 'Objekt ansehen. Exposé öffnen. Besichtigung anfragen.',
        description: 'Alle Informationen kompakt als klickbare Immobilien-Werbekarte.',
        template: 'real_estate',
      },
      recruiting: {
        title: 'Jetzt bewerben',
        subtitle: base,
        description: 'Job ansehen, Kontakt aufnehmen und Bewerbung direkt starten.',
        template: 'business_clean',
      },
      service: {
        title: 'Service direkt buchen',
        subtitle: base,
        description: 'Leistung verstehen, Angebot anfragen und sofort handeln.',
        template: 'offer_action',
      },
    }[kind];
    const preset = UREEL_TEXT_TEMPLATES[presets.template];
    const currentTitle = (textDirty ? textDraft.title : activeCard.title || '').trim();
    const currentSubtitle = (textDirty ? textDraft.subtitle : activeCard.subtitle || '').trim();
    const currentDescription = (textDirty ? textDraft.description : activeCard.description || '').trim();
    const nextTitle = currentTitle || presets.title;
    const nextSubtitle = currentSubtitle || presets.subtitle;
    const nextDescription = currentDescription || presets.description;
    setTextDraft({ title: nextTitle, subtitle: nextSubtitle, description: nextDescription });
    setTextDirty(false);
    await syncCardUpdate({
      title: nextTitle,
      subtitle: nextSubtitle,
      description: nextDescription,
      ureelTextTemplate: preset ? {
        id: preset.id,
        style: preset.id,
        animation: preset.defaultAnimation,
        emphasis: { ...preset.defaultEmphasis },
        frame: { type: preset.defaultFrame, color: '#E8DCC2', opacity: 100 },
        box: { type: preset.defaultBox, opacity: 85 },
        fontStyle: preset.defaultFontStyle,
      } as any : activeCard.ureelTextTemplate,
    });
    triggerToast(lang === 'de' ? 'Werbetext-Vorlage angewendet.' : 'Ad copy preset applied.', 'success');
  };


  // Sync update single button helper
  const handleUpdateSingleButton = async (btnId: string, updates: Partial<CardButton>) => {
    if (!activeCard) return;
    const updatedButtons = activeCard.buttons.map(b => {
      if (b.id === btnId) {
        return { ...b, ...updates };
      }
      return b;
    });
    await syncCardUpdate({ buttons: updatedButtons });
  };


  const fileActionTypes = ['pdf_link', 'external_file_link', 'google_drive_file', 'dropbox_file', 'onedrive_file', 'download_area'];
  const cloudLinkActionTypes = ['google_drive_folder', 'dropbox_folder', 'onedrive_folder'];
  const isFileUploadAction = (actionType?: string) => fileActionTypes.includes(actionType || '');
  const isCloudLinkAction = (actionType?: string) => cloudLinkActionTypes.includes(actionType || '');

  const getActionInputMeta = (actionType?: string) => {
    switch (actionType) {
      case 'phone': return { label: 'Telefonnummer', placeholder: '+43 660 1234567', helper: 'Direktanruf auf Smartphones.' };
      case 'whatsapp': return { label: 'WhatsApp-Nummer', placeholder: '+43 660 1234567', helper: 'Nummer im internationalen Format.' };
      case 'email': return { label: 'E-Mail-Adresse', placeholder: 'name@firma.at', helper: 'Öffnet das Mailprogramm des Besuchers.' };
      case 'maps': return { label: 'Adresse / Maps-Link', placeholder: 'Adresse oder Google-Maps-Link', helper: 'Route oder Standort öffnen.' };
      case 'pdf_link': return { label: 'PDF-Datei', placeholder: 'PDF hochladen oder Link einfügen', helper: 'Lade ein PDF hoch oder nutze einen vorhandenen PDF-Link.' };
      case 'external_file_link': return { label: 'Datei', placeholder: 'Datei hochladen oder Link einfügen', helper: 'PDF, Bild oder Datei als anklickbare Ressource.' };
      case 'download_area': return { label: 'Download-Datei', placeholder: 'Datei hochladen oder Link einfügen', helper: 'MVP: eine Datei oder ein externer Download-Link.' };
      case 'google_drive_file': return { label: 'Google-Drive-Datei', placeholder: 'Drive-Link einfügen oder Datei hochladen', helper: 'Für Drive-Dateien reicht meist ein Freigabelink.' };
      case 'dropbox_file': return { label: 'Dropbox-Datei', placeholder: 'Dropbox-Link einfügen oder Datei hochladen', helper: 'Freigabelink oder direkter Upload.' };
      case 'onedrive_file': return { label: 'OneDrive-Datei', placeholder: 'OneDrive-Link einfügen oder Datei hochladen', helper: 'Freigabelink oder direkter Upload.' };
      case 'google_drive_folder': return { label: 'Google-Drive-Ordnerlink', placeholder: 'https://drive.google.com/drive/folders/...', helper: 'Ordner können nicht hochgeladen werden. Bitte Freigabelink einfügen.' };
      case 'dropbox_folder': return { label: 'Dropbox-Ordnerlink', placeholder: 'https://www.dropbox.com/scl/fo/...', helper: 'Ordner können nicht hochgeladen werden. Bitte Freigabelink einfügen.' };
      case 'onedrive_folder': return { label: 'OneDrive-Ordnerlink', placeholder: 'https://1drv.ms/f/...', helper: 'Ordner können nicht hochgeladen werden. Bitte Freigabelink einfügen.' };
      case 'video_replay': return { label: 'Keine Zieladresse nötig', placeholder: '', helper: 'Dieser Button startet die ureel-Timeline neu.' };
      case 'vcard': return { label: 'Kontakt speichern', placeholder: '', helper: 'Nutzt die Kontaktdaten der ureel-Seite.' };
      case 'contact_form':
      case 'inquiry_form': return { label: 'Formular-Aktion', placeholder: '', helper: 'Öffnet das integrierte Anfrageformular.' };
      default: return { label: 'Ziel-Adresse / Ziel-Wert', placeholder: 'https://...', helper: 'Webseite oder Landingpage öffnen.' };
    }
  };

  const handleButtonFileUpload = async (btnId: string, file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du Dateien hochlädst.' : 'Please log in before uploading files.', 'error');
      return;
    }
    if (!file) return;
    const type = editingButton?.actionType || 'external_file_link';
    if (type === 'pdf_link' && file.type && file.type !== 'application/pdf') {
      triggerToast(lang === 'de' ? 'Für „PDF öffnen“ bitte eine PDF-Datei wählen.' : 'Please choose a PDF file.', 'error');
      return;
    }
    const maxMb = type === 'pdf_link' ? 20 : 50;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Datei ist zu groß. Maximal ${maxMb} MB.` : `File is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/button-files/${btnId}/${cleanName}`;
    try {
      setButtonFileUploading(true);
      setButtonFileUploadProgress(0);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'application/octet-stream' });
        task.on('state_changed',
          (snap) => setButtonFileUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await handleUpdateSingleButton(btnId, {
        actionValue: downloadUrl,
        fileName: file.name,
        fileUrl: downloadUrl,
        storagePath,
      } as any);
      triggerToast(lang === 'de' ? 'Datei hochgeladen und als Button-Ziel gesetzt.' : 'File uploaded and set as button target.', 'success');
    } catch (err: any) {
      console.error('Button file upload failed', err);
      triggerToast(lang === 'de' ? `Upload fehlgeschlagen: ${err?.message || err}. Prüfe Firebase Storage, Storage-Regeln und Vercel-Variable VITE_FIREBASE_STORAGE_BUCKET.` : `Upload failed: ${err?.message || err}. Check Firebase Storage, Storage rules and VITE_FIREBASE_STORAGE_BUCKET.`, 'error');
    } finally {
      setButtonFileUploading(false);
      setTimeout(() => setButtonFileUploadProgress(null), 1200);
    }
  };

  const makeStarterButton = (id: string, title: string, actionType: string, actionValue: string, icon: string, position: number): CardButton => ({
    id,
    title,
    actionType,
    actionValue,
    icon,
    iconId: icon,
    position,
    isActive: true,
    radius: 'rounded',
    buttonShape: 'round' as any,
    styleVariant: 'filled',
    bgMode: 'solid' as any,
    bgColor: '#F5F2EA',
    backgroundColor: '#F5F2EA',
    textColor: '#1A1A1A',
    iconColor: '#1A1A1A',
    borderColor: '#E8DCC2',
    borderEnabled: true,
    borderWidth: 'thin',
    borderStyle: 'solid',
    shadow: 'soft',
    shadowColor: 'rgba(0,0,0,0.22)',
    glow: 'none',
    buttonImageUrl: '',
    imageUrl: '',
    buttonImageFit: 'cover',
    imageMode: 'cover',
    buttonImageOverlay: false,
    imageOverlay: 'none',
    imageDarken: 0 as any,
    iconEnabled: true,
    iconPosition: 'top',
    iconSize: 13,
    iconCircleBg: true as any,
    iconCircleColor: 'rgba(26,26,26,0.18)' as any,
    fontFamily: 'Inter',
    fontSize: 7.6,
    fontWeight: 'bold',
    letterSpacing: 0,
    textWrap: 'single',
    textAlign: 'center',
    textPosition: 'bottom',
    labelPosition: 'bottom',
    buttonSize: { preset: 'standard', scale: 0.76 } as any,
    animation: 'none',
  });

  const makeStarterButtonSet = (): CardButton[] => [
    makeStarterButton('phone', lang === 'de' ? 'Telefon' : 'Phone', 'phone', '', 'Phone', 0),
    makeStarterButton('website', lang === 'de' ? 'Webseite' : 'Website', 'url', '', 'ExternalLink', 1),
    makeStarterButton('mail', lang === 'de' ? 'Mail' : 'Mail', 'email', '', 'Mail', 2),
    makeStarterButton('folder', lang === 'de' ? 'Folder' : 'Folder', 'external_file_link', '', 'FolderOpen', 3),
    makeStarterButton('company', lang === 'de' ? 'Unternehmen' : 'Company', 'contact_form', '', 'Building2', 4),
    makeStarterButton('file', lang === 'de' ? 'Datei' : 'File', 'pdf_link', '', 'FileText', 5),
  ];

  const handleApplyStarterButtons = async () => {
    await syncCardUpdate({
      buttons: makeStarterButtonSet(),
      videoBackgroundConfig: {
      profileTextReveals: [
        { fieldKey: 'title', enabled: true, startSecond: 0.3, fadeDuration: 0.8, staysVisibleAfterSequence: true },
        { fieldKey: 'subtitle', enabled: true, startSecond: 1.0, fadeDuration: 0.8, staysVisibleAfterSequence: true },
        { fieldKey: 'description', enabled: true, startSecond: 1.8, fadeDuration: 0.8, staysVisibleAfterSequence: true },
      ],
      buttonReveal: { enabled: true, startSecond: 2.8, duration: 0.8, style: 'soft' },
      durationSeconds: 12,
      duration: 12,
    } as any,
    buttonGridCols: 3 as any,
      buttonSizePx: 52 as any,
      buttonGapPx: 10 as any,
      buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), mode: 'grid', cols: 3, square: true, buttonSizePx: 52, gapPx: 10, gap: 10 } as any,
    });
    setEditingBtnId('phone');
    setActiveTab('buttons');
    setActiveSubSection('buttons-list');
    triggerToast(lang === 'de' ? 'Die 6 vorkonfigurierten ureel-Startbuttons wurden eingesetzt.' : 'Starter buttons applied.', 'success');
  };

  const createStarterUreelTemplate = (): Partial<Card> => ({
    title: lang === 'de' ? 'Deine neue ureel-Seite' : 'Your new ureel page',
    subtitle: lang === 'de' ? 'Deine Welt. Dein Link.' : 'Your world. Your link.',
    description: lang === 'de' ? 'Telefon, Webseite, Mail, Folder, Unternehmen und Datei sind bereits vorbereitet.' : 'Phone, website, mail, folder, company and file are already prepared.',
    heroTitle: lang === 'de' ? 'Deine neue ureel-Seite' : 'Your new ureel page',
    heroSubtitle: lang === 'de' ? 'Deine Welt. Dein Link.' : 'Your world. Your link.',
    heroDescription: lang === 'de' ? 'Telefon, Webseite, Mail, Folder, Unternehmen und Datei sind bereits vorbereitet.' : 'Phone, website, mail, folder, company and file are already prepared.',
    isPublished: true,
    visibility: 'public' as any,
    backgroundType: 'gradient',
    backgroundColor: '#111111',
    backgroundImageUrl: '',
    backgroundImageFit: 'cover',
    cardBackgroundEnabled: true,
    cardBackgroundImageUrl: '',
    cardBackgroundMode: 'cover',
    cardBackgroundDarken: 12,
    cardBackgroundSaturation: 100,
    cardBackgroundGradientEnabled: true,
    cardBackgroundColor: '#101010',
    cardBackgroundGradientColor: '#312A22',
    cardBackgroundGradientDirection: '135deg',
    buttonGridCols: 3 as any,
    buttonSizePx: 52 as any,
    buttonGapPx: 10 as any,
    buttonColor: '#F5F2EA',
    buttonTextColor: '#1A1A1A',
    buttonGridLayout: { mode: 'grid', cols: 3, square: true, buttonSizePx: 52, gapPx: 10, gap: 10, align: 'center' } as any,
    heroTextColor: 'cream' as any,
    heroTitleSize: 26 as any,
    heroSubtitleSize: 13 as any,
    heroDescriptionSize: 10.5 as any,
    heroFontFamily: 'Inter' as any,
    heroTitleTextColor: 'cream' as any,
    heroSubtitleTextColor: 'cream' as any,
    heroDescTextColor: 'cream' as any,
    ureelScene: {
      mode: 'gradient',
      backgroundImageUrl: '',
      backgroundColor: '#111111',
      gradient: { from: '#0F0F0F', to: '#3A3328', direction: '135deg' },
      overlay: { darken: 18, blur: 0, vignette: true },
      video: { type: 'none', url: '', duration: 12, displayMode: 'cover', placement: 'background', startAt: 0 },
    } as any,
    ureelTimeline: { preset: 'starter', titleAt: 0.3, subtitleAt: 1.0, descriptionAt: 1.8, buttonsAt: 2.8, endCardAt: 12 } as any,
    ureelTextTemplate: {
      id: 'ureel_starter',
      style: 'premium_product',
      animation: 'fade',
      animationDuration: 1.2,
      frame: { type: 'corner', color: '#E8DCC2', opacity: 100 },
      box: { type: 'glass', opacity: 72 },
      fontStyle: 'elegant',
      emphasis: { mode: 'last_word', color: '#E8DCC2' },
      blockMode: true,
    } as any,
    buttons: makeStarterButtonSet(),
    desktopPage: {
      layout: 'phone_left',
      backgroundMode: 'gradient',
      gradientFrom: '#0F0F0F',
      gradientTo: '#3A3328',
      imageDarken: 34,
      contentMode: 'from_card',
      showQr: true,
      showShare: true,
      showContactSave: true,
    } as any,
  });

  // Helper to add button
  const handleAddButtonLocal = async () => {
    if (!activeCard) return;
    const limit = effectivePlanId === 'free' ? 4 : 20;
    if (activeCard.buttons && activeCard.buttons.length >= limit) {
      triggerToast(lang === 'de' ? 'Spitzen-Limit für Ihren Tarif erreicht!' : 'Button limit reached for your plan!', 'error');
      return;
    }
    const newBtn = createDefaultButton(undefined, activeCard.buttons?.length || 0);
    const list = [...(activeCard.buttons || []), newBtn];
    await syncCardUpdate({ buttons: list });
    setEditingBtnId(newBtn.id);
    setActiveTab('buttons');
    setActiveSubSection('buttons-list');
    triggerToast(lang === 'de' ? 'Schaltfläche hinzugefügt' : 'Button added successfully', 'success');
  };



  const handleDuplicateUreel = async (cardToDuplicate: Card) => {
    try {
      const { cardId, ownerId, createdAt, updatedAt, slug, ...rest } = cardToDuplicate as any;
      const nextSlugBase = (slug || cardToDuplicate.title || 'ureel').toString().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36) || 'ureel';
      const duplicatePayload = {
        ...rest,
        title: `${cardToDuplicate.title || 'ureel'} Kopie`,
        slug: `${nextSlugBase}-kopie-${Date.now().toString(36).slice(-5)}`,
        isPublished: false,
        visibility: 'draft' as any,
      } as Partial<Card>;
      const created = await createNewCard(duplicatePayload, lang);
      setActiveCard(created);
      setActiveTab('scene');
      setActiveSubSection('scene-video');
      triggerToast(lang === 'de' ? 'ureel wurde dupliziert.' : 'ureel duplicated.', 'success');
    } catch (err: any) {
      triggerToast(lang === 'de' ? `Duplizieren fehlgeschlagen: ${err?.message || err}` : `Duplicate failed: ${err?.message || err}`, 'error');
    }
  };

  const handleDeleteUreel = async (cardToDelete: Card) => {
    if (!deleteCard) {
      triggerToast(lang === 'de' ? 'Löschen ist hier noch nicht verbunden.' : 'Delete is not connected yet.', 'error');
      return;
    }
    if (cards.length <= 1) {
      triggerToast(lang === 'de' ? 'Mindestens eine ureel muss bestehen bleiben.' : 'At least one ureel must remain.', 'error');
      return;
    }
    const ok = window.confirm(lang === 'de' ? `„${cardToDelete.title || cardToDelete.slug}“ wirklich löschen?` : `Delete “${cardToDelete.title || cardToDelete.slug}”?`);
    if (!ok) return;
    try {
      await deleteCard(cardToDelete.cardId);
      const next = cards.find((c) => c.cardId !== cardToDelete.cardId) || null;
      setActiveCard(next);
      triggerToast(lang === 'de' ? 'ureel wurde gelöscht.' : 'ureel deleted.', 'success');
    } catch (err: any) {
      triggerToast(lang === 'de' ? `Löschen fehlgeschlagen: ${err?.message || err}` : `Delete failed: ${err?.message || err}`, 'error');
    }
  };

  const handleCreateNewUreel = async () => {
    try {
      const created = await createNewCard(createStarterUreelTemplate(), lang);
      setActiveCard(created);
      setActiveTab('scene');
      setActiveSubSection('scene-video');
      triggerToast(lang === 'de' ? 'Neue ureel wurde erstellt.' : 'New ureel created.', 'success');
    } catch (err: any) {
      console.error('Create ureel failed', err);
      triggerToast(lang === 'de' ? `Neue ureel konnte nicht erstellt werden: ${err?.message || err}` : `Could not create ureel: ${err?.message || err}`, 'error');
    }
  };

  // Delete button
  const handleDeleteButtonLocal = async (btnId: string) => {
    if (!activeCard) return;
    const remaining = activeCard.buttons.filter(b => b.id !== btnId);
    await syncCardUpdate({ buttons: remaining });
    if (editingBtnId === btnId) {
      setEditingBtnId(remaining[0]?.id || null);
    }
    triggerToast(lang === 'de' ? 'Schaltfläche gelöscht' : 'Button removed successfully', 'success');
  };

  // Copy button text/config to clipboard without changing the card.
  const handleCopyButtonLocal = (btn: CardButton) => {
    const cleanButton = sanitizeButtonForFirestore(btn);
    const payload = JSON.stringify(cleanButton, null, 2);
    const ok = copyTextToClipboard(payload);
    triggerToast(
      ok
        ? (lang === 'de' ? 'Button-Konfiguration kopiert.' : 'Button configuration copied.')
        : (lang === 'de' ? 'Kopieren nicht möglich.' : 'Copy failed.'),
      ok ? 'success' : 'error'
    );
  };

  // Duplicate button
  const handleDuplicateButtonLocal = async (btn: CardButton) => {
    if (!activeCard) return;
    const duplicated: CardButton = {
      ...btn,
      id: `btn_${Date.now()}`,
      title: `${btn.title} (Kopie)`,
      position: (activeCard.buttons?.length || 0) + 1,
    };
    const list = [...(activeCard.buttons || []), duplicated];
    await syncCardUpdate({ buttons: list });
    setEditingBtnId(duplicated.id);
    triggerToast(lang === 'de' ? 'Schaltfläche dupliziert' : 'Button duplicated', 'success');
  };

  // Move button order in the button list and keep positions clean
  const handleMoveButtonLocal = async (btnId: string, direction: -1 | 1) => {
    if (!activeCard) return;
    const sorted = [...(activeCard.buttons || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const currentIndex = sorted.findIndex((b) => b.id === btnId);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const next = [...sorted];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;
    const reordered = next.map((b, index) => ({ ...b, position: index }));
    await syncCardUpdate({ buttons: reordered });
    setEditingBtnId(btnId);
    triggerToast(lang === 'de' ? 'Button-Reihenfolge aktualisiert.' : 'Button order updated.', 'success');
  };

  // Toggle buttons group lock or hide
  const handleToggleElementInReelLocal = (elementKey: string) => {
    const config = activeCard.reelExportConfig || {};
    const updatedConfig = {
      ...config,
      [elementKey]: config[elementKey] !== false ? false : true
    };
    syncCardUpdate({ reelExportConfig: updatedConfig });
  };

  // Design Presets application
  const applyDesignPreset = async (preset: string) => {
    switch (preset) {
      case 'elegant-violet':
        await syncCardUpdate({
          cardBackgroundColor: '#0A0514',
          cardBackgroundGradientEnabled: true,
          cardBackgroundGradientColor: '#22143B',
          cardBackgroundGradientDirection: 'to-bottom',
          heroTextColor: 'white',
          buttonColor: '#A855F7',
          buttonTextColor: '#FFFFFF',
          heroAccentColor: '#A855F7',
        });
        break;
      case 'dark-cosmic':
        await syncCardUpdate({
          cardBackgroundColor: '#0B0A09',
          cardBackgroundGradientEnabled: true,
          cardBackgroundGradientColor: '#1F1F22',
          cardBackgroundGradientDirection: 'to-br',
          heroTextColor: 'white',
          buttonColor: '#27272A',
          buttonTextColor: '#FFFFFF',
          heroAccentColor: '#8B5CF6',
        });
        break;
      case 'clean-tech':
        await syncCardUpdate({
          cardBackgroundColor: '#111111',
          cardBackgroundGradientEnabled: false,
          heroTextColor: 'white',
          buttonColor: '#18181B',
          buttonTextColor: '#A855F7',
          heroAccentColor: '#A855F7',
          buttonStyle: 'outline',
          heroFontFamily: 'JetBrains Mono',
        });
        break;
      case 'warm-copper':
        await syncCardUpdate({
          cardBackgroundColor: '#140E0C',
          cardBackgroundGradientEnabled: true,
          cardBackgroundGradientColor: '#3B1F15',
          cardBackgroundGradientDirection: 'to-bottom',
          heroTextColor: 'white',
          buttonColor: '#3B1F15',
          buttonTextColor: '#FDE047',
          heroAccentColor: '#F43F5E',
        });
        break;
      case 'elegant-gold':
        await syncCardUpdate({
          cardBackgroundColor: '#121212',
          cardBackgroundGradientEnabled: true,
          cardBackgroundGradientColor: '#2B2313',
          cardBackgroundGradientDirection: 'to-bottom',
          heroTextColor: 'cream' as any,
          buttonColor: '#C9A646',
          buttonTextColor: '#0F0F0B',
          heroAccentColor: '#C9A646',
        });
        break;
    }
    triggerToast(lang === 'de' ? 'Design-Preset angewendet' : 'Design preset applied successfully', 'success');
  };

  const getTimelineDuration = () => {
    const raw = activeCard.ureelScene?.video?.duration || activeCard.videoBackgroundConfig?.durationSeconds || activeCard.videoBackgroundConfig?.duration || 12;
    return Math.max(12, Math.min(15, Number(raw) || 12));
  };

  const clampTime = (value: number) => {
    const duration = getTimelineDuration();
    const rounded = Math.round(value * 10) / 10;
    return Math.max(0, Math.min(duration, rounded));
  };

  const valuesForTimelinePreset = (preset: UreelTimeline['preset'], duration = getTimelineDuration()): Required<UreelTimeline> => {
    if (preset === 'short_intro') {
      return { preset, titleAt: 3, subtitleAt: 4, descriptionAt: 5, buttonsAt: 6, endCardAt: duration };
    }
    if (preset === 'ad_reel') {
      return duration >= 15
        ? { preset, titleAt: 10.5, subtitleAt: 11.5, descriptionAt: 12.5, buttonsAt: 13.5, endCardAt: 15 }
        : { preset, titleAt: 7.5, subtitleAt: 8.5, descriptionAt: 9.5, buttonsAt: 10.5, endCardAt: 12 };
    }
    if (preset === 'manual') {
      const current = activeCard.ureelTimeline;
      return {
        preset,
        titleAt: clampTime(current?.titleAt ?? 0),
        subtitleAt: clampTime(current?.subtitleAt ?? 0.2),
        descriptionAt: clampTime(current?.descriptionAt ?? 0.4),
        buttonsAt: clampTime(current?.buttonsAt ?? 0.6),
        endCardAt: clampTime(current?.endCardAt ?? duration),
      };
    }
    return { preset: 'direct', titleAt: 0, subtitleAt: 0.2, descriptionAt: 0.4, buttonsAt: 0.6, endCardAt: duration };
  };

  const currentTimeline = valuesForTimelinePreset(activeCard.ureelTimeline?.preset || 'direct');
  const timeline = {
    ...currentTimeline,
    ...(activeCard.ureelTimeline || {}),
    preset: activeCard.ureelTimeline?.preset || currentTimeline.preset,
  } as Required<UreelTimeline>;
  const timelineDuration = getTimelineDuration();
  const endCard = activeCard.ureelEndCard || {
    enabled: false,
    source: 'scene' as const,
    backgroundColor: '#111111',
    gradient: { from: '#111111', to: '#271044', direction: '135deg' },
    replayButton: true,
  };

  const getTextLayerDraftValue = (fieldKey: 'title' | 'subtitle' | 'description') => {
    if (fieldKey === 'title') return textDirty ? textDraft.title : (activeCard.title || '');
    if (fieldKey === 'subtitle') return textDirty ? textDraft.subtitle : (activeCard.subtitle || '');
    return textDirty ? textDraft.description : (activeCard.description || '');
  };

  const hasTextLayerContent = (fieldKey: 'title' | 'subtitle' | 'description') => {
    return getTextLayerDraftValue(fieldKey).trim().length > 0;
  };

  const isTextLayerEnabled = (fieldKey: 'title' | 'subtitle' | 'description') => {
    const item = activeCard.videoBackgroundConfig?.profileTextReveals?.find((r: any) => r.fieldKey === fieldKey);
    return item?.enabled !== false;
  };

  const isTextLayerVisible = (fieldKey: 'title' | 'subtitle' | 'description') => {
    return isTextLayerEnabled(fieldKey) && hasTextLayerContent(fieldKey);
  };

  const setTextLayerEnabled = async (fieldKey: 'title' | 'subtitle' | 'description', enabled: boolean) => {
    const current = activeCard.videoBackgroundConfig?.profileTextReveals || [];
    const startMap: Record<string, number> = { title: timeline.titleAt, subtitle: timeline.subtitleAt, description: timeline.descriptionAt };
    const fields: Array<'title' | 'subtitle' | 'description'> = ['title', 'subtitle', 'description'];
    const profileTextReveals = fields.map((key) => {
      const existing = current.find((r: any) => r.fieldKey === key) || {};
      return {
        ...existing,
        fieldKey: key,
        enabled: key === fieldKey ? enabled : existing.enabled !== false,
        startSecond: startMap[key],
        fadeDuration: existing.fadeDuration ?? 0.8,
        staysVisibleAfterSequence: existing.staysVisibleAfterSequence ?? true,
      };
    });
    await syncCardUpdate({
      videoBackgroundConfig: {
        ...(activeCard.videoBackgroundConfig || {}),
        profileTextReveals,
      } as any,
    });
  };

  const syncTimelineToLegacyVideoConfig = (next: Required<UreelTimeline> & any, duration = timelineDuration) => {
    const blockStart = typeof next.adTextAt === 'number' ? next.adTextAt : next.titleAt;
    const revealDuration = adAnimationDuration;
    const revealStart = (field: 'title' | 'subtitle' | 'description') => {
      if (isAdCopyBlockEnabled) return blockStart;
      if (field === 'title') return next.titleAt;
      if (field === 'subtitle') return next.subtitleAt;
      return next.descriptionAt;
    };
    return {
      ...(activeCard.videoBackgroundConfig || {}),
      durationSeconds: duration,
      duration,
      profileTextReveals: [
        { fieldKey: 'title', enabled: isTextLayerVisible('title'), startSecond: revealStart('title'), fadeDuration: revealDuration, staysVisibleAfterSequence: true },
        { fieldKey: 'subtitle', enabled: isTextLayerVisible('subtitle'), startSecond: revealStart('subtitle'), fadeDuration: revealDuration, staysVisibleAfterSequence: true },
        { fieldKey: 'description', enabled: isTextLayerVisible('description'), startSecond: revealStart('description'), fadeDuration: revealDuration, staysVisibleAfterSequence: true },
      ],
      buttonReveal: {
        ...(activeCard.videoBackgroundConfig?.buttonReveal || {}),
        enabled: true,
        startSecond: next.buttonsAt,
        endSecond: Math.min(duration, next.buttonsAt + 0.8),
        duration: 0.8,
        style: activeCard.videoBackgroundConfig?.buttonReveal?.style || 'soft',
      },
    };
  };

  const applyTimeline = async (next: Required<UreelTimeline>, duration = timelineDuration) => {
    await syncCardUpdate({
      ureelTimeline: next,
      videoBackgroundConfig: syncTimelineToLegacyVideoConfig(next, duration) as any,
      ureelScene: {
        ...(activeCard.ureelScene || { mode: 'color' as const }),
        video: {
          ...(activeCard.ureelScene?.video || { type: 'none' as const, displayMode: 'cover' as const }),
          duration,
        }
      } as any,
    });
  };

  const updateTimelineField = async (field: keyof Omit<UreelTimeline, 'preset'>, value: number) => {
    const next = { ...timeline, preset: 'manual' as const, [field]: clampTime(value) } as Required<UreelTimeline>;
    await applyTimeline(next);
  };

  const updateTimelineAnyField = async (field: string, value: number) => {
    const next = { ...(timeline as any), ...(activeCard.ureelTimeline as any), preset: 'manual', [field]: clampTime(value) } as any;
    await applyTimeline(next);
  };

  const setAdCopyBlockMode = async (enabled: boolean) => {
    const blockStart = typeof (activeCard.ureelTimeline as any)?.adTextAt === 'number' ? (activeCard.ureelTimeline as any).adTextAt : timeline.titleAt;
    const nextTimeline: any = { ...(timeline as any), ...(activeCard.ureelTimeline as any), preset: 'manual', adTextAt: blockStart };
    await syncCardUpdate({
      ureelTimeline: nextTimeline,
      ureelTextTemplate: {
        ...(activeCard.ureelTextTemplate || currentTextTemplate),
        blockModeEnabled: enabled,
      } as any,
      videoBackgroundConfig: {
        ...(syncTimelineToLegacyVideoConfig(nextTimeline) as any),
        profileTextReveals: ['title','subtitle','description'].map((fieldKey: any) => ({
          fieldKey,
          enabled: isTextLayerVisible(fieldKey),
          startSecond: enabled ? blockStart : (fieldKey === 'title' ? timeline.titleAt : fieldKey === 'subtitle' ? timeline.subtitleAt : timeline.descriptionAt),
          fadeDuration: adAnimationDuration,
          staysVisibleAfterSequence: true,
        })),
      } as any,
    });
  };

  const applyDuration = async (duration: 12 | 15) => {
    const next = valuesForTimelinePreset(timeline.preset, duration);
    await applyTimeline(next, duration);
  };

  const setEndCard = async (updates: Partial<UreelEndCard>) => {
    await syncCardUpdate({
      ureelEndCard: {
        ...endCard,
        ...updates,
      } as UreelEndCard
    });
  };

  const restartPreviewSimulation = () => {
    setTimelineSec(0);
    setIsPlaying(true);
    window.dispatchEvent(new CustomEvent('ureel-timeline-reset'));
  };


  const activeButtons = (activeCard.buttons || []).filter((button) => button.isActive !== false);
  const buttonGridCols = activeCard.buttonGridCols || activeCard.buttonGridLayout?.cols || 3;
  const buttonSizePx = activeCard.buttonGridLayout?.buttonSizePx || activeCard.buttonSizePx || 72;
  const buttonGapPx = activeCard.buttonGridLayout?.gapPx || activeCard.buttonGridLayout?.gap || activeCard.buttonGapPx || 10;
  const visibleButtonsAt = Number(timeline.buttonsAt || 0.6);
  const buttonsCurrentlyVisible = timelineSec >= visibleButtonsAt || !isPlaying;

  const desktopPage = (activeCard.desktopPage || {}) as any;
  const desktopLayout = desktopPage.layout || 'desktop_triptych';
  // Desktop-Miniwebseite: öffentliche Desktop-Ansicht immer nebeneinander darstellen.
  // So sieht der Nutzer im Editor dieselbe Seitenlogik wie später im Live-Link.
  const desktopPreviewGridClass = desktopLayout === 'phone_center'
    ? 'grid-cols-[minmax(220px,1fr)_240px_minmax(240px,1fr)]'
    : desktopLayout === 'phone_left'
    ? 'grid-cols-[250px_minmax(240px,1fr)_minmax(240px,1fr)]'
    : desktopLayout === 'minimal'
    ? 'grid-cols-[220px_minmax(240px,1fr)_minmax(220px,0.85fr)]'
    : 'grid-cols-[250px_minmax(240px,1fr)_minmax(240px,1fr)]';
  const desktopPhoneOrder = desktopLayout === 'phone_center' ? 'order-2' : 'order-1';
  const desktopTextOrder = desktopLayout === 'phone_center' ? 'order-1' : 'order-2';
  const desktopButtonsOrder = desktopLayout === 'phone_center' ? 'order-3' : 'order-3';
  const desktopTitle = desktopPage.contentMode === 'custom' && desktopPage.title ? desktopPage.title : (activeCard.title || 'Deine ureel');
  const desktopSubtitle = desktopPage.contentMode === 'custom' && desktopPage.subtitle ? desktopPage.subtitle : (activeCard.subtitle || 'Aus Video wird Aktion.');
  const desktopDescription = desktopPage.contentMode === 'custom' && desktopPage.description ? desktopPage.description : (activeCard.description || 'Öffne die Karte am Smartphone und starte direkt die nächste Aktion.');
  const qrPayload = currentSlugUrl || `https://ureel.me/${activeCard.slug || ''}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(qrPayload)}`;
  const contactDisplayName = `Ureel – ${activeCard.companyName || activeCard.title || profile?.displayName || 'Kontakt'}`;
  const desktopButtonLayout = desktopPage.buttonLayout || 'three_col';
  const desktopButtonsVisible = desktopPage.showActionButtons !== false;
  const desktopButtonAreaStyle: React.CSSProperties = desktopPage.buttonAreaBackgroundMode === 'image' && desktopPage.buttonAreaBackgroundImageUrl
    ? { background: `linear-gradient(rgba(0,0,0,${(desktopPage.buttonAreaDarken ?? 18)/100}), rgba(0,0,0,${(desktopPage.buttonAreaDarken ?? 18)/100})), url(${desktopPage.buttonAreaBackgroundImageUrl}) center/cover no-repeat` }
    : desktopPage.buttonAreaBackgroundMode === 'gradient'
    ? { background: `linear-gradient(135deg, ${desktopPage.buttonAreaGradientFrom || '#181818'}, ${desktopPage.buttonAreaGradientTo || '#3A3328'})` }
    : { background: 'rgba(15,15,15,0.52)' };
  const renderDesktopButtonArea = () => {
    if (desktopPage.showActionButtons === false || !desktopButtonsVisible || activeButtons.length === 0) {
      return <div className="rounded-2xl border border-[#E8DCC2]/20 bg-black/30 p-4 text-center text-[10px] text-[#F5F2EA]/65">Nutzerbuttons sind für diese Desktop-Webseite ausgeblendet.</div>;
    }
    const desktopButtons = activeButtons.slice(0, 18);
    const roundButton = (button: any) => ({ ...button, buttonShape: 'round', radius: 'pill', iconPosition: button.iconPosition || 'top', iconCircleBg: true });

    if (desktopButtonLayout === 'circle') {
      const positions = [
        'left-1/2 top-0 -translate-x-1/2',
        'right-2 top-1/4 -translate-y-1/2',
        'right-6 bottom-8',
        'left-1/2 bottom-0 -translate-x-1/2',
        'left-6 bottom-8',
        'left-2 top-1/4 -translate-y-1/2',
      ];
      return <div className="relative h-[285px] max-w-[285px] mx-auto rounded-full border border-[#E8DCC2]/12 bg-black/18">
        {desktopButtons.slice(0, 6).map((button, index) => (
          <div key={button.id} className={`absolute w-[70px] h-[70px] ${positions[index] || 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}>
            <ButtonRenderer button={roundButton(button)} mode="public" lang={lang} forceSquare={true} forceSizePx={60} />
          </div>
        ))}
      </div>;
    }

    if (desktopButtonLayout === 'triangle') {
      const rows = [desktopButtons.slice(0, 1), desktopButtons.slice(1, 3), desktopButtons.slice(3, 6), desktopButtons.slice(6, 9)];
      return <div className="space-y-2 max-h-[300px] overflow-hidden">
        {rows.filter(row => row.length > 0).map((row, rowIndex) => (
          <div key={rowIndex} className={`grid gap-2 ${row.length === 1 ? 'grid-cols-1 max-w-[76px] mx-auto' : row.length === 2 ? 'grid-cols-2 max-w-[154px] mx-auto' : 'grid-cols-3'}`}>
            {row.map((button) => <div key={button.id} className="aspect-square"><ButtonRenderer button={roundButton(button)} mode="public" lang={lang} forceSquare={true} forceSizePx={58} /></div>)}
          </div>
        ))}
      </div>;
    }

    const size = desktopButtonLayout === 'compact_grid' ? 54 : 62;
    return <div className={`grid ${desktopButtonLayout === 'compact_grid' ? 'grid-cols-4 gap-2' : 'grid-cols-3 gap-2.5'} max-h-[300px] overflow-hidden`}>
      {desktopButtons.map((button) => (
        <div key={button.id} className="aspect-square flex items-center justify-center">
          <ButtonRenderer button={button} mode="public" lang={lang} forceSquare={true} forceSizePx={size} />
        </div>
      ))}
    </div>;
  };
  const updateDesktopPage = async (updates: Record<string, any>) => {
    await syncCardUpdate({ desktopPage: { ...(activeCard.desktopPage || {}), ...updates } as any } as any);
  };


  const ensureCurrentCardIsPublic = async () => {
    if (!activeCard) return '';
    const needsSlug = !activeCard.slug || activeCard.slug === 'undefined' || activeCard.slug === 'null';
    const fixedSlug = needsSlug ? makeSafeSlug(activeCard.title || activeCard.heroTitle || activeCard.cardId) : activeCard.slug;
    const updates: any = { isPublished: true, visibility: 'public' as any };
    if (needsSlug) updates.slug = fixedSlug;
    if (activeCard.isPublished !== true || activeCard.visibility !== 'public' || needsSlug) {
      await syncCardUpdate(updates);
    }
    return getPublicCardUrl(fixedSlug);
  };

  const openLiveLink = async () => {
    const url = await ensureCurrentCardIsPublic();
    if (!url) {
      triggerToast(lang === 'de' ? 'Live-Link konnte nicht erstellt werden.' : 'Live link could not be created.', 'error');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyLiveLink = async () => {
    const url = await ensureCurrentCardIsPublic();
    if (url && copyTextToClipboard(url)) {
      triggerToast(lang === 'de' ? 'Live-Link kopiert und Karte veröffentlicht.' : 'Live link copied and card published.', 'success');
    } else {
      triggerToast(lang === 'de' ? 'Link konnte nicht kopiert werden.' : 'Could not copy link.', 'error');
    }
  };

  const openWerbetexterFromDesign = async () => {
    await updateDesktopPage({ contentMode: 'from_card', lastEditorSource: 'design' });
    setActiveTab('timeline');
    setActiveSubSection('timeline-texts');
    setTextPreviewMode('text');
    triggerToast(lang === 'de' ? 'Werbetexter für die Desktop-Webseite geöffnet.' : 'Ad text editor opened for desktop page.', 'info');
  };



  const handleEndCardImageUpload = async (file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du ein Endkartenbild hochlädst.' : 'Please log in before uploading an end card image.', 'error');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'de' ? 'Bitte eine Bilddatei auswählen.' : 'Please choose an image file.', 'error');
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Endkartenbild ist zu groß. Maximal ${maxMb} MB.` : `End card image is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/endcard-images/${cleanName}`;
    try {
      setEndCardImageUploading(true);
      setEndCardImageUploadProgress(0);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });
        task.on('state_changed',
          (snap) => setEndCardImageUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await setEndCard({
        enabled: true,
        source: 'image',
        imageUrl: downloadUrl,
      });
      triggerToast(lang === 'de' ? 'Endkartenbild hochgeladen.' : 'End card image uploaded.', 'success');
    } catch (error: any) {
      console.error('End card upload failed', error);
      triggerToast(error?.code === 'storage/unauthorized'
        ? (lang === 'de' ? 'Upload nicht erlaubt. Bitte Firebase Storage-Regeln prüfen.' : 'Upload not allowed. Please check Firebase Storage rules.')
        : (lang === 'de' ? 'Endkartenbild konnte nicht hochgeladen werden.' : 'End card image could not be uploaded.'), 'error');
    } finally {
      setEndCardImageUploading(false);
      setEndCardImageUploadProgress(null);
    }
  };

  const handleSceneImageUpload = async (file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du Bilder hochlädst.' : 'Please log in before uploading images.', 'error');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'de' ? 'Bitte eine Bilddatei auswählen.' : 'Please choose an image file.', 'error');
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Bild ist zu groß. Maximal ${maxMb} MB.` : `Image is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/scene-images/${cleanName}`;
    try {
      setSceneImageUploading(true);
      setSceneImageUploadProgress(0);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });
        task.on('state_changed',
          (snap) => setSceneImageUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await syncCardUpdate({
        backgroundType: 'image',
        backgroundImageUrl: downloadUrl,
        cardBackgroundImageUrl: downloadUrl,
        cardBackgroundEnabled: true,
        videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false } as any,
        ureelScene: {
          ...(activeCard.ureelScene || {}),
          mode: 'image',
          backgroundImageUrl: downloadUrl,
          overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 }
        } as any,
      } as any);
      triggerToast(lang === 'de' ? 'Szenenbild hochgeladen und aktiviert.' : 'Scene image uploaded and activated.', 'success');
    } catch (err: any) {
      console.error('Scene image upload failed', err);
      triggerToast(lang === 'de' ? `Bild-Upload fehlgeschlagen: ${err?.message || err}` : `Image upload failed: ${err?.message || err}`, 'error');
    } finally {
      setSceneImageUploading(false);
      setTimeout(() => setSceneImageUploadProgress(null), 1200);
    }
  };


  const removeSceneImage = async () => {
    const hasVideo = !!(activeCard.videoBackgroundConfig?.enabled || activeCard.videoBackgroundConfig?.youtubeUrl || activeCard.ureelScene?.mode === 'video' || activeCard.ureelScene?.video?.url || activeCard.backgroundType === 'video');
    await syncCardUpdate({
      backgroundImageUrl: '',
      cardBackgroundImageUrl: '',
      cardBackgroundEnabled: true,
      backgroundType: hasVideo ? 'video' : 'color',
      ureelScene: {
        ...(activeCard.ureelScene || {}),
        mode: hasVideo ? 'video' : 'color',
        backgroundImageUrl: '',
        backgroundColor: activeCard.cardBackgroundColor || activeCard.ureelScene?.backgroundColor || '#101010',
        background: {
          ...((activeCard.ureelScene as any)?.background || {}),
          imageUrl: '',
          url: '',
        },
      } as any,
    } as any);
    triggerToast(lang === 'de' ? 'Szenenbild entfernt.' : 'Scene image removed.', 'success');
  };

  const removeSceneVideo = async () => {
    const hasImage = !!(activeCard.cardBackgroundImageUrl || (activeCard as any).backgroundImageUrl || activeCard.ureelScene?.backgroundImageUrl);
    await syncCardUpdate({
      backgroundType: hasImage ? 'image' : 'color',
      cardBackgroundEnabled: true,
      videoBackgroundConfig: {
        ...(activeCard.videoBackgroundConfig || {}),
        enabled: false,
        youtubeUrl: '',
        mediaMode: 'none',
        videoUrl: '',
      } as any,
      ureelScene: {
        ...(activeCard.ureelScene || {}),
        mode: hasImage ? 'image' : 'color',
        video: {
          ...(activeCard.ureelScene?.video || {}),
          type: 'none',
          url: '',
          placement: 'background',
          duration: activeCard.ureelScene?.video?.duration || activeCard.videoBackgroundConfig?.durationSeconds || 12,
          displayMode: activeCard.ureelScene?.video?.displayMode || 'cover',
          startAt: 0,
        },
      } as any,
    } as any);
    restartPreviewSimulation();
    triggerToast(lang === 'de' ? 'Video entfernt.' : 'Video removed.', 'success');
  };

  const handleDesktopBackgroundUpload = async (file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du ein Desktop-Hintergrundbild hochlädst.' : 'Please log in before uploading a desktop background.', 'error');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'de' ? 'Bitte eine Bilddatei auswählen.' : 'Please choose an image file.', 'error');
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Desktop-Hintergrund ist zu groß. Maximal ${maxMb} MB.` : `Desktop background is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/desktop-backgrounds/${cleanName}`;
    try {
      setDesktopBgUploading(true);
      setDesktopBgUploadProgress(0);
      await updateDesktopPage({ backgroundImageUrl: '', backgroundMode: 'image', buttonBackgroundImageUrl: '', legacyBackgroundImageUrl: '' });
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });
        task.on('state_changed',
          (snap) => setDesktopBgUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await updateDesktopPage({ backgroundMode: 'image', backgroundImageUrl: downloadUrl, buttonBackgroundImageUrl: '' });
      triggerToast(lang === 'de' ? 'Desktop-Hintergrund hochgeladen.' : 'Desktop background uploaded.', 'success');
    } catch (err: any) {
      console.error('Desktop background upload failed', err);
      triggerToast(lang === 'de' ? `Desktop-Upload fehlgeschlagen: ${err?.message || err}` : `Desktop upload failed: ${err?.message || err}`, 'error');
    } finally {
      setDesktopBgUploading(false);
      setTimeout(() => setDesktopBgUploadProgress(null), 1200);
    }
  };


  const handleDesktopButtonBackgroundUpload = async (file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du ein Buttonbereich-Bild hochlädst.' : 'Please log in before uploading a button area image.', 'error');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'de' ? 'Bitte eine Bilddatei auswählen.' : 'Please choose an image file.', 'error');
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Buttonbereich-Bild ist zu groß. Maximal ${maxMb} MB.` : `Button area image is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/desktop-button-backgrounds/${cleanName}`;
    try {
      setDesktopButtonBgUploading(true);
      setDesktopButtonBgUploadProgress(0);
      await updateDesktopPage({ buttonAreaBackgroundImageUrl: '', buttonBackgroundImageUrl: '', buttonAreaBackgroundMode: 'image' as any } as any);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });
        task.on('state_changed',
          (snap) => setDesktopButtonBgUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await updateDesktopPage({ buttonAreaBackgroundMode: 'image' as any, buttonAreaBackgroundImageUrl: downloadUrl, buttonBackgroundImageUrl: '' } as any);
      triggerToast(lang === 'de' ? 'Buttonbereich-Bild hochgeladen.' : 'Button area image uploaded.', 'success');
    } catch (err: any) {
      console.error('Desktop button background upload failed', err);
      triggerToast(lang === 'de' ? `Buttonbereich-Upload fehlgeschlagen: ${err?.message || err}` : `Button area upload failed: ${err?.message || err}`, 'error');
    } finally {
      setDesktopButtonBgUploading(false);
      setTimeout(() => setDesktopButtonBgUploadProgress(null), 1200);
    }
  };

  const handleButtonImageUpload = async (btnId: string, file: File) => {
    if (!activeCard || !user) {
      triggerToast(lang === 'de' ? 'Bitte einloggen, bevor du Buttonbilder hochlädst.' : 'Please log in before uploading button images.', 'error');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast(lang === 'de' ? 'Bitte eine Bilddatei auswählen.' : 'Please choose an image file.', 'error');
      return;
    }
    const maxMb = 10;
    if (file.size > maxMb * 1024 * 1024) {
      triggerToast(lang === 'de' ? `Bild ist zu groß. Maximal ${maxMb} MB.` : `Image is too large. Max ${maxMb} MB.`, 'error');
      return;
    }
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const cardStorageId = activeCard.cardId || (activeCard as any).id || activeCard.slug || 'draft';
    const storagePath = `users/${user.uid}/cards/${cardStorageId}/button-images/${btnId}/${cleanName}`;
    try {
      setButtonFileUploading(true);
      setButtonFileUploadProgress(0);
      const storageRef = ref(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });
        task.on('state_changed',
          (snap) => setButtonFileUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });
      await handleUpdateSingleButton(btnId, {
        buttonImageUrl: downloadUrl,
        imageUrl: downloadUrl,
        buttonImageFileName: file.name,
        buttonImageStoragePath: storagePath,
        buttonImageFit: editingButton?.buttonImageFit || 'cover',
        imageMode: editingButton?.imageMode || 'cover',
        buttonImageOverlay: editingButton?.buttonImageOverlay ?? true,
        imageOverlay: typeof editingButton?.imageOverlay === 'number' ? editingButton.imageOverlay : 35,
      } as any);
      triggerToast(lang === 'de' ? 'Buttonbild hochgeladen.' : 'Button image uploaded.', 'success');
    } catch (err: any) {
      console.error('Button image upload failed', err);
      triggerToast(lang === 'de' ? `Buttonbild-Upload fehlgeschlagen: ${err?.message || err}` : `Button image upload failed: ${err?.message || err}`, 'error');
    } finally {
      setButtonFileUploading(false);
      setButtonFileUploadProgress(null);
    }
  };

  const actionOptions = [
    { value: 'url', label: 'Web-Link', hint: 'Website oder Landingpage' },
    { value: 'phone', label: 'Telefon', hint: 'Direkt anrufen' },
    { value: 'email', label: 'E-Mail', hint: 'Mail schreiben' },
    { value: 'whatsapp', label: 'WhatsApp', hint: 'Chat öffnen' },
    { value: 'vcard', label: 'Kontakt speichern', hint: 'VCF / Kontaktkarte' },
    { value: 'contact_form', label: 'Kontaktformular', hint: 'Anfrage per Formular' },
    { value: 'inquiry_form', label: 'Anfrage senden', hint: 'Lead / Angebot' },
    { value: 'maps', label: 'Standort / Route', hint: 'Google/Apple Maps' },
    { value: 'pdf_link', label: 'PDF öffnen', hint: 'PDF-Link' },
    { value: 'external_file_link', label: 'Datei-Link', hint: 'Datei extern öffnen' },
    { value: 'google_drive_file', label: 'Google Drive Datei', hint: 'Drive-Datei öffnen' },
    { value: 'google_drive_folder', label: 'Google Drive Ordner', hint: 'Drive-Ordner öffnen' },
    { value: 'dropbox_file', label: 'Dropbox Datei', hint: 'Dropbox-Datei öffnen' },
    { value: 'dropbox_folder', label: 'Dropbox Ordner', hint: 'Dropbox-Ordner öffnen' },
    { value: 'onedrive_file', label: 'OneDrive Datei', hint: 'OneDrive-Datei öffnen' },
    { value: 'onedrive_folder', label: 'OneDrive Ordner', hint: 'OneDrive-Ordner öffnen' },
    { value: 'download_area', label: 'Downloadbereich', hint: 'Mehrere Dateien' },
    { value: 'video_replay', label: 'Video erneut ansehen', hint: 'Timeline neu starten' },
  ];

  const getButtonActionIcon = (actionType?: string) => {
    const type = actionType || 'url';
    if (type === 'phone') return LucideIcons.Phone;
    if (type === 'email') return LucideIcons.Mail;
    if (type === 'whatsapp') return LucideIcons.MessageCircle;
    if (type === 'maps' || type === 'location' || type === 'location_address') return LucideIcons.MapPin;
    if (type === 'vcard') return LucideIcons.Contact;
    if (type === 'contact_form' || type === 'inquiry_form' || type === 'callback_request') return LucideIcons.FilePenLine;
    if (type.includes('drive') || type.includes('dropbox') || type.includes('onedrive')) return LucideIcons.FolderOpen;
    if (type.includes('pdf') || type.includes('file') || type === 'download_area') return LucideIcons.FileText;
    if (type === 'video_replay') return LucideIcons.RotateCcw;
    return LucideIcons.ExternalLink;
  };

  const radiusClassForButton = (button?: Partial<CardButton>) => {
    if (button?.radius === 'square') return 'rounded-none';
    if (button?.radius === 'pill') return 'rounded-full';
    return 'rounded-2xl';
  };

  const buttonPreviewStyle = (button?: Partial<CardButton>): React.CSSProperties => {
    const image = button?.buttonImageUrl || button?.imageUrl;
    const bg = button?.bgColor || button?.backgroundColor || activeCard.buttonColor || '#18181B';
    const border = button?.borderColor || (button?.styleVariant === 'outline' ? '#A855F7' : 'rgba(168,85,247,0.35)');
    const overlay = typeof button?.imageOverlay === 'number'
      ? Math.max(0, Math.min(0.85, Number(button.imageOverlay) / 100))
      : button?.buttonImageOverlay
        ? 0.35
        : (button?.darkOverlay ? 0.35 : 0);
    return {
      backgroundColor: bg,
      color: button?.textColor || activeCard.buttonTextColor || '#FFFFFF',
      borderColor: border,
      backgroundImage: image
        ? `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${image})`
        : button?.gradient || undefined,
      backgroundSize: button?.buttonImageFit || button?.imageMode || 'cover',
      backgroundPosition: 'center',
    };
  };

  const getAutoButtonLabelStyle = (button: CardButton, compact = false): React.CSSProperties => {
    const label = (button.title || 'Button').trim();
    const len = label.length;
    const sizeBase = compact ? Math.max(8, Math.min(12, buttonSizePx / 7.2)) : Math.max(10, Math.min(15, buttonSizePx / 6.2));
    const lengthPenalty = len > 26 ? 3.2 : len > 18 ? 2.2 : len > 12 ? 1.2 : 0;
    const fontSize = Math.max(compact ? 7.5 : 9.5, sizeBase - lengthPenalty);
    return {
      fontSize: `${fontSize}px`,
      lineHeight: 1.08,
      maxWidth: '100%',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      hyphens: 'auto',
    };
  };


  const clampTextSize = (value: any, fallback: number, min: number, max: number) => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value || ''));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  };

  const adTextSizePreset = () => {
    const title = clampTextSize(activeCard.heroTitleSize, 28, 16, 52);
    if (title <= 22) return 'compact';
    if (title >= 38) return 'poster';
    return 'balanced';
  };

  const applyAdTextSizePreset = async (preset: 'compact' | 'balanced' | 'poster') => {
    const sizes = {
      compact: { heroTitleSize: 22, heroSubtitleSize: 10.5, heroDescriptionSize: 9.5 },
      balanced: { heroTitleSize: 30, heroSubtitleSize: 12, heroDescriptionSize: 11 },
      poster: { heroTitleSize: 40, heroSubtitleSize: 14, heroDescriptionSize: 12.5 },
    }[preset];
    await syncCardUpdate(sizes as any);
    triggerToast(preset === 'compact' ? 'Kompakte Textgröße angewendet.' : preset === 'balanced' ? 'Ausgewogene Textgröße angewendet.' : 'Poster-Textgröße angewendet.', 'success');
  };

  const renderAdTextWithHighlight = (text: string, className: string, style: React.CSSProperties) => {
    const mode = currentTextTemplate.emphasis?.mode || 'none';
    const word = currentTextTemplate.emphasis?.word || '';
    const color = currentTextTemplate.emphasis?.color || currentTextTemplate.frame?.color || '#E8DCC2';
    const clean = text || '';
    if (!clean || mode === 'none') return <span className={className} style={style}>{clean}</span>;
    let target = '';
    if (mode === 'last_word') {
      const parts = clean.trim().split(/\s+/);
      target = parts.length > 1 ? parts[parts.length - 1] : clean;
    } else if (mode === 'custom_word') {
      target = word;
    }
    if (!target) return <span className={className} style={style}>{clean}</span>;
    const idx = clean.toLowerCase().lastIndexOf(target.toLowerCase());
    if (idx < 0) return <span className={className} style={style}>{clean}</span>;
    return (
      <span className={className} style={style}>
        {clean.slice(0, idx)}<span style={{ color }}>{clean.slice(idx, idx + target.length)}</span>{clean.slice(idx + target.length)}
      </span>
    );
  };

  const fontFamilyForAdStyle = (style?: string) => {
    if (style === 'tech') return 'ui-monospace, SFMono-Regular, Menlo, monospace';
    if (style === 'serif') return 'Georgia, serif';
    if (style === 'condensed') return 'Bebas Neue, Impact, sans-serif';
    if (style === 'elegant') return 'Playfair Display, Georgia, serif';
    return 'Inter, ui-sans-serif, system-ui, sans-serif';
  };

  const letterSpacingForAdStyle = (style?: string) => {
    if (style === 'elegant') return '0.10em';
    if (style === 'condensed') return '0.02em';
    if (style === 'tech') return '-0.02em';
    return '-0.03em';
  };

  const renderWerbeTextMonitor = (compact = false) => {
    // v48: the Werbe-Monitor intentionally renders the real scene card.
    // No separate black mockup anymore: text/template preview, Szene and Live-Link
    // all go through KonuCardCore and therefore the same text renderer.
    return (
      <div className="w-full max-w-[300px] rounded-[28px] border border-[#3A3732] bg-[#111111] p-3 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] uppercase tracking-widest font-black text-[#E8DCC2]">Echte Karten-Vorschau</span>
          <span className="text-[7px] uppercase tracking-wider text-stone-500">Renderer Sync</span>
        </div>
        <div className="relative h-[430px] rounded-[26px] overflow-hidden border-[7px] border-[#F5F2EA]/85 bg-black">
          <KonuCardCore
            card={getPreviewCardForTimeline()}
            lang={lang}
            isDesktopPreview={false}
            isPreview={true}
            cleanPreview={true}
            previewFocus="full"
          />
          {renderMobileTextHotspots()}
        </div>
        <p className="mt-2 text-[8.5px] leading-snug text-stone-500 text-center">
          Diese Vorschau nutzt dieselbe Karte wie Szene und Live-Link. Vorlagen, Rahmen, Textgrößen und Hintergrund werden 1:1 geprüft.
        </p>
      </div>
    );
  };

  const getPreviewCardForTimeline = () => ({
    ...activeCard,
    title: getTextLayerDraftValue('title'),
    subtitle: getTextLayerDraftValue('subtitle'),
    description: getTextLayerDraftValue('description'),
    ureelTimeline: { ...(activeCard.ureelTimeline || {}), titleAt: 0, subtitleAt: 0, descriptionAt: 0, buttonsAt: 999, endCardAt: activeCard.videoBackgroundConfig?.durationSeconds || 12 },
    videoBackgroundConfig: {
      ...(activeCard.videoBackgroundConfig || {}),
      profileTextReveals: [
        { fieldKey: 'title', enabled: isTextLayerVisible('title'), startSecond: 0, fadeDuration: 0.8, staysVisibleAfterSequence: true },
        { fieldKey: 'subtitle', enabled: isTextLayerVisible('subtitle'), startSecond: 0, fadeDuration: 0.8, staysVisibleAfterSequence: true },
        { fieldKey: 'description', enabled: isTextLayerVisible('description'), startSecond: 0, fadeDuration: 0.8, staysVisibleAfterSequence: true },
      ],
      buttonReveal: { ...(activeCard.videoBackgroundConfig?.buttonReveal || {}), enabled: false, startSecond: 999 },
    } as any,
  } as Card);

  const renderButtonPreviewTile = (button: CardButton, compact = false) => {
    // v48: use the same ButtonRenderer as the real scene/live card.
    // This keeps icon, icon color, shape, transparency, text and second line in sync.
    const size = compact ? Math.max(44, Math.min(70, buttonSizePx)) : Math.max(58, Math.min(112, buttonSizePx + 26));
    return (
      <div key={button.id} className="relative flex items-center justify-center">
        {!button.isActive && <div className="absolute inset-0 z-30 rounded-[inherit] bg-black/55 flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-stone-300">Inaktiv</div>}
        <ButtonRenderer
          button={button}
          mode="editor"
          lang={lang}
          forceSquare={true}
          forceSizePx={size}
        />
      </div>
    );
  };

  const transferButtonDesignToAll = async () => {
    if (!editingButton || !activeCard) return;
    const designFields: Partial<CardButton> = {
      bgColor: editingButton.bgColor,
      backgroundColor: editingButton.backgroundColor,
      textColor: editingButton.textColor,
      borderColor: editingButton.borderColor,
      styleVariant: editingButton.styleVariant,
      radius: editingButton.radius,
      animation: editingButton.animation,
      imageMode: editingButton.imageMode,
      buttonImageFit: editingButton.buttonImageFit,
      imageOverlay: editingButton.imageOverlay,
      buttonImageOverlay: editingButton.buttonImageOverlay,
      borderEnabled: editingButton.borderEnabled,
      borderWidth: editingButton.borderWidth,
      borderStyle: editingButton.borderStyle,
      shadow: editingButton.shadow,
      iconColor: editingButton.iconColor,
      iconSize: editingButton.iconSize,
      buttonShape: editingButton.buttonShape,
      buttonSize: editingButton.buttonSize,
      opacity: (editingButton as any).opacity,
    };
    const updatedButtons = activeCard.buttons.map((button) => button.id === editingButton.id ? button : { ...button, ...designFields });
    await syncCardUpdate({ buttons: updatedButtons });
    triggerToast(lang === 'de' ? 'Button-Design wurde auf alle anderen Buttons übertragen.' : 'Button design copied to all other buttons.', 'success');
  };

  const getCleanMonitorCard = (card: Card): Card => {
    const hiddenPreviewLabels = [
      'ureel editor', 'reel editor', 'reel/editor', 'reel / editor', 'zum bearbeiten', 'bearbeiten',
      'texte timeline', 'texte & timeline', 'text timeline', 'text/timeline', 'texte/timeline',
      'profil texte', 'profil/texte', 'vorschau', 'preview', 'editor', 'timeline', 'konu live', 'ureel live'
    ];
    const cleanedButtons = (card.buttons || []).filter((button) => {
      const rawLabel = (button.title || '').trim().toLowerCase();
      const label = rawLabel.replace(/[\/_-]+/g, ' ').replace(/&/g, ' ').replace(/\s+/g, ' ').trim();
      const action = (button.actionType || '').trim().toLowerCase();
      const iconId = ((button as any).iconId || (button as any).icon || '').trim().toLowerCase();
      const looksLikeEditorButton = hiddenPreviewLabels.some((hidden) => {
        const normalizedHidden = hidden.replace(/[\/_-]+/g, ' ').replace(/&/g, ' ').replace(/\s+/g, ' ').trim();
        return rawLabel.includes(hidden) || label.includes(normalizedHidden);
      });
      return !looksLikeEditorButton && action !== 'editor' && iconId !== 'edit' && iconId !== 'palette';
    });
    return {
      ...card,
      buttons: cleanedButtons,
    };
  };

  const monitorCard = getCleanMonitorCard(activeCard);

  const getDefaultSubSectionForModule = (module: MainModule): string => {
    const defaults: Partial<Record<MainModule, string>> = {
      scene: 'scene-video',
      timeline: 'timeline-texts',
      buttons: 'buttons-list',
      design: 'design-desktop',
      cards: 'cards-list',
      endcard: 'endcard-general',
    };
    return defaults[module] || 'scene-video';
  };

  const mobileMainModules: Array<{ id: MainModule; label: string; orbitClass: string }> = [
    { id: 'scene', label: 'Szene', orbitClass: 'orbit-scene' },
    { id: 'buttons', label: 'Buttons', orbitClass: 'orbit-buttons' },
    { id: 'design', label: 'Design', orbitClass: 'orbit-design' },
    { id: 'timeline', label: 'Text', orbitClass: 'orbit-text' },
  ];

  const mobileModuleLabels: Partial<Record<MainModule, string>> = {
    scene: 'Szene',
    timeline: 'Text',
    buttons: 'Buttons',
    design: 'Design',
  };

  const getMobileModuleHelp = (module: MainModule): string => {
    if (module === 'scene') return 'Wähle zuerst, welchen Teil deiner Bühne du bearbeiten möchtest.';
    if (module === 'timeline') return 'Wähle, ob du Inhalt, Timing oder Look deiner Werbebotschaft ändern möchtest.';
    if (module === 'buttons') return 'Wähle, ob du Buttons ordnen, Aktionen setzen oder den Look bearbeiten möchtest.';
    if (module === 'design') return 'Wähle den Bereich der öffentlichen Desktop-Miniwebseite.';
    return 'Wähle einen Bereich zum Bearbeiten.';
  };

  const getMobileSubMenuItems = (module: MainModule): Array<{ id: string; label: string }> => {
    if (module === 'scene') {
      return [
        { id: 'scene-video', label: 'Video' },
        { id: 'scene-poster', label: 'Bild' },
        { id: 'scene-color', label: 'Farbe' },
        { id: 'scene-display', label: 'Darstellung' },
        { id: 'scene-endcard', label: 'Endkarte' },
      ];
    }
    if (module === 'timeline') {
      return [
        { id: 'timeline-texts', label: 'Inhalt' },
        { id: 'timeline-templates', label: 'Vorlagen' },
        { id: 'timeline-style', label: 'Größe / Farbe' },
        { id: 'timeline-times', label: 'Timing' },
        { id: 'timeline-animation', label: 'Animation' },
      ];
    }
    if (module === 'buttons') {
      return [
        { id: 'buttons-list', label: 'Buttonliste' },
        { id: 'buttons-text', label: 'Text' },
        { id: 'buttons-action', label: 'Aktion' },
        { id: 'buttons-icon', label: 'Icon' },
        { id: 'buttons-design', label: 'Look' },
        { id: 'buttons-size', label: 'Größe' },
        { id: 'buttons-transfer', label: 'Design übertragen' },
      ];
    }
    if (module === 'design') {
      return [
        { id: 'design-desktop', label: 'Desktopseite' },
        { id: 'design-background', label: 'Hintergrund' },
        { id: 'design-content', label: 'Kartenlook' },
        { id: 'design-buttons', label: 'Buttonbereich' },
        { id: 'design-share', label: 'Teilen / QR' },
      ];
    }
    return [];
  };

  const getMobileSettingItems = (module: MainModule, subsectionId: string): Array<{ id: string; label: string; opensPanel?: boolean }> => {
    if (module === 'scene') {
      if (subsectionId === 'scene-video') return [
        { id: 'video-link', label: 'Link', opensPanel: true },
        { id: 'video-duration', label: 'Dauer', opensPanel: true },
        { id: 'video-remove', label: 'Entfernen', opensPanel: true },
        { id: 'video-replay', label: 'Replay', opensPanel: true },
      ];
      if (subsectionId === 'scene-poster') return [
        { id: 'poster-upload', label: 'Hochladen', opensPanel: true },
        { id: 'poster-remove', label: 'Entfernen', opensPanel: true },
        { id: 'poster-replace', label: 'Ersetzen', opensPanel: true },
        { id: 'poster-position', label: 'Position', opensPanel: true },
      ];
      if (subsectionId === 'scene-endcard') return [
        { id: 'endcard-image', label: 'Bild', opensPanel: true },
        { id: 'endcard-video', label: 'Video', opensPanel: true },
        { id: 'endcard-cta', label: 'CTA', opensPanel: true },
        { id: 'endcard-replay', label: 'Replay', opensPanel: true },
      ];
      return [
        { id: 'scene-primary', label: 'Option', opensPanel: true },
        { id: 'scene-reset', label: 'Zurücksetzen', opensPanel: true },
      ];
    }
    if (module === 'timeline') {
      if (subsectionId === 'timeline-texts') return [
        { id: 'text-title', label: 'Titel', opensPanel: true },
        { id: 'text-subtitle', label: 'Untertitel', opensPanel: true },
        { id: 'text-description', label: 'Beschreibung', opensPanel: true },
      ];
      if (subsectionId === 'timeline-templates') return [
        { id: 'template-bold', label: 'Bold' },
        { id: 'template-elegant', label: 'Elegant' },
        { id: 'template-minimal', label: 'Minimal' },
        { id: 'template-reel', label: 'Reel' },
        { id: 'template-premium', label: 'Premium' },
      ];
      if (subsectionId === 'timeline-style') return [
        { id: 'text-size', label: 'Größe', opensPanel: true },
        { id: 'text-color', label: 'Farbe', opensPanel: true },
        { id: 'text-frame', label: 'Rahmen', opensPanel: true },
      ];
      return [
        { id: 'timing-title', label: 'Titel', opensPanel: true },
        { id: 'timing-subtitle', label: 'Untertitel', opensPanel: true },
        { id: 'timing-description', label: 'Beschreibung', opensPanel: true },
        { id: 'timing-buttons', label: 'Buttons', opensPanel: true },
      ];
    }
    if (module === 'buttons') {
      if (subsectionId === 'buttons-list') return [
        { id: 'button-open', label: 'Öffnen', opensPanel: true },
        { id: 'button-copy', label: 'Kopieren', opensPanel: true },
        { id: 'button-duplicate', label: 'Duplizieren', opensPanel: true },
        { id: 'button-delete', label: 'Löschen', opensPanel: true },
      ];
      if (subsectionId === 'buttons-action') return [
        { id: 'action-phone', label: 'Telefon', opensPanel: true },
        { id: 'action-web', label: 'Website', opensPanel: true },
        { id: 'action-mail', label: 'Mail', opensPanel: true },
        { id: 'action-whatsapp', label: 'WhatsApp', opensPanel: true },
        { id: 'action-file', label: 'Datei', opensPanel: true },
      ];
      if (subsectionId === 'buttons-design') return [
        { id: 'look-color', label: 'Farbe', opensPanel: true },
        { id: 'look-textcolor', label: 'Textfarbe', opensPanel: true },
        { id: 'look-form', label: 'Form', opensPanel: true },
        { id: 'look-border', label: 'Rahmen', opensPanel: true },
      ];
      if (subsectionId === 'buttons-transfer') return [
        { id: 'transfer-all', label: 'Auf alle', opensPanel: true },
        { id: 'transfer-color', label: 'Nur Farbe', opensPanel: true },
        { id: 'transfer-form', label: 'Nur Form', opensPanel: true },
        { id: 'transfer-icon', label: 'Nur Icon', opensPanel: true },
      ];
      return [
        { id: 'button-text-main', label: 'Haupttext', opensPanel: true },
        { id: 'button-text-sub', label: 'Zweite Zeile', opensPanel: true },
        { id: 'button-icon', label: 'Icon', opensPanel: true },
        { id: 'button-size', label: 'Größe', opensPanel: true },
      ];
    }
    if (module === 'design') {
      return [
        { id: 'design-layout', label: 'Layout', opensPanel: true },
        { id: 'design-bg', label: 'Farbe / Bild', opensPanel: true },
        { id: 'design-qr', label: 'QR', opensPanel: true },
        { id: 'design-link', label: 'Link', opensPanel: true },
      ];
    }
    return [];
  };

  const getMobileActiveSettingLabel = () => {
    if (!mobileOrbitModule || !mobileActiveSetting) return null;
    return getMobileSettingItems(mobileOrbitModule, activeSubSection).find((item) => item.id === mobileActiveSetting)?.label || null;
  };

  const getMobilePanelHelp = () => {
    if (activeTab === 'buttons' && activeSubSection === 'buttons-action') return 'Hier bestimmst du, was beim Tippen auf den ausgewählten Button passiert. Die Beschriftung bleibt unabhängig davon.';
    if (activeTab === 'buttons' && activeSubSection === 'buttons-list') return 'Hier verwaltest du deine Buttons. Große Listen bleiben unten scrollbar, die Vorschau bleibt sichtbar.';
    if (activeTab === 'buttons' && activeSubSection === 'buttons-transfer') return 'Übertrage den Look des aktuellen Buttons auf andere Buttons, damit alle einheitlich aussehen.';
    if (activeTab === 'buttons') return 'Bearbeite den aktuell ausgewählten Button. Änderungen sind oben in der Vorschau sichtbar.';
    if (activeTab === 'timeline' && activeSubSection === 'timeline-templates') return 'Wähle eine Textvorlage. Die Karte zeigt sofort, wie die Werbebotschaft wirkt.';
    if (activeTab === 'timeline') return 'Bearbeite Titel, Untertitel und Beschreibung. Die Vorschau zeigt dir die Wirkung direkt auf der Karte.';
    if (activeTab === 'scene' && activeSubSection === 'scene-poster') return 'Lade ein Bild oder Poster hoch. Wenn ein Video aktiv ist, entferne zuerst das Video.';
    if (activeTab === 'scene') return 'Bearbeite Bühne, Video, Bild, Farbe oder Endkarte deiner ureel.';
    if (activeTab === 'design') return 'Passe die öffentliche Miniwebseite und den Kartenlook an.';
    return 'Wähle eine Einstellung. Die Änderung bleibt in der Vorschau sichtbar.';
  };

  const openMobileModule = (module: MainModule) => {
    const defaultSub = getDefaultSubSectionForModule(module);
    setActiveTab(module);
    setActiveSubSection(defaultSub);
    setMobileOrbitModule(module);
    setMobileActiveSetting(null);
    setMobileOrbitOpen(true);
    setMobileOrbitLevel('sub');
    setMobileSheetOpen(false);
    if (module === 'buttons' && (activeCard?.buttons?.length || 0) > 0 && !editingBtnId) {
      setEditingBtnId(activeCard.buttons?.[0]?.id || null);
    }
  };

  const openMobileSubSection = (module: MainModule, subsectionId: string) => {
    setActiveTab(module);
    setActiveSubSection(subsectionId);
    setMobileOrbitOpen(true);
    setMobileOrbitModule(module);
    setMobileOrbitLevel('setting');
    setMobileSheetOpen(false);
    setMobileActiveSetting(null);
    if (module !== 'timeline') {
      setMobileActiveTextLayer(null);
    }
    if (module === 'buttons' && (activeCard?.buttons?.length || 0) > 0 && !editingBtnId) {
      setEditingBtnId(activeCard.buttons?.[0]?.id || null);
    }
  };

  const openMobileSetting = (settingId: string, opensPanel = true) => {
    setMobileOrbitLevel('setting');
    setMobileActiveSetting(settingId);
    setMobileSheetOpen(opensPanel);
    if (settingId === 'text-title') setMobileActiveTextLayer('title');
    if (settingId === 'text-subtitle') setMobileActiveTextLayer('subtitle');
    if (settingId === 'text-description') setMobileActiveTextLayer('description');
  };

  const openMobileTextLayerEditor = (fieldKey: 'title' | 'subtitle' | 'description') => {
    setActiveTab('timeline');
    setActiveSubSection('timeline-texts');
    setMobileOrbitOpen(true);
    setMobileOrbitModule('timeline');
    setMobileOrbitLevel('setting');
    setMobileSheetOpen(true);
    setMobileActiveTextLayer(fieldKey);
    setMobileActiveSetting(fieldKey === 'title' ? 'text-title' : fieldKey === 'subtitle' ? 'text-subtitle' : 'text-description');
    setTextPreviewMode('text');
  };

  const renderMobileTextHotspots = () => {
    if (activeTab !== 'timeline') return null;
    const hotspots: Array<{ key: 'title' | 'subtitle' | 'description'; label: string; className: string }> = [
      { key: 'title', label: 'Titel bearbeiten', className: 'ureel-mobile-text-hotspot--title' },
      { key: 'subtitle', label: 'Slogan bearbeiten', className: 'ureel-mobile-text-hotspot--subtitle' },
      { key: 'description', label: 'Text bearbeiten', className: 'ureel-mobile-text-hotspot--description' },
    ];
    return (
      <div className="ureel-mobile-text-hotspots md:hidden" aria-label="Werbetext direkt bearbeiten">
        {hotspots.map((hotspot) => (
          <button
            key={hotspot.key}
            type="button"
            className={`ureel-mobile-text-hotspot ${hotspot.className} ${mobileActiveTextLayer === hotspot.key ? 'is-active' : ''}`}
            onClick={() => openMobileTextLayerEditor(hotspot.key)}
          >
            {hotspot.label}
          </button>
        ))}
      </div>
    );
  };

  const renderMobileCenterPreview = () => {
    if (mobileOrbitModule === 'buttons' && editingButton) {
      return (
        <div className="ureel-three-orbit-preview ureel-three-orbit-preview--button">
          <span>Aktueller Button</span>
          <ButtonRenderer button={editingButton} mode="designer" lang={lang} forceSquare={false} previewScale={1.06} />
        </div>
      );
    }
    if (mobileOrbitModule === 'timeline') {
      return (
        <button type="button" className="ureel-three-orbit-preview ureel-three-orbit-preview--text" onClick={() => openMobileTextLayerEditor('title')}>
          <span>Werbetext</span>
          <strong>{getTextLayerDraftValue('title') || 'Titel'}</strong>
          <small>{getTextLayerDraftValue('subtitle') || 'Untertitel'}</small>
        </button>
      );
    }
    if (mobileOrbitModule === 'scene') {
      return (
        <div className="ureel-three-orbit-preview ureel-three-orbit-preview--scene">
          <span>Szene</span>
          <strong>{activeSubSection === 'scene-poster' ? 'Bild / Poster' : activeSubSection === 'scene-endcard' ? 'Endkarte' : activeSubSection === 'scene-color' ? 'Farbe' : 'Video'}</strong>
          <small>{activeCard.videoBackgroundUrl ? 'Video aktiv' : activeCard.profileImageUrl ? 'Bild aktiv' : 'Bereit'}</small>
        </div>
      );
    }
    if (mobileOrbitModule === 'design') {
      return (
        <div className="ureel-three-orbit-preview ureel-three-orbit-preview--design">
          <span>Design</span>
          <strong>Kartenlook</strong>
          <small>Desktop & Teilen</small>
        </div>
      );
    }
    return (
      <button type="button" className="ureel-three-orbit-preview ureel-three-orbit-preview--start" onClick={() => setMobileOrbitOpen(false)}>
        <span>Studio</span>
        <strong>●</strong>
      </button>
    );
  };

  const renderMobileOrbitOverlay = () => {
    const activeSubLabel = getMobileSubMenuItems(activeTab).find((item) => item.id === activeSubSection)?.label || 'Bearbeiten';
    const activeSettingLabel = getMobileActiveSettingLabel();
    const settings = mobileOrbitModule ? getMobileSettingItems(mobileOrbitModule, activeSubSection) : [];
    const currentModuleLabel = mobileOrbitModule ? mobileModuleLabels[mobileOrbitModule] : 'Studio';

    const ringItems = !mobileOrbitModule
      ? mobileMainModules.map((item) => ({ id: item.id, label: item.label, active: activeTab === item.id, onClick: () => openMobileModule(item.id) }))
      : mobileOrbitLevel === 'sub'
        ? getMobileSubMenuItems(mobileOrbitModule).map((item) => ({ id: item.id, label: item.label, active: activeSubSection === item.id, onClick: () => openMobileSubSection(mobileOrbitModule, item.id) }))
        : settings.map((item) => ({ id: item.id, label: item.label, active: mobileActiveSetting === item.id, onClick: () => openMobileSetting(item.id, item.opensPanel !== false) }));

    const orbitTitle = !mobileOrbitModule
      ? 'Hauptmenü'
      : mobileOrbitLevel === 'sub'
        ? currentModuleLabel
        : `${currentModuleLabel} › ${activeSubLabel}`;

    const orbitPath = !mobileOrbitModule
      ? 'Wähle einen Bereich'
      : mobileOrbitLevel === 'sub'
        ? 'Wähle ein Untermenü'
        : activeSettingLabel ? `${activeSubLabel} › ${activeSettingLabel}` : 'Wähle eine Einstellung';

    const goBackOneOrbitStep = () => {
      if (!mobileOrbitModule) {
        setMobileOrbitOpen(false);
        setMobileSheetOpen(false);
        return;
      }
      if (mobileOrbitLevel === 'setting') {
        setMobileActiveSetting(null);
        setMobileSheetOpen(false);
        setMobileOrbitLevel('sub');
        return;
      }
      setMobileOrbitModule(null);
      setMobileActiveSetting(null);
      setMobileSheetOpen(false);
      setMobileOrbitLevel('main');
    };

    const goToMainOrbit = () => {
      setMobileOrbitModule(null);
      setMobileActiveSetting(null);
      setMobileSheetOpen(false);
      setMobileOrbitLevel('main');
      setMobileOrbitOpen(true);
    };

    return (
      <div className="ureel-mobile-orbit-layer md:hidden">
        {!mobileOrbitOpen && !mobileSheetOpen && (
          <button
            type="button"
            onClick={() => { setMobileOrbitModule(null); setMobileOrbitLevel('main'); setMobileOrbitOpen(true); }}
            className="ureel-orbit-center-button ureel-orbit-center-button--start"
            aria-label="Studio öffnen"
          >
            <span className="ureel-orbit-dot" />
            <span>Studio</span>
          </button>
        )}

        {mobileOrbitOpen && (
          <div className={`ureel-step-orbit ureel-step-orbit--${mobileOrbitModule || 'main'} ureel-step-orbit--level-${mobileOrbitLevel}`} role="navigation" aria-label="ureel Single Orbit Step Ring">
            <button type="button" className="ureel-orbit-utility ureel-orbit-utility--preview" onClick={() => { setMobileSheetOpen(false); setMobileOrbitOpen(false); }}>
              Vorschau
            </button>
            <button type="button" className="ureel-orbit-utility ureel-orbit-utility--timing" onClick={() => { setActiveTab('timeline'); setActiveSubSection('timeline-times'); setMobileOrbitModule('timeline'); setMobileOrbitLevel('setting'); setMobileActiveSetting('timing-title'); setMobileSheetOpen(true); }}>
              Timing
            </button>
            <button type="button" className="ureel-orbit-utility ureel-orbit-utility--back" onClick={goBackOneOrbitStep}>
              Zurück
            </button>
            <button type="button" className="ureel-orbit-utility ureel-orbit-utility--studio" onClick={goToMainOrbit}>
              Studio
            </button>

            <div className="ureel-step-orbit-label">
              <strong>{orbitTitle}</strong>
              <span>{orbitPath}</span>
            </div>

            <div className="ureel-step-orbit-ring" aria-label={orbitTitle}>
              {ringItems.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={item.onClick}
                  className={`ureel-step-segment ureel-step-segment--${ringItems.length} ureel-step-segment--${index} ${item.active ? 'is-active' : ''}`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="ureel-step-orbit-center" aria-label="Aktiver Bereich">
              {renderMobileCenterPreview()}
              {mobileOrbitModule && activeSettingLabel && <span className="ureel-three-orbit-current">{activeSettingLabel}</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] md:h-screen w-full max-w-[100vw] bg-[#09090B] text-stone-200 overflow-x-hidden md:overflow-hidden overflow-y-auto font-sans antialiased text-xs">
      
      {/* COLUMN 1: LINKE HAUPTNAVIGATION (SIDEBAR) */}
      <div className="ureel-studio-topbar order-1 md:order-none sticky top-0 z-40 md:static w-full md:w-[76px] bg-[#0E0E11]/95 backdrop-blur-xl border-b md:border-b-0 md:border-r border-stone-900 flex flex-row md:flex-col justify-between items-center gap-3 px-3 md:px-0 py-2 md:py-4 shrink-0 overflow-x-auto">
        
        {/* Top Logo */}
        <div className="relative shrink-0">
          <button
            type="button"
            className="ureel-studio-logo-button flex flex-row md:flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => setAccountMenuOpen((open) => !open)}
            title={lang === 'de' ? 'Menü öffnen' : 'Open menu'}
          >
            <div className="ureel-studio-logo-icon w-9 h-9 rounded-xl bg-gradient-to-tr from-[#262626] to-[#3A3732] p-0.5 flex items-center justify-center shadow-lg shadow-black/40">
              <LucideIcons.Tv className="text-white w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-black text-[9px] tracking-widest text-[#E8DCC2] uppercase select-none">ureel</span>
          </button>
          {accountMenuOpen && (
            <div className="fixed left-3 top-[72px] md:absolute md:left-[66px] md:top-0 z-50 w-[280px] rounded-2xl border border-[#E8DCC2]/25 bg-[#121216] shadow-2xl shadow-black/60 p-3 text-stone-200">
              <div className="border-b border-stone-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F2EA]/10 border border-purple-700/50 flex items-center justify-center text-[#F5F2EA] font-black">
                    {(profile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white truncate">{profile?.displayName || user?.displayName || 'Mein ureel.me Konto'}</p>
                    <p className="text-[9px] text-stone-400 truncate">{user?.email || 'Angemeldet'}</p>
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-[#E8DCC2] font-bold uppercase tracking-wider">Plan: {effectivePlanId || 'free'}</p>
              </div>
              <div className="space-y-1">
                <button onClick={() => { setAccountMenuOpen(false); handleCreateNewUreel(); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F5F2EA]/10 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.Plus size={14} className="text-[#E8DCC2]" /> Neue ureel erstellen
                </button>
                <button onClick={() => { setAccountMenuOpen(false); setCardManagerOpen(true); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-900 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.Layers size={14} className="text-[#E8DCC2]" /> Meine ureels / Karten
                </button>
                <button onClick={() => { setAccountMenuOpen(false); setAccountPanelOpen(true); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-900 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.UserCog size={14} className="text-[#E8DCC2]" /> Meine Daten & Einstellungen
                </button>
                <button onClick={() => { setAccountMenuOpen(false); setAccountManagerTab('team'); setAccountPanelOpen(true); setTeamPanelOpen(false); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-900 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.Users size={14} className="text-[#E8DCC2]" /> Nutzerverwaltung / Team
                </button>
                <div className="px-3 py-2 rounded-xl bg-stone-950/50 border border-stone-850">
                  <p className="text-[9px] uppercase tracking-wider text-stone-500 font-black mb-1">Aktive ureel</p>
                  <p className="text-[10px] text-white font-bold truncate">{activeCard?.title || activeCard?.slug || 'Keine ureel gewählt'}</p>
                </div>
                <button onClick={() => { setAccountMenuOpen(false); logout(); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-950/25 text-[11px] font-bold flex items-center gap-2 text-red-200">
                  <LucideIcons.LogOut size={14} /> Abmelden
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mid Navigation Tabs */}
        <div className="ureel-mobile-main-nav flex flex-row md:flex-col gap-2 md:gap-2.5 w-auto md:w-full px-0 md:px-2 overflow-x-auto snap-x">
          {[
            { id: 'scene', label: lang === 'de' ? 'Szene' : 'Scene', icon: LucideIcons.Tv },
            { id: 'timeline', label: lang === 'de' ? 'Timeline' : 'Timeline', icon: LucideIcons.Milestone },
            { id: 'buttons', label: lang === 'de' ? 'Buttons' : 'Buttons', icon: LucideIcons.Grid },
            { id: 'design', label: lang === 'de' ? 'Design' : 'Design', icon: LucideIcons.Palette }
          ].map((item) => {
            const IconComponent = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as MainModule);
                  const defaults: Record<string, string> = { scene: 'scene-video', timeline: 'timeline-texts', buttons: 'buttons-list', design: 'design-desktop' };
                  if (defaults[item.id]) setActiveSubSection(defaults[item.id]);
                }}
                className={`min-w-[74px] md:min-w-0 flex flex-col snap-start items-center justify-center py-2.5 px-2 md:px-0 rounded-xl transition duration-150 relative cursor-pointer ${
                  active 
                    ? 'text-[#E8DCC2] bg-[#F5F2EA]/10 shadow-inner border border-[#E8DCC2]/25 font-bold' 
                    : 'text-stone-400 hover:text-stone-150 hover:bg-stone-900/40 font-medium'
                }`}
                title={item.label}
              >
                <IconComponent size={18} className="stroke-[2.2]" />
                <span className="text-[8.5px] mt-1 tracking-wider leading-none">{item.label}</span>
                {active && (
                  <div className="absolute right-0 top-1/4 h-1/2 w-0.5 bg-gradient-to-b from-[#F5F2EA] to-[#E8DCC2] rounded-l" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Profile Details or Exit */}
        <div className="flex flex-row md:flex-col items-center gap-2 shrink-0 ureel-mobile-utility-actions">
          <button
            onClick={() => { setAccountManagerTab('team'); setAccountPanelOpen(true); setTeamPanelOpen(false); }}
            className="p-2 text-stone-500 hover:text-[#F5F2EA] transition duration-150 hover:bg-stone-900 rounded-lg cursor-pointer"
            title={lang === 'de' ? 'Nutzerverwaltung' : 'Team management'}
          >
            <LucideIcons.Users size={16} />
          </button>
          <button
            onClick={() => {
              if (confirm(lang === 'de' ? 'Möchten Sie sich wirklich abmelden?' : 'Do you really want to log out?')) {
                logout();
              }
            }}
            className="p-2 text-stone-500 hover:text-[#F5F2EA] transition duration-150 hover:bg-stone-900 rounded-lg cursor-pointer"
            title={lang === 'de' ? 'Abmelden' : 'Logout'}
          >
            <LucideIcons.LogOut size={16} />
          </button>
        </div>
      </div>

      {/* COLUMN 2: LINKES MODULPANEL (SUB NAV / SUB OPTIONS) */}
      <div className="order-3 md:order-none w-full md:w-[220px] bg-[#111115] md:max-h-screen ureel-subnav-panel overflow-y-visible md:overflow-visible border-b md:border-b-0 md:border-r border-stone-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Active Module Title */}
          <div className="p-4 border-b border-stone-850/60">
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-0.5">Studio-Modul</span>
            <span className="text-sm font-black text-white tracking-wide uppercase">
              {activeTab === 'scene' && (lang === 'de' ? 'Video / Szene' : 'Video / Scene')}
              {activeTab === 'timeline' && (lang === 'de' ? 'Texte & Timeline' : 'Texts & Timeline')}
              {activeTab === 'buttons' && (lang === 'de' ? 'Buttons & Raster' : 'Buttons & Grid')}
              {activeTab === 'endcard' && (lang === 'de' ? 'Endkarte & CTA' : 'Endcard & CTA')}
  
            {activeTab === 'cards' && (
              <div className="space-y-2">
                <button onClick={() => setCardManagerOpen(true)} className="w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20">
                  <LucideIcons.Layers size={15} className="text-[#101010]" />
                  <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">Meine ureels</span><span className="block text-[8.5px] leading-snug mt-0.5 text-[#101010]/60">öffnen, kopieren, löschen</span></span>
                  <LucideIcons.ChevronRight size={13} className="opacity-50" />
                </button>
              </div>
            )}

            {activeTab === 'design' && (lang === 'de' ? 'Design & Farben' : 'Design & Presets')}
            </span>
          </div>

          {/* Tab specific menu layouts */}
          <div className="p-2 space-y-1 md:overflow-visible">
            {activeTab === 'scene' && (
              <div className="space-y-2 pt-1">
                <div className="px-2 text-[10px] text-stone-500 uppercase font-bold tracking-wider">Szenen-Studio</div>
                {[
                  { id: 'scene-video', icon: LucideIcons.Video, label: 'Video', desc: 'YouTube, Shorts, Loop' },
                  { id: 'scene-poster', icon: LucideIcons.Image, label: 'Bild / Poster', desc: 'Cover, Upload, Standbild' },
                  { id: 'scene-color', icon: LucideIcons.PaintBucket, label: 'Farbe / Verlauf', desc: 'Anthrazit, Creme, Gradient' },
                  { id: 'scene-display', icon: LucideIcons.Scan, label: 'Darstellung', desc: 'Füllen, ganz, Hero' },
                  { id: 'scene-endcard', icon: LucideIcons.Flag, label: 'Endkarte', desc: 'Abschluss, Replay, CTA' },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = activeSubSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubSection(item.id)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                        selected
                          ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20'
                          : 'bg-[#181818] text-[#F5F2EA]/80 border-[#3A3732] hover:border-[#F5F2EA]/50 hover:bg-[#202020]'
                      }`}
                    >
                      <Icon size={15} className={selected ? 'text-[#101010]' : 'text-[#E8DCC2]'} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">{item.label}</span>
                        <span className={`block text-[8.5px] leading-snug mt-0.5 ${selected ? 'text-[#101010]/60' : 'text-stone-500'}`}>{item.desc}</span>
                      </span>
                      <LucideIcons.ChevronRight size={13} className="opacity-50" />
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-2 pt-1">
                <div className="px-2 text-[10px] text-stone-500 uppercase font-bold tracking-wider">Werbetexter-Studio</div>
                {[
                  { id: 'timeline-texts', icon: LucideIcons.Megaphone, label: 'Werbetext', desc: 'Headline, Slogan, Beschreibung' },
                  { id: 'timeline-templates', icon: LucideIcons.LayoutTemplate, label: 'Vorlagen', desc: 'Reel-, Angebot-, Event-Layouts' },
                  { id: 'timeline-style', icon: LucideIcons.Frame, label: 'Rahmen & Stil', desc: 'Box, Rahmen, Schrift, Highlight' },
                  { id: 'timeline-times', icon: LucideIcons.Hourglass, label: 'Timing', desc: 'Einblendung & Simulation' },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = activeSubSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubSection(item.id)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                        selected
                          ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20'
                          : 'bg-[#181818] text-[#F5F2EA]/80 border-[#3A3732] hover:border-[#F5F2EA]/50 hover:bg-[#202020]'
                      }`}
                    >
                      <Icon size={15} className={selected ? 'text-[#101010]' : 'text-[#E8DCC2]'} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">{item.label}</span>
                        <span className={`block text-[8.5px] leading-snug mt-0.5 ${selected ? 'text-[#101010]/60' : 'text-stone-500'}`}>{item.desc}</span>
                      </span>
                      <LucideIcons.ChevronRight size={13} className="opacity-50" />
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'buttons' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-2 text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                  <span>Button-Studio</span>
                  <button onClick={handleAddButtonLocal} className="text-[#F5F2EA] hover:text-white cursor-pointer flex items-center gap-0.5">
                    <LucideIcons.Plus size={12} className="stroke-[3]" />
                  </button>
                </div>
                {[
                  { id: 'buttons-list', icon: LucideIcons.ListChecks, label: 'Button-Liste', desc: 'Auswählen, kopieren, duplizieren' },
                  { id: 'buttons-action', icon: LucideIcons.MousePointerClick, label: 'Aktion', desc: 'Telefon, Link, PDF, Kontakt' },
                  { id: 'buttons-design', icon: LucideIcons.ImagePlus, label: 'Design', desc: 'Bild, Text, Farben, Form' },
                  { id: 'buttons-preview', icon: LucideIcons.LayoutGrid, label: 'Raster & Vorschau', desc: 'Karte, Button, Raster' },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = activeSubSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSubSection(item.id)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                        selected
                          ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20'
                          : 'bg-[#181818] text-[#F5F2EA]/80 border-[#3A3732] hover:border-[#F5F2EA]/50 hover:bg-[#202020]'
                      }`}
                    >
                      <Icon size={15} className={selected ? 'text-[#101010]' : 'text-[#E8DCC2]'} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">{item.label}</span>
                        <span className={`block text-[8.5px] leading-snug mt-0.5 ${selected ? 'text-[#101010]/60' : 'text-stone-500'}`}>{item.desc}</span>
                      </span>
                      <LucideIcons.ChevronRight size={13} className="opacity-50" />
                    </button>
                  );
                })}
                <div className="mt-3 rounded-2xl border border-[#3A3732] bg-[#111111] p-3">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-stone-500 mb-1">Aktueller Button</span>
                  <p className="text-[11px] font-black text-[#F5F2EA] truncate">{editingButton?.title || 'Kein Button gewählt'}</p>
                  <p className="text-[9px] text-stone-500 truncate">{editingButton ? (actionOptions.find((option) => option.value === editingButton.actionType)?.label || editingButton.actionType || 'Aktion') : 'Wähle einen Button aus der Liste.'}</p>
                </div>
              </div>
            )}

            {activeTab === 'endcard' && (
              <>
                <button
                  onClick={() => setActiveSubSection('endcard-general')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'endcard-general' ? 'bg-[#F5F2EA]/10 text-[#F5F2EA] font-bold border border-[#E8DCC2]/25' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.PlaySquare size={14} className="text-[#E8DCC2] shrink-0" />
                  <span>Nachspielsequenz</span>
                </button>
                <button
                  onClick={() => setActiveSubSection('endcard-branding')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'endcard-branding' ? 'bg-[#F5F2EA]/10 text-[#F5F2EA] font-bold border border-[#E8DCC2]/25' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Sparkles size={14} className="text-[#E8DCC2] shrink-0" />
                  <span>Wasserzeichen / Logo</span>
                </button>
              </>
            )}


            {activeTab === 'cards' && (
              <div className="space-y-2">
                <button onClick={() => setCardManagerOpen(true)} className="w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20">
                  <LucideIcons.Layers size={15} className="text-[#101010]" />
                  <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">Meine ureels</span><span className="block text-[8.5px] leading-snug mt-0.5 text-[#101010]/60">öffnen, kopieren, löschen</span></span>
                  <LucideIcons.ChevronRight size={13} className="opacity-50" />
                </button>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-2">
                {[
                  { id: 'design-desktop', icon: LucideIcons.MonitorSmartphone, label: 'Desktop-Seite', desc: 'Miniwebseite neben Smartphone' },
                  { id: 'design-background', icon: LucideIcons.ImagePlus, label: 'Hintergrund', desc: 'Bild, Verlauf, Abdunklung' },
                  { id: 'design-content', icon: LucideIcons.Type, label: 'Werbetexte', desc: 'Vorlagen aus Editor nutzen' },
                  { id: 'design-share', icon: LucideIcons.QrCode, label: 'Link & Teilen', desc: 'QR, Teilen, Kontakt' },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = activeSubSection === item.id;
                  return (
                    <button key={item.id} onClick={() => setActiveSubSection(item.id)} className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${selected ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20' : 'bg-[#181818] text-[#F5F2EA]/80 border-[#3A3732] hover:border-[#F5F2EA]/50 hover:bg-[#202020]'}`}>
                      <Icon size={15} className={selected ? 'text-[#101010]' : 'text-[#E8DCC2]'} />
                      <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">{item.label}</span><span className={`block text-[8.5px] leading-snug mt-0.5 ${selected ? 'text-[#101010]/60' : 'text-stone-500'}`}>{item.desc}</span></span>
                      <LucideIcons.ChevronRight size={13} className="opacity-50" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Card Switcher Footer */}
        <div className="p-3 border-t border-stone-850/80 bg-stone-950/50 space-y-2">
          <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Aktive ureel-Seite</span>
          {cards.length > 0 && activeCard ? (
            <div className="relative">
              <select
                value={activeCard.cardId}
                onChange={(e) => {
                  const card = cards.find(c => c.cardId === e.target.value);
                  if (card) {
                    setActiveCard(card);
                    setEditingBtnId(card.buttons?.[0]?.id || null);
                  }
                }}
                className="w-full bg-stone-900 border border-stone-800 text-white rounded-lg h-8.5 px-2 text-[10.5px] font-bold focus:outline-none focus:border-[#F5F2EA] appearance-none relative pr-6"
              >
                {cards.map(c => (
                  <option key={c.cardId} value={c.cardId}>{c.title || c.slug}</option>
                ))}
              </select>
              <LucideIcons.ChevronsUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          ) : (
            <span className="text-[10px] text-stone-450 italic">Keine Seite vorhanden</span>
          )}
          <button
            onClick={handleCreateNewUreel}
            className="w-full h-9 rounded-xl bg-[#F5F2EA] hover:bg-white text-[#101010] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-black/25"
          >
            <LucideIcons.Plus size={14} />
            Neue ureel erstellen
          </button>
          <button
            onClick={() => setCardManagerOpen(true)}
            className="w-full h-8 rounded-xl border border-[#3A3732] bg-[#181818] hover:bg-[#202020] text-[#F5F2EA] text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <LucideIcons.Layers size={13} />
            Karten verwalten
          </button>
        </div>
      </div>

      {/* COLUMN 3: AKTIVES DETAILPANEL (FORM CONTROLS) */}
      <div className={`order-4 md:order-none flex-1 min-w-0 bg-[#141419] p-4 md:p-6 overflow-y-auto ureel-detail-panel space-y-6 pb-24 md:pb-6 ${mobileSheetOpen ? 'ureel-mobile-sheet-open' : 'ureel-mobile-sheet-closed'}`}>
        <div className="ureel-mobile-sheet-head md:hidden">
          <div className="ureel-mobile-sheet-grip" />
          <div className="ureel-mobile-sheet-actions">
            <button type="button" onClick={() => setMobileSheetOpen(false)} className="ureel-mobile-preview-free">● Vorschau frei</button>
            <button type="button" onClick={() => { setMobileOrbitModule(activeTab); setMobileOrbitOpen(true); setMobileSheetOpen(false); }} className="ureel-mobile-main-menu">Untermenü</button>
          </div>
          <div className={`ureel-mobile-config-context ureel-mobile-config-context--${activeTab}`}>
            <span>{mobileModuleLabels[activeTab] || 'Studio'}{getMobileActiveSettingLabel() ? ` · ${getMobileActiveSettingLabel()}` : ''}</span>
            <strong>{getMobileSubMenuItems(activeTab).find((item) => item.id === activeSubSection)?.label || 'Bearbeiten'}</strong>
            <p>{getMobilePanelHelp()}</p>
          </div>
        </div>
        
        {/* Module Header block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-900 pb-4">
          <div>
            <h1 className="text-base font-black text-white tracking-tight uppercase">
              {activeTab === 'scene' && (activeSubSection === 'scene-video' ? 'Clip-Video / Background Reel' : activeSubSection === 'scene-poster' ? 'Bild / Poster einrichten' : activeSubSection === 'scene-display' ? 'Darstellung & Zuschnitt' : activeSubSection === 'scene-endcard' ? 'Endkarte in der Szene' : 'Farbe, Verlauf & Overlay')}
              {activeTab === 'timeline' && (activeSubSection === 'timeline-texts' ? 'Werbebotschaft' : activeSubSection === 'timeline-templates' ? 'Werbeschriften & Vorlagen' : activeSubSection === 'timeline-style' ? 'Rahmen, Schrift & Effekt' : 'Animations-Timeline')}
              {activeTab === 'buttons' && (activeSubSection === 'buttons-list' ? 'Button-Liste' : activeSubSection === 'buttons-action' ? 'Aktion & Ziel' : activeSubSection === 'buttons-text' ? 'Button-Text' : activeSubSection === 'buttons-icon' ? 'Button-Icon' : activeSubSection === 'buttons-design' ? 'Button-Look' : activeSubSection === 'buttons-size' ? 'Button-Größe' : activeSubSection === 'buttons-transfer' ? 'Design übertragen' : 'Raster & Vorschau')}
              {activeTab === 'endcard' && (activeSubSection === 'endcard-general' ? 'Nachspielsequenz einrichten' : 'Wasserzeichen & Branding')}
  
            {activeTab === 'cards' && (
              <div className="space-y-2">
                <button onClick={() => setCardManagerOpen(true)} className="w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20">
                  <LucideIcons.Layers size={15} className="text-[#101010]" />
                  <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">Meine ureels</span><span className="block text-[8.5px] leading-snug mt-0.5 text-[#101010]/60">öffnen, kopieren, löschen</span></span>
                  <LucideIcons.ChevronRight size={13} className="opacity-50" />
                </button>
              </div>
            )}

            {activeTab === 'design' && (activeSubSection === 'design-desktop' ? 'Desktop-Seite' : activeSubSection === 'design-background' ? 'Desktop-Hintergrund' : activeSubSection === 'design-content' ? 'Desktop-Werbetexte' : 'Link & Teilen')}
              {activeTab === 'cards' && 'Meine ureels / Karten'}
            </h1>
            <p className="text-[10px] text-stone-450 mt-1">
              {activeTab === 'scene' && (activeSubSection === 'scene-video' ? 'Ermöglicht das automatische Abspielen eines Videos oder Loops im Hintergrund.' : activeSubSection === 'scene-poster' ? 'Lege ein ruhiges Cover- oder Werbebild fest, falls kein Video genutzt wird.' : activeSubSection === 'scene-display' ? 'Bestimme, wie 9:16-, 16:9- und Bildinhalte innerhalb der ureel-Karte sitzen.' : activeSubSection === 'scene-endcard' ? 'Steuere den Abschluss der Karte direkt dort, wo Video, Bild und Szene entstehen.' : 'Bestimme Anthrazit-/Cremeflächen, Verläufe, Vignette und Abdunklung.')}
              {activeTab === 'timeline' && (activeSubSection === 'timeline-texts' ? 'Formuliere die Werbebotschaft, die aus Video oder Bild eine Aktion macht.' : activeSubSection === 'timeline-templates' ? 'Wähle eine professionelle Werbeschrift und fülle die Karte mit passenden Texten.' : activeSubSection === 'timeline-style' ? 'Gestalte Rahmen, Textbox, Schrift, Highlight und Animation.' : 'Reguliere millisekundengenaue Animations-Szenen wie bei professionellen Werbeanzeigen.')}
              {activeTab === 'buttons' && getMobilePanelHelp()}
              {activeTab === 'endcard' && (activeSubSection === 'endcard-general' ? 'Bestimme, was abläuft, wenn das Video zu Ende abgespielt wurde.' : 'Entferne ureel-Wasserzeichen oder füge eigene Marken-Logos hinzu.')}
  
            {activeTab === 'cards' && (
              <div className="space-y-2">
                <button onClick={() => setCardManagerOpen(true)} className="w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left bg-[#F5F2EA] text-[#101010] border-[#F5F2EA] shadow-lg shadow-black/20">
                  <LucideIcons.Layers size={15} className="text-[#101010]" />
                  <span className="min-w-0 flex-1"><span className="block text-[10.5px] font-black uppercase tracking-wide leading-tight">Meine ureels</span><span className="block text-[8.5px] leading-snug mt-0.5 text-[#101010]/60">öffnen, kopieren, löschen</span></span>
                  <LucideIcons.ChevronRight size={13} className="opacity-50" />
                </button>
              </div>
            )}

            {activeTab === 'design' && (activeSubSection === 'design-desktop' ? 'Konfiguriere die Desktop-Ansicht als Miniwebseite mit echter Smartphone-Karte daneben.' : activeSubSection === 'design-background' ? 'Wähle Verlauf, Farbe oder ein eigenes Bild für die Desktop-Miniwebseite.' : activeSubSection === 'design-content' ? 'Springe in den Werbetexter und nutze dieselben Vorlagen für die Desktop-Miniwebseite.' : 'Bereite QR-Code, Teilen und Kontakt speichern für den Live-Link vor.')}
              {activeTab === 'cards' && 'Öffne, dupliziere oder lösche deine ureel-Karten.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openLiveLink}
              className="bg-stone-900 hover:bg-stone-850 hover:text-white border border-stone-800 text-stone-300 font-extrabold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 uppercase tracking-wider text-[9.5px]"
            >
              <LucideIcons.ExternalLink size={11} className="text-[#E8DCC2]" />
              <span>Live-Link</span>
            </button>
          </div>
        </div>

        {/* Content Renderers per Section */}
        <div className="space-y-6 max-w-full md:max-w-xl">
          
          {/* TAB 1: SCENE & SCENE BACKGROUNDS */}
          {activeTab === 'scene' && activeSubSection === 'scene-video' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Video / Reel</span>
                    <p className="text-[10px] text-stone-400 mt-1">Ein Videolink macht die Szene zum Reel-Hintergrund. Bild und Farbe werden dabei automatisch deaktiviert.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(activeCard.cardBackgroundImageUrl || (activeCard as any).backgroundImageUrl || activeCard.ureelScene?.backgroundImageUrl) && (
                      <button
                        type="button"
                        onClick={removeSceneImage}
                        className="h-9 px-3 rounded-xl border border-[#3A3732] bg-[#181818] text-[#F5F2EA] text-[9px] uppercase font-black tracking-wider hover:bg-[#242424]"
                      >
                        Bild entfernen
                      </button>
                    )}
                    {(activeCard.backgroundType === 'video' || activeCard.videoBackgroundConfig?.enabled || activeCard.videoBackgroundConfig?.youtubeUrl || activeCard.ureelScene?.mode === 'video' || activeCard.ureelScene?.video?.url) && (
                      <button
                        type="button"
                        onClick={removeSceneVideo}
                        className="h-9 px-3 rounded-xl border border-red-900/40 bg-red-950/30 text-red-200 text-[9px] uppercase font-black tracking-wider hover:bg-red-900/40"
                      >
                        Video entfernen
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Videolink (YouTube oder Shorts)</label>
                  <input
                    type="text"
                    value={activeCard.videoBackgroundConfig?.youtubeUrl || activeCard.ureelScene?.video?.url || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      syncCardUpdate({
                        backgroundType: val ? 'video' : (activeCard.cardBackgroundImageUrl ? 'image' : 'color'),
                        cardBackgroundEnabled: true,
                        videoBackgroundConfig: {
                          ...(activeCard.videoBackgroundConfig || {}),
                          youtubeUrl: val,
                          enabled: !!val,
                          mediaMode: val ? 'youtube' : 'none',
                          videoFitMode: activeCard.videoBackgroundConfig?.videoFitMode || 'contain',
                        } as any,
                        ureelScene: {
                          ...(activeCard.ureelScene || {}),
                          mode: val ? 'video' : (activeCard.cardBackgroundImageUrl ? 'image' : 'color'),
                          video: {
                            ...(activeCard.ureelScene?.video || {}),
                            type: val ? (val.includes('/shorts/') ? 'youtube_shorts' : 'youtube') : 'none',
                            url: val,
                            duration: activeCard.videoBackgroundConfig?.durationSeconds || activeCard.ureelScene?.video?.duration || 12,
                            displayMode: activeCard.ureelScene?.video?.displayMode || 'cover',
                            placement: activeCard.ureelScene?.video?.placement || 'background',
                            heroSize: (activeCard.ureelScene?.video as any)?.heroSize || 'wide',
                            startAt: activeCard.ureelScene?.video?.startAt || 0,
                          }
                        } as any,
                      } as any);
                    }}
                    placeholder="https://youtube.com/shorts/..."
                    className="w-full bg-[#0F0F0F] border border-[#3A3732] h-11 rounded-xl px-3 text-xs text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]"
                  />
                  <p className="text-[9px] text-stone-500 mt-1">Sobald ein Video aktiv ist, sind Hintergrundbild und Farbfläche im Hintergrund deaktiviert.</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-400 mb-2">
                    <span>Maximale Video-Spieldauer</span>
                    <span className="text-[#E8DCC2] font-mono">{(activeCard.videoBackgroundConfig?.durationSeconds || 12)}s</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={15}
                    value={activeCard.videoBackgroundConfig?.durationSeconds || 12}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      syncCardUpdate({
                        videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), durationSeconds: val, duration: val } as any,
                        ureelScene: { ...(activeCard.ureelScene || {}), video: { ...(activeCard.ureelScene?.video || { type: 'none', url: '' }), duration: val } } as any,
                      } as any);
                    }}
                    className="w-full h-1.5 bg-stone-800 accent-[#E8DCC2] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scene' && activeSubSection === 'scene-poster' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Bild / Poster</span>
                <p className="text-[10px] text-stone-400">Lade ein eigenes Werbebild als Hintergrund hoch. Ein Bildlink ist bewusst entfernt, damit der Nutzer sauber über Upload arbeitet.</p>

                {(activeCard.backgroundType === 'video' || activeCard.videoBackgroundConfig?.enabled || activeCard.ureelScene?.mode === 'video') ? (
                  <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 flex items-start gap-3">
                    <LucideIcons.Video size={18} className="text-[#E8DCC2] shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase text-[#F5F2EA]">Video ist aktiv</p>
                      <p className="text-[10px] text-stone-400 leading-relaxed">Solange ein Videolink aktiv ist, kann kein Hintergrundbild hochgeladen werden. Wechsle zum Bereich „Video / Reel“, um den Link zu ändern oder zu entfernen.</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveSubSection('scene-video')}
                          className="h-9 px-3 rounded-xl bg-[#F5F2EA] text-[#101010] text-[9px] uppercase font-black tracking-wider"
                        >Zum Video wechseln</button>
                        {(activeCard.cardBackgroundImageUrl || (activeCard as any).backgroundImageUrl || activeCard.ureelScene?.backgroundImageUrl) && (
                          <button
                            type="button"
                            onClick={removeSceneImage}
                            className="h-9 px-3 rounded-xl border border-red-900/45 bg-red-950/20 text-red-200 text-[9px] uppercase font-black tracking-wider"
                          >Bild entfernen</button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => syncCardUpdate({ backgroundType: 'image', cardBackgroundEnabled: true, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'image', backgroundImageUrl: activeCard.cardBackgroundImageUrl || (activeCard as any).backgroundImageUrl || activeCard.ureelScene?.backgroundImageUrl || '', overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any)}
                      className="min-h-[92px] rounded-2xl border border-[#3A3732] bg-[#181818] hover:border-[#F5F2EA]/60 text-left p-4 transition"
                    >
                      <LucideIcons.ImagePlus size={18} className="text-[#E8DCC2] mb-2" />
                      <span className="block text-[11px] font-black uppercase text-[#F5F2EA]">Bildmodus aktivieren</span>
                      <span className="block text-[9px] text-stone-500 mt-1">Bild statt Video als Bühne nutzen.</span>
                    </button>
                    <div className="rounded-2xl border border-dashed border-[#3A3732] bg-[#181818] p-4 space-y-3">
                      <span className="block text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Hintergrundbild hochladen</span>
                      <label className="h-11 rounded-xl bg-[#F5F2EA] hover:bg-white text-[#101010] text-[9px] uppercase font-black tracking-wider cursor-pointer flex items-center justify-center gap-1.5">
                        <LucideIcons.UploadCloud size={15} /> {sceneImageUploading ? `Upload ${sceneImageUploadProgress || 0}%` : 'Bild hochladen'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleSceneImageUpload(file); e.currentTarget.value = ''; }} />
                      </label>
                      <p className="text-[9px] text-stone-500">Empfohlen: 9:16 Hochformat oder ruhiges Werbebild mit Platz für Text und Buttons.</p>
                      {(activeCard.cardBackgroundImageUrl || (activeCard as any).backgroundImageUrl || activeCard.ureelScene?.backgroundImageUrl || (activeCard.ureelScene as any)?.background?.imageUrl) && <button type="button" onClick={removeSceneImage} className="w-full h-9 rounded-xl border border-red-900/45 bg-red-950/20 text-red-200 text-[8.5px] font-black uppercase tracking-wider">Bild entfernen</button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scene' && activeSubSection === 'scene-display' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Darstellung</span>
                <p className="text-[10px] text-stone-400">Steuere, ob Video oder Bild die ganze Karte füllt oder als ruhiger Hero-Bereich gezeigt wird.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'cover', label: 'Reel füllen', desc: 'Füllt den Smartphone-Screen im 9:16 Rahmen' },
                    { id: 'contain', label: 'Ganz anzeigen', desc: '16:9 über volle Breite direkt oben an der Karte' },
                    { id: 'hero', label: 'Als Video-Bildschirm', desc: 'Kompakter 16:9-Bereich oben mit kleinem Abstand' },
                  ].map((mode) => {
                    const selected = mode.id === 'cover'
                      ? ((activeCard.ureelScene?.video?.displayMode || 'cover') === 'cover' && (activeCard.ureelScene?.video as any)?.placement !== 'hero')
                      : mode.id === 'contain'
                        ? ((activeCard.ureelScene?.video as any)?.placement === 'hero' && ((activeCard.ureelScene?.video as any)?.heroSize || 'wide') === 'wide')
                        : ((activeCard.ureelScene?.video as any)?.placement === 'hero' && (activeCard.ureelScene?.video as any)?.heroSize === 'compact');
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          const currentVideo = activeCard.ureelScene?.video || {};
                          const currentUrl = (currentVideo as any).url || activeCard.videoBackgroundConfig?.youtubeUrl || activeCard.videoBackgroundConfig?.url || '';
                          const duration = activeCard.ureelScene?.video?.duration || activeCard.videoBackgroundConfig?.durationSeconds || 12;
                          syncCardUpdate({
                            backgroundType: 'video',
                            videoBackgroundConfig: {
                              ...(activeCard.videoBackgroundConfig || {}),
                              enabled: !!currentUrl,
                              mediaMode: currentUrl ? 'youtube' : (activeCard.videoBackgroundConfig?.mediaMode || 'none'),
                              youtubeUrl: currentUrl,
                              durationSeconds: duration,
                              videoFitMode: mode.id === 'cover' ? 'cover' : 'contain',
                            } as any,
                            ureelScene: {
                              ...(activeCard.ureelScene || {}),
                              mode: 'video' as const,
                              video: {
                                ...currentVideo,
                                type: (currentVideo as any).type || (currentUrl ? 'youtube' : 'none'),
                                url: currentUrl,
                                duration,
                                displayMode: mode.id === 'cover' ? 'cover' : 'contain',
                                placement: mode.id === 'cover' ? 'background' : 'hero',
                                heroSize: mode.id === 'hero' ? 'compact' : 'wide',
                                startAt: (currentVideo as any).startAt || 0,
                              }
                            } as any
                          });
                        }}
                        className={`min-h-[102px] rounded-2xl border p-4 text-left transition ${selected ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-[#F5F2EA] border-[#3A3732] hover:border-[#F5F2EA]/60'}`}
                      >
                        <span className="block text-[11px] font-black uppercase">{mode.label}</span>
                        <span className={`block text-[9px] mt-1 leading-snug ${selected ? 'text-[#101010]/60' : 'text-stone-500'}`}>{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 text-[10px] text-stone-400 leading-relaxed">
                  Diese Darstellung wirkt direkt im rechten Smartphone-Monitor. Für YouTube/Shorts wird der Player nicht mehr künstlich herangezoomt.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scene' && activeSubSection === 'scene-color' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Farbe / Verlauf</span>
                <p className="text-[10px] text-stone-400 leading-relaxed">Farbe oder Verlauf ist eine eigene Szene. Wenn du hier eine Fläche aktivierst, werden Video und Bild automatisch entfernt, damit der Hintergrund sofort sichtbar ist.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => syncCardUpdate({ cardBackgroundEnabled: true, backgroundType: activeCard.cardBackgroundGradientEnabled ? 'gradient' : 'color', ureelScene: { ...(activeCard.ureelScene || {}), mode: activeCard.cardBackgroundGradientEnabled ? 'gradient' : 'color' } as any } as any)} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-wider ${activeCard.cardBackgroundEnabled !== false && (activeCard.ureelScene?.mode === 'color' || activeCard.ureelScene?.mode === 'gradient') ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>Farbfläche aktiv</button>
                  <button type="button" onClick={() => syncCardUpdate({ cardBackgroundEnabled: false, cardBackgroundGradientEnabled: false, backgroundType: 'color', ureelScene: { ...(activeCard.ureelScene || {}), mode: 'none' } as any } as any)} className="h-10 rounded-xl border border-[#3A3732] bg-[#181818] text-stone-300 text-[9px] font-black uppercase tracking-wider">Farbfläche aus</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Creme', from: '#F5F2EA', to: '#E8DCC2' },
                    { label: 'Anthrazit', from: '#1A1A1A', to: '#3A3732' },
                    { label: 'Warm', from: '#F5F2EA', to: '#B99662' },
                    { label: 'Nacht', from: '#0F0F0F', to: '#2A241E' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => syncCardUpdate({ backgroundType: 'gradient', backgroundImageUrl: '', cardBackgroundImageUrl: '', cardBackgroundEnabled: true, cardBackgroundColor: preset.from, cardBackgroundGradientEnabled: true, cardBackgroundGradientColor: preset.to, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'gradient', backgroundImageUrl: '', backgroundColor: preset.from, gradient: { from: preset.from, to: preset.to, direction: '135deg' }, video: { type: 'none', url: '', duration: activeCard.ureelScene?.video?.duration || 12, displayMode: 'cover', placement: 'background', startAt: 0 }, overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any)}
                      className="h-12 rounded-xl border border-[#3A3732] text-[9px] uppercase font-black tracking-wider text-[#F5F2EA] shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`, color: preset.from === '#F5F2EA' ? '#101010' : '#F5F2EA' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Hintergrundfarbe</label>
                    <div className="flex items-center gap-2 h-9 bg-stone-900 border border-stone-850 rounded-xl px-2">
                      <input
                        type="color"
                        value={activeCard.cardBackgroundColor || '#121212'}
                        onChange={(e) => {
                          syncCardUpdate({ backgroundType: 'color', backgroundImageUrl: '', cardBackgroundImageUrl: '', cardBackgroundEnabled: true, cardBackgroundColor: e.target.value, cardBackgroundGradientEnabled: false, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'color', backgroundImageUrl: '', video: { type: 'none', url: '', duration: activeCard.ureelScene?.video?.duration || 12, displayMode: 'cover', placement: 'background', startAt: 0 }, backgroundColor: e.target.value, overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any);
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 outline-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeCard.cardBackgroundColor || '#121212'}
                        onChange={(e) => {
                          syncCardUpdate({ backgroundType: 'color', backgroundImageUrl: '', cardBackgroundImageUrl: '', cardBackgroundEnabled: true, cardBackgroundColor: e.target.value, cardBackgroundGradientEnabled: false, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'color', backgroundImageUrl: '', video: { type: 'none', url: '', duration: activeCard.ureelScene?.video?.duration || 12, displayMode: 'cover', placement: 'background', startAt: 0 }, backgroundColor: e.target.value, overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any);
                        }}
                        className="bg-transparent border-0 text-white w-full h-full text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Verlaufsfarbe</label>
                    <div className="flex items-center gap-2 h-9 bg-stone-900 border border-stone-850 rounded-xl px-2">
                      <input
                        type="color"
                        value={activeCard.cardBackgroundGradientColor || activeCard.ureelScene?.gradient?.to || '#3A3732'}
                        onChange={(e) => {
                          const to = e.target.value;
                          const from = activeCard.cardBackgroundColor || activeCard.ureelScene?.gradient?.from || '#121212';
                          syncCardUpdate({ backgroundType: 'gradient', backgroundImageUrl: '', cardBackgroundImageUrl: '', cardBackgroundEnabled: true, cardBackgroundGradientEnabled: true, cardBackgroundGradientColor: to, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'gradient', backgroundImageUrl: '', video: { type: 'none', url: '', duration: activeCard.ureelScene?.video?.duration || 12, displayMode: 'cover', placement: 'background', startAt: 0 }, gradient: { from, to, direction: activeCard.cardBackgroundGradientDirection || '135deg' }, overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any);
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const from = activeCard.cardBackgroundColor || '#121212';
                          const to = activeCard.cardBackgroundGradientColor || '#3A3732';
                          syncCardUpdate({ backgroundType: 'gradient', backgroundImageUrl: '', cardBackgroundImageUrl: '', cardBackgroundEnabled: true, cardBackgroundGradientEnabled: true, videoBackgroundConfig: { ...(activeCard.videoBackgroundConfig || {}), enabled: false, youtubeUrl: '', mediaMode: 'none' } as any, ureelScene: { ...(activeCard.ureelScene || {}), mode: 'gradient', backgroundImageUrl: '', video: { type: 'none', url: '', duration: activeCard.ureelScene?.video?.duration || 12, displayMode: 'cover', placement: 'background', startAt: 0 }, gradient: { from, to, direction: activeCard.cardBackgroundGradientDirection || '135deg' }, overlay: { ...(activeCard.ureelScene?.overlay || { blur: 0, vignette: false }), darken: 0 } } as any } as any);
                        }}
                        className="ml-auto text-[9px] font-black uppercase tracking-wider text-[#E8DCC2]"
                      >Verlauf aktivieren</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & WERBETEXTER */}
          {activeTab === 'timeline' && activeSubSection === 'timeline-texts' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Werbebotschaft</span>
                    <p className="text-[10px] text-stone-400 mt-1 max-w-xl">Headline, Slogan und Beschreibung werden als Werbeschrift über deine Szene gelegt.</p>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-stone-500 border border-[#3A3732] rounded-full px-3 py-1">Live im Preview</div>
                </div>
                {desktopPage.lastEditorSource === 'design' && (
                  <div className="rounded-2xl border border-[#E8DCC2]/35 bg-[#F5F2EA]/8 p-3 flex items-center justify-between gap-3">
                    <div><span className="text-[9px] uppercase font-black tracking-wider text-[#E8DCC2]">Design-Modus</span><p className="text-[9px] text-stone-400 mt-0.5">Diese Werbetexte werden auch für die Desktop-Miniwebseite verwendet.</p></div>
                    <button type="button" onClick={() => { setActiveTab('design'); setActiveSubSection('design-content'); }} className="h-8 px-3 rounded-xl bg-[#F5F2EA] text-[#101010] text-[8px] font-black uppercase tracking-wider">Zurück</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Hauptüberschrift</label>
                    <input
                      type="text"
                      value={textDraft.title}
                      onChange={(e) => { setTextDirty(true); setTextDraft((draft) => ({ ...draft, title: e.target.value })); }}
                      onBlur={flushTextDraft}
                      className="w-full bg-[#1A1A1A] border border-[#3A3732] h-11 px-3 rounded-2xl text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E8DCC2]"
                      placeholder="z.B. Mehr Kunden im Handumdrehen!"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Untertitel / Slogan</label>
                    <input
                      type="text"
                      value={textDraft.subtitle}
                      onChange={(e) => { setTextDirty(true); setTextDraft((draft) => ({ ...draft, subtitle: e.target.value })); }}
                      onBlur={flushTextDraft}
                      className="w-full bg-[#1A1A1A] border border-[#3A3732] h-11 px-3 rounded-2xl text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E8DCC2]"
                      placeholder="z.B. Kurz ansehen. Direkt reagieren."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Werbetext / Beschreibung</label>
                  <textarea
                    value={textDraft.description}
                    onChange={(e) => { setTextDirty(true); setTextDraft((draft) => ({ ...draft, description: e.target.value })); }}
                    onBlur={flushTextDraft}
                    rows={4}
                    className="w-full bg-[#1A1A1A] border border-[#3A3732] p-3 rounded-2xl text-sm text-[#F5F2EA] focus:outline-none focus:border-[#E8DCC2] resize-none"
                    placeholder="Beschreibe kurz Nutzen, Angebot und nächsten Schritt."
                  />
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Sichtbarkeit</span>
                    <p className="text-[9px] text-stone-500 mt-1">Blende einzelne Werbetext-Ebenen aus, ohne den Text zu löschen.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'title', label: 'Titel' },
                      { key: 'subtitle', label: 'Slogan' },
                      { key: 'description', label: 'Text' },
                    ].map((item) => {
                      const enabled = isTextLayerEnabled(item.key as any);
                      const hasContent = hasTextLayerContent(item.key as any);
                      return (
                        <button key={item.key} type="button" onClick={() => setTextLayerEnabled(item.key as any, !enabled)} className={`h-10 rounded-xl border text-[10px] font-black uppercase transition ${enabled && hasContent ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#111111] text-stone-500 border-[#3A3732]'}`}>
                          {item.label} {!hasContent ? 'LEER' : enabled ? 'AN' : 'AUS'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Werbetext-Timer</span>
                      <p className="text-[9px] text-stone-500 mt-1">Wähle: komplette Werbevorlage als ein Block – oder Titel, Slogan und Beschreibung einzeln einblenden.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdCopyBlockMode(!isAdCopyBlockEnabled)}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider ${isAdCopyBlockEnabled ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#101010] text-stone-400 border-[#3A3732]'}`}
                    >
                      Block {isAdCopyBlockEnabled ? 'AN' : 'AUS'}
                    </button>
                  </div>

                  {isAdCopyBlockEnabled ? (
                    <div className="rounded-xl border border-[#3A3732] bg-[#101010] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#F5F2EA]">Werbetexter-Block</span>
                          <p className="text-[8.5px] text-stone-500 mt-0.5">Alle aktiven Textfelder erscheinen zusammen mit der gewählten Vorlage.</p>
                        </div>
                        <span className="text-[9px] font-mono text-[#E8DCC2]">{Number((activeCard.ureelTimeline as any)?.adTextAt ?? timeline.titleAt).toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={timelineDuration}
                        step={0.1}
                        value={Number((activeCard.ureelTimeline as any)?.adTextAt ?? timeline.titleAt)}
                        onChange={(e) => updateTimelineAnyField('adTextAt', parseFloat(e.target.value))}
                        className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: 'titleAt', field: 'title', label: 'Titel', value: timeline.titleAt },
                        { key: 'subtitleAt', field: 'subtitle', label: 'Slogan', value: timeline.subtitleAt },
                        { key: 'descriptionAt', field: 'description', label: 'Beschreibung', value: timeline.descriptionAt },
                      ].map((item) => {
                        const enabled = isTextLayerEnabled(item.field as any);
                        const hasContent = hasTextLayerContent(item.field as any);
                        return (
                          <div key={item.key} className={`rounded-xl border p-3 ${enabled && hasContent ? 'border-[#3A3732] bg-[#101010]' : 'border-stone-900 bg-stone-950/40 opacity-75'}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase text-[#F5F2EA]">{item.label}</span>
                                <span className="ml-2 text-[9px] font-mono text-[#E8DCC2]">{Number(item.value).toFixed(1)}s</span>
                              </div>
                              <button type="button" onClick={() => setTextLayerEnabled(item.field as any, !enabled)} className={`px-2 py-1 rounded-full border text-[8px] uppercase font-black ${enabled && hasContent ? 'border-[#E8DCC2] text-[#E8DCC2]' : 'border-stone-700 text-stone-500'}`}>
                                {!hasContent ? 'leer' : enabled ? 'an' : 'aus'}
                              </button>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={timelineDuration}
                              step={0.1}
                              value={Number(item.value)}
                              disabled={!hasContent}
                              onChange={(e) => updateTimelineField(item.key as keyof Omit<UreelTimeline, 'preset'>, parseFloat(e.target.value))}
                              className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-35"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Textgrößen</span>
                      <p className="text-[9px] text-stone-500 mt-1">Diese Größen sind sofort im Werbe-Monitor sichtbar.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[8px] font-black uppercase">
                      {(['compact','balanced','poster'] as const).map((preset) => (
                        <button key={preset} type="button" onClick={() => applyAdTextSizePreset(preset)} className={`h-8 px-2 rounded-lg border ${adTextSizePreset() === preset ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#111111] text-stone-400 border-[#3A3732]'}`}>{preset === 'compact' ? 'Klein' : preset === 'balanced' ? 'Mittel' : 'Groß'}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { key: 'heroTitleSize', label: 'Headline', fallback: 30, min: 16, max: 52 },
                      { key: 'heroSubtitleSize', label: 'Slogan', fallback: 12, min: 8, max: 24 },
                      { key: 'heroDescriptionSize', label: 'Beschreibung', fallback: 11, min: 8, max: 22 },
                    ].map((item) => (
                      <div key={item.key}>
                        <div className="flex justify-between text-[9px] uppercase font-bold text-stone-400 mb-1"><span>{item.label}</span><span>{clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max).toFixed(0)}px</span></div>
                        <input type="range" min={item.min} max={item.max} step="1" value={clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max)} onChange={(e) => syncCardUpdate({ [item.key]: Number(e.target.value) } as any)} className="w-full accent-[#E8DCC2]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Schrift & Farben</span>
                    <p className="text-[9px] text-stone-500 mt-1">Titel, Slogan und Beschreibung können eigene Schriftart und Farbe haben.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Titel', fontKey: 'heroTitleFontStyle', colorKey: 'heroTitleTextColor', fallback: '#F5F2EA' },
                      { label: 'Slogan', fontKey: 'heroSubtitleFontStyle', colorKey: 'heroSubtitleTextColor', fallback: '#E8DCC2' },
                      { label: 'Beschreibung', fontKey: 'heroDescFontStyle', colorKey: 'heroDescTextColor', fallback: '#D8D2C5' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-[#3A3732] bg-[#101010] p-3 space-y-2">
                        <span className="block text-[9px] uppercase font-black tracking-wider text-stone-400">{item.label}</span>
                        <select value={(activeCard as any)[item.fontKey] || currentTextTemplate.fontStyle || 'modern'} onChange={(e) => syncCardUpdate({ [item.fontKey]: e.target.value } as any)} className="w-full h-9 rounded-xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-2 text-[11px] font-bold focus:outline-none focus:border-[#E8DCC2]">
                          <option value="modern">Modern</option>
                          <option value="elegant">Elegant</option>
                          <option value="serif">Serif</option>
                          <option value="condensed">Condensed</option>
                          <option value="tech">Tech Mono</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input type="color" value={(activeCard as any)[item.colorKey] || item.fallback} onChange={(e) => syncCardUpdate({ [item.colorKey]: e.target.value } as any)} className="w-10 h-9 rounded-lg bg-[#181818] border border-[#3A3732] p-1" />
                          <input value={(activeCard as any)[item.colorKey] || item.fallback} onChange={(e) => syncCardUpdate({ [item.colorKey]: e.target.value } as any)} className="flex-1 h-9 rounded-xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-2 text-[10px] font-mono focus:outline-none focus:border-[#E8DCC2]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block mb-1">Text-Ideen anwenden</span>
                  <p className="text-[9px] text-stone-500 mb-3">Füllt nur leere Textfelder. Bereits eingegebener Text bleibt erhalten.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'product', label: 'Produkt', icon: LucideIcons.Box },
                    { id: 'offer', label: 'Angebot', icon: LucideIcons.BadgePercent },
                    { id: 'event', label: 'Event', icon: LucideIcons.CalendarDays },
                    { id: 'contact', label: 'Kontakt', icon: LucideIcons.Contact },
                    { id: 'gastro', label: 'Gastro', icon: LucideIcons.Utensils },
                    { id: 'realestate', label: 'Immobilie', icon: LucideIcons.Home },
                    { id: 'recruiting', label: 'Job', icon: LucideIcons.BriefcaseBusiness },
                    { id: 'service', label: 'Service', icon: LucideIcons.Wrench },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => applyCopyPreset(item.id as any)}
                        className="min-h-[58px] rounded-2xl border border-[#3A3732] bg-[#181818] hover:bg-[#F5F2EA] hover:text-[#101010] text-[#F5F2EA] transition flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wide"
                      >
                        <Icon size={15} />
                        {item.label}
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && activeSubSection === 'timeline-templates' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Werbeschriften</span>
                  <p className="text-[10px] text-stone-400 mt-1">Eine Vorlage steuert Schrift, Rahmen, Box, Animation und empfohlene Wirkung.</p>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Vorlagen-Größe</span>
                      <p className="text-[9px] text-stone-500 mt-1">Passe die gewählte Vorlage leicht an, damit sie auf Video, Bild und Buttons besser wirkt.</p>
                    </div>
                    <span className="text-[8px] uppercase font-mono text-stone-500">{adTextSizePreset()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact','balanced','poster'] as const).map((preset) => (
                      <button key={preset} type="button" onClick={() => applyAdTextSizePreset(preset)} className={`h-10 rounded-xl border text-[10px] font-black uppercase transition ${adTextSizePreset() === preset ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#111111] text-[#F5F2EA] border-[#3A3732] hover:border-[#E8DCC2]/70'}`}>
                        {preset === 'compact' ? 'Kompakt' : preset === 'balanced' ? 'Balance' : 'Poster'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { key: 'heroTitleSize', label: 'Headline', min: 16, max: 52, fallback: 30 },
                      { key: 'heroSubtitleSize', label: 'Slogan', min: 8, max: 24, fallback: 12 },
                      { key: 'heroDescriptionSize', label: 'Beschreibung', min: 8, max: 22, fallback: 11 },
                    ].map((item) => (
                      <div key={item.key}>
                        <div className="flex justify-between text-[9px] uppercase font-bold text-stone-400 mb-1"><span>{item.label}</span><span>{clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max).toFixed(0)}px</span></div>
                        <input type="range" min={item.min} max={item.max} step="1" value={clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max)} onChange={(e) => syncCardUpdate({ [item.key]: Number(e.target.value) } as any)} className="w-full accent-[#E8DCC2]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => applyTextTemplatePreset('none')}
                    className={`p-4 rounded-2xl border text-left transition ${currentTextTemplate.style === 'none' ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-[#F5F2EA] border-[#3A3732] hover:border-[#E8DCC2]/70'}`}
                  >
                    <div className="text-sm font-black">Klassisch</div>
                    <div className="text-[10px] opacity-60 mt-1">Ohne Spezialrahmen, neutral und direkt.</div>
                  </button>
                  {Object.values(UREEL_TEXT_TEMPLATES).map((tmpl) => {
                    const selected = currentTextTemplate.style === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => applyTextTemplatePreset(tmpl.id)}
                        className={`p-4 rounded-2xl border text-left transition ${selected ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-[#F5F2EA] border-[#3A3732] hover:border-[#E8DCC2]/70'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-black">{lang === 'de' ? tmpl.labelDe : tmpl.labelEn}</div>
                          {selected && <LucideIcons.Check size={16} />}
                        </div>
                        <div className="text-[10px] opacity-60 mt-1 leading-snug">{lang === 'de' ? tmpl.descriptionDe : tmpl.descriptionEn}</div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-wide opacity-70">
                          <span className="px-2 py-1 rounded-full border border-current/20">{tmpl.defaultFrame}</span>
                          <span className="px-2 py-1 rounded-full border border-current/20">{tmpl.defaultBox}</span>
                          <span className="px-2 py-1 rounded-full border border-current/20">{tmpl.defaultAnimation}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && activeSubSection === 'timeline-style' && (
            <div className="space-y-4">
              <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Rahmen & Werbestil</span>
                    <p className="text-[10px] text-stone-400 mt-1">Macht aus Text eine Werbeschrift: Rahmen, Textbox, Font, Animation und Highlight.</p>
                  </div>
                  {selectedTextTemplatePreset && (
                    <span className="rounded-full bg-[#F5F2EA] text-[#101010] px-3 py-1 text-[9px] font-black uppercase">{lang === 'de' ? selectedTextTemplatePreset.labelDe : selectedTextTemplatePreset.labelEn}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Rahmen</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['none','Ohne'], ['thin','Fein'], ['corner','Ecken'], ['underline','Unterlinie'], ['side_line','Seitenlinie'], ['badge','Badge']
                      ].map(([value,label]) => (
                        <button key={value} onClick={() => updateTextTemplate({ frame: { ...currentTextTemplate.frame, type: value } })} className={`min-h-[42px] rounded-xl border text-[11px] font-bold transition ${currentTextTemplate.frame.type === value ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732] hover:border-[#E8DCC2]/60'}`}>{label}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Textbox</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['none','Keine'], ['transparent','Transparent'], ['glass','Glas'], ['dark','Dunkel'], ['light','Creme']
                      ].map(([value,label]) => (
                        <button key={value} onClick={() => updateTextTemplate({ box: { ...currentTextTemplate.box, type: value } })} className={`min-h-[42px] rounded-xl border text-[11px] font-bold transition ${currentTextTemplate.box.type === value ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732] hover:border-[#E8DCC2]/60'}`}>{label}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Schriftstil</label>
                    <select value={currentTextTemplate.fontStyle} onChange={(e) => updateTextTemplate({ fontStyle: e.target.value })} className="w-full h-11 rounded-2xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-3 text-sm focus:outline-none focus:border-[#E8DCC2]">
                      <option value="modern">Modern</option>
                      <option value="elegant">Elegant</option>
                      <option value="serif">Serif</option>
                      <option value="condensed">Condensed</option>
                      <option value="tech">Tech Mono</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Animation</label>
                    <select value={currentTextTemplate.animation} onChange={(e) => { updateTextTemplate({ animation: e.target.value }); setTextAnimationSeed((n) => n + 1); }} className="w-full h-11 rounded-2xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-3 text-sm focus:outline-none focus:border-[#E8DCC2]">
                      <option value="fade">Sanft erscheinen</option>
                      <option value="slide_left">Von links</option>
                      <option value="slide_up">Von unten</option>
                      <option value="reveal">Aufklappen</option>
                      <option value="focus">Fokus</option>
                    </select>
                    <button type="button" onClick={() => setTextAnimationSeed((n) => n + 1)} className="mt-2 w-full h-9 rounded-xl border border-[#3A3732] bg-[#181818] text-[#F5F2EA] text-[9px] font-black uppercase tracking-wider">Animation ansehen</button>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-[#3A3732] bg-[#101010] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">Animationsdauer</label>
                        <p className="text-[8.5px] text-stone-500 mt-0.5">Bis 3 Sekunden, damit Werbeschriften langsam wie ein Mini-Werbespot einblenden können.</p>
                      </div>
                      <span className="text-[9px] font-mono text-[#E8DCC2]">{adAnimationDuration.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3}
                      step={0.1}
                      value={adAnimationDuration}
                      onChange={(e) => { updateTextTemplate({ animationDuration: parseFloat(e.target.value) } as any); setTextAnimationSeed((n) => n + 1); }}
                      className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[9.5px] uppercase font-black tracking-wider text-[#E8DCC2]">Vorlagen-Größe</span>
                      <p className="text-[9px] text-stone-500 mt-0.5">Die Werbeschrift muss komplett in der Vorschau sichtbar bleiben.</p>
                    </div>
                    <span className="text-[8px] uppercase font-mono text-stone-500">{adTextSizePreset()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['compact','balanced','poster'] as const).map((preset) => (
                      <button key={preset} type="button" onClick={() => applyAdTextSizePreset(preset)} className={`h-10 rounded-xl border text-[10px] font-black uppercase transition ${adTextSizePreset() === preset ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#111111] text-[#F5F2EA] border-[#3A3732] hover:border-[#E8DCC2]/70'}`}>
                        {preset === 'compact' ? 'Kompakt' : preset === 'balanced' ? 'Balance' : 'Poster'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { key: 'heroTitleSize', label: 'Headline', min: 16, max: 52, fallback: 30 },
                      { key: 'heroSubtitleSize', label: 'Slogan', min: 8, max: 24, fallback: 12 },
                      { key: 'heroDescriptionSize', label: 'Beschreibung', min: 8, max: 22, fallback: 11 },
                    ].map((item) => (
                      <div key={item.key}>
                        <div className="flex justify-between text-[9px] uppercase font-bold text-stone-400 mb-1"><span>{item.label}</span><span>{clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max).toFixed(0)}px</span></div>
                        <input type="range" min={item.min} max={item.max} step="1" value={clampTextSize((activeCard as any)[item.key], item.fallback, item.min, item.max)} onChange={(e) => syncCardUpdate({ [item.key]: Number(e.target.value) } as any)} className="w-full accent-[#E8DCC2]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Akzentfarbe</label>
                    <input type="color" value={currentTextTemplate.frame.color || '#E8DCC2'} onChange={(e) => updateTextTemplate({ frame: { ...currentTextTemplate.frame, color: e.target.value }, emphasis: { ...currentTextTemplate.emphasis, color: e.target.value } })} className="w-full h-11 rounded-xl bg-[#181818] border border-[#3A3732] p-1" />
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Highlight</label>
                    <select value={currentTextTemplate.emphasis.mode} onChange={(e) => updateTextTemplate({ emphasis: { ...currentTextTemplate.emphasis, mode: e.target.value } })} className="w-full h-11 rounded-2xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-3 text-sm focus:outline-none focus:border-[#E8DCC2]">
                      <option value="none">Kein Highlight</option>
                      <option value="last_word">Letztes Wort</option>
                      <option value="custom_word">Eigenes Wort</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Highlight-Wort</label>
                    <input value={currentTextTemplate.emphasis.word || ''} onChange={(e) => updateTextTemplate({ emphasis: { ...currentTextTemplate.emphasis, word: e.target.value } })} className="w-full h-11 rounded-2xl bg-[#181818] border border-[#3A3732] text-[#F5F2EA] px-3 text-sm focus:outline-none focus:border-[#E8DCC2]" placeholder="z.B. Aktion" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && activeSubSection === 'timeline-times' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-5">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Timeline-Steuerung</span>
                  <p className="text-[9.5px] text-stone-400 mt-1">Steuere, wann Text, Buttons und Endkarte in der ureel-Karte erscheinen. Die Zeitsteuerung läuft unabhängig davon, ob das Video lädt.</p>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Preset</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'direct', label: 'Direkt sichtbar' },
                      { id: 'short_intro', label: 'Kurzes Intro' },
                      { id: 'ad_reel', label: 'Werbe-Reel' },
                      { id: 'manual', label: 'Manuell' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyTimeline(valuesForTimelinePreset(preset.id as UreelTimeline['preset']))}
                        className={`min-h-[44px] px-2 py-2 rounded-xl border text-[9.5px] font-black uppercase tracking-wide transition cursor-pointer ${
                          timeline.preset === preset.id
                            ? 'border-purple-500 bg-purple-950/35 text-white shadow-lg shadow-purple-950/20'
                            : 'border-stone-850 bg-stone-900/50 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Videolänge</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[12, 15].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => applyDuration(duration as 12 | 15)}
                        className={`min-h-[44px] rounded-xl border text-xs font-black transition cursor-pointer ${
                          timelineDuration === duration
                            ? 'border-[#F5F2EA] bg-[#F5F2EA] text-[#101010]'
                            : 'border-stone-850 bg-stone-900 text-stone-400 hover:bg-stone-850'
                        }`}
                      >
                        {duration} Sekunden
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Werbetexter-Timer</span>
                      <p className="text-[9px] text-stone-500 mt-1">Block AN = ganze Werbevorlage kommt zusammen. Block AUS = Titel, Untertitel und Beschreibung einzeln timen.</p>
                    </div>
                    <button type="button" onClick={() => setAdCopyBlockMode(!isAdCopyBlockEnabled)} className={`px-3 py-2 rounded-xl border text-[8px] font-black uppercase tracking-wider ${isAdCopyBlockEnabled ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#101010] text-stone-400 border-[#3A3732]'}`}>
                      Block {isAdCopyBlockEnabled ? 'AN' : 'AUS'}
                    </button>
                  </div>
                  {isAdCopyBlockEnabled && (
                    <div className="rounded-xl border border-[#3A3732] bg-[#101010] p-3">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-stone-400 mb-2"><span>Werbevorlage erscheint bei</span><span className="text-[#E8DCC2] font-mono">{Number((activeCard.ureelTimeline as any)?.adTextAt ?? timeline.titleAt).toFixed(1)}s</span></div>
                      <input type="range" min={0} max={timelineDuration} step={0.1} value={Number((activeCard.ureelTimeline as any)?.adTextAt ?? timeline.titleAt)} onChange={(e) => updateTimelineAnyField('adTextAt', parseFloat(e.target.value))} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'titleAt', label: isAdCopyBlockEnabled ? 'Titel im Block' : 'Titel erscheint bei' },
                    { key: 'subtitleAt', label: 'Untertitel erscheint bei' },
                    { key: 'descriptionAt', label: 'Beschreibung erscheint bei' },
                    { key: 'buttonsAt', label: 'Buttons erscheinen bei' },
                    { key: 'endCardAt', label: 'Endkarte erscheint bei' },
                  ].map((item) => {
                    const value = Number((timeline as any)[item.key] || 0);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-400 mb-1.5 gap-2">
                          <div className="flex items-center gap-2">
                            <span>{item.label}</span>
                            {['titleAt','subtitleAt','descriptionAt'].includes(item.key) && (() => {
                              const fieldMap: any = { titleAt: 'title', subtitleAt: 'subtitle', descriptionAt: 'description' };
                              const field = fieldMap[item.key] as 'title' | 'subtitle' | 'description';
                              const enabled = isTextLayerEnabled(field);
                              return (
                                <button type="button" onClick={() => setTextLayerEnabled(field, !enabled)} className={`px-2 py-0.5 rounded-full border text-[7px] uppercase font-black ${enabled ? 'border-[#E8DCC2] text-[#E8DCC2]' : 'border-stone-700 text-stone-500'}`}>
                                  {enabled ? 'AN' : 'AUS'}
                                </button>
                              );
                            })()}
                          </div>
                          <span className="text-[#E8DCC2] font-mono">{value.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={timelineDuration}
                          step={0.1}
                          value={value}
                          onChange={(e) => updateTimelineField(item.key as keyof Omit<UreelTimeline, 'preset'>, parseFloat(e.target.value))}
                          className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="bg-stone-900/70 border border-stone-850 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[10.5px] font-black text-white">Endkarte aktivieren</span>
                      <span className="block text-[8.5px] text-stone-500">Zeigt nach dem Intro eine stabile klickbare Abschlusskarte.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEndCard({ enabled: !endCard.enabled })}
                      className={`p-1 w-10 rounded-full transition-colors flex shrink-0 ${endCard.enabled ? 'bg-[#F5F2EA] justify-end' : 'bg-stone-800 justify-start'} cursor-pointer`}
                    >
                      <span className="w-4 h-4 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[10.5px] font-black text-white">Replay-Button anzeigen</span>
                      <span className="block text-[8.5px] text-stone-500">Besucher können das Intro erneut starten.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEndCard({ replayButton: !endCard.replayButton })}
                      className={`p-1 w-10 rounded-full transition-colors flex shrink-0 ${endCard.replayButton !== false ? 'bg-[#F5F2EA] justify-end' : 'bg-stone-800 justify-start'} cursor-pointer`}
                    >
                      <span className="w-4 h-4 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Endkarte-Verhalten</label>
                    <select
                      value={endCard.source || 'scene'}
                      onChange={(e) => setEndCard({ source: e.target.value as UreelEndCard['source'] })}
                      className="w-full bg-stone-950 border border-stone-800 h-9 px-3 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#F5F2EA]"
                    >
                      <option value="scene">Szene bleibt sichtbar</option>
                      <option value="poster">Poster / Standbild</option>
                      <option value="color">Farbe</option>
                      <option value="gradient">Verlauf</option>
                      <option value="image">Eigenes Bild</option>
                    </select>
                  </div>
                </div>

                <div className="bg-stone-950 border border-stone-850 rounded-xl p-3">
                  <div className="relative h-10 rounded-lg bg-stone-900 overflow-hidden border border-stone-800">
                    <div className="absolute left-0 top-0 bottom-0 bg-[#F5F2EA]/15" style={{ width: `${Math.min(100, (timelineSec / timelineDuration) * 100)}%` }} />
                    {[
                      { label: 'Titel', value: timeline.titleAt },
                      { label: 'Untertitel', value: timeline.subtitleAt },
                      { label: 'Text', value: timeline.descriptionAt },
                      { label: 'Buttons', value: timeline.buttonsAt },
                      { label: 'Endkarte', value: timeline.endCardAt },
                    ].map((mark) => (
                      <div
                        key={mark.label}
                        className="absolute top-1 bottom-1 w-px bg-[#E8DCC2]/80"
                        style={{ left: `${Math.min(100, (Number(mark.value) / timelineDuration) * 100)}%` }}
                        title={`${mark.label}: ${Number(mark.value).toFixed(1)}s`}
                      >
                        <span className="absolute top-full mt-1 -translate-x-1/2 text-[7px] text-stone-500 whitespace-nowrap">{mark.label}</span>
                      </div>
                    ))}
                    <div className="absolute inset-x-2 top-2 flex justify-between text-[8px] text-stone-500 font-mono pointer-events-none">
                      <span>0s</span>
                      <span>{timelineDuration}s</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button type="button" onClick={restartPreviewSimulation} className="min-h-[44px] bg-[#F5F2EA] hover:bg-white text-[#101010] rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">Simulation einmal starten</button>
                  <button type="button" onClick={() => applyTimeline(valuesForTimelinePreset('direct'))} className="min-h-[44px] bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">Alles sofort anzeigen</button>
                  <button type="button" onClick={() => applyTimeline(valuesForTimelinePreset('ad_reel'))} className="min-h-[44px] bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">Als Werbe-Reel timen</button>
                  <button type="button" onClick={() => applyTimeline(valuesForTimelinePreset('direct'))} className="min-h-[44px] bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">Timing zurücksetzen</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUTTONS & COLUMNS */}
          {activeTab === 'buttons' && (
            <div className="space-y-4">
              {!editingButton && (
                <div className="rounded-2xl border border-dashed border-[#3A3732] bg-[#111111] p-5 text-center">
                  <LucideIcons.MousePointerClick className="mx-auto mb-2 text-[#E8DCC2]" size={28} />
                  <p className="text-sm font-black text-[#F5F2EA]">Noch kein Button ausgewählt</p>
                  <p className="text-[10px] text-stone-500 mt-1">Wähle einen Button aus der Button-Liste oder erstelle eine neue ureel-Aktion.</p>
                  <button onClick={handleAddButtonLocal} className="mt-4 h-10 px-4 rounded-xl bg-[#F5F2EA] text-[#101010] font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-2">
                    <LucideIcons.Plus size={14} /> Button hinzufügen
                  </button>
                </div>
              )}

              {['buttons-text','buttons-icon','buttons-size','buttons-transfer'].includes(activeSubSection) && editingButton && (
                <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">
                      {activeSubSection === 'buttons-text' ? 'Button-Text' : activeSubSection === 'buttons-icon' ? 'Icon & Symbol' : activeSubSection === 'buttons-size' ? 'Größe & Raster' : 'Design übertragen'}
                    </span>
                    <p className="text-[9.5px] text-stone-500 mt-1">
                      {activeSubSection === 'buttons-transfer' ? 'Übertrage den Look dieses Buttons auf alle anderen Buttons.' : 'Bearbeite den aktuellen Button. Die Änderung ist in der Vorschau sichtbar.'}
                    </p>
                  </div>

                  {activeSubSection === 'buttons-text' && (
                    <div className="grid gap-3">
                      <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider">Buttontext</label>
                      <input value={editingButton.title || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { title: e.target.value })} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-sm font-semibold text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                      <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider">Zweite Zeile</label>
                      <input value={(editingButton as any).subtitle || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { subtitle: e.target.value } as any)} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-sm font-semibold text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                    </div>
                  )}

                  {activeSubSection === 'buttons-icon' && (
                    <div className="grid grid-cols-3 gap-2">
                      {['phone','globe','mail','file','folder','company'].map((icon) => (
                        <button key={icon} type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { icon } as any)} className="h-11 rounded-xl border border-[#3A3732] bg-[#181818] text-[#F5F2EA] text-[10px] font-black uppercase">{icon}</button>
                      ))}
                    </div>
                  )}

                  {activeSubSection === 'buttons-size' && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-stone-450"><span>Buttongröße</span><span>{buttonSizePx}px</span></div>
                      <input type="range" min={54} max={108} step={2} value={buttonSizePx} onChange={(e) => syncCardUpdate({ buttonSizePx: Number(e.target.value), buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), buttonSizePx: Number(e.target.value) } as any })} className="w-full accent-[#E8DCC2]" />
                    </div>
                  )}

                  {activeSubSection === 'buttons-transfer' && (
                    <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                      <p className="text-[11px] text-stone-400">Farbe, Form, Rahmen, Iconstil und Größe dieses Buttons werden auf alle anderen Buttons übertragen.</p>
                      <button type="button" onClick={transferButtonDesignToAll} className="w-full h-11 rounded-xl bg-[#F5F2EA] text-[#101010] text-[11px] font-black uppercase tracking-wider">Auf alle übertragen</button>
                    </div>
                  )}
                </div>
              )}

              {activeSubSection === 'buttons-list' && (
                <div className="space-y-4">
                  <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Button-Liste</span>
                        <p className="text-[9.5px] text-stone-500 mt-1">Jeder Button ist selbst eine kleine Karte. Aktionen sitzen direkt auf der Karte.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={handleApplyStarterButtons} className="h-10 px-3 rounded-xl border border-[#E8DCC2]/40 bg-[#181818] text-[#F5F2EA] text-[9px] font-black uppercase tracking-wider flex items-center gap-2">
                          <LucideIcons.LayoutGrid size={13} /> 6 Startbuttons
                        </button>
                        <button onClick={handleAddButtonLocal} className="h-10 px-3 rounded-xl bg-[#F5F2EA] text-[#101010] text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <LucideIcons.Plus size={14} /> Neu
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...(activeCard.buttons || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((button, index) => {
                        const selected = editingBtnId === button.id;
                        const actionLabel = actionOptions.find((option) => option.value === button.actionType)?.label || button.actionType || 'Aktion';
                        return (
                          <div key={button.id || index} className={`rounded-2xl border p-3 transition ${selected ? 'border-[#F5F2EA] bg-[#F5F2EA]/8' : 'border-[#3A3732] bg-[#181818]'}`}>
                            <button
                              type="button"
                              onClick={() => { setEditingBtnId(button.id); setActiveSubSection('buttons-action'); }}
                              className="w-full text-left flex items-center gap-3"
                            >
                              <div className="w-12 h-12 shrink-0 rounded-2xl overflow-hidden border border-[#3A3732] bg-[#0F0F0F]">
                                {renderButtonPreviewTile(button, true)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-[8px] font-mono text-stone-500">#{index + 1}</span>
                                <span className="block text-[12px] font-black text-[#F5F2EA] truncate">{button.title || '(Unbenannt)'}</span>
                                <span className="block text-[9px] text-stone-500 truncate">{actionLabel} · {button.isActive !== false ? 'Aktiv' : 'Inaktiv'}</span>
                              </div>
                              <LucideIcons.ChevronRight size={14} className="text-stone-500" />
                            </button>
                            <div className="grid grid-cols-5 gap-2 mt-3">
                              <button type="button" disabled={index === 0} onClick={() => handleMoveButtonLocal(button.id, -1)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] disabled:opacity-30 text-[8px] font-black uppercase flex items-center justify-center gap-1" title="Nach oben verschieben">
                                <LucideIcons.ArrowUp size={10} /> Hoch
                              </button>
                              <button type="button" disabled={index === (activeCard.buttons || []).length - 1} onClick={() => handleMoveButtonLocal(button.id, 1)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] disabled:opacity-30 text-[8px] font-black uppercase flex items-center justify-center gap-1" title="Nach unten verschieben">
                                <LucideIcons.ArrowDown size={10} /> Runter
                              </button>
                              <button type="button" onClick={() => handleCopyButtonLocal(button)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] text-[8px] font-black uppercase flex items-center justify-center gap-1">
                                <LucideIcons.Copy size={10} /> Kopie
                              </button>
                              <button type="button" onClick={() => handleDuplicateButtonLocal(button)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] text-[8px] font-black uppercase flex items-center justify-center gap-1">
                                <LucideIcons.CopyPlus size={10} /> Dupl.
                              </button>
                              <button type="button" onClick={() => handleDeleteButtonLocal(button.id)} className="h-8 rounded-xl border border-red-950/50 bg-red-950/20 text-red-300 text-[8px] font-black uppercase flex items-center justify-center gap-1">
                                <LucideIcons.Trash2 size={10} /> Löschen
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSubSection === 'buttons-action' && editingButton && (
                <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Aktion & Ziel</span>
                      <p className="text-[9.5px] text-stone-500 mt-1">Nur Funktion, Ziel und Button-Status. Design bleibt im Design-Menü.</p>
                    </div>
                    <button
                      onClick={() => handleUpdateSingleButton(editingButton.id, { isActive: editingButton.isActive === false })}
                      className={`px-3 py-2 rounded-xl text-[9px] uppercase font-black cursor-pointer border ${editingButton.isActive !== false ? 'bg-emerald-950/30 border-emerald-700 text-emerald-300' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
                    >
                      {editingButton.isActive !== false ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2 rounded-xl border border-[#3A3732] bg-[#181818] p-3 text-[9.5px] text-stone-400 leading-relaxed">
                      Die Button-Beschriftung wird nur noch im Menü <b className="text-[#F5F2EA]">Design</b> geändert. Hier stellst du nur Aktion und Ziel ein, damit keine zwei Textfelder gegeneinander arbeiten.
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Aktions-Typ</label>
                      <select value={editingButton.actionType || 'url'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { actionType: e.target.value })} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-semibold text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]">
                        {actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      {(() => {
                        const meta = getActionInputMeta(editingButton.actionType);
                        const needsNoTarget = ['video_replay', 'vcard', 'contact_form', 'inquiry_form'].includes(editingButton.actionType || '');
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider">{meta.label}</label>
                              {editingButton.actionValue && (isFileUploadAction(editingButton.actionType) || isCloudLinkAction(editingButton.actionType)) && <a href={editingButton.actionValue} target="_blank" rel="noreferrer" className="text-[8.5px] font-black uppercase tracking-wider text-[#E8DCC2] hover:text-white">Link testen</a>}
                            </div>
                            {needsNoTarget ? (
                              <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 text-[10px] text-[#F5F2EA] leading-relaxed">{meta.helper}</div>
                            ) : isFileUploadAction(editingButton.actionType) ? (
                              <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                                  <input type="text" value={editingButton.actionValue || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { actionValue: e.target.value })} className="w-full bg-[#0F0F0F] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-mono text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" placeholder={meta.placeholder} />
                                  <label className="h-10 px-3 rounded-xl bg-[#F5F2EA] hover:bg-white text-[#101010] text-[9px] uppercase font-black tracking-wider cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <LucideIcons.UploadCloud size={13} /> Datei hochladen
                                    <input type="file" className="hidden" accept={editingButton.actionType === 'pdf_link' ? 'application/pdf,.pdf' : undefined} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleButtonFileUpload(editingButton.id, file); e.currentTarget.value = ''; }} />
                                  </label>
                                </div>
                                <div className="flex items-start gap-2 text-[8.5px] text-stone-500 leading-relaxed"><LucideIcons.Info size={12} className="text-[#E8DCC2] shrink-0 mt-0.5" /><span>{meta.helper}</span></div>
                                {buttonFileUploading && <div className="space-y-1"><div className="h-1.5 bg-stone-800 rounded-full overflow-hidden"><div className="h-full bg-[#E8DCC2] transition-all" style={{ width: `${buttonFileUploadProgress || 0}%` }} /></div><span className="text-[8px] text-[#E8DCC2] font-mono">Upload {buttonFileUploadProgress || 0}%</span></div>}
                              </div>
                            ) : isCloudLinkAction(editingButton.actionType) ? (
                              <input type="text" value={editingButton.actionValue || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { actionValue: e.target.value })} placeholder={meta.placeholder} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-mono text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                            ) : (
                              <input type={editingButton.actionType === 'email' ? 'email' : ['phone', 'whatsapp'].includes(editingButton.actionType || '') ? 'tel' : 'text'} value={editingButton.actionValue || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { actionValue: e.target.value })} placeholder={meta.placeholder} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-mono text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                            )}
                            <span className="text-[8.5px] text-stone-550 block">{meta.helper}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeSubSection === 'buttons-design' && editingButton && (
                <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                  <div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Design & Buttonbild</span><p className="text-[9.5px] text-stone-500 mt-1">Der Text skaliert automatisch zur Buttongröße und bricht sauber um.</p></div>
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_190px] gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2"><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Button-Text</label><textarea value={editingButton.title || ''} rows={2} maxLength={42} onChange={(e) => handleUpdateSingleButton(editingButton.id, { title: e.target.value })} className="w-full bg-[#181818] border border-[#3A3732] px-3 py-2 rounded-xl text-xs font-bold text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA] resize-none leading-snug" placeholder={'z. B. Telefon\nDirekt anrufen'} /><p className="mt-1 text-[8.5px] text-stone-500 font-semibold">Zweite Zeile nur hier über Enter. Aktion/Ziel wird nicht auf dem Button angezeigt.</p></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Button-Farbe</label><input type="color" value={editingButton.bgColor || editingButton.backgroundColor || activeCard.buttonColor || '#18181B'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { bgColor: e.target.value, backgroundColor: e.target.value })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Textfarbe</label><input type="color" value={editingButton.textColor || activeCard.buttonTextColor || '#111111'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { textColor: e.target.value })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Iconfarbe</label><input type="color" value={editingButton.iconColor || '#111111'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { iconColor: e.target.value })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Rahmenfarbe</label><input type="color" value={editingButton.borderColor || '#E8DCC2'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { borderColor: e.target.value, borderEnabled: true, borderWidth: editingButton.borderWidth || 'thin' })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><div className="flex items-center justify-between text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1"><span>Transparenz</span><span className="text-[#E8DCC2] font-mono">{Math.round(100 - Number((editingButton as any).opacity ?? 100))}%</span></div><input type="range" min={0} max={80} step={5} value={100 - Number((editingButton as any).opacity ?? 100)} onChange={(e) => handleUpdateSingleButton(editingButton.id, { opacity: 100 - Number(e.target.value) } as any)} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" /><span className="block mt-1 text-[8.5px] text-stone-550">0% = deckend, 80% = sehr transparent.</span></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Eckenform</label><select value={editingButton.radius || 'rounded'} onChange={(e) => { const radius = e.target.value as any; handleUpdateSingleButton(editingButton.id, { radius, buttonShape: radius === 'pill' ? 'round' : radius === 'square' ? 'square' : 'rounded' } as any); }} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] px-3 text-xs text-[#F5F2EA]"><option value="square">Quadrat</option><option value="rounded">Quadrat abgerundet</option><option value="pill">Kreis</option></select></div>
                      <div className="sm:col-span-2 rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2"><span className="block text-[10px] font-black uppercase tracking-wider text-[#E8DCC2]">Icon-Bereich</span><span className="text-[8px] text-stone-500">Viele Icons für Telefon, Social, Datei, Business</span></div>
                        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-none">
                          {UREEL_ICON_CHOICES.map((iconName) => {
                            const IconAny = (LucideIcons as any)[iconName] || LucideIcons.Sparkles;
                            const selectedIcon = (editingButton.icon || editingButton.iconId || '') === iconName;
                            return (
                              <button key={iconName} type="button" title={iconName} onClick={() => handleUpdateSingleButton(editingButton.id, { icon: iconName, iconId: iconName, iconEnabled: true })} className={`h-9 rounded-xl border flex items-center justify-center transition ${selectedIcon ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#0F0F0F] text-stone-300 border-[#3A3732] hover:border-[#E8DCC2]/50'}`}>
                                <IconAny size={15} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { iconPosition: 'top' as any })} className={`h-9 rounded-xl border text-[8px] font-black uppercase ${editingButton.iconPosition === 'top' ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#0F0F0F] text-stone-300 border-[#3A3732]'}`}>Icon oben</button>
                          <button type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { iconPosition: 'center' as any })} className={`h-9 rounded-xl border text-[8px] font-black uppercase ${editingButton.iconPosition === 'center' ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#0F0F0F] text-stone-300 border-[#3A3732]'}`}>Icon Mitte</button>
                          <button type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { iconEnabled: editingButton.iconEnabled === false })} className={`h-9 rounded-xl border text-[8px] font-black uppercase ${editingButton.iconEnabled !== false ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#0F0F0F] text-stone-300 border-[#3A3732]'}`}>{editingButton.iconEnabled !== false ? 'Icon an' : 'Icon aus'}</button>
                        </div>
                      </div>
                      <div className="sm:col-span-2 rounded-2xl border border-[#3A3732] bg-[#181818] p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2"><span className="block text-[10px] font-black uppercase tracking-wider text-[#E8DCC2]">Buttonbild / Aktionsbild</span>{(editingButton.buttonImageUrl || editingButton.imageUrl) && <button type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { buttonImageUrl: '', imageUrl: '', buttonImageFileName: '' } as any)} className="text-[8.5px] text-red-300 font-black uppercase">Entfernen</button>}</div>
                        <input type="text" value={editingButton.buttonImageUrl || editingButton.imageUrl || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { buttonImageUrl: e.target.value, imageUrl: e.target.value })} placeholder="Bild-Link einfügen oder hochladen" className="w-full bg-[#0F0F0F] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-mono text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                        <label className="h-10 rounded-xl bg-[#F5F2EA] hover:bg-white text-[#101010] text-[9px] uppercase font-black tracking-wider cursor-pointer flex items-center justify-center gap-1.5"><LucideIcons.ImagePlus size={14} /> Buttonbild hochladen<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleButtonImageUpload(editingButton.id, file); e.currentTarget.value = ''; }} /></label>
                        <div className="grid grid-cols-2 gap-2"><select value={editingButton.buttonImageFit || editingButton.imageMode || 'cover'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { buttonImageFit: e.target.value as any, imageMode: e.target.value as any })} className="h-10 rounded-xl bg-[#0F0F0F] border border-[#3A3732] px-3 text-xs text-[#F5F2EA]"><option value="cover">Cover</option><option value="contain">Contain</option></select><button type="button" onClick={() => handleUpdateSingleButton(editingButton.id, { buttonImageOverlay: !editingButton.buttonImageOverlay, imageOverlay: editingButton.buttonImageOverlay ? 0 : 35 })} className={`h-10 rounded-xl border text-[10px] font-black uppercase cursor-pointer ${editingButton.buttonImageOverlay || Number(editingButton.imageOverlay || 0) > 0 ? 'border-[#F5F2EA] bg-[#F5F2EA]/10 text-[#F5F2EA]' : 'border-[#3A3732] bg-[#0F0F0F] text-stone-400'}`}>Overlay {editingButton.buttonImageOverlay || Number(editingButton.imageOverlay || 0) > 0 ? 'an' : 'aus'}</button></div>
                      </div>
                    </div>
                    <div className="space-y-3"><span className="text-[9px] uppercase font-black tracking-wider text-stone-500 block">Button-Vorschau</span>{renderButtonPreviewTile(editingButton)}<button onClick={transferButtonDesignToAll} className="w-full h-10 rounded-xl border border-[#3A3732] bg-[#181818] text-[#F5F2EA] text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2"><LucideIcons.Paintbrush size={12} /> Design übertragen</button></div>
                  </div>
                </div>
              )}

              {activeSubSection === 'buttons-preview' && (
                <div className="space-y-4">
                  <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Vorschau wechseln</span><p className="text-[9.5px] text-stone-500 mt-1">Im Buttoneditor siehst du Karte, Einzelbutton oder Raster – unabhängig von der Timeline.</p></div><div className="grid grid-cols-3 gap-1 rounded-2xl border border-[#3A3732] bg-[#0F0F0F] p-1 text-[9px] font-black uppercase">{(['card','button','grid'] as const).map((mode) => <button key={mode} type="button" onClick={() => setButtonPreviewMode(mode)} className={`h-9 rounded-xl px-2 ${buttonPreviewMode === mode ? 'bg-[#F5F2EA] text-[#101010]' : 'text-stone-400 hover:text-[#F5F2EA]'}`}>{mode === 'card' ? 'Karte' : mode === 'button' ? 'Button' : 'Raster'}</button>)}</div></div>
                    {buttonPreviewMode === 'card' && <div className="rounded-3xl border border-[#3A3732] bg-[#0B0B0B] p-3 max-w-[260px] mx-auto"><div className="h-[430px] rounded-[28px] overflow-hidden border-[8px] border-[#1C1C1C] bg-black"><KonuCardCore card={monitorCard} lang={lang} isDesktopPreview={false} isPreview={true} cleanPreview={true} previewFocus="full" /></div></div>}
                    {buttonPreviewMode === 'button' && editingButton && <div className="max-w-[240px] mx-auto">{renderButtonPreviewTile(editingButton)}</div>}
                    {buttonPreviewMode === 'grid' && <div className="grid max-w-sm mx-auto" style={{ gridTemplateColumns: `repeat(${buttonGridCols}, minmax(0, 1fr))`, gap: `${buttonGapPx}px` }}>{(activeButtons.length ? activeButtons : activeCard.buttons || []).map((button) => renderButtonPreviewTile(button, true))}</div>}
                    <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 text-[9px] leading-relaxed text-[#F5F2EA]/80"><b>Timeline-Hinweis:</b> In der Live-Karte erscheinen Buttons ab <b>{visibleButtonsAt.toFixed(1)}s</b>. Die Button-Vorschau bleibt hier immer sichtbar.</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Raster-Einstellungen</span>
                    <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3.5"><div className="flex items-center justify-between gap-3"><div><span className="text-[10.5px] font-black text-[#F5F2EA] block uppercase tracking-wide leading-none">3er Raster</span><span className="text-[8.5px] text-stone-500 mt-1 leading-snug block">ureel-Standard: drei Buttons pro Reihe, identisch für Szene und öffentliche Karte.</span></div><button type="button" onClick={async () => { await syncCardUpdate({ buttonGridCols: 3 as any, buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), mode: 'three_columns', cols: 3 as any, square: true } }); triggerToast(lang === 'de' ? '3er Raster aktiviert' : '3-column grid active', 'success'); }} className="h-9 px-3 rounded-xl bg-[#F5F2EA] text-[#101010] text-[8px] font-black uppercase tracking-wider">Aktivieren</button></div></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><div><div className="flex items-center justify-between text-[10.5px] font-bold text-stone-400 mb-2"><span>Button-Größe</span><span className="text-[#E8DCC2] font-mono">{buttonSizePx}px</span></div><input type="range" min={52} max={104} step={2} value={buttonSizePx} onChange={(e) => syncCardUpdate({ buttonSizePx: Number(e.target.value), buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), buttonSizePx: Number(e.target.value), cols: buttonGridCols as any, square: true } })} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" /></div><div><div className="flex items-center justify-between text-[10.5px] font-bold text-stone-400 mb-2"><span>Button-Abstand</span><span className="text-[#E8DCC2] font-mono">{buttonGapPx}px</span></div><input type="range" min={4} max={22} step={1} value={buttonGapPx} onChange={(e) => syncCardUpdate({ buttonGapPx: Number(e.target.value), buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), gapPx: Number(e.target.value), gap: Number(e.target.value), cols: buttonGridCols as any, square: true } })} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" /></div></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ENDCARD & CTA */}
          {((activeTab === 'endcard' && activeSubSection === 'endcard-general') || (activeTab === 'scene' && activeSubSection === 'scene-endcard')) && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Dauerhafte Endkarte</span>
                <p className="text-[9.5px] text-stone-400">Blenden Sie am Ende des Videos eine ruhige Endkarte ein. Wenn keine Endkarte aktiv ist, bleibt die aktuelle Szene als Abschluss stehen.</p>

                <div className="rounded-xl border border-[#E8DCC2]/15 bg-stone-900/55 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[10px] uppercase font-black tracking-wider text-[#F5F2EA]">Endkartenbild</span>
                      <span className="block text-[8.5px] text-stone-400 mt-0.5">Optionales Abschlussbild hochladen. Es blendet weich über die Szene.</span>
                    </div>
                    <label className="shrink-0 px-3 py-2 rounded-lg bg-[#F5F2EA] text-stone-950 text-[9px] uppercase font-black cursor-pointer hover:bg-white transition-colors">
                      Bild hochladen
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleEndCardImageUpload(file); e.currentTarget.value = ''; }} />
                    </label>
                  </div>
                  {endCardImageUploading && <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-[#E8DCC2]" style={{ width: `${endCardImageUploadProgress || 0}%` }} /></div>}
                  {endCard.imageUrl && <div className="h-24 rounded-xl overflow-hidden border border-stone-800 bg-stone-950"><img src={endCard.imageUrl} alt="Endkarte" className="w-full h-full object-cover" /></div>}
                </div>

                <div className="rounded-xl border border-[#E8DCC2]/15 bg-stone-900/55 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-[10px] uppercase font-black tracking-wider text-[#F5F2EA]">Endkarten-Video 16:9</span>
                      <span className="block text-[8.5px] text-stone-400 mt-0.5">Optionales 16:9-Video oben auf der Endkarte. Kein Reel, kein Vollbild-Hintergrund.</span>
                    </div>
                    {((endCard as any).videoUrl || (endCard as any).source === 'video') && (
                      <button type="button" onClick={() => setEndCard({ source: 'scene' as any, videoUrl: '', videoDisplayMode: 'wide' } as any)} className="shrink-0 px-3 py-2 rounded-lg border border-red-900/40 bg-red-950/20 text-red-200 text-[8.5px] font-black uppercase">Video entfernen</button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={(endCard as any).videoUrl || ''}
                    onChange={(e) => setEndCard({ enabled: true, source: e.target.value.trim() ? 'video' as any : endCard.source, videoUrl: e.target.value } as any)}
                    placeholder="YouTube- oder Videolink für die Endkarte"
                    className="w-full bg-[#0F0F0F] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-mono text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'wide', label: 'Ganz oben', desc: '16:9 volle Breite an Oberkante' },
                      { id: 'compact', label: 'Video-Bildschirm', desc: '16:9 kompakt oben mit Abstand' },
                    ].map((mode) => (
                      <button key={mode.id} type="button" onClick={() => setEndCard({ enabled: true, source: 'video' as any, videoDisplayMode: mode.id as any } as any)} className={`min-h-[54px] rounded-xl border px-3 py-2 text-left transition ${((endCard as any).videoDisplayMode || 'wide') === mode.id ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#0F0F0F] border-[#3A3732] text-[#F5F2EA]'}`}>
                        <span className="block text-[9.5px] font-black uppercase tracking-wider">{mode.label}</span>
                        <span className="block text-[8px] opacity-70 mt-0.5 leading-snug">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'endcard' && activeSubSection === 'endcard-branding' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Wasserzeichen und ureel-Marke</span>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-stone-900 rounded-lg">
                    <div>
                      <span className="block font-bold text-[10.5px]">Dezente ureel-Branding Zeile am Fuß</span>
                      <span className="block text-[8px] text-stone-500 mt-0.5">Blendet ein „Erstellt mit ureel.me“ Logo ein.</span>
                    </div>
                    <button
                      onClick={() => handleToggleElementInReelLocal('includeBranding')}
                      className={`p-1 w-9 rounded-full transition-colors flex ${
                        activeCard.reelExportConfig?.includeBranding !== false ? 'bg-[#F5F2EA] justify-end' : 'bg-stone-800 justify-start'
                      } cursor-pointer`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DESIGN - DESKTOP MINIWEBSEITE */}
          {activeTab === 'design' && activeSubSection === 'design-desktop' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3A3732] bg-[#111111] p-4 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Desktop-Miniwebseite</span>
                  <p className="text-[10px] text-stone-400 mt-1">Die Smartphone-Karte bleibt exakt der Szeneeditor. Dieser Bereich gestaltet nur die Desktop-Ansicht daneben.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'desktop_triptych', label: '3 Bereiche', hint: 'Phone · Text · Buttons' },
                    { id: 'phone_left', label: 'Phone links', hint: 'Karte links, Inhalt rechts' },
                    { id: 'phone_center', label: 'Phone mittig', hint: 'Präsentation zentriert' },
                    { id: 'minimal', label: 'Minimal', hint: 'nur Karte + Aktionen' },
                  ].map((layout) => {
                    const selected = desktopLayout === layout.id;
                    return (
                      <button key={layout.id} type="button" onClick={() => updateDesktopPage({ layout: layout.id })} className={`rounded-2xl border p-3 text-left transition ${selected ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-[#F5F2EA] border-[#3A3732] hover:border-[#E8DCC2]/60'}`}>
                        <span className="block text-[10px] font-black uppercase tracking-wider">{layout.label}</span>
                        <span className={`block text-[8.5px] mt-1 ${selected ? 'text-[#101010]/65' : 'text-stone-500'}`}>{layout.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-[#3A3732] bg-[#111111] p-4 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Desktop-Buttonbereich</span>
                  <p className="text-[10px] text-stone-400 mt-1">Verwende die echten Nutzerbuttons aus der Smartphone-Karte auch auf der Desktop-Miniwebseite.</p>
                </div>
                <div className="rounded-xl border border-[#3A3732] bg-[#0F0F0F] p-3 text-[9px] leading-relaxed text-stone-400">
                  Die Nutzerbuttons werden auf der Desktop-Webseite angezeigt, sobald dieser Bereich aktiv ist. Die zeitliche Smartphone-Logik bleibt nur im Smartphone-Werbespot.
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[['three_col','Geordnet'],['compact_grid','Eng'],['circle','Kreis'],['triangle','Dreieck']].map(([id,label]) => (
                    <button key={id} type="button" onClick={() => updateDesktopPage({ buttonLayout: id })} className={`h-10 rounded-xl border text-[8px] font-black uppercase tracking-wider ${desktopButtonLayout === id ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>{label}</button>
                  ))}
                </div>
                <div className="rounded-2xl border border-[#3A3732] bg-[#0F0F0F] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div><span className="block text-[9px] uppercase font-black tracking-wider text-[#E8DCC2]">Buttonbereich-Hintergrund</span><span className="block text-[8.5px] text-stone-500 mt-0.5">Nur für den rechten Desktop-Buttonbereich.</span></div>
                    <label className="px-3 py-2 rounded-xl bg-[#F5F2EA] text-[#101010] text-[8.5px] font-black uppercase cursor-pointer">Bild hochladen<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDesktopButtonBackgroundUpload(file); e.currentTarget.value = ''; }} /></label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['none','Ohne'],['gradient','Verlauf'],['image','Bild']].map(([id,label]) => <button key={id} type="button" onClick={() => updateDesktopPage({ buttonAreaBackgroundMode: id })} className={`h-9 rounded-xl border text-[8px] font-black uppercase tracking-wider ${(desktopPage.buttonAreaBackgroundMode || 'none') === id ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>{label}</button>)}
                  </div>
                  {desktopPage.buttonAreaBackgroundMode === 'gradient' && <div className="grid grid-cols-2 gap-2"><input type="color" value={desktopPage.buttonAreaGradientFrom || '#181818'} onChange={(e) => updateDesktopPage({ buttonAreaGradientFrom: e.target.value, buttonAreaBackgroundMode: 'gradient' })} className="w-full h-9 rounded-xl border border-[#3A3732] bg-[#181818]" /><input type="color" value={desktopPage.buttonAreaGradientTo || '#3A3328'} onChange={(e) => updateDesktopPage({ buttonAreaGradientTo: e.target.value, buttonAreaBackgroundMode: 'gradient' })} className="w-full h-9 rounded-xl border border-[#3A3732] bg-[#181818]" /></div>}
                  {desktopButtonBgUploading && <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-[#E8DCC2]" style={{ width: `${desktopButtonBgUploadProgress || 0}%` }} /></div>}
                  {desktopPage.buttonAreaBackgroundImageUrl && <button type="button" onClick={() => updateDesktopPage({ buttonAreaBackgroundImageUrl: '', buttonAreaBackgroundMode: 'none' })} className="w-full h-9 rounded-xl border border-[#3A3732] text-[8px] font-black uppercase tracking-wider text-stone-300">Buttonbereich-Bild entfernen</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => updateDesktopPage({ showPhoneButtons: desktopPage.showPhoneButtons !== true })} className={`min-h-10 rounded-xl border px-2 py-2 text-[8px] font-black uppercase tracking-wider ${desktopPage.showPhoneButtons === true ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>Karten-Buttons {desktopPage.showPhoneButtons === true ? 'AN' : 'AUS'}</button>
                  <button type="button" onClick={() => updateDesktopPage({ showActionButtons: desktopPage.showActionButtons === false })} className={`min-h-10 rounded-xl border px-2 py-2 text-[8px] font-black uppercase tracking-wider ${desktopPage.showActionButtons !== false ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>Desktop-Buttons {desktopPage.showActionButtons !== false ? 'AN' : 'AUS'}</button>
                </div>
                <p className="text-[8.5px] leading-relaxed text-stone-500">Standard: Buttons in der Smartphone-Karte ausblenden und als schönen Desktop-Aktionsbereich daneben zeigen. Am Handy bleibt die echte Karte unverändert.</p>
              </div>
              <div className="rounded-[28px] border border-[#3A3732] overflow-hidden bg-[#0F0F0F] shadow-2xl">
                <div className="px-4 pt-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#E8DCC2]">Live-Desktop-Vorschau</div>
                <div className="p-3 md:p-4 min-h-[430px]">
                  <div className="h-[520px] overflow-hidden rounded-[26px] border border-white/10">
                    <PublicDesktopPageRenderer
                      card={activeCard}
                      lang={lang}
                      mode="studio-preview"
                      qrCodeUrl={qrPayload}
                      onEditText={openWerbetexterFromDesign}
                    />
                  </div>
                </div>
            </div>
            </div>
          )}

          {activeTab === 'design' && activeSubSection === 'design-background' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3A3732] bg-[#111111] p-4 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Desktop-Hintergrund</span>
                  <p className="text-[10px] text-stone-400 mt-1">Nur für die Desktop-Miniwebseite. Die Smartphone-Karte bleibt unverändert wie im Szeneeditor.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gradient', label: 'Verlauf' },
                    { id: 'image', label: 'Bild' },
                    { id: 'color', label: 'Fläche' },
                  ].map((mode) => <button key={mode.id} type="button" onClick={() => updateDesktopPage({ backgroundMode: mode.id })} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-wider ${(desktopPage.backgroundMode || 'gradient') === mode.id ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>{mode.label}</button>)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1"><span className="text-[9px] uppercase font-black tracking-wider text-stone-500">Von</span><input type="color" value={desktopPage.gradientFrom || '#0F0F0F'} onChange={(e) => updateDesktopPage({ gradientFrom: e.target.value, backgroundMode: 'gradient' })} className="w-full h-10 rounded-xl border border-[#3A3732] bg-[#181818]" /></label>
                  <label className="space-y-1"><span className="text-[9px] uppercase font-black tracking-wider text-stone-500">Nach</span><input type="color" value={desktopPage.gradientTo || '#3A3328'} onChange={(e) => updateDesktopPage({ gradientTo: e.target.value, backgroundMode: 'gradient' })} className="w-full h-10 rounded-xl border border-[#3A3732] bg-[#181818]" /></label>
                </div>
                <label className="block rounded-2xl border border-dashed border-[#E8DCC2]/35 bg-[#181818] p-4 text-center cursor-pointer hover:bg-[#202020]">
                  <LucideIcons.UploadCloud size={20} className="mx-auto mb-2 text-[#E8DCC2]" />
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#F5F2EA]">Desktop-Hintergrundbild hochladen</span>
                  <span className="block text-[9px] text-stone-500 mt-1">JPG/PNG/WebP bis 10 MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDesktopBackgroundUpload(file); e.currentTarget.value = ''; }} />
                </label>
                {desktopBgUploading && <div className="h-2 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-[#E8DCC2]" style={{ width: `${desktopBgUploadProgress || 0}%` }} /></div>}
                {desktopPage.backgroundImageUrl && <button type="button" onClick={() => updateDesktopPage({ backgroundImageUrl: '', backgroundMode: 'gradient' })} className="w-full h-10 rounded-xl border border-[#3A3732] text-[9px] font-black uppercase tracking-wider text-stone-300">Bild entfernen</button>}
              </div>
            </div>
          )}

          {activeTab === 'design' && activeSubSection === 'design-content' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3A3732] bg-[#111111] p-4 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Desktop-Werbetexte</span>
                  <p className="text-[10px] text-stone-400 mt-1">Nutze den vorhandenen Werbetexter mit Vorlagen. Die App merkt sich, dass du aus dem Designbereich kommst.</p>
                </div>
                <button type="button" onClick={openWerbetexterFromDesign} className="w-full h-12 rounded-2xl bg-[#F5F2EA] text-[#101010] text-[10px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-2"><LucideIcons.Type size={15}/> Werbetexter & Vorlagen öffnen</button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => updateDesktopPage({ contentMode: 'from_card' })} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-wider ${(desktopPage.contentMode || 'from_card') === 'from_card' ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>Live aus Werbetext</button>
                  <button type="button" onClick={() => updateDesktopPage({ contentMode: 'custom' })} className={`h-10 rounded-xl border text-[9px] font-black uppercase tracking-wider ${desktopPage.contentMode === 'custom' ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-300 border-[#3A3732]'}`}>Eigener Text</button>
                </div>
                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3">
                  <span className="block text-[9px] uppercase font-black tracking-wider text-stone-500">Aktuell aus Werbetexter</span>
                  <p className="mt-1 text-sm font-black text-[#F5F2EA]">{activeCard.title || 'Kein Titel'}</p>
                  {activeCard.subtitle && <p className="text-xs font-bold text-[#E8DCC2]">{activeCard.subtitle}</p>}
                  {activeCard.description && <p className="mt-1 text-[10px] leading-relaxed text-stone-400">{activeCard.description}</p>}
                </div>
                <input value={desktopPage.title || ''} onChange={(e) => updateDesktopPage({ title: e.target.value, contentMode: 'custom' })} placeholder={activeCard.title || 'Titel aus Werbetext'} className="w-full h-11 rounded-xl border border-[#3A3732] bg-[#0F0F0F] px-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                <input value={desktopPage.subtitle || ''} onChange={(e) => updateDesktopPage({ subtitle: e.target.value, contentMode: 'custom' })} placeholder={activeCard.subtitle || 'Untertitel aus Werbetext'} className="w-full h-11 rounded-xl border border-[#3A3732] bg-[#0F0F0F] px-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                <textarea value={desktopPage.description || ''} onChange={(e) => updateDesktopPage({ description: e.target.value, contentMode: 'custom' })} placeholder={activeCard.description || 'Beschreibung aus Werbetext'} rows={4} className="w-full rounded-xl border border-[#3A3732] bg-[#0F0F0F] p-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                <button type="button" onClick={() => updateDesktopPage({ title: activeCard.title, subtitle: activeCard.subtitle, description: activeCard.description, contentMode: 'custom' })} className="w-full h-10 rounded-xl border border-[#E8DCC2]/40 text-[#F5F2EA] text-[9px] font-black uppercase tracking-wider">Aktuelle Werbetexte als eigenen Desktop-Text kopieren</button>
              </div>
            </div>
          )}

          {activeTab === 'design' && activeSubSection === 'design-share' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3A3732] bg-[#111111] p-4 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Link & Teilen</span>
                  <p className="text-[10px] text-stone-400 mt-1">Vorbereitung für QR-Code, Teilen und Kontakt speichern. Der QR-Code nutzt den aktuellen Kartenlink.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[['showQr','QR-Code',LucideIcons.QrCode],['showShare','Teilen',LucideIcons.Share2],['showContactSave','Kontakt',LucideIcons.ContactRound]].map(([key,label,IconAny]: any) => {
                    const Icon = IconAny;
                    const enabled = desktopPage[key] ?? true;
                    return <button key={key} type="button" onClick={() => updateDesktopPage({ [key]: !enabled })} className={`rounded-2xl border p-3 text-center ${enabled ? 'bg-[#F5F2EA] text-[#101010] border-[#F5F2EA]' : 'bg-[#181818] text-stone-400 border-[#3A3732]'}`}><Icon size={16} className="mx-auto mb-1"/><span className="text-[8.5px] font-black uppercase tracking-wider">{label}</span></button>;
                  })}
                </div>
                <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 grid grid-cols-[86px_1fr] gap-3 items-center">
                  <img src={qrUrl} alt="QR-Code" className="w-20 h-20 rounded-xl bg-white p-1" />
                  <div className="min-w-0"><span className="block text-[9px] uppercase font-black tracking-wider text-stone-500">Aktueller Kartenlink</span><p className="text-[10px] text-[#F5F2EA] font-mono truncate mt-1">{qrPayload}</p><p className="text-[9px] text-stone-500 mt-2">Kontaktname später: {contactDisplayName}</p></div>
                </div>
                <button type="button" onClick={copyLiveLink} className="w-full h-10 rounded-xl bg-[#F5F2EA] text-[#101010] text-[9px] font-black uppercase tracking-wider">Link kopieren</button>
              </div>
            </div>
          )}

          {/* TAB 5: DESIGN PRESETS */}
          {activeTab === 'design' && activeSubSection === 'design-presets' && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Exklusive Design-Presets</span>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { id: 'elegant-violet', name: 'Elegant Violet (Standard)', desc: 'Modernes violettes Ambient-Licht', themeColor: 'bg-purple-500' },
                  { id: 'dark-cosmic', name: 'Dark Cosmic Slate', desc: 'Zurückhaltender edler Dunkelmodus', themeColor: 'bg-zinc-800' },
                  { id: 'clean-tech', name: 'Tech Mono', desc: 'Vollfläche, Monospace & Minimalismus', themeColor: 'bg-stone-950 border border-purple-500' },
                  { id: 'warm-copper', name: 'Warm Copper', desc: 'Erdige Töne für Lifestyle-Kampagnen', themeColor: 'bg-amber-900' },
                  { id: 'elegant-gold', name: 'Elegant Gold (Nostalgisch)', desc: 'Original goldfarbenes Premium-Preset', themeColor: 'bg-amber-500' },
                ].map((preset) => {
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyDesignPreset(preset.id)}
                      className="text-left p-3.5 rounded-xl border border-stone-850 bg-stone-900/40 hover:bg-stone-850/60 hover:border-purple-900/50 transition cursor-pointer flex gap-3.5 items-center"
                    >
                      <div className={`w-8 h-8 rounded-full ${preset.themeColor} shrink-0 shadow-inner flex items-center justify-center`} />
                      <div className="truncate">
                        <span className="text-[10.5px] font-black text-white block truncate leading-tight uppercase tracking-wide">{preset.name}</span>
                        <span className="text-[8.5px] text-stone-550 block mt-0.5 whitespace-normal leading-snug">{preset.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'design' && activeSubSection === 'design-typography' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Schriftgruppen-Grundeinstellung</span>
                
                <div>
                  <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-2">Headline-Font Gruppe</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', label: 'Inter Sans (Clean)' },
                      { id: 'elegant', label: 'Playfair (Efeuvoll)' },
                      { id: 'bold', label: 'Outfit (Fett/Tech)' },
                      { id: 'minimal', label: 'JetBrains (Monospace)' }
                    ].map((font) => {
                      const selected = activeCard.heroFontStyle === font.id;
                      return (
                        <button
                          key={font.id}
                          onClick={() => syncCardUpdate({ heroFontStyle: font.id as any, heroTitleFontStyle: font.id as any })}
                          className={`py-2 px-3 text-center rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                            selected
                              ? 'border-[#F5F2EA] bg-[#F5F2EA]/10 text-white'
                              : 'border-stone-850 bg-stone-900/70 text-stone-400 hover:bg-stone-850'
                          }`}
                        >
                          {font.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* COLUMN 4: RECHTE PERMANENTE SMARTPHONE-VORSCHAU */}
      <div className="order-2 md:order-none w-full md:w-[330px] md:max-h-none ureel-studio-preview-panel overflow-visible md:overflow-visible bg-[#0E0E11] border-b md:border-b-0 md:border-l border-stone-900 flex flex-col justify-between shrink-0 p-3 md:p-4 relative">
        
        {/* Preview Title bar */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-3 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8DCC2] animate-pulse" />
            <span className="text-[10px] font-mono font-black text-stone-300 uppercase tracking-widest truncate">
              {activeTab === 'buttons' ? 'Button-Monitor' : activeTab === 'timeline' ? 'Werbe-Monitor' : 'ureel live'}
            </span>
          </div>

          {activeTab === 'buttons' ? (
            <div className="grid grid-cols-3 gap-0.5 rounded-xl border border-[#3A3732] bg-[#0F0F0F] p-0.5 text-[8px] font-black uppercase shrink-0">
              {(['card','button','grid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setButtonPreviewMode(mode)}
                  className={`h-7 rounded-lg px-2 transition ${buttonPreviewMode === mode ? 'bg-[#F5F2EA] text-[#101010]' : 'text-stone-400 hover:text-[#F5F2EA]'}`}
                >
                  {mode === 'card' ? 'Karte' : mode === 'button' ? 'Button' : 'Raster'}
                </button>
              ))}
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="grid grid-cols-3 gap-0.5 rounded-xl border border-[#3A3732] bg-[#0F0F0F] p-0.5 text-[8px] font-black uppercase shrink-0">
              {(['text','card','fit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTextPreviewMode(mode)}
                  className={`h-7 rounded-lg px-2 transition ${textPreviewMode === mode ? 'bg-[#F5F2EA] text-[#101010]' : 'text-stone-400 hover:text-[#F5F2EA]'}`}
                >
                  {mode === 'text' ? 'Text' : mode === 'card' ? 'Karte' : 'Fit'}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex bg-stone-950 border border-stone-900 p-0.5 rounded-lg">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 px-2.5 rounded text-[8.5px] font-bold cursor-pointer transition flex items-center gap-1 hover:text-white"
              >
                {isPlaying ? (
                  <>
                    <LucideIcons.Pause size={10} className="text-[#E8DCC2] fill-[#E8DCC2]" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <LucideIcons.Play size={10} className="text-[#E8DCC2] fill-[#E8DCC2]" />
                    <span>Simulation</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Smart preview / Button monitor */}
        <div className="flex-none md:flex-1 flex items-center justify-center py-2 md:py-4 bg-stone-950/20 overflow-visible md:overflow-hidden ureel-studio-preview-stage">
          {activeTab === 'buttons' ? (
            <div className="w-full h-full min-h-[230px] md:min-h-0 flex items-center justify-center">
              {buttonPreviewMode === 'button' && editingButton && (
                <div className="w-full max-w-[250px] rounded-[28px] border border-[#3A3732] bg-[#111111] p-4 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#E8DCC2]">Aktueller Button</span>
                    <span className="text-[8px] text-stone-500 font-mono">#{Math.max(1, (activeCard.buttons || []).findIndex(b => b.id === editingButton.id) + 1)}</span>
                  </div>
                  {renderButtonPreviewTile(editingButton)}
                  <div className="mt-3 rounded-2xl border border-[#3A3732] bg-[#0F0F0F] p-3">
                    <div className="flex items-center justify-between text-[8.5px] font-black uppercase tracking-wider">
                      <span className="text-stone-500">Karten-Timing</span>
                      <span className={buttonsCurrentlyVisible ? 'text-emerald-300' : 'text-[#E8DCC2]'}>{buttonsCurrentlyVisible ? 'Jetzt sichtbar' : `ab ${visibleButtonsAt.toFixed(1)}s`}</span>
                    </div>
                    <div className="relative mt-2 h-2 rounded-full bg-stone-900 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-[#E8DCC2]/25" style={{ width: `${Math.min(100, (timelineSec / timelineDuration) * 100)}%` }} />
                      <span className="absolute top-0 bottom-0 w-0.5 bg-[#E8DCC2]" style={{ left: `${Math.min(100, (visibleButtonsAt / timelineDuration) * 100)}%` }} />
                    </div>
                    <p className="mt-2 text-center text-[8px] text-stone-500 leading-snug">Button-Vorschau ist immer sichtbar. In der Karte erscheint das Raster laut Timeline ab {visibleButtonsAt.toFixed(1)}s.</p>
                  </div>
                </div>
              )}
              {buttonPreviewMode === 'grid' && (
                <div className="w-full max-w-[270px] rounded-[28px] border border-[#3A3732] bg-[#111111] p-4 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#E8DCC2]">Raster-Vorschau</span>
                    <span className="text-[8px] text-stone-500 font-mono">{buttonGridCols} pro Reihe</span>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${buttonGridCols}, minmax(0, 1fr))`, gap: `${Math.min(buttonGapPx, 14)}px` }}>
                    {(activeButtons.length ? activeButtons : activeCard.buttons || []).slice(0, 9).map((button) => renderButtonPreviewTile(button, true))}
                  </div>
                  <div className="mt-3 rounded-xl border border-[#3A3732] bg-[#0F0F0F] p-2 text-[8px] text-stone-500 text-center">Raster erscheint in der Karte ab <b className="text-[#E8DCC2]">{visibleButtonsAt.toFixed(1)}s</b>. Hier bleibt es dauerhaft sichtbar.</div>
                </div>
              )}
              {buttonPreviewMode === 'card' && (
                <div className="ureel-studio-phone-frame relative mx-auto w-[150px] h-[308px] sm:w-[180px] sm:h-[370px] md:w-[230px] md:h-[472px] bg-black rounded-[30px] md:rounded-[36px] border-[8px] border-[#F5F2EA]/80 shadow-2xl overflow-hidden flex flex-col justify-between ring-4 ring-[#E8DCC2]/10">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-b-xl z-25" />
                  <div className="w-full h-full overflow-y-auto select-none bg-[#09090B] text-stone-200 scrollbar-none flex flex-col justify-between relative pt-5">
                    <KonuCardCore card={monitorCard} lang={lang} isDesktopPreview={false} isPreview={true} cleanPreview={true} previewFocus="full" />
                  </div>
                </div>
              )}
              {buttonPreviewMode === 'button' && !editingButton && (
                <div className="rounded-3xl border border-dashed border-[#3A3732] bg-[#111111] p-6 text-center text-[#F5F2EA]">
                  <LucideIcons.MousePointerClick className="mx-auto mb-2 text-[#E8DCC2]" size={30} />
                  <p className="font-black text-sm">Button auswählen</p>
                  <p className="text-[10px] text-stone-500 mt-1">Wähle links einen Button aus der Liste.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="w-full h-full h-full md:min-h-0 flex items-center justify-center">
              {textPreviewMode === 'text' && renderWerbeTextMonitor(false)}
              {textPreviewMode === 'fit' && (
                <div className="w-full max-w-[280px] rounded-[28px] border border-[#3A3732] bg-[#111111] p-3 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between mb-2"><span className="text-[8px] uppercase tracking-widest font-black text-[#E8DCC2]">Fit-Vorschau</span><span className="text-[7px] text-stone-500">kleine Karte</span></div>
                  <div className="ureel-studio-fit-preview h-[390px] rounded-[26px] overflow-hidden border-[7px] border-[#F5F2EA]/85 bg-black">
                    <KonuCardCore card={getPreviewCardForTimeline()} lang={lang} isDesktopPreview={false} isPreview={true} cleanPreview={true} />
                  </div>
                  <p className="mt-2 text-[8.5px] leading-snug text-stone-500 text-center">Alle Texte werden unabhängig vom Timing eingeblendet, damit Größe und Rahmen prüfbar sind.</p>
                </div>
              )}
              {textPreviewMode === 'card' && (
                <div className="ureel-studio-phone-frame relative mx-auto w-[150px] h-[308px] sm:w-[180px] sm:h-[370px] md:w-[230px] md:h-[472px] bg-black rounded-[30px] md:rounded-[36px] border-[8px] border-[#F5F2EA]/80 shadow-2xl overflow-hidden flex flex-col justify-between ring-4 ring-[#E8DCC2]/10">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-b-xl z-25" />
                  <div className="w-full h-full overflow-y-auto select-none bg-[#09090B] text-stone-200 scrollbar-none flex flex-col justify-between relative pt-5">
                    <KonuCardCore card={getPreviewCardForTimeline()} lang={lang} isDesktopPreview={false} isPreview={true} cleanPreview={true} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ureel-studio-phone-frame relative mx-auto w-[150px] h-[308px] sm:w-[180px] sm:h-[370px] md:w-[256px] md:h-[526px] bg-black rounded-[30px] md:rounded-[38px] border-[8px] border-[#F5F2EA]/80 shadow-2xl overflow-hidden flex flex-col justify-between ring-4 ring-[#E8DCC2]/10">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-b-xl z-25 flex items-center justify-center" />
              <div className="absolute top-0.5 left-0 right-0 px-5 flex justify-between text-[7px] text-stone-500 z-20 font-bold font-mono">
                <span>09:41</span>
                <span>100% 🔋</span>
              </div>
              <div className="w-full h-full overflow-y-auto select-none bg-[#09090B] text-stone-200 scrollbar-none flex flex-col justify-between relative pt-5">
                <KonuCardCore card={monitorCard} lang={lang} isDesktopPreview={false} isPreview={true} cleanPreview={true} previewFocus="full" />
              </div>
              {isPlaying && (
                <div className="absolute bottom-1.5 left-2 right-2 bg-black/80 border border-[#E8DCC2]/30 p-1.5 rounded-lg flex items-center justify-between text-[7.5px] z-30 font-mono text-[#E8DCC2]">
                  <span className="flex items-center gap-1 font-bold">
                    <LucideIcons.Tv size={8} className="animate-pulse" />
                    REEL PLAYBACK
                  </span>
                  <span>{timelineSec}s / {activeCard.videoBackgroundConfig?.durationSeconds || 12}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {renderMobileOrbitOverlay()}

        {/* Share buttons or actions below preview */}
        <div className="space-y-2 pt-3 border-t border-stone-900">
          <div className="flex items-center gap-2">
            <button
              onClick={copyLiveLink}
              className="flex-1 bg-[#F5F2EA] hover:bg-white text-[#101010] border-0 font-extrabold py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1 text-[9.5px] uppercase tracking-wider cursor-pointer shadow-lg shadow-black/25"
            >
              <LucideIcons.Copy size={11} className="stroke-[2.5]" />
              <span>{lang === 'de' ? 'Link kopieren' : 'Copy link'}</span>
            </button>
          </div>
          <span className="block text-center text-[8px] text-stone-500 tracking-wider">Erstellt mit dem intelligenten ureel.me Studio</span>
        </div>

      </div>



      {cardManagerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCardManagerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-3xl border border-[#3A3732] bg-[#111111] shadow-2xl p-4 text-[#F5F2EA]">
            <div className="flex items-start justify-between gap-3 border-b border-[#3A3732] pb-3 mb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Meine ureels / Karten</h2>
                <p className="text-[10px] text-stone-500 mt-1">Öffnen, kopieren, löschen oder eine neue Startkarte erstellen.</p>
              </div>
              <button onClick={() => setCardManagerOpen(false)} className="w-9 h-9 rounded-xl border border-[#3A3732] bg-[#181818] flex items-center justify-center"><LucideIcons.X size={16} /></button>
            </div>
            <button onClick={handleCreateNewUreel} className="mb-4 h-11 px-4 rounded-2xl bg-[#F5F2EA] text-[#101010] text-[10px] font-black uppercase tracking-wider flex items-center gap-2"><LucideIcons.Plus size={14} /> Neue ureel mit Startkarte erstellen</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cards.map((card) => {
                const selected = card.cardId === activeCard.cardId;
                return (
                  <div key={card.cardId} className={`rounded-2xl border p-3 ${selected ? 'border-[#F5F2EA] bg-[#F5F2EA]/8' : 'border-[#3A3732] bg-[#181818]'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded-xl bg-gradient-to-br from-[#0F0F0F] to-[#3A3328] border border-[#3A3732] flex items-center justify-center text-[#E8DCC2]"><LucideIcons.Smartphone size={20} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-black truncate">{card.title || card.slug || 'Unbenannte ureel'}</p>
                        <p className="text-[9px] text-stone-500 truncate">/{card.slug || card.cardId}</p>
                        <p className="text-[8px] uppercase tracking-wider font-black text-[#E8DCC2] mt-1">{card.buttons?.length || 0} Buttons</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button onClick={() => { setActiveCard(card); setCardManagerOpen(false); }} className="h-9 rounded-xl bg-[#F5F2EA] text-[#101010] text-[8px] font-black uppercase">Öffnen</button>
                      <button onClick={() => handleDuplicateUreel(card)} className="h-9 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] text-[8px] font-black uppercase">Kopieren</button>
                      <button onClick={() => handleDeleteUreel(card)} className="h-9 rounded-xl border border-red-950/50 bg-red-950/20 text-red-300 text-[8px] font-black uppercase">Löschen</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setCardManagerOpen(false)} className="mt-4 w-full h-11 rounded-2xl border border-[#3A3732] bg-[#181818] text-[#F5F2EA] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"><LucideIcons.X size={14}/> Fenster schließen</button>
          </div>
        </div>
      )}

      {(accountPanelOpen || teamPanelOpen) && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-3">
          <div className="absolute inset-0" onClick={() => { setAccountPanelOpen(false); setTeamPanelOpen(false); }} />
          <div className="relative w-full max-w-5xl max-h-[92dvh] overflow-hidden rounded-t-3xl md:rounded-3xl border border-[#3A3732] bg-[#111111] shadow-2xl text-[#F5F2EA]">
            <div className="flex items-center justify-between gap-3 border-b border-[#3A3732] px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#F5F2EA] text-[#101010] flex items-center justify-center font-black text-lg">{(profile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}</div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Nutzerverwaltung</span>
                  <h3 className="text-lg font-black truncate">Konto, Team & Zahlung</h3>
                </div>
              </div>
              <button onClick={() => { setAccountPanelOpen(false); setTeamPanelOpen(false); }} className="w-10 h-10 rounded-xl border border-[#3A3732] bg-[#181818] flex items-center justify-center hover:bg-[#252525]"><LucideIcons.X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] max-h-[calc(92dvh-80px)] overflow-hidden">
              <div className="border-b md:border-b-0 md:border-r border-[#3A3732] bg-[#0F0F0F] p-4 space-y-2">
                {[
                  { id: 'profile', label: 'Persönliche Daten', icon: LucideIcons.UserCog, hint: 'Profil & Kontakt' },
                  { id: 'billing', label: 'Plan & Zahlung', icon: LucideIcons.CreditCard, hint: 'Abo, Rechnung, Speicher' },
                  { id: 'team', label: 'Nutzer / Team', icon: LucideIcons.Users, hint: 'Mitarbeiter & Rollen' },
                  { id: 'settings', label: 'Sicherheit', icon: LucideIcons.Shield, hint: 'Login, Datenschutz' },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = accountManagerTab === item.id;
                  return (
                    <button key={item.id} onClick={() => setAccountManagerTab(item.id as any)} className={`w-full rounded-2xl border px-3 py-3 text-left flex items-center gap-3 transition ${active ? 'bg-[#F5F2EA] text-[#111] border-[#F5F2EA]' : 'bg-[#181818] text-[#F5F2EA] border-[#3A3732] hover:bg-[#222]'}`}>
                      <Icon size={16} />
                      <span className="min-w-0"><span className="block text-[11px] font-black uppercase tracking-wider truncate">{item.label}</span><span className={`block text-[9px] ${active ? 'text-[#111]/60' : 'text-stone-500'} truncate`}>{item.hint}</span></span>
                    </button>
                  );
                })}
                <button onClick={logout} className="mt-4 w-full h-11 rounded-2xl border border-red-950/50 bg-red-950/20 text-red-200 font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2"><LucideIcons.LogOut size={14} /> Abmelden</button>
              </div>

              <div className="overflow-y-auto p-5">
                {accountManagerTab === 'profile' && (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Meine Daten</span>
                      <h4 className="text-2xl font-black mt-1">Profil & Kontakt</h4>
                      <p className="text-sm text-stone-400 mt-1">Diese Daten verwenden wir später für Kontakt speichern, Rechnung und deine ureel-Profile.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        ['displayName', 'Name / Anzeigename'], ['companyName', 'Firma / Projekt'], ['phone', 'Telefon'], ['website', 'Webseite'], ['city', 'Ort'], ['country', 'Land']
                      ].map(([key, label]) => (
                        <label key={key} className="rounded-2xl border border-[#3A3732] bg-[#181818] p-3 block">
                          <span className="block text-[9px] uppercase font-black tracking-wider text-stone-500 mb-2">{label}</span>
                          <input value={(profileDraft as any)[key] || ''} onChange={(e) => setProfileDraft((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full h-10 rounded-xl bg-[#0F0F0F] border border-[#3A3732] px-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">E-Mail</span><span className="block text-[#F5F2EA] font-bold truncate mt-1">{user?.email || 'Nicht verfügbar'}</span></div>
                      <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">Plan</span><span className="block font-black mt-1">{effectivePlanId || profile?.plan || 'starter'}</span></div>
                      <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">ureels</span><span className="block font-black mt-1">{cards.length}</span></div>
                    </div>
                    <button onClick={saveProfileDraft} className="h-12 px-5 rounded-2xl bg-[#F5F2EA] text-[#101010] font-black uppercase text-[10px] tracking-wider flex items-center gap-2"><LucideIcons.Save size={15} /> Daten speichern</button>
                  </div>
                )}

                {accountManagerTab === 'billing' && (
                  <div className="space-y-5">
                    <div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Plan & Zahlung</span><h4 className="text-2xl font-black mt-1">Abo, Speicher & Rechnungen</h4><p className="text-sm text-stone-400 mt-1">MVP: Die Zahlungsanbindung ist vorbereitet. Stripe/Payment kommt im nächsten Schritt.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        ['Starter', 'Zum Testen', '1 ureel / Basisfunktionen'],
                        ['Pro', 'Für aktive Nutzung', 'mehr Karten, Branding, Sharing'],
                        ['Business', 'Für Teams', 'Nutzerverwaltung, Rechnungen, Rollen'],
                      ].map(([name, sub, text]) => (
                        <div key={name} className={`rounded-3xl border p-4 ${String(name).toLowerCase() === String(effectivePlanId).toLowerCase() ? 'border-[#F5F2EA] bg-[#F5F2EA]/10' : 'border-[#3A3732] bg-[#181818]'}`}>
                          <h5 className="text-lg font-black">{name}</h5><p className="text-xs text-[#E8DCC2] font-bold mt-1">{sub}</p><p className="text-xs text-stone-400 mt-3 leading-relaxed">{text}</p><button onClick={() => triggerToast('Zahlung/Upgrade wird mit Stripe im nächsten Schritt verbunden.', 'info')} className="mt-4 w-full h-10 rounded-xl bg-[#F5F2EA] text-[#101010] font-black text-[10px] uppercase">Auswählen</button>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-3xl border border-[#3A3732] bg-[#181818] p-4"><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Rechnungsdaten</span><p className="text-sm text-stone-400 mt-2">Firma, Adresse und UID können im Profil gepflegt werden. Rechnungen werden nach Zahlungsanbindung hier angezeigt.</p></div>
                  </div>
                )}

                {accountManagerTab === 'team' && (
                  <div className="space-y-5">
                    <div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Nutzer / Team</span><h4 className="text-2xl font-black mt-1">Mitarbeiter & Rollen</h4><p className="text-sm text-stone-400 mt-1">Lade später Mitarbeiter ein, die Karten bearbeiten, ansehen oder verwalten dürfen.</p></div>
                    <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#F5F2EA] text-[#101010] flex items-center justify-center font-black">{(profile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><span className="block text-[12px] font-black truncate">{profile?.displayName || user?.displayName || 'Inhaber'}</span><span className="block text-[10px] text-stone-500 truncate">{user?.email}</span></div><span className="px-2.5 py-1 rounded-full border border-[#E8DCC2]/30 bg-[#E8DCC2]/10 text-[#E8DCC2] text-[9px] font-black uppercase">Inhaber</span></div>
                    <div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 space-y-3"><span className="block text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Mitarbeiter einladen</span><div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"><input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="name@firma.de" className="h-11 rounded-xl border border-[#3A3732] bg-[#0F0F0F] px-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" /><button type="button" onClick={() => { if (!inviteEmail.includes('@')) { triggerToast('Bitte eine gültige E-Mail eingeben.', 'error'); return; } const subject = 'Einladung zu ureel.me'; const body = `Du wurdest eingeladen, an einer ureel.me Karte mitzuarbeiten.\n\nProjekt: ${activeCard?.title || activeCard?.slug || 'ureel'}\nLink: ${currentSlugUrl}`; window.location.href = `mailto:${encodeURIComponent(inviteEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; triggerToast('Einladungs-Mail geöffnet.', 'success'); }} className="h-11 px-4 rounded-xl bg-[#F5F2EA] text-[#101010] font-black text-[10px] uppercase tracking-wider">Einladen</button></div><p className="text-[10px] text-stone-500 leading-relaxed">MVP: Die Einladung öffnet dein Mailprogramm. Echte Rollenrechte werden später an Firestore-Regeln und Business-Pläne gebunden.</p></div>
                  </div>
                )}

                {accountManagerTab === 'settings' && (
                  <div className="space-y-5">
                    <div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Sicherheit</span><h4 className="text-2xl font-black mt-1">Login & Datenschutz</h4><p className="text-sm text-stone-400 mt-1">Hier sammeln wir die wichtigen Kontofunktionen für den Nutzer.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><button onClick={() => triggerToast('Passwort ändern wird mit Firebase Password Reset verbunden.', 'info')} className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 text-left"><LucideIcons.KeyRound size={18} className="text-[#E8DCC2] mb-3"/><span className="block font-black">Passwort ändern</span><span className="text-xs text-stone-500">Reset-Link per E-Mail senden.</span></button><button onClick={() => triggerToast('Datenexport wird später als Download bereitgestellt.', 'info')} className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 text-left"><LucideIcons.Download size={18} className="text-[#E8DCC2] mb-3"/><span className="block font-black">Daten exportieren</span><span className="text-xs text-stone-500">Profil, Karten und Rechnungen.</span></button></div>
                    <div className="rounded-3xl border border-red-950/50 bg-red-950/15 p-4"><span className="text-[10px] uppercase font-black tracking-wider text-red-200">Gefahrenbereich</span><p className="text-sm text-red-100/75 mt-2">Konto löschen wird erst aktiviert, wenn Backups, Zahlungen und Kartenbesitz sauber geregelt sind.</p></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
