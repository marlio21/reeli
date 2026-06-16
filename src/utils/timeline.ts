/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VideoBackgroundConfig, UreelScene, Card, UreelTimeline, UreelEndCard } from '../types';

export interface TimelineState {
  currentTime: number;
  sequenceDuration: number;
  transitionDuration: number;
  isBeforeButtonReveal: boolean;
  isButtonRevealing: boolean;
  areButtonsFullyVisible: boolean;
  buttonRevealProgress: number; // raw progress 0..1
  buttonRevealEasedProgress: number; // eased progress 0..1
  textRevealProgress: number; // raw progress 0..1
  profileRevealProgress: number; // raw progress 0..1
  isAfterSequence: boolean;
  transitionProgress: number; // progress of crossfade 0..1
  shouldShowFinalBackground: boolean;
  shouldShowVideoLayer: boolean;
  shouldShowButtons: boolean;
  videoLayerOpacity: number;
  finalBackgroundOpacity: number;
  currentTimeInLoop: number;
  currentLoopIndex: number;
}

/**
 * Normalizes VideoBackgroundConfig with robust fallback values to prevent UI crash.
 */
export function normalizeVideoBackgroundConfig(vBg: Partial<VideoBackgroundConfig> | undefined, plan?: string): VideoBackgroundConfig {
  const enabled = !!vBg?.enabled;
  let mediaMode = vBg?.mediaMode || vBg?.mode || 'youtube';
  if ((mediaMode as string) === 'uploadVideo') mediaMode = 'upload';
  
  // Resolve plan-based default duration
  let defaultDuration = 12;
  const normPlan = plan ? plan.toString().trim().toLowerCase() : 'starter';
  if (normPlan === 'starter') {
    defaultDuration = 10;
  } else if (normPlan === 'pro' || normPlan === 'fun') {
    defaultDuration = 12;
  } else if (normPlan === 'business') {
    defaultDuration = 15;
  }

  // Normalize duration Seconds (default based on plan or custom durationSeconds)
  let rawDuration = vBg?.durationSeconds ?? vBg?.duration;
  let durationSeconds: number = defaultDuration;
  if (rawDuration !== undefined) {
    const parsed = typeof rawDuration === 'number' ? rawDuration : parseInt(rawDuration as any, 10);
    if (!isNaN(parsed)) {
      // Mindestwert = 5, Maximalwert = 15 oder bestehendes Planlimit (maximal 15 Sekunden)
      durationSeconds = Math.max(5, Math.min(15, parsed));
    }
  }

  let duration: number = durationSeconds;
  if (mediaMode === 'slideshow') {
    duration = vBg?.slideshow?.totalDurationSeconds || (vBg?.slideshow?.images?.length ? vBg.slideshow.images.length * 3 : 12);
  }

  // Ensure buttonReveal structure
  const startSecond = vBg?.buttonReveal?.startSecond !== undefined ? Math.max(0, vBg.buttonReveal.startSecond) : 5;
  const style = vBg?.buttonReveal?.style || 'soft';
  let endSecond = vBg?.buttonReveal?.endSecond;

  if (endSecond === undefined) {
    if (vBg?.buttonReveal?.duration !== undefined) {
      endSecond = startSecond + vBg.buttonReveal.duration;
    } else {
      endSecond = duration;
    }
  }

  if (endSecond <= startSecond) {
    endSecond = startSecond + 0.5;
  }
  if (endSecond > duration) {
    endSecond = duration;
  }

  const buttonReveal = {
    enabled: vBg?.buttonReveal?.enabled !== false, // default true
    startSecond,
    endSecond,
    duration: Math.max(0.1, endSecond - startSecond),
    style,
  };

  // Loop settings
  const loop = {
    enabled: vBg?.loop?.enabled ?? false,
    mode: vBg?.loop?.mode || 'none',
    maxLoops: vBg?.loop?.maxLoops ?? (vBg?.loop?.mode === 'twice' ? 2 : vBg?.loop?.mode === 'three_times' ? 3 : 1)
  };

  // Safe afterSequence mapping (fallback to older afterVideo configurations)
  const afterBgType = vBg?.afterSequence?.backgroundType || vBg?.afterVideo?.backgroundType || 'same';
  const afterSequenceEnabled = vBg?.afterSequence?.enabled ?? (afterBgType !== 'none' && afterBgType !== 'same');
  const afterSequence = {
    enabled: afterSequenceEnabled,
    backgroundType: afterBgType as any,
    color: vBg?.afterSequence?.color || vBg?.afterVideo?.color || '#121212',
    gradient: vBg?.afterSequence?.gradient || vBg?.afterVideo?.gradient || 'linear-gradient(135deg, #121212 0%, #000000 100%)',
    imageUrl: vBg?.afterSequence?.imageUrl || vBg?.afterVideo?.imageUrl || (vBg as any)?.afterVideoImageUrl || (vBg as any)?.afterSequenceImageUrl || (vBg as any)?.imageUrl || '',
    transition: vBg?.afterSequence?.transition || vBg?.transition || 'very_soft',
  };

  // Text overlay initialization (merge older 'text' configurations if present)
  let textOverlay = vBg?.textOverlay;
  if (!textOverlay && vBg?.text) {
    textOverlay = {
      enabled: vBg.text.enabled !== false,
      content: vBg.text.content || '',
      fontFamily: 'Inter',
      fontWeight: '700',
      fontSize: vBg.text.size || 18,
      color: vBg.text.color || '#FFFFFF',
      shadow: vBg.text.shadow !== false,
      backgroundEnabled: false,
      backgroundColor: 'rgba(0,0,0,0.4)',
      x: vBg.text.x ?? 50,
      y: vBg.text.y ?? 60,
      revealStartSecond: vBg.text.revealStartSecond ?? 2,
      revealEndSecond: (vBg.text.revealStartSecond ?? 2) + (vBg.text.revealDuration ?? 1.2),
      staysVisibleAfterSequence: vBg.text.visibleAfterVideo !== false,
      animationStyle: 'soft'
    };
  }

  if (!textOverlay) {
    textOverlay = {
      enabled: false,
      content: '',
      fontFamily: 'Inter',
      fontWeight: '700',
      fontSize: 18,
      color: '#FFFFFF',
      shadow: true,
      backgroundEnabled: false,
      backgroundColor: 'rgba(0,0,0,0.4)',
      x: 50,
      y: 60,
      revealStartSecond: 2,
      revealEndSecond: 3.5,
      staysVisibleAfterSequence: true,
      animationStyle: 'soft'
    };
  }

  // Profile reveal defaults
  const profileReveal = vBg?.profileReveal || {
    enabled: false,
    startSecond: 0,
    endSecond: 1.2,
    staysVisibleAfterSequence: true,
    style: 'soft'
  };

  const processingTarget = {
    maxDurationSeconds: 15 as const,
    maxFileSizeMb: 10 as const,
    preferredResolution: '720x1280' as const,
    optionalResolution: '1080x1920' as const,
    targetCodec: 'H.264' as const,
    targetContainer: 'MP4' as const,
    audioDefault: 'muted' as const,
  };

  // Preserve legacy "text" object inside returned config for component compatibility
  const legacyText = vBg?.text || {
    enabled: textOverlay.enabled,
    content: textOverlay.content,
    x: textOverlay.x,
    y: textOverlay.y,
    size: textOverlay.fontSize,
    color: textOverlay.color,
    opacity: 100,
    shadow: textOverlay.shadow,
    revealStartSecond: textOverlay.revealStartSecond,
    revealDuration: textOverlay.revealEndSecond - textOverlay.revealStartSecond,
    visibleAfterVideo: textOverlay.staysVisibleAfterSequence
  };

  const textReveal = {
    enabled: vBg?.textReveal?.enabled !== false || textOverlay.enabled,
    startSecond: vBg?.textReveal?.startSecond !== undefined ? vBg.textReveal.startSecond : textOverlay.revealStartSecond,
    duration: vBg?.textReveal?.duration !== undefined ? vBg.textReveal.duration : (textOverlay.revealEndSecond - textOverlay.revealStartSecond),
  };

  const profileImageReveal = vBg?.profileImageReveal || {
    enabled: true,
    startSecond: 0,
    fadeDuration: 1.0,
    staysVisibleAfterSequence: true,
  };

  const defaultTextReveals = [
    { fieldKey: 'title', enabled: true, startSecond: 0, fadeDuration: 1.0, staysVisibleAfterSequence: true },
    { fieldKey: 'subtitle', enabled: true, startSecond: 1, fadeDuration: 1.0, staysVisibleAfterSequence: true },
    { fieldKey: 'description', enabled: true, startSecond: 2, fadeDuration: 1.0, staysVisibleAfterSequence: true }
  ];

  let rawTextReveals = vBg?.profileTextReveals || [];
  let profileTextReveals = [...rawTextReveals];
  defaultTextReveals.forEach(def => {
    const existing = profileTextReveals.find(r => r.fieldKey === def.fieldKey);
    if (!existing) {
      profileTextReveals.push(def);
    }
  });

  return {
    enabled,
    mediaMode,
    durationSeconds,
    videoFitMode: vBg?.videoFitMode || 'contain',
    stopAtSecond: vBg?.stopAtSecond ?? durationSeconds,
    buttonReveal,
    loop,
    textOverlay,
    profileReveal,
    profileImageReveal,
    profileTextReveals,
    text: legacyText,
    textReveal,
    afterSequence,
    processingTarget,
    mode: vBg?.mode,
    youtubeUrl: vBg?.youtubeUrl,
    startTimeSeconds: vBg?.startTimeSeconds,
    youtube: vBg?.youtube,
    upload: vBg?.upload,
    videoProcessingJob: vBg?.videoProcessingJob,
    slideshow: vBg?.slideshow,
    aspectRatio: '9:16',
  } as VideoBackgroundConfig;
}

/**
 * Calculations engine for the Reel background sequence.
 */
export function getReelTimelineState(vBgConfig: Partial<VideoBackgroundConfig> | undefined, currentTime: number, plan?: string): TimelineState {
  const norm = normalizeVideoBackgroundConfig(vBgConfig, plan);
  const mediaMode = norm.mediaMode || 'youtube';
  const isVideoBgActive = norm.enabled;

  if (!isVideoBgActive) {
    return {
      currentTime: 0,
      sequenceDuration: 12,
      transitionDuration: 1.2,
      isBeforeButtonReveal: false,
      isButtonRevealing: false,
      areButtonsFullyVisible: true,
      buttonRevealProgress: 1,
      buttonRevealEasedProgress: 1,
      textRevealProgress: 1,
      profileRevealProgress: 1,
      isAfterSequence: true,
      transitionProgress: 1,
      shouldShowFinalBackground: true,
      shouldShowVideoLayer: false,
      shouldShowButtons: true,
      videoLayerOpacity: 0,
      finalBackgroundOpacity: 1,
      currentTimeInLoop: 0,
      currentLoopIndex: 0,
    };
  }

  // Get duration of a single play sequence
  const isStretch = norm.upload?.stretchShortVideo !== false;
  const originalDuration = norm.upload?.originalDurationSeconds;

  let singlePlayDuration: number = norm.durationSeconds || 12;
  if (mediaMode === 'slideshow') {
    singlePlayDuration = norm.slideshow?.totalDurationSeconds || (norm.slideshow?.images?.length ? norm.slideshow.images.length * 3 : 12);
  }

  if (mediaMode === 'upload' && originalDuration !== undefined && originalDuration < singlePlayDuration) {
    if (!isStretch) {
      singlePlayDuration = originalDuration;
    }
  }

  // Loop settings logic and loop counts
  const afterBgType = norm.afterSequence?.backgroundType || 'same';
  const hasAfterBg = norm.afterSequence?.enabled && afterBgType !== 'none' && afterBgType !== 'same' && afterBgType !== 'video_last_frame';

  let maxLoops = 1; // Play once
  if (mediaMode !== 'youtube' && !hasAfterBg && norm.loop?.enabled) {
    if (norm.loop.mode === 'twice') maxLoops = 2;
    else if (norm.loop.mode === 'three_times') maxLoops = 3;
    else if (norm.loop.mode === 'infinite') maxLoops = Infinity;
  }

  // Determine current loop index and relative time within current loop
  let currentLoopIndex = 0;
  let currentTimeInLoop = currentTime;
  let isAfterSeq = false;

  if (singlePlayDuration > 0) {
    currentLoopIndex = Math.floor(currentTime / singlePlayDuration);
    if (currentLoopIndex >= maxLoops && maxLoops !== Infinity) {
      // Finished all loops and entered transition / final state
      isAfterSeq = true;
      currentTimeInLoop = singlePlayDuration;
      currentLoopIndex = maxLoops - 1;
    } else {
      currentTimeInLoop = currentTime % singlePlayDuration;
    }
  }

  const transitionType = norm.afterSequence?.transition || 'soft';
  const transDur = transitionType === 'hard' ? 0 : transitionType === 'medium' ? 0.8 : transitionType === 'soft' ? 1.5 : 3.0;

  // Button Reveal is cumulative across loops (stays visible once revealed)
  const btnStart = norm.buttonReveal.startSecond;
  const btnEnd = norm.buttonReveal.endSecond || singlePlayDuration;
  
  let btnProg = 0;
  if (currentTime >= btnStart) {
    if (currentTime >= btnEnd) {
      btnProg = 1;
    } else {
      const btnSpan = btnEnd - btnStart;
      btnProg = btnSpan > 0 ? (currentTime - btnStart) / btnSpan : 1;
    }
  }
  btnProg = Math.min(Math.max(btnProg, 0), 1);

  // Cubic Ease out function
  const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
  const btnEasedProg = easeOutCubic(btnProg);

  // Transition progress (crossfade timing to final background)
  const totalPlaySequenceDuration = maxLoops === Infinity ? Infinity : singlePlayDuration * maxLoops;
  const inTransitionInterval = maxLoops !== Infinity && currentTime >= totalPlaySequenceDuration;
  
  let transProg = 0;
  if (inTransitionInterval) {
    const elapsedSinceSequenceEnd = currentTime - totalPlaySequenceDuration;
    if (transDur <= 0 || elapsedSinceSequenceEnd >= transDur) {
      transProg = 1;
    } else {
      transProg = elapsedSinceSequenceEnd / transDur;
    }
  }
  transProg = Math.min(Math.max(transProg, 0), 1);

  // textOverlay reveal timing (incorporating hideAtSecond and staysVisibleAfterSequence)
  const txNorm = norm.textOverlay!;
  let txtProg = 0;
  if (txNorm.enabled) {
    const isTxtBefore = currentTime < txNorm.revealStartSecond;
    const isTxtRevealing = currentTime >= txNorm.revealStartSecond && currentTime < txNorm.revealEndSecond;
    const isTxtAfter = currentTime >= txNorm.revealEndSecond;

    if (isTxtBefore) {
      txtProg = 0;
    } else if (isTxtRevealing) {
      const span = txNorm.revealEndSecond - txNorm.revealStartSecond;
      txtProg = span > 0 ? (currentTime - txNorm.revealStartSecond) / span : 1;
    } else if (isTxtAfter) {
      txtProg = 1;
      // Handle optional hideAtSecond
      if (txNorm.hideAtSecond !== undefined && txNorm.hideAtSecond > txNorm.revealEndSecond) {
        if (currentTime >= txNorm.hideAtSecond) {
          const fadeOutSpan = 0.5;
          const fadeOutProg = (currentTime - txNorm.hideAtSecond) / fadeOutSpan;
          txtProg = Math.max(0, 1 - fadeOutProg);
        }
      }
      // Handle staysVisibleAfterSequence
      if (isAfterSeq && !txNorm.staysVisibleAfterSequence) {
        // fade out alongside the transition
        txtProg = Math.max(0, txtProg * (1 - transProg));
      }
    }
  } else {
    txtProg = 0;
  }

  // profileReveal timing
  const prNorm = norm.profileReveal!;
  let profProg = 1; // Default to fully visible (if timing disabled)
  if (prNorm.enabled) {
    const isPrBefore = currentTime < prNorm.startSecond;
    const isPrRevealing = currentTime >= prNorm.startSecond && currentTime < prNorm.endSecond;
    const isPrAfter = currentTime >= prNorm.endSecond;

    if (isPrBefore) {
      profProg = 0;
    } else if (isPrRevealing) {
      const span = prNorm.endSecond - prNorm.startSecond;
      profProg = span > 0 ? (currentTime - prNorm.startSecond) / span : 1;
    } else if (isPrAfter) {
      profProg = 1;
      // Handle optional hideAtSecond
      if (prNorm.hideAtSecond !== undefined && prNorm.hideAtSecond > prNorm.endSecond) {
        if (currentTime >= prNorm.hideAtSecond) {
          const fadeOutSpan = 0.5;
          const fadeOutProg = (currentTime - prNorm.hideAtSecond) / fadeOutSpan;
          profProg = Math.max(0, 1 - fadeOutProg);
        }
      }
      // Handle staysVisibleAfterSequence
      if (isAfterSeq && !prNorm.staysVisibleAfterSequence) {
        // fade out alongside global crossfade transition
        profProg = Math.max(0, profProg * (1 - transProg));
      }
    }
  }

  // Determine Layer Visibilities and Opacities
  let shouldShowFinalBg = false;
  let shouldShowVideo = true;
  let videoOpacity = 1;
  let finalBgOpacity = 0;

  if (maxLoops === Infinity) {
    shouldShowFinalBg = false;
    shouldShowVideo = true;
    videoOpacity = 1;
    finalBgOpacity = 0;
  } else {
    shouldShowFinalBg = hasAfterBg && isAfterSeq;
    shouldShowVideo = !hasAfterBg || (currentTime < totalPlaySequenceDuration + transDur);
    
    if (isAfterSeq) {
      finalBgOpacity = hasAfterBg ? transProg : 0;
      videoOpacity = hasAfterBg ? (1 - transProg) : 1;
    } else {
      finalBgOpacity = 0;
      videoOpacity = 1;
    }
  }

  const isBeforeBtn = currentTime < btnStart;
  const isBtnRevealing = currentTime >= btnStart && currentTime < btnEnd;
  const areBtnsFullyVis = currentTime >= btnEnd;

  return {
    currentTime,
    sequenceDuration: singlePlayDuration,
    transitionDuration: transDur,
    isBeforeButtonReveal: isBeforeBtn,
    isButtonRevealing: isBtnRevealing,
    areButtonsFullyVisible: areBtnsFullyVis,
    buttonRevealProgress: btnProg,
    buttonRevealEasedProgress: btnEasedProg,
    textRevealProgress: txtProg,
    profileRevealProgress: profProg,
    isAfterSequence: isAfterSeq,
    transitionProgress: transProg,
    shouldShowFinalBackground: shouldShowFinalBg,
    shouldShowVideoLayer: shouldShowVideo,
    shouldShowButtons: currentTime >= btnStart,
    videoLayerOpacity: videoOpacity,
    finalBackgroundOpacity: finalBgOpacity,
    currentTimeInLoop,
    currentLoopIndex,
  };
}

/**
 * Normalizes any Card to get a valid UreelScene, falling back to older KONU fields.
 */
export function normalizeUreelScene(card: any): UreelScene {
  const fallbackScene: UreelScene = {
    mode: 'color',
    backgroundColor: '#1c1b1a', // Rich charcoal fallback
    gradient: {
      from: '#1c1b1a',
      to: '#121110',
      direction: '135deg'
    },
    overlay: {
      darken: 25,
      blur: 0,
      vignette: false
    },
    video: {
      type: 'none',
      url: '',
      duration: 12,
      displayMode: 'cover',
      placement: 'background',
      startAt: 0
    }
  };

  if (!card) return fallbackScene;

  // 1. Explicit ureelScene block takes priority, merged with defaults
  if (card.ureelScene) {
    const s = card.ureelScene;
    return {
      mode: s.mode || 'color',
      backgroundImageUrl: s.backgroundImageUrl || '',
      backgroundColor: s.backgroundColor || '#1c1b1a',
      gradient: {
        from: s.gradient?.from || '#1c1b1a',
        to: s.gradient?.to || '#121110',
        direction: s.gradient?.direction || '135deg',
      },
      overlay: {
        darken: typeof s.overlay?.darken === 'number' ? s.overlay.darken : 25,
        blur: typeof s.overlay?.blur === 'number' ? s.overlay.blur : 0,
        vignette: !!s.overlay?.vignette,
      },
      video: {
        type: s.video?.type || 'none',
        url: s.video?.url || '',
        duration: typeof s.video?.duration === 'number' ? s.video.duration : 12,
        displayMode: s.video?.displayMode || 'cover',
        placement: s.video?.placement || 'background',
        startAt: typeof s.video?.startAt === 'number' ? s.video.startAt : 0,
      }
    };
  }

  // 2. Map legacy fields to UreelScene object
  const scene: UreelScene = { ...fallbackScene };

  // Map overlay details safely
  let oldDarken = 25;
  if (typeof card.cardBackgroundDarken === 'number') {
    oldDarken = card.cardBackgroundDarken;
  }
  scene.overlay = {
    darken: oldDarken,
    blur: 0,
    vignette: false,
  };

  // Video Background Config mapping
  const vBg = card.videoBackgroundConfig;
  if (vBg && vBg.enabled) {
    scene.mode = 'video';
    let type: UreelScene['video']['type'] = 'none';
    let url = '';

    const mediaMode = vBg.mediaMode || vBg.mode || 'youtube';
    if (mediaMode === 'youtube') {
      type = 'youtube';
      url = vBg.youtube?.url || vBg.youtubeUrl || '';
    } else if (mediaMode === 'upload') {
      const fileUrl = vBg.upload?.optimizedVideoUrl || vBg.upload?.fileUrl || vBg.upload?.localPreviewUrl || '';
      if (fileUrl) {
        type = fileUrl.includes('mp4') || fileUrl.includes('m4v') ? 'direct_mp4' : 'direct_webm';
        url = fileUrl;
      }
    }

    const duration = vBg.durationSeconds || vBg.duration || 12;
    const startAt = vBg.youtube?.startTimeSeconds || vBg.startTimeSeconds || 0;

    scene.video = {
      type,
      url,
      duration,
      displayMode: vBg.videoFitMode || 'cover',
      placement: 'background',
      startAt,
    };
  } else if (card.cardBackgroundImageUrl) {
    scene.mode = 'image';
  } else if (card.cardBackgroundGradientEnabled && card.cardBackgroundGradientColor) {
    scene.mode = 'gradient';
  } else {
    scene.mode = 'color';
  }

  // Resolve core color or image attributes
  scene.backgroundImageUrl = card.cardBackgroundImageUrl || card.coverImageUrl || '';
  scene.backgroundColor = card.cardBackgroundColor || card.heroBgColor || '#1c1b1a';

  if (card.cardBackgroundGradientColor) {
    scene.gradient = {
      from: card.cardBackgroundColor || '#1c1b1a',
      to: card.cardBackgroundGradientColor,
      direction: card.cardBackgroundGradientDirection || '135deg',
    };
  }

  return scene;
}

export function normalizeUreelTimeline(card: Partial<Card> | undefined): Required<UreelTimeline> {
  const defaultTimeline: Required<UreelTimeline> = {
    preset: 'direct',
    titleAt: 0,
    subtitleAt: 0.3,
    descriptionAt: 0.6,
    buttonsAt: 0.9,
    endCardAt: 12,
  };

  if (!card) return defaultTimeline;

  // Resolve scene duration to align endCardAt standard correctly
  const scene = normalizeUreelScene(card as Card);
  const duration = typeof scene?.video?.duration === 'number' ? scene.video.duration : 12;

  const t = card.ureelTimeline;
  const preset = t?.preset || 'direct';

  let titleAt = 0;
  let subtitleAt = 0.3;
  let descriptionAt = 0.6;
  let buttonsAt = 0.9;
  let endCardAt = duration;

  if (preset === 'direct') {
    titleAt = typeof t?.titleAt === 'number' ? t.titleAt : 0;
    subtitleAt = typeof t?.subtitleAt === 'number' ? t.subtitleAt : 0.2;
    descriptionAt = typeof t?.descriptionAt === 'number' ? t.descriptionAt : 0.4;
    buttonsAt = typeof t?.buttonsAt === 'number' ? t.buttonsAt : 0.6;
    endCardAt = typeof t?.endCardAt === 'number' ? t.endCardAt : duration;
  } else if (preset === 'short_intro') {
    titleAt = typeof t?.titleAt === 'number' ? t.titleAt : 3;
    subtitleAt = typeof t?.subtitleAt === 'number' ? t.subtitleAt : 4;
    descriptionAt = typeof t?.descriptionAt === 'number' ? t.descriptionAt : 5;
    buttonsAt = typeof t?.buttonsAt === 'number' ? t.buttonsAt : 6;
    endCardAt = typeof t?.endCardAt === 'number' ? t.endCardAt : duration;
  } else if (preset === 'ad_reel') {
    if (duration === 15) {
      titleAt = typeof t?.titleAt === 'number' ? t.titleAt : 10.5;
      subtitleAt = typeof t?.subtitleAt === 'number' ? t.subtitleAt : 11.5;
      descriptionAt = typeof t?.descriptionAt === 'number' ? t.descriptionAt : 12.5;
      buttonsAt = typeof t?.buttonsAt === 'number' ? t.buttonsAt : 13.5;
      endCardAt = typeof t?.endCardAt === 'number' ? t.endCardAt : 15;
    } else {
      titleAt = typeof t?.titleAt === 'number' ? t.titleAt : 7.5;
      subtitleAt = typeof t?.subtitleAt === 'number' ? t.subtitleAt : 8.5;
      descriptionAt = typeof t?.descriptionAt === 'number' ? t.descriptionAt : 9.5;
      buttonsAt = typeof t?.buttonsAt === 'number' ? t.buttonsAt : 10.5;
      endCardAt = typeof t?.endCardAt === 'number' ? t.endCardAt : 12;
    }
  } else if (preset === 'manual') {
    titleAt = typeof t?.titleAt === 'number' ? t.titleAt : 0;
    subtitleAt = typeof t?.subtitleAt === 'number' ? t.subtitleAt : 0.3;
    descriptionAt = typeof t?.descriptionAt === 'number' ? t.descriptionAt : 0.6;
    buttonsAt = typeof t?.buttonsAt === 'number' ? t.buttonsAt : 0.9;
    endCardAt = typeof t?.endCardAt === 'number' ? t.endCardAt : duration;
  }

  return {
    preset,
    titleAt,
    subtitleAt,
    descriptionAt,
    buttonsAt,
    endCardAt,
  };
}

export function normalizeUreelEndCard(card: Partial<Card> | undefined): Required<UreelEndCard> {
  const defaultEndCard: Required<UreelEndCard> = {
    enabled: false,
    source: 'scene',
    imageUrl: '',
    backgroundColor: '#1c1b1a',
    gradient: {
      from: '#1c1b1a',
      to: '#121110',
      direction: '135deg',
    },
    replayButton: true,
  };

  if (!card || !card.ureelEndCard) return defaultEndCard;

  const ec = card.ureelEndCard;
  return {
    enabled: !!ec.enabled,
    source: ec.source || 'scene',
    imageUrl: ec.imageUrl || '',
    backgroundColor: ec.backgroundColor || '#1c1b1a',
    gradient: {
      from: ec.gradient?.from || '#1c1b1a',
      to: ec.gradient?.to || '#121110',
      direction: ec.gradient?.direction || '135deg',
    },
    replayButton: ec.replayButton !== false,
  };
}
