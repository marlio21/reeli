/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlanType = 'free' | 'fun' | 'pro' | 'business' | 'starter' | 'premium' | 'family' | 'enterprise';
export type CardType = 'person' | 'company' | 'product' | 'project' | 'family' | 'team' | 'event' | 'club';
export type VisibilityType = 'public' | 'privateLink' | 'passwordProtected' | 'draft';
export type OverlayType = 'none' | 'light' | 'dark';
export type BackgroundType = 'color' | 'image' | 'video' | 'gradient';

export interface UserProfile {
  userId: string;
  uid?: string; // Support direct mapping
  email: string;
  displayName: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addressLine1?: string;
  postalCode?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  accountType?: 'private' | 'business' | 'product' | 'project' | 'family';
  companyName?: string;
  companyLegalForm?: string;
  vatId?: string;
  companyAddressLine1?: string;
  companyPostalCode?: string;
  companyCity?: string;
  companyCountry?: string;
  contactPerson?: string;
  website?: string;
  plan: PlanType;
  planId?: string; // Standard default config
  brandingRequired?: boolean; // Default configuration
  storageLimitMB: number;
  storageUsedMB: number;
  role: 'user' | 'admin' | 'owner';
  acceptedTermsAt: string;
  acceptedPrivacyAt: string;
  newsletterConsent: boolean;
  createdAt: string;
  updatedAt: string;
  onboardingComplete?: boolean; // Form completion flag
}

export interface ButtonAction {
  label: string;
  type: string; // 'phone' | 'email' | 'url' | 'whatsapp' | 'maps' etc.
  value: string;
}

export interface CardButton {
  id: string;
  /**
   * Unified visible button text. New rendering must use only this field.
   * Legacy fields below are typed only for imports/migrations and are ignored by renderers.
   */
  title: string;
  label?: string;
  text?: string;
  actionLabel?: string;

  actionType: string;
  actionValue: string;

  icon?: string;
  iconId?: string; // Legacy
  iconColor?: string;
  iconSize?: number;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'background';
  iconOffsetX?: number;
  iconOffsetY?: number;
  iconEnabled?: boolean;
  iconCircleBg?: boolean;
  iconCircleColor?: string;

  bgColor?: string;
  backgroundColor?: string; // Legacy compatibility
  textColor?: string;
  borderColor?: string;
  gradient?: string;
  opacity?: number;

  styleVariant?: 'filled' | 'outline' | 'minimal' | 'soft' | 'gradient';
  radius?: 'square' | 'rounded' | 'pill';
  animation?: 'none' | 'scale' | 'pulse' | 'wiggle';

  imageUrl?: string;
  imageMode?: 'cover' | 'contain';
  imageOverlay?: number | string | 'none' | 'light' | 'dark';
  buttonImageUrl?: string;
  buttonImageFit?: 'cover' | 'contain';
  buttonImageOverlay?: boolean;
  imageStyle?: 'none' | 'icon' | 'background'; // Legacy compatibility
  imagePath?: string; // Legacy
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  imageDarken?: number;
  imageSaturation?: number;

  borderEnabled?: boolean;
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick' | number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  shadow?: 'none' | 'soft' | 'medium' | 'strong';
  shadowColor?: string;
  glow?: 'none' | 'gold' | 'light';

  isProtected?: boolean;
  passwordProtected?: boolean;
  password?: string; // Legacy password
  buttonPassword?: string;
  passwordHash?: string;
  passwordHint?: string;

  position: number;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;

  // text style attributes
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'top' | 'center' | 'bottom';
  textPadding?: number;
  textShadow?: 'none' | 'soft' | 'strong';
  textWrap?: 'single' | 'multi' | 'ellipsis';

  // other legacy or helper props
  hasGoldBorder?: boolean;
  actions?: ButtonAction[];
  showLabel?: boolean;
  labelOverlay?: boolean;
  labelPosition?: 'top' | 'center' | 'bottom';
  darkOverlay?: boolean;
  showBorder?: boolean;

  bgMode?: 'solid' | 'gradient';
  gradientColor?: string;
  gradientDirection?: 'to-bottom' | 'to-right' | 'to-br' | 'to-bl';
  textOffsetX?: number;
  textOffsetY?: number;
  textFineTuneEnabled?: boolean;
  galleryImages?: Array<{
    url: string;
    name?: string;
    size?: number;
    type?: string;
    width?: number;
    height?: number;
    createdAt?: string;
  }>;
  galleryUrls?: string[];
  galleryDropboxUrl?: string;
  buttonShape?: string;
  buttonSize?: {
    preset: "compact" | "standard" | "large" | "custom";
    width?: number | string;
    height?: number;
    minHeight?: number;
    paddingX?: number;
    paddingY?: number;
    gap?: number;
    scale?: number;
  };
  
  // Download-Bereich fields
  downloadItems?: Array<{
    title: string;
    url: string;
    provider?: "dropbox" | "google_drive" | "onedrive" | "external";
  }>;
  
  // Availability fields
  availabilityStatus?: 'available' | 'vacation' | 'unavailable' | 'appointment';
  availabilityFrom?: string;
  availabilityTo?: string;
  availabilityNote?: string;
  availabilityBackupContact?: string;

  // Direct File Upload fields
  uploadedFile?: {
    name: string;
    url: string;
    storagePath?: string;
    contentType?: string;
    size?: number;
    uploadedAt?: string;
  };

  // Missing interactive Action fields
  socialCollection?: {
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    pinterest?: string;
    telegram?: string;
  } | null;
  openingHours?: {
    [day: string]: {
      from: string;
      to: string;
      closed: boolean;
    };
  } | null;
  locationRouteProvider?: 'google' | 'apple' | 'both';

  // Forms & Fields (Prompt 6B & 7B)
  formConfig?: {
    targetEmail?: string;
    subject?: string;
    introText?: string;
    storeLead?: boolean;
  };
  callbackConfig?: {
    targetEmail?: string;
    subject?: string;
    introText?: string;
    storeLead?: boolean;
  };
}


export interface UreelDesktopPage {
  layout?: 'phone_left' | 'phone_center' | 'premium_landing' | 'minimal';
  backgroundMode?: 'gradient' | 'image' | 'color';
  backgroundImageUrl?: string;
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  imageDarken?: number;
  contentMode?: 'from_card' | 'custom';
  title?: string;
  subtitle?: string;
  description?: string;
  showQr?: boolean;
  showShare?: boolean;
  showContactSave?: boolean;
  showActionButtons?: boolean;
  showPhoneButtons?: boolean;
  buttonMode?: 'always' | 'timed';
  buttonLayout?: 'contact_box' | 'three_col' | 'two_col' | 'list';
  buttonAreaBackgroundMode?: 'none' | 'gradient' | 'image';
  buttonAreaBackgroundImageUrl?: string;
  buttonAreaGradientFrom?: string;
  buttonAreaGradientTo?: string;
  buttonAreaDarken?: number;
  lastEditorSource?: 'design' | 'studio';
}

export interface Card {
  cardId: string;
  ownerId: string;
  type: CardType;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  profileImageUrl: string;
  backgroundType: BackgroundType;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundImageFit?: 'cover' | 'contain' | 'repeat' | 'auto';
  overlay: OverlayType;
  buttons: CardButton[];
  isPublished: boolean;
  visibility: VisibilityType;
  passwordHash?: string; // Simple card password
  brandingRequired: boolean;
  brandingHidden?: boolean;
  customBrandingEnabled?: boolean;
  customLogoUrl?: string | null;
  plan?: PlanType;
  companyName?: string;
  location?: string;
  category?: string;
  // Product custom properties
  profileType?: 'person' | 'business' | 'product' | 'project' | 'family' | 'club' | 'school';
  productMediaType?: 'image' | 'video';
  productImageUrl?: string;
  productImagePath?: string;
  productVideoUrl?: string;
  productVideoType?: 'direct' | 'youtube' | 'vimeo' | 'external';
  showProductText?: boolean;
  productTitle?: string;
  productSubtitle?: string;
  productDescription?: string;
  productMediaPosition?: 'top' | 'center' | 'bottom';
  productHeroSize?: 'compact' | 'normal' | 'large';
  coverImageUrl?: string;
  coverImagePath?: string;
  coverOverlayDarken?: boolean;
  coverImagePosition?: 'top' | 'center' | 'bottom';

  // Unified hero area fields
  heroBackgroundType?: 'color' | 'image' | 'video';
  heroBackgroundColor?: string;
  heroImageUrl?: string;
  heroImagePath?: string;
  heroVideoUrl?: string;
  heroVideoType?: 'direct' | 'youtube' | 'vimeo' | 'external';
  heroMediaPosition?: 'top' | 'center' | 'bottom';
  heroSize?: 'compact' | 'normal' | 'large';
  heroOverlayStyle?: 'none' | 'dark-gradient' | 'light-gradient';

  showProfileImage?: boolean;
  profileImagePosition?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
  profileImageShape?: 'circle' | 'rounded' | 'square';
  profileImageBorder?: 'none' | 'gold' | 'cream';

  showHeroText?: boolean;
  showHeroTitle?: boolean;
  showHeroSubtitle?: boolean;
  showHeroDescription?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroTextPosition?: 'top' | 'center' | 'bottom';
  heroTextAlign?: 'left' | 'center' | 'right';
  heroFontStyle?: 'modern' | 'elegant' | 'bold' | 'minimal';
  heroTextColor?: 'white' | 'cream' | 'gold' | 'dark';

  // Per-field typography & color overrides
  heroTitleFontStyle?: 'modern' | 'elegant' | 'bold' | 'minimal';
  heroTitleTextColor?: 'white' | 'cream' | 'gold' | 'dark';
  heroSubtitleFontStyle?: 'modern' | 'elegant' | 'bold' | 'minimal';
  heroSubtitleTextColor?: 'white' | 'cream' | 'gold' | 'dark';
  heroDescFontStyle?: 'modern' | 'elegant' | 'bold' | 'minimal';
  heroDescTextColor?: 'white' | 'cream' | 'gold' | 'dark';

  // Further customization for ProfileHeroDesigner
  heroBackgroundEnabled?: boolean;
  heroBackgroundSize?: 'small' | 'medium' | 'large';
  heroVideoMode?: 'auto' | 'portrait' | 'landscape';
  heroGradientEnabled?: boolean;
  heroGradientColor?: string;
  heroGradientDirection?: string;
  heroSaturation?: number;
  heroDarken?: number;
  heroLayout?: 'klassisch' | 'textlinks' | 'premium' | 'textrahmen' | string;
  heroBgColor?: string;
  heroGradient?: string;
  heroImageMode?: 'cover' | 'contain';
  heroImagePosition?: string;
  heroOverlay?: number;
  heroBlur?: number;
  heroBackgroundBlur?: boolean;
  heroProfileImageUrl?: string;
  heroLogoUrl?: string;
  heroImageShape?: 'circle' | 'rounded' | 'square';
  heroImageSize?: number;
  heroProfileImageSize?: number;
  heroImagePlacement?: 'left' | 'center' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  heroImageBorderColor?: string;
  heroImageBorderWidth?: number;
  heroHeight?: 'compact' | 'normal' | 'large' | 'xlarge' | string;
  heroPadding?: string;
  heroRadius?: string;
  heroBorderEnabled?: boolean;
  heroBorderColor?: string;
  heroBorderWidth?: number;
  heroShadow?: 'none' | 'soft' | 'medium' | 'strong';
  heroGlow?: 'none' | 'gold' | 'light';
  heroCompany?: string;
  heroLocation?: string;
  heroFontFamily?: string;
  heroTitleSize?: string | number;
  heroSubtitleSize?: string | number;
  heroDescriptionSize?: string | number;
  heroFontWeight?: string;
  heroLineHeight?: string;
  heroTextShadow?: 'none' | 'soft' | 'strong';
  heroAccentColor?: string;
  heroTextXOffset?: number;
  heroTextYOffset?: number;
  heroImageXOffset?: number;
  heroImageYOffset?: number;
  heroProfileImageX?: number;
  heroProfileImageY?: number;
  
  // Card general background customization fields
  cardBackgroundEnabled?: boolean;
  cardBackgroundImageUrl?: string;
  cardBackgroundMode?: 'cover' | 'contain';
  cardBackgroundDarken?: number;
  cardBackgroundSaturation?: number;
  cardBackgroundOffsetX?: number;
  cardBackgroundOffsetY?: number;
  cardBackgroundColor?: string;
  cardBackgroundGradientEnabled?: boolean;
  cardBackgroundGradientColor?: string;
  cardBackgroundGradientDirection?: string;
  buttonGridCols?: 1 | 2 | 3;
  buttonGridLayout?: ButtonGridLayout;

  isDeleted?: boolean;
  status?: string;
  heroColor?: string;
  heroImageOffsetX?: number;
  heroImageOffsetY?: number;

  // Prompt 7A: Employee card extensions
  companyId?: string;
  isEmployeeCard?: boolean;
  employeeName?: string;
  employeeRole?: string;
  employeeEmail?: string;
  employeePhone?: string;
  managedByCompany?: boolean;

  // SEO & Social Return import fields
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  longTailKeywords?: string[];
  localKeywords?: string[];
  brandKeywords?: string[];
  alternativeKeywords?: string[];
  imageAltTexts?: {
    hero?: string;
    logo?: string;
    profileImage?: string;
    productImage?: string;
    openGraphImage?: string;
    [key: string]: string | undefined;
  };
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  imageMeta?: Record<string, {
    originalSizeBytes?: number;
    optimizedSizeBytes?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpg' | 'png';
    optimized: boolean;
  }>;
  shareText?: string;
  hashtags?: string[];
  missingInfo?: string[];
  lastSeoImportAt?: string;
  lastSeoImportSource?: string;

  // Additional content & design support
  slogan?: string;
  benefits?: string[];
  theme?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonStyle?: string;
  logoUrl?: string;

  videoBackgroundConfig?: VideoBackgroundConfig;
  reelExportConfig?: ReelExportConfig;
  ureelScene?: UreelScene;
  ureelTimeline?: UreelTimeline;
  ureelEndCard?: UreelEndCard;
  ureelTextTemplate?: UreelTextTemplate;
  desktopPage?: UreelDesktopPage;
  buttonSizePx?: number;
  buttonGapPx?: number;

  textTemplateStyle?: string;
  textTemplateConfig?: any;
  profileImageReveal?: any;
  buttonLayout?: string;
  afterSequence?: any;
  textFontFamily?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface UreelScene {
  mode: 'video' | 'image' | 'color' | 'gradient';
  backgroundImageUrl?: string;
  backgroundColor?: string;
  gradient?: {
    from: string;
    to: string;
    direction: string;
  };
  overlay?: {
    darken: number;
    blur: number;
    vignette: boolean;
  };
  video?: {
    type: 'youtube' | 'youtube_shorts' | 'direct_mp4' | 'direct_webm' | 'none';
    url?: string;
    duration: number;
    displayMode: 'contain' | 'cover';
    placement?: 'background' | 'hero';
    heroSize?: 'wide' | 'compact';
    startAt?: number;
  };
}

export interface UreelTimeline {
  preset: 'direct' | 'short_intro' | 'ad_reel' | 'manual';
  titleAt?: number;
  subtitleAt?: number;
  descriptionAt?: number;
  buttonsAt?: number;
  endCardAt?: number;
}

export interface UreelEndCard {
  enabled: boolean;
  source: 'scene' | 'poster' | 'image' | 'color' | 'gradient' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  videoDisplayMode?: 'wide' | 'compact';
  backgroundColor?: string;
  gradient?: {
    from: string;
    to: string;
    direction: string;
  };
  replayButton: boolean;
}

export interface UreelTextTemplate {
  id: string;
  style: string;
  animation: 'fade' | 'slide_left' | 'slide_up' | 'reveal' | 'focus';
  emphasis?: {
    mode: 'none' | 'last_word' | 'custom_word';
    word?: string;
    color?: string;
  };
  frame?: {
    type: 'none' | 'thin' | 'corner' | 'underline' | 'side_line' | 'badge';
    color?: string;
    opacity?: number;
  };
  box?: {
    type: 'none' | 'transparent' | 'glass' | 'dark' | 'light';
    opacity?: number;
  };
  fontStyle?: 'modern' | 'elegant' | 'serif' | 'condensed' | 'tech';
}

export interface ButtonGridLayout {
  mode?: 'list' | 'grid' | 'auto' | 'one_column' | 'two_columns' | 'three_columns' | 'compact' | 'large';
  cols?: 1 | 2 | 3;
  square?: boolean;
  gapPx?: number;
  buttonSizePx?: number;
  gap?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ReelExportConfig {
  includeVideo?: boolean;
  includeProfileSection?: boolean;
  includeProfileImage?: boolean;
  includeLogo?: boolean;
  includeTitle?: boolean;
  includeDescription?: boolean;
  includeButtons?: boolean;
  hiddenButtonIds?: string[];
  includeContactButton?: boolean;
  includeQrCode?: boolean;
  includeBranding?: boolean;
  includeCta?: boolean;
  ctaText?: string;
  durationSeconds?: number;
  format?: 'vertical';
  resolution?: '720x1280' | '1080x1920';
  useCardTimeline?: boolean;
}

export interface VideoBackgroundConfig {
  enabled: boolean;
  mode?: 'youtube' | 'upload'; // Keep for compatibility
  duration?: number; // Keep for compatibility
  aspectRatio?: '9:16';
  youtubeUrl?: string; // Keep for compatibility
  startTimeSeconds?: number; // Keep for compatibility
  transition?: 'hard' | 'medium' | 'soft' | 'very_soft'; // Keep for compatibility

  // New fields
  mediaMode?: 'youtube' | 'upload' | 'slideshow';
  durationSeconds?: number;
  videoFitMode?: 'contain' | 'cover';
  stopAtSecond?: number;

  youtube?: {
    url: string;
    startTimeSeconds: number;
    mute?: boolean;
  };

  upload?: {
    fileUrl?: string;
    localPreviewUrl?: string; // object URL or similar
    storagePath?: string;
    originalFileName?: string;
    originalContentType?: string;
    originalSizeBytes?: number;
    originalDurationSeconds?: number;
    maxOriginalUploadMb?: number;
    stretchShortVideo?: boolean;
    computedPlaybackSpeed?: number;
    effectiveVideoDurationSeconds?: number;
    processingStatus: 'not_started' | 'local_preview' | 'uploaded' | 'processing_pending' | 'ready' | 'failed' | 'processing_failed';
    processingError?: string;

    // Requested smaller, secure metadata fields
    originalStoragePath?: string;
    originalFileSize?: number;
    originalDuration?: number;
    optimizedVideoUrl?: string;
    optimizedStoragePath?: string;
    thumbnailUrl?: string;
    thumbnailStoragePath?: string;
  };

  slideshow?: {
    images: Array<{
      url: string;
      storagePath?: string;
      durationSeconds: 3;
      alt?: string;
    }>;
    transition: 'very_soft' | 'soft' | 'medium' | 'hard';
    totalDurationSeconds: number;
  };

  buttonReveal: {
    enabled: boolean;
    startSecond: number;
    endSecond?: number;
    duration: number;
    style: 'fade' | 'slideUp' | 'soft';
  };

  loop?: {
    enabled: boolean;
    mode: 'none' | 'twice' | 'three_times' | 'infinite';
    maxLoops?: number;
  };

  textOverlay?: {
    enabled: boolean;
    content: string;
    fontFamily?: string;
    fontWeight?: string;
    fontSize: number;
    color: string;
    shadow: boolean;
    backgroundEnabled: boolean;
    backgroundColor?: string;
    x: number;
    y: number;
    revealStartSecond: number;
    revealEndSecond: number;
    hideAtSecond?: number;
    staysVisibleAfterSequence: boolean;
    animationStyle: 'fade' | 'slideUp' | 'soft';
  };

  profileReveal?: {
    enabled: boolean;
    startSecond: number;
    endSecond: number;
    hideAtSecond?: number;
    staysVisibleAfterSequence: boolean;
    style: 'fade' | 'scale' | 'soft';
  };

  // Keep old 'text' structure for compatibility
  text?: {
    enabled: boolean;
    content: string;
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    shadow: boolean;
    revealStartSecond: number;
    revealDuration: number;
    visibleAfterVideo: boolean;
  };

  textReveal?: {
    enabled: boolean;
    startSecond: number;
    duration: number;
  };

  // Keep old 'afterVideo' for compatibility
  afterVideo?: {
    backgroundType: 'none' | 'same' | 'image' | 'color' | 'gradient';
    imageUrl?: string;
    color?: string;
    gradient?: string;
  };

  afterSequence?: {
    enabled?: boolean;
    backgroundType: 'none' | 'same' | 'image' | 'color' | 'gradient' | 'video_last_frame';
    imageUrl?: string;
    storagePath?: string;
    color?: string;
    gradient?: string;
    transition: 'hard' | 'medium' | 'soft' | 'very_soft';
  };

  profileImageReveal?: {
    enabled: boolean;
    startSecond: number;
    fadeDuration: number;
    staysVisibleAfterSequence: boolean;
  };

  profileTextReveals?: Array<{
    fieldKey: string;
    enabled: boolean;
    startSecond: number;
    fadeDuration: number;
    staysVisibleAfterSequence: boolean;
  }>;

  processingTarget: {
    maxDurationSeconds: 15;
    maxFileSizeMb: 10;
    recommendedDurationSeconds?: number;
    preferredResolution: '720x1280';
    optionalResolution: '1080x1920';
    targetCodec: 'H.264';
    targetContainer: 'MP4';
    audioDefault: 'muted';
  };

  videoProcessingJob?: {
    status: 'not_started' | 'queued' | 'processing' | 'ready' | 'failed';
    plan: 'starter' | 'pro' | 'business';
    originalStoragePath: string;
    optimizedStoragePath?: string;
    originalFileSizeBytes: number;
    originalDurationSeconds?: number;
    targetDurationSeconds: number;
    targetMaxFileSizeMb: number;
    targetResolution: '720x1280' | '1080x1920';
    targetCodec: 'H.264';
    targetContainer: 'MP4';
    audioMode: 'muted' | 'compressed' | 'keep';
    originalDeleteAfterProcessing?: boolean;
    createdAt: string;
    updatedAt: string;
    error?: string;
  };
}

// Prompt 7A: Business and Team management interfaces
export type CompanyRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Company {
  companyId: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
  phone?: string;
  address?: string;
  vat?: string;
  country?: string;
  brandColor?: string;
  brandLogoUrl?: string;
  customDomain?: {
    domain?: string;
    status?: 'not_configured' | 'pending' | 'verified' | 'disabled';
    notes?: string;
    updatedAt?: string;
  };
}

export interface Lead {
  leadId: string;
  companyId: string;
  cardId?: string;
  cardTitle?: string;
  buttonId?: string;
  buttonLabel?: string;
  formType: 'contact_form' | 'inquiry_form' | 'callback_request';
  status: 'new' | 'contacted' | 'done' | 'archived';
  name: string;
  email: string;
  phone?: string;
  topic?: string;
  message?: string;
  preferredTime?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTemplate {
  templateId: string;
  companyId: string;
  name: string;
  type: 'employee_card' | 'product_card' | 'service_card' | 'event_card';
  description?: string;
  design: {
    backgroundType: 'color' | 'image';
    backgroundColor?: string;
    backgroundImageUrl?: string;
    backgroundImageFit?: 'cover' | 'contain' | 'repeat' | 'auto';
    overlay?: OverlayType;
    textColor?: string;
    glow?: string;
  };
  defaultButtons: Partial<CardButton>[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  memberId: string; // Document ID (usually email/userId)
  email: string;
  role: CompanyRole;
  status: 'active' | 'pending' | 'deactivated';
  name?: string;
  userId?: string; // Set when user accepts or registers
  createdAt: string;
  updatedAt: string;
}

// Prompt 7A: Right Helper checks
export function canManageCompany(role: CompanyRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageTeam(role: CompanyRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canEditEmployeeCards(role: CompanyRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canViewBusiness(role: CompanyRole): boolean {
  return ['owner', 'admin', 'editor', 'viewer'].includes(role);
}

export interface PlanConfig {
  planId: PlanType;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  storageLimitMB: number;
  maxCards: number;
  maxButtonsPerCard: number;
  maxPdfFiles: number;
  passwordButtonsEnabled: boolean;
  backgroundImageEnabled: boolean;
  analyticsEnabled: boolean;
  brandingRequired: boolean;
  buttonImagesEnabled: boolean;
}

export interface Group {
  groupId: string;
  ownerId: string;
  type: 'family' | 'team' | 'project' | 'company';
  name: string;
  memberCardIds: string[];
  slug: string;
  isPublished: boolean;
  visibility: 'public' | 'privateLink' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  reportId: string;
  cardId: string;
  reason: string;
  message: string;
  reporterEmail: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  eventId: string;
  cardId: string;
  buttonId?: string;
  eventType: 'view' | 'click';
  createdAt: string;
}

export interface LegalConsent {
  consentId: string;
  userId: string;
  type: 'terms' | 'privacy' | 'newsletter';
  version: string;
  acceptedAt: string;
}

export interface LibraryIcon {
  id: string;
  name: string;
  category: 'contact' | 'social' | 'business' | 'files' | 'shopping' | 'protected';
  defaultColor: string;
  defaultActionType: string;
}

export function getPublicCardUrl(slug?: string): string {
  const clean = (slug || '').toString().trim();
  if (!clean || clean === 'undefined' || clean === 'null') return '';
  return window.location.origin + "/u/" + encodeURIComponent(clean);
}

export function normalizeProfileType(type: any): 'person' | 'business' | 'product' | 'project' | 'family' | 'club' | 'school' {
  if (type === 'company' || type === 'business') {
    return 'business';
  }
  const allowed = ['person', 'business', 'product', 'project', 'family', 'club', 'school'];
  if (type && allowed.includes(type)) {
    return type as 'person' | 'business' | 'product' | 'project' | 'family' | 'club' | 'school';
  }
  return 'person';
}

