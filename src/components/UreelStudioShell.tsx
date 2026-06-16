import React, { useState, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton, UreelScene, UreelTimeline, UreelEndCard, UreelTextTemplate, getPublicCardUrl } from '../types';
import { KonuCardCore } from './KonuCardCore';
import { createDefaultButton, sanitizeButtonForFirestore } from '../utils/buttonUtils';
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

type MainModule = 'scene' | 'timeline' | 'buttons' | 'endcard' | 'design';

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
}) => {
  const currentSlugUrl = activeCard ? getPublicCardUrl(activeCard.slug) : '';

  const [activeTab, setActiveTab] = useState<MainModule>('scene');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [buttonPreviewMode, setButtonPreviewMode] = useState<'card' | 'button' | 'grid'>('button');
  const [activeSubSection, setActiveSubSection] = useState<string>('scene-core');
  
  // Local state for actively selected button being edited
  const [editingBtnId, setEditingBtnId] = useState<string | null>(null);
  const [buttonFileUploadProgress, setButtonFileUploadProgress] = useState<number | null>(null);
  const [buttonFileUploading, setButtonFileUploading] = useState(false);
  
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
      if (activeCard?.buttons?.length > 0) {
        setEditingBtnId(activeCard.buttons[0].id);
      } else {
        setEditingBtnId(null);
      }
    }
    else if (activeTab === 'endcard') setActiveSubSection('endcard-general');
    else if (activeTab === 'design') setActiveSubSection('design-presets');
  }, [activeTab]);

  // Handle Playback Simulation Loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineSec((prev) => {
          const limit = activeCard.videoBackgroundConfig?.durationSeconds || 12;
          if (prev >= limit) {
             return 0; // Loop back
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeCard]);

  // Helper: Get active button object being edited
  const editingButton = activeCard?.buttons?.find(b => b.id === editingBtnId) || null;

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


  const handleCreateNewUreel = async () => {
    try {
      const created = await createNewCard({
        title: lang === 'de' ? 'Neue ureel' : 'New ureel',
        subtitle: lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn video into action.',
        description: '',
        isPublished: false,
        visibility: 'draft' as any,
      }, lang);
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

  const syncTimelineToLegacyVideoConfig = (next: Required<UreelTimeline>, duration = timelineDuration) => ({
    ...(activeCard.videoBackgroundConfig || {}),
    durationSeconds: duration,
    duration,
    profileTextReveals: [
      { fieldKey: 'title', enabled: true, startSecond: next.titleAt, fadeDuration: 0.8, staysVisibleAfterSequence: true },
      { fieldKey: 'subtitle', enabled: true, startSecond: next.subtitleAt, fadeDuration: 0.8, staysVisibleAfterSequence: true },
      { fieldKey: 'description', enabled: true, startSecond: next.descriptionAt, fadeDuration: 0.8, staysVisibleAfterSequence: true },
    ],
    buttonReveal: {
      ...(activeCard.videoBackgroundConfig?.buttonReveal || {}),
      enabled: true,
      startSecond: next.buttonsAt,
      endSecond: Math.min(duration, next.buttonsAt + 0.8),
      duration: 0.8,
      style: activeCard.videoBackgroundConfig?.buttonReveal?.style || 'soft',
    },
  });

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
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 80);
    window.dispatchEvent(new CustomEvent('ureel-timeline-reset'));
  };


  const activeButtons = (activeCard.buttons || []).filter((button) => button.isActive !== false);
  const buttonGridCols = activeCard.buttonGridCols || activeCard.buttonGridLayout?.cols || 3;
  const buttonSizePx = activeCard.buttonGridLayout?.buttonSizePx || activeCard.buttonSizePx || 72;
  const buttonGapPx = activeCard.buttonGridLayout?.gapPx || activeCard.buttonGridLayout?.gap || activeCard.buttonGapPx || 10;
  const visibleButtonsAt = Number(timeline.buttonsAt || 0.6);
  const buttonsCurrentlyVisible = timelineSec >= visibleButtonsAt || !isPlaying;


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
    if (button?.radius === 'square') return 'rounded-md';
    if (button?.radius === 'pill') return 'rounded-[28px]';
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

  const renderButtonPreviewTile = (button: CardButton, compact = false) => {
    const Icon = getButtonActionIcon(button.actionType);
    return (
      <div
        key={button.id}
        className={`relative overflow-hidden border bg-stone-900 shadow-inner flex flex-col items-center justify-center text-center transition ${radiusClassForButton(button)} ${compact ? 'aspect-square p-2' : 'min-h-[132px] p-4'}`}
        style={buttonPreviewStyle(button)}
      >
        {!button.isActive && <div className="absolute inset-0 bg-black/55 z-10 flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-stone-300">Inaktiv</div>}
        <div className={`relative z-20 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-2xl bg-black/25 border border-white/10 mb-2`}>
          <Icon size={compact ? 16 : 22} className="text-current" />
        </div>
        <span
          className="relative z-20 font-black line-clamp-3 px-1"
          style={getAutoButtonLabelStyle(button, compact)}
        >
          {button.title || 'Button'}
        </span>
        {!compact && (
          <span className="relative z-20 mt-1 text-[8px] uppercase tracking-widest opacity-70">
            {actionOptions.find((option) => option.value === button.actionType)?.label || button.actionType || 'Aktion'}
          </span>
        )}
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
    };
    const updatedButtons = activeCard.buttons.map((button) => button.id === editingButton.id ? button : { ...button, ...designFields });
    await syncCardUpdate({ buttons: updatedButtons });
    triggerToast(lang === 'de' ? 'Button-Design wurde auf alle anderen Buttons übertragen.' : 'Button design copied to all other buttons.', 'success');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] md:h-screen w-full max-w-[100vw] bg-[#09090B] text-stone-200 overflow-x-hidden md:overflow-hidden overflow-y-auto font-sans antialiased text-xs">
      
      {/* COLUMN 1: LINKE HAUPTNAVIGATION (SIDEBAR) */}
      <div className="order-1 md:order-none sticky top-0 z-40 md:static w-full md:w-[76px] bg-[#0E0E11] border-b md:border-b-0 md:border-r border-stone-900 flex flex-row md:flex-col justify-between items-center gap-3 px-3 md:px-0 py-2 md:py-4 shrink-0 overflow-x-auto">
        
        {/* Top Logo */}
        <div className="relative shrink-0">
          <button
            type="button"
            className="flex flex-row md:flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => setAccountMenuOpen((open) => !open)}
            title={lang === 'de' ? 'Menü öffnen' : 'Open menu'}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#262626] to-[#3A3732] p-0.5 flex items-center justify-center shadow-lg shadow-purple-950/40">
              <LucideIcons.Tv className="text-white w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="font-black text-[9px] tracking-widest text-[#E8DCC2] uppercase select-none">ureel</span>
          </button>
          {accountMenuOpen && (
            <div className="absolute left-0 md:left-[66px] top-12 md:top-0 z-50 w-[280px] rounded-2xl border border-purple-900/40 bg-[#121216] shadow-2xl shadow-black/60 p-3 text-stone-200">
              <div className="border-b border-stone-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-700/50 flex items-center justify-center text-purple-200 font-black">
                    {(profile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-white truncate">{profile?.displayName || user?.displayName || 'Mein ureel.me Konto'}</p>
                    <p className="text-[9px] text-stone-400 truncate">{user?.email || 'Angemeldet'}</p>
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-purple-300 font-bold uppercase tracking-wider">Plan: {effectivePlanId || 'free'}</p>
              </div>
              <div className="space-y-1">
                <button onClick={() => { setAccountMenuOpen(false); handleCreateNewUreel(); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-950/25 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.Plus size={14} className="text-purple-400" /> Neue ureel erstellen
                </button>
                <button onClick={() => { setAccountMenuOpen(false); setAccountPanelOpen(true); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-900 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.UserCog size={14} className="text-purple-400" /> Meine Daten & Einstellungen
                </button>
                <button onClick={() => { setAccountMenuOpen(false); setTeamPanelOpen(true); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-900 text-[11px] font-bold flex items-center gap-2">
                  <LucideIcons.Users size={14} className="text-purple-400" /> Nutzerverwaltung / Team
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
        <div className="flex flex-row md:flex-col gap-2 md:gap-2.5 w-auto md:w-full px-0 md:px-2 overflow-x-auto">
          {[
            { id: 'scene', label: lang === 'de' ? 'Szene' : 'Scene', icon: LucideIcons.Tv },
            { id: 'timeline', label: lang === 'de' ? 'Timeline' : 'Timeline', icon: LucideIcons.Milestone },
            { id: 'buttons', label: lang === 'de' ? 'Buttons' : 'Buttons', icon: LucideIcons.Grid },
            { id: 'endcard', label: lang === 'de' ? 'Endkarte' : 'Endcard', icon: LucideIcons.Flag },
            { id: 'design', label: lang === 'de' ? 'Design' : 'Design', icon: LucideIcons.Palette }
          ].map((item) => {
            const IconComponent = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as MainModule)}
                className={`min-w-[60px] md:min-w-0 flex flex-col items-center justify-center py-2.5 px-2 md:px-0 rounded-xl transition duration-150 relative cursor-pointer ${
                  active 
                    ? 'text-purple-400 bg-purple-950/20 shadow-inner border border-purple-900/30 font-bold' 
                    : 'text-stone-400 hover:text-stone-150 hover:bg-stone-900/40 font-medium'
                }`}
                title={item.label}
              >
                <IconComponent size={18} className="stroke-[2.2]" />
                <span className="text-[8.5px] mt-1 tracking-wider leading-none">{item.label}</span>
                {active && (
                  <div className="absolute right-0 top-1/4 h-1/2 w-0.5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Profile Details or Exit */}
        <div className="flex flex-row md:flex-col items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (confirm(lang === 'de' ? 'Möchten Sie sich wirklich abmelden?' : 'Do you really want to log out?')) {
                logout();
              }
            }}
            className="p-2 text-stone-500 hover:text-white transition duration-150 hover:bg-stone-900 rounded-lg cursor-pointer"
            title={lang === 'de' ? 'Abmelden' : 'Logout'}
          >
            <LucideIcons.LogOut size={16} />
          </button>
        </div>
      </div>

      {/* COLUMN 2: LINKES MODULPANEL (SUB NAV / SUB OPTIONS) */}
      <div className="order-3 md:order-none w-full md:w-[220px] bg-[#111115] max-h-[240px] md:max-h-screen overflow-y-auto md:overflow-visible border-b md:border-b-0 md:border-r border-stone-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Active Module Title */}
          <div className="p-4 border-b border-stone-850/60">
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-widest block mb-0.5">Studio-Modul</span>
            <span className="text-sm font-black text-white tracking-wide uppercase">
              {activeTab === 'scene' && (lang === 'de' ? 'Video / Szene' : 'Video / Scene')}
              {activeTab === 'timeline' && (lang === 'de' ? 'Texte & Timeline' : 'Texts & Timeline')}
              {activeTab === 'buttons' && (lang === 'de' ? 'Buttons & Raster' : 'Buttons & Grid')}
              {activeTab === 'endcard' && (lang === 'de' ? 'Endkarte & CTA' : 'Endcard & CTA')}
              {activeTab === 'design' && (lang === 'de' ? 'Design & Farben' : 'Design & Presets')}
            </span>
          </div>

          {/* Tab specific menu layouts */}
          <div className="p-2 space-y-1 md:overflow-visible">
            {activeTab === 'scene' && (
              <>
                <button
                  onClick={() => setActiveSubSection('scene-video')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'scene-video' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Tv size={14} className="text-purple-400 shrink-0" />
                  <span>Clip / Video</span>
                </button>
                <button
                  onClick={() => setActiveSubSection('scene-color')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'scene-color' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Palmtree size={14} className="text-purple-400 shrink-0" />
                  <span>Statisch / Fülleffekt</span>
                </button>
              </>
            )}

            {activeTab === 'timeline' && (
              <>
                <button
                  onClick={() => setActiveSubSection('timeline-texts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'timeline-texts' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Heading size={14} className="text-purple-400 shrink-0" />
                  <span>Texte bearbeiten</span>
                </button>
                <button
                  onClick={() => setActiveSubSection('timeline-times')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'timeline-times' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Hourglass size={14} className="text-purple-400 shrink-0" />
                  <span>Einblend-Timing</span>
                </button>
              </>
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
                    activeSubSection === 'endcard-general' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.PlaySquare size={14} className="text-purple-400 shrink-0" />
                  <span>Nachspielsequenz</span>
                </button>
                <button
                  onClick={() => setActiveSubSection('endcard-branding')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'endcard-branding' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Sparkles size={14} className="text-purple-400 shrink-0" />
                  <span>Wasserzeichen / Logo</span>
                </button>
              </>
            )}

            {activeTab === 'design' && (
              <>
                <button
                  onClick={() => setActiveSubSection('design-presets')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'design-presets' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.SlidersHorizontal size={14} className="text-purple-400 shrink-0" />
                  <span>Design-Presets</span>
                </button>
                <button
                  onClick={() => setActiveSubSection('design-typography')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                    activeSubSection === 'design-typography' ? 'bg-purple-950/20 text-purple-300 font-bold border border-purple-900/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <LucideIcons.Type size={14} className="text-purple-400 shrink-0" />
                  <span>Schriftarten / Style</span>
                </button>
              </>
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
                className="w-full bg-stone-900 border border-stone-800 text-white rounded-lg h-8.5 px-2 text-[10.5px] font-bold focus:outline-none focus:border-purple-600 appearance-none relative pr-6"
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
            className="w-full h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-purple-950/30"
          >
            <LucideIcons.Plus size={14} />
            Neue ureel erstellen
          </button>
        </div>
      </div>

      {/* COLUMN 3: AKTIVES DETAILPANEL (FORM CONTROLS) */}
      <div className="order-4 md:order-none flex-1 min-w-0 bg-[#141419] p-4 md:p-6 overflow-y-auto space-y-6 pb-24 md:pb-6">
        
        {/* Module Header block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-900 pb-4">
          <div>
            <h1 className="text-base font-black text-white tracking-tight uppercase">
              {activeTab === 'scene' && (activeSubSection === 'scene-video' ? 'Clip-Video / Background Reel' : 'Statische Füllfarbe & Overlay')}
              {activeTab === 'timeline' && (activeSubSection === 'timeline-texts' ? 'Texte, Slogans & Format' : 'Animations-Timeline')}
              {activeTab === 'buttons' && (activeSubSection === 'buttons-list' ? 'Button-Liste' : activeSubSection === 'buttons-action' ? 'Aktion & Ziel' : activeSubSection === 'buttons-design' ? 'Button-Design' : 'Raster & Vorschau')}
              {activeTab === 'endcard' && (activeSubSection === 'endcard-general' ? 'Nachspielsequenz einrichten' : 'Wasserzeichen & Branding')}
              {activeTab === 'design' && (activeSubSection === 'design-presets' ? 'Exklusive Design-Presets' : 'Schriftart konfigurieren')}
            </h1>
            <p className="text-[10px] text-stone-450 mt-1">
              {activeTab === 'scene' && (activeSubSection === 'scene-video' ? 'Ermöglicht das automatische Abspielen eines Videos oder Loops im Hintergrund.' : 'Bestimmen Sie das statische Farbsystem oder Overlay.')}
              {activeTab === 'timeline' && (activeSubSection === 'timeline-texts' ? 'Passe die Begrüßung und Beschreibung an, die über der Szene liegen.' : 'Reguliere millisekundengenaue Animations-Szenen wie bei professionellen Werbeanzeigen.')}
              {activeTab === 'buttons' && (activeSubSection === 'buttons-list' ? 'Jeder Button ist als eigene Karte sichtbar – inklusive Kopieren, Duplizieren und Löschen.' : activeSubSection === 'buttons-action' ? 'Bestimme, was der Button öffnet: Link, Telefon, PDF, Datei oder Formular.' : activeSubSection === 'buttons-design' ? 'Gestalte Text, Bild, Farbe, Form und Lesbarkeit des Buttons.' : 'Wechsle zwischen Karte, Button und Raster-Vorschau und passe Größe/Abstand an.')}
              {activeTab === 'endcard' && (activeSubSection === 'endcard-general' ? 'Bestimme, was abläuft, wenn das Video zu Ende abgespielt wurde.' : 'Entferne ureel-Wasserzeichen oder füge eigene Marken-Logos hinzu.')}
              {activeTab === 'design' && (activeSubSection === 'design-presets' ? 'Wähle aus einer Reihe von optimalen Designvorlagen für deinen Kampagnenflow.' : 'Definiere Headline-Schrifteffekte und Designstile.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentSlugUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-stone-900 hover:bg-stone-850 hover:text-white border border-stone-800 text-stone-300 font-extrabold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 uppercase tracking-wider text-[9.5px]"
            >
              <LucideIcons.ExternalLink size={11} className="text-purple-400" />
              <span>Live-Link</span>
            </a>
          </div>
        </div>

        {/* Content Renderers per Section */}
        <div className="space-y-6 max-w-full md:max-w-xl">
          
          {/* TAB 1: SCENE & SCENE BACKGROUNDS */}
          {activeTab === 'scene' && activeSubSection === 'scene-video' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Hintergrund-Typ erzwingen</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      await syncCardUpdate({
                        backgroundType: 'video',
                        videoBackgroundConfig: {
                          ...activeCard.videoBackgroundConfig,
                          enabled: true,
                          mediaMode: 'youtube'
                        }
                      });
                      triggerToast(lang === 'de' ? 'Video-Modus aktiviert' : 'Video Mode activated', 'info');
                    }}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left cursor-pointer transition ${
                      activeCard.backgroundType === 'video' || activeCard.videoBackgroundConfig?.enabled
                        ? 'border-purple-600 bg-purple-950/20 text-white font-bold'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <LucideIcons.Video size={14} className="text-purple-400 shrink-0" />
                    <div className="truncate">
                      <span className="block text-[10px] leading-tight">Reel Video-Hintergrund</span>
                      <span className="block text-[8px] text-stone-500 leading-none mt-0.5">Automatisches Abspielen</span>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      await syncCardUpdate({
                        backgroundType: 'image',
                        videoBackgroundConfig: {
                          ...activeCard.videoBackgroundConfig,
                          enabled: false,
                        }
                      });
                      triggerToast(lang === 'de' ? 'Bild-Modus aktiviert' : 'Static Image activated', 'info');
                    }}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left cursor-pointer transition ${
                      activeCard.backgroundType === 'image' && !activeCard.videoBackgroundConfig?.enabled
                        ? 'border-purple-600 bg-purple-950/20 text-white font-bold'
                        : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <LucideIcons.Image size={14} className="text-purple-400 shrink-0" />
                    <div className="truncate">
                      <span className="block text-[10px] leading-tight">Mattes Cover-Bild</span>
                      <span className="block text-[8px] text-stone-500 leading-none mt-0.5">Statische Ansicht</span>
                    </div>
                  </button>
                </div>
              </div>

              {(activeCard.backgroundType === 'video' || activeCard.videoBackgroundConfig?.enabled) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Videolink (YouTube oder Shorts)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activeCard.videoBackgroundConfig?.youtubeUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          syncCardUpdate({
                            videoBackgroundConfig: {
                              ...activeCard.videoBackgroundConfig,
                              youtubeUrl: val,
                              enabled: true,
                              mediaMode: 'youtube'
                            }
                          });
                        }}
                        placeholder="z.B. https://www.youtube.com/watch?v=..."
                        className="flex-1 bg-stone-900 border border-stone-800 h-9 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <span className="text-[9px] text-stone-500 mt-1 block">YouTube oder Shorts werden automatisch im Hintergrund geloopt.</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-400 mb-2">
                      <span>Maximale Video-Spieldauer:</span>
                      <span className="text-purple-400 font-mono">{(activeCard.videoBackgroundConfig?.durationSeconds || 12)}s</span>
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
                      className="w-full h-1 h-1.5 bg-stone-800 accent-purple-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-stone-500 mt-1">
                      <span>5 Sek.</span>
                      <span>12 Sek. (Standard)</span>
                      <span>15 Sek. (Limit)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scene' && activeSubSection === 'scene-color' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Hintergrund-Fülleffekte</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Grund-Hintergrundfarbe</label>
                    <div className="flex items-center gap-2 h-9 bg-stone-900 border border-stone-850 rounded-xl px-2">
                      <input
                        type="color"
                        value={activeCard.cardBackgroundColor || '#121212'}
                        onChange={(e) => {
                          syncCardUpdate({ cardBackgroundColor: e.target.value });
                        }}
                        className="w-5 h-5 rounded cursor-pointer border-0 outline-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeCard.cardBackgroundColor || '#121212'}
                        onChange={(e) => {
                          syncCardUpdate({ cardBackgroundColor: e.target.value });
                        }}
                        className="bg-transparent border-0 text-white w-full h-full text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-450 tracking-wider mb-2">Vignette / Verdunklung</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const dark = activeCard.cardBackgroundDarken || 0;
                          syncCardUpdate({ cardBackgroundDarken: dark >= 50 ? 0 : 50 });
                        }}
                        className={`w-full text-center py-2 rounded-xl transition font-bold text-[10px] cursor-pointer ${
                          (activeCard.cardBackgroundDarken || 0) >= 50
                            ? 'bg-purple-950/30 text-purple-400 border border-purple-900/30'
                            : 'bg-stone-900 text-stone-400 border border-stone-850 hover:bg-stone-850'
                        }`}
                      >
                        {(activeCard.cardBackgroundDarken || 0) >= 50 ? 'Verdunklung AN (50%)' : 'Verdunklung AUS'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & TEXTS */}
          {activeTab === 'timeline' && activeSubSection === 'timeline-texts' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Sichtbare Werbebotschaft</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Hauptüberschrift (Headline)</label>
                    <input
                      type="text"
                      value={activeCard.title || ''}
                      onChange={(e) => syncCardUpdate({ title: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 h-9 px-3 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600"
                      placeholder="z.B. Mehr Kunden im Handumdrehen!"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Untertitel (Slogan)</label>
                    <input
                      type="text"
                      value={activeCard.subtitle || ''}
                      onChange={(e) => syncCardUpdate({ subtitle: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 h-9 px-3 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600"
                      placeholder="z.B. Gestalte professionelle Video-Landingpages kostenlos."
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Werbetext / Beschreibung</label>
                    <textarea
                      value={activeCard.description || ''}
                      onChange={(e) => syncCardUpdate({ description: e.target.value })}
                      rows={3}
                      className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600 resize-none"
                      placeholder="Hier ist Platz für dein detailliertes Verkaufsangebot..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && activeSubSection === 'timeline-times' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-5">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Timeline-Steuerung</span>
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
                            ? 'border-purple-500 bg-purple-600 text-white'
                            : 'border-stone-850 bg-stone-900 text-stone-400 hover:bg-stone-850'
                        }`}
                      >
                        {duration} Sekunden
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'titleAt', label: 'Titel erscheint bei' },
                    { key: 'subtitleAt', label: 'Untertitel erscheint bei' },
                    { key: 'descriptionAt', label: 'Beschreibung erscheint bei' },
                    { key: 'buttonsAt', label: 'Buttons erscheinen bei' },
                    { key: 'endCardAt', label: 'Endkarte erscheint bei' },
                  ].map((item) => {
                    const value = Number((timeline as any)[item.key] || 0);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between items-center text-[10.5px] font-bold text-stone-400 mb-1.5">
                          <span>{item.label}</span>
                          <span className="text-purple-400 font-mono">{value.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={timelineDuration}
                          step={0.1}
                          value={value}
                          onChange={(e) => updateTimelineField(item.key as keyof Omit<UreelTimeline, 'preset'>, parseFloat(e.target.value))}
                          className="w-full bg-stone-800 accent-purple-600 h-1.5 rounded-lg appearance-none cursor-pointer"
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
                      className={`p-1 w-10 rounded-full transition-colors flex shrink-0 ${endCard.enabled ? 'bg-purple-600 justify-end' : 'bg-stone-800 justify-start'} cursor-pointer`}
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
                      className={`p-1 w-10 rounded-full transition-colors flex shrink-0 ${endCard.replayButton !== false ? 'bg-purple-600 justify-end' : 'bg-stone-800 justify-start'} cursor-pointer`}
                    >
                      <span className="w-4 h-4 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1.5">Endkarte-Verhalten</label>
                    <select
                      value={endCard.source || 'scene'}
                      onChange={(e) => setEndCard({ source: e.target.value as UreelEndCard['source'] })}
                      className="w-full bg-stone-950 border border-stone-800 h-9 px-3 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-purple-600"
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
                    <div className="absolute left-0 top-0 bottom-0 bg-purple-600/15" style={{ width: `${Math.min(100, (timelineSec / timelineDuration) * 100)}%` }} />
                    {[
                      { label: 'Titel', value: timeline.titleAt },
                      { label: 'Untertitel', value: timeline.subtitleAt },
                      { label: 'Text', value: timeline.descriptionAt },
                      { label: 'Buttons', value: timeline.buttonsAt },
                      { label: 'Endkarte', value: timeline.endCardAt },
                    ].map((mark) => (
                      <div
                        key={mark.label}
                        className="absolute top-1 bottom-1 w-px bg-purple-400/80"
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
                  <button type="button" onClick={restartPreviewSimulation} className="min-h-[44px] bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">Timing simulieren</button>
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

              {activeSubSection === 'buttons-list' && (
                <div className="space-y-4">
                  <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Button-Liste</span>
                        <p className="text-[9.5px] text-stone-500 mt-1">Jeder Button ist selbst eine kleine Karte. Aktionen sitzen direkt auf der Karte.</p>
                      </div>
                      <button onClick={handleAddButtonLocal} className="h-10 px-3 rounded-xl bg-[#F5F2EA] text-[#101010] text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                        <LucideIcons.Plus size={14} /> Neu
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(activeCard.buttons || []).map((button, index) => {
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
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <button type="button" onClick={() => handleCopyButtonLocal(button)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] text-[8.5px] font-black uppercase flex items-center justify-center gap-1">
                                <LucideIcons.Copy size={10} /> Kopieren
                              </button>
                              <button type="button" onClick={() => handleDuplicateButtonLocal(button)} className="h-8 rounded-xl border border-[#3A3732] bg-[#101010] text-[#F5F2EA] text-[8.5px] font-black uppercase flex items-center justify-center gap-1">
                                <LucideIcons.CopyPlus size={10} /> Duplizieren
                              </button>
                              <button type="button" onClick={() => handleDeleteButtonLocal(button.id)} className="h-8 rounded-xl border border-red-950/50 bg-red-950/20 text-red-300 text-[8.5px] font-black uppercase flex items-center justify-center gap-1">
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
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Beschriftung</label>
                      <input type="text" value={editingButton.title || ''} onChange={(e) => handleUpdateSingleButton(editingButton.id, { title: e.target.value })} className="w-full bg-[#181818] border border-[#3A3732] h-10 px-3 rounded-xl text-xs font-bold text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" />
                    </div>
                    <div>
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
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Button-Farbe</label><input type="color" value={editingButton.bgColor || editingButton.backgroundColor || activeCard.buttonColor || '#18181B'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { bgColor: e.target.value, backgroundColor: e.target.value })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Textfarbe</label><input type="color" value={editingButton.textColor || activeCard.buttonTextColor || '#F5F2EA'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { textColor: e.target.value, iconColor: e.target.value })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Rahmenfarbe</label><input type="color" value={editingButton.borderColor || '#E8DCC2'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { borderColor: e.target.value, borderEnabled: true, borderWidth: editingButton.borderWidth || 'thin' })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] p-1" /></div>
                      <div><label className="block text-[9px] uppercase font-bold text-stone-450 tracking-wider mb-1">Eckenform</label><select value={editingButton.radius || 'rounded'} onChange={(e) => handleUpdateSingleButton(editingButton.id, { radius: e.target.value as any })} className="w-full h-10 rounded-xl bg-[#181818] border border-[#3A3732] px-3 text-xs text-[#F5F2EA]"><option value="square">Eckig</option><option value="rounded">Abgerundet</option><option value="pill">Stark rund</option></select></div>
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
                    {buttonPreviewMode === 'card' && <div className="rounded-3xl border border-[#3A3732] bg-[#0B0B0B] p-3 max-w-[260px] mx-auto"><div className="h-[430px] rounded-[28px] overflow-hidden border-[8px] border-[#1C1C1C] bg-black"><KonuCardCore card={activeCard} lang={lang} isDesktopPreview={false} isPreview={true} /></div></div>}
                    {buttonPreviewMode === 'button' && editingButton && <div className="max-w-[240px] mx-auto">{renderButtonPreviewTile(editingButton)}</div>}
                    {buttonPreviewMode === 'grid' && <div className="grid max-w-sm mx-auto" style={{ gridTemplateColumns: `repeat(${buttonGridCols}, minmax(0, 1fr))`, gap: `${buttonGapPx}px` }}>{(activeButtons.length ? activeButtons : activeCard.buttons || []).map((button) => renderButtonPreviewTile(button, true))}</div>}
                    <div className="rounded-xl border border-[#3A3732] bg-[#181818] p-3 text-[9px] leading-relaxed text-[#F5F2EA]/80"><b>Timeline-Hinweis:</b> In der Live-Karte erscheinen Buttons ab <b>{visibleButtonsAt.toFixed(1)}s</b>. Die Button-Vorschau bleibt hier immer sichtbar.</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-2xl border border-[#3A3732] space-y-4">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2] block">Raster-Einstellungen</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">{[{ id: 'list', label: '1 Spalte', desc: 'Unter-einander', cols: 1 }, { id: 'grid-2', label: '2 Spalten', desc: 'Kompakt', cols: 2 }, { id: 'grid-3', label: '3er Raster', desc: 'ureel-Standard', cols: 3 }].map((preset) => { const currentCols = activeCard.buttonGridCols || activeCard.buttonGridLayout?.cols || 3; const selected = preset.cols === currentCols; return <button key={preset.id} type="button" onClick={async () => { await syncCardUpdate({ buttonGridCols: preset.cols as any, buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), mode: preset.cols === 3 ? 'three_columns' : preset.cols === 2 ? 'two_columns' : 'one_column', cols: preset.cols as any, square: true } }); triggerToast(lang === 'de' ? 'Spalten-Wahl angepasst' : 'Grid changed', 'success'); }} className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition cursor-pointer ${selected ? 'border-[#F5F2EA] bg-[#F5F2EA]/10' : 'border-[#3A3732] bg-[#181818] opacity-80 hover:opacity-100'}`}><span className="text-[10.5px] font-black text-[#F5F2EA] block uppercase tracking-wide leading-none">{preset.label}</span><span className="text-[8.5px] text-stone-500 mt-1 leading-snug">{preset.desc}</span></button>; })}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"><div><div className="flex items-center justify-between text-[10.5px] font-bold text-stone-400 mb-2"><span>Button-Größe</span><span className="text-[#E8DCC2] font-mono">{buttonSizePx}px</span></div><input type="range" min={52} max={104} step={2} value={buttonSizePx} onChange={(e) => syncCardUpdate({ buttonSizePx: Number(e.target.value), buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), buttonSizePx: Number(e.target.value), cols: buttonGridCols as any, square: true } })} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" /></div><div><div className="flex items-center justify-between text-[10.5px] font-bold text-stone-400 mb-2"><span>Button-Abstand</span><span className="text-[#E8DCC2] font-mono">{buttonGapPx}px</span></div><input type="range" min={4} max={22} step={1} value={buttonGapPx} onChange={(e) => syncCardUpdate({ buttonGapPx: Number(e.target.value), buttonGridLayout: { ...(activeCard.buttonGridLayout || {}), gapPx: Number(e.target.value), gap: Number(e.target.value), cols: buttonGridCols as any, square: true } })} className="w-full bg-stone-800 accent-[#E8DCC2] h-1.5 rounded-lg appearance-none cursor-pointer" /></div></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ENDCARD & CTA */}
          {activeTab === 'endcard' && activeSubSection === 'endcard-general' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Dauerhafte Endkarte (CTA Banner)</span>
                <p className="text-[9.5px] text-stone-400">Blenden Sie ein horizontales Aktions-Kombibanner am unteren Bildschirmrand ein, damit Endkunden immer auf Ihre ureel reagieren können.</p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 bg-stone-900 rounded-lg">
                    <div>
                      <span className="block font-bold text-[10.5px]">Aktionsbanner am Ende einblenden</span>
                      <span className="block text-[8px] text-stone-500 mt-0.5">Zusammenfassung und Weiterleitung anbieten.</span>
                    </div>
                    <button
                      onClick={() => handleToggleElementInReelLocal('includeCta')}
                      className={`p-1 w-9 rounded-full transition-colors flex ${
                        activeCard.reelExportConfig?.includeCta !== false ? 'bg-purple-600 justify-end' : 'bg-stone-800 justify-start'
                      } cursor-pointer`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider mb-1.5">Banner-Beschriftung</label>
                    <input
                      type="text"
                      value={activeCard.reelExportConfig?.ctaText || 'Jetzt Angebot sichern'}
                      onChange={(e) => {
                        syncCardUpdate({
                          reelExportConfig: {
                            ...(activeCard.reelExportConfig || {}),
                            ctaText: e.target.value
                          }
                        });
                      }}
                      className="w-full bg-stone-900 border border-stone-800 h-9 px-3 rounded-xl text-xs text-white focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endcard' && activeSubSection === 'endcard-branding' && (
            <div className="space-y-4">
              <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-900 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Wasserzeichen und ureel-Marke</span>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-stone-900 rounded-lg">
                    <div>
                      <span className="block font-bold text-[10.5px]">Dezente ureel-Branding Zeile am Fuß</span>
                      <span className="block text-[8px] text-stone-500 mt-0.5">Blendet ein „Erstellt mit ureel.me“ Logo ein.</span>
                    </div>
                    <button
                      onClick={() => handleToggleElementInReelLocal('includeBranding')}
                      className={`p-1 w-9 rounded-full transition-colors flex ${
                        activeCard.reelExportConfig?.includeBranding !== false ? 'bg-purple-600 justify-end' : 'bg-stone-800 justify-start'
                      } cursor-pointer`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-stone-950 block shadow-md" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DESIGN PRESETS */}
          {activeTab === 'design' && activeSubSection === 'design-presets' && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Exklusive Design-Presets</span>
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
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-400 block">Schriftgruppen-Grundeinstellung</span>
                
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
                              ? 'border-purple-600 bg-purple-950/25 text-white'
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
      <div className="order-2 md:order-none w-full md:w-[330px] max-h-[48dvh] md:max-h-none overflow-hidden md:overflow-visible bg-[#0E0E11] border-b md:border-b-0 md:border-l border-stone-900 flex flex-col justify-between shrink-0 p-3 md:p-4">
        
        {/* Preview Title bar */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-stone-300 uppercase tracking-widest">ureel live</span>
          </div>

          <div className="flex bg-stone-950 border border-stone-900 p-0.5 rounded-lg">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 px-2.5 rounded text-[8.5px] font-bold cursor-pointer transition flex items-center gap-1 hover:text-white"
            >
              {isPlaying ? (
                <>
                  <LucideIcons.Pause size={10} className="text-purple-500 fill-purple-500" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <LucideIcons.Play size={10} className="text-purple-500 fill-purple-500" />
                  <span>Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Realistic iPhone mockup frame */}
        <div className="flex-none md:flex-1 flex items-center justify-center py-2 md:py-4 bg-stone-950/20">
          <div className="relative mx-auto w-[150px] h-[308px] sm:w-[180px] sm:h-[370px] md:w-[256px] md:h-[526px] bg-black rounded-[30px] md:rounded-[38px] border-[8px] border-stone border-stone-850 shadow-2xl overflow-hidden flex flex-col justify-between relative ring-4 ring-purple-900/10">
            {/* Dynamic Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-b-xl z-25 flex items-center justify-center" />

            {/* Simulated UTC & Battery header line */}
            <div className="absolute top-0.5 left-0 right-0 px-5 flex justify-between text-[7px] text-stone-500 z-20 font-bold font-mono">
              <span>09:41</span>
              <span>100% 🔋</span>
            </div>

            {/* Inner frame wrapper with absolute overlays */}
            <div className="w-full h-full overflow-y-auto select-none bg-[#09090B] text-stone-200 scrollbar-none flex flex-col justify-between relative pt-5">
              <KonuCardCore
                card={activeCard}
                lang={lang}
                isDesktopPreview={false}
                isPreview={true}
              />
            </div>
            
            {/* Timeline bottom indicator bar */}
            {isPlaying && (
              <div className="absolute bottom-1.5 left-2 right-2 bg-black/80 border border-purple-900/40 p-1.5 rounded-lg flex items-center justify-between text-[7.5px] z-30 font-mono text-purple-400">
                <span className="flex items-center gap-1 font-bold">
                  <LucideIcons.Tv size={8} className="animate-pulse" />
                  REEL PLAYBACK
                </span>
                <span>{timelineSec}s / {activeCard.videoBackgroundConfig?.durationSeconds || 12}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Share buttons or actions below preview */}
        <div className="space-y-2 pt-3 border-t border-stone-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = currentSlugUrl;
                if (copyTextToClipboard(url)) {
                  triggerToast(lang === 'de' ? 'Aktionslink in die Zwischenablage kopiert!' : 'Action link copied to clipboard!', 'success');
                } else {
                  triggerToast(lang === 'de' ? 'Nicht erfolgreich' : 'Copy unsuccessful', 'error');
                }
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white border-0 font-extrabold py-2.5 px-3 rounded-xl transition duration-150 flex items-center justify-center gap-1 text-[9.5px] uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-900/20"
            >
              <LucideIcons.Copy size={11} className="stroke-[2.5]" />
              <span>{lang === 'de' ? 'Link kopieren' : 'Copy link'}</span>
            </button>
          </div>
          <span className="block text-center text-[8px] text-stone-500 tracking-wider">Erstellt mit dem intelligenten ureel.me Studio</span>
        </div>

      </div>


      {accountPanelOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-3">
          <div className="absolute inset-0" onClick={() => setAccountPanelOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl border border-[#3A3732] bg-[#111111] p-5 shadow-2xl text-[#F5F2EA]">
            <div className="flex items-center justify-between gap-3 mb-4"><div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Mein Konto</span><h3 className="text-lg font-black">Meine Daten</h3></div><button onClick={() => setAccountPanelOpen(false)} className="w-10 h-10 rounded-xl border border-[#3A3732] bg-[#181818] flex items-center justify-center"><LucideIcons.X size={16} /></button></div>
            <div className="space-y-3 text-sm"><div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">E-Mail</span><span className="block text-[#F5F2EA] font-bold truncate">{user?.email || 'Nicht verfügbar'}</span></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">Plan</span><span className="block font-black">{effectivePlanId || profile?.plan || 'starter'}</span></div><div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4"><span className="block text-[9px] uppercase font-black text-stone-500 tracking-wider">ureels</span><span className="block font-black">{cards.length}</span></div></div><button onClick={logout} className="w-full h-11 rounded-2xl border border-red-950/50 bg-red-950/20 text-red-200 font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2"><LucideIcons.LogOut size={14} /> Abmelden</button></div>
          </div>
        </div>
      )}

      {teamPanelOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-3">
          <div className="absolute inset-0" onClick={() => setTeamPanelOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-[#3A3732] bg-[#111111] p-5 shadow-2xl text-[#F5F2EA]">
            <div className="flex items-center justify-between gap-3 mb-4"><div><span className="text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Nutzerverwaltung</span><h3 className="text-lg font-black">Team & Zugriff</h3></div><button onClick={() => setTeamPanelOpen(false)} className="w-10 h-10 rounded-xl border border-[#3A3732] bg-[#181818] flex items-center justify-center"><LucideIcons.X size={16} /></button></div>
            <div className="space-y-4"><div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-[#F5F2EA] text-[#101010] flex items-center justify-center font-black">{(profile?.displayName || user?.email || 'U').slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><span className="block text-[12px] font-black truncate">{profile?.displayName || user?.displayName || 'Inhaber'}</span><span className="block text-[10px] text-stone-500 truncate">{user?.email}</span></div><span className="px-2.5 py-1 rounded-full border border-[#E8DCC2]/30 bg-[#E8DCC2]/10 text-[#E8DCC2] text-[9px] font-black uppercase">Inhaber</span></div><div className="rounded-2xl border border-[#3A3732] bg-[#181818] p-4 space-y-3"><span className="block text-[10px] uppercase font-black tracking-wider text-[#E8DCC2]">Mitarbeiter einladen</span><div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"><input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="name@firma.de" className="h-11 rounded-xl border border-[#3A3732] bg-[#0F0F0F] px-3 text-sm text-[#F5F2EA] focus:outline-none focus:border-[#F5F2EA]" /><button type="button" onClick={() => { if (!inviteEmail.includes('@')) { triggerToast('Bitte eine gültige E-Mail eingeben.', 'error'); return; } const subject = 'Einladung zu ureel.me'; const body = `Du wurdest eingeladen, an einer ureel.me Karte mitzuarbeiten.\n\nProjekt: ${activeCard?.title || activeCard?.slug || 'ureel'}\nLink: ${currentSlugUrl}`; window.location.href = `mailto:${encodeURIComponent(inviteEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; triggerToast('Einladungs-Mail geöffnet.', 'success'); }} className="h-11 px-4 rounded-xl bg-[#F5F2EA] text-[#101010] font-black text-[10px] uppercase tracking-wider">Einladen</button></div><p className="text-[10px] text-stone-500 leading-relaxed">MVP: Die Einladung öffnet dein Mailprogramm. Rollen & echte Teamrechte können danach an Firestore-Regeln/Company-Accounts angebunden werden.</p></div></div>
          </div>
        </div>
      )}

    </div>
  );
};
