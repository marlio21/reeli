/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, VideoBackgroundConfig } from '../types';
import { compressImageBeforeUpload, formatImageOptimizationToast } from '../utils/image';
import { useFirebase } from '../context/FirebaseContext';
import { UpgradeModal } from './UpgradeModal';
import { canUseFeature, getUserPlan } from '../config/plans';
import { MiniCardPreview } from './MiniCardPreview';

interface CardBackgroundDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: Card;
  onSave: (updates: Partial<Card>) => Promise<void>;
  lang?: 'de' | 'en';
}

const TRANSLATIONS = {
  de: {
    title: 'Hintergrund anpassen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    saved: 'Hintergrund erfolgreich gespeichert',
    failed: 'Hintergrund konnte nicht gespeichert werden.',
    uploadBackground: 'Hintergrundbild hochladen',
    removeBackground: 'Bild entfernen',
    bgColor: 'Hintergrundfarbe (Vollfarbe)',
    gradientEnable: 'Verlauf aktivieren',
    gradientColor: 'Verlaufs-Endfarbe',
    gradientDir: 'Verlaufs-Richtung',
    preview: 'Vorschau-Modus',
    confirmCloseTitle: 'Änderungen verwerfen?',
    confirmCloseDesc: 'Möchten Sie Ihre ungespeicherten Änderungen am Hintergrund wirklich verwerfen?',
    discard: 'Verwerfen',
    continueEditing: 'Weiter bearbeiten',
    uploading: 'Datei wird hochgeladen...',
    cover: 'Füllend',
    contain: 'Eingepasst',
    offsetX: 'Horizontale Position',
    offsetY: 'Vertikale Position',
    darken: 'Abdunkeln',
    saturation: 'Sättigung',
    tiles: {
      group1: '1. Hintergrund (Standard)',
      group1Desc: 'Farben, Verläufe & statische Bilder',
      group2: '2. Video / Reel-Schleife',
      group2Desc: 'Dynamische Reels, Uploads oder YouTube links',
      group3: '3. Text & Buttons (Einblenden)',
      group3Desc: 'Überlagertes Overlay und zeitbasierte Effekte',
      group4: '4. Nach dem Video',
      group4Desc: 'Zustand nach Beendigung der Video-Schleife',
    },
    video: {
      enable: 'Video/Reel-Hintergrund aktivieren',
      mode: 'Video-Quelle',
      youtubeUrl: 'YouTube Video Link',
      youtubeTip: 'Bitte verwende einen gültigen YouTube-Link (nur youtube.com oder youtu.be erlaubt).',
      uploadVideo: 'Video-Reel hochladen (MP4)',
      uploadGuideline: 'Richtlinien für Uploads:',
      guidelineSize: 'Maximale Größe: 10 MB',
      guidelineResolution: 'Empfohlene Auflösung: 720x1280 (Hochformat 9:16)',
      guidelineFormat: 'Format: MP4 (H.264)',
      guidelineAudio: 'Wichtig: Keine Audio- oder Musikdateien hochladen (Muted standardmäßig)',
      guidelineDuration: 'Maximale Video-Dauer: 15s',
      duration: 'Reel-Spieldauer',
      startSecond: 'Start-Offset (Sekunden)',
    },
    textButtons: {
      textEnable: 'Custom Text-Schild aktivieren',
      textContent: 'Textinhalt',
      textSize: 'Schriftgröße',
      textColor: 'Farbe',
      textOpacity: 'Transparenz',
      textShadow: 'Textschatten aktivieren',
      textX: 'X-Position (Karten-Zentrum %)',
      textY: 'Y-Position (Karten-Höhe %)',
      textReveal: 'Einblendzeitpunkt (Sekunden)',
      textDuration: 'Einblenddauer (Sekunden)',
      textVisibleAfter: 'Text nach Video-Ende anzeigen',
      buttonEnable: 'Buttons zeitgesteuert einblenden',
      buttonReveal: 'Einblendzeitpunkt (Sekunden)',
      buttonDuration: 'Animationsdauer (Sekunden)',
      buttonStyle: 'Einblend-Effekt',
    },
    afterVideo: {
      bgType: 'Nach der Sequenz anzeigen',
      transition: 'Hintergrund-Übergangseffekt',
      same: 'Fortlaufendes Video',
      image: 'Statisches Bild',
      color: 'Feste Vollfarbe',
      gradient: 'Farbverlauf',
      imageUpload: 'End-Bild hochladen',
      colorSelect: 'Feste Endfarbe',
      gradientEnd: 'Farbverlauf-Zielfarbe',
    }
  },
  en: {
    title: 'Customize background',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Background saved successfully',
    failed: 'Background could not be saved.',
    uploadBackground: 'Upload background image',
    removeBackground: 'Remove image',
    bgColor: 'Background color (Solid)',
    gradientEnable: 'Enable Gradient',
    gradientColor: 'Gradient End Color',
    gradientDir: 'Gradient Direction',
    preview: 'Preview Mode',
    confirmCloseTitle: 'Discard changes?',
    confirmCloseDesc: 'Are you sure you want to discard your unsaved changes?',
    discard: 'Discard',
    continueEditing: 'Continue editing',
    uploading: 'Uploading file...',
    cover: 'Cover',
    contain: 'Contain',
    offsetX: 'Horizontal position',
    offsetY: 'Vertical position',
    darken: 'Darken',
    saturation: 'Saturation',
    tiles: {
      group1: '1. Background (Standard)',
      group1Desc: 'Colors, gradients & static images',
      group2: '2. Video / Reel Loop',
      group2Desc: 'Dynamic reels, uploads or YouTube',
      group3: '3. Text & Buttons (Reveal)',
      group3Desc: 'Timed overlays and reveal animations',
      group4: '4. After the Video',
      group4Desc: 'Fallback state when looping finishes',
    },
    video: {
      enable: 'Enable Video/Reel background',
      mode: 'Video Source',
      youtubeUrl: 'YouTube Video Link',
      youtubeTip: 'Please use a valid YouTube Link (only youtube.com or youtu.be permitted).',
      uploadVideo: 'Upload Video Reel (MP4)',
      uploadGuideline: 'Upload Guidelines:',
      guidelineSize: 'Max File Size: 10 MB',
      guidelineResolution: 'Recommended Resolution: 720x1280 (Portrait 9:16)',
      guidelineFormat: 'Codec/Format: MP4 (H.264)',
      guidelineAudio: 'Note: No audio/music files (Muted by default)',
      guidelineDuration: 'Max Video Duration: 15s',
      duration: 'Reel Playback Duration',
      startSecond: 'Start Offset (seconds)',
    },
    textButtons: {
      textEnable: 'Enable Custom Text Overlay',
      textContent: 'Text Content',
      textSize: 'Font Size',
      textColor: 'Color',
      textOpacity: 'Opacity',
      textShadow: 'Enable Text Shadow',
      textX: 'X Position (Center %)',
      textY: 'Y Position (Height %)',
      textReveal: 'Reveal Start (seconds)',
      textDuration: 'Reveal Transition (seconds)',
      textVisibleAfter: 'Keep Text Visible After video',
      buttonEnable: 'Reveal Buttons with Delay',
      buttonReveal: 'Reveal Start (seconds)',
      buttonDuration: 'Reveal Transition (seconds)',
      buttonStyle: 'Reveal Effect Style',
    },
    afterVideo: {
      bgType: 'Display after video finishes',
      transition: 'Transition Effect',
      same: 'Continue / Loop Video',
      image: 'Static Image',
      color: 'Solid Color',
      gradient: 'Color Gradient',
      imageUpload: 'Static End-Image',
      colorSelect: 'Feste Endfarbe',
      gradientEnd: 'Farbverlauf-Zielfarbe',
    }
  }
};

const defaultVideoConfig: VideoBackgroundConfig = {
  enabled: false,
  mode: 'youtube',
  duration: 12,
  aspectRatio: '9:16',
  youtubeUrl: '',
  startTimeSeconds: 0,
  transition: 'soft',
  buttonReveal: {
    enabled: false,
    startSecond: 5,
    duration: 0.8,
    style: 'soft'
  },
  text: {
    enabled: false,
    content: '',
    x: 50,
    y: 60,
    size: 16,
    color: '#FFFFFF',
    opacity: 100,
    shadow: true,
    revealStartSecond: 2,
    revealDuration: 1,
    visibleAfterVideo: true
  },
  afterVideo: {
    backgroundType: 'same',
    imageUrl: '',
    color: '#0B0B0B',
    gradient: 'linear-gradient(135deg, #1C1C1E 0%, #0B0B0B 100%)'
  },
  processingTarget: {
    maxDurationSeconds: 15,
    maxFileSizeMb: 10,
    preferredResolution: '720x1280',
    optionalResolution: '1080x1920',
    targetCodec: 'H.264',
    targetContainer: 'MP4',
    audioDefault: 'muted'
  }
};

export const CardBackgroundDesigner: React.FC<CardBackgroundDesignerProps> = ({
  isOpen,
  onClose,
  activeCard,
  onSave,
  lang = 'de',
}) => {
  const { uploadFile, profile, effectivePlanId, user } = useFirebase();
  const videoFileInputRef = React.useRef<HTMLInputElement>(null);
  const videoCaptureInputRef = React.useRef<HTMLInputElement>(null);
  const currentPlan = effectivePlanId || getUserPlan(profile);
  const normalizedPlan = (currentPlan || '').toString().toLowerCase();
  const plan = normalizedPlan === 'business' ? 'business' : (normalizedPlan === 'pro' ? 'pro' : 'starter');
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<any>('');
  const t = TRANSLATIONS[lang];

  // Navigation state within background segments sheet
  const [activeSegment, setActiveSegment] = useState<'tiles' | 'background' | 'video' | 'text' | 'afterVideo'>('tiles');
  
  // High-fidelity preview timeline selector state state
  const [activeTimelineState, setActiveTimelineState] = useState<'start' | 'reveal' | 'fully_visible' | 'final' | 'autoplay'>('autoplay');

  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // SECTION 1: Standard Background draft properties
  const [bgEnabled, setBgEnabled] = useState(true);
  const [bgUrl, setBgUrl] = useState('');
  const [bgMode, setBgMode] = useState<'cover' | 'contain'>('cover');
  const [bgDarken, setBgDarken] = useState(25);
  const [bgSaturation, setBgSaturation] = useState(100);
  const [bgOffsetX, setBgOffsetX] = useState(0);
  const [bgOffsetY, setBgOffsetY] = useState(0);
  const [bgColor, setBgColor] = useState('#1C1C1E');
  const [bgGradientEnabled, setBgGradientEnabled] = useState(false);
  const [bgGradientColor, setBgGradientColor] = useState('#0B0B0B');
  const [bgGradientDirection, setBgGradientDirection] = useState('135deg');

  // SECTION 2: Video / Reel Draft states
  const [vBgEnabled, setVBgEnabled] = useState(false);
  const [vBgMode, setVBgMode] = useState<'youtube' | 'upload'>('youtube');
  const [vBgDuration, setVBgDuration] = useState<number>(12);
  const [vBgAspectRatio, setVBgAspectRatio] = useState<'9:16'>('9:16');
  const [vBgYoutubeUrl, setVBgYoutubeUrl] = useState('');
  const [vBgStartTimeSeconds, setVBgStartTimeSeconds] = useState(0);
  const [vBgTransition, setVBgTransition] = useState<'hard' | 'medium' | 'soft' | 'very_soft'>('very_soft');

  // NEW SLIDESHOW & ADVANCED TIME REEL LOGIC FIELDS:
  const [vBgMediaMode, setVBgMediaMode] = useState<'youtube' | 'upload' | 'slideshow'>('youtube');
  const [vBgVideoFitMode, setVBgVideoFitMode] = useState<'contain' | 'cover'>('contain');
  const [vBgDurationSeconds, setVBgDurationSeconds] = useState<number>(12);
  const [vBgYoutubeMute, setVBgYoutubeMute] = useState(true);
  const [vBgOriginalDuration, setVBgOriginalDuration] = useState<number | undefined>(undefined);
  const [vBgOriginalFileName, setVBgOriginalFileName] = useState<string | undefined>(undefined);
  const [vBgOriginalContentType, setVBgOriginalContentType] = useState<string | undefined>(undefined);
  const [vBgOriginalSizeBytes, setVBgOriginalSizeBytes] = useState<number | undefined>(undefined);
  const [vBgProcessingError, setVBgProcessingError] = useState<string | undefined>(undefined);
  const [vBgStretchShortVideo, setVBgStretchShortVideo] = useState(true);
  const [vBgComputedPlaybackSpeed, setVBgComputedPlaybackSpeed] = useState<number | undefined>(undefined);
  const [vBgEffectiveVideoDuration, setVBgEffectiveVideoDuration] = useState<number | undefined>(undefined);
  const [vBgLocalPreviewUrl, setVBgLocalPreviewUrl] = useState<string | undefined>(undefined);
  const [vBgStoragePath, setVBgStoragePath] = useState<string | undefined>(undefined);
  const [vBgOptimizedVideoUrl, setVBgOptimizedVideoUrl] = useState<string | undefined>(undefined);
  const [vBgOptimizedStoragePath, setVBgOptimizedStoragePath] = useState<string | undefined>(undefined);
  const [vBgProcessingJob, setVBgProcessingJob] = useState<any | undefined>(undefined);
  const [vBgProcessingStatus, setVBgProcessingStatus] = useState<'not_started' | 'local_preview' | 'uploaded' | 'processing_pending' | 'ready' | 'failed' | 'processing_failed'>('not_started');
  const [saveValidationError, setSaveValidationError] = useState<string | null>(null);
  const [vBgSlideshowImages, setVBgSlideshowImages] = useState<Array<{ url: string; storagePath?: string; durationSeconds: 3; alt?: string }>>([]);
  const [vBgSlideshowTransition, setVBgSlideshowTransition] = useState<'soft' | 'hard' | 'very_soft' | 'medium'>('very_soft');
  const [proposedMediaMode, setProposedMediaMode] = useState<'youtube' | 'upload' | 'slideshow' | null>(null);

  // SECTION 3: Timed Reveal Draft States
  const [vBgButtonEnabled, setVBgButtonEnabled] = useState(false);
  const [vBgButtonStartSecond, setVBgButtonStartSecond] = useState(5);
  const [vBgButtonEndSecond, setVBgButtonEndSecond] = useState<number | undefined>(undefined);
  const [vBgButtonDuration, setVBgButtonDuration] = useState(0.8);
  const [vBgButtonStyle, setVBgButtonStyle] = useState<'fade' | 'slideUp' | 'soft'>('soft');

  const [vBgTextEnabled, setVBgTextEnabled] = useState(false);
  const [vBgTextContent, setVBgTextContent] = useState('');
  const [vBgTextX, setVBgTextX] = useState(50);
  const [vBgTextY, setVBgTextY] = useState(60);
  const [vBgTextSize, setVBgTextSize] = useState(16);
  const [vBgTextColor, setVBgTextColor] = useState('#FFFFFF');
  const [vBgTextOpacity, setVBgTextOpacity] = useState(100);
  const [vBgTextShadow, setVBgTextShadow] = useState(true);
  const [vBgTextRevealStartSecond, setVBgTextRevealStartSecond] = useState(2);
  const [vBgTextRevealDuration, setVBgTextRevealDuration] = useState(1);
  const [vBgTextVisibleAfterVideo, setVBgTextVisibleAfterVideo] = useState(true);

  // New textReveal specific
  const [vBgTextRevealEnabled, setVBgTextRevealEnabled] = useState(true);

  // SECTION 4: After sequence fallbacks
  const [vBgAfterBackgroundType, setVBgAfterBackgroundType] = useState<'none' | 'same' | 'image' | 'color' | 'gradient' | 'video_last_frame'>('video_last_frame');
  const [vBgAfterImageUrl, setVBgAfterImageUrl] = useState('');
  const [vBgAfterColor, setVBgAfterColor] = useState('#0B0B0B');
  const [vBgAfterGradient, setVBgAfterGradient] = useState('linear-gradient(135deg, #1C1C1E 0%, #0B0B0B 100%)');

  // New sequence after fields
  const [vBgAfterSequenceBackgroundType, setVBgAfterSequenceBackgroundType] = useState<'none' | 'same' | 'image' | 'color' | 'gradient' | 'video_last_frame'>('video_last_frame');
  const [vBgAfterSequenceImageUrl, setVBgAfterSequenceImageUrl] = useState('');
  const [vBgAfterSequenceColor, setVBgAfterSequenceColor] = useState('#0B0B0B');
  const [vBgAfterSequenceGradient, setVBgAfterSequenceGradient] = useState('linear-gradient(135deg, #1C1C1E 0%, #0B0B0B 100%)');
  const [vBgAfterSequenceTransition, setVBgAfterSequenceTransition] = useState<'hard' | 'medium' | 'soft' | 'very_soft'>('very_soft');
  const [designerImageMeta, setDesignerImageMeta] = useState<Record<string, any>>({});

  // Profile Image and Profile Text fields timed reveal states
  const [vBgProfileImageRevealEnabled, setVBgProfileImageRevealEnabled] = useState(true);
  const [vBgProfileImageRevealStartSecond, setVBgProfileImageRevealStartSecond] = useState(0);
  const [vBgProfileImageRevealFadeDuration, setVBgProfileImageRevealFadeDuration] = useState(1.0);
  const [vBgProfileImageRevealStaysVisible, setVBgProfileImageRevealStaysVisible] = useState(true);

  const [vBgTextTitleEnabled, setVBgTextTitleEnabled] = useState(true);
  const [vBgTextTitleStartSecond, setVBgTextTitleStartSecond] = useState(0);
  const [vBgTextTitleFadeDuration, setVBgTextTitleFadeDuration] = useState(1.0);
  const [vBgTextTitleStaysVisible, setVBgTextTitleStaysVisible] = useState(true);

  const [vBgTextSubtitleEnabled, setVBgTextSubtitleEnabled] = useState(true);
  const [vBgTextSubtitleStartSecond, setVBgTextSubtitleStartSecond] = useState(1);
  const [vBgTextSubtitleFadeDuration, setVBgTextSubtitleFadeDuration] = useState(1.0);
  const [vBgTextSubtitleStaysVisible, setVBgTextSubtitleStaysVisible] = useState(true);

  const [vBgTextDescEnabled, setVBgTextDescEnabled] = useState(true);
  const [vBgTextDescStartSecond, setVBgTextDescStartSecond] = useState(2);
  const [vBgTextDescFadeDuration, setVBgTextDescFadeDuration] = useState(1.0);
  const [vBgTextDescStaysVisible, setVBgTextDescStaysVisible] = useState(true);

  // Gated Feature Plan Lock Indicator
  const isPremiumLocked = currentPlan === 'starter';

  // Load configuration safely when dialog modal is rendered
  useEffect(() => {
    if (isOpen && activeCard) {
      setDesignerImageMeta(activeCard.imageMeta || {});
      // Set Standard
      setBgEnabled(activeCard.cardBackgroundEnabled !== false);
      setBgUrl(activeCard.cardBackgroundImageUrl || '');
      setBgMode(activeCard.cardBackgroundMode || 'cover');
      setBgDarken(activeCard.cardBackgroundDarken !== undefined ? activeCard.cardBackgroundDarken : 25);
      setBgSaturation(activeCard.cardBackgroundSaturation !== undefined ? activeCard.cardBackgroundSaturation : 100);
      setBgOffsetX(activeCard.cardBackgroundOffsetX !== undefined ? activeCard.cardBackgroundOffsetX : 0);
      setBgOffsetY(activeCard.cardBackgroundOffsetY !== undefined ? activeCard.cardBackgroundOffsetY : 0);
      setBgColor(activeCard.cardBackgroundColor || activeCard.backgroundColor || '#1C1C1E');
      setBgGradientEnabled(activeCard.cardBackgroundGradientEnabled || false);
      setBgGradientColor(activeCard.cardBackgroundGradientColor || '#0B0B0B');
      setBgGradientDirection(activeCard.cardBackgroundGradientDirection || '135deg');

      // Set Video config draft
      const conf = activeCard.videoBackgroundConfig || defaultVideoConfig;
      setVBgEnabled(conf.enabled || false);
      setVBgMode(conf.mode || 'youtube');
      setVBgDuration(conf.duration || 12);
      setVBgAspectRatio(conf.aspectRatio || '9:16');
      setVBgYoutubeUrl(conf.youtubeUrl || '');
      setVBgStartTimeSeconds(conf.startTimeSeconds || 0);
      setVBgTransition(conf.transition || 'soft');

      // Buttons
      const bEnabled = conf.buttonReveal?.enabled ?? true;
      const bStart = conf.buttonReveal?.startSecond ?? 5;
      const bDuration = conf.buttonReveal?.duration ?? 1.2;
      const bStyle = conf.buttonReveal?.style || 'soft';
      const currentDurationSecs = conf.durationSeconds || conf.duration || 12;
      let bEnd = conf.buttonReveal?.endSecond;
      if (bEnd === undefined) {
        if (conf.buttonReveal?.duration !== undefined) {
          bEnd = Math.min(bStart + conf.buttonReveal.duration, currentDurationSecs);
        } else if (bStart < currentDurationSecs) {
          bEnd = currentDurationSecs;
        } else {
          bEnd = Math.min(bStart + 1.2, currentDurationSecs);
        }
      }
      setVBgButtonEnabled(bEnabled);
      setVBgButtonStartSecond(bStart);
      setVBgButtonEndSecond(bEnd);
      setVBgButtonDuration(bDuration);
      setVBgButtonStyle(bStyle);

      // Custom Text Schild
      setVBgTextEnabled(conf.text?.enabled || false);
      setVBgTextContent(conf.text?.content || '');
      setVBgTextX(conf.text?.x ?? 50);
      setVBgTextY(conf.text?.y ?? 60);
      setVBgTextSize(conf.text?.size ?? 16);
      setVBgTextColor(conf.text?.color || '#FFFFFF');
      setVBgTextOpacity(conf.text?.opacity ?? 100);
      setVBgTextShadow(conf.text?.shadow !== false);
      setVBgTextRevealStartSecond(conf.text?.revealStartSecond ?? 3);
      setVBgTextRevealDuration(conf.text?.revealDuration ?? 1.2);
      setVBgTextVisibleAfterVideo(conf.text?.visibleAfterVideo !== false);

      // Fallbacks after Video
      let fallbackAfterBgType = conf.afterSequence?.backgroundType || conf.afterVideo?.backgroundType || 'video_last_frame';
      const fallbackAfterImageUrl = conf.afterSequence?.imageUrl || conf.afterVideo?.imageUrl || '';
      if (fallbackAfterImageUrl) {
        fallbackAfterBgType = 'image';
      } else if (fallbackAfterBgType === 'same' || fallbackAfterBgType === 'none') {
        fallbackAfterBgType = 'video_last_frame';
      }
      const fallbackAfterColor = conf.afterSequence?.color || conf.afterVideo?.color || '#0B0B0B';
      const fallbackAfterGradient = conf.afterSequence?.gradient || conf.afterVideo?.gradient || 'linear-gradient(135deg, #1C1C1E 0%, #0B0B0B 100%)';
      const fallbackTransition = conf.afterSequence?.transition || conf.transition || 'very_soft';

      setVBgAfterBackgroundType(fallbackAfterBgType);
      setVBgAfterImageUrl(fallbackAfterImageUrl);
      setVBgAfterColor(fallbackAfterColor);
      setVBgAfterGradient(fallbackAfterGradient);
      setVBgTransition(fallbackTransition as any);

      // Modern extended values migration loading mapper:
      setVBgMediaMode(conf.mediaMode || conf.mode || 'youtube');
      setVBgVideoFitMode(conf.videoFitMode || 'contain');
      const maxAllowedDuration = plan === 'starter' ? 10 : (plan === 'pro' ? 12 : 15);
      const loadedDuration = conf.durationSeconds || conf.duration || 12;
      setVBgDurationSeconds(Math.min(loadedDuration, maxAllowedDuration) as any);

      setVBgYoutubeMute(conf.youtube?.mute ?? true);
      if (conf.youtube) {
        setVBgYoutubeUrl(conf.youtube.url || conf.youtubeUrl || '');
        setVBgStartTimeSeconds(conf.youtube.startTimeSeconds ?? conf.startTimeSeconds ?? 0);
      } else {
        setVBgYoutubeUrl(conf.youtubeUrl || '');
        setVBgStartTimeSeconds(conf.startTimeSeconds || 0);
      }

      setVBgOriginalDuration(conf.upload?.originalDurationSeconds ?? undefined);
      setVBgOriginalFileName(conf.upload?.originalFileName ?? undefined);
      setVBgOriginalContentType(conf.upload?.originalContentType ?? undefined);
      setVBgOriginalSizeBytes(conf.upload?.originalSizeBytes ?? undefined);
      setVBgProcessingError(conf.upload?.processingError ?? undefined);
      setVBgStretchShortVideo(conf.upload?.stretchShortVideo ?? true);
      setVBgComputedPlaybackSpeed(conf.upload?.computedPlaybackSpeed ?? undefined);
      setVBgEffectiveVideoDuration(conf.upload?.effectiveVideoDurationSeconds ?? undefined);
      setVBgLocalPreviewUrl(conf.upload?.localPreviewUrl ?? undefined);
      setVBgStoragePath(conf.upload?.storagePath ?? undefined);
      
      // Load optimized fields
      setVBgOptimizedVideoUrl(conf.upload?.optimizedVideoUrl ?? undefined);
      setVBgOptimizedStoragePath(conf.upload?.optimizedStoragePath ?? undefined);
      setVBgProcessingJob(conf.videoProcessingJob || undefined);
      setVBgProcessingStatus(conf.upload?.processingStatus || 'not_started');

      const loadedSlideshow = conf.slideshow?.images || [];
      if (loadedSlideshow.length > 3) {
        setVBgSlideshowImages(loadedSlideshow.slice(0, 3));
      } else {
        setVBgSlideshowImages(loadedSlideshow);
      }
      setVBgSlideshowTransition(conf.slideshow?.transition || 'very_soft');

      setVBgTextRevealEnabled(conf.textReveal?.enabled ?? conf.text?.enabled ?? true);
      setVBgTextRevealStartSecond(conf.textReveal?.startSecond ?? conf.text?.revealStartSecond ?? 3);
      setVBgTextRevealDuration(conf.textReveal?.duration ?? conf.text?.revealDuration ?? 1.2);

      setVBgAfterSequenceBackgroundType(fallbackAfterBgType);
      setVBgAfterSequenceImageUrl(fallbackAfterImageUrl);
      setVBgAfterSequenceColor(fallbackAfterColor);
      setVBgAfterSequenceGradient(fallbackAfterGradient);
      setVBgAfterSequenceTransition(fallbackTransition);

      // Load Profile Image Timing
      const pir = conf.profileImageReveal || {
        enabled: true,
        startSecond: 0,
        fadeDuration: 1.0,
        staysVisibleAfterSequence: true,
      };
      setVBgProfileImageRevealEnabled(pir.enabled);
      setVBgProfileImageRevealStartSecond(pir.startSecond);
      setVBgProfileImageRevealFadeDuration(pir.fadeDuration);
      setVBgProfileImageRevealStaysVisible(pir.staysVisibleAfterSequence);

      // Load Profile Texts Timings
      const ptrs = conf.profileTextReveals || [];
      const titleR = ptrs.find((r: any) => r.fieldKey === 'title') || { enabled: true, startSecond: 0, fadeDuration: 1.0, staysVisibleAfterSequence: true };
      setVBgTextTitleEnabled(titleR.enabled);
      setVBgTextTitleStartSecond(titleR.startSecond);
      setVBgTextTitleFadeDuration(titleR.fadeDuration);
      setVBgTextTitleStaysVisible(titleR.staysVisibleAfterSequence);

      const subtitleR = ptrs.find((r: any) => r.fieldKey === 'subtitle') || { enabled: true, startSecond: 1, fadeDuration: 1.0, staysVisibleAfterSequence: true };
      setVBgTextSubtitleEnabled(subtitleR.enabled);
      setVBgTextSubtitleStartSecond(subtitleR.startSecond);
      setVBgTextSubtitleFadeDuration(subtitleR.fadeDuration);
      setVBgTextSubtitleStaysVisible(subtitleR.staysVisibleAfterSequence);

      const descR = ptrs.find((r: any) => r.fieldKey === 'description') || { enabled: true, startSecond: 2, fadeDuration: 1.0, staysVisibleAfterSequence: true };
      setVBgTextDescEnabled(descR.enabled);
      setVBgTextDescStartSecond(descR.startSecond);
      setVBgTextDescFadeDuration(descR.fadeDuration);
      setVBgTextDescStaysVisible(descR.staysVisibleAfterSequence);

      setActiveSegment('tiles');
      setIsDirty(false);
    }
  }, [isOpen, activeCard]);

  const showToast = (msg: string, isErr = false) => {
    setToastMessage(msg);
    setToastError(isErr);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const markDirty = () => {
    setIsDirty(true);
  };

  // Safe Standard Picture Upload & Auto Optimization
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate safe file types only
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast(lang === 'de' 
        ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!' 
        : 'Only JPG, PNG or WebP images are allowed!', 
        true
      );
      return;
    }

    try {
      setIsUploading(true);
      showToast(lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...');

      const optimizedBlob = await compressImageBeforeUpload(file, 'background');
      const downloadUrl = await uploadFile(activeCard.cardId, optimizedBlob, 'background');

      setBgUrl(downloadUrl);
      setBgEnabled(true);
      markDirty();

      // Store image quality metrics safely
      const meta = (optimizedBlob as any).imageMeta;
      if (meta) {
        setDesignerImageMeta(prev => ({ ...prev, background: meta }));
      }

      if (meta) {
        showToast(formatImageOptimizationToast(meta, lang || 'de'));
      } else {
        showToast(lang === 'de' ? 'Hintergrundbild hochgeladen' : 'Background image uploaded');
      }
    } catch (err: any) {
      console.error('Background upload failed:', err);
      showToast(lang === 'de' ? 'Upload fehlgeschlagen.' : 'Upload failed.', true);
    } finally {
      setIsUploading(false);
    }
  };

  // Safe Fallback Picture Upload (After Video image)
  const handleAfterVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate safe file types only
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast(lang === 'de' 
        ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!' 
        : 'Only JPG, PNG or WebP images are allowed!', 
        true
      );
      return;
    }

    try {
      setIsUploading(true);
      showToast(lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...');

      const optimizedBlob = await compressImageBeforeUpload(file, 'background');
      const downloadUrl = await uploadFile(activeCard.cardId, optimizedBlob, 'background');

      setVBgAfterImageUrl(downloadUrl);
      markDirty();

      // Store image quality metrics safely under afterVideo / after-sequence key
      const meta = (optimizedBlob as any).imageMeta;
      if (meta) {
        setDesignerImageMeta(prev => ({ ...prev, 'after-sequence': meta }));
      }

      if (meta) {
        showToast(formatImageOptimizationToast(meta, lang || 'de'));
      } else {
        showToast(lang === 'de' ? 'Hintergrund erfolgreich hochgeladen' : 'Background uploaded successfully');
      }
    } catch (err: any) {
      console.error('Video feedback background upload failed:', err);
      showToast(lang === 'de' ? 'Upload fehlgeschlagen.' : 'Upload failed.', true);
    } finally {
      setIsUploading(false);
    }
  };

  // Safe Direct Video Upload with step-by-step verification (Ziel 3)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveValidationError(null);
    setUploadProgress(0);
    setIsUploading(true);

    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const expectedStoragePath = `users/${activeCard?.ownerId}/cards/${activeCard?.cardId}/reel/video-original/${safeFileName}`;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    // Parameters for console diagnostic outputs (Ziel 2)
    const canUploadVideo = plan === 'pro' || plan === 'business';
    const durationLimitSeconds = plan === 'pro' ? 12 : (plan === 'business' ? 15 : 0);
    const maxAllowedOriginalSizeMb = plan === 'pro' ? 50 : (plan === 'business' ? 100 : 0);
    const targetMaxSizeMb = plan === 'pro' ? 10 : (plan === 'business' ? 15 : 0);

    const devLogDiagnostics = (stepName: string, status: 'success' | 'failed', detailedError?: any) => {
      console.log(`[DEV DIAGNOSTICS] Video upload flow: Step = ${stepName}, Status = ${status}`, {
        timestamp: new Date().toISOString(),
        authCurrentUserUid: profile?.userId || activeCard?.ownerId || 'N/A',
        cardId: activeCard?.cardId || 'N/A',
        cardOwnerId: activeCard?.ownerId || 'N/A',
        currentPlan: plan,
        canUploadVideo,
        maxAllowedOriginalSizeMb,
        durationLimitSeconds,
        targetMaxSizeMb,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileExtension,
        uploadPath: expectedStoragePath,
        expectedStorageRulePath: expectedStoragePath,
        firebaseErrorCode: detailedError?.code || detailedError?.status || 'N/A',
        firebaseErrorMessage: detailedError?.message || detailedError?.toString?.() || 'N/A'
      });
    };

    // ==========================================
    // SCHRITT 1: Plan prüfen (Ziel 3 / Ziel 6)
    // ==========================================
    if (!plan || (plan !== 'starter' && plan !== 'pro' && plan !== 'business')) {
      devLogDiagnostics('Plan Check', 'failed', { message: 'Plan details not resolved or loaded correctly.' });
      showToast(lang === 'de' 
        ? 'Dein Plan konnte nicht geprüft werden. Bitte lade die Seite neu.'
        : 'Your plan could not be verified. Please reload the page.',
        true
      );
      setVBgProcessingStatus('failed');
      setIsUploading(false);
      return;
    }

    if (plan === 'starter') {
      devLogDiagnostics('Plan Check', 'failed', { message: 'Video upload requires upgrade to Pro or Business.' });
      showToast(lang === 'de' 
        ? 'Video-Upload ist ab Pro verfügbar.' 
        : 'Video upload is available starting from Pro.', 
        true
      );
      setVBgProcessingStatus('failed');
      setIsUploading(false);
      return;
    }

    devLogDiagnostics('Plan Check', 'success');

    // ==========================================
    // SCHRITT 2: Dateigröße prüfen (Ziel 3 / Ziel 6)
    // ==========================================
    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > maxAllowedOriginalSizeMb) {
      const sizeErr = { message: `File size ${fileSizeMb.toFixed(2)} MB exceeds max original allowed ${maxAllowedOriginalSizeMb} MB` };
      devLogDiagnostics('Size Check', 'failed', sizeErr);
      showToast(lang === 'de'
        ? `Das Video ist zu groß. Erlaubt sind maximal ${maxAllowedOriginalSizeMb} MB.`
        : `The video is too large. Allowed is a maximum of ${maxAllowedOriginalSizeMb} MB.`,
        true
      );
      setVBgProcessingStatus('failed');
      setIsUploading(false);
      return;
    }

    devLogDiagnostics('Size Check', 'success');

    // ==========================================
    // SCHRITT 3: Format/MIME/Endung prüfen (Ziel 3 / Ziel 5 / Ziel 6)
    // ==========================================
    const allowedFormats = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm', 'application/octet-stream'];
    const allowedExtensions = ['mp4', 'mov', 'm4v', 'webm'];
    const isExtensionOk = allowedExtensions.includes(fileExtension);
    const lowercaseType = (file.type || '').toLowerCase();

    const isFormatOk = allowedFormats.includes(lowercaseType) || isExtensionOk;
    if (!isFormatOk) {
      const formatErr = { message: `File format (${file.type}) or extension (.${fileExtension}) not supported` };
      devLogDiagnostics('Format Check', 'failed', formatErr);
      showToast(lang === 'de' 
        ? 'Dieses Videoformat wird nicht unterstützt. Bitte nutze MP4, MOV, M4V oder WebM.' 
        : 'This video format is not supported. Please use MP4, MOV, M4V or WebM.', 
        true
      );
      setVBgProcessingStatus('failed');
      setIsUploading(false);
      return;
    }

    devLogDiagnostics('Format Check', 'success');

    // ==========================================
    // CONTENT TYPE SAUBER SETZEN (Ziel 6)
    // ==========================================
    let resolvedContentType = file.type;
    const lowerExtension = fileExtension.toLowerCase();
    if (lowerExtension === 'mp4') {
      resolvedContentType = 'video/mp4';
    } else if (lowerExtension === 'mov') {
      resolvedContentType = 'video/quicktime';
    } else if (lowerExtension === 'm4v') {
      resolvedContentType = 'video/x-m4v';
    } else if (lowerExtension === 'webm') {
      resolvedContentType = 'video/webm';
    } else if (!resolvedContentType || resolvedContentType === 'application/octet-stream') {
      resolvedContentType = 'video/mp4'; // fallback
    }

    const finalUploadedFile = new File([file], file.name, { type: resolvedContentType });

    // ==========================================
    // SCHRITT 4: Videodauer auslesen (Ziel 3)
    // ==========================================
    const objectUrl = URL.createObjectURL(finalUploadedFile);
    setVBgLocalPreviewUrl(objectUrl);
    setVBgMode('upload');
    setVBgMediaMode('upload');
    setVBgEnabled(true);
    setBgEnabled(true);

    // Clear old optimized video outputs until the new one is prepared
    setVBgOptimizedVideoUrl(undefined);
    setVBgOptimizedStoragePath(undefined);
    setVBgProcessingJob(undefined);
    setVBgProcessingStatus('local_preview');

    let extractedDuration: number | undefined;
    try {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = objectUrl;
      await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => {
          extractedDuration = videoEl.duration;
          resolve();
        };
        videoEl.onerror = () => {
          resolve();
        };
        setTimeout(() => {
          resolve();
        }, 4000);
      });
    } catch (metaErr: any) {
      console.warn('Could not extract browser duration metadata:', metaErr);
    }

    if (extractedDuration !== undefined && !isNaN(extractedDuration)) {
      const roundedDur = Math.round(extractedDuration * 10) / 10;
      if (roundedDur > 60) {
        devLogDiagnostics('Duration Check', 'failed', { message: `Video is too long (${roundedDur} seconds, max allowed 60s)` });
        showToast(lang === 'de' 
          ? 'Das Originalvideo darf maximal 60 Sekunden lang sein.' 
          : 'The original video must be at most 60 seconds long.', 
          true
        );
        setVBgLocalPreviewUrl(undefined);
        setVBgProcessingStatus('not_started');
        URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
        return;
      }
      setVBgOriginalDuration(roundedDur);

      // Warn user if it gets trimmed (but let them upload)
      if (roundedDur > durationLimitSeconds) {
        showToast(lang === 'de'
          ? `Das Video wird auf ${durationLimitSeconds} Sekunden gekürzt.`
          : `The video will be trimmed to ${durationLimitSeconds} seconds.`,
          false
        );
      }
    } else {
      setVBgOriginalDuration(undefined);
    }

    devLogDiagnostics('Duration Check', 'success');

    // ==========================================
    // SCHRITT 5: Storage-Pfad erzeugen (Ziel 3 / Ziel 4)
    // ==========================================
    // Handled inside FirebaseContext, we pass safe expected path indicator logging
    devLogDiagnostics('Storage Path Generation', 'success');

    // ==========================================
    // SCHRITT 6 & 7: Firebase Storage Upload & URL (Ziel 3 / Ziel 4 / Ziel 7)
    // ==========================================
    try {
      showToast(lang === 'de' ? 'Video wird hochgeladen...' : 'Uploading video...');

      // Capture metadata parameters in state
      setVBgOriginalFileName(finalUploadedFile.name);
      setVBgOriginalContentType(finalUploadedFile.type);
      setVBgOriginalSizeBytes(finalUploadedFile.size);

      const downloadUrl = await uploadFile(
        activeCard.cardId, 
        finalUploadedFile, 
        'reel-video', 
        (storagePathResolved) => {
          setVBgStoragePath(storagePathResolved);
        },
        (progressPercent) => {
          setUploadProgress(progressPercent);
        }
      );

      // Validate downloadUrl integrity
      if (!downloadUrl) {
        throw { code: 'download-url-null', message: 'Retrieve operation returned an empty string' };
      }

      setVBgYoutubeUrl(downloadUrl);
      setVBgProcessingStatus('uploaded');
      setVBgProcessingError(undefined);
      markDirty();

      setTimeout(() => {
        setVBgProcessingStatus('processing_pending');
      }, 500);

      devLogDiagnostics('Storage Upload', 'success');
      showToast(lang === 'de' ? 'Video hochgeladen und bereit zum Speichern' : 'Video uploaded and ready to save');
    } catch (uploadErr: any) {
      console.error('[Upload Flow Error Caught]', uploadErr);
      const errorCode = uploadErr.code || '';
      const errorMsg = uploadErr.message || '';

      // Detailed Developer Console Log of Firebase storage/unauthorized or other upload errors
      console.log('[FIREBASE DETAILED STORAGE ERROR DIAGNOSTICS]', {
        'Firebase error code': errorCode || 'N/A',
        'Firebase error message': errorMsg || 'N/A',
        'auth.currentUser.uid': user?.uid || 'N/A',
        'cardId': activeCard?.cardId || 'N/A',
        'card.ownerId': activeCard?.ownerId || 'N/A',
        'card.userId': activeCard?.ownerId || 'N/A',
        'uploadPath': `users/${user?.uid || 'N/A'}/cards/${activeCard?.cardId || 'N/A'}/reel/video-original/${file.name}`,
        'file.name': file.name,
        'file.type': file.type,
        'file.size': file.size,
        'plan': plan,
        'canUploadVideo': canUploadVideo,
        'maxAllowedSizeMb': maxAllowedOriginalSizeMb
      });

      devLogDiagnostics('Storage Upload', 'failed', uploadErr);

      // Format custom visual errors to users based on detailed codes (Ziel 1)
      let displayError = '';
      if (errorCode === 'storage/unauthorized' || errorCode === 'storage/forbidden' || errorMsg.includes('rules') || errorMsg.includes('blockiert') || errorMsg.includes('unauthorized') || errorMsg.includes('permission')) {
        displayError = lang === 'de'
          ? 'Der Video-Upload wurde von Firebase Storage blockiert. Bitte prüfe, ob du eingeloggt bist und ob dein Plan Video-Upload erlaubt.'
          : 'The video upload was blocked by Firebase Storage. Please verify that you are logged in and your current plan supports video uploads.';
      } else if (errorMsg.includes('quota') || errorCode === 'storage/quota-exceeded') {
        displayError = lang === 'de'
          ? 'Datei ist zu groß oder das Firebase Speicherlimit ist erschöpft.'
          : 'File size is too big or Storage storage quota exceeded.';
      } else if (errorCode.includes('network') || errorMsg.includes('network') || errorMsg.includes('Network') || errorMsg.includes('unterbrochen')) {
        displayError = lang === 'de'
          ? 'Der Upload wurde unterbrochen. Bitte versuche es erneut.'
          : 'The upload was interrupted. Please try again.';
      } else if (errorCode === 'download-url-null' || errorMsg.includes('download')) {
        displayError = lang === 'de'
          ? 'Das Video wurde hochgeladen, aber die Video-URL konnte nicht erstellt werden.'
          : 'The video was uploaded, but the video URL could not be created.';
      } else {
        displayError = lang === 'de'
          ? 'Upload fehlgeschlagen: ' + errorMsg
          : 'Upload failed: ' + errorMsg;
      }

      // Rollback to clean up uncompleted drafts gracefully (Ziel 3)
      setVBgYoutubeUrl('');
      setVBgStoragePath(undefined);
      setVBgOriginalFileName(undefined);
      setVBgOriginalDuration(undefined);
      setVBgOriginalSizeBytes(undefined);
      setVBgOriginalContentType(undefined);
      setVBgLocalPreviewUrl(undefined);
      setVBgProcessingStatus('failed');
      setVBgProcessingError(displayError);

      showToast(displayError, true);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = () => {
    setBgUrl('');
    markDirty();
  };

  const handleResetPosition = () => {
    setBgOffsetX(0);
    setBgOffsetY(0);
    markDirty();
  };

  const performMediaModeSwitch = (newMode: 'youtube' | 'upload' | 'slideshow') => {
    // Clear other modes' states
    if (newMode !== 'youtube') {
      setVBgYoutubeUrl('');
    }
    if (newMode !== 'slideshow') {
      setVBgSlideshowImages([]);
    }
    if (newMode !== 'upload') {
      setVBgOriginalFileName(undefined);
      setVBgOriginalDuration(undefined);
      setVBgStoragePath(undefined);
      setVBgProcessingStatus('not_started');
      setVBgLocalPreviewUrl(undefined);
      setVBgOptimizedVideoUrl(undefined);
    }

    setVBgMediaMode(newMode);
    setVBgMode(newMode === 'youtube' ? 'youtube' : 'upload');
    setProposedMediaMode(null);
    markDirty();
  };

  const handleMediaModeChange = (newMode: 'youtube' | 'upload' | 'slideshow') => {
    if (newMode === vBgMediaMode) return;

    if (newMode === 'upload' && isPremiumLocked) {
      setUpgradeModalFeature('advancedDesign');
      return;
    }

    // Check if other mode has content we would overwrite
    let hasContent = false;
    if (vBgMediaMode === 'youtube' && vBgYoutubeUrl.trim() !== '') {
      hasContent = true;
    } else if (vBgMediaMode === 'slideshow' && vBgSlideshowImages.length > 0) {
      hasContent = true;
    } else if (vBgMediaMode === 'upload' && (vBgStoragePath || vBgOriginalFileName)) {
      hasContent = true;
    }

    if (hasContent) {
      setProposedMediaMode(newMode);
    } else {
      performMediaModeSwitch(newMode);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSaveClick = async () => {
    try {
      setSaveValidationError(null);

      // Perform validation for Video Background uploads
      if (vBgEnabled && vBgMediaMode === 'upload') {
        const hasFileUrl = !!vBgYoutubeUrl && !vBgYoutubeUrl.includes('youtube.com');
        const hasStoragePath = !!vBgStoragePath;
        const hasOriginalMeta = !!vBgOriginalFileName && !!vBgOriginalSizeBytes && !!vBgOriginalContentType;
        const isSuccessfulStatus = vBgProcessingStatus === 'uploaded' || vBgProcessingStatus === 'processing_pending' || vBgProcessingStatus === 'ready';

        if (vBgProcessingStatus === 'processing_failed' || vBgProcessingStatus === 'failed') {
          const detailMsg = lang === 'de'
            ? 'Video wurde nicht erfolgreich hochgeladen. Bitte erneut versuchen.'
            : 'Video was not successfully uploaded. Please try again.';
          setSaveValidationError(detailMsg);
          showToast(detailMsg, true);
          return;
        }

        // If some required upload fields are missing, prevent establishing the job or using the video state
        if (!hasFileUrl || !hasStoragePath || !hasOriginalMeta || !isSuccessfulStatus) {
          const detailMsg = lang === 'de'
            ? 'Video wurde nicht erfolgreich hochgeladen oder die Upload-Metadaten sind unvollständig. Bitte erneut versuchen.'
            : 'Video was not successfully uploaded or some upload metadata is incomplete. Please try again.';
          setSaveValidationError(detailMsg);
          showToast(detailMsg, true);
          return;
        }
      }

      setIsSaving(true);

      const calculatedSlideshowTotal = vBgSlideshowImages.length * 3;
      const targetDurationLimit = vBgMediaMode === 'slideshow' ? calculatedSlideshowTotal : vBgDurationSeconds;

      // Determine active video processing job state
      let jobObject = vBgProcessingJob || undefined;
      const hasNewVideoUpload = vBgMediaMode === 'upload' && !!vBgStoragePath && 
        (vBgProcessingStatus === 'uploaded' || vBgProcessingStatus === 'processing_pending');

      if (hasNewVideoUpload && vBgStoragePath) {
        let planId: 'starter' | 'pro' | 'business' = 'starter';
        if (plan === 'business') planId = 'business';
        else if (plan === 'pro') planId = 'pro';

        const lastDot = vBgStoragePath.lastIndexOf('.');
        const baseName = lastDot !== -1 ? vBgStoragePath.substring(0, lastDot) : vBgStoragePath;
        const optimizedPath = baseName.replace('/reel/video-original/', '/reel/video-optimized/') + '.mp4';

        const durationLimit = planId === 'pro' ? 12 : 15;
        const targetMaxSize = planId === 'pro' ? 10 * 1024 * 1024 : 15 * 1024 * 1024;

        jobObject = {
          // User requested properties
          status: 'queued',
          originalStoragePath: vBgStoragePath,
          originalFileName: vBgOriginalFileName || '',
          originalSizeBytes: vBgOriginalSizeBytes || 0,
          originalContentType: vBgOriginalContentType || 'video/mp4',
          durationLimitSeconds: durationLimit,
          targetWidth: 720,
          targetHeight: 1280,
          targetMaxSizeBytes: targetMaxSize,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),

          // Internal companion fields for server back-compatibility
          plan: planId,
          optimizedStoragePath: optimizedPath,
          originalFileSizeBytes: vBgOriginalSizeBytes || 0,
          originalDurationSeconds: vBgOriginalDuration || undefined,
          targetDurationSeconds: durationLimit,
          targetMaxFileSizeMb: planId === 'pro' ? 10 : 15,
          targetResolution: '720x1280',
          targetCodec: 'H.264',
          targetContainer: 'MP4',
          audioMode: planId === 'pro' ? 'compressed' : 'keep',
          originalDeleteAfterProcessing: true
        };
      }

      const updates: Partial<Card> = {
        imageMeta: designerImageMeta,
        cardBackgroundEnabled: bgEnabled,
        cardBackgroundImageUrl: bgUrl,
        cardBackgroundMode: bgMode,
        cardBackgroundDarken: bgDarken,
        cardBackgroundSaturation: bgSaturation,
        cardBackgroundOffsetX: bgOffsetX,
        cardBackgroundOffsetY: bgOffsetY,
        cardBackgroundColor: bgColor,
        cardBackgroundGradientEnabled: bgGradientEnabled,
        cardBackgroundGradientColor: bgGradientColor,
        cardBackgroundGradientDirection: bgGradientDirection,
        videoBackgroundConfig: {
          enabled: vBgEnabled,
          mode: vBgMediaMode === 'youtube' ? 'youtube' : 'upload',
          duration: vBgDurationSeconds,
          aspectRatio: vBgAspectRatio,
          youtubeUrl: vBgYoutubeUrl,
          startTimeSeconds: vBgStartTimeSeconds,
          transition: vBgTransition,

          mediaMode: vBgMediaMode,
          videoFitMode: vBgVideoFitMode,
          durationSeconds: vBgDurationSeconds,
          stopAtSecond: vBgDurationSeconds,

          youtube: {
            url: vBgYoutubeUrl,
            startTimeSeconds: vBgStartTimeSeconds,
            mute: vBgYoutubeMute
          },

          upload: {
            fileUrl: vBgMediaMode === 'upload' ? vBgYoutubeUrl : undefined,
            localPreviewUrl: undefined, // Never store local ObjectURL in Firestore
            storagePath: vBgStoragePath || undefined,
            originalFileName: vBgOriginalFileName,
            originalContentType: vBgOriginalContentType,
            originalSizeBytes: vBgOriginalSizeBytes,
            originalDurationSeconds: vBgOriginalDuration,
            stretchShortVideo: vBgStretchShortVideo,
            computedPlaybackSpeed: vBgComputedPlaybackSpeed,
            effectiveVideoDurationSeconds: vBgEffectiveVideoDuration,
            processingStatus: vBgProcessingStatus,
            processingError: vBgProcessingError,

            // requested smaller, secure metadata fields
            originalStoragePath: vBgStoragePath || undefined,
            originalFileSize: vBgOriginalSizeBytes,
            originalDuration: vBgOriginalDuration,
            optimizedVideoUrl: vBgOptimizedVideoUrl || undefined,
            optimizedStoragePath: vBgOptimizedStoragePath || undefined,
          },

          videoProcessingJob: jobObject || null,

          slideshow: {
            images: vBgSlideshowImages,
            transition: vBgSlideshowTransition,
            totalDurationSeconds: calculatedSlideshowTotal
          },

          buttonReveal: {
            enabled: vBgButtonEnabled,
            startSecond: Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)),
            endSecond: Math.max(
              Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)) + 0.1,
              Math.min(vBgButtonEndSecond ?? targetDurationLimit, targetDurationLimit)
            ),
            duration: Math.max(
              0.1,
              Math.max(
                Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)) + 0.1,
                Math.min(vBgButtonEndSecond ?? targetDurationLimit, targetDurationLimit)
              ) - Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit))
            ),
            style: vBgButtonStyle
          },

          text: {
            enabled: vBgTextRevealEnabled,
            content: vBgTextContent,
            x: vBgTextX,
            y: vBgTextY,
            size: vBgTextSize,
            color: vBgTextColor,
            opacity: vBgTextOpacity,
            shadow: vBgTextShadow,
            revealStartSecond: Math.min(vBgTextRevealStartSecond, targetDurationLimit),
            revealDuration: vBgTextRevealDuration,
            visibleAfterVideo: vBgTextVisibleAfterVideo
          },

          textReveal: {
            enabled: vBgTextRevealEnabled,
            startSecond: Math.min(vBgTextRevealStartSecond, targetDurationLimit),
            duration: vBgTextRevealDuration
          },

          afterVideo: {
            backgroundType: vBgAfterImageUrl ? 'image' : 'same',
            imageUrl: vBgAfterImageUrl || undefined,
            color: vBgAfterColor,
            gradient: vBgAfterGradient
          },

          afterSequence: {
            enabled: true,
            backgroundType: vBgAfterImageUrl ? 'image' : 'video_last_frame',
            imageUrl: vBgAfterImageUrl || undefined,
            color: vBgAfterColor,
            gradient: vBgAfterGradient,
            transition: vBgTransition
          },

          profileImageReveal: {
            enabled: vBgProfileImageRevealEnabled,
            startSecond: Math.max(0, Math.min(vBgProfileImageRevealStartSecond, targetDurationLimit)),
            fadeDuration: vBgProfileImageRevealFadeDuration,
            staysVisibleAfterSequence: vBgProfileImageRevealStaysVisible
          },

          profileTextReveals: [
            { fieldKey: 'title', enabled: vBgTextTitleEnabled, startSecond: Math.max(0, Math.min(vBgTextTitleStartSecond, targetDurationLimit)), fadeDuration: vBgTextTitleFadeDuration, staysVisibleAfterSequence: vBgTextTitleStaysVisible },
            { fieldKey: 'subtitle', enabled: vBgTextSubtitleEnabled, startSecond: Math.max(0, Math.min(vBgTextSubtitleStartSecond, targetDurationLimit)), fadeDuration: vBgTextSubtitleFadeDuration, staysVisibleAfterSequence: vBgTextSubtitleStaysVisible },
            { fieldKey: 'description', enabled: vBgTextDescEnabled, startSecond: Math.max(0, Math.min(vBgTextDescStartSecond, targetDurationLimit)), fadeDuration: vBgTextDescFadeDuration, staysVisibleAfterSequence: vBgTextDescStaysVisible }
          ],

          processingTarget: {
            maxDurationSeconds: 15,
            maxFileSizeMb: 10,
            recommendedDurationSeconds: 12,
            preferredResolution: '720x1280',
            optionalResolution: '1080x1920',
            targetCodec: 'H.264',
            targetContainer: 'MP4',
            audioDefault: 'muted'
          }
        }
      };

      await onSave(updates);
      if (hasNewVideoUpload && activeCard?.cardId) {
        try {
          const idToken = await user?.getIdToken();
          const res = await fetch('/api/process-video-job', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
            },
            body: JSON.stringify({ cardId: activeCard.cardId, idToken })
          });
          if (!res.ok) {
            console.error('[process-video-job endpoint error]:', res.status, res.statusText);
            showToast(lang === 'de'
              ? 'Video wurde hochgeladen, aber die Optimierung konnte nicht gestartet werden.'
              : 'Video was uploaded, but the optimization could not be started.',
              true
            );
          }
        } catch (err) {
          console.error('[process-video-job fetch failed]:', err);
          showToast(lang === 'de'
            ? 'Video wurde hochgeladen, aber die Optimierung konnte nicht gestartet werden.'
            : 'Video was uploaded, but the optimization could not be started.',
            true
          );
        }
      }
      showToast(t.saved);
      setIsDirty(false);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error('Error saving background configurations:', err);
      showToast(t.failed, true);
    } finally {
      setIsSaving(false);
    }
  };

  // Safe YouTube url syntax check: youtube.com or youtu.be domains only
  const validateYouTubePattern = (url: string): boolean => {
    if (!url) return true; // empty is ok during edit
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
  };

  const isYoutubeUrlValid = validateYouTubePattern(vBgYoutubeUrl);

  if (!isOpen) return null;

  // Build reactive customized temporary preview card
  const calculatedSlideshowTotal = vBgSlideshowImages.length * 3;
  const targetDurationLimit = vBgMediaMode === 'slideshow' ? calculatedSlideshowTotal : vBgDurationSeconds;

  const previewCard: Partial<Card> = {
    ...activeCard,
    cardBackgroundEnabled: bgEnabled,
    cardBackgroundImageUrl: bgUrl,
    cardBackgroundMode: bgMode,
    cardBackgroundDarken: bgDarken,
    cardBackgroundSaturation: bgSaturation,
    cardBackgroundOffsetX: bgOffsetX,
    cardBackgroundOffsetY: bgOffsetY,
    cardBackgroundColor: bgColor,
    cardBackgroundGradientEnabled: bgGradientEnabled,
    cardBackgroundGradientColor: bgGradientColor,
    cardBackgroundGradientDirection: bgGradientDirection,
    videoBackgroundConfig: {
      enabled: vBgEnabled,
      mode: vBgMediaMode === 'youtube' ? 'youtube' : 'upload',
      duration: vBgDurationSeconds,
      aspectRatio: vBgAspectRatio,
      youtubeUrl: vBgYoutubeUrl,
      startTimeSeconds: vBgStartTimeSeconds,
      transition: vBgTransition,

      mediaMode: vBgMediaMode,
      videoFitMode: vBgVideoFitMode,
      durationSeconds: vBgDurationSeconds,
      stopAtSecond: vBgDurationSeconds,

      youtube: {
        url: vBgYoutubeUrl,
        startTimeSeconds: vBgStartTimeSeconds,
        mute: vBgYoutubeMute
      },

      upload: {
        fileUrl: vBgMediaMode === 'upload' ? vBgYoutubeUrl : undefined,
        localPreviewUrl: vBgLocalPreviewUrl,
        storagePath: vBgStoragePath,
        originalFileName: vBgOriginalFileName,
        originalContentType: vBgOriginalContentType,
        originalSizeBytes: vBgOriginalSizeBytes,
        originalDurationSeconds: vBgOriginalDuration,
        stretchShortVideo: vBgStretchShortVideo,
        computedPlaybackSpeed: vBgComputedPlaybackSpeed,
        effectiveVideoDurationSeconds: vBgEffectiveVideoDuration,
        processingStatus: vBgProcessingStatus,
        processingError: vBgProcessingError
      },

      slideshow: {
        images: vBgSlideshowImages,
        transition: vBgSlideshowTransition,
        totalDurationSeconds: calculatedSlideshowTotal
      },

      buttonReveal: {
        enabled: vBgButtonEnabled,
        startSecond: Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)),
        endSecond: Math.max(
          Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)) + 0.1,
          Math.min(vBgButtonEndSecond ?? targetDurationLimit, targetDurationLimit)
        ),
        duration: Math.max(
          0.1,
          Math.max(
            Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit)) + 0.1,
            Math.min(vBgButtonEndSecond ?? targetDurationLimit, targetDurationLimit)
          ) - Math.max(0, Math.min(vBgButtonStartSecond, targetDurationLimit))
        ),
        style: vBgButtonStyle,
      },

      text: {
        enabled: vBgTextRevealEnabled,
        content: vBgTextContent,
        x: vBgTextX,
        y: vBgTextY,
        size: vBgTextSize,
        color: vBgTextColor,
        opacity: vBgTextOpacity,
        shadow: vBgTextShadow,
        revealStartSecond: vBgTextRevealStartSecond,
        revealDuration: vBgTextRevealDuration,
        visibleAfterVideo: vBgTextVisibleAfterVideo,
      },

      textReveal: {
        enabled: vBgTextRevealEnabled,
        startSecond: vBgTextRevealStartSecond,
        duration: vBgTextRevealDuration
      },

      afterVideo: {
        backgroundType: vBgAfterImageUrl ? 'image' : 'same',
        imageUrl: vBgAfterImageUrl || undefined,
        color: vBgAfterColor,
        gradient: vBgAfterGradient,
      },

      afterSequence: {
        enabled: true,
        backgroundType: vBgAfterImageUrl ? 'image' : 'video_last_frame',
        imageUrl: vBgAfterImageUrl || undefined,
        color: vBgAfterColor,
        gradient: vBgAfterGradient,
        transition: vBgTransition
      },

      profileImageReveal: {
        enabled: vBgProfileImageRevealEnabled,
        startSecond: Math.max(0, Math.min(vBgProfileImageRevealStartSecond, targetDurationLimit)),
        fadeDuration: vBgProfileImageRevealFadeDuration,
        staysVisibleAfterSequence: vBgProfileImageRevealStaysVisible
      },

      profileTextReveals: [
        { fieldKey: 'title', enabled: vBgTextTitleEnabled, startSecond: Math.max(0, Math.min(vBgTextTitleStartSecond, targetDurationLimit)), fadeDuration: vBgTextTitleFadeDuration, staysVisibleAfterSequence: vBgTextTitleStaysVisible },
        { fieldKey: 'subtitle', enabled: vBgTextSubtitleEnabled, startSecond: Math.max(0, Math.min(vBgTextSubtitleStartSecond, targetDurationLimit)), fadeDuration: vBgTextSubtitleFadeDuration, staysVisibleAfterSequence: vBgTextSubtitleStaysVisible },
        { fieldKey: 'description', enabled: vBgTextDescEnabled, startSecond: Math.max(0, Math.min(vBgTextDescStartSecond, targetDurationLimit)), fadeDuration: vBgTextDescFadeDuration, staysVisibleAfterSequence: vBgTextDescStaysVisible }
      ],

      processingTarget: {
        maxDurationSeconds: 15,
        maxFileSizeMb: 10,
        preferredResolution: '720x1280',
        optionalResolution: '1080x1920',
        targetCodec: 'H.264',
         targetContainer: 'MP4',
        audioDefault: 'muted',
      }
    }
  };

  const maxDurationCap = vBgMediaMode === 'slideshow' ? calculatedSlideshowTotal : vBgDurationSeconds;

  return (
    <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-md flex items-end md:items-stretch justify-center overflow-hidden">
      <div className="w-full h-[95vh] md:h-full bg-stone-950 flex flex-col items-stretch justify-start overflow-hidden rounded-t-[32px] md:rounded-t-none border-t border-stone-850 md:border-t-0 shadow-2xl transition-all duration-300">
        
        {/* TOAST PANEL */}
        {toastMessage && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-55 px-5 py-3 rounded-2xl flex items-center gap-2 border shadow-lg text-xs font-black tracking-wide uppercase transition-all duration-200 animate-slide-up ${
            toastError 
              ? 'bg-red-950/90 text-red-300 border-red-900/50' 
              : 'bg-stone-900/90 text-[#A855F7] border-[#A855F7]/30'
          }`}>
            <LucideIcons.Info size={13} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MODAL HEADER */}
        <div className="flex-none px-4 md:px-6 h-14 md:h-16 border-b border-stone-850 flex items-center justify-between bg-stone-950 text-white z-20">
          <div className="flex items-center gap-3">
            {activeSegment !== 'tiles' && (
              <button
                type="button"
                onClick={() => setActiveSegment('tiles')}
                className="p-2 border border-stone-800 rounded-xl hover:bg-stone-900 text-[#A855F7] transition cursor-pointer"
                title="Zurück zum Hauptmenü"
              >
                <LucideIcons.ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                {t.title}
              </h2>
              {activeSegment !== 'tiles' && (
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-black flex items-center gap-1 mt-0.5">
                  <span className="text-[#A855F7]">★</span> {t.tiles[`group${activeSegment === 'background' ? 1 : activeSegment === 'video' ? 2 : 3}`]}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-900 rounded-xl border border-transparent hover:border-stone-800 transition cursor-pointer"
          >
            <LucideIcons.X size={18} />
          </button>
        </div>

        {/* WORKSPACE - RESPONSIVE SPLIT LAYOUT */}
        <div className="flex-grow min-h-0 flex flex-col md:flex-row overflow-hidden bg-stone-950">

          {/* TEST PANEL START */}
          <div className="w-full md:w-[41%] xl:w-[35%] flex-1 flex flex-col min-h-0 bg-[#0a0a09] p-4 md:p-5 relative select-none scrollbar-thin text-stone-300 md:h-full overflow-y-auto shrink-0 order-2 md:order-1 font-sans border-t md:border-t-0 md:border-r border-stone-850/60 pb-20">
            
            {/* If we are on 'tiles' (Overview / step wizard menu) */}
            {activeSegment === 'tiles' ? (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className="pb-3 border-b border-stone-850/60">
                  <h3 className="text-stone-200 text-xs font-black uppercase tracking-wider">
                    {lang === 'de' ? 'Arbeitsschritte wählen' : 'Select Edit Step'}
                  </h3>
                  <p className="text-[10.5px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                    {lang === 'de' ? 'Passe deinen Reel- & Kartenhintergrund in Schritten an' : 'Customize your reel & card step by step'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-1">
                  {/* Step 1: Hintergrund */}
                  <button
                    type="button"
                    onClick={() => setActiveSegment('background')}
                    className="w-full h-26 px-7 py-5.5 bg-stone-900 border border-stone-800 hover:border-[#A855F7]/45 hover:bg-stone-855 rounded-2xl flex items-center justify-between text-left transition duration-200 shadow-md cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-4.5 bg-stone-950 text-[#A855F7] group-hover:text-white rounded-xl border border-stone-850 transition-colors">
                        <LucideIcons.Palette size={24} />
                      </div>
                      <div>
                        <div className="text-sm sm:text-[14.5px] font-black uppercase text-white tracking-wide">
                          {lang === 'de' ? '1. Hintergrund' : '1. Background'}
                        </div>
                        <div className="text-[10.5px] sm:text-[11.5px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                          {lang === 'de' ? 'Bild, Farbe, Verlauf & Standansicht' : 'Image, color, gradient & static view'}
                        </div>
                      </div>
                    </div>
                    <LucideIcons.ChevronRight size={20} className="text-stone-500 group-hover:text-[#A855F7] transition-colors" />
                  </button>

                  {/* Step 2: Reelbereich / Reel-Einstieg */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSegment('video');
                    }}
                    className="w-full h-26 px-7 py-5.5 bg-stone-900 border border-stone-800 hover:border-[#A855F7]/45 hover:bg-stone-855 rounded-2xl flex items-center justify-between text-left transition duration-200 shadow-md cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-4.5 bg-stone-950 text-[#A855F7] group-hover:text-white rounded-xl border border-stone-850 relative transition-colors">
                        <LucideIcons.Tv size={24} />
                      </div>
                      <div>
                        <div className="text-sm sm:text-[14.5px] font-black uppercase text-white tracking-wide">
                          {lang === 'de' ? '2. Reel-Einstieg' : '2. Reel Intro'}
                        </div>
                        <div className="text-[10.5px] sm:text-[11.5px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                          {lang === 'de' ? 'Starte deine digitale Karte mit einem kurzen Video' : 'Start your digital card with a short video'}
                        </div>
                      </div>
                    </div>
                    <LucideIcons.ChevronRight size={20} className="text-stone-500 group-hover:text-[#A855F7] transition-colors" />
                  </button>

                  {/* Step 3: Profil & Zeitsteuerung */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPremiumLocked) {
                        setUpgradeModalFeature('advancedDesign');
                      } else {
                        setActiveSegment('text');
                      }
                    }}
                    className="w-full h-26 px-7 py-5.5 bg-stone-900 border border-stone-800 hover:border-[#A855F7]/45 hover:bg-stone-855 rounded-2xl flex items-center justify-between text-left transition duration-200 shadow-md cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-4.5 bg-stone-950 text-[#A855F7] group-hover:text-white rounded-xl border border-stone-850 relative transition-colors">
                        <LucideIcons.Sparkles size={24} />
                        {isPremiumLocked && <LucideIcons.Lock size={10} className="absolute top-1 right-1 text-[#A855F7]" />}
                      </div>
                      <div>
                        <div className="text-sm sm:text-[14.5px] font-black uppercase text-white tracking-wide">
                          {lang === 'de' ? '3. Profil & Zeitsteuerung' : '3. Profile & Timing Control'}
                        </div>
                        <div className="text-[10.5px] sm:text-[11.5px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                          {lang === 'de' ? 'Profil, Texte und Buttons einblenden' : 'Fade in profile, texts & buttons'}
                        </div>
                      </div>
                    </div>
                    <LucideIcons.ChevronRight size={20} className="text-stone-550 group-hover:text-[#A855F7] transition-colors" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* Back Button (Back to Overview) */}
                <button
                  type="button"
                  onClick={() => setActiveSegment('tiles')}
                  className="w-full h-11 bg-stone-900 hover:bg-stone-850 text-[#A855F7] border border-stone-800 hover:border-[#A855F7]/30 rounded-xl font-black uppercase text-[10px] tracking-widest transition flex items-center justify-center gap-2 cursor-pointer shadow-inner mb-2 shrink-0"
                >
                  <LucideIcons.ArrowLeft size={14} />
                  <span>{lang === 'de' ? 'Zurück zur Übersicht' : 'Back to overview'}</span>
                </button>
                
                {/* The subforms content will render here contextually since they are child components of this left container */}
                {/* Visual marker */}
                <div className="h-0.5 bg-stone-850/40 w-full mb-3 rounded" />
              </div>
            )}


            {/* SEGMENT 1: STANDARD BACKGROUND DETAILS */}
            {activeSegment === 'background' && (
              <div className="space-y-6 animate-fade-in text-stone-300">
                
                {/* Activation Switch */}
                <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black uppercase text-[#F5EFE3]">Kartenhintergrund aktivieren</h5>
                    <p className="text-[9px] text-stone-400 uppercase font-bold tracking-wider mt-0.5">Soll der benutzerdefinierte Hintergrund aktiv sein?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBgEnabled(!bgEnabled);
                      markDirty();
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${bgEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${bgEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {bgEnabled && (
                  <div className="space-y-5 animate-fadeIn">
                    
                    {/* Upload Base Photo */}
                    <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-3.5">
                      <label className="text-xs font-black uppercase tracking-wide text-stone-300 block">
                        Statische Bilddatei
                      </label>
                      
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {bgUrl ? (
                          <div className="w-16 h-24 rounded-xl border border-stone-800 bg-stone-900 overflow-hidden shrink-0 relative group">
                            <img src={bgUrl} alt="Hintergrund" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-24 rounded-xl border border-dashed border-stone-800 flex items-center justify-center shrink-0">
                            <LucideIcons.Image size={18} className="text-stone-500" />
                          </div>
                        )}
                        <div className="flex-grow flex flex-col sm:flex-row gap-2.5 w-full">
                          <label className="flex-grow bg-stone-900 hover:bg-stone-850 py-3 px-4 rounded-xl border border-stone-805 hover:border-stone-700 transition flex items-center justify-center gap-2 cursor-pointer select-none text-xs text-stone-300 font-bold">
                            <LucideIcons.Upload size={13} className="text-[#A855F7]" />
                            <span>{t.uploadBackground}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          {bgUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer select-none"
                            >
                              <LucideIcons.Trash2 size={13} />
                              <span>{t.removeBackground}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Image formatting options (cover vs contain) */}
                    {bgUrl && (
                      <div className="grid grid-cols-2 gap-3 bg-stone-900/30 border border-stone-850 rounded-2xl p-4">
                        <button
                          type="button"
                          onClick={() => { setBgMode('cover'); markDirty(); }}
                          className={`py-3 px-4 border rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${bgMode === 'cover' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
                        >
                          <LucideIcons.LayoutGrid size={13} />
                          <span>{t.cover}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setBgMode('contain'); markDirty(); }}
                          className={`py-3 px-4 border rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${bgMode === 'contain' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950' : 'bg-stone-900 border-stone-800 text-stone-400'}`}
                        >
                          <LucideIcons.Maximize size={13} />
                          <span>{t.contain}</span>
                        </button>
                      </div>
                    )}

                    {/* Absolute coordinates offsets */}
                    {bgUrl && (
                      <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black uppercase text-stone-300">Ausrichtung & Position</label>
                          <button
                            type="button"
                            onClick={handleResetPosition}
                            className="text-[9px] font-black uppercase tracking-wider text-[#A855F7] bg-stone-950 border border-stone-800 py-1 px-3 rounded-lg hover:bg-stone-900 transition cursor-pointer"
                          >
                            Reset offset
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-stone-400">
                              <span>{t.offsetX}</span>
                              <span className="text-[#A855F7] font-bold">{bgOffsetX}px</span>
                            </div>
                            <input
                              type="range"
                              min="-300"
                              max="300"
                              value={bgOffsetX}
                              onChange={(e) => { setBgOffsetX(Number(e.target.value)); markDirty(); }}
                              className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono text-stone-400">
                              <span>{t.offsetY}</span>
                              <span className="text-[#A855F7] font-bold">{bgOffsetY}px</span>
                            </div>
                            <input
                              type="range"
                              min="-300"
                              max="300"
                              value={bgOffsetY}
                              onChange={(e) => { setBgOffsetY(Number(e.target.value)); markDirty(); }}
                              className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Darken/Saturation Adjusters */}
                    <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-stone-300">
                          <span className="font-sans font-bold uppercase">{t.darken}</span>
                          <span className="text-[#A855F7] font-bold">{bgDarken}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="95"
                          value={bgDarken}
                          onChange={(e) => { setBgDarken(Number(e.target.value)); markDirty(); }}
                          className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                        />
                      </div>

                      {bgUrl && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-stone-300">
                            <span className="font-sans font-bold uppercase">{t.saturation}</span>
                            <span className="text-[#A855F7] font-bold">{bgSaturation}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={bgSaturation}
                            onChange={(e) => { setBgSaturation(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Solid Background Color & Quick Picks */}
                    <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-grow space-y-1">
                          <label className="text-xs font-black uppercase text-stone-300 block">{t.bgColor}</label>
                          <p className="text-[9px] text-stone-450 uppercase font-semibold">Standardfarbe, wenn kein statisches Bild oder Verlauf definiert ist.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => { setBgColor(e.target.value); markDirty(); }}
                            className="bg-stone-950 border border-stone-800 rounded-xl p-1 h-9 w-14 cursor-pointer outline-none"
                          />
                          <input
                            type="text"
                            value={bgColor.toUpperCase()}
                            onChange={(e) => { setBgColor(e.target.value); markDirty(); }}
                            className="w-20 bg-stone-950 border border-stone-800 rounded-xl py-2 text-center text-xs text-stone-200 outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-2.5 items-center bg-stone-950/20 p-2 rounded-xl border border-stone-850/40">
                        {['#1C1C1E', '#A855F7', '#F5F0E6', '#FFFFFF', '#0F1E12', '#121021', '#1B0B1A', '#281105'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { setBgColor(c); markDirty(); }}
                            className="w-6.5 h-6.5 border border-stone-900 rounded-full hover:scale-110 transition cursor-pointer"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Gradient Section */}
                    <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4 block">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-black uppercase text-stone-300 block">{t.gradientEnable}</label>
                          <p className="text-[9px] text-stone-450 uppercase font-semibold">Mische die Hauptfarbe mit einer Endfarbe.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setBgGradientEnabled(!bgGradientEnabled); markDirty(); }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${bgGradientEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${bgGradientEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {bgGradientEnabled && (
                        <div className="space-y-4 animate-fadeIn pt-2 border-t border-stone-850">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-300">{t.gradientColor}</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={bgGradientColor}
                                onChange={(e) => { setBgGradientColor(e.target.value); markDirty(); }}
                                className="bg-stone-950 border border-stone-800 rounded-xl p-1 h-9 w-14 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={bgGradientColor.toUpperCase()}
                                onChange={(e) => { setBgGradientColor(e.target.value); markDirty(); }}
                                className="w-20 bg-stone-950 border border-stone-800 rounded-xl py-2 text-center text-xs text-stone-200 outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-medium text-stone-300 block">{t.gradientDir}</span>
                            <select
                              value={bgGradientDirection}
                              onChange={(e) => { setBgGradientDirection(e.target.value); markDirty(); }}
                              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
                            >
                              <option value="135deg">Diagonal (von oben links)</option>
                              <option value="90deg">Horizontal (von links nach rechts)</option>
                              <option value="180deg">Vertikal (von oben nach unten)</option>
                              <option value="45deg">Umgekehrt Diagonal</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* SEGMENT 2: VIDEO / REEL SETTINGS */}
            {activeSegment === 'video' && (
              <div className="space-y-6 animate-fade-in text-stone-300">
                
                {/* Enable custom Video background */}
                <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black uppercase text-[#F5EFE3]">{t.video.enable}</h5>
                    <p className="text-[9px] text-stone-400 uppercase font-bold tracking-wider mt-0.5">Ersetzt das Standard-Hintergrundbild mit einem Video-Reel oder Bilder-Slideshow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVBgEnabled(!vBgEnabled);
                      if (!vBgEnabled) {
                        // Automatically enable base backgrounds for safety
                        setBgEnabled(true);
                      }
                      markDirty();
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {vBgEnabled && (
                  <div className="space-y-5 animate-fadeIn font-medium">
                    
                    {/* Media source selectors */}
                    <div className="space-y-3 bg-stone-900/30 border border-stone-850 rounded-2xl p-4">
                      {proposedMediaMode !== null ? (
                        <div className="space-y-3 animate-fadeIn">
                          <div className="flex items-start gap-3">
                            <LucideIcons.AlertTriangle className="shrink-0 text-[#A855F7] mt-0.5" size={18} />
                            <div>
                              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                {lang === 'de' ? 'Quelle wechseln?' : 'Change Source?'}
                              </h4>
                              <p className="text-[10px] text-stone-300 font-bold leading-normal mt-1">
                                {lang === 'de' 
                                  ? 'Du kannst nur einen Reel-Einstieg gleichzeitig nutzen. Soll die aktuelle Quelle ersetzt werden?' 
                                  : 'You can only use one reel entry at a time. Should the current source be replaced?'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setProposedMediaMode(null)}
                              className="py-1.5 px-3 bg-stone-950 border border-stone-850 hover:bg-stone-900 text-stone-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                            >
                              {lang === 'de' ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => performMediaModeSwitch(proposedMediaMode)}
                              className="py-1.5 px-3 bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
                            >
                              {lang === 'de' ? 'Ja, ersetzen' : 'Yes, replace'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] text-stone-400 font-extrabold uppercase block">
                            {lang === 'de' ? 'Reel-Einstieg Quelle' : 'Reel Entry Source'}
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMediaModeChange('youtube')}
                              className={`py-2 px-1 border rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[56px] ${vBgMediaMode === 'youtube' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-black' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-855'}`}
                            >
                              <LucideIcons.Youtube size={14} />
                              <span>{lang === 'de' ? 'Videolink' : 'Video Link'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMediaModeChange('slideshow')}
                              className={`py-2 px-1 border rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[56px] ${vBgMediaMode === 'slideshow' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-black' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-855'}`}
                            >
                              <LucideIcons.Layers size={14} />
                              <span>Slideshow</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMediaModeChange('upload')}
                              className={`py-2 px-1 border rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[56px] relative overflow-hidden ${vBgMediaMode === 'upload' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-black' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-855'}`}
                            >
                              <LucideIcons.Video size={14} />
                              <span>{lang === 'de' ? 'Eigenes Video' : 'Own Video'}</span>
                              {isPremiumLocked && (
                                <span className="absolute top-0.5 right-0.5 text-[#A855F7] bg-stone-950/70 p-0.5 rounded-bl">
                                  <LucideIcons.Lock size={8} />
                                </span>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* YouTube Input tab */}
                    {vBgMediaMode === 'youtube' && (
                      <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-3">
                        <label className="text-xs font-black uppercase text-stone-300 block">{t.video.youtubeUrl}</label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={vBgYoutubeUrl}
                            placeholder="https://www.youtube.com/watch?v=..."
                            onChange={(e) => {
                              setVBgYoutubeUrl(e.target.value);
                              markDirty();
                            }}
                            className={`w-full bg-stone-950 border ${!isYoutubeUrlValid && vBgYoutubeUrl ? 'border-red-500 focus:outline-red-500' : 'border-stone-800 focus:outline-[#A855F7]'} rounded-xl px-3.5 py-2.5 text-xs text-stone-200`}
                          />
                          {vBgYoutubeUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setVBgYoutubeUrl('');
                                markDirty();
                              }}
                              className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-500 py-1.5 px-3 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                            >
                              <LucideIcons.Trash2 size={12} />
                              <span>{lang === 'de' ? 'Videolink entfernen' : 'Remove video link'}</span>
                            </button>
                          )}
                        </div>
                        {!isYoutubeUrlValid && vBgYoutubeUrl && (
                          <p className="text-[10px] text-red-400 font-semibold">{lang === 'de' ? 'Achtung: Dies ist kein unterstützter YouTube-Link.' : 'Attention: This is not a supported YouTube domain.'}</p>
                        )}
                        <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                          {t.video.youtubeTip}
                        </p>
                      </div>
                    )}

                    {/* Slideshow Option Tab */}
                    {vBgMediaMode === 'slideshow' && (
                      <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                        <div className="text-xs font-black uppercase text-stone-300">Bilder-Slideshow (1-4 Bilder)</div>
                        <div className="text-[10px] text-stone-400 font-semibold leading-relaxed font-sans">
                          {lang === 'de'
                            ? 'Lade bis zu 4 Bilder hoch. Jedes Bild wird automatisch für 3 Sekunden eingeblendet.'
                            : 'Upload up to 4 images. Each image will be displayed automatically for 3 seconds.'}
                        </div>

                        {/* Transitions hard/soft selector */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] text-stone-400 font-black uppercase block">Übergangseffekt</span>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => { setVBgSlideshowTransition('soft'); markDirty(); }}
                              className={`py-2 px-3 border rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${vBgSlideshowTransition === 'soft' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-black' : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'}`}
                            >
                              <LucideIcons.Blend size={12} />
                              Weich (Fade)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setVBgSlideshowTransition('hard'); markDirty(); }}
                              className={`py-2 px-3 border rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${vBgSlideshowTransition === 'hard' ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-black' : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'}`}
                            >
                              <LucideIcons.Slash size={12} />
                              Hart (Schnitt)
                            </button>
                          </div>
                        </div>

                        {/* Slots grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {[0, 1, 2, 3].map((slotIdx) => {
                            const existingImg = vBgSlideshowImages[slotIdx];
                            return (
                              <div key={slotIdx} className="bg-stone-950 border border-stone-850 p-3 rounded-xl flex flex-col justify-between h-42 items-stretch gap-2.5 relative">
                                <span className="text-[10px] text-stone-500 font-black uppercase font-mono">Bild {slotIdx + 1}</span>
                                {existingImg ? (
                                  <div className="flex-grow flex flex-col justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-14 rounded-lg bg-stone-900 border border-stone-850 overflow-hidden shrink-0">
                                        <img src={existingImg.url} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-grow">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newImages = vBgSlideshowImages.filter((_, i) => i !== slotIdx);
                                            setVBgSlideshowImages(newImages);
                                            markDirty();
                                          }}
                                          className="text-[9px] bg-red-955/20 hover:bg-red-950/40 border border-red-900/30 text-red-100 hover:text-red-300 font-black py-1 px-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                          <LucideIcons.Trash2 size={9} />
                                          Löschen
                                        </button>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Alt-Text (optional)"
                                      value={existingImg.alt || ''}
                                      onChange={(e) => {
                                        const newImages = [...vBgSlideshowImages];
                                        newImages[slotIdx] = { ...newImages[slotIdx], alt: e.target.value };
                                        setVBgSlideshowImages(newImages);
                                        markDirty();
                                      }}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-[9px] text-stone-250 font-bold focus:outline-[#A855F7]"
                                    />
                                  </div>
                                ) : (
                                  <label className="flex-grow border border-dashed border-stone-855 hover:border-[#A855F7]/50 bg-stone-900/30 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-900/60 transition-colors">
                                    <LucideIcons.Plus size={12} className="text-[#A855F7]" />
                                    <span className="text-[8px] text-[#A855F7] uppercase font-black tracking-widest">Hochladen</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Validate safe file types only
                                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                                        if (!validTypes.includes(file.type.toLowerCase())) {
                                          showToast(lang === 'de' 
                                            ? 'Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt!' 
                                            : 'Only JPG, PNG or WebP images are allowed!', 
                                            true
                                          );
                                          return;
                                        }

                                        try {
                                          setIsUploading(true);
                                          showToast(lang === 'de' ? 'Bild wird optimiert...' : 'Optimizing image...');
                                          const optimizedBlob = await compressImageBeforeUpload(file, 'slideshow');
                                          const downloadUrl = await uploadFile(activeCard.cardId, optimizedBlob, 'background');
                                          
                                          const newImageItem = {
                                            url: downloadUrl,
                                            durationSeconds: 3 as const,
                                            alt: ''
                                          };
                                          const newImages = [...vBgSlideshowImages];
                                          newImages[slotIdx] = newImageItem;
                                          setVBgSlideshowImages(newImages.filter(Boolean));
                                          markDirty();

                                          // Store image optimization metrics safely under slideshow slot
                                          const meta = (optimizedBlob as any).imageMeta;
                                          if (meta) {
                                            setDesignerImageMeta(prev => ({ ...prev, [`slideshow_${slotIdx}`]: meta }));
                                            showToast(formatImageOptimizationToast(meta, lang || 'de'));
                                          } else {
                                            showToast(lang === 'de' ? 'Bild hochgeladen' : 'Image uploaded');
                                          }
                                        } catch (err) {
                                          showToast(lang === 'de' ? 'Hochladen fehlgeschlagen' : 'Upload failed', true);
                                        } finally {
                                          setIsUploading(false);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-stone-900/40 p-2.5 border border-stone-850/65 rounded-xl text-[10px] flex justify-between font-bold text-stone-450 uppercase">
                          <span>GESAMTDAUER DER SLIDESHOW:</span>
                          <span className="text-white font-black">{calculatedSlideshowTotal} Sekunden</span>
                        </div>
                      </div>
                    )}

                    {/* Direct Video Upload Tab */}
                    {vBgMediaMode === 'upload' && (
                      <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                        <div className="text-xs font-black uppercase text-stone-300">
                          {lang === 'de' ? 'Eigenes Video hochladen' : 'Upload Own Video'}
                        </div>
                        
                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={videoFileInputRef}
                          accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />

                        {isUploading ? (
                          /* Upload Progress Card (Ziel 7) */
                          <div className="bg-stone-950 border border-stone-850 p-5 rounded-2xl space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-stone-300 font-bold shrink-0">
                                <LucideIcons.Loader2 className="animate-spin text-[#A855F7]" size={16} />
                                <span>
                                  {uploadProgress !== null && uploadProgress < 100 
                                    ? (lang === 'de' ? 'Video wird hochgeladen...' : 'Uploading video...')
                                    : (lang === 'de' ? 'Video wird vorbereitet...' : 'Preparing video...')}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] font-black text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/20 px-1.5 py-0.5 rounded">
                                {uploadProgress !== null ? `${Math.round(uploadProgress)}%` : '0%'}
                              </span>
                            </div>
                            <div className="w-full bg-stone-900 border border-stone-850 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#A855F7] to-[#C084FC] transition-all duration-300" 
                                style={{ width: `${uploadProgress || 0}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-stone-500 font-semibold uppercase tracking-wider text-left">
                              {lang === 'de' 
                                ? 'Schließe das Fenster nicht, während die Übertragung läuft.'
                                : 'Do not close this window during the file transfer.'}
                            </div>
                          </div>
                        ) : vBgStoragePath || vBgYoutubeUrl ? (
                          <div className="space-y-4">
                            <div className="bg-stone-950 border border-stone-850 p-3 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-stone-900 border border-stone-800 text-[#A855F7] rounded-lg">
                                  <LucideIcons.Video size={20} />
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="text-xs font-black uppercase text-white truncate max-w-[125px] sm:max-w-[160px]">
                                    {vBgOriginalFileName || (lang === 'de' ? 'Geladenes Video' : 'Uploaded Video')}
                                  </div>
                                  {vBgOriginalDuration !== undefined && (
                                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                                      {vBgOriginalDuration.toFixed(1)}s Spieldauer
                                    </div>
                                  )}
                                  {vBgOriginalSizeBytes !== undefined && (
                                    <div className="text-[10px] text-stone-500 font-mono tracking-wide mt-0.5">
                                      {(vBgOriginalSizeBytes / (1024 * 1024)).toFixed(1)} MB
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  // Clear uploaded video
                                  setVBgYoutubeUrl('');
                                  setVBgOriginalFileName(undefined);
                                  setVBgOriginalDuration(undefined);
                                  setVBgStoragePath(undefined);
                                  setVBgProcessingStatus('not_started');
                                  setVBgLocalPreviewUrl(undefined);
                                  setVBgOptimizedVideoUrl(undefined);
                                  markDirty();
                                }}
                                className="text-[10px] bg-red-955/20 hover:bg-red-950/40 border border-red-900/30 text-red-100 hover:text-red-300 font-black py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <LucideIcons.Trash2 size={12} />
                                <span>{lang === 'de' ? 'Entfernen' : 'Remove'}</span>
                              </button>
                            </div>
                            
                            {/* Upload guide inline indicator */}
                            <div className="bg-stone-950/60 p-3.5 border border-stone-850 rounded-xl space-y-2 text-[10px]">
                              <div className="flex items-center justify-between text-[#A855F7] font-bold">
                                <span>VERARBEITUNGS-STATUS:</span>
                                <span className="uppercase font-black font-mono">
                                  {vBgProcessingStatus === 'uploaded' ? (lang === 'de' ? 'Empfangen (Warte auf Verarbeitung...)' : 'Received (Waiting...)') :
                                   vBgProcessingStatus === 'processing_pending' ? (lang === 'de' ? 'In Verarbeitung...' : 'Processing...') :
                                   vBgProcessingStatus === 'ready' ? (lang === 'de' ? 'Bereit & Optimiert ✓' : 'Ready & Optimized ✓') :
                                   vBgProcessingStatus === 'failed' || vBgProcessingStatus === 'processing_failed' ? (lang === 'de' ? 'Fehler ✗' : 'Failed ✗') :
                                   (lang === 'de' ? 'Bereit ✓' : 'Ready ✓')}
                                </span>
                              </div>
                              {vBgProcessingError && (
                                <p className="text-red-400 font-bold leading-relaxed">{vBgProcessingError}</p>
                              )}
                            </div>
                          </div>
                        ) : plan === 'starter' ? (
                          /* Locked Starter State */
                          <div 
                            className="border-2 border-dashed border-stone-850/40 bg-stone-950/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center text-stone-500 animate-fadeIn"
                          >
                            <div className="p-3.5 bg-stone-900 border border-stone-800 text-stone-600 rounded-xl">
                              <LucideIcons.Lock size={24} />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase text-amber-500/80 tracking-wider">
                                {lang === 'de' ? 'Video-Upload erfordert PRO / BUSINESS' : 'Video Upload requires PRO / BUSINESS'}
                              </div>
                              <p className="text-[10px] text-stone-400 font-semibold mt-1.5 leading-normal max-w-[250px] mx-auto normal-case">
                                {lang === 'de' 
                                  ? 'Lade eigene kurze Produktvideos oder Reels hoch und verknüpfe sie interaktiv mit deinen Buttons.' 
                                  : 'Upload sharp, short product videos/reels and link them interactively to your buttons.'}
                              </p>
                              <div className="mt-4.5 inline-flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-stone-950 bg-amber-500/90 px-3.5 py-2 rounded-xl shadow-md">
                                <LucideIcons.Sparkles size={11} />
                                <span>{lang === 'de' ? 'Unter Tarife freischaltbar' : 'Available on Premium plans'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Drag and Drop Zone */
                          <div 
                            onClick={() => videoFileInputRef.current?.click()}
                            className="border-2 border-dashed border-stone-850 hover:border-[#A855F7]/50 bg-stone-950/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer text-center hover:bg-stone-900/20 transition-all group animate-fadeIn"
                          >
                            <div className="p-3.5 bg-stone-900 border border-stone-800 text-stone-400 group-hover:text-[#A855F7] rounded-xl transition-colors">
                              <LucideIcons.UploadCloud size={24} />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase text-stone-250 tracking-wider">
                                {lang === 'de' ? 'Hier klicken zum Auswählen oder Drag & Drop' : 'Click to select or drag & drop video'}
                              </div>
                              <p className="text-[10px] text-stone-500 font-bold uppercase mt-1 leading-normal">
                                MP4, MOV, WEBM (Max. {(plan as string) === 'starter' ? '25' : (plan as string) === 'pro' ? '50' : '100'} MB)
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-stone-500 leading-relaxed font-semibold font-sans space-y-1 bg-stone-950/40 p-3 rounded-xl border border-stone-850 mt-2">
                          <span className="font-bold text-stone-400 block mb-1 uppercase tracking-wider">Richtlinien für Video-Uploads:</span>
                          <p>• Empfohlene Auflösung: 720x1280 (Hochformat 9:16)</p>
                          <p>• Codec/Format: standardmäßiges MP4 (H.264)</p>
                          <p>• Reels werden auf deiner Karte standardmäßig stummgeschaltet abgespielt.</p>
                        </div>
                      </div>
                    )}

                    {/* Playback Sequence Customizations */}
                    {vBgMediaMode !== 'slideshow' && (
                      <>
                        <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                        
                          {/* Playback Duration Slider (Video-Ende / Standbild bei Sekunde) */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <label className="font-extrabold uppercase text-stone-300">
                                {lang === 'de' ? 'Video-Ende / Standbild bei Sekunde' : 'Video End / Frame Stop at Second'}
                              </label>
                              <span className="font-bold text-[#A855F7] px-2 py-0.5 rounded bg-[#A855F7]/10 border border-[#A855F7]/20 text-[10px]">
                                {lang === 'de' ? `Video stoppt bei ${vBgDurationSeconds}s` : `Video stops at ${vBgDurationSeconds}s`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 py-1">
                              <span className="text-[10px] font-black text-stone-500">5s</span>
                              <input
                                type="range"
                                min={5}
                                max={plan === 'starter' ? 10 : (plan === 'pro' ? 12 : 15)}
                                step={1}
                                value={vBgDurationSeconds}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setVBgDurationSeconds(val as any);
                                  markDirty();
                                }}
                                className="flex-grow accent-[#A855F7] h-1.5 bg-stone-950 rounded-lg cursor-pointer animate-none"
                              />
                              <span className="text-[10px] font-black text-stone-500">
                                {plan === 'starter' ? '10s' : (plan === 'pro' ? '12s' : '15s')}
                              </span>
                            </div>
                          </div>

                          {/* Video-Anzeige Aspect Fitting */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-extrabold uppercase text-stone-300 block">
                              {lang === 'de' ? 'Video-Anzeige' : 'Video Aspect Fit'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setVBgVideoFitMode('contain');
                                  markDirty();
                                }}
                                className={`py-2 px-3 border rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center ${
                                  vBgVideoFitMode === 'contain'
                                    ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-bold'
                                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'
                                }`}
                              >
                                <span>{lang === 'de' ? 'Ganzes Video anzeigen' : 'Show full video'}</span>
                                <span className="text-[8px] opacity-75 font-medium mt-0.5">{lang === 'de' ? '(Contain)' : '(Contain)'}</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setVBgVideoFitMode('cover');
                                  markDirty();
                                }}
                                className={`py-2 px-3 border rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center ${
                                  vBgVideoFitMode === 'cover'
                                    ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950 font-bold'
                                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'
                                }`}
                              >
                                <span>{lang === 'de' ? 'Fläche füllen' : 'Fill screen'}</span>
                                <span className="text-[8px] opacity-75 font-medium mt-0.5">{lang === 'de' ? '(Cover - Zoom)' : '(Cover - Zoom)'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-850 text-[10px] space-y-2 mt-2 leading-relaxed">
                            <p className="text-[9px] text-[#A855F7] font-bold leading-relaxed">
                              {plan === 'starter' && (
                                lang === 'de'
                                  ? '💡 Im Starter-Paket wird dein Reel-Video automatisch auf maximal 10 Sekunden beschnitten und auf 5 MB optimiert.'
                                  : '💡 In the Starter package, your reel video is automatically capped at 10 seconds and optimized to 5 MB.'
                              )}
                              {plan === 'pro' && (
                                lang === 'de'
                                  ? '💡 Im Pro-Paket stehen dir bis zu 12 Sekunden Reel-Spieldauer zur Verfügung, optimiert auf maximal 10 MB.'
                                  : '💡 In the Pro package, you have up to 12 seconds of reel play duration available, optimized to 10 MB.'
                              )}
                              {plan === 'business' && (
                                lang === 'de'
                                  ? '💡 Im Business-Paket stehen dir bis zu 15 Sekunden Reel-Spieldauer zur Verfügung, optimiert auf maximal 15 MB.'
                                  : '💡 In the Business package, you have up to 15 seconds of reel play duration available, optimized to 15 MB.'
                              )}
                            </p>
                            <div className="border-t border-stone-900 pt-2 grid grid-cols-2 gap-2 text-[9px] font-semibold text-stone-400">
                              <div>
                                <span className="block text-stone-500 uppercase text-[8px] font-bold tracking-wider">
                                  {lang === 'de' ? 'Status' : 'Status'}
                                </span>
                                <span className={
                                  vBgProcessingStatus === 'ready' ? "text-green-400 font-bold" :
                                  vBgProcessingStatus === 'failed' || vBgProcessingStatus === 'processing_failed' ? "text-red-400 font-bold" :
                                  "text-yellow-400 font-semibold animate-pulse"
                                }>
                                  {vBgProcessingStatus === 'ready' ? (lang === 'de' ? 'Bereit & Optimiert' : 'Optimized & Ready') :
                                   (vBgProcessingStatus === 'failed' || vBgProcessingStatus === 'processing_failed') ? (lang === 'de' ? 'Fehlgeschlagen' : 'Processing Failed') :
                                   vBgProcessingStatus === 'uploaded' ? (lang === 'de' ? 'Hochgeladen' : 'Uploaded') :
                                   vBgProcessingStatus === 'processing_pending' ? (lang === 'de' ? 'Verarbeitung läuft...' : 'Processing...') :
                                   (lang === 'de' ? 'In Vorbereitung' : 'Prepared')}
                                </span>
                              </div>
                              <div>
                                <span className="block text-stone-500 uppercase text-[8px] font-bold tracking-wider">
                                  {lang === 'de' ? 'Zielauflösung' : 'Target Resolution'}
                                </span>
                                <span className="text-[#A855F7] font-bold">{plan === 'starter' ? '720x1280px' : '720x1280px / 1080x1920px'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                      {/* Statisches Bild nach Video (Standansicht) */}
                      <div className="bg-stone-900/30 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                        <div>
                          <h4 className="text-xs font-black uppercase text-[#F5EFE3]">
                            {lang === 'de' ? 'Statisches Bild nach Video' : 'Static Image After Video'}
                          </h4>
                          <p className="text-[9px] text-stone-400 uppercase font-bold tracking-wider mt-0.5 leading-relaxed">
                            {lang === 'de' 
                              ? 'Wenn ein statisches Bild gewählt wird, blendet dieses nach dem Video mit einem weichen Übergang ein. Wenn kein statisches Bild gewählt wird, bleibt nach dem Video das letzte Videobild sichtbar.'
                              : 'If a static image is selected, it fades in after the video with a soft transition. If no static image is selected, the last frame of the video remains visible.'}
                          </p>
                        </div>

                        {/* Fallback image uploader */}
                        <div className="bg-stone-950/40 border border-stone-850 rounded-xl p-3 space-y-2.5">
                          <div className="flex gap-3 items-center">
                            {vBgAfterImageUrl ? (
                              <div className="w-10 h-14 rounded border border-stone-800 bg-stone-900 overflow-hidden shrink-0 relative">
                                <img src={vBgAfterImageUrl} alt="After Background" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-14 rounded border border-dashed border-stone-800 flex items-center justify-center shrink-0">
                                <LucideIcons.Image size={14} className="text-stone-500" />
                              </div>
                            )}
                            <div className="flex-grow flex gap-1.5 w-full">
                              <label className="flex-grow bg-stone-900 hover:bg-stone-850 py-1.5 px-2.5 rounded-lg border border-stone-800 hover:border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer select-none text-[10px] text-stone-350 font-bold">
                                <LucideIcons.Upload size={11} className="text-[#A855F7]" />
                                <span>{lang === 'de' ? 'Foto hochladen' : 'Upload photo'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAfterVideoFileUpload}
                                  className="hidden"
                                />
                              </label>
                              {vBgAfterImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => { setVBgAfterImageUrl(''); markDirty(); }}
                                  className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <LucideIcons.Trash2 size={11} />
                                  <span>{lang === 'de' ? 'Löschen' : 'Delete'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Transition / Weicher Übergang */}
                        <div className="bg-stone-950/40 border border-stone-850 rounded-xl p-3 space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-300 block">
                            {lang === 'de' ? 'Übergang (Crossfade-Zeit)' : 'Transition (Crossfade-Time)'}
                          </label>
                          <div className="grid grid-cols-4 gap-1.5 font-medium">
                            {[
                              { key: 'very_soft', label: lang === 'de' ? 'Sehr Weich (3s)' : 'Very Soft (3s)' },
                              { key: 'soft', label: lang === 'de' ? 'Weich (1.5s)' : 'Soft (1.5s)' },
                              { key: 'medium', label: lang === 'de' ? 'Mittel (0.8s)' : 'Medium (0.8s)' },
                              { key: 'hard', label: lang === 'de' ? 'Hart (0s)' : 'Hard (0s)' },
                            ].map((tran) => (
                              <button
                                key={tran.key}
                                type="button"
                                onClick={() => { setVBgTransition(tran.key as any); markDirty(); }}
                                className={`py-1 px-1 border rounded-lg text-[8px] font-black uppercase tracking-tight transition cursor-pointer leading-tight text-center ${vBgTransition === tran.key ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950' : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-900'}`}
                              >
                                {tran.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                    {/* Neutral Mobile processing hint banner */}
                    <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-stone-300 leading-normal font-medium">
                      <LucideIcons.Sparkles size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                      <p>
                        Dieser Reel-Hintergrund wird vollautomatisch zu einem extrem performanten, speicherschonenden und mobiloptimierten Web-Hintergrund gerendert, wenn er gespeichert wird. Keine FFmpeg Kompression auf deinem Client nötig.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* SEGMENT 3: TEXT & BUTTON REVEALS */}
            {activeSegment === 'text' && (
              <div className="space-y-6 animate-fade-in text-stone-300">
                
                {/* 1. BUTTON REVEAL CONFIG */}
                <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black uppercase text-[#F5EFE3]">{t.textButtons.buttonEnable}</h5>
                      <p className="text-[9px] text-stone-405 uppercase font-bold tracking-wider mt-0.5">Finde die Buttons erst nach Reels-Spannungsaufbau ein.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setVBgButtonEnabled(!vBgButtonEnabled); markDirty(); }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgButtonEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgButtonEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {vBgButtonEnabled && (
                    <div className="space-y-4 pt-4 border-t border-stone-850 animate-fadeIn">
                      
                      {/* Button Reveal start slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-stone-300">
                          <span className="font-sans font-bold uppercase">
                            {lang === 'de' ? 'Einblendung startet bei' : 'Reveal Start Time'}
                          </span>
                          <span className="text-[#A855F7] font-bold">{vBgButtonStartSecond}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxDurationCap}
                          step="0.5"
                          value={vBgButtonStartSecond}
                          onChange={(e) => {
                            const newStart = Number(e.target.value);
                            setVBgButtonStartSecond(newStart);
                            const currentEnd = vBgButtonEndSecond ?? maxDurationCap;
                            if (currentEnd <= newStart) {
                              setVBgButtonEndSecond(Math.min(newStart + 1, maxDurationCap));
                            }
                            markDirty();
                          }}
                          className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                        />
                      </div>

                      {/* Button Reveal end slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-stone-300">
                          <span className="font-sans font-bold uppercase">
                            {lang === 'de' ? 'Volle Sichtbarkeit erreicht bei' : 'Full Visibility Reached'}
                          </span>
                          <span className="text-[#A855F7] font-bold">{vBgButtonEndSecond ?? maxDurationCap}s</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max={maxDurationCap}
                          step="0.5"
                          value={vBgButtonEndSecond ?? maxDurationCap}
                          onChange={(e) => {
                            const newEnd = Number(e.target.value);
                            setVBgButtonEndSecond(newEnd);
                            if (vBgButtonStartSecond >= newEnd) {
                              setVBgButtonStartSecond(Math.max(0, newEnd - 1));
                            }
                            markDirty();
                          }}
                          className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                        />
                      </div>

                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider bg-stone-950/40 p-1.5 rounded-lg text-right">
                        {lang === 'de' ? 'Übergangsdauer' : 'Transition Span'}: <span className="text-[#A855F7]">{(Math.max(0.1, (vBgButtonEndSecond ?? maxDurationCap) - vBgButtonStartSecond)).toFixed(1)}s</span>
                      </div>

                      {/* Presentation effect selector */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-stone-350 block uppercase">{t.textButtons.buttonStyle}</span>
                        <div className="grid grid-cols-3 gap-2">
                          {['fade', 'slideUp', 'soft'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => { setVBgButtonStyle(st as any); markDirty(); }}
                              className={`py-2 px-3 border rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${vBgButtonStyle === st ? 'bg-[#A855F7] border-[#7E22CE] text-stone-950' : 'bg-stone-950 border-stone-800 text-stone-400'}`}
                            >
                              {st === 'slideUp' ? 'Hochgleiten' : st === 'fade' ? 'Einfaches Verblasen' : 'Soft-Fokus'}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 2. PROFIL-ELEMENTE TIMINGS */}
                <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-4.5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-[#A855F7] mb-2">Zeitsteuerung für Profilelemente</h4>
                  <p className="text-[9px] text-stone-400 uppercase font-bold tracking-wider leading-relaxed">
                    Zeitgesteuertes Einblenden für dein Profilbild und die vorhandenen Texte (Name, Beschreibung, Zusatztext).
                  </p>

                  {/* 2A. PROFILBILD TIMING */}
                  <div className="border border-stone-850/60 rounded-xl p-3 bg-stone-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-stone-200">Profilbild einblenden</span>
                        <p className="text-[8px] text-stone-450 uppercase font-bold">Profilbild erscheint verzögert.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setVBgProfileImageRevealEnabled(!vBgProfileImageRevealEnabled); markDirty(); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgProfileImageRevealEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgProfileImageRevealEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {vBgProfileImageRevealEnabled && (
                      <div className="space-y-3 pt-2.5 border-t border-stone-850/50 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Sichtbar ab Sekunde</span>
                            <span className="text-[#A855F7] font-bold">{vBgProfileImageRevealStartSecond}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxDurationCap}
                            step="0.5"
                            value={vBgProfileImageRevealStartSecond}
                            onChange={(e) => { setVBgProfileImageRevealStartSecond(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Einblendungsdauer</span>
                            <span className="text-[#A855F7] font-bold">{vBgProfileImageRevealFadeDuration}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={vBgProfileImageRevealFadeDuration}
                            onChange={(e) => { setVBgProfileImageRevealFadeDuration(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2B. NAME / TITEL TIMING */}
                  <div className="border border-stone-850/60 rounded-xl p-3 bg-stone-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-stone-200">Name / Titel</span>
                        <p className="text-[8px] text-stone-450 uppercase font-bold">Der Haupttitel erscheint zeitverzögert.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setVBgTextTitleEnabled(!vBgTextTitleEnabled); markDirty(); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgTextTitleEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgTextTitleEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {vBgTextTitleEnabled && (
                      <div className="space-y-3 pt-2.5 border-t border-stone-850/50 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Sichtbar ab Sekunde</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextTitleStartSecond}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxDurationCap}
                            step="0.5"
                            value={vBgTextTitleStartSecond}
                            onChange={(e) => { setVBgTextTitleStartSecond(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Einblendungsdauer</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextTitleFadeDuration}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={vBgTextTitleFadeDuration}
                            onChange={(e) => { setVBgTextTitleFadeDuration(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2C. BESCHREIBUNG / CLAIM TIMING */}
                  <div className="border border-stone-850/60 rounded-xl p-3 bg-stone-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-stone-200">Beschreibung / Claim</span>
                        <p className="text-[8px] text-stone-450 uppercase font-bold">Die Beschreibung/Slogan erscheint zeitverzögert.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setVBgTextSubtitleEnabled(!vBgTextSubtitleEnabled); markDirty(); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgTextSubtitleEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgTextSubtitleEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {vBgTextSubtitleEnabled && (
                      <div className="space-y-3 pt-2.5 border-t border-stone-850/50 animate-fadeIn font-medium">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Sichtbar ab Sekunde</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextSubtitleStartSecond}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxDurationCap}
                            step="0.5"
                            value={vBgTextSubtitleStartSecond}
                            onChange={(e) => { setVBgTextSubtitleStartSecond(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Einblendungsdauer</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextSubtitleFadeDuration}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={vBgTextSubtitleFadeDuration}
                            onChange={(e) => { setVBgTextSubtitleFadeDuration(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2D. ZUSATZTEXT / INFO TIMING */}
                  <div className="border border-stone-850/60 rounded-xl p-3 bg-stone-950/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-stone-200">Zusatztext / Info</span>
                        <p className="text-[8px] text-stone-450 uppercase font-bold">Der Zusatztext/Info erscheint zeitverzögert.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setVBgTextDescEnabled(!vBgTextDescEnabled); markDirty(); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${vBgTextDescEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${vBgTextDescEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {vBgTextDescEnabled && (
                      <div className="space-y-3 pt-2.5 border-t border-stone-850/50 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Sichtbar ab Sekunde</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextDescStartSecond}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={maxDurationCap}
                            step="0.5"
                            value={vBgTextDescStartSecond}
                            onChange={(e) => { setVBgTextDescStartSecond(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span>Einblendungsdauer</span>
                            <span className="text-[#A855F7] font-bold">{vBgTextDescFadeDuration}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={vBgTextDescFadeDuration}
                            onChange={(e) => { setVBgTextDescFadeDuration(Number(e.target.value)); markDirty(); }}
                            className="w-full h-1 bg-stone-855 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDE: Realtime High-Fidelity Phone Frame Preview */}
          <div className="hidden md:flex md:w-[59%] xl:w-[65%] flex-col items-center justify-start bg-[#050505] p-3 md:p-6 overflow-hidden relative shrink order-1 md:order-2 md:h-full select-none border-b md:border-b-0 border-stone-855/60">
            
            <div className="w-full flex items-center justify-between mb-2 pb-1.5 border-b border-stone-850/45 shrink-0 select-none">
              <span className="text-[10.5px] font-black uppercase text-[#F5EFE3] tracking-widest flex items-center gap-1.5 font-sans">
                <LucideIcons.Eye size={12} className="text-[#A855F7]" />
                <span>{lang === 'de' ? 'Vorschau' : 'Preview'}</span>
              </span>
            </div>

            {/* Smartphone Card Frame Container */}
            <div className="w-full flex-grow min-h-0 relative flex items-center justify-center p-0.5 md:p-3">
              <div className="w-full h-full max-w-[315px] sm:max-w-[330px] md:max-w-[340px] max-h-[440px] sm:max-h-[460px] md:max-h-[580px] xl:max-h-[640px] rounded-[38px] border-4 border-stone-800 shadow-2xl overflow-hidden relative bg-[#0e0e0e]">
                <MiniCardPreview
                  card={previewCard}
                  lang={lang}
                  highlightArea="background"
                  videoBackgroundPreviewState={vBgEnabled ? "autoplay" : undefined}
                />
              </div>
            </div>

            {/* GRAPHIC TIMELINE BAR */}
            {vBgEnabled && (
              <div className="w-full max-w-sm bg-stone-950/75 border border-stone-850/60 rounded-xl p-2 mt-1 space-y-1 select-none shrink-0 font-sans hidden md:block">
                <div className="flex items-center justify-between text-[8px] text-stone-405 font-mono font-bold uppercase tracking-wider">
                  <span>0s (Start)</span>
                  {vBgTextEnabled && <span>{vBgTextRevealStartSecond}s (Text)</span>}
                  {vBgButtonEnabled && <span>{vBgButtonStartSecond}s (Buttons)</span>}
                  <span>{vBgDurationSeconds}s (After)</span>
                </div>
                
                <div className="relative h-1 bg-stone-900 rounded-full overflow-hidden border border-stone-850/60 font-sans">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#A855F7]/20 transition-all duration-300"
                    style={{ width: `${(Math.min(vBgTextRevealStartSecond, vBgDurationSeconds) / vBgDurationSeconds) * 100}%` }}
                  />
                  {vBgTextEnabled && (
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-[#A855F7]/50 transition-all duration-300"
                      style={{ width: `${(Math.min(vBgButtonStartSecond, vBgDurationSeconds) / vBgDurationSeconds) * 100}%` }}
                    />
                  )}
                  {vBgButtonEnabled && (
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-[#A855F7] transition-all duration-300"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              </div>
            )}

          </div>

        </div>


        {/* FOOTER BINDING / STICKY ACTIONS SAVERS */}
        <div className="flex-none h-16 bg-stone-950 border-t border-stone-850 flex items-center justify-end px-4 md:px-6 gap-3 z-10">
          <button
            type="button"
            onClick={handleCancelClick}
            className="bg-stone-900 border border-stone-800 hover:bg-stone-850 hover:border-stone-750 text-stone-300 hover:text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition cursor-pointer select-none"
          >
            {t.cancel}
          </button>
          
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving || isUploading || (vBgEnabled && vBgMode === 'youtube' && !isYoutubeUrlValid && !!vBgYoutubeUrl)}
            className="bg-[#A855F7] hover:bg-[#7E22CE] border border-[#a38634] text-stone-950 text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed select-none"
          >
            {isSaving ? <LucideIcons.Loader className="animate-spin" size={13} /> : <LucideIcons.Save size={13} />}
            <span>{t.save}</span>
          </button>
        </div>

        {/* DISCARD CHANGES POPUP CONFIRMATION */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-55 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl animate-fade-in text-stone-300">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <LucideIcons.AlertTriangle className="text-[#A855F7]" size={16} />
                <span>{t.confirmCloseTitle}</span>
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed font-semibold">
                {t.confirmCloseDesc}
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {t.continueEditing}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="bg-red-950 hover:bg-red-900 border border-red-900/40 text-red-300 hover:text-red-200 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {t.discard}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPGRADE PREMIUM LOCKED GATE DIALOG */}
        {upgradeModalFeature && (
          <UpgradeModal
            isOpen={!!upgradeModalFeature}
            onClose={() => setUpgradeModalFeature('')}
            lang={lang as 'de' | 'en'}
            featureKey={upgradeModalFeature}
          />
        )}

      </div>
    </div>
  );
};
