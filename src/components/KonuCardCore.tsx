/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton, getPublicCardUrl, VideoBackgroundConfig } from '../types';
import { ButtonRenderer } from './ButtonRenderer';
import { ProfileHeroSection } from './ProfileHeroSection';
import { TRANSLATIONS } from '../translations';
import { normalizeButtons, getButtonScaleFactor, normalizeButtonGridLayout } from '../utils/buttonUtils';
import { canUseFeature } from '../config/plans';
import { parseVideoUrl, resolveUreelVideo } from '../utils/video';
import { getReelTimelineState, normalizeVideoBackgroundConfig, normalizeUreelScene, normalizeUreelTimeline, normalizeUreelEndCard } from '../utils/timeline';

export interface KonuCardCoreProps {
  card: Card;
  lang: 'de' | 'en';
  isPreview?: boolean;
  isMiniPreview?: boolean;
  videoBackgroundPreviewState?: 'start' | 'reveal' | 'fully_visible' | 'final' | 'autoplay';

  isReelView?: boolean;
  reelModeConfig?: any;
  onToggleElementInReel?: (elementKey: string, buttonId?: string) => void;

  // Editor specific modes & overlays
  isSortingMode?: boolean;
  onEditBackground?: () => void;
  onEditProfileHero?: () => void;
  onEditButton?: (btn: CardButton) => void;
  onAddButton?: () => void;

  // Drag-and-drop sort events and state
  draggedButtonId?: string | null;
  dragOverButtonId?: string | null;
  swapSelectionId?: string | null;

  handleDragStart?: (e: React.DragEvent, id: string) => void;
  handleDragOver?: (e: React.DragEvent, id: string) => void;
  handleDragEnd?: () => void;
  handleDrop?: (e: React.DragEvent, id: string) => void;
  handleTouchStart?: (id: string) => void;
  handleTouchEndOrCancel?: () => void;
  handleButtonTapOrClickInSortMode?: (id: string) => void;

  // Common visitor interaction events (or mock handlers)
  handleButtonClick?: (btn: CardButton) => void;
  triggerVCardDownload?: () => void;
  handleCtaClick?: () => void;
  setShowShareModal?: (show: boolean) => void;
  reelConfig?: any;
  onButtonActionClick?: (action: any, value: any) => Promise<void>;
  isDesktopPreview?: boolean;
  cleanPreview?: boolean;
  previewFocus?: 'full' | 'background';
}

export const KonuCardCore: React.FC<KonuCardCoreProps> = ({
  card,
  lang,
  isPreview = false,
  isMiniPreview = false,
  cleanPreview = false,
  previewFocus = 'full',
  videoBackgroundPreviewState,

  isReelView = false,
  reelModeConfig,
  onToggleElementInReel,

  isSortingMode = false,
  onEditBackground,
  onEditProfileHero,
  onEditButton,
  onAddButton,

  draggedButtonId = null,
  dragOverButtonId = null,
  swapSelectionId = null,

  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  handleTouchStart,
  handleTouchEndOrCancel,
  handleButtonTapOrClickInSortMode,

  handleButtonClick,
  triggerVCardDownload,
  handleCtaClick,
  setShowShareModal,
}) => {
  const t = TRANSLATIONS[lang];

  // Video background state & timeline logic using the unified getReelTimelineState engine
  const [currentTime, setCurrentTime] = React.useState(0);
  const [videoStatus, setVideoStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [autoplayBlocked, setAutoplayBlocked] = React.useState(false);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Local timer to track how long the visitor has been waiting during this mount
  const [elapsedWaitingSeconds, setElapsedWaitingSeconds] = React.useState(0);
  const [loadTimeoutTriggered, setLoadTimeoutTriggered] = React.useState(false);

  React.useEffect(() => {
    if (videoStatus === 'loading') {
      const timer = setTimeout(() => {
        setLoadTimeoutTriggered(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadTimeoutTriggered(false);
    }
  }, [videoStatus]);


  const normalized = normalizeVideoBackgroundConfig(card.videoBackgroundConfig, card.plan);

  // Construct helper for separate Reel customizer profile section data mask (Teil D)
  const mappedCardData = React.useMemo(() => {
    const cleanSceneCard = cleanPreview && card.ureelScene
      ? {
          ...card,
          // In the studio monitor the scene itself is the stage. The old profile avatar/background
          // must not cover color/gradient/video scenes. Text stays visible, but the profile image
          // and hero media/background are disabled.
          showProfileImage: false,
          heroLogoUrl: '',
          customLogoUrl: null,
          heroBackgroundEnabled: false,
          heroBackgroundType: 'color',
          heroImageUrl: '',
          coverImageUrl: '',
          productImageUrl: '',
          heroVideoUrl: '',
          productVideoUrl: '',
          // In clean Studio preview, the visible card text must always come from the
          // Werbetexter fields (title/subtitle/description). Older KONU hero fields
          // are intentionally ignored here so stored demo graphics like
          // "Deine neue ureel-Seite / zum Bearbeiten" cannot override the editor.
          showHeroText: true,
          heroTitle: card.title || '',
          heroSubtitle: card.subtitle || '',
          heroDescription: card.description || '',
          heroCompany: '',
          heroLocation: '',
          heroTextColor: card.heroTextColor || (card.ureelScene?.mode === 'color' || card.ureelScene?.mode === 'gradient' ? 'dark' : 'white'),
        }
      : card;

    if (!isReelView) return cleanSceneCard;
    const cfg = reelModeConfig || {};
    return {
      ...cleanSceneCard,
      showProfileImage: cleanSceneCard.showProfileImage !== false && cfg.includeProfileImage !== false && cfg.includeProfileSection !== false,
      heroLogoUrl: cfg.includeLogo !== false && cfg.includeProfileSection !== false ? cleanSceneCard.heroLogoUrl : '',
      customLogoUrl: cfg.includeLogo !== false && cfg.includeProfileSection !== false ? cleanSceneCard.customLogoUrl : null,
      title: cfg.includeTitle !== false && cfg.includeProfileSection !== false ? cleanSceneCard.title : '',
      heroTitle: cfg.includeTitle !== false && cfg.includeProfileSection !== false ? cleanSceneCard.heroTitle : '',
      subtitle: cfg.includeTitle !== false && cfg.includeProfileSection !== false ? cleanSceneCard.subtitle : '',
      heroSubtitle: cfg.includeTitle !== false && cfg.includeProfileSection !== false ? cleanSceneCard.heroSubtitle : '',
      description: cfg.includeDescription !== false && cfg.includeProfileSection !== false ? cleanSceneCard.description : '',
      heroDescription: cfg.includeDescription !== false && cfg.includeProfileSection !== false ? cleanSceneCard.heroDescription : '',
    };
  }, [card, isReelView, reelModeConfig, cleanPreview]);
  const scene = normalizeUreelScene(card);
  const hasUreelScene = !!card.ureelScene;
  const activeSceneVideoResult = resolveUreelVideo(scene.video);

  // Normalize ureelTimeline and ureelEndCard configs
  const timelineConfig = React.useMemo(() => normalizeUreelTimeline(card), [card]);
  const endCardConfig = React.useMemo(() => normalizeUreelEndCard(card), [card]);
  const gridLayout = React.useMemo(() => normalizeButtonGridLayout(card), [card]);

  const hasTimeline = !!card.ureelTimeline;
  const hasEndCard = !!card.ureelEndCard;

  const [elapsed, setElapsed] = React.useState(0);

  // Track the elapsed timeline counter smoothly
  React.useEffect(() => {
    const stepMs = 100;
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = Math.round((prev + (stepMs / 1000)) * 10) / 10;
        const activeEndLimit = (hasEndCard && endCardConfig.enabled) ? timelineConfig.endCardAt : 30;
        if (next >= activeEndLimit) {
          return activeEndLimit;
        }
        return next;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [hasEndCard, endCardConfig.enabled, timelineConfig.endCardAt]);

  const textRevealEnabled = React.useCallback((fieldKey: 'title' | 'subtitle' | 'description') => {
    const reveal = card.videoBackgroundConfig?.profileTextReveals?.find((item: any) => item.fieldKey === fieldKey);
    return reveal?.enabled !== false;
  }, [card.videoBackgroundConfig?.profileTextReveals]);

  const showTitle = textRevealEnabled('title') && (!hasTimeline || elapsed >= timelineConfig.titleAt);
  const showSubtitle = textRevealEnabled('subtitle') && (!hasTimeline || elapsed >= timelineConfig.subtitleAt);
  const showDescription = textRevealEnabled('description') && (!hasTimeline || elapsed >= timelineConfig.descriptionAt);
  const showButtons = !hasTimeline || elapsed >= timelineConfig.buttonsAt;
  const showEndCard = hasEndCard && endCardConfig.enabled && elapsed >= timelineConfig.endCardAt;
  const backgroundOnlyPreview = cleanPreview && previewFocus === 'background';

  const handleReplay = () => {
    setElapsed(0);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = hasUreelScene ? (activeSceneVideoResult.startAt || 0) : 0;
      videoRef.current.play().catch(() => {});
    }
  };

  React.useEffect(() => {
    const resetTimeline = () => handleReplay();
    window.addEventListener('ureel-timeline-reset', resetTimeline);
    return () => window.removeEventListener('ureel-timeline-reset', resetTimeline);
  }, [hasUreelScene, activeSceneVideoResult.startAt]);

  const getEndCardStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      zIndex: 9, // covers scene/video softly at the end but sits below text/buttons/replay
      transition: 'opacity 2s ease-in-out',
    };

    if (endCardConfig.imageUrl) {
      // Endcard image is an independent closing layer. It can sit under an optional 16:9 endcard video.
      style.backgroundImage = `url(${endCardConfig.imageUrl})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (endCardConfig.source === 'color' && endCardConfig.backgroundColor) {
      style.background = endCardConfig.backgroundColor;
    } else if (endCardConfig.source === 'gradient' && endCardConfig.gradient) {
      const g = endCardConfig.gradient;
      style.background = `linear-gradient(${g.direction || '135deg'}, ${g.from}, ${g.to})`;
    } else {
      // 'scene' or 'poster' or fallback: semi-transparent deep blur overlay so buttons stand out elegantly
      style.background = 'rgba(10, 10, 10, 0.4)';
      style.backdropFilter = 'blur(6px)';
    }

    return style;
  };

  const renderEndCardVideo = () => {
    const videoUrl = ((endCardConfig as any).videoUrl || '').trim();
    if (endCardConfig.source !== 'video' || !videoUrl) return null;

    const parsed = parseVideoUrl(videoUrl);
    const displayMode = ((endCardConfig as any).videoDisplayMode || 'wide') as 'wide' | 'compact';
    const wrapClass = displayMode === 'compact'
      ? 'absolute top-3 left-[6%] right-[6%] z-[11] aspect-video overflow-hidden rounded-2xl border border-[#F5F2EA]/25 shadow-2xl bg-black'
      : 'absolute top-0 left-0 right-0 z-[11] aspect-video overflow-hidden rounded-none border-0 bg-black';

    if (parsed.type === 'unsupported') return null;

    return (
      <div className={wrapClass}>
        {(parsed.type === 'youtube' || parsed.type === 'vimeo') && (
          <iframe
            src={parsed.url}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Endkarten-Video"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {parsed.type === 'direct' && (
          <video
            src={parsed.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
    );
  };

  const renderEndCardOverlay = () => {
    if (!showEndCard) return null;

    return (
      <React.Fragment>
        {/* The elegant Endcard Background cover */}
        <div
          className="absolute inset-0 z-[9] pointer-events-none"
          style={{ ...getEndCardStyle(), animation: 'ureelEndcardFade 2s ease-in-out both' }}
        />

        {/* Optional 16:9 endcard video. It is intentionally not a Reel/full-screen layer. */}
        {renderEndCardVideo()}

        {/* Replay Button overlay (fully interactive pointer-events-auto) */}
        {endCardConfig.replayButton && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none" style={{ animation: 'ureelEndcardFade 2s ease-in-out both' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReplay();
              }}
              style={{ pointerEvents: 'auto' }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-[#A855F7] text-xs font-black uppercase tracking-widest text-[#A855F7] transition-all hover:scale-105 active:scale-95 shadow-2xl mt-12 cursor-pointer"
            >
              <LucideIcons.RotateCcw size={11} className="animate-spin-slow" />
              <span>{lang === 'de' ? 'Video erneut ansehen' : 'Replay Video'}</span>
            </button>
          </div>
        )}
      </React.Fragment>
    );
  };

  const isVideoBgActive = hasUreelScene ? (scene.mode === 'video') : normalized.enabled;
  const mediaMode = hasUreelScene
    ? (activeSceneVideoResult.type.startsWith('youtube') ? 'youtube' : 'upload')
    : (normalized.mediaMode || 'youtube');

  // HAUPTVERDACHT 1 & 2: Resolve standard URL across all potential migration fields
  const optimizedVideoUrl =
    (normalized as any).optimizedVideoUrl ||
    normalized.upload?.optimizedVideoUrl ||
    (normalized.videoProcessingJob as any)?.optimizedVideoUrl;

  const jobStatus = normalized.videoProcessingJob?.status;
  const uploadStatus = normalized.upload?.processingStatus;

  // Rule: If optimizedVideoUrl is present, treat as ready to display
  const isVideoReady = Boolean(optimizedVideoUrl) || jobStatus === 'ready' || uploadStatus === 'ready';

  const isUploadReady = isVideoReady;

  const isUploadProcessing = !isVideoReady && (
    jobStatus === 'queued' || jobStatus === 'processing' ||
    uploadStatus === 'uploaded' || uploadStatus === 'processing_pending'
  );

  const isUploadFailed = !isVideoReady && (jobStatus === 'failed' || uploadStatus === 'failed' || uploadStatus === 'processing_failed');

  // Wait-time/long processing warning calculations
  React.useEffect(() => {
    if (isUploadProcessing) {
      const interval = setInterval(() => {
        setElapsedWaitingSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedWaitingSeconds(0);
    }
  }, [isUploadProcessing]);

  const showLongProcessingWarning = React.useMemo(() => {
    const jobCreatedAtStr = normalized.videoProcessingJob?.createdAt;
    if (jobCreatedAtStr) {
      try {
        const elapsedMs = Date.now() - new Date(jobCreatedAtStr).getTime();
        if (elapsedMs > 120 * 1000) return true;
      } catch (e) {
        console.warn("Error parsing job createdAt:", e);
      }
    }
    return elapsedWaitingSeconds > 120;
  }, [normalized.videoProcessingJob?.createdAt, elapsedWaitingSeconds]);

  const videoSrc = hasUreelScene
    ? activeSceneVideoResult.videoSrc
    : ((isMiniPreview || isPreview)
      ? (normalized.upload?.localPreviewUrl || optimizedVideoUrl || normalized.upload?.fileUrl)
      : (isVideoReady ? optimizedVideoUrl : undefined));

  // Auto-play trigger to handle mobile browser security protections
  React.useEffect(() => {
    const isUploadActiveLocal = isVideoBgActive && mediaMode === 'upload';
    if (isUploadActiveLocal && videoRef.current && videoSrc) {
      console.log(`[AUTOPLAY ATTEMPT] Attempting to auto-play: ${videoSrc}`);
      setVideoStatus('loading');
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[AUTOPLAY SUCCESS] Video playing automatically: ${videoSrc}`);
            setAutoplayBlocked(false);
            setVideoStatus('ready');
          })
          .catch((error) => {
            console.warn("[AUTOPLAY BLOCKED] Autoplay was prevented by browser sandbox rules, mounting tap triggers:", error);
            setAutoplayBlocked(true);
            setVideoStatus('ready');
          });
      }
    } else if (isUploadActiveLocal && !videoSrc) {
      setVideoStatus('idle');
    }
  }, [videoSrc, isVideoBgActive, mediaMode, isPreview, isMiniPreview]);

  const isStretch = normalized.upload?.stretchShortVideo !== false;
  const originalDuration = normalized.upload?.originalDurationSeconds;

  let duration: number = hasUreelScene
    ? (scene.mode === 'video' ? activeSceneVideoResult.duration : 12)
    : (normalized.durationSeconds || 12);
  if (!hasUreelScene && mediaMode === 'slideshow') {
    duration = normalized.slideshow?.totalDurationSeconds || (normalized.slideshow?.images?.length ? normalized.slideshow.images.length * 3 : 12);
  }

  // Calculate actual playback duration of the video loop sequence
  let seqDur = duration;
  if (mediaMode === 'upload' && originalDuration !== undefined && originalDuration < duration) {
    if (!isStretch) {
      seqDur = originalDuration;
    }
  }

  // Unified video stop time based on user configuration (5s to 15s)
  const videoStopTime = normalized.stopAtSecond || seqDur;

  const transitionType = normalized.afterSequence?.transition || 'soft';
  const transDur = transitionType === 'hard' ? 0 : transitionType === 'medium' ? 0.8 : transitionType === 'soft' ? 1.2 : 1.8;

  // Compute loop conditions
  const hasAfterBg = normalized.afterSequence?.enabled && normalized.afterSequence?.backgroundType !== 'none' && normalized.afterSequence?.backgroundType !== 'same' && normalized.afterSequence?.backgroundType !== 'video_last_frame';
  let maxLoops = 1;
  if (!hasAfterBg && normalized.loop?.enabled) {
    if (normalized.loop.mode === 'twice') maxLoops = 2;
    else if (normalized.loop.mode === 'three_times') maxLoops = 3;
    else if (normalized.loop.mode === 'infinite') maxLoops = Infinity;
  }

  // Calculate maximum timeline time using the precise stop time limit
  const maxTime = maxLoops === Infinity
    ? videoStopTime
    : hasAfterBg
    ? videoStopTime + transDur
    : videoStopTime * maxLoops;

  const btnStart = normalized.buttonReveal.startSecond;
  const btnEnd = normalized.buttonReveal.endSecond || seqDur;

  const isStaticPreview = videoBackgroundPreviewState && videoBackgroundPreviewState !== 'autoplay';
  const shouldRunTimer = normalized.enabled && !isStaticPreview;

  // Track fallbacks/run the timer smoothly at 100ms interval
  React.useEffect(() => {
    if (!shouldRunTimer) return;

    setCurrentTime(0);

    const stepMs = 100;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = Math.round((prev + (stepMs / 1000)) * 10) / 10;
        
        if (maxLoops === Infinity) {
          if (next >= videoStopTime) {
            return 0; // infinite seamless loop wrap
          }
          return next;
        }

        if (next >= maxTime) {
          if (videoBackgroundPreviewState === 'autoplay') {
            return 0; // seamless loop wrap in editor
          }
          return maxTime; // persistent final state
        }
        return next;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [
    shouldRunTimer,
    maxTime,
    videoBackgroundPreviewState,
    videoStopTime,
    maxLoops,
    card.cardId,
    normalized.youtube?.url,
    normalized.youtubeUrl,
    normalized.mediaMode,
    normalized.durationSeconds
  ]);

  // Dynamic play/stop/hold feedback for Direct Video elements in all views (public, editor, preview)
  React.useEffect(() => {
    if (mediaMode === 'upload' && videoRef.current) {
      if (currentTime >= videoStopTime) {
        try {
          if (!videoRef.current.paused) {
            console.log(`[VIDEO STOP MATCH] Pausing video. Current time (${currentTime}s) >= videoStopTime (${videoStopTime}s).`);
            videoRef.current.pause();
          }
          // Hold the exact frame state of the stop second
          if (Math.abs(videoRef.current.currentTime - videoStopTime) > 0.25) {
            videoRef.current.currentTime = videoStopTime;
          }
        } catch (e) {
          console.warn("Could not hold video frame at duration limit:", e);
        }
      } else {
        // If playing before limit, make sure it is playing and not paused by previous state
        try {
          if (videoRef.current.paused && videoStatus === 'ready' && !autoplayBlocked) {
            videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
          }
        } catch (e) {
          console.warn("Could not resume video play:", e);
        }
      }
    }
  }, [currentTime, videoStopTime, mediaMode, videoStatus, autoplayBlocked]);

  // ZIEL 7: Detailed diagnostic outputs log
  React.useEffect(() => {
    if (isVideoBgActive && mediaMode === 'upload') {
      console.log("[DEV DEBUG LOGS] KonuCardCore video background state:", {
        videoBackgroundConfig: card.videoBackgroundConfig,
        videoProcessingJobStatus: jobStatus,
        uploadProcessingStatus: uploadStatus,
        optimizedVideoUrlResolved: optimizedVideoUrl || 'none',
        selectedVideoSource: videoSrc || 'none',
        videoFitMode: normalized.videoFitMode || 'contain',
        mediaMode,
        durationSeconds: duration,
        stopAtSecond: normalized.stopAtSecond || 'none',
        hasStaticEndImage: hasAfterBg,
        videoStatus,
        autoplayBlocked,
        isPlaying: videoRef.current ? !videoRef.current.paused : false,
        currentTimeInRef: videoRef.current ? videoRef.current.currentTime : 0,
        currentTimeInState: currentTime
      });
    }
  }, [
    card.videoBackgroundConfig,
    jobStatus,
    uploadStatus,
    optimizedVideoUrl,
    videoSrc,
    normalized.videoFitMode,
    mediaMode,
    duration,
    normalized.stopAtSecond,
    hasAfterBg,
    videoStatus,
    autoplayBlocked,
    currentTime
  ]);

  // Derive static/interactive effectiveTime depending on the editor slider choices
  let effectiveTime = currentTime;
  if (isStaticPreview) {
    if (videoBackgroundPreviewState === 'start') {
      effectiveTime = 0;
    } else if (videoBackgroundPreviewState === 'reveal') {
      effectiveTime = btnStart;
    } else if (videoBackgroundPreviewState === 'fully_visible') {
      effectiveTime = btnEnd;
    } else if (videoBackgroundPreviewState === 'final') {
      effectiveTime = maxTime;
    }
  } else {
    effectiveTime = currentTime;
  }

  const timelineState = getReelTimelineState(normalized, effectiveTime, card.plan);

  const getProfileRevealStyle = () => {
    if (!normalized.profileReveal?.enabled) {
      return {
        opacity: 1,
        transform: 'none',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      };
    }

    const prStyle = normalized.profileReveal.style || 'soft';
    const progress = timelineState.profileRevealProgress;

    let transform = 'none';
    if (prStyle === 'scale') {
      transform = `scale(${0.9 + progress * 0.1})`;
    } else if (prStyle === 'soft') {
      transform = `translateY(${(1 - progress) * 8}px) scale(${0.97 + progress * 0.03})`;
    }

    return {
      opacity: progress,
      transform,
      pointerEvents: progress > 0.1 ? ('auto' as const) : ('none' as const),
      transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
    };
  };

  const profileRevealStyle = getProfileRevealStyle();

  const getTextOverlayStyle = (): React.CSSProperties => {
    const tx = normalized.textOverlay;
    if (!tx || !tx.enabled) return { display: 'none' };

    const progress = timelineState.textRevealProgress;
    const anim = tx.animationStyle || 'soft';

    let transform = 'translate(-50%, -50%)';
    if (anim === 'slideUp') {
      transform = `translate(-50%, calc(-50% + ${(1 - progress) * 16}px))`;
    } else if (anim === 'soft') {
      transform = `translate(-50%, calc(-50% + ${(1 - progress) * 8}px)) scale(${0.96 + progress * 0.04})`;
    }

    // Resolve font family
    let fontStyleFam = 'Inter, sans-serif';
    if (tx.fontFamily === 'elegant' || tx.fontFamily === 'Playfair Display') {
      fontStyleFam = 'Playfair Display, Georgia, serif';
    } else if (tx.fontFamily === 'bold' || tx.fontFamily === 'Outfit') {
      fontStyleFam = 'Outfit, Montserrat, sans-serif';
    } else if (tx.fontFamily === 'minimal' || tx.fontFamily === 'JetBrains Mono') {
      fontStyleFam = 'JetBrains Mono, Fira Code, monospace';
    } else if (tx.fontFamily) {
      fontStyleFam = `"${tx.fontFamily}", Inter, sans-serif`;
    }

    return {
      position: 'absolute',
      left: `${tx.x ?? 50}%`,
      top: `${tx.y ?? 60}%`,
      transform,
      fontSize: `${tx.fontSize ?? 18}px`,
      fontFamily: fontStyleFam,
      fontWeight: tx.fontWeight || '700',
      color: tx.color || '#FFFFFF',
      opacity: progress,
      textShadow: tx.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
      backgroundColor: tx.backgroundEnabled ? (tx.backgroundColor || 'rgba(0,0,0,0.4)') : 'transparent',
      borderRadius: tx.backgroundEnabled ? '8px' : '0px',
      padding: tx.backgroundEnabled ? '4px 10px' : '0px',
      transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
      pointerEvents: 'none',
      textAlign: 'center',
    };
  };

  // Maps properties cleanly
  const isTextEnabled = !!normalized.textReveal?.enabled || !!normalized.text?.enabled;
  const isTextVisible = isTextEnabled && timelineState.textRevealProgress > 0 && !!normalized.text?.content;

  const getButtonRevealStyle = () => {
    if (showButtons === false) {
      const buttonStyle = normalized.buttonReveal?.style ?? 'soft';
      return {
        opacity: 0,
        transform: buttonStyle === 'slideUp'
          ? 'translateY(16px)'
          : 'translateY(12px) scale(0.96)',
        filter: buttonStyle === 'soft' ? 'blur(4px)' : 'none',
        pointerEvents: 'none' as const,
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, filter 0.4s ease-out',
      };
    }

    if (!normalized.buttonReveal?.enabled) {
      return {
        opacity: 1,
        transform: 'none',
        filter: 'none',
        pointerEvents: 'auto' as const,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
      };
    }

    const buttonStyle = normalized.buttonReveal?.style ?? 'soft';
    let transform = 'none';
    let filter = 'none';

    if (!timelineState.shouldShowButtons) {
      return {
        opacity: 0,
        transform: buttonStyle === 'slideUp'
          ? 'translateY(16px)'
          : buttonStyle === 'soft'
          ? 'translateY(12px) scale(0.96)'
          : 'none',
        filter: buttonStyle === 'soft' ? 'blur(4px)' : 'none',
        pointerEvents: 'none' as const,
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
      };
    }

    const eased = timelineState.buttonRevealEasedProgress;

    if (buttonStyle === 'slideUp') {
      transform = `translateY(${(1 - eased) * 16}px)`;
    } else if (buttonStyle === 'soft') {
      transform = `translateY(${(1 - eased) * 12}px) scale(${0.96 + eased * 0.04})`;
      filter = `blur(${(1 - eased) * 4}px)`;
    }

    return {
      opacity: eased,
      transform,
      filter,
      pointerEvents: eased > 0.1 ? ('auto' as const) : ('none' as const),
      transition: 'opacity 0.1s ease-out, transform 0.1s ease-out, filter 0.1s ease-out',
    };
  };

  const buttonRevealStyle = getButtonRevealStyle();

  // Crossfade states
  const showAfterBg = timelineState.shouldShowFinalBackground;
  const afterBgType = normalized.afterSequence.backgroundType;
  const afterBgColor = normalized.afterSequence.color;
  const afterBgGradient = normalized.afterSequence.gradient;
  const afterBgImageUrl = normalized.afterSequence.imageUrl;
  const transitionDuration = timelineState.transitionDuration;

  const isYoutubeActive = hasUreelScene
    ? (scene.mode === 'video' && activeSceneVideoResult.type.startsWith('youtube'))
    : (normalized.enabled && 
       timelineState.shouldShowVideoLayer && 
       !timelineState.isAfterSequence &&
       mediaMode === 'youtube' && 
       (normalized.youtube?.url || normalized.youtubeUrl));
  const isUploadActive = hasUreelScene
    ? (scene.mode === 'video' && !activeSceneVideoResult.type.startsWith('youtube') && activeSceneVideoResult.type !== 'none')
    : (normalized.enabled && timelineState.shouldShowVideoLayer && mediaMode === 'upload');
  const isSlideshowActive = !hasUreelScene && normalized.enabled && timelineState.shouldShowVideoLayer && mediaMode === 'slideshow';

  const getYoutubeId = (url: string | undefined): string => {
    if (!url) return '';
    const match = url.trim().match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const activeYtUrl = hasUreelScene ? (activeSceneVideoResult.videoSrc || scene.video?.url || normalized.youtube?.url || normalized.youtubeUrl || '') : (normalized.youtube?.url || normalized.youtubeUrl || '');
  const ytId = isYoutubeActive ? getYoutubeId(activeYtUrl) : '';
  const ytLoopParam = '&loop=0';
  const ytMuteParam = normalized.youtube?.mute !== false ? '&mute=1' : '';
  const ytEmbedUrl = hasUreelScene
    ? activeSceneVideoResult.embedUrl
    : (isYoutubeActive && ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1${ytMuteParam}${ytLoopParam}&playsinline=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3` : '');

  const renderHeroVideoPlayer = () => {
    if (!hasUreelScene || activeSceneVideoResult.placement !== 'hero' || activeSceneVideoResult.type === 'none') {
      return null;
    }

    const isYt = activeSceneVideoResult.type === 'youtube' || activeSceneVideoResult.type === 'youtube_shorts';
    const videoSrcUrl = activeSceneVideoResult.videoSrc;

    return (
      <div 
        className={`${activeSceneVideoResult.heroSize === 'compact' ? 'w-[88%] mx-auto px-0 mt-3 mb-4' : 'w-[calc(100%+1.5rem)] -mx-3 -mt-3 mb-4'} z-10 shrink-0 pointer-events-auto`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div 
          className={`${activeSceneVideoResult.heroSize === 'compact' ? 'relative w-full aspect-video rounded-2xl border border-[#F5F2EA]/25 shadow-2xl' : 'relative w-full aspect-video rounded-none border-0 shadow-none'} overflow-hidden bg-stone-950 pointer-events-none`}
          style={{ imageRendering: 'auto' }}
        >
          {isYt && activeSceneVideoResult.embedUrl && (
            <iframe
              src={activeSceneVideoResult.embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              title="YouTube Hero Video"
              style={{
                pointerEvents: 'none',
              }}
            />
          )}

          {!isYt && videoSrcUrl && (
            <video
              src={videoSrcUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onLoadStart={() => setVideoStatus('loading')}
              onCanPlay={() => setVideoStatus('ready')}
              onPlay={() => setVideoStatus('ready')}
              onError={() => setVideoStatus('error')}
              onLoadedMetadata={(e) => {
                if (activeSceneVideoResult.startAt && e.currentTarget) {
                  e.currentTarget.currentTime = activeSceneVideoResult.startAt;
                }
              }}
              className="absolute inset-0 w-full h-full object-cover animate-fadeIn"
              style={{
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Non-blocking loading indicator overlay */}
          {videoStatus === 'loading' && !isYt && (
            <div className="absolute top-3 left-3 z-25 bg-stone-950/85 border border-stone-800/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center justify-center gap-1.5 text-stone-300">
              <LucideIcons.Loader2 size={10} className="text-[#A855F7] animate-spin" />
              <span className="text-[8px] uppercase font-black tracking-widest text-stone-200">
                {lang === 'de' ? 'Video lädt...' : 'Loading video...'}
              </span>
            </div>
          )}

          {/* Error fallback indicator */}
          {videoStatus === 'error' && (
            <div className="absolute inset-0 bg-stone-950/90 border border-stone-900 flex flex-col items-center justify-center p-3 text-center pointer-events-auto">
              <LucideIcons.AlertTriangle size={20} className="text-red-500 mb-1" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#A855F7]">
                {lang === 'de' ? 'Video-Link nicht abspielbar' : 'Video link unplayable'}
              </span>
              <p className="text-[8px] text-stone-400 mt-1 max-w-[180px] truncate">
                {activeSceneVideoResult.url}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Robust pointer events tracking to separate short edit-clicks from drag/long-presses
  const pointerRef = React.useRef<{
    id: string;
    startX: number;
    startY: number;
    startTime: number;
    timer: any;
    hasMoved: boolean;
  } | null>(null);

  const handleBtnPointerDown = (e: React.PointerEvent, btnId: string) => {
    if (isSortingMode) return;
    
    // Clear any active timer
    if (pointerRef.current?.timer) {
      clearTimeout(pointerRef.current.timer);
    }

    const timer = setTimeout(() => {
      if (pointerRef.current && pointerRef.current.id === btnId && !pointerRef.current.hasMoved) {
        console.log("POINTER LONG-PRESS TO JIGGLE ACTIVATED:", btnId);
        if (navigator.vibrate) {
          try { navigator.vibrate(60); } catch (_) {}
        }
        if (handleTouchStart) {
          handleTouchStart(btnId);
        }
      }
    }, 500); // 500ms stable hold required to activate sort/jiggle jiggle mode

    pointerRef.current = {
      id: btnId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      timer,
      hasMoved: false
    };
  };

  const handleBtnPointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current) return;
    const dx = Math.abs(e.clientX - pointerRef.current.startX);
    const dy = Math.abs(e.clientY - pointerRef.current.startY);
    
    // Greater than a tiny threshold indicates they are panning/scrolling or dragging
    if (dx > 8 || dy > 8) {
      pointerRef.current.hasMoved = true;
      if (pointerRef.current.timer) {
        clearTimeout(pointerRef.current.timer);
        pointerRef.current.timer = null;
      }
    }
  };

  const handleBtnPointerUp = (e: React.PointerEvent, btn: CardButton) => {
    const startState = pointerRef.current;
    if (startState && startState.id === btn.id) {
      if (startState.timer) {
        clearTimeout(startState.timer);
      }
      pointerRef.current = null;

      const duration = Date.now() - startState.startTime;
      const isQuickClick = duration < 350 && !startState.hasMoved;

      if (isQuickClick) {
        e.preventDefault();
        e.stopPropagation();
        console.log("POINTER DIRECT CLICK RECOGNIZED:", btn.id);
        if (isSortingMode && handleButtonTapOrClickInSortMode) {
          handleButtonTapOrClickInSortMode(btn.id);
        } else if (onEditButton) {
          onEditButton(btn);
        }
      }
    }
  };

  const handleBtnPointerCancel = () => {
    if (pointerRef.current) {
      if (pointerRef.current.timer) {
        clearTimeout(pointerRef.current.timer);
      }
      pointerRef.current = null;
    }
  };

  const cardPlan = card.plan || 'starter';
  const hasBrandingHiddenFeature = canUseFeature(cardPlan, 'brandingHidden');
  const isHidden = hasBrandingHiddenFeature && card.brandingHidden === true;

  // Background style parsing
  const bgEnabled = card.cardBackgroundEnabled !== false;
  const cardStyle: React.CSSProperties = {};
  let darkenOpacity = 0;
  let saturationFilter = '';
  let sceneBlurValue = '';

  if (hasUreelScene) {
    if (scene.mode === 'image' && scene.backgroundImageUrl) {
      cardStyle.backgroundImage = `url(${scene.backgroundImageUrl})`;
      cardStyle.backgroundSize = 'cover';
      cardStyle.backgroundRepeat = 'no-repeat';
      cardStyle.backgroundPosition = 'center';
    } else if (scene.mode === 'gradient' && scene.gradient) {
      const g = scene.gradient;
      cardStyle.background = `linear-gradient(${g.direction || '135deg'}, ${g.from}, ${g.to})`;
    } else if (scene.mode === 'color' && scene.backgroundColor) {
      cardStyle.background = scene.backgroundColor;
    } else if (scene.mode === 'video') {
      if (scene.backgroundImageUrl) {
        cardStyle.backgroundImage = `url(${scene.backgroundImageUrl})`;
        cardStyle.backgroundSize = 'cover';
        cardStyle.backgroundRepeat = 'no-repeat';
        cardStyle.backgroundPosition = 'center';
      } else {
        cardStyle.background = scene.backgroundColor || '#1c1b1a';
      }
    } else {
      cardStyle.background = '#1c1b1a';
    }

    darkenOpacity = (scene.overlay?.darken !== undefined ? scene.overlay.darken : 25) / 100;
    if (scene.overlay?.blur) {
      sceneBlurValue = `blur(${scene.overlay.blur}px)`;
    }
  } else {
    if (bgEnabled) {
      if (card.cardBackgroundImageUrl) {
        cardStyle.backgroundImage = `url(${card.cardBackgroundImageUrl})`;
        const fit = card.cardBackgroundMode || 'cover';
        cardStyle.backgroundSize = fit;
        cardStyle.backgroundRepeat = 'no-repeat';

        const offX = card.cardBackgroundOffsetX !== undefined ? card.cardBackgroundOffsetX : 0;
        const offY = card.cardBackgroundOffsetY !== undefined ? card.cardBackgroundOffsetY : 0;
        cardStyle.backgroundPosition = `calc(50% + ${offX}px) calc(50% + ${offY}px)`;

        if (card.cardBackgroundSaturation !== undefined) {
          saturationFilter = `saturate(${card.cardBackgroundSaturation}%)`;
        }

        darkenOpacity = (card.cardBackgroundDarken !== undefined ? card.cardBackgroundDarken : 25) / 100;
      } else if (card.cardBackgroundGradientEnabled && card.cardBackgroundGradientColor) {
        const gDir = card.cardBackgroundGradientDirection || '135deg';
        cardStyle.background = `linear-gradient(${gDir}, ${card.cardBackgroundColor || '#1C1C1E'} 0%, ${card.cardBackgroundGradientColor} 100%)`;
      } else if (card.cardBackgroundColor) {
        cardStyle.background = card.cardBackgroundColor;
      } else {
        cardStyle.background = card.backgroundColor || '#1C1C1E';
      }
    } else {
      const backgroundFit = card.backgroundImageFit || 'cover';
      if (card.backgroundType === 'image' && card.backgroundImageUrl) {
        cardStyle.backgroundImage = `url(${card.backgroundImageUrl})`;
        cardStyle.backgroundSize = backgroundFit === 'contain' ? 'contain' : backgroundFit === 'repeat' ? 'auto' : 'cover';
        cardStyle.backgroundRepeat = backgroundFit === 'repeat' ? 'repeat' : 'no-repeat';
        cardStyle.backgroundPosition = 'center';

        if (card.overlay === 'dark') darkenOpacity = 0.6;
        else if (card.overlay === 'light') darkenOpacity = 0.2;
      } else {
        cardStyle.background = card.backgroundColor || '#1E1E1E';
      }
    }
  }

  // Prevent responsive classes on desktop viewport from breaking the simulated pixel-proportion mock container
  const paddingClass = (isPreview || isMiniPreview)
    ? "px-3 py-4 pb-6 pt-3"
    : "px-3 py-4 sm:p-5 md:p-6 pb-6 pt-3 sm:pt-4 md:pt-18";

  const heroOffsetClass = (isPreview || isMiniPreview)
    ? "w-[calc(100%+1.5rem)] -mx-3 -mt-3 mb-6 z-10 shrink-0"
    : "w-[calc(100%+1.5rem)] -mx-3 sm:w-[calc(100%+2.5rem)] sm:-mx-5 md:w-[calc(100%+3rem)] md:-mx-6 -mt-3 sm:-mt-4 mb-6 z-10 shrink-0";



  // v23: Unified ureel card layer model.
  // The background is always the lowest 100% smartphone layer. Video, image, color and
  // gradient never push the card content around. Werbetexte/Vorlagen and action buttons
  // are separate layers on top, so they can appear/timeline without blocking each other.
  const useLayeredUreelCard = hasUreelScene && (cleanPreview || !isPreview || isMiniPreview);

  const fontFamilyForLayeredText = (style?: string) => {
    if (style === 'tech') return 'ui-monospace, SFMono-Regular, Menlo, monospace';
    if (style === 'serif') return 'Georgia, serif';
    if (style === 'condensed') return 'Bebas Neue, Impact, sans-serif';
    if (style === 'elegant') return 'Playfair Display, Georgia, serif';
    return 'Inter, ui-sans-serif, system-ui, sans-serif';
  };

  const layeredTemplate = card.ureelTextTemplate || {} as any;
  const layeredAccent = layeredTemplate.frame?.color || layeredTemplate.emphasis?.color || '#E8DCC2';
  const layeredFrameType = layeredTemplate.frame?.type || 'corner';
  const layeredBoxType = layeredTemplate.box?.type || 'transparent';
  const layeredFont = fontFamilyForLayeredText(layeredTemplate.fontStyle || card.textFontFamily || 'modern');

  const layeredTextBoxStyle = (): React.CSSProperties => {
    if (layeredBoxType === 'light') return { background: 'rgba(245,242,234,0.92)', color: '#141414', borderColor: 'rgba(232,220,194,0.72)' };
    if (layeredBoxType === 'glass') return { background: 'rgba(15,15,15,0.38)', backdropFilter: 'blur(10px)', borderColor: 'rgba(232,220,194,0.34)' };
    if (layeredBoxType === 'dark') return { background: 'rgba(8,8,8,0.72)', borderColor: 'rgba(232,220,194,0.28)' };
    if (layeredBoxType === 'transparent') return { background: 'rgba(10,10,10,0.22)', borderColor: 'rgba(232,220,194,0.16)' };
    return { background: 'transparent', borderColor: 'transparent' };
  };

  const layerTextWithHighlight = (text: string, className: string, style: React.CSSProperties) => {
    const clean = text || '';
    const mode = layeredTemplate.emphasis?.mode || 'none';
    if (!clean || mode === 'none') return <span className={className} style={style}>{clean}</span>;
    let target = '';
    if (mode === 'last_word') {
      const parts = clean.trim().split(/\s+/);
      target = parts.length > 1 ? parts[parts.length - 1] : clean;
    } else if (mode === 'custom_word') {
      target = layeredTemplate.emphasis?.word || '';
    }
    const idx = target ? clean.toLowerCase().lastIndexOf(target.toLowerCase()) : -1;
    if (idx < 0) return <span className={className} style={style}>{clean}</span>;
    return <span className={className} style={style}>{clean.slice(0, idx)}<span style={{ color: layeredAccent }}>{clean.slice(idx, idx + target.length)}</span>{clean.slice(idx + target.length)}</span>;
  };

  const filteredLayeredButtons = normalizeButtons(card.buttons || [])
    .filter((btn) => btn.isActive)
    .filter((btn) => {
      const label = `${btn.title || ''} ${btn.label || ''}`.toLowerCase();
      return !/(editor|timeline|vorschau|bearbeiten|ureel live|konu live|texte)/i.test(label);
    });

  const renderLayeredYoutube = (embedUrl: string, mode: 'cover' | 'contain' | 'heroWide' | 'heroCompact') => {
    const isHero = mode === 'heroWide' || mode === 'heroCompact';
    const frameClass = isHero
      ? 'absolute inset-0 w-full h-full'
      : 'absolute left-1/2 top-1/2 w-[178%] h-full -translate-x-1/2 -translate-y-1/2';
    return (
      <iframe
        src={embedUrl}
        className={frameClass}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        title="ureel scene video"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  const renderLayeredVideoSurface = () => {
    if (scene.mode !== 'video' || activeSceneVideoResult.type === 'none') return null;
    const isYt = activeSceneVideoResult.type === 'youtube' || activeSceneVideoResult.type === 'youtube_shorts';
    const src = activeSceneVideoResult.videoSrc;
    const embed = activeSceneVideoResult.embedUrl;
    const isHero = activeSceneVideoResult.placement === 'hero';
    const heroCompact = isHero && activeSceneVideoResult.heroSize === 'compact';

    if (isHero) {
      return (
        <div className={`${heroCompact ? 'absolute top-3 left-[6%] right-[6%] z-[8]' : 'absolute top-0 left-0 right-0 z-[8]'} aspect-video overflow-hidden ${heroCompact ? 'rounded-2xl border border-[#F5F2EA]/25 shadow-2xl' : 'rounded-none border-0'}`}>
          {isYt && embed && renderLayeredYoutube(embed, heroCompact ? 'heroCompact' : 'heroWide')}
          {!isYt && src && <video src={src} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />}
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        {isYt && embed && renderLayeredYoutube(embed, 'cover')}
        {!isYt && src && <video src={src} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />}
      </div>
    );
  };

  const renderLayeredAdText = () => {
    const title = (mappedCardData.title || mappedCardData.heroTitle || '').trim();
    const subtitle = (mappedCardData.subtitle || mappedCardData.heroSubtitle || '').trim();
    const description = (mappedCardData.description || mappedCardData.heroDescription || '').trim();
    const visibleTitle = showTitle && title.length > 0;
    const visibleSubtitle = showSubtitle && subtitle.length > 0;
    const visibleDescription = showDescription && description.length > 0;
    if (!visibleTitle && !visibleSubtitle && !visibleDescription) return null;

    const buttonsVisible = showButtons && filteredLayeredButtons.length > 0;
    const isHero = activeSceneVideoResult.placement === 'hero' && scene.mode === 'video';
    const endcardVideoActive = showEndCard && !!((endCardConfig as any).videoUrl || '').trim();
    const endcardVideoCompact = endcardVideoActive && ((endCardConfig as any).videoDisplayMode || 'wide') === 'compact';
    const heroTop = endcardVideoActive
      ? (endcardVideoCompact ? '30%' : '22%')
      : isHero
      ? (activeSceneVideoResult.heroSize === 'compact' ? '29%' : '33.5%')
      : (buttonsVisible ? '8%' : '14%');
    const safeBottom = buttonsVisible ? (filteredLayeredButtons.length > 6 ? '48%' : '42%') : '7%';
    const widthClass = layeredFrameType === 'badge' ? 'max-w-[78%]' : 'max-w-[82%]';
    const compactRatio = buttonsVisible ? (isHero || endcardVideoActive ? 0.50 : 0.62) : 0.92;
    const titleSize = Math.max(12, Math.min(buttonsVisible ? 20 : 38, Number((card as any).heroTitleSize || 30) * compactRatio));
    const subtitleSize = Math.max(6.5, Math.min(buttonsVisible ? 10 : 18, Number((card as any).heroSubtitleSize || 12) * (buttonsVisible ? 0.62 : 0.95)));
    const descriptionSize = Math.max(6.2, Math.min(buttonsVisible ? 8 : 15, Number((card as any).heroDescriptionSize || 11) * (buttonsVisible ? 0.58 : 1)));
    const boxStyle = layeredTextBoxStyle();
    const textZoneStyle: React.CSSProperties = {
      top: heroTop,
      bottom: safeBottom,
      display: 'flex',
      alignItems: buttonsVisible ? 'center' : 'center',
      justifyContent: 'center',
    };

    return (
      <div className={`absolute left-1/2 -translate-x-1/2 ${widthClass} z-[12] overflow-hidden pointer-events-none transition-all duration-500`} style={textZoneStyle}>
        <div className={`relative w-full max-h-full overflow-hidden rounded-3xl border ${buttonsVisible ? 'px-3 py-2' : 'px-5 py-5'} text-center shadow-2xl shadow-black/20 ureel-ad-anim-${layeredTemplate.animation || 'fade'}`} style={{ ...boxStyle, animationDuration: `${Number((card as any).adAnimationDuration || 1.2)}s` }}>
          {layeredFrameType === 'corner' && <><span className="absolute left-2 top-2 w-5 h-5 border-l-2 border-t-2" style={{ borderColor: layeredAccent }} /><span className="absolute right-2 top-2 w-5 h-5 border-r-2 border-t-2" style={{ borderColor: layeredAccent }} /><span className="absolute left-2 bottom-2 w-5 h-5 border-l-2 border-b-2" style={{ borderColor: layeredAccent }} /><span className="absolute right-2 bottom-2 w-5 h-5 border-r-2 border-b-2" style={{ borderColor: layeredAccent }} /></>}
          {layeredFrameType === 'thin' && <span className="absolute inset-2 rounded-2xl border border-dashed pointer-events-none" style={{ borderColor: `${layeredAccent}77` }} />}
          {layeredFrameType === 'side_line' && <span className="absolute left-3 top-5 bottom-5 w-1 rounded-full" style={{ background: layeredAccent }} />}
          {layeredFrameType === 'badge' && visibleSubtitle && <div className="inline-flex mb-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest" style={{ borderColor: `${layeredAccent}66`, color: layeredAccent }}>{subtitle}</div>}
          <div className={layeredFrameType === 'side_line' ? 'pl-4' : ''}>
            {visibleTitle && layerTextWithHighlight(title, 'block font-black uppercase leading-[0.92] break-words', { fontSize: titleSize, fontFamily: layeredFont, letterSpacing: layeredTemplate.fontStyle === 'elegant' ? '0.10em' : layeredTemplate.fontStyle === 'condensed' ? '0.02em' : '-0.03em', color: (card as any).heroTitleTextColor || (layeredBoxType === 'light' ? '#151515' : '#F5F2EA') })}
            {visibleSubtitle && layeredFrameType !== 'badge' && <span className="block mt-2 font-black uppercase leading-tight break-words" style={{ fontSize: subtitleSize, fontFamily: layeredFont, color: (card as any).heroSubtitleTextColor || (layeredBoxType === 'light' ? '#3A3732' : layeredAccent), letterSpacing: '0.06em' }}>{subtitle}</span>}
            {visibleDescription && <span className="block mt-2 font-semibold leading-snug break-words" style={{ fontSize: descriptionSize, fontFamily: layeredFont, color: (card as any).heroDescTextColor || (layeredBoxType === 'light' ? '#3A3732' : '#E8DCC2') }}>{description}</span>}
            {layeredFrameType === 'underline' && <span className="block mt-4 h-1 rounded-full mx-auto w-2/3" style={{ background: layeredAccent }} />}
          </div>
        </div>
      </div>
    );
  };

  if (useLayeredUreelCard) {
    const buttonDockMaxHeight = filteredLayeredButtons.length > 6 ? 'max-h-[40%]' : 'max-h-[36%]';
    return (
      <div
        onClick={() => {
          if (isPreview && onEditBackground) onEditBackground();
        }}
        className={`relative w-full h-full min-h-full overflow-hidden rounded-[23px] select-none ${isPreview ? 'cursor-pointer' : ''}`}
        style={cardStyle}
      >
        {/* Layer 1: full smartphone background surface. */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ ...cardStyle, filter: `${sceneBlurValue} ${saturationFilter}`.trim() || undefined }} />
        {renderLayeredVideoSurface()}
        {hasUreelScene && (
          <div
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              backgroundColor: scene.overlay?.darken ? `rgba(0,0,0,${scene.overlay.darken / 100})` : 'transparent',
              backgroundImage: scene.overlay?.vignette ? 'radial-gradient(circle, transparent 35%, rgba(0,0,0,0.55) 100%)' : undefined,
            }}
          />
        )}
        {!backgroundOnlyPreview && renderEndCardOverlay()}

        {/* Layer 2: Werbetext / template area. It can use the full card before buttons and compacts automatically when buttons appear. */}
        {!backgroundOnlyPreview && renderLayeredAdText()}

        {/* Layer 3: timed action dock. More than six buttons scroll inside the phone, the background remains fixed behind it. */}
        {!backgroundOnlyPreview && showButtons && filteredLayeredButtons.length > 0 && (
          <div
            className={`absolute left-3 right-3 bottom-3 z-[20] ${buttonDockMaxHeight} overflow-y-auto overflow-x-hidden scrollbar-none rounded-[24px] p-1 transition-all duration-500`}
            style={buttonRevealStyle}
          >
            <div
              className={`grid ${gridLayout.cols === 1 ? 'grid-cols-1' : gridLayout.cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
              style={{ gap: `${gridLayout.gapPx}px`, justifyItems: 'center' }}
            >
              {filteredLayeredButtons.map((btn) => (
                <ButtonRenderer
                  key={btn.id}
                  button={btn}
                  mode="public"
                  onClick={() => handleButtonClick && handleButtonClick(btn)}
                  lang={lang}
                  forceSquare={gridLayout.square}
                  forceSizePx={gridLayout.buttonSizePx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  if (isVideoBgActive) {
    // Scrollable layout context for immersive Reels experience
    const outerScrollClass = "w-full h-full relative flex-grow flex flex-col items-stretch overflow-y-auto overflow-x-hidden scrollbar-none select-none transition-all duration-300 scroll-smooth rounded-[23px]";
    const innerPaddingClass = isPreview || isMiniPreview
      ? "px-3 py-4 pb-6 pt-3"
      : "px-3 py-4 sm:p-5 md:p-6 pb-6 pt-3 sm:pt-4 md:pt-18";

    // Story viewport is sized to full mobile viewport dH or editor simulated height
    const storyViewportHeightClass = isMiniPreview
      ? "h-[500px] min-h-[500px]"
      : isPreview
      ? "h-[640px] min-h-[640px]"
      : "h-[100dvh] min-h-[100dvh]";

    return (
      <div
        onClick={() => {
          if (isPreview && onEditBackground) {
            onEditBackground();
          }
        }}
        className={`${outerScrollClass} ${isPreview ? 'cursor-pointer' : ''}`}
      >
        {/* STORY VIEWPORT AREA (Viewport 1: Immersive Video, Text Overlays, Buttons Grid) */}
        <div className={`w-full relative ${innerPaddingClass} shrink-0 flex flex-col items-center justify-start overflow-hidden ${storyViewportHeightClass}`}>
          {/* Background layer */}
          <div
            className="absolute inset-0 pointer-events-none z-0 transition-all duration-200"
            style={{
              ...cardStyle,
              filter: `${sceneBlurValue} ${saturationFilter}`.trim() || undefined,
            }}
          />


          {/* Video / Reel Background Layer (above standard bg, below elements) */}
          {activeSceneVideoResult.placement !== 'hero' && (
            <div 
              className={`absolute inset-0 z-1 pointer-events-none overflow-hidden transition-opacity ease-in-out ${(videoSrc && videoStatus === 'ready') || isYoutubeActive || isSlideshowActive ? 'bg-stone-950' : 'bg-transparent'}`}
              style={{
                opacity: timelineState.videoLayerOpacity,
                transitionDuration: `${transitionDuration}s`,
              }}
            >
            {isYoutubeActive && ytEmbedUrl && (
              <iframe
                src={ytEmbedUrl}
                className={
                  hasUreelScene
                    ? (activeSceneVideoResult.displayMode === 'cover'
                      ? "absolute top-1/2 left-1/2 h-full w-[178%] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2"
                      : "absolute inset-0 w-full h-full")
                    : ((normalized.videoFitMode === 'cover')
                      ? "absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 object-cover"
                      : "absolute inset-0 w-full h-full")
                }
                frameBorder="0"
                allow="autoplay; encrypted-media"
                title="YouTube Background Video"
                style={{
                  filter: hasUreelScene ? undefined : `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
            {isUploadActive && (() => {
              const resolvedThumbnailUrl = (normalized as any).thumbnailUrl || normalized.upload?.thumbnailUrl;
              const posterUrl = hasUreelScene 
                ? (scene.backgroundImageUrl || '')
                : (resolvedThumbnailUrl || 
                   normalized.afterSequence?.imageUrl || 
                   card.cardBackgroundImageUrl || 
                   card.ogImageUrl || 
                   '');

              if (videoSrc) {
                return (
                  <>
                    <video
                      ref={videoRef}
                      key={videoSrc}
                      src={videoSrc}
                      poster={posterUrl}
                      autoPlay
                      muted
                      loop={hasUreelScene ? true : (normalized.loop?.enabled ?? false)}
                      playsInline
                      preload="auto"
                      onLoadStart={() => {
                        console.log(`[VIDEO EVENTS BI] onLoadStart triggered for: ${videoSrc}`);
                        setVideoStatus('loading');
                      }}
                      onLoadedMetadata={() => {
                        console.log(`[VIDEO DIAGNOSTIC] Metadata loaded for source: ${videoSrc}`);
                        console.log(`[VIDEO EVENTS BI] onLoadedMetadata triggered`);
                        if (hasUreelScene && activeSceneVideoResult.startAt && videoRef.current) {
                          videoRef.current.currentTime = activeSceneVideoResult.startAt;
                        }
                      }}
                      onLoadedData={() => {
                        console.log(`[VIDEO DIAGNOSTIC] Data loaded for source: ${videoSrc}`);
                        console.log(`[VIDEO EVENTS BI] onLoadedData triggered`);
                      }}
                      onCanPlay={() => {
                        console.log(`[VIDEO DIAGNOSTIC] Can play source: ${videoSrc}`);
                        console.log(`[VIDEO EVENTS BI] onCanPlay triggered`);
                        setVideoStatus('ready');
                      }}
                      onPlay={() => {
                        console.log(`[VIDEO DIAGNOSTIC] Play started: ${videoSrc}`);
                        console.log(`[VIDEO EVENTS BI] onPlay triggered`);
                        setVideoStatus('ready');
                      }}
                      onPause={() => {
                        console.log(`[VIDEO DIAGNOSTIC] Play paused/stopped: ${videoSrc}`);
                        console.log(`[VIDEO EVENTS BI] onPause triggered`);
                      }}
                      onError={(e) => {
                        console.error(`[VIDEO DIAGNOSTIC] Playback error for source: ${videoSrc}`, e);
                        console.log(`[VIDEO EVENTS BI] onError triggered`);
                        setVideoStatus('error');
                      }}
                      className={`absolute inset-0 w-full h-full animate-fadeIn ${(hasUreelScene ? activeSceneVideoResult.displayMode === 'cover' : normalized.videoFitMode === 'cover') ? 'object-cover' : 'object-contain'}`}
                      style={{
                        filter: hasUreelScene ? undefined : `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Non-blocking loading indicator overlay */}
                    {videoStatus === 'loading' && (
                      <div id="video-loading-indicator" className="absolute top-4 left-4 z-20 bg-stone-950/85 border border-stone-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center justify-center gap-2 text-stone-300 shadow-xl pointer-events-none select-none">
                        <LucideIcons.Loader2 size={11} className="text-[#A855F7] animate-spin" />
                        <span className="text-[9px] uppercase font-black tracking-widest text-stone-205">
                          {lang === 'de' ? 'Video lädt...' : 'Loading video...'}
                        </span>
                      </div>
                    )}

                    {/* Error fallback decoded indicator as a non-blocking pill */}
                    {videoStatus === 'error' && (
                      <div id="video-error-indicator" className="absolute top-4 left-4 z-20 bg-red-950/90 border border-red-900/40 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center justify-center gap-2 text-red-300 shadow-xl pointer-events-none select-none">
                        <LucideIcons.AlertTriangle size={11} className="text-red-400" />
                        <span className="text-[9px] uppercase font-black tracking-widest">
                          {lang === 'de' ? 'Video nicht abspielbar' : 'Video not playable'}
                        </span>
                      </div>
                    )}
                  </>
                );
              }

              // Fall processing/preparation
              if (isUploadProcessing) {
                // Return a beautiful, subtle overlay notification instead of complete screen-block, letting standard background image show as fallback!
                return (
                  <div id="video-placeholder-container" className="absolute top-4 right-4 z-[999] bg-stone-950/80 border border-stone-800/85 backdrop-blur-md px-3.5 py-1.5 rounded-full flex flex-col items-stretch justify-center gap-1 text-stone-300 shadow-xl select-none animate-pulse max-w-[280px]">
                    <div className="flex items-center justify-center gap-2">
                      <LucideIcons.Loader2 size={12} className="text-[#A855F7] animate-spin" />
                      <span className="text-[9.5px] uppercase font-black tracking-widest text-[#A855F7]">
                        {lang === 'de' ? 'Video wird vorbereitet...' : 'Preparing Video...'}
                      </span>
                    </div>
                    {showLongProcessingWarning && (
                      <span className="text-[8px] text-stone-400 font-medium text-center mt-0.5 leading-normal">
                        {lang === 'de' 
                          ? 'Video wird noch vorbereitet. Die Karte ist trotzdem nutzbar.' 
                          : 'Video is still being prepared. The card remains fully functional.'}
                      </span>
                    )}
                  </div>
                );
              }

              // Fall failed or fall no url: renders nothing, letting standard static card background show cleanly
              return null;
            })()}
            {isSlideshowActive && normalized.slideshow?.images && normalized.slideshow.images.length > 0 && (
              <div className="absolute inset-0 bg-stone-950 animate-fadeIn">
                {normalized.slideshow.images.map((img, idx) => {
                  const totalImages = normalized.slideshow?.images?.length || 1;
                  const activeIdx = Math.min(Math.floor(effectiveTime / 3), totalImages - 1);
                  const isActive = activeIdx === idx;
                  
                  // Compute dynamic transition timing with custom soft easing curves
                  const slideTransitionType = normalized.slideshow?.transition || 'very_soft';
                  let slideTransitionStr = 'none';
                  if (slideTransitionType !== 'hard') {
                    const durationMap = { very_soft: 1800, soft: 1200, medium: 800 };
                    const ms = durationMap[slideTransitionType as 'very_soft' | 'soft' | 'medium'] || 1800;
                    slideTransitionStr = `opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`; // elegant ease-in-out curve
                  }

                  return (
                    <img
                      key={idx}
                      src={img.url}
                      alt={img.alt || `Slide ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transition: slideTransitionStr,
                        filter: `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* After video transition background layer */}
          {normalized.enabled && afterBgType !== 'same' && (
            <div
              className="absolute inset-0 z-2 pointer-events-none transition-opacity ease-in-out"
              style={{
                transitionDuration: `${transitionDuration}s`,
                opacity: showAfterBg ? 1 : 0,
                background: afterBgType === 'color' 
                  ? afterBgColor
                  : afterBgType === 'gradient'
                  ? afterBgGradient
                  : undefined,
                backgroundImage: afterBgType === 'image' && afterBgImageUrl
                  ? `url(${afterBgImageUrl})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          {/* Custom Text/Schriften Overlay */}
          {normalized.textOverlay?.enabled && timelineState.textRevealProgress > 0 && normalized.textOverlay.content && (
            <div
              style={getTextOverlayStyle()}
              className="z-[15] px-4 leading-normal pointer-events-none w-full max-w-[90%] break-words whitespace-pre-wrap select-none font-bold"
            >
              {normalized.textOverlay.content}
            </div>
          )}

          {/* UreelScene Unified Overlay (Darken + vignette) */}
          {hasUreelScene && (
            <div 
              className="absolute inset-0 pointer-events-none transition-all duration-300"
              style={{
                zIndex: 5,
                backgroundColor: scene.overlay?.darken ? `rgba(0,0,0,${scene.overlay.darken / 100})` : 'transparent',
                backgroundImage: scene.overlay?.vignette ? 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.65) 100%)' : undefined,
              }}
            />
          )}

          {/* Darken/Overlay Layer */}
          {!hasUreelScene && darkenOpacity > 0 && !isVideoBgActive && (
            <div
              className="absolute inset-0 pointer-events-none z-0 bg-black transition-all duration-200"
              style={{ opacity: darkenOpacity }}
            />
          )}

          {/* Simple Grid Dots overlays */}
          {isPreview && !cleanPreview && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25 z-0"
              style={{
                backgroundImage: 'radial-gradient(#A855F7 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          )}

          {/* Background Edit Floating Overlay Button */}
          {isPreview && !cleanPreview && onEditBackground && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditBackground();
              }}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black border border-stone-700 hover:border-[#A855F7] p-2 rounded-full text-[#A855F7] transition-all z-10"
              title="Hintergrund bearbeiten"
            >
              <LucideIcons.Palette size={14} />
            </button>
          )}

          {/* 16:9 / top video screen for contain and hero scene modes */}
          {renderHeroVideoPlayer()}

          {/* PROFILE BLOCK SECTION (Wrapped dynamically for Click to Edit in Preview with animation timing) */}
          <div
            onClick={(e) => {
              if (isReelView) {
                e.stopPropagation();
                onToggleElementInReel && onToggleElementInReel('includeProfileSection');
              } else if (isPreview && onEditProfileHero) {
                e.stopPropagation();
                onEditProfileHero();
              }
            }}
            style={profileRevealStyle}
            className={`${heroOffsetClass} flex flex-col relative ${
              isReelView
                ? `cursor-pointer transition duration-150 border-2 border-dashed ${
                    reelModeConfig?.includeProfileSection === false 
                      ? 'border-red-500/50 opacity-30 bg-red-950/20' 
                      : 'border-transparent hover:border-[#A855F7]'
                  } p-0.5 rounded-xl`
                : isPreview
                ? 'relative cursor-pointer transition-all duration-200 group overflow-hidden border-y border-transparent hover:border-[#A855F7]/50'
                : ''
            }`}
          >
            {/* Floating Edit Icon Overlay if Preview mode */}
            {isPreview && !cleanPreview && !isReelView && (
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#A855F7] text-stone-950 p-1.5 rounded-full shadow-lg z-30 animate-pulse">
                <LucideIcons.Edit2 size={11} />
              </div>
            )}

            {isReelView && reelModeConfig?.includeProfileSection === false && (
              <div className="absolute inset-0 z-30 bg-stone-950/50 rounded-xl flex items-center justify-center pointer-events-none select-none">
                <div className="bg-stone-900 border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-red-500 shadow-xl">
                  <LucideIcons.EyeOff size={13} />
                  <span>{lang === 'de' ? 'Profilbereich ausgeblendet' : 'Profile hidden'}</span>
                </div>
              </div>
            )}

            <ProfileHeroSection
              card={mappedCardData}
              className="rounded-none border-x-0 border-t-0"
              isEditorMode={cleanPreview ? false : (isPreview || isMiniPreview)}
              lang={lang}
              onEditBackground={cleanPreview ? undefined : onEditBackground}
              onEditProfileHero={cleanPreview ? undefined : onEditProfileHero}
              effectiveTime={effectiveTime}
              timelineState={timelineState}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              showDescription={showDescription}
              onPreview={
                cleanPreview ? undefined : isPreview
                  ? () => {
                      if (card.slug) {
                        window.open(`${window.location.origin}/u/${card.slug}`, '_blank');
                      }
                    }
                  : undefined
              }
            />
          </div>

          {/* Endcard HTML/CSS Overlay */}
          {!backgroundOnlyPreview && renderEndCardOverlay()}

          {/* INTERACTIVE SORT MODE ALERT BOX inside Card Shell */}
          {isPreview && !cleanPreview && isSortingMode && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-stone-950/95 border border-[#A855F7]/30 rounded-2xl p-3 mb-4 space-y-2 shadow-xl z-20 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#A855F7]">
                  <LucideIcons.Move size={14} className="animate-pulse shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Tausch-/Sortiermodus</span>
                </div>
              </div>
              <p className="text-[9px] text-stone-300 leading-relaxed font-semibold">
                {lang === 'de'
                  ? 'Ziehe Buttons zum Verschieben oder tippe nacheinander zwei Kacheln an, um sie sofort zu tauschen.'
                  : 'Drag buttons to sort, or tap two tiles in sequence to swap them instantly.'}
              </p>
              {swapSelectionId && (
                <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl p-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-[#A855F7] font-bold">
                    {lang === 'de' ? 'Kachel ausgewählt. Wähle eine andere zum Tauschen.' : 'Tile selected. Tap target to swap.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* COMBINED GRID OF ACTIVE BUTTONS */}
          <div
            className={`w-full z-10 grid ${gridLayout.cols === 1 ? 'grid-cols-1' : gridLayout.cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} mb-2 transition-all mt-auto`}
            style={{
              ...buttonRevealStyle,
              gap: `${gridLayout.gapPx}px`,
              justifyContent: 'center',
              justifyItems: 'center',
            }}
          >
            {normalizeButtons(card.buttons || [])
              .filter((btn) => btn.isActive)
              .map((btn) => {
                if (isPreview && !cleanPreview) {
                  const isDragSource = draggedButtonId === btn.id;
                  const isDragTarget = dragOverButtonId === btn.id;
                  const isSelectedForSwap = swapSelectionId === btn.id;
                  const btnRadiusClass = btn.radius === 'square' ? 'rounded-none' : btn.radius === 'pill' ? 'rounded-full' : 'rounded-2xl';
                  const scaleFactor = getButtonScaleFactor(btn);

                  return (
                    <div
                      key={btn.id}
                      draggable={isSortingMode}
                      onDragStart={handleDragStart ? (e) => handleDragStart(e, btn.id) : undefined}
                      onDragOver={handleDragOver ? (e) => handleDragOver(e, btn.id) : undefined}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop ? (e) => handleDrop(e, btn.id) : undefined}
                      onPointerDown={(e) => handleBtnPointerDown(e, btn.id)}
                      onPointerMove={handleBtnPointerMove}
                      onPointerUp={(e) => {
                        if (pointerRef.current && pointerRef.current.id === btn.id) {
                          if (pointerRef.current.timer) {
                            clearTimeout(pointerRef.current.timer);
                          }
                          pointerRef.current = null;
                        }
                      }}
                      onPointerCancel={handleBtnPointerCancel}
                      onPointerLeave={handleBtnPointerCancel}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log("CARD BUTTON CLICKED IN EDITOR CONTEXT:", btn);
                        if (isSortingMode && handleButtonTapOrClickInSortMode) {
                          handleButtonTapOrClickInSortMode(btn.id);
                        } else if (onEditButton) {
                          onEditButton(btn);
                        }
                      }}
                      className={`relative cursor-pointer aspect-square ${btnRadiusClass} select-none group shadow transition-all duration-150 overflow-hidden ${
                        isSortingMode ? 'animate-jiggle border border-[#A855F7]/30 font-sans' : 'hover:scale-[1.04]'
                      } ${isDragSource ? 'dragging-preview animate-none opacity-50' : ''} ${
                        isDragTarget ? 'border-2 border-dashed border-[#A855F7] scale-[1.08] animate-none' : ''
                      } ${isSelectedForSwap ? 'ring-2 ring-[#A855F7] scale-[1.06] border-2 border-[#A855F7] animate-pulse' : ''}`}
                      style={{
                        width: gridLayout.buttonSizePx ? `${gridLayout.buttonSizePx}px` : `${scaleFactor * 100}%`,
                        height: gridLayout.buttonSizePx ? `${gridLayout.buttonSizePx}px` : (gridLayout.square ? '100%' : `${scaleFactor * 100}%`),
                        margin: 'auto',
                      }}
                    >
                      <ButtonRenderer
                        button={btn}
                        mode="editor"
                        onClick={() => {}}
                        isSortingMode={isSortingMode}
                        lang={lang}
                        forceSquare={gridLayout.square}
                        forceSizePx={gridLayout.buttonSizePx}
                      />

                      {/* Interactive Edit/Move Badge Overlay */}
                      <div className="absolute top-1.5 right-1.5 bg-[#A855F7] text-stone-950 rounded-full p-1 z-20 shadow-md">
                        {isSortingMode ? (
                          isSelectedForSwap ? (
                            <LucideIcons.Check size={7} className="font-extrabold text-stone-950" />
                          ) : (
                            <LucideIcons.Move size={7} className="text-stone-950" />
                          )
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <LucideIcons.Edit2 size={7} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Reel Customizer Video Mode
                if (isReelView) {
                  const isBtnHidden = reelModeConfig?.hiddenButtonIds?.includes(btn.id) || reelModeConfig?.includeButtons === false;
                  return (
                    <div
                      key={btn.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (reelModeConfig?.includeButtons === false) {
                          onToggleElementInReel && onToggleElementInReel('includeButtons');
                        } else {
                          onToggleElementInReel && onToggleElementInReel('button', btn.id);
                        }
                      }}
                      className={`relative cursor-pointer transition duration-150 select-none ${
                        isBtnHidden 
                          ? 'opacity-25 border-2 border-dashed border-red-500/40 hover:border-red-500' 
                          : 'border-2 border-dashed border-transparent hover:border-[#A855F7]'
                      } rounded-xl`}
                    >
                      <ButtonRenderer
                        button={btn}
                        mode="public"
                        onClick={() => {}}
                        lang={lang}
                      />
                      {isBtnHidden && (
                        <div className="absolute inset-0 bg-stone-950/40 rounded-xl flex items-center justify-center">
                          <LucideIcons.EyeOff size={16} className="text-red-500 bg-stone-900 border border-red-500/20 p-1 rounded-full shadow-lg" />
                        </div>
                      )}
                    </div>
                  );
                }

                // Public / Live Visitor Mode
                return (
                  <ButtonRenderer
                    key={btn.id}
                    button={btn}
                    mode="public"
                    onClick={() => handleButtonClick && handleButtonClick(btn)}
                    lang={lang}
                  />
                );
              })}

            {/* WORKSPACE "+" SPECIAL ADD BUTTON SLOT - ONLY FOR EDITOR */}
            {isPreview && !cleanPreview && !isSortingMode && onAddButton && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onAddButton();
                }}
                className="relative cursor-pointer aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#A855F7]/60 hover:border-[#A855F7] bg-stone-900/60 hover:bg-stone-900 hover:scale-[1.04] transition-all duration-150 p-2 shadow"
              >
                <LucideIcons.PlusCircle size={22} className="text-[#A855F7]" />
                <span className="text-[9px] font-bold text-center uppercase tracking-wider text-stone-400">
                  Neu
                </span>
              </div>
            )}
          </div>

          {/* Touch sort/hold tip inside Card Shell */}
          {isPreview && !cleanPreview && (
            <div className="w-full text-center mt-3 py-2 px-3 bg-stone-900/50 border border-stone-850/60 rounded-xl text-[10px] text-stone-450 font-medium flex items-center justify-center gap-1.5 select-none z-10 shrink-0">
              <LucideIcons.Move size={11} className="text-[#A855F7] shrink-0 animate-pulse" />
              <span>
                {lang === 'de'
                  ? 'Tipp: Halte einen Button gedrückt, um ihn zu verschieben.'
                  : 'Tip: Press and hold a button to move it.'}
              </span>
            </div>
          )}
        </div>

        {/* BRIGHT SYSTEM ACTIONS (Viewport 2: Save, CTA, Branding notices below Story viewport) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[#111111] border-t border-[#A855F7]/25 p-5 flex flex-col gap-4 z-10 shadow-lg select-none relative font-sans rounded-b-[23px] shrink-0"
        >
          {/* Zeile 1: Brand Header */}
          {!isHidden && (
            <div className="flex items-center justify-center gap-1.5 py-0.5 select-none text-center">
              <span className="w-4.5 h-4.5 rounded bg-purple-950/50 border border-[#A855F7]/40 flex items-center justify-center shrink-0">
                <LucideIcons.Tv size={12} className="text-[#A855F7]" />
              </span>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#A855F7]">ureel.me</span>
              <span className="text-stone-600 text-[10px] font-bold">•</span>
              <p className="text-[10px] font-medium text-stone-400 font-sans tracking-wide leading-none select-none">
                {t.brandSlogan}
              </p>
            </div>
          )}

          {/* Primärer Button: In Kontakten speichern */}
          <button
            onClick={() => triggerVCardDownload && triggerVCardDownload()}
            title={t.saveContactTooltip}
            className="w-full bg-[#A855F7] hover:bg-[#7E22CE] active:bg-[#A855F7]/80 text-[#0B0B0B] font-black text-sm uppercase tracking-widest rounded-xl py-3.5 px-5 flex items-center justify-center gap-2.5 transition duration-200 shadow-md cursor-pointer select-none"
          >
            <LucideIcons.UserPlus size={16} className="text-stone-950" />
            <span>{t.saveContact}</span>
          </button>

          {/* Sekundärer Button: Eigene ureel erstellen */}
          <button
            onClick={() => handleCtaClick && handleCtaClick()}
            className="w-full bg-stone-900 hover:bg-stone-850 active:bg-stone-950 text-[#F5EFE3] hover:text-white border border-[#A855F7]/40 hover:border-[#A855F7] rounded-xl py-3 px-5 flex items-center justify-center gap-2 transition duration-200 text-xs font-black uppercase tracking-wider cursor-pointer select-none"
          >
            <LucideIcons.Sparkles size={14} className="text-[#A855F7] shrink-0" />
            <span>{t.createYourOwn}</span>
          </button>

          {/* Teilen & Melden Bereich */}
          <div className="flex items-center justify-between border-t border-stone-850/50 pt-3 text-[10px]">
            <button
              onClick={() => setShowShareModal && setShowShareModal(true)}
              className="text-stone-400 hover:text-purple-400 flex items-center gap-1.5 transition duration-150 cursor-pointer select-none py-1 px-2 hover:bg-stone-900 rounded-lg"
            >
              <LucideIcons.Share2 size={12} className="text-[#A855F7]" />
              <span className="font-bold uppercase tracking-wider">{t.share}</span>
            </button>

            {!isPreview && (
              <button
                type="button"
                onClick={() => {}}
                className="text-stone-500 hover:text-red-400 flex items-center gap-1.5 transition duration-150 cursor-pointer select-none py-1 px-2 hover:bg-stone-900 rounded-lg bg-transparent border-0"
              >
                <LucideIcons.AlertTriangle size={12} />
                <span className="font-bold uppercase tracking-wider">{lang === 'de' ? 'Inhalt melden' : 'Report Content'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Classic fallback layout preserved 100% to protect static background designs
  return (
    <div
      onClick={() => {
        if (isPreview && onEditBackground) {
          onEditBackground();
        }
      }}
      className={`w-full relative ${paddingClass} flex-grow flex flex-col items-center justify-start overflow-hidden select-none transition-all duration-300 ${
        isPreview ? 'cursor-pointer' : ''
      }`}
    >
      {/* Background layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-200"
        style={{
          ...cardStyle,
          filter: `${sceneBlurValue} ${saturationFilter}`.trim() || undefined,
        }}
      />

      {/* Video / Reel Background Layer (above standard bg, below elements) */}
      {(hasUreelScene ? (scene.mode === 'video' && activeSceneVideoResult.placement !== 'hero') : (normalized.enabled && !timelineState.isAfterSequence)) && (
        <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden bg-stone-950">
          {isYoutubeActive && ytEmbedUrl && (
            <iframe
              src={ytEmbedUrl}
              className={
                hasUreelScene
                  ? (activeSceneVideoResult.displayMode === 'cover'
                    ? "absolute top-1/2 left-1/2 h-full w-[178%] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2"
                    : "absolute inset-0 w-full h-full")
                  : (normalized.videoFitMode === 'cover'
                    ? "absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 object-cover"
                    : "absolute inset-0 w-full h-full")
              }
              frameBorder="0"
              allow="autoplay; encrypted-media"
              title="YouTube Background Video"
              style={{
                filter: hasUreelScene ? undefined : `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                pointerEvents: 'none',
              }}
            />
          )}
          {isUploadActive && (
            videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full ${
                  (hasUreelScene ? activeSceneVideoResult.displayMode === 'cover' : normalized.videoFitMode === 'cover') ? 'object-cover' : 'object-contain'
                }`}
                style={{
                  filter: hasUreelScene ? undefined : `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-stone-900 border border-stone-850 p-4 flex flex-col items-center justify-center text-center">
                <LucideIcons.Tv size={28} className="text-[#A855F7] mb-2 animate-pulse" />
                <span className="text-[10px] text-stone-200 font-extrabold uppercase tracking-widest block">Video Reel Upload</span>
                <p className="text-[8px] text-stone-400 max-w-[180px] mt-1 leading-relaxed">
                  Der Video-Hintergrund wird hochgeladen und kommt später serverseitig.
                </p>
              </div>
            )
          )}
          {isSlideshowActive && normalized.slideshow?.images && normalized.slideshow.images.length > 0 && (
            <div className="absolute inset-0 bg-stone-950 animate-fadeIn">
              {normalized.slideshow.images.map((img, idx) => {
                const totalImages = normalized.slideshow?.images?.length || 1;
                const activeIdx = Math.min(Math.floor(effectiveTime / 3), totalImages - 1);
                const isActive = activeIdx === idx;
                
                // Compute dynamic transition timing with custom soft easing curves
                const slideTransitionType = normalized.slideshow?.transition || 'very_soft';
                let slideTransitionStr = 'none';
                if (slideTransitionType !== 'hard') {
                  const durationMap = { very_soft: 1800, soft: 1200, medium: 805 };
                  const ms = durationMap[slideTransitionType as 'very_soft' | 'soft' | 'medium'] || 1800;
                  slideTransitionStr = `opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`; // elegant ease-in-out curve
                }

                return (
                  <img
                    key={idx}
                    src={img.url}
                    alt={img.alt || `Slide ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transition: slideTransitionStr,
                      filter: `brightness(${(100 - (card.cardBackgroundDarken ?? 25)) / 100}) saturate(${(card.cardBackgroundSaturation ?? 100)}%)`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* After video transition background layer */}
      {normalized.enabled && afterBgType !== 'same' && (
        <div
          className="absolute inset-0 z-2 pointer-events-none transition-opacity ease-in-out"
          style={{
            transitionDuration: `${transitionDuration}s`,
            opacity: showAfterBg ? 1 : 0,
            background: afterBgType === 'color' 
              ? afterBgColor
              : afterBgType === 'gradient'
              ? afterBgGradient
              : undefined,
            backgroundImage: afterBgType === 'image' && afterBgImageUrl
              ? `url(${afterBgImageUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Custom Text/Schriften Overlay */}
      {normalized.textOverlay?.enabled && timelineState.textRevealProgress > 0 && normalized.textOverlay.content && (
        <div
          style={getTextOverlayStyle()}
          className="z-[15] px-4 leading-normal pointer-events-none w-full max-w-[90%] break-words whitespace-pre-wrap select-none font-bold"
        >
          {normalized.textOverlay.content}
        </div>
      )}

      {/* UreelScene Unified Overlay (Darken + vignette) */}
      {hasUreelScene && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            zIndex: 5,
            backgroundColor: scene.overlay?.darken ? `rgba(0,0,0,${scene.overlay.darken / 100})` : 'transparent',
            backgroundImage: scene.overlay?.vignette ? 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.65) 100%)' : undefined,
          }}
        />
      )}

      {/* Darken/Overlay Layer */}
      {!hasUreelScene && darkenOpacity > 0 && !isVideoBgActive && (
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-black transition-all duration-200"
          style={{ opacity: darkenOpacity }}
        />
      )}

      {/* Simple Grid Dots overlays to indicate interactive background in editor mode */}
      {isPreview && !cleanPreview && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage: 'radial-gradient(#A855F7 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* Background Edit Floating Overlay Button */}
      {isPreview && !cleanPreview && onEditBackground && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditBackground();
          }}
          className="absolute top-4 right-4 bg-black/60 hover:bg-black border border-stone-700 hover:border-[#A855F7] p-2 rounded-full text-[#A855F7] transition-all z-10"
          title="Hintergrund bearbeiten"
        >
          <LucideIcons.Palette size={14} />
        </button>
      )}

      {/* 16:9 / top video screen for contain and hero scene modes */}
      {renderHeroVideoPlayer()}

      {/* PROFILE BLOCK SECTION (Wrapped dynamically for Click to Edit in Preview with animation timing) */}
      <div
        onClick={(e) => {
          if (isReelView) {
            e.stopPropagation();
            onToggleElementInReel && onToggleElementInReel('includeProfileSection');
          } else if (isPreview && onEditProfileHero) {
            e.stopPropagation();
            onEditProfileHero();
          }
        }}
        style={profileRevealStyle}
        className={`${heroOffsetClass} flex flex-col relative ${
          isReelView
            ? `cursor-pointer transition duration-150 border-2 border-dashed ${
                reelModeConfig?.includeProfileSection === false 
                  ? 'border-red-500/50 opacity-30 bg-red-950/20' 
                  : 'border-transparent hover:border-[#A855F7]'
              } p-0.5 rounded-xl`
            : isPreview
            ? 'relative cursor-pointer transition-all duration-200 group overflow-hidden border-y border-transparent hover:border-[#A855F7]/50'
            : ''
        }`}
      >
        {/* Floating Edit Icon Overlay if Preview mode */}
        {isPreview && !cleanPreview && !isReelView && (
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#A855F7] text-stone-950 p-1.5 rounded-full shadow-lg z-30 animate-pulse">
            <LucideIcons.Edit2 size={11} />
          </div>
        )}

        {isReelView && reelModeConfig?.includeProfileSection === false && (
          <div className="absolute inset-0 z-30 bg-stone-950/50 rounded-xl flex items-center justify-center pointer-events-none select-none">
            <div className="bg-stone-900 border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold text-red-500 shadow-xl">
              <LucideIcons.EyeOff size={13} />
              <span>{lang === 'de' ? 'Profilbereich ausgeblendet' : 'Profile hidden'}</span>
            </div>
          </div>
        )}

        <ProfileHeroSection
          card={mappedCardData}
          className="rounded-none border-x-0 border-t-0"
          isEditorMode={cleanPreview ? false : (isPreview || isMiniPreview)}
          lang={lang}
          onEditBackground={onEditBackground}
          onEditProfileHero={onEditProfileHero}
          effectiveTime={effectiveTime}
          timelineState={timelineState}
          showTitle={showTitle}
          showSubtitle={showSubtitle}
          showDescription={showDescription}
          onPreview={
            isPreview
              ? () => {
                  if (card.slug) {
                    window.open(`${window.location.origin}/u/${card.slug}`, '_blank');
                  }
                }
              : undefined
          }
        />
      </div>

      {/* Endcard HTML/CSS Overlay */}
      {!backgroundOnlyPreview && renderEndCardOverlay()}

      {/* INTERACTIVE SORT MODE ALERT BOX inside Card Shell */}
      {isPreview && !cleanPreview && isSortingMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-stone-950/95 border border-[#A855F7]/30 rounded-2xl p-3 mb-4 space-y-2 shadow-xl z-20 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#A855F7]">
              <LucideIcons.Move size={14} className="animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">Tausch-/Sortiermodus</span>
            </div>
          </div>
          <p className="text-[9px] text-stone-300 leading-relaxed font-semibold">
            {lang === 'de'
              ? 'Ziehe Buttons zum Verschieben oder tippe nacheinander zwei Kacheln an, um sie sofort zu tauschen.'
              : 'Drag buttons to sort, or tap two tiles in sequence to swap them instantly.'}
          </p>
          {swapSelectionId && (
            <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl p-1.5 flex items-center justify-between">
              <span className="text-[9px] text-[#A855F7] font-bold">
                {lang === 'de' ? 'Kachel ausgewählt. Wähle eine andere zum Tauschen.' : 'Tile selected. Tap target to swap.'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* COMBINED GRID OF ACTIVE BUTTONS */}
      <div
        className={`w-full z-10 grid ${gridLayout.cols === 1 ? 'grid-cols-1' : gridLayout.cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} mb-8 transition-all`}
        style={{
          ...buttonRevealStyle,
          gap: `${gridLayout.gapPx}px`,
          justifyContent: 'center',
          justifyItems: 'center',
        }}
      >
      {normalizeButtons(card.buttons || [])
        .filter((btn) => btn.isActive)
        .map((btn) => {
          if (isPreview && !cleanPreview) {
            const isDragSource = draggedButtonId === btn.id;
            const isDragTarget = dragOverButtonId === btn.id;
            const isSelectedForSwap = swapSelectionId === btn.id;
            const btnRadiusClass = btn.radius === 'square' ? 'rounded-none' : btn.radius === 'pill' ? 'rounded-full' : 'rounded-2xl';
            const scaleFactor = getButtonScaleFactor(btn);

            return (
              <div
                key={btn.id}
                draggable={isSortingMode}
                onDragStart={handleDragStart ? (e) => handleDragStart(e, btn.id) : undefined}
                onDragOver={handleDragOver ? (e) => handleDragOver(e, btn.id) : undefined}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop ? (e) => handleDrop(e, btn.id) : undefined}
                onPointerDown={(e) => handleBtnPointerDown(e, btn.id)}
                onPointerMove={handleBtnPointerMove}
                onPointerUp={(e) => {
                  if (pointerRef.current && pointerRef.current.id === btn.id) {
                    if (pointerRef.current.timer) {
                      clearTimeout(pointerRef.current.timer);
                    }
                    pointerRef.current = null;
                  }
                }}
                onPointerCancel={handleBtnPointerCancel}
                onPointerLeave={handleBtnPointerCancel}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log("CARD BUTTON CLICKED IN EDITOR CONTEXT:", btn);
                  if (isSortingMode && handleButtonTapOrClickInSortMode) {
                    handleButtonTapOrClickInSortMode(btn.id);
                  } else if (onEditButton) {
                    onEditButton(btn);
                  }
                }}
                className={`relative cursor-pointer aspect-square ${btnRadiusClass} select-none group shadow transition-all duration-150 overflow-hidden ${
                  isSortingMode ? 'animate-jiggle border border-[#A855F7]/30 font-sans' : 'hover:scale-[1.04]'
                } ${isDragSource ? 'dragging-preview animate-none opacity-50' : ''} ${
                  isDragTarget ? 'border-2 border-dashed border-[#A855F7] scale-[1.08] animate-none' : ''
                } ${isSelectedForSwap ? 'ring-2 ring-[#A855F7] scale-[1.06] border-2 border-[#A855F7] animate-pulse' : ''}`}
                style={{
                  width: gridLayout.buttonSizePx ? `${gridLayout.buttonSizePx}px` : `${scaleFactor * 100}%`,
                  height: gridLayout.buttonSizePx ? `${gridLayout.buttonSizePx}px` : (gridLayout.square ? '100%' : `${scaleFactor * 100}%`),
                  margin: 'auto',
                }}
              >
                  <ButtonRenderer
                    button={btn}
                    mode="editor"
                    onClick={() => {}}
                    isSortingMode={isSortingMode}
                    lang={lang}
                    forceSquare={gridLayout.square}
                    forceSizePx={gridLayout.buttonSizePx}
                  />

                  {/* Interactive Edit/Move Badge Overlay */}
                  <div className="absolute top-1.5 right-1.5 bg-[#A855F7] text-stone-950 rounded-full p-1 z-20 shadow-md">
                    {isSortingMode ? (
                      isSelectedForSwap ? (
                        <LucideIcons.Check size={7} className="font-extrabold text-stone-950" />
                      ) : (
                        <LucideIcons.Move size={7} className="text-stone-950" />
                      )
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <LucideIcons.Edit2 size={7} />
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Reel Customizer Video Mode
            if (isReelView) {
              const isBtnHidden = reelModeConfig?.hiddenButtonIds?.includes(btn.id) || reelModeConfig?.includeButtons === false;
              return (
                <div
                  key={btn.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (reelModeConfig?.includeButtons === false) {
                      onToggleElementInReel && onToggleElementInReel('includeButtons');
                    } else {
                      onToggleElementInReel && onToggleElementInReel('button', btn.id);
                    }
                  }}
                  className={`relative cursor-pointer transition duration-150 select-none ${
                    isBtnHidden 
                      ? 'opacity-25 border-2 border-dashed border-red-500/40 hover:border-red-500' 
                      : 'border-2 border-dashed border-transparent hover:border-[#A855F7]'
                  } rounded-xl`}
                >
                  <ButtonRenderer
                    button={btn}
                    mode="public"
                    onClick={() => {}}
                    lang={lang}
                    forceSquare={gridLayout.square}
                    forceSizePx={gridLayout.buttonSizePx}
                  />
                  {isBtnHidden && (
                    <div className="absolute inset-0 bg-stone-950/40 rounded-xl flex items-center justify-center">
                      <LucideIcons.EyeOff size={16} className="text-red-500 bg-stone-900 border border-red-500/20 p-1 rounded-full shadow-lg" />
                    </div>
                  )}
                </div>
              );
            }

            // Public / Live Visitor Mode
            return (
              <ButtonRenderer
                key={btn.id}
                button={btn}
                mode="public"
                onClick={() => handleButtonClick && handleButtonClick(btn)}
                lang={lang}
                forceSquare={gridLayout.square}
                forceSizePx={gridLayout.buttonSizePx}
              />
            );
          })}

        {/* WORKSPACE "+" SPECIAL ADD BUTTON SLOT - ONLY FOR EDITOR */}
        {isPreview && !cleanPreview && !isSortingMode && onAddButton && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAddButton();
            }}
            className="relative cursor-pointer aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#A855F7]/60 hover:border-[#A855F7] bg-stone-900/60 hover:bg-stone-900 hover:scale-[1.04] transition-all duration-150 p-2 shadow"
          >
            <LucideIcons.PlusCircle size={22} className="text-[#A855F7]" />
            <span className="text-[9px] font-bold text-center uppercase tracking-wider text-stone-400">
              Neu
            </span>
          </div>
        )}
      </div>

      {/* Touch sort/hold tip inside Card Shell (only for editor) */}
      {isPreview && !cleanPreview && !isReelView && (
        <div className="w-full text-center mt-auto py-2.5 px-3 bg-stone-900/50 border border-stone-850/60 rounded-xl text-[10px] text-stone-450 font-medium flex items-center justify-center gap-1.5 select-none z-10">
          <LucideIcons.Move size={11} className="text-[#A855F7] shrink-0 animate-pulse" />
          <span>
            {lang === 'de'
              ? 'Tipp: Halte einen Button gedrückt, um ihn zu verschieben.'
              : 'Tip: Press and hold a button to move it.'}
          </span>
        </div>
      )}

      {/* REEL EXPORT OPTIONS FOOTER BLOCK (Teil D & H) */}
      {isReelView && (
        (() => {
          const isBrandingHidden = reelModeConfig?.includeBranding === false;
          const isContactBtnHidden = reelModeConfig?.includeContactButton === false;
          const isQrCodeHidden = reelModeConfig?.includeQrCode === false;
          const isCtaHidden = reelModeConfig?.includeCta === false;

          return (
            <div
              className="w-full bg-[#111111] border-t border-[#A855F7]/25 p-5 mt-auto flex flex-col gap-4 z-10 shadow-lg relative font-sans rounded-b-[23px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Branding Slot */}
              <div 
                onClick={() => onToggleElementInReel && onToggleElementInReel('includeBranding')}
                className={`flex items-center justify-center gap-1.5 py-1.5 cursor-pointer border border-dashed rounded-xl px-2 transition ${
                  isBrandingHidden 
                    ? 'border-red-500/40 opacity-25 bg-red-950/10' 
                    : 'border-transparent hover:border-[#A855F7]'
                }`}
                title={lang === 'de' ? 'Branding umschalten' : 'Toggle Branding'}
              >
                <span className="w-4.5 h-4.5 rounded bg-purple-950/50 border border-[#A855F7]/40 flex items-center justify-center shrink-0">
                  <LucideIcons.Tv size={12} className="text-[#A855F7]" />
                </span>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#A855F7]">ureel.me</span>
                <span className="text-stone-600 text-[10px] font-bold">•</span>
                <p className="text-[10px] font-medium text-stone-300 font-sans tracking-wide leading-none select-none">
                  {t.brandSlogan}
                </p>
                {isBrandingHidden && <LucideIcons.EyeOff size={11} className="text-red-500 ml-1" />}
              </div>

              {/* Action Widgets Grid */}
              <div className="grid grid-cols-2 gap-3 w-full border-t border-stone-850/50 pt-3">
                {/* Contact Button */}
                <div
                  onClick={() => onToggleElementInReel && onToggleElementInReel('includeContactButton')}
                  className={`flex flex-col items-center justify-center gap-1 bg-stone-950 text-[#A855F7] border rounded-xl py-2 px-1 transition duration-150 cursor-pointer select-none text-center h-[52px] border-dashed ${
                    isContactBtnHidden 
                      ? 'border-red-500/40 opacity-25' 
                      : 'border-transparent hover:border-[#A855F7]/50'
                  }`}
                >
                  <LucideIcons.UserPlus size={14} className="stroke-[2.5]" />
                  <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
                    {lang === 'de' ? 'Kontakt' : 'Contact'}
                  </span>
                </div>

                {/* QR-Code Trigger */}
                <div
                  onClick={() => onToggleElementInReel && onToggleElementInReel('includeQrCode')}
                  className={`flex flex-col items-center justify-center gap-1 bg-stone-950 text-stone-300 border rounded-xl py-2 px-1 transition duration-150 cursor-pointer select-none text-center h-[52px] border-dashed ${
                    isQrCodeHidden 
                      ? 'border-red-500/40 opacity-25' 
                      : 'border-transparent hover:border-stone-700/80'
                  }`}
                >
                  <LucideIcons.QrCode size={14} className="stroke-[2.5]" />
                  <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
                    QR-Code
                  </span>
                </div>
              </div>

              {/* CTA Banner overlay at bottom */}
              <div
                onClick={() => onToggleElementInReel && onToggleElementInReel('includeCta')}
                className={`w-full mt-1.5 py-2.5 px-3 bg-gradient-to-r from-amber-500/10 to-amber-600/20 hover:from-amber-500/25 border rounded-xl font-sans text-center transition duration-150 cursor-pointer flex flex-col items-center justify-center gap-1 border-dashed ${
                  isCtaHidden 
                    ? 'border-red-500/40 opacity-25' 
                    : 'border-[#A855F7]/40 hover:border-[#A855F7]'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7] animate-pulse">
                  {reelModeConfig?.ctaText || (lang === 'de' ? 'Karte über den Link öffnen' : 'Open card via link')}
                </span>
                {isCtaHidden && (
                  <span className="text-[8px] text-red-500 font-bold">
                    {lang === 'de' ? 'CTA deaktiviert' : 'CTA disabled'}
                  </span>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* FESTE SYSTEM-AKTIONEN IM ELEGANTEN FOOTER-BALKEN (ureel Premium-Design) */}
      {/* Both Preview and Live now share EXACTLY the same Footer Block inside the card! */}
      {!isReelView && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[#111111] border-t border-[#A855F7]/25 p-5 mt-auto flex flex-col gap-4 z-10 shadow-lg select-none relative font-sans rounded-b-[23px]"
        >
        {/* Zeile 1: Brand Header (Falls nicht versteckt durch Pro/Business plan) */}
        {!isHidden && (
          <div className="flex items-center justify-center gap-1.5 py-0.5 select-none text-center">
            <span className="w-4.5 h-4.5 rounded bg-purple-950/50 border border-[#A855F7]/40 flex items-center justify-center shrink-0">
              <LucideIcons.Tv size={12} className="text-[#A855F7]" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#A855F7]">ureel.me</span>
            <span className="text-stone-600 text-[10px] font-bold">•</span>
            <p className="text-[10px] font-medium text-stone-400 font-sans tracking-wide leading-none select-none">
              {t.brandSlogan}
            </p>
          </div>
        )}

        {/* Sleek compact equal-sized action bar */}
        <div className={`grid ${isPreview ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5 w-full border-t border-stone-850/50 pt-3`}>
          {/* 1. In Kontakten speichern */}
          <button
            onClick={() => triggerVCardDownload && triggerVCardDownload()}
            title={t.saveContactTooltip || (lang === 'de' ? 'In Kontakten speichern' : 'Save Contact')}
            className="flex flex-col items-center justify-center gap-1 bg-stone-950 hover:bg-stone-900 active:bg-stone-950 text-[#A855F7] hover:text-white border border-stone-850 hover:border-[#A855F7]/50 rounded-xl py-2 px-1 transition duration-150 shadow-sm cursor-pointer select-none text-center h-[52px]"
          >
            <LucideIcons.UserPlus size={14} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
              {lang === 'de' ? 'Kontakt' : 'Contact'}
            </span>
          </button>

          {/* 2. Teilen */}
          <button
            onClick={() => setShowShareModal && setShowShareModal(true)}
            title={lang === 'de' ? 'Teilen' : 'Share'}
            className="flex flex-col items-center justify-center gap-1 bg-stone-950 hover:bg-stone-900 active:bg-stone-950 text-stone-300 hover:text-white border border-stone-850 hover:border-stone-700/80 rounded-xl py-2 px-1 transition duration-150 shadow-sm cursor-pointer select-none text-center h-[52px]"
          >
            <LucideIcons.Share2 size={14} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
              {lang === 'de' ? 'Teilen' : 'Share'}
            </span>
          </button>

          {/* 3. Eigene ureel erstellen */}
          <button
            onClick={() => handleCtaClick && handleCtaClick()}
            title={t.createYourOwn || (lang === 'de' ? 'Eigene gratis Karte erstellen' : 'Create free card')}
            className="flex flex-col items-center justify-center gap-1 bg-stone-950 hover:bg-stone-900 active:bg-stone-950 text-[#A855F7] hover:text-white border border-stone-850 hover:border-[#A855F7]/50 rounded-xl py-2 px-1 transition duration-150 shadow-sm cursor-pointer select-none text-center h-[52px]"
          >
            <LucideIcons.Sparkles size={14} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
              {lang === 'de' ? 'Erstellen' : 'Create'}
            </span>
          </button>

          {/* 4. QR-Code (nur in der öffentlichen Live Ansicht) */}
          {!isPreview && (
            <button
              onClick={() => setShowQrModal(true)}
              title={lang === 'de' ? 'QR-Code anzeigen' : 'Show QR-Code'}
              className="flex flex-col items-center justify-center gap-1 bg-stone-950 hover:bg-stone-900 active:bg-stone-950 text-stone-300 hover:text-white border border-stone-850 hover:border-stone-700/80 rounded-xl py-2 px-1 transition duration-150 shadow-sm cursor-pointer select-none text-center h-[52px]"
            >
              <LucideIcons.QrCode size={14} className="stroke-[2.5]" />
              <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-full leading-none">
                QR-Code
              </span>
            </button>
          )}
        </div>

        {/* Inhalt melden & QR-Code Modal */}
        {!isPreview && (
          <div className="flex justify-center border-t border-stone-850/30 pt-1.5 mt-0.5 animate-fadeIn">
            <button
              type="button"
              onClick={() => {}}
              className="text-stone-500 hover:text-red-400 transition duration-150 cursor-pointer select-none text-[8px] font-bold uppercase tracking-wider bg-transparent border-0"
            >
              <LucideIcons.AlertTriangle size={9} className="inline mr-1" />
              <span>{lang === 'de' ? 'Inhalt melden' : 'Report'}</span>
            </button>
          </div>
        )}

        {/* QR Code popup modal inside of the Card container */}
        {showQrModal && (
          <div 
            className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn cursor-default backdrop-blur-xs" 
            onClick={() => setShowQrModal(false)}
          >
            <div 
              className="bg-stone-900 border border-stone-800 rounded-2xl p-5 max-w-[280px] w-full text-center relative shadow-2xl space-y-4" 
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-3 right-3 text-stone-400 hover:text-[#A855F7] transition cursor-pointer"
              >
                <LucideIcons.X size={16} />
              </button>
              
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center justify-center gap-1.5 pt-1.5">
                  <LucideIcons.QrCode size={15} className="text-[#A855F7]" />
                  <span>QR-Code</span>
                </h3>
                <p className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest leading-none">
                  {lang === 'de' ? 'Scannen zum Öffnen' : 'Scan to view'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl inline-block mx-auto border border-stone-805">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0b0b0b&data=${encodeURIComponent(getPublicCardUrl(card.slug) || window.location.href)}`}
                  alt="QR Code"
                  className="w-36 h-36 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono text-stone-350 select-all truncate bg-stone-950/80 px-2 py-1.5 rounded-lg border border-stone-850">
                  {getPublicCardUrl(card.slug)}
                </p>
                <p className="text-[8px] text-stone-500 uppercase font-bold tracking-wider">
                  {lang === 'de' ? 'Tippe zum Markieren' : 'Scan or copy URL'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
