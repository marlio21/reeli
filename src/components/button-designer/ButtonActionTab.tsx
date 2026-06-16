import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { CardButton, Card } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { compressImageBeforeUpload } from '../../utils/image';
import { UpgradeModal } from '../UpgradeModal';
import { 
  canUseFeature, 
  getUserPlan, 
  BUTTON_CATALOG, 
  getCategoryLabel, 
  CatalogButton 
} from '../../config/plans';
import { detectProvider, sanitizeExternalUrl } from '../../utils/buttonUtils';

interface ButtonActionTabProps {
  localButton: CardButton;
  updateButton: (updates: Partial<CardButton>) => void;
  lang: 'de' | 'en';
  isBtnFileUploading: boolean;
  handleFileActionUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  btnProtected: boolean;
  setBtnProtected: (protectedVal: boolean) => void;
  btnPassword: string;
  setBtnPassword: (pwd: string) => void;
  btnRepeatPassword: string;
  setBtnRepeatPassword: (pwd: string) => void;
  btnPasswordHint: string;
  setBtnPasswordHint: (hint: string) => void;
  handleTestLink: () => void;
  card: Card;
  subSection?: string;
}

export const ButtonActionTab: React.FC<ButtonActionTabProps> = ({
  localButton,
  updateButton,
  lang,
  isBtnFileUploading,
  handleFileActionUpload,
  btnProtected,
  setBtnProtected,
  btnPassword,
  setBtnPassword,
  btnRepeatPassword,
  setBtnRepeatPassword,
  btnPasswordHint,
  setBtnPasswordHint,
  handleTestLink,
  card,
  subSection,
}) => {
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySuccess, setGallerySuccess] = useState<string | null>(null);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<any>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => prev === msg ? null : prev);
    }, 4000);
  };

  const { uploadFile, profile, effectivePlanId } = useFirebase();
  const currentPlan = (effectivePlanId || getUserPlan(profile) || 'starter').toLowerCase();
  const ENABLE_PASSWORD_EDITOR_UI = false;

  // Helper check for plan authorization
  const PLAN_ORDER = ['starter', 'pro', 'business'];
  const isPlanLower = (userPlan: string, requiredPlan: string) => {
    const uIdx = PLAN_ORDER.indexOf(userPlan);
    const rIdx = PLAN_ORDER.indexOf(requiredPlan);
    return uIdx < rIdx;
  };

  // Gallery image uploader logic (direct upload mapped onto 'konu_gallery')
  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsGalleryUploading(true);
    setGalleryError(null);
    setGallerySuccess(null);

    const files = Array.from(e.target.files) as File[];

    try {
      const uploadedImages = [];
      let hasLargeFile = false;
      for (const file of files) {
        if (file.size > 1.5 * 1024 * 1024) {
          hasLargeFile = true;
          break;
        }
      }
      if (hasLargeFile) {
        setGallerySuccess(lang === 'de' 
          ? 'Mindestens ein Bild ist groß. Optimierung läuft...' 
          : 'Large image detected, compressing dynamically...'
        );
        await new Promise((r) => setTimeout(r, 600));
      }

      for (const file of files) {
        let fileToUpload: File | Blob = file;
        try {
          fileToUpload = await compressImageBeforeUpload(file, 'gallery');
        } catch (compressErr) {
          console.warn("Compression of a file failed", compressErr);
        }

        const downloadUrl = await uploadFile(card.cardId, fileToUpload, 'button-images');
        uploadedImages.push({
          url: downloadUrl,
          name: file.name,
          size: fileToUpload.size,
          type: fileToUpload.type || file.type,
          createdAt: new Date().toISOString(),
        });
      }

      const existingImages = localButton.galleryImages || [];
      updateButton({
        galleryImages: [...existingImages, ...uploadedImages],
      });
      setGallerySuccess(lang === 'de' ? 'Bilder erfolgreich integriert.' : 'Images uploaded successfully.');
    } catch (err: any) {
      console.error("Gallery upload error", err);
      setGalleryError(lang === 'de' ? 'Upload fehlgeschlagen.' : 'Image upload failed.');
    } finally {
      setIsGalleryUploading(false);
      e.target.value = '';
    }
  };

  const onFileChangeWrapped = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    const currentActionType = localButton.actionType || 'none';
    const maxSizeMB = currentPlan === 'business' ? 25 : 10;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (currentActionType === 'pdf_upload') {
      const isPdfMime = file.type === 'application/pdf';
      const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
      if (!isPdfMime && !isPdfExt) {
        const errorMsg = lang === 'de'
          ? 'Dieser Dateityp ist nicht erlaubt.'
          : 'This file type is not allowed.';
        alert(errorMsg);
        e.target.value = '';
        return;
      }
      if (file.size > maxSizeBytes) {
        const errorMsg = lang === 'de'
          ? `Diese Datei ist zu groß. Dein aktuelles Limit beträgt ${maxSizeMB} MB.`
          : `This file is too large. Your current limit is ${maxSizeMB} MB.`;
        alert(errorMsg);
        e.target.value = '';
        return;
      }
    }

    if (currentActionType === 'direct_file_upload') {
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isMimeAllowed = allowedMimes.includes(file.type);
      const isExtAllowed = allowedExtensions.includes(fileExt);

      const blockedExtensions = ['.exe', '.zip', '.rar', '.js', '.html', '.svg', '.php', '.bat', '.cmd', '.scr'];
      
      if ((!isMimeAllowed && !isExtAllowed) || blockedExtensions.includes(fileExt)) {
        const errorMsg = lang === 'de'
          ? 'Dieser Dateityp ist nicht erlaubt.'
          : 'This file type is not allowed.';
        alert(errorMsg);
        e.target.value = '';
        return;
      }
      if (file.size > maxSizeBytes) {
        const errorMsg = lang === 'de'
          ? `Diese Datei ist zu groß. Dein aktuelles Limit beträgt ${maxSizeMB} MB.`
          : `This file is too large. Your current limit is ${maxSizeMB} MB.`;
        alert(errorMsg);
        e.target.value = '';
        return;
      }
    }

    handleFileActionUpload(e);
  };

  // Dynamically resolve categorized items from BUTTON_CATALOG
  const categoriesList = [
    'contact',
    'cloud',
    'download',
    'media',
    'social'
  ] as const;

  const getCategoryDesc = (catKey: string, lang: 'de' | 'en'): string => {
    const de: Record<string, string> = {
      contact: "Kontaktaufnahme, Anfrage und Rückruf.",
      cloud: "Externe Dateien und Cloud-Ordner verlinken.",
      download: "Mehrere Datei-Links in einem Button sammeln.",
      media: "Videos und Audio-Inhalte öffnen.",
      social: "Social-Media-Profile und Folge-mir-Links bündeln."
    };
    const en: Record<string, string> = {
      contact: "Contact, inquiry and callback actions.",
      cloud: "Link external files and cloud folders.",
      download: "Collect multiple file links in one button.",
      media: "Open videos and audio content.",
      social: "Bundle social media profiles and follow links."
    };
    return lang === 'de' ? de[catKey] || '' : en[catKey] || '';
  };

  const getLivePreviewSummary = (): { title: string; desc: string } => {
    const val = localButton.actionValue || '';
    const isDe = lang === 'de';

    const getPreviewText = () => {
      switch (currentActionType) {
        case 'website':
          return isDe 
            ? `Öffnet extern: ${val || 'https://...'}` 
            : `Opens externally: ${val || 'https://...'}`;
        case 'phone':
          return isDe 
            ? `Startet Anruf: ${val || '+43 ...'}` 
            : `Starts phone call: ${val || '+43 ...'}`;
        case 'email':
          return isDe 
            ? `Öffnet neue E-Mail: ${val || '...'}` 
            : `Opens new email: ${val || '...'}`;
        case 'vcard':
          return isDe 
            ? 'Öffnet Kontaktdaten / vCard-Download.' 
            : 'Downloads contact details vCard.';
        case 'callback_request':
          return isDe 
            ? 'Öffnet ein Rückrufformular.' 
            : 'Launches a callback request form.';
        case 'inquiry_form':
          return isDe 
            ? 'Öffnet ein Anfrageformular.' 
            : 'Launches an inquiry form.';
        case 'contact_form':
          return isDe 
            ? 'Öffnet ein Kontaktformular.' 
            : 'Launches a contact form.';
        case 'external_file_link':
          return isDe 
            ? `Öffnet externe Datei: ${val || 'https://...'}` 
            : `Opens external file: ${val || 'https://...'}`;
        case 'pdf_upload':
          return isDe 
            ? 'Lädt das hinterlegte PDF-Dokument.' 
            : 'Downloads the attached PDF document.';
        case 'dropbox_folder':
          return isDe ? 'Öffnet Dropbox-Ordner.' : 'Opens Dropbox folder.';
        case 'dropbox_file':
          return isDe ? 'Öffnet Dropbox-Datei.' : 'Opens Dropbox file.';
        case 'google_drive_folder':
          return isDe ? 'Öffnet Google-Drive-Ordner.' : 'Opens Google Drive folder.';
        case 'google_drive_file':
          return isDe ? 'Öffnet Google-Drive-Datei.' : 'Opens Google Drive file.';
        case 'onedrive_folder':
          return isDe ? 'Öffnet OneDrive-Ordner.' : 'Opens OneDrive folder.';
        case 'onedrive_file':
          return isDe ? 'Öffnet OneDrive-Datei.' : 'Opens OneDrive file.';
        case 'download_area': {
          const count = localButton.downloadItems?.length || 0;
          if (count === 0) {
            return isDe
              ? 'Download-Bereich: noch keine Links hinterlegt.'
              : 'Download area: no links set yet.';
          } else if (count === 1) {
            return isDe
              ? 'Download-Bereich mit 1 Link.'
              : 'Download area with 1 link.';
          } else if (count >= 2 && count <= 3) {
            return isDe
              ? `Download-Bereich mit ${count} Links.`
              : `Download area with ${count} links.`;
          } else {
            return isDe
              ? `Download-Bereich mit ${count} Links. Ab ureel Pro.`
              : `Download area with ${count} links. From ureel Pro.`;
          }
        }
        case 'youtube_video':
        case 'vimeo_video':
          return isDe 
            ? 'Spielt Video im modalen Popup-Player.' 
            : 'Streams video directly in a modal popup.';
        case 'video_link':
          return isDe 
            ? `Streamt Video per externem Link: ${val || '...'}` 
            : `Streams video via external link: ${val || '...'}`;
        case 'audio_podcast':
          return isDe 
            ? `Öffnet Podcast / Audio-Link: ${val || '...'}` 
            : `Opens audio or podcast link: ${val || '...'}`;
        case 'instagram':
        case 'linkedin':
        case 'tiktok':
        case 'youtube_channel':
        case 'facebook':
          return isDe 
            ? `Öffnet Social-Media-Profil: ${val || '...'}` 
            : `Opens social media profile: ${val || '...'}`;
        case 'social_collection':
          return isDe 
            ? 'Öffnet ein Folge-mir-Modal mit Social Links.' 
            : 'Launches follow overlay list with social nodes.';
        default:
          return isDe ? 'Keine Vorschau verfügbar' : 'No preview available';
      }
    };

    let providerName = '';
    const dProv = detectProvider(val);
    if (dProv === 'dropbox') providerName = 'Dropbox';
    else if (dProv === 'google_drive') providerName = 'Google Drive';
    else if (dProv === 'onedrive') providerName = 'OneDrive';

    let desc = getPreviewText();
    if (providerName && [
      'external_file_link', 'file_link', 'pdf_link', 'dropbox_file', 'dropbox_folder',
      'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder'
    ].includes(currentActionType)) {
      desc += isDe ? ` (Anbieter erkannt: ${providerName})` : ` (Provider detected: ${providerName})`;
    }

    return {
      title: isDe ? 'Aktions-Zusammenfassung (Live-Vorschau)' : 'Action Summary (Live Preview)',
      desc
    };
  };

  const categories = categoriesList.map((catKey) => {
    const matchingButtons = BUTTON_CATALOG.filter((btn) => btn.category === catKey);
    return {
      key: catKey,
      titleDe: getCategoryLabel(catKey, 'de'),
      titleEn: getCategoryLabel(catKey, 'en'),
      types: matchingButtons,
    };
  });

  const allActionTypes = BUTTON_CATALOG;
  const currentActionType = localButton.actionType || 'none';
  const matchedCatalogItem = allActionTypes.find(t => t.actionType === currentActionType) || {
    id: 'none',
    labelDe: 'Keine Funktion',
    labelEn: 'No Action',
    actionType: 'none',
    category: 'security',
    minPlan: 'starter',
    descriptionDe: 'Inaktiver Button ohne Wirkung',
    descriptionEn: 'Inactive placeholder button',
    placeholderDe: 'Keine URL nötig',
    placeholderEn: 'No URL needed',
    lucideIcon: 'Slash'
  };

  // Handle action type selection from modal, checking hierarchic credentials
  const handleActionSelectInModal = (item: CatalogButton) => {
    const requiredPlan = item.minPlan;
    if (isPlanLower(currentPlan, requiredPlan)) {
      // Map limits string to match original feature keys required by UpgradeModal
      let mappedFeature: any = 'gallery';
      if (item.actionType === 'pdf_link' || item.actionType === 'pdf_upload') {
        mappedFeature = 'pdf_upload';
      } else if (item.actionType === 'availability_calendar') {
        mappedFeature = 'availabilityCalendar';
      } else if (item.actionType === 'download_area') {
        mappedFeature = 'downloadArea';
      } else if (
        [
          'external_file_link', 'file_link', 'pdf_link', 'dropbox_file', 'dropbox_folder',
          'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder'
        ].includes(item.actionType)
      ) {
        mappedFeature = 'cloudFolders';
      } else if (requiredPlan === 'pro') {
        mappedFeature = 'fileUpload';
      }
      
      setUpgradeModalFeature(mappedFeature);
      return;
    }

    let defaultVal = '';
    let extraUpdates = {};

    if (item.actionType === 'vcard') {
      defaultVal = '[CONTACT_CARD]';
    } else if (item.actionType === 'konu_gallery') {
      defaultVal = '[GALLERY_COLLECTION]';
    } else if (item.actionType === 'download_area') {
      defaultVal = '[DOWNLOADS]';
      extraUpdates = {
        downloadItems: localButton.downloadItems || []
      };
    } else if (item.actionType === 'social_collection') {
      defaultVal = '[SOCIAL_OVERLAY]';
      extraUpdates = {
        socialCollection: localButton.socialCollection || {
          instagram: '',
          linkedin: '',
          tiktok: '',
          facebook: '',
          youtube: '',
          twitter: '',
          pinterest: '',
          telegram: ''
        }
      };
    } else if (item.actionType === 'opening_hours') {
      defaultVal = '[HOURS]';
      extraUpdates = {
        openingHours: localButton.openingHours || {
          monday: { from: '09:00', to: '17:00', closed: false },
          tuesday: { from: '09:00', to: '17:00', closed: false },
          wednesday: { from: '09:00', to: '17:00', closed: false },
          thursday: { from: '09:00', to: '17:00', closed: false },
          friday: { from: '09:00', to: '17:00', closed: false },
          saturday: { from: '09:00', to: '14:00', closed: true },
          sunday: { from: '09:00', to: '14:00', closed: true },
        }
      };
    } else if (item.actionType === 'availability_calendar') {
      defaultVal = '[AVAILABILITY]';
      extraUpdates = {
        availabilityStatus: localButton.availabilityStatus || 'available',
        availabilityFrom: localButton.availabilityFrom || '',
        availabilityTo: localButton.availabilityTo || '',
        availabilityNote: localButton.availabilityNote || '',
        availabilityBackupContact: localButton.availabilityBackupContact || '',
      };
    } else if (item.actionType === 'location_address') {
      defaultVal = '';
      extraUpdates = {
        locationRouteProvider: localButton.locationRouteProvider || 'both'
      };
    }

    updateButton({ 
      actionType: item.actionType, 
      actionValue: defaultVal, 
      ...extraUpdates 
    });
    setShowSelectorModal(false);
  };

  // Check URL/Provider consistency for link providers
  const inputUrl = localButton.actionValue || '';
  const detectedProv = detectProvider(inputUrl);
  
  const showLinkMismatchWarning = () => {
    if (!inputUrl || inputUrl.startsWith('[') || currentActionType === 'none' || currentActionType === 'vcard') return false;
    
    if (currentActionType === 'dropbox_file' || currentActionType === 'dropbox_folder') {
      return detectedProv !== 'dropbox';
    }
    if (currentActionType === 'google_drive_file' || currentActionType === 'google_drive_folder') {
      return detectedProv !== 'google_drive';
    }
    if (currentActionType === 'onedrive_file' || currentActionType === 'onedrive_folder') {
      return detectedProv !== 'onedrive';
    }
    if (currentActionType === 'youtube_video' || currentActionType === 'youtube_channel') {
      return detectedProv !== 'youtube';
    }
    if (currentActionType === 'vimeo_video') {
      return detectedProv !== 'vimeo';
    }
    return false;
  };

  // Handle Multi-Download Areas
  const downloadItems = localButton.downloadItems || [];
  const handleAddDownloadItem = () => {
    // 1) Pro Check
    if (isPlanLower(currentPlan, 'pro')) {
      setUpgradeModalFeature('downloadArea');
      return;
    }
    // 2) Pro or Business: no limits
    updateButton({
      downloadItems: [...downloadItems, { title: '', url: '' }]
    });
  };

  const handleUpdateDownloadItem = (index: number, key: 'title' | 'url', val: string) => {
    const updated = [...downloadItems];
    updated[index] = { ...updated[index], [key]: val };
    updateButton({ downloadItems: updated });
  };

  const handleRemoveDownloadItem = (index: number) => {
    updateButton({
      downloadItems: downloadItems.filter((_, i) => i !== index)
    });
  };

  // Days mapping order helper
  const DAYS_ORDER = [
    { key: 'monday', de: 'Montag', en: 'Monday' },
    { key: 'tuesday', de: 'Dienstag', en: 'Tuesday' },
    { key: 'wednesday', de: 'Mittwoch', en: 'Wednesday' },
    { key: 'thursday', de: 'Donnerstag', en: 'Thursday' },
    { key: 'friday', de: 'Freitag', en: 'Friday' },
    { key: 'saturday', de: 'Samstag', en: 'Saturday' },
    { key: 'sunday', de: 'Sonntag', en: 'Sunday' },
  ] as const;

  // Resolve Lucide Icon dynamically
  const getLucideIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Globe;
  };

  const CurrentTypeIcon = getLucideIconComponent(matchedCatalogItem.lucideIcon);

  return (
    <div className="space-y-6">
      {/* SECTION 1: FUNKTIONSWAHL */}
      {(!subSection || subSection === 'function_action') && (
        <>
          <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-stone-850 space-y-4">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.Tv size={14} className="text-[#A855F7]" />
          {lang === 'de' ? '1. Funktion & Aktionstyp' : '1. Function & Action Type'}
        </h4>

        {/* Selected action display card with creative styling */}
        <div className="flex items-start gap-3.5 p-4 bg-stone-950 rounded-2xl border border-[#A855F7]/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-16 h-16 bg-[#A855F7]/5 rounded-bl-full pointer-events-none flex items-center justify-center">
            <CurrentTypeIcon size={18} className="text-[#A855F7] opacity-35 transform translate-x-2 -translate-y-2" />
          </div>

          <div className="w-10 h-10 rounded-xl bg-[#A855F7]/10 flex items-center justify-center border border-[#A855F7]/20 text-[#A855F7] shrink-0 mt-0.5">
            <CurrentTypeIcon size={20} />
          </div>

          <div className="flex-grow space-y-0.5">
            <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-widest leading-none">
              {lang === 'de' ? 'Aktiviertes Modul:' : 'Activated Module:'}
            </span>
            <span className="block text-xs text-stone-100 font-black">
              {lang === 'de' ? matchedCatalogItem.labelDe : matchedCatalogItem.labelEn}
            </span>
            <p className="text-[10.5px] text-stone-400 leading-snug">
              {lang === 'de' ? matchedCatalogItem.descriptionDe : matchedCatalogItem.descriptionEn}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSelectorModal(true)}
          className="w-full bg-[#A855F7] hover:bg-[#d9b85c] text-stone-950 font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <LucideIcons.Sparkles size={14} />
          <span>{lang === 'de' ? 'Aktionstyp ändern...' : 'Change Action Type...'}</span>
        </button>

        {/* Live Preview Box */}
        {currentActionType !== 'none' && (
          <div className="mt-3 p-3.5 bg-stone-950 border border-stone-850 rounded-xl space-y-1">
            <span className="text-[9px] uppercase font-black tracking-widest text-[#A855F7] flex items-center gap-1.5">
              <LucideIcons.Eye size={10} className="text-[#A855F7]" />
              {getLivePreviewSummary().title}
            </span>
            <p className="text-xs text-stone-200 mt-1 font-semibold leading-relaxed">
              {getLivePreviewSummary().desc}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: SPEZIFISCHE AKTIONSEINSTELLUNGEN */}
      {currentActionType !== 'none' && (
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-stone-850 space-y-4">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.ArrowRightSquare size={14} className="text-[#A855F7]" />
            {lang === 'de' ? '2. Aktions-Einstellungen' : '2. Action Settings'}
          </h4>

          {/* Mismatch Warning Alert */}
          {showLinkMismatchWarning() && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] sm:text-xs flex items-start gap-2 leading-relaxed animate-fadeIn">
              <LucideIcons.AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#A855F7]" />
              <div>
                <span className="font-extrabold block">
                  {lang === 'de' ? 'Link-Abweichung erkannt' : 'Link Mismatch Detected'}
                </span>
                <span>
                  {lang === 'de'
                    ? `Die URL passt nicht ganz zum ausgewählten Typ (${matchedCatalogItem.labelDe}). Der Link wird dennoch sicher weitergeleitet.`
                    : `The URL does not seem to match the selected type (${matchedCatalogItem.labelEn}). It will still open with secure redirection.`}
                </span>
              </div>
            </div>
          )}

          {/* Cloud link instructions display */}
          {['external_file_link', 'file_link', 'pdf_link', 'dropbox_file', 'dropbox_folder', 'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder'].includes(currentActionType) && (
            <div className="p-3.5 bg-stone-950 border border-stone-850 rounded-xl text-[11px] space-y-1 text-stone-400 leading-normal">
              <div className="flex items-center gap-1.5 text-stone-300 font-bold mb-1">
                <LucideIcons.Info size={12} className="text-[#A855F7]" />
                <span>{lang === 'de' ? 'Cloud-Hinweis' : 'Cloud Guideline'}</span>
              </div>
              <p>
                {lang === 'de'
                  ? '• Der Link muss öffentlich freigegeben sein.'
                  : '• The link must be publicly shared.'}
              </p>
              <p>
                {lang === 'de'
                  ? '• ureel speichert bei Cloud-Links nur den Link, nicht die Datei.'
                  : '• For cloud links, ureel only stores the link, not the file.'}
              </p>
            </div>
          )}

          {/* Standard URL Inputs */}
          {![
            'vcard',
            'konu_gallery',
            'download_area',
            'social_collection',
            'opening_hours',
            'availability_calendar',
            'pdf_upload'
          ].includes(currentActionType) && (
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                {lang === 'de' ? 'Eingabe / Zieladresse' : 'Input / Redirection target'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localButton.actionValue || ''}
                  onChange={(e) => updateButton({ actionValue: e.target.value })}
                  placeholder={lang === 'de' ? matchedCatalogItem.placeholderDe : matchedCatalogItem.placeholderEn}
                  className="flex-grow bg-stone-950 border border-stone-850 rounded-xl px-3.5 py-3 text-xs text-stone-200 focus:outline-[#A855F7]"
                />
                <button
                  type="button"
                  disabled={!localButton.actionValue || !localButton.actionValue.trim() || (() => {
                    const low = (localButton.actionValue || '').trim().toLowerCase();
                    return low.startsWith('javascript:') || low.startsWith('data:') || low.startsWith('vbscript:');
                  })()}
                  onClick={(e) => {
                    const low = (localButton.actionValue || '').trim().toLowerCase();
                    if (low.startsWith('javascript:') || low.startsWith('data:') || low.startsWith('vbscript:')) {
                      e.preventDefault();
                      return;
                    }
                    handleTestLink();
                  }}
                  className="bg-stone-850 hover:bg-[#A855F7] hover:text-stone-950 disabled:bg-stone-900 disabled:text-stone-700 disabled:cursor-not-allowed font-black text-[10px] uppercase tracking-wider px-3.5 py-3 rounded-xl transition cursor-pointer shrink-0"
                >
                  {lang === 'de' ? 'Test öffnen' : 'Open test'}
                </button>
              </div>

              {['external_file_link', 'file_link', 'pdf_link', 'dropbox_file', 'dropbox_folder', 'google_drive_file', 'google_drive_folder', 'onedrive_file', 'onedrive_folder'].includes(currentActionType) && (
                <div className="pt-2 animate-fadeIn">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="mt-0.5 rounded border-stone-800 text-[#A855F7] focus:ring-[#A855F7] bg-stone-950 accent-[#A855F7] shrink-0"
                    />
                    <span className="text-[10px] text-stone-400 font-medium leading-normal">
                      {lang === 'de'
                        ? 'Ich bestätige, dass ich die Rechte an den verlinkten Inhalten habe und der Link öffentlich freigegeben werden darf.'
                        : 'I confirm that I have the rights to the linked content and that the link may be publicly shared.'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Location details */}
          {currentActionType === 'location_address' && (
            <div className="space-y-3.5 pt-1 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Postadresse eingeben' : 'Mailing address'}
                </label>
                <input
                  type="text"
                  value={localButton.actionValue || ''}
                  onChange={(e) => updateButton({ actionValue: e.target.value })}
                  placeholder={lang === 'de' ? 'Musterstraße 12, 10115 Berlin' : '123 Wall St, New York'}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3.5 py-3 text-xs text-stone-200 focus:outline-[#A855F7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Navigations-Hilfe anbieten über' : 'Offer navigation assistance via'}
                </label>
                <select
                  value={localButton.locationRouteProvider || 'both'}
                  onChange={(e) => updateButton({ locationRouteProvider: e.target.value as any })}
                  className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3.5 py-3 text-xs text-stone-200 focus:outline-none"
                >
                  <option value="both">{lang === 'de' ? 'Sowohl Google als auch Apple Maps' : 'Both Google and Apple Maps options'}</option>
                  <option value="google">{lang === 'de' ? 'Nur Google Maps Route' : 'Google Maps Route only'}</option>
                  <option value="apple">{lang === 'de' ? 'Nur Apple Maps Route' : 'Apple Maps Route only'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Direct File Attachment / PDF upload */}
          {(currentActionType === 'pdf_upload' || currentActionType === 'direct_file_upload') && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                {currentActionType === 'pdf_upload'
                  ? (lang === 'de' ? 'PDF-Datei direkt hochladen' : 'Upload PDF file directly')
                  : (lang === 'de' ? 'Datei direkt hochladen' : 'Upload file directly')}
              </label>

              {isBtnFileUploading ? (
                <div className="p-5 rounded-2xl border border-stone-850 bg-stone-950 text-center text-xs text-[#A855F7] animate-pulse flex flex-col items-center justify-center gap-2">
                  <LucideIcons.Loader className="animate-spin text-[#A855F7]" size={18} />
                  <span>
                    {lang === 'de' ? 'Qualitätsprüfung & Datei wird hochgeladen...' : 'Quality checking & uploading file...'}
                  </span>
                </div>
              ) : (
                <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-800 rounded-2xl bg-stone-950 hover:bg-stone-900 transition duration-150 cursor-pointer">
                  <input
                    type="file"
                    accept={
                      currentActionType === 'pdf_upload'
                        ? "application/pdf"
                        : "application/pdf,image/jpeg,image/png,image/webp,text/plain"
                    }
                    onChange={onFileChangeWrapped}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <LucideIcons.UploadCloud className="text-[#A855F7] mb-2" size={24} />
                  <span className="text-[11px] text-stone-300 font-bold block">
                    {localButton.actionValue 
                      ? (lang === 'de' ? 'Datei ersetzen...' : 'Replace file...') 
                      : (lang === 'de' ? 'Klicke zum Auswählen' : 'Click to select file')}
                  </span>
                  <span className="text-[9px] text-stone-500 mt-0.5">
                    {currentActionType === 'pdf_upload'
                      ? (lang === 'de' ? `Nur PDF-Dateien bis zu ${currentPlan === 'business' ? 25 : 10}MB` : `Only PDF files up to ${currentPlan === 'business' ? 25 : 10}MB`)
                      : (lang === 'de' ? `PDF, Bilder (JPG/PNG/WEBP), TXT bis zu ${currentPlan === 'business' ? 25 : 10}MB` : `PDF, Images (JPG/PNG/WEBP), TXT up to ${currentPlan === 'business' ? 25 : 10}MB`)}
                  </span>
                </div>
              )}

              {localButton.actionValue && !localButton.actionValue.startsWith('[') && (
                <div className="space-y-3 bg-stone-950 p-4 rounded-xl border border-stone-850">
                  <div className="flex items-center gap-2 text-stone-200">
                    <LucideIcons.FileText size={16} className="text-[#A855F7] shrink-0" />
                    <div className="min-w-0 flex-grow">
                      <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-widest leading-none">
                        {lang === 'de' ? 'Dateiname / URL:' : 'Filename / URL:'}
                      </span>
                      {(() => {
                        let filename = localButton.uploadedFile?.name;
                        if (!filename) {
                          try {
                            const decodedUrl = decodeURIComponent(localButton.actionValue);
                            const parts = decodedUrl.split('/');
                            const lastPart = parts[parts.length - 1];
                            const namePart = lastPart.split('?')[0];
                            if (namePart) filename = namePart.replace(/^documents%2F|^documents\//, '');
                          } catch (e) {}
                        }
                        return (
                          <span className="block text-xs text-stone-100 font-semibold truncate mt-1">
                            {filename || 'document.pdf'}
                          </span>
                        );
                      })()}

                      {/* Display file size and content type if metadata is available */}
                      {localButton.uploadedFile && (
                        <div className="flex gap-2 mt-1.5 text-[10px] text-stone-400">
                          {localButton.uploadedFile.size !== undefined && (
                            <span>
                              {(localButton.uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          )}
                          {localButton.uploadedFile.size !== undefined && localButton.uploadedFile.contentType && (
                            <span className="text-stone-700">•</span>
                          )}
                          {localButton.uploadedFile.contentType && (
                            <span className="truncate">
                              {localButton.uploadedFile.contentType}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-900">
                    <button
                      type="button"
                      onClick={handleTestLink}
                      className="bg-stone-900 hover:bg-[#A855F7] hover:text-stone-950 border border-stone-800 text-stone-300 font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <LucideIcons.ExternalLink size={12} />
                      <span>{lang === 'de' ? 'Vorschau / Testen' : 'Preview / Test'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateButton({ actionValue: '', uploadedFile: undefined })}
                      className="bg-red-950/20 hover:bg-red-950/45 border border-red-900/25 text-red-400 hover:text-red-350 font-bold text-[10px] uppercase tracking-wider py-2 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <LucideIcons.Trash2 size={12} />
                      <span>{lang === 'de' ? 'Entfernen' : 'Remove'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KONU Gallery upload Direct Images Slider */}
          {currentActionType === 'konu_gallery' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              <div className="bg-stone-950 p-4 border border-stone-850 rounded-2xl text-center space-y-4">
                <LucideIcons.Images className="text-[#A855F7] mx-auto" size={24} />
                <div>
                  <span className="text-xs text-stone-200 font-black uppercase block tracking-wider">
                    {lang === 'de' ? 'Integrierte Bildergalerie' : 'In-App Image Gallery'}
                  </span>
                  <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                    {lang === 'de'
                      ? 'Lade Urlaubs-, Feedback- oder Team-Bilder direkt auf deine ureel-Seite hoch.'
                      : 'Upload feedback sheets, team snaps or illustrations directly.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-stone-800 rounded-2xl bg-stone-900/40 hover:bg-stone-900 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesUpload}
                      disabled={isGalleryUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <LucideIcons.Upload className="text-[#A855F7] mb-1.5" size={20} />
                    <span className="text-[11px] text-stone-300 font-semibold block">
                      {isGalleryUploading
                        ? (lang === 'de' ? 'Upload läuft...' : 'Uploading...')
                        : (lang === 'de' ? 'Fotos hochladen' : 'Choose gallery files')}
                    </span>
                  </div>

                  {galleryError && (
                    <div className="text-left text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                      {galleryError}
                    </div>
                  )}

                  {gallerySuccess && (
                    <div className="text-left text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                      {gallerySuccess}
                    </div>
                  )}
                </div>

                {/* File Strips */}
                {localButton.galleryImages && localButton.galleryImages.length > 0 ? (
                  <div className="space-y-2.5 text-left pt-2 border-t border-stone-850">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-stone-400 font-bold uppercase">
                        {lang === 'de' 
                          ? `${localButton.galleryImages.length} Fotos im Portfolio` 
                          : `${localButton.galleryImages.length} Portfolio snaps`}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateButton({ galleryImages: [] })}
                        className="text-red-400 hover:text-red-350 font-black cursor-pointer"
                      >
                        {lang === 'de' ? 'Galerie leeren' : 'Reset gallery'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {localButton.galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square bg-stone-900 rounded-lg overflow-hidden border border-stone-800">
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover select-none"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(localButton.galleryImages || [])];
                              list.splice(idx, 1);
                              updateButton({ galleryImages: list });
                            }}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 cursor-pointer"
                          >
                            <LucideIcons.Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-500">
                    {lang === 'de' ? 'Noch keine Bilder hochgeladen.' : 'No images uploaded yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MULTI DOWNLOAD ITEMS PANEL */}
          {currentActionType === 'download_area' && (
            <div className="space-y-4 pt-1 animate-fadeIn text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide">
                  {lang === 'de' ? 'Download-Links' : 'Download links'}
                </span>
                <span className="text-[9.5px] text-[#A855F7] font-bold">
                  {lang === 'de' 
                    ? `Kapazität: ${downloadItems.length} Links` 
                    : `Capacity: ${downloadItems.length} Links`}
                </span>
              </div>

              <div className="space-y-3">
                {downloadItems.map((item: any, idx: number) => {
                  const dProv = detectProvider(item.url || '');
                  let providerDe = 'Extern';
                  let providerEn = 'External';
                  if (dProv === 'dropbox') {
                    providerDe = 'Dropbox';
                    providerEn = 'Dropbox';
                  } else if (dProv === 'google_drive') {
                    providerDe = 'Google Drive';
                    providerEn = 'Google Drive';
                  } else if (dProv === 'onedrive') {
                    providerDe = 'OneDrive';
                    providerEn = 'OneDrive';
                  }
                  const providerName = lang === 'de' ? providerDe : providerEn;

                  return (
                    <div key={idx} className="p-3.5 bg-stone-950 border border-stone-850 rounded-xl space-y-2.5 relative">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-stone-500 font-bold block">
                          {lang === 'de' ? 'Titel' : 'Title'}
                        </label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => handleUpdateDownloadItem(idx, 'title', e.target.value)}
                          placeholder={lang === 'de' ? 'z.B.: Produkthandbuch 2026' : 'e.g. User Manual PDF'}
                          className="w-full bg-[#1C1C1E] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-stone-500 font-bold block">
                          URL / Link
                        </label>
                        <input
                          type="text"
                          value={item.url || ''}
                          onChange={(e) => handleUpdateDownloadItem(idx, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-[#1C1C1E] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-bold text-stone-500 pt-1.5 border-t border-stone-900/60">
                        <span>
                          {lang === 'de' 
                            ? `Anbieter erkannt: ${providerName}` 
                            : `Provider detected: ${providerName}`}
                        </span>

                        <div className="flex items-center gap-3">
                          {item.url && (
                            <button
                              type="button"
                              onClick={() => {
                                const lowerUrl = item.url.toLowerCase();
                                let targetUrl = item.url;
                                if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
                                  targetUrl = 'https://' + item.url;
                                }
                                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="text-[#A855F7] hover:text-[#d3b259] flex items-center gap-1 cursor-pointer transition"
                            >
                              <LucideIcons.ExternalLink size={10} />
                              {lang === 'de' ? 'Test öffnen' : 'Open test'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDownloadItem(idx)}
                            className="text-red-400 hover:text-red-350 flex items-center gap-1 cursor-pointer transition"
                            title={lang === 'de' ? 'Link entfernen' : 'Remove link'}
                          >
                            <LucideIcons.Trash2 size={10} />
                            {lang === 'de' ? 'Entfernen' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddDownloadItem}
                className="w-full border border-dashed border-stone-800 bg-stone-950 hover:bg-stone-900 text-[#A855F7] hover:text-[#d3b259] font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LucideIcons.Plus size={13} />
                <span>{lang === 'de' ? 'Datei-Link hinzufügen' : 'Add file link'}</span>
              </button>
            </div>
          )}

          {/* SOCIALS COLLECTION PANEL */}
          {currentActionType === 'social_collection' && (
            <div className="space-y-4 pt-1 animate-fadeIn text-left">
              <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide block">
                {lang === 'de' ? 'Links für Social Overlay hinterlegen' : 'Pasted links for social collections'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
                  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
                  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/channel/...' },
                  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/...' },
                  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/...' },
                  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
                ].map(({ key, label, placeholder }) => {
                  const socials = localButton.socialCollection || {};
                  return (
                    <div key={key} className="space-y-1 bg-stone-950 p-3 rounded-xl border border-stone-850">
                      <label className="text-[9.5px] uppercase text-stone-400 font-black block tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]/70" />
                        {label}
                      </label>
                      <input
                        type="text"
                        value={socials[key] || ''}
                        onChange={(e) => {
                          const nextSocials = { ...socials, [key]: e.target.value };
                          updateButton({ socialCollection: nextSocials });
                        }}
                        placeholder={placeholder}
                        className="w-full bg-[#1C1C1E] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-[#A855F7]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPENING HOURS CONTROL PANEL */}
          {currentActionType === 'opening_hours' && (
            <div className="space-y-4 pt-1 animate-fadeIn text-left">
              <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide block">
                {lang === 'de' ? 'Öffnungszeiten festlegen' : 'Configure opening hours intervals'}
              </span>

              <div className="space-y-2 bg-stone-950 p-4 rounded-2xl border border-stone-850">
                {DAYS_ORDER.map(({ key, de, en }) => {
                  const hoursObj = localButton.openingHours || {};
                  const entry = hoursObj[key] || { from: '09:00', to: '17:00', closed: false };

                  const toggleClosed = () => {
                    const nextObj = { ...hoursObj };
                    nextObj[key] = { ...entry, closed: !entry.closed };
                    updateButton({ openingHours: nextObj });
                  };

                  const updateField = (f: 'from' | 'to', val: string) => {
                    const nextObj = { ...hoursObj };
                    nextObj[key] = { ...entry, [f]: val };
                    updateButton({ openingHours: nextObj });
                  };

                  return (
                    <div key={key} className="flex flex-wrap items-center justify-between border-b border-stone-900 pb-2 last:border-b-0 last:pb-0 pt-2 first:pt-0 gap-2">
                      <span className="text-xs text-stone-200 font-extrabold w-24">
                        {lang === 'de' ? de : en}
                      </span>

                      <div className="flex items-center gap-3">
                        {!entry.closed ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={entry.from || ''}
                              onChange={(e) => updateField('from', e.target.value)}
                              placeholder="09:00"
                              className="w-14 bg-[#1C1C1E] border border-stone-800 text-stone-300 text-xs px-1.5 py-1 rounded text-center font-mono focus:outline-none focus:border-[#A855F7]"
                            />
                            <span className="text-stone-500 text-xs">-</span>
                            <input
                              type="text"
                              value={entry.to || ''}
                              onChange={(e) => updateField('to', e.target.value)}
                              placeholder="17:00"
                              className="w-14 bg-[#1C1C1E] border border-stone-800 text-stone-300 text-xs px-1.5 py-1 rounded text-center font-mono focus:outline-none focus:border-[#A855F7]"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black py-1">
                            {lang === 'de' ? 'Geschlossen' : 'Closed'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={toggleClosed}
                          className={`text-[9px] uppercase font-black px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                            entry.closed 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                          }`}
                        >
                          {entry.closed 
                            ? (lang === 'de' ? 'Öffnen' : 'Open') 
                            : (lang === 'de' ? 'Schließen' : 'Close')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REALTIME AVAILABILITY CALENDAR */}
          {currentActionType === 'availability_calendar' && (
            <div className="space-y-4 text-left animate-fadeIn">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Status' : 'Availability Status'}
                </label>
                <div className="relative">
                  <select
                    value={localButton.availabilityStatus || 'available'}
                    onChange={(e) => updateButton({ availabilityStatus: e.target.value as any })}
                    className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200 focus:outline-none focus:border-[#A855F7] appearance-none"
                  >
                    <option value="available">{lang === 'de' ? 'Ausgezeichnet erreichbar (Verfügbar)' : 'Excellent availability (Available)'}</option>
                    <option value="vacation">{lang === 'de' ? 'Betriebsurlaub' : 'On annual vacation'}</option>
                    <option value="unavailable">{lang === 'de' ? 'Temporär verhindert (Busy)' : 'Temporarily blocked (Busy)'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {lang === 'de' ? 'Gültig ab (optional)' : 'Active From (optional)'}
                  </label>
                  <input
                    type="text"
                    value={localButton.availabilityFrom || ''}
                    onChange={(e) => updateButton({ availabilityFrom: e.target.value })}
                    placeholder="e.g. 01.07.2026"
                    className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {lang === 'de' ? 'Gültig bis (optional)' : 'Active Until (optional)'}
                  </label>
                  <input
                    type="text"
                    value={localButton.availabilityTo || ''}
                    onChange={(e) => updateButton({ availabilityTo: e.target.value })}
                    placeholder="e.g. 15.07.2026"
                    className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Abwesenheits-Notiz' : 'Vacation notice description'}
                </label>
                <textarea
                  value={localButton.availabilityNote || ''}
                  onChange={(e) => updateButton({ availabilityNote: e.target.value })}
                  placeholder={lang === 'de' ? 'z.B.: Ich befinde mich im Sommerurlaub.' : 'e.g., Currently away on summer wellness leave.'}
                  rows={2}
                  className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Vertretung / Mail für dringliche Anfragen' : 'Backup Contact phone/email'}
                </label>
                <input
                  type="text"
                  value={localButton.availabilityBackupContact || ''}
                  onChange={(e) => updateButton({ availabilityBackupContact: e.target.value })}
                  placeholder="e.g. support@firma.de"
                  className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200"
                />
              </div>
            </div>
          )}

          {/* EMAIL FORM TYPE FIELDS MOCK PREVIEWS */}
          {[
            'callback_request',
            'inquiry_form',
            'contact_form',
            'appointment_request'
          ].includes(currentActionType) && (
            <div className="space-y-3.5 text-left animate-fadeIn">
              {['callback_request', 'inquiry_form', 'contact_form'].includes(currentActionType) ? (
                /* COMPACT FORM CONFIGURATION AREA */
                <div id="form-config-box" className="space-y-3 bg-[#131315] p-4 rounded-2xl border border-stone-850">
                  <span className="block text-[10px] uppercase font-black text-[#A855F7] tracking-wider mb-1">
                    ⚙️ {lang === 'de' ? 'Formular-Konfiguration' : 'Form Configuration'}
                  </span>
                  
                  {/* Ziel-E-Mail */}
                  <div className="space-y-1">
                    <label htmlFor="form-target-email-input" className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">
                      {lang === 'de' ? 'Ziel-E-Mail (Empfänger)' : 'Target Email (Recipient)'}
                    </label>
                    <input
                      id="form-target-email-input"
                      type="text"
                      value={localButton.actionValue || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (currentActionType === 'callback_request') {
                          updateButton({
                            actionValue: val,
                            callbackConfig: {
                              ...(localButton.callbackConfig || {}),
                              targetEmail: val
                            }
                          });
                        } else {
                          updateButton({
                            actionValue: val,
                            formConfig: {
                              ...(localButton.formConfig || {}),
                              targetEmail: val
                            }
                          });
                        }
                      }}
                      placeholder="name@company.com"
                      className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                    <p className="text-[9.5px] text-stone-500 leading-normal">
                      {lang === 'de' 
                        ? 'Wenn keine Ziel-E-Mail eingetragen ist, wird die E-Mail der Karte verwendet.' 
                        : 'If no target email is entered, the card email will be used.'}
                    </p>
                  </div>

                  {/* Betreff */}
                  <div className="space-y-1">
                    <label htmlFor="form-subject-input" className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">
                      {lang === 'de' ? 'Betreff' : 'Subject'}
                    </label>
                    <input
                      id="form-subject-input"
                      type="text"
                      value={
                        currentActionType === 'callback_request'
                          ? (localButton.callbackConfig?.subject || '')
                          : (localButton.formConfig?.subject || '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (currentActionType === 'callback_request') {
                          updateButton({
                            callbackConfig: {
                              ...(localButton.callbackConfig || {}),
                              subject: val
                            }
                          });
                        } else {
                          updateButton({
                            formConfig: {
                              ...(localButton.formConfig || {}),
                              subject: val
                            }
                          });
                        }
                      }}
                      placeholder={
                        currentActionType === 'callback_request'
                          ? (lang === 'de' ? 'Rückrufanfrage über ureel' : 'Callback request via ureel')
                          : currentActionType === 'inquiry_form'
                          ? (lang === 'de' ? 'Anfrage über ureel' : 'Inquiry via ureel')
                          : (lang === 'de' ? 'Kontakt über ureel' : 'Contact via ureel')
                      }
                      className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                  </div>

                  {/* Hinweistext */}
                  <div className="space-y-1">
                    <label htmlFor="form-intro-input" className="block text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">
                      {lang === 'de' ? 'Hinweistext / kurzer Formulartext' : 'Intro Text / Form Context'}
                    </label>
                    <textarea
                      id="form-intro-input"
                      value={
                        currentActionType === 'callback_request'
                          ? (localButton.callbackConfig?.introText || '')
                          : (localButton.formConfig?.introText || '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (currentActionType === 'callback_request') {
                          updateButton({
                            callbackConfig: {
                              ...(localButton.callbackConfig || {}),
                              introText: val
                            }
                          });
                        } else {
                          updateButton({
                            formConfig: {
                              ...(localButton.formConfig || {}),
                              introText: val
                            }
                          });
                        }
                      }}
                      placeholder={
                        currentActionType === 'callback_request'
                          ? (lang === 'de' ? 'Hinterlasse deine Telefonnummer für einen Rückruf.' : 'Leave your phone number for a callback.')
                          : currentActionType === 'inquiry_form'
                          ? (lang === 'de' ? 'Sende eine konkrete Anfrage.' : 'Send a specific inquiry.')
                          : (lang === 'de' ? 'Sende eine kurze Nachricht.' : 'Send a short message.')
                      }
                      rows={2}
                      className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7] resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {lang === 'de' ? 'E-Mail Empfängeradresse' : 'Recipient Email Address'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localButton.actionValue || ''}
                      onChange={(e) => updateButton({ actionValue: e.target.value })}
                      placeholder="name@firma.de"
                      className="flex-grow bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-3 text-xs text-stone-200 focus:outline-[#A855F7]"
                    />
                    <button
                      type="button"
                      onClick={handleTestLink}
                      className="bg-stone-850 hover:bg-[#A855F7] hover:text-stone-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-3 rounded-xl transition cursor-pointer"
                    >
                      {lang === 'de' ? 'Testen' : 'Test'}
                    </button>
                  </div>
                </div>
              )}

              {/* Form Live Preview box styled gracefully */}
              <div id="form-live-preview-box" className="p-4 bg-stone-950 rounded-2xl border border-stone-850 space-y-3">
                <span className="block text-[9px] uppercase font-black text-[#A855F7] tracking-widest leading-none">
                  🔍 {lang === 'de' ? 'Live-Vorschau des Formulars (für Besucher)' : 'Live Preview of visitor fields'}
                </span>

                {/* Subtext describing visitor capabilities based on currentActionType */}
                <span className="block text-[9.5px] text-stone-400 italic font-medium leading-relaxed">
                  {currentActionType === 'contact_form' && (
                    lang === 'de' 
                      ? 'Besucher können Name, E-Mail und Nachricht eingeben.' 
                      : 'Visitors can enter name, email and message.'
                  )}
                  {currentActionType === 'inquiry_form' && (
                    lang === 'de' 
                      ? 'Besucher können eine konkrete Anfrage vorbereiten.' 
                      : 'Visitors can prepare a specific inquiry.'
                  )}
                  {currentActionType === 'callback_request' && (
                    lang === 'de' 
                      ? 'Besucher können einen Rückruf per E-Mail anfragen.' 
                      : 'Visitors can request a callback by email.'
                  )}
                </span>

                <div className="space-y-2 pt-1 font-sans">
                  {currentActionType === 'callback_request' && (
                    <>
                      <input type="text" disabled placeholder={lang === 'de' ? 'Dein Name / Firma' : 'Your name / Business'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'Telefonnummer für den Rückruf' : 'Phone number for callback'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                    </>
                  )}

                  {currentActionType === 'inquiry_form' && (
                    <>
                      <input type="text" disabled placeholder={lang === 'de' ? 'Vollständiger Name' : 'Full Name'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'E-Mail-Adresse' : 'Email address'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'Betreff der Anfrage' : 'Inquiry subject'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <textarea disabled placeholder={lang === 'de' ? 'Wie können wir dir helfen?' : 'How can we help?'} rows={2} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55 resize-none" />
                    </>
                  )}

                  {currentActionType === 'contact_form' && (
                    <>
                      <input type="text" disabled placeholder={lang === 'de' ? 'Dein Name' : 'Your Name'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'Deine E-Mail-Adresse' : 'Your email address'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <textarea disabled placeholder={lang === 'de' ? 'Deine Nachricht an uns...' : 'Your message...'} rows={2} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55 resize-none" />
                    </>
                  )}

                  {currentActionType === 'appointment_request' && (
                    <>
                      <input type="text" disabled placeholder={lang === 'de' ? 'Ansprechpartner' : 'Contact Person'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'Telefonnummer' : 'Phone Number'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <input type="text" disabled placeholder={lang === 'de' ? 'Gewünschtes Datum & Uhrzeit' : 'Preferred Date & Time'} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55" />
                      <textarea disabled placeholder={lang === 'de' ? 'Ergänzende Angaben / Anliegen...' : 'Additional details...'} rows={2} className="w-full bg-[#1C1C1E] border border-stone-800 text-[10.5px] px-3 py-2 rounded-lg cursor-not-allowed opacity-55 resize-none" />
                    </>
                  )}

                  <button type="button" disabled className="w-full bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] font-bold text-[10px] py-2 px-3 rounded-xl uppercase tracking-widest cursor-not-allowed opacity-70">
                    {lang === 'de' ? 'E-Mail Entwurf generieren' : 'Generate email drafts'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
        </>
      )}

      {/* SECTION 3: PASSWORTSCHRANKE */}
      {(!subSection || subSection === 'function_password') && (() => {
        const isPasswordLocked = !canUseFeature(currentPlan, 'passwordProtectedButtons');
        
        return (
          <div 
            className={`bg-[#1C1C1E] p-5 rounded-2xl border border-stone-850 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1 pr-4">
                <h5 className="font-extrabold text-[#F5F0E6] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.Lock size={13} className="text-[#A855F7]" />
                  <span>{lang === 'de' ? 'Passwortschutz' : 'Password protection'}</span>
                  {isPasswordLocked && <span className="text-amber-500 text-[10px] uppercase font-bold">🔒 (ab PRO)</span>}
                </h5>
                <p className="text-[10px] text-stone-400 leading-normal">
                  {lang === 'de' 
                    ? 'Besucher müssen dieses Passwort eingeben, bevor sie die Button-Funktion öffnen können.' 
                    : 'Visitors must enter this password before they can open the button action.'}
                </p>

                {isPasswordLocked ? (
                  // Locked indicator for Starter/Fun
                  <div className="mt-3">
                    {currentPlan === 'starter' ? (
                      <button
                        type="button"
                        onClick={() => setUpgradeModalFeature('passwordProtectedButtons')}
                        className="cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 shadow-md border-0"
                      >
                        <span>{lang === 'de' ? 'Auf Pro upgraden' : 'Upgrade to Pro'}</span>
                        <LucideIcons.ArrowRight size={10} className="stroke-[2.5]" />
                      </button>
                    ) : (
                      <span className="text-stone-500 font-bold text-[9px] uppercase tracking-wider bg-stone-950 px-2 py-1 rounded border border-stone-900 leading-none">
                        {lang === 'de' ? 'Für Fun-Tarif nicht verfügbar' : 'Not available for Fun Plan'}
                      </span>
                    )}
                  </div>
                ) : (
                  // Active interactive toggle checkboxes for Pro / Business
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="enable-password-protection"
                      checked={btnProtected}
                      onChange={(e) => {
                        setBtnProtected(e.target.checked);
                      }}
                      className="w-4 h-4 accent-[#A855F7] cursor-pointer"
                    />
                    <label htmlFor="enable-password-protection" className="text-[10.5px] text-stone-200 font-bold cursor-pointer select-none">
                      {lang === 'de' ? 'Button mit Passwort schützen' : 'Protect button with password'}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {btnProtected && !isPasswordLocked && (
              <div className="space-y-4 p-4 bg-stone-950 border border-stone-850 rounded-xl animate-fadeIn">
                
                {/* Security Advice Alert block */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-[#A855F7]/20 flex items-start gap-2">
                  <LucideIcons.AlertTriangle size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-250 leading-relaxed font-medium">
                    {lang === 'de'
                      ? 'Das Ziel dieses Buttons wird erst nach korrekter Passwortprüfung freigegeben.'
                      : 'The target of this button is only released after successful password verification.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Passwort */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
                      {lang === 'de' ? 'Passwort' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={btnPassword}
                      onChange={(e) => setBtnPassword(e.target.value)}
                      placeholder={lang === 'de' ? 'Passwort' : 'Password'}
                      className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7] font-mono tracking-wider"
                    />
                    {btnPassword === '••••••••' && (
                      <p className="text-[9px] text-stone-450 italic leading-snug pt-0.5">
                        {lang === 'de' 
                          ? 'Passwort bleibt unverändert, wenn du kein neues eingibst.' 
                          : 'Password stays unchanged if you do not enter a new one.'}
                      </p>
                    )}
                  </div>

                  {/* Field 2: Passwort wiederholen */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
                      {lang === 'de' ? 'Passwort wiederholen' : 'Repeat password'}
                    </label>
                    <input
                      type="password"
                      value={btnRepeatPassword}
                      onChange={(e) => setBtnRepeatPassword(e.target.value)}
                      placeholder={lang === 'de' ? 'Passwort wiederholen' : 'Repeat password'}
                      className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7] font-mono tracking-wider"
                    />
                  </div>
                </div>

                {/* Field 3: Passwort-Hinweis */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
                    {lang === 'de' ? 'Passworthinweis' : 'Password hint'}
                  </label>
                  <input
                    type="text"
                    value={btnPasswordHint}
                    onChange={(e) => setBtnPasswordHint(e.target.value)}
                    placeholder={lang === 'de' ? 'z.B.: Gründungsjahr' : 'e.g., Company founding year'}
                    className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
                  />
                </div>

              </div>
            )}
          </div>
        );
      })()}

      {/* OVERLAY SELECTOR MODAL - HIGHLY CATEGORIZED BENTO GRID */}
      {showSelectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative mx-auto max-w-[640px] w-full max-h-[85vh] overflow-y-auto rounded-3xl border border-stone-850 bg-[#121212] shadow-2xl p-6 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.Tv size={15} className="text-[#A855F7]" />
                  {lang === 'de' ? 'Aktionstyp wählen (Kategorien)' : 'Select Action Type (Categories)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectorModal(false)}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <LucideIcons.X size={14} />
              </button>
            </div>

            {/* Scrolling Bento Content */}
            <div className="space-y-6 flex-grow overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-2.5">
                  <div className="border-b border-stone-850 pb-1.5 flex flex-col">
                    <span className="text-[11px] font-black text-[#A855F7] uppercase tracking-widest block">
                      {lang === 'de' ? cat.titleDe : cat.titleEn}
                    </span>
                    <span className="text-[10px] text-stone-500 italic mt-0.5">
                      {getCategoryDesc(cat.key, lang)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.types.map((t) => {
                      const Icon = getLucideIconComponent(t.lucideIcon);
                      const isSelected = currentActionType === t.actionType;
                      const isItemLocked = isPlanLower(currentPlan, t.minPlan);

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleActionSelectInModal(t)}
                          className={`flex items-start p-3 rounded-xl border transition text-left gap-3.5 cursor-pointer hover:bg-stone-900 relative ${
                            isSelected 
                              ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7]' 
                              : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                          )}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${
                            isSelected 
                              ? 'bg-[#A855F7]/20 border-[#A855F7]/40 text-[#A855F7]' 
                              : 'bg-stone-900 border-stone-800 text-stone-400'
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 pr-1 flex-grow space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-stone-200 leading-tight">
                                {lang === 'de' ? t.labelDe : t.labelEn}
                              </span>
                              {isItemLocked && (
                                <span className="bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                  <LucideIcons.Lock size={8} />
                                  <span>
                                    {lang === 'de'
                                      ? `Ab ureel ${t.minPlan.charAt(0).toUpperCase() + t.minPlan.slice(1)}`
                                      : `From ureel ${t.minPlan.charAt(0).toUpperCase() + t.minPlan.slice(1)}`}
                                  </span>
                                </span>
                              )}
                            </div>
                            <span className="block text-[9.5px] text-stone-500 leading-normal font-medium">
                              {lang === 'de' ? t.descriptionDe : t.descriptionEn}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Reset Option: No Action */}
              <div className="pt-3 border-t border-stone-850 space-y-2">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">
                  {lang === 'de' ? 'Weitere Optionen' : 'Other options'}
                </span>
                <button
                  type="button"
                  onClick={() => handleActionSelectInModal({
                    id: "none",
                    labelDe: "Keine Funktion (Inaktiver Button / Label)",
                    labelEn: "No Action (Inactive Button / Text Label)",
                    category: "security",
                    minPlan: "starter",
                    descriptionDe: "Nutzbar als beschreibendes Infofeld, Trenner oder Spruch.",
                    descriptionEn: "Acts as a pure informative text banner, label or spacer.",
                    actionType: "none",
                    placeholderDe: "",
                    placeholderEn: "",
                    lucideIcon: "Type"
                  })}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left gap-3.5 cursor-pointer hover:bg-stone-900 ${
                    currentActionType === 'none'
                      ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7]'
                      : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-[#A855F7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LucideIcons.Type size={14} className={currentActionType === 'none' ? 'text-[#A855F7]' : 'text-stone-500'} />
                    <div>
                      <span className="block text-xs font-bold text-stone-200 leading-tight">
                        {lang === 'de' ? 'Keine Funktion (Inaktiver Button / Label)' : 'No Action (Inactive Button / Text Label)'}
                      </span>
                      <span className="block text-[9px] text-stone-500 leading-none mt-1">
                        {lang === 'de' ? 'Nutzbar als beschreibendes Infofeld, Trenner oder Spruch.' : 'Acts as a pure informative text banner, label or spacer.'}
                      </span>
                    </div>
                  </div>
                  {currentActionType === 'none' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {upgradeModalFeature && (
        <UpgradeModal
          isOpen={!!upgradeModalFeature}
          onClose={() => setUpgradeModalFeature('')}
          lang={lang}
          featureKey={upgradeModalFeature}
        />
      )}

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-[999] bg-stone-900 border border-stone-800 text-[#A855F7] font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-1.5 animate-fadeIn max-w-sm">
          <LucideIcons.AlertCircle size={14} className="shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
