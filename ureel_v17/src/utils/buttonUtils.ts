import { Card, CardButton, ButtonGridLayout } from '../types';
import { downloadVCardFileFromCard } from './vcard-wrapper';

/**
 * Normalizes a raw button object supporting both legacy fields and new unified fields.
 */
export function normalizeButton(rawButton: any): CardButton {
  const normRaw = rawButton || createDefaultButton();
  return normalizeButtonWithRaw(normRaw);
}

function normalizeButtonWithRaw(rawButton: any): CardButton {
  // Backup mapping from raw legacy properties
  const actionType = rawButton.actionType || rawButton.type || 'none';
  const actionValue = rawButton.actionValue || rawButton.url || '';
  const imageUrl = rawButton.imageUrl || rawButton.image || '';
  const bgColor = rawButton.bgColor || rawButton.backgroundColor || '#1A1A1A';
  
  // Checks if an icon exists
  const hasIcon = !!(rawButton.icon || rawButton.iconId);
  const icon = rawButton.icon || rawButton.iconId || 'Globe';

  // Normalize iconEnabled: true if has icon and not explicitly false, false if no icon
  const iconEnabled = rawButton.iconEnabled !== undefined 
    ? !!rawButton.iconEnabled 
    : hasIcon;

  const imageDarken = rawButton.imageDarken !== undefined 
    ? Number(rawButton.imageDarken) 
    : (rawButton.imageOverlay !== undefined 
      ? Number(rawButton.imageOverlay) 
      : (rawButton.overlay !== undefined ? Number(rawButton.overlay) : 0));

  const imageSaturation = rawButton.imageSaturation !== undefined 
    ? Number(rawButton.imageSaturation) 
    : 100;

  // Normalize iconPosition
  let iconPosition = rawButton.iconPosition || 'left';
  if (!['left', 'right', 'top', 'bottom', 'center', 'background'].includes(iconPosition)) {
    iconPosition = 'left';
  }

  return {
    ...rawButton,
    id: rawButton.id || Math.random().toString(36).substring(2, 11),
    title: rawButton.title || '',
    actionType,
    actionValue,
    icon,
    iconId: icon, // Backwards compatibility for templates accessing dynamic Lucide components via IconId
    bgColor,
    backgroundColor: bgColor, // Backwards compatibility
    textColor: rawButton.textColor || '#F5EFE3',
    borderColor: rawButton.borderColor || '',
    styleVariant: rawButton.styleVariant || 'filled',
    radius: rawButton.radius || 'rounded',
    animation: 'none', // All animations disabled as requested
    imageUrl,
    imageMode: rawButton.imageMode || 'cover',
    imageOverlay: imageDarken, // keep synced and map imageDarken to imageOverlay
    imageDarken,
    imageSaturation,
    imagePosition: rawButton.imagePosition || 'center',
    
    borderEnabled: rawButton.borderEnabled !== undefined ? !!rawButton.borderEnabled : (rawButton.borderWidth && rawButton.borderWidth !== 'none' ? true : false),
    borderWidth: rawButton.borderWidth || 'none',
    borderStyle: rawButton.borderStyle || 'solid',

    shadow: rawButton.shadow || 'none',
    shadowColor: rawButton.shadowColor || 'rgba(0,0,0,0.15)',
    glow: rawButton.glow || 'none',

    iconColor: rawButton.iconColor || rawButton.textColor || '#F5EFE3',
    iconSize: typeof rawButton.iconSize === 'number' ? rawButton.iconSize : 28,
    iconPosition,
    iconOffsetX: typeof rawButton.iconOffsetX === 'number' ? rawButton.iconOffsetX : 0,
    iconOffsetY: typeof rawButton.iconOffsetY === 'number' ? rawButton.iconOffsetY : 0,
    iconEnabled,

    gradient: rawButton.gradient || '',
    opacity: typeof rawButton.opacity === 'number' ? rawButton.opacity : 100,

    fontFamily: rawButton.fontFamily || 'Inter',
    fontSize: typeof rawButton.fontSize === 'number' ? rawButton.fontSize : 13,
    fontWeight: rawButton.fontWeight || 'medium',
    letterSpacing: typeof rawButton.letterSpacing === 'number' ? rawButton.letterSpacing : 0,
    textAlign: rawButton.textAlign || 'center',
    textPosition: rawButton.textPosition || 'center',
    textPadding: typeof rawButton.textPadding === 'number' ? rawButton.textPadding : 8,
    textShadow: rawButton.textShadow || 'none',
    textWrap: rawButton.textWrap || 'single',

    isProtected: !!rawButton.isProtected || !!rawButton.passwordProtected,
    passwordProtected: rawButton.passwordProtected !== undefined ? !!rawButton.passwordProtected : !!rawButton.isProtected,
    passwordHash: rawButton.passwordHash || '',
    passwordHint: rawButton.passwordHint || '',
    buttonPassword: rawButton.buttonPassword || '',
    password: rawButton.password || '', // Backwards compatibility
    position: typeof rawButton.position === 'number' ? rawButton.position : 0,
    isActive: rawButton.isActive !== false,

    bgMode: rawButton.bgMode || 'solid',
    gradientColor: rawButton.gradientColor || '#A855F7',
    gradientDirection: rawButton.gradientDirection || 'to-bottom',
    textOffsetX: typeof rawButton.textOffsetX === 'number' ? rawButton.textOffsetX : 0,
    textOffsetY: typeof rawButton.textOffsetY === 'number' ? rawButton.textOffsetY : 0,
    textFineTuneEnabled: rawButton.textFineTuneEnabled !== undefined
      ? !!rawButton.textFineTuneEnabled
      : ((typeof rawButton.textOffsetX === 'number' && rawButton.textOffsetX !== 0) || (typeof rawButton.textOffsetY === 'number' && rawButton.textOffsetY !== 0)),
    galleryImages: Array.isArray(rawButton.galleryImages)
      ? rawButton.galleryImages
      : (Array.isArray(rawButton.galleryUrls)
        ? rawButton.galleryUrls.map((url: any) => typeof url === 'string' ? { url } : url)
        : []),
    galleryDropboxUrl: rawButton.galleryDropboxUrl || '',
    buttonShape: rawButton.buttonShape || 'classic',
    downloadItems: Array.isArray(rawButton.downloadItems) ? rawButton.downloadItems : [],
    uploadedFile: rawButton.uploadedFile || undefined,
    socialCollection: rawButton.socialCollection || null,
    openingHours: rawButton.openingHours || null,
    availabilityStatus: rawButton.availabilityStatus || 'available',
    availabilityFrom: rawButton.availabilityFrom || '',
    availabilityTo: rawButton.availabilityTo || '',
    availabilityNote: rawButton.availabilityNote || '',
    availabilityBackupContact: rawButton.availabilityBackupContact || '',
    locationRouteProvider: rawButton.locationRouteProvider || 'both',
    formConfig: rawButton.formConfig || undefined,
    callbackConfig: rawButton.callbackConfig || undefined,
    buttonImageUrl: rawButton.buttonImageUrl || '',
    buttonImageFit: rawButton.buttonImageFit || 'cover',
    buttonImageOverlay: rawButton.buttonImageOverlay !== undefined ? !!rawButton.buttonImageOverlay : false,
  };
}

/**
 * Normalizes an array of raw button inputs, sorting them by position ascending.
 */
export function normalizeButtons(rawButtons: any[]): CardButton[] {
  if (!Array.isArray(rawButtons)) return [];
  return sortButtons(
    rawButtons
      .filter(Boolean)
      .map(normalizeButton)
  );
}

/**
 * Creates a default standard button.
 */
export function createDefaultButton(partial?: Partial<CardButton>, totalButtons: number = 0): CardButton {
  const id = partial?.id || Math.random().toString(36).substring(2, 11);
  const baseDefault = {
    id,
    title: '',
    actionType: 'none',
    actionValue: '',
    bgColor: '#F5EFE3',
    textColor: '#111111',
    borderColor: '#A855F7',
    borderWidth: 1,
    borderEnabled: true,
    styleVariant: 'filled',
    radius: 'rounded',
    animation: 'none',
    position: partial?.position ?? totalButtons,
    isActive: true,
    icon: 'Globe',
    iconId: 'Globe',
    iconColor: '#111111',
    iconSize: 28,
    iconPosition: 'left',
    iconOffsetX: 0,
    iconOffsetY: 0,
    iconEnabled: false,
    imageMode: 'cover',
    imagePosition: 'center',
    imageOverlay: 0,
    imageDarken: 0,
    imageSaturation: 100,
    borderStyle: 'solid',
    shadow: 'none',
    glow: 'none',
    opacity: 100,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: 'medium',
    letterSpacing: 0,
    textAlign: 'center',
    textPosition: 'center',
    textPadding: 8,
    textShadow: 'none',
    textWrap: 'single',
    backgroundColor: '#F5EFE3',
    bgMode: 'solid',
    gradientColor: '#A855F7',
    gradientDirection: 'to-bottom',
    textOffsetX: 0,
    textOffsetY: 0,
    buttonShape: 'classic',
    isProtected: false,
    passwordProtected: false,
    passwordHash: '',
    passwordHint: '',
    buttonPassword: '',
    password: '',
    galleryImages: [],
    downloadItems: [],
    uploadedFile: undefined,
    socialCollection: null,
    openingHours: null,
    availabilityStatus: 'available',
    availabilityFrom: '',
    availabilityTo: '',
    availabilityNote: '',
    availabilityBackupContact: '',
    locationRouteProvider: 'both',
    ...partial,
  };
  return normalizeButtonWithRaw(baseDefault);
}

/**
 * Validates a button before saving/processing.
 */
export function validateButton(button: CardButton, lang: 'de' | 'en' = 'de'): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const b = normalizeButton(button);
  const actValue = b.actionValue.trim();

  // No required title!

  if (b.actionType === 'none') {
    // none action is always valid with or without actionValue
  } else if (b.isProtected && actValue === '[LOCKED]') {
    // Already locked / encrypted buttons bypass standard type specific format validation
  } else {
    // Validate depending on selected type
    if (b.actionType === 'download_area') {
      const items = b.downloadItems || [];
      const nonZeroItems = items.filter(it => (it.title || '').trim() !== '' || (it.url || '').trim() !== '');
      if (nonZeroItems.length === 0) {
        errors.push(lang === 'de' ? 'Bitte füge mindestens einen Download-Link hinzu.' : 'Please add at least one download link.');
      } else {
        nonZeroItems.forEach((item) => {
          const t = (item.title || '').trim();
          const u = (item.url || '').trim();
          if (!t) {
            errors.push(lang === 'de' ? 'Bitte gib einen Titel ein.' : 'Please enter a title.');
          }
          if (!u) {
            errors.push(lang === 'de' ? 'Bitte füge einen Link ein.' : 'Please add a link.');
          } else {
            const sanitized = sanitizeExternalUrl(u);
            const lowerSan = sanitized.toLowerCase();
            const isHttpOrHttps = lowerSan.startsWith('http://') || lowerSan.startsWith('https://');
            if (sanitized === '#' || !isHttpOrHttps) {
              errors.push(lang === 'de' ? 'Dieser Link ist nicht sicher oder nicht gültig.' : 'This link is not safe or not valid.');
            }
          }
        });
      }
    } else if (
      b.actionType === 'external_file_link' ||
      b.actionType === 'file_link' ||
      b.actionType === 'pdf_link' ||
      b.actionType === 'dropbox_file' ||
      b.actionType === 'dropbox_folder' ||
      b.actionType === 'google_drive_file' ||
      b.actionType === 'google_drive_folder' ||
      b.actionType === 'onedrive_file' ||
      b.actionType === 'onedrive_folder'
    ) {
      if (!actValue) {
        errors.push(lang === 'de' ? 'Bitte füge einen Link ein.' : 'Please add a link.');
      } else {
        const sanitized = sanitizeExternalUrl(actValue);
        const lowerSan = sanitized.toLowerCase();
        const isHttpOrHttps = lowerSan.startsWith('http://') || lowerSan.startsWith('https://');
        if (sanitized === '#' || !isHttpOrHttps) {
          errors.push(lang === 'de' ? 'Dieser Link ist nicht sicher oder nicht gültig.' : 'This link is not safe or not valid.');
        }
      }
    } else if (
      b.actionType === 'website' || 
      b.actionType === 'external_url' || 
      b.actionType === 'custom_url' ||
      b.actionType === 'external_gallery' ||
      b.actionType === 'audio_podcast'
    ) {
      if (!actValue) {
        errors.push(lang === 'de' ? 'Bitte gib eine gültige URL ein.' : 'Please enter a valid URL.');
      } else {
        const hasDot = actValue.includes('.');
        if (!hasDot && !actValue.startsWith('http://') && !actValue.startsWith('https://')) {
          errors.push(lang === 'de' ? 'Bitte gib eine gültige URL ein.' : 'Please enter a valid URL.');
        }
      }
    } else if (b.actionType === 'phone' || b.actionType === 'sms') {
      if (!actValue) {
        errors.push(lang === 'de' ? 'Telefonnummer ist erforderlich.' : 'Phone number is required.');
      } else if (!/^[+0-9\s()-]+$/.test(actValue)) {
        errors.push(lang === 'de' ? 'Bitte gib eine gültige Telefonnummer ein.' : 'Please enter a valid phone number.');
      }
    } else if (
      b.actionType === 'email' ||
      b.actionType === 'appointment_request'
    ) {
      if (!actValue) {
        errors.push(lang === 'de' ? 'E-Mail-Adresse ist erforderlich.' : 'Email address is required.');
      } else if (!actValue.includes('@')) {
        errors.push(lang === 'de' ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      }
    } else if (
      b.actionType === 'callback_request' ||
      b.actionType === 'inquiry_form' ||
      b.actionType === 'contact_form'
    ) {
      if (actValue && !actValue.includes('@')) {
        errors.push(lang === 'de' ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      }
    } else if (b.actionType === 'whatsapp') {
      if (!actValue) {
        errors.push(lang === 'de' ? 'WhatsApp-Nummer oder Link ist erforderlich.' : 'WhatsApp number or link is required.');
      }
    } else if (b.actionType === 'file' || b.actionType === 'pdf' || b.actionType === 'pdf_link' || b.actionType === 'pdf_upload' || b.actionType === 'external_file') {
      // PDF uploads could have placeholder or actual url
      if (!actValue) {
        errors.push(lang === 'de' ? 'Datei oder Link ist erforderlich.' : 'File or link is required.');
      }
    } else if (b.actionType === 'dropbox') {
      if (!actValue || !actValue.startsWith('https://')) {
        errors.push(lang === 'de' ? 'Bitte gib einen gültigen Dropbox-Link ein.' : 'Please enter a valid Dropbox link.');
      }
    } else if (
      b.actionType === 'youtube_video' ||
      b.actionType === 'vimeo_video' ||
      b.actionType === 'video_link'
    ) {
      if (!actValue) {
        errors.push(lang === 'de' ? 'Bitte gib einen Video-Link ein.' : 'Please enter a video URL.');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a button object, stripping functions and undefined fields for clean Firestore payloads.
 */
export function sanitizeButtonForFirestore(button: CardButton): CardButton {
  const normalized = normalizeButton(button);
  const clean: any = {};

  const forbiddenKeys = [
    'plainPassword',
    'confirmPassword',
    'passwordDraft',
    'tempPassword',
    'uploadFile',
    'localPreviewUrl'
  ];

  Object.keys(normalized).forEach((key) => {
    if (forbiddenKeys.includes(key)) {
      return;
    }
    const val = (normalized as any)[key];
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = val;
    }
  });

  // Strict type alignment
  clean.isProtected = !!clean.isProtected || !!clean.passwordProtected;
  clean.passwordProtected = clean.passwordProtected !== undefined ? !!clean.passwordProtected : !!clean.isProtected;

  if (!clean.passwordProtected) {
    clean.isProtected = false;
    clean.passwordProtected = false;
    delete clean.buttonPassword;
    delete clean.passwordHash;
    delete clean.passwordHint;
  } else {
    clean.isProtected = true;
    clean.passwordProtected = true;
    if (clean.buttonPassword === undefined || clean.buttonPassword === '') {
      delete clean.buttonPassword;
    }
    if (clean.passwordHash === undefined || clean.passwordHash === '') {
      delete clean.passwordHash;
    }
    if (clean.passwordHint === undefined || clean.passwordHint === '') {
      delete clean.passwordHint;
    }
  }

  if (clean.actionType === 'download_area') {
    const rawItems = clean.downloadItems || [];
    const sanitizedItems: any[] = [];
    rawItems.forEach((item: any) => {
      const title = (item.title || '').trim();
      const rawUrl = (item.url || '').trim();
      if (title && rawUrl) {
        const url = sanitizeExternalUrl(rawUrl);
        if (url && url !== '#') {
          const rawProv = detectProvider(url);
          let provider: 'dropbox' | 'google_drive' | 'onedrive' | 'external' = 'external';
          if (rawProv === 'dropbox') provider = 'dropbox';
          else if (rawProv === 'google_drive') provider = 'google_drive';
          else if (rawProv === 'onedrive') provider = 'onedrive';
          
          sanitizedItems.push({
            title,
            url,
            provider
          });
        }
      } else if (title && !rawUrl) {
        // preserve already-sanitized download area items under protection
        sanitizedItems.push({
          title,
          provider: item.provider || 'external'
        });
      }
    });
    clean.downloadItems = sanitizedItems;
  }

  // STRICT SECURITY SANITIZATION FOR PASSWORD PROTECTED BUTTONS
  if (clean.isProtected || clean.passwordProtected) {
    clean.actionValue = "";
    if (clean.url !== undefined) clean.url = "";
    if (clean.value !== undefined) clean.value = "";
    delete clean.password;
    delete clean.buttonPassword;
    delete clean.passwordHash;

    if (clean.uploadedFile) {
      clean.uploadedFile = { ...clean.uploadedFile };
      delete clean.uploadedFile.url;
    }

    if (clean.downloadItems && Array.isArray(clean.downloadItems)) {
      clean.downloadItems = clean.downloadItems.map((item: any) => {
        const copy = { ...item };
        delete copy.url;
        return copy;
      });
    }
  }

  return clean as CardButton;
}

/**
 * Safely constructs a standard clickable Web URI for redirection.
 */
export function buildButtonActionUrl(button: CardButton, card?: Card): string | null {
  const b = normalizeButton(button);
  
  if ((b.actionType === 'pdf_upload' || b.actionType === 'direct_file_upload') && b.uploadedFile?.url) {
    return sanitizeExternalUrl(b.uploadedFile.url);
  }

  const val = b.actionValue.trim();
  if (!val) return null;

  // If this belongs to specialized overlay widgets, do not return raw link redirect
  if ([
    'download_area',
    'social_collection',
    'opening_hours',
    'availability_calendar',
    'callback_request',
    'inquiry_form',
    'contact_form',
    'appointment_request',
    'konu_gallery'
  ].includes(b.actionType)) {
    return '#';
  }

  switch (b.actionType) {
    case 'phone':
    case 'tel':
      return `tel:${val.replace(/\s+/g, '')}`;
    case 'email':
    case 'mailto':
      return `mailto:${val}`;
    case 'sms':
      return `sms:${val}`;
    case 'whatsapp': {
      if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('wa.me')) {
        return val.startsWith('wa.me') ? `https://${val}` : val;
      }
      const cleanNum = val.replace(/[\s+()-]/g, '');
      return `https://wa.me/${cleanNum}`;
    }
    case 'instagram':
    case 'facebook':
    case 'linkedin':
    case 'youtube':
    case 'youtube_channel':
    case 'youtube_video':
    case 'vimeo_video':
    case 'video_link':
    case 'external_gallery':
    case 'audio_podcast':
    case 'website':
    case 'external_url':
    case 'custom_url':
    case 'pdf_link':
    case 'file_link':
    case 'pdf_upload':
    case 'direct_file_upload':
    case 'external_file':
    case 'external_file_link':
    case 'file': 
    case 'dropbox':
    case 'dropbox_file':
    case 'dropbox_folder':
    case 'google_drive_file':
    case 'google_drive_folder':
    case 'onedrive_file':
    case 'onedrive_folder': {
      if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
        return sanitizeExternalUrl(val);
      }
      return sanitizeExternalUrl(`https://${val}`);
    }
    default:
      return sanitizeExternalUrl(val);
  }
}

/**
 * Triggers the browser window execution or downloads corresponding to the button action type.
 * Intercepts overlay triggers to open modal overlays instead.
 */
export function executeButtonAction(
  button: CardButton,
  card: Card,
  options?: {
    onOpenGallery?: (button: CardButton) => void;
    onOpenVideoModal?: (url: string) => void;
    onOpenOverlayModal?: (btn: CardButton, mode: string) => void;
  }
) {
  const b = normalizeButton(button);
  const actionType = b.actionType;
  const val = b.actionValue.trim();

  // If interactive list overlay exists, prioritize custom trigger callbacks
  if ([
    'download_area',
    'social_collection',
    'opening_hours',
    'availability_calendar',
    'callback_request',
    'inquiry_form',
    'contact_form',
    'appointment_request'
  ].includes(actionType)) {
    if (options?.onOpenOverlayModal) {
      options.onOpenOverlayModal(b, actionType);
    } else {
      console.warn(`Overlay callback was not provided for trigger type: ${actionType}`);
    }
    return;
  }

  if (!val && actionType !== 'vcard' && actionType !== 'gallery' && actionType !== 'konu_gallery') return;

  if (actionType === 'phone' || actionType === 'tel') {
    window.location.href = `tel:${val.replace(/\s+/g, '')}`;
  } else if (actionType === 'email' || actionType === 'mailto') {
    window.location.href = `mailto:${val}`;
  } else if (actionType === 'sms') {
    window.location.href = `sms:${val}`;
  } else if (actionType === 'whatsapp') {
    const url = buildButtonActionUrl(b, card);
    if (url && url !== '#') openExternalUrl(url);
  } else if (actionType === 'vcard') {
    downloadVCardFileFromCard(card);
  } else if (actionType === 'gallery' || actionType === 'konu_gallery') {
    if (options?.onOpenGallery) {
      options.onOpenGallery(b);
    } else {
      console.warn('Gallery callback was not provided to options');
    }
  } else if (actionType === 'youtube_video' || actionType === 'vimeo_video' || actionType === 'video_link') {
    const videoUrl = buildButtonActionUrl(b, card) || '';
    if (options?.onOpenVideoModal && videoUrl && videoUrl !== '#') {
      options.onOpenVideoModal(videoUrl);
    } else if (videoUrl && videoUrl !== '#') {
      openExternalUrl(videoUrl);
    }
  } else if (actionType === 'pdf_upload' || actionType === 'pdf_link' || actionType === 'file' || actionType === 'direct_file_upload') {
    const fileUrl = buildButtonActionUrl(b, card) || '';
    if (!fileUrl || fileUrl === '#') return;
    
    // For PDFs and uploaded files, open directly in a new tab for native display / download
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  } else {
    const url = buildButtonActionUrl(b, card);
    if (url && url !== '#') {
      openExternalUrl(url);
    }
  }
}

/**
 * Clean & Sanitize URLs to neutralize javascript injections
 */
export function sanitizeExternalUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  
  const lower = trimmed.toLowerCase();
  
  // Explicitly block dangerous or custom system protocols completely
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('chrome:')
  ) {
    return '#';
  }
  
  // Regressions: Website, Custom URL, External Files, Cloud Links, and basic actions
  const allowedPrefixes = ['http://', 'https://', 'tel:', 'mailto:', 'sms:', 'wa.me'];
  const isAllowed = allowedPrefixes.some(p => lower.startsWith(p));
  
  if (isAllowed) {
    return trimmed;
  }
  
  // If it contains some other protocol prefix (e.g. ftp://, or any prefix ending with : except the ones we allowed), block it
  const matchProto = lower.match(/^([a-z0-9+.-]+):/);
  if (matchProto) {
    const protoName = matchProto[1];
    if (!['http', 'https', 'tel', 'mailto', 'sms', 'wa.me'].includes(protoName)) {
      return '#';
    }
  }
  
  // If no protocol is specified but it looks like a domain or path, prepend https://
  if (/^[a-zA-Z0-9][-a-zA-Z0-9.+_]*\.[a-zA-Z0-9]{1,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  
  return '#';
}

/**
 * Returns whether given URL belongs to safe formats
 */
export function isSafeExternalUrl(url: string): boolean {
  const sanitized = sanitizeExternalUrl(url);
  if (sanitized === '#' || sanitized === '') return false;
  const lower = sanitized.toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}

/**
 * Detect provider of a given cloud link
 */
export function detectProvider(url: string): 'dropbox' | 'google_drive' | 'onedrive' | 'youtube' | 'vimeo' | 'external' | 'generic' {
  const lower = (url || '').toLowerCase();
  if (lower.includes('dropbox.com') || lower.includes('dl.dropboxusercontent.com')) return 'dropbox';
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com') || lower.includes('google.com/drive')) return 'google_drive';
  if (lower.includes('onedrive.live.com') || lower.includes('1drv.ms') || lower.includes('sharepoint.com') || lower.includes('live.com')) return 'onedrive';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('vimeo.com')) return 'vimeo';
  return 'external';
}

/**
 * Opens a url with secure noopener, noreferrer parameters
 */
export function openExternalUrl(url: string): void {
  const sanitized = sanitizeExternalUrl(url);
  if (sanitized && sanitized !== '#') {
    window.open(sanitized, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Upserts a button within an array of card buttons, automatically sorting and maintaining index priorities.
 */
export function upsertButton(buttons: CardButton[], button: CardButton): CardButton[] {
  const norm = normalizeButton(button);
  const updated = [...buttons];
  const idx = updated.findIndex((b) => b.id === norm.id);

  if (idx !== -1) {
    updated[idx] = norm;
  } else {
    norm.position = updated.length;
    updated.push(norm);
  }

  return sortButtons(updated);
}

/**
 * Deletes a button by its ID, dynamically re-index positions to avoid spacing gaps.
 */
export function deleteButtonById(buttons: CardButton[], buttonId: string): CardButton[] {
  const filtered = buttons.filter((b) => b.id !== buttonId);
  return sortButtons(filtered).map((b, i) => ({ ...b, position: i }));
}

/**
 * Swaps positions between drag-drop elements seamlessly.
 */
export function reorderButtons(buttons: CardButton[], sourceIndex: number, destinationIndex: number): CardButton[] {
  const list = [...sortButtons(buttons)];
  const [removed] = list.splice(sourceIndex, 1);
  list.splice(destinationIndex, 0, removed);

  return list.map((b, i) => ({ ...b, position: i }));
}

/**
 * Sorts card buttons relative to position index strictly ascending.
 */
export function sortButtons(buttons: CardButton[]): CardButton[] {
  return [...buttons].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/**
 * Resolves standard scale factor for a button with migration safety.
 */
export function getButtonScaleFactor(btn: any): number {
  if (!btn) return 1.0;
  
  if (typeof btn.buttonSizeScale === 'number') {
    return btn.buttonSizeScale > 5 ? btn.buttonSizeScale / 100 : btn.buttonSizeScale;
  }
  
  const bSize = btn.buttonSize;
  if (!bSize) return 1.0;
  
  if (bSize.scale !== undefined) {
    return bSize.scale > 5 ? bSize.scale / 100 : bSize.scale;
  }
  
  if (bSize.preset === 'compact') {
    return 0.8;
  }
  if (bSize.preset === 'large') {
    return 1.25;
  }
  if (bSize.preset === 'standard') {
    return 1.0;
  }
  
  return 1.0;
}

export function normalizeButtonGridLayout(card: Partial<Card> | undefined): Required<ButtonGridLayout> {
  const defaultLayout: Required<ButtonGridLayout> = {
    mode: 'list',
    cols: 3,
    square: false,
    gapPx: 12,
    buttonSizePx: 72,
    gap: 12,
    align: 'center',
  };

  if (!card) return defaultLayout;

  const gl = card.buttonGridLayout;
  
  // Decide default mode based on whether the card is a ureel card or has specified values
  const isUreel = !!(card.ureelTimeline || card.ureelEndCard || card.ureelScene);
  const defaultMode = isUreel ? 'grid' : 'list';
  const defaultSquare = isUreel;

  return {
    mode: (gl?.mode || defaultMode) as any,
    cols: typeof gl?.cols === 'number' ? gl.cols : 3,
    square: gl?.square !== undefined ? !!gl.square : defaultSquare,
    gapPx: typeof gl?.gapPx === 'number' ? gl.gapPx : (typeof card.buttonGapPx === 'number' ? card.buttonGapPx : 12),
    buttonSizePx: typeof gl?.buttonSizePx === 'number' ? gl.buttonSizePx : (typeof card.buttonSizePx === 'number' ? card.buttonSizePx : 72),
    gap: typeof gl?.gap === 'number' ? gl.gap : 12,
    align: gl?.align || 'center',
  };
}

