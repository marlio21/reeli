/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, normalizeProfileType, CardType, UreelTextTemplate } from '../types';
import { parseVideoUrl } from '../utils/video';
import { TRANSLATIONS } from '../translations';
import { motion } from 'motion/react';
import {
  normalizeUreelTextTemplate,
  getFontStyleClasses,
  getBoxStyleClasses,
  getFrameStyleClasses,
  getHighlightedTextElements
} from '../utils/textTemplates';

interface ProfileHeroSectionProps {
  card: Partial<Card>;
  isEditing?: boolean;
  onBlockClick?: () => void;
  className?: string;
  isEditorMode?: boolean;
  mode?: 'editor' | 'public';
  lang?: 'de' | 'en';
  onEditBackground?: () => void;
  onEditProfileHero?: () => void;
  onPreview?: () => void;
  effectiveTime?: number;
  timelineState?: any;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDescription?: boolean;
}

export const ProfileHeroSection: React.FC<ProfileHeroSectionProps> = ({
  card,
  isEditing = false,
  onBlockClick,
  className = '',
  isEditorMode = false,
  mode = 'public',
  lang = 'de',
  onEditBackground,
  onEditProfileHero,
  onPreview,
  effectiveTime,
  timelineState,
  showTitle = true,
  showSubtitle = true,
  showDescription = true,
}) => {
  const activeLang = lang || 'de';
  const tLocal = TRANSLATIONS[activeLang];
  
  const bgBtnText = tLocal?.customizeBackgroundLabel || (activeLang === 'de' ? 'Hintergrund anpassen' : 'Customize background');
  const profileBtnText = tLocal?.editProfileSectionLabel || (activeLang === 'de' ? 'Profilbereich bearbeiten' : 'Edit profile section');
  const isEditor = isEditorMode || mode === 'editor';
  // 1. Map profile type and general variables
  const pType = normalizeProfileType(card.profileType || card.type || 'person');

  // Background active flag
  const isBgEnabled = card.heroBackgroundEnabled !== false;
  const videoUrl = isBgEnabled ? (card.heroVideoUrl || card.productVideoUrl || '') : '';
  const imageUrl = isBgEnabled ? (card.heroImageUrl || card.coverImageUrl || card.productImageUrl || '') : '';

  let backgroundType = card.heroBackgroundType || card.productMediaType;
  if (!backgroundType) {
    if (videoUrl) {
      backgroundType = 'video';
    } else if (imageUrl) {
      backgroundType = 'image';
    } else {
      backgroundType = 'color';
    }
  }

  // Background style & color
  const backgroundColor = isBgEnabled
    ? (card.heroBgColor || card.heroBackgroundColor || card.backgroundColor || '#121212')
    : 'transparent';
  const backgroundStyle: React.CSSProperties = {};

  if (isBgEnabled) {
    if (card.heroGradientEnabled && card.heroGradientColor) {
      const direction = card.heroGradientDirection || 'to bottom';
      backgroundStyle.background = `linear-gradient(${direction}, ${backgroundColor}, ${card.heroGradientColor})`;
    } else if (card.heroGradient) {
      backgroundStyle.background = card.heroGradient;
    } else if (backgroundColor.startsWith('linear-gradient') || backgroundColor.startsWith('radial-gradient')) {
      backgroundStyle.background = backgroundColor;
    } else {
      backgroundStyle.backgroundColor = backgroundColor;
    }
  } else {
    // If background is disabled, use fully transparent background
    backgroundStyle.backgroundColor = 'transparent';
  }

  const mediaPosition = card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center';

  // Resolve 3 sizes: 'small' | 'medium' | 'large'
  let heroSize = card.heroSize || card.heroHeight || card.productHeroSize || 'medium';
  if (heroSize === 'normal') heroSize = 'medium';
  if (heroSize === 'compact') heroSize = 'small';
  if (heroSize === 'xlarge') heroSize = 'large';

  // Overlay / Abdunklung
  const overlayStyle = card.heroOverlayStyle || (
    card.coverOverlayDarken !== false ? 'dark-gradient' : 'none'
  );
  const customOverlayOpacity = isBgEnabled && card.heroDarken !== undefined 
    ? card.heroDarken / 100 
    : (card.heroOverlay !== undefined ? card.heroOverlay / 100 : null);

  // Background media blur
  const bgBlurStyle: React.CSSProperties = {};
  if (card.heroBlur && card.heroBlur > 0) {
    bgBlurStyle.filter = `blur(${card.heroBlur}px)`;
  }

  // Avatar/Logo configuration
  const showProfileImage = card.showProfileImage !== false; // default true
  const profileImageUrl = card.heroProfileImageUrl || card.profileImageUrl || '';
  const customLogoUrl = card.heroLogoUrl || card.customLogoUrl || '';

  // Shape, position & borders of avatar
  const profileImagePosition = card.heroImagePlacement || card.profileImagePosition || (
    (pType === 'business' || pType === 'family' || pType === 'project' || pType === 'club' || pType === 'school') ? 'bottom-right' : 'center'
  );
  const profileImageShape = card.heroImageShape || card.profileImageShape || 'circle';

  // Sizing of profile image
  let avatarSizeValue = 110;
  if (card.heroProfileImageSize !== undefined && card.heroProfileImageSize !== null) {
    avatarSizeValue = Number(card.heroProfileImageSize) || 110;
  } else if (card.heroImageSize !== undefined && card.heroImageSize !== null) {
    if (typeof card.heroImageSize === 'number') {
      avatarSizeValue = card.heroImageSize;
    } else if (typeof card.heroImageSize === 'string') {
      const lower = (card.heroImageSize as string).toLowerCase();
      if (lower === 'small') avatarSizeValue = 80;
      else if (lower === 'medium') avatarSizeValue = 110;
      else if (lower === 'large') avatarSizeValue = 160;
      else if (lower === 'xlarge') avatarSizeValue = 220;
      else {
        const parsed = parseInt(lower, 10);
        if (!isNaN(parsed)) avatarSizeValue = parsed;
      }
    }
  }

  // Layout Style
  const layoutStyle = card.heroLayout || 'klassisch';

  // Text configuration
  const showHeroText = card.showHeroText !== false; // default true
  const showHeroTitle = card.showHeroTitle !== false;
  const showHeroSubtitle = card.showHeroSubtitle !== false;
  const showHeroDescription = card.showHeroDescription !== false;

  const textPosition = card.heroTextPosition || (showProfileImage ? 'bottom' : 'center');
  const textAlign = card.heroTextAlign || 'center';
  const fontStyle = card.heroFontStyle || 'modern';
  const textColor = card.heroTextColor || 'white';

  // Text contents
  const displayTitle = card.heroTitle || card.title || '';
  const displaySubtitle = card.heroSubtitle || card.subtitle || '';
  const displayDescription = card.heroDescription || card.description || '';
  const displayCompany = card.heroCompany || card.companyName || '';
  const displayLocation = card.heroLocation || card.location || '';

  // Get dynamic timing styles for profile elements (image, name/title, subtitle/claim, description/info)
  const getTimedElementStyle = (
    type: 'image' | 'title' | 'subtitle' | 'description',
    baseStyle: React.CSSProperties = {}
  ): React.CSSProperties => {
    const vBg = card.videoBackgroundConfig;
    if (!vBg || !vBg.enabled) return baseStyle;

    const currentT = effectiveTime ?? 999; // Default to fully rendered sequence end if not set
    const isAfter = timelineState?.isAfterSequence || false;

    let enabled = false;
    let startSecond = 0;
    let fadeDuration = 1.0;
    let staysVisible = true;

    if (type === 'image') {
      const pir = vBg.profileImageReveal;
      if (pir) {
        enabled = pir.enabled;
        startSecond = pir.startSecond ?? 0;
        fadeDuration = pir.fadeDuration ?? 1.0;
        staysVisible = pir.staysVisibleAfterSequence ?? true;
      }
    } else {
      const ptrs = vBg.profileTextReveals || [];
      const fieldR = ptrs.find((r: any) => r.fieldKey === type);
      if (fieldR) {
        enabled = fieldR.enabled;
        startSecond = fieldR.startSecond ?? 0;
        fadeDuration = fieldR.fadeDuration ?? 1.0;
        staysVisible = fieldR.staysVisibleAfterSequence ?? true;
      }
    }

    if (!enabled) return baseStyle;

    let opacity = 1;
    let transformMultiplier = 1;

    if (isAfter && !staysVisible) {
      opacity = 0;
      transformMultiplier = 0;
    } else if (currentT < startSecond) {
      opacity = 0;
      transformMultiplier = 0;
    } else if (currentT >= startSecond + fadeDuration) {
      opacity = 1;
      transformMultiplier = 1;
    } else {
      opacity = (currentT - startSecond) / fadeDuration;
      transformMultiplier = opacity;
    }

    const transformStr = `scale(${0.95 + transformMultiplier * 0.05})`;

    return {
      ...baseStyle,
      opacity,
      transform: baseStyle.transform && baseStyle.transform !== 'none'
        ? `${baseStyle.transform} ${transformStr}`
        : transformStr,
      transition: isAfter || currentT < startSecond || currentT >= startSecond + fadeDuration
        ? 'opacity 0.25s ease-out, transform 0.25s ease-out'
        : 'none' // instant feedback during manual scrubbing
    };
  };

  // Height class mapper
  const getHeroHeightClass = () => {
    if (isEditor) {
      switch (heroSize) {
        case 'small': return 'h-[220px]';
        case 'large': return 'h-[440px]';
        case 'medium':
        default:
          return 'h-[320px]';
      }
    }

    switch (heroSize) {
      case 'small': return 'h-[220px] sm:h-[280px]';
      case 'large': return 'h-[440px] sm:h-[560px]';
      case 'medium':
      default:
        return 'h-[320px] sm:h-[400px]';
    }
  };

  const getComputedObjectPosition = () => {
    const pos = card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center';
    let posX = '50%';
    let posY = '50%';

    if (pos === 'top') { posX = '50%'; posY = '0%'; }
    else if (pos === 'bottom') { posX = '50%'; posY = '100%'; }
    else if (pos === 'left') { posX = '0%'; posY = '50%'; }
    else if (pos === 'right') { posX = '100%'; posY = '50%'; }

    const offX = card.heroImageOffsetX !== undefined ? card.heroImageOffsetX : 0;
    const offY = card.heroImageOffsetY !== undefined ? card.heroImageOffsetY : 0;

    return `calc(${posX} + ${offX}px) calc(${posY} + ${offY}px)`;
  };

  // Render background elements
  const renderBackground = () => {
    if (!isBgEnabled) return null;
    const sVal = card.heroSaturation !== undefined ? card.heroSaturation : 100;
    const filterParts: string[] = [];
    if (bgBlurStyle.filter) {
      filterParts.push(bgBlurStyle.filter);
    }
    filterParts.push(`saturate(${sVal}%)`);
    const mediaStyle = { filter: filterParts.join(' ') };

    if (backgroundType === 'video' && videoUrl) {
      const parsedVideo = parseVideoUrl(videoUrl);
      if (parsedVideo.type === 'direct') {
        return (
          <video
            src={parsedVideo.url}
            autoPlay
            muted
            loop
            preload="metadata"
            playsInline
            className="w-full h-full object-cover"
            style={{
              ...mediaStyle,
              objectPosition: getComputedObjectPosition()
            }}
          />
        );
      } else if (parsedVideo.type === 'youtube' || parsedVideo.type === 'vimeo') {
        return (
          <div className="w-full h-full relative overflow-hidden bg-black/40" style={mediaStyle}>
            <iframe
              src={parsedVideo.url}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-105"
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Profile Video Background"
            />
          </div>
        );
      }
    }

    if (backgroundType === 'image' && imageUrl) {
      const modeClass = card.heroImageMode === 'contain' ? 'object-contain' : 'object-cover';
      return (
        <img
          src={imageUrl}
          alt="Profile Background"
          className={`w-full h-full select-none ${modeClass}`}
          style={{
            ...mediaStyle,
            objectPosition: getComputedObjectPosition()
          }}
          referrerPolicy="no-referrer"
        />
      );
    }

    // Default to background with solid/gradient color background
    return (
      <div 
        className="w-full h-full transition-all duration-300 relative flex items-center justify-center p-4"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/5 pointer-events-none" />
        {!imageUrl && !videoUrl && isEditing && isBgEnabled && (
          <div className="flex flex-col items-center justify-center opacity-30 text-stone-300 gap-1 select-none pointer-events-none0">
            <LucideIcons.Image size={24} />
            <span className="text-[10px] font-mono tracking-widest uppercase">Profilbereich</span>
          </div>
        )}
      </div>
    );
  };

  // Avatar Placement Position Helper
  const getProfileImagePosClass = () => {
    switch (profileImagePosition) {
      case 'top-left': return 'absolute left-3.5 sm:left-7 top-4';
      case 'top-right': return 'absolute right-3.5 sm:right-7 top-4';
      case 'left': return 'absolute left-3.5 sm:left-7 top-1/2 -translate-y-1/2';
      case 'right': return 'absolute right-3.5 sm:right-7 top-1/2 -translate-y-1/2';
      case 'bottom-left': return 'absolute left-3.5 sm:left-7 bottom-4';
      case 'bottom-right': return 'absolute right-3.5 sm:right-7 bottom-4';
      case 'center': 
      default:
        if (showHeroText && (displayTitle || displaySubtitle || displayDescription || isEditing)) {
          if (textPosition === 'bottom' || textPosition === 'center') {
            return 'absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-[32%]';
          }
          if (textPosition === 'top') {
            return 'absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-[68%]';
          }
        }
        return 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getAvatarBorderRadius = () => {
    switch (profileImageShape) {
      case 'square': return '0px';
      case 'rounded': return '20px';
      case 'circle':
      default:
        return '9999px';
    }
  };

  // Shape class
  const getImageShapeClass = () => {
    switch (profileImageShape) {
      case 'square': return 'rounded-none';
      case 'rounded': return 'rounded-[20px]';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  // Border class
  const getImageBorderClass = () => {
    if (card.heroImageBorderColor || card.heroImageBorderWidth !== undefined) {
      return ''; // styles will be injected inline
    }
    const profileImageBorder = card.profileImageBorder || 'gold';
    switch (profileImageBorder) {
      case 'gold': return 'border-2 border-[#A855F7] p-0.5 bg-stone-950/90 shadow-xl';
      case 'cream': return 'border-2 border-[#F5F2EB] p-0.5 bg-stone-950/90 shadow-xl';
      case 'none':
      default:
        return 'border-0 p-0 shadow-lg';
    }
  };

  // Text Fonts and Styling
  const getFieldFontFamilyStyle = (style: string) => {
    switch (style) {
      case 'elegant': return 'Playfair Display, Georgia, serif';
      case 'bold': return 'Outfit, Montserrat, sans-serif';
      case 'minimal': return 'JetBrains Mono, Fira Code, monospace';
      case 'modern':
      default:
        return 'Inter, system-ui, sans-serif';
    }
  };

  const getFieldFontClass = (style: string) => {
    switch (style) {
      case 'elegant': return 'font-serif tracking-normal font-medium';
      case 'bold': return 'font-sans font-black tracking-tight uppercase';
      case 'minimal': return 'font-mono uppercase tracking-widest font-normal';
      case 'modern':
      default:
        return 'font-sans font-bold tracking-tight';
    }
  };

  const getFieldColorClass = (color: string) => {
    switch (color) {
      case 'cream': return 'text-[#F5F2EB]';
      case 'gold': return 'text-[#A855F7]';
      case 'silver': return 'text-[#D1D5DB]';
      case 'white': return 'text-white';
      case 'dark': return 'text-stone-900';
      default: return 'text-white';
    }
  };

  const getFieldColorStyle = (colorVal: string | undefined, defaultColorClass: string) => {
    if (!colorVal) return { className: defaultColorClass, style: {} };
    if (colorVal.startsWith('#') || colorVal.startsWith('rgb') || colorVal.startsWith('hsl')) {
      return { className: '', style: { color: colorVal } };
    }
    return { className: getFieldColorClass(colorVal), style: {} };
  };

  const getTitleFontClass = () => {
    return getFieldFontClass(card.heroTitleFontStyle || fontStyle);
  };

  const normalizeSizeToNumber = (val: string | number | undefined, defaultVal: number): number => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'number') return val;
    if (val === 'normal') return defaultVal;
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultVal : num;
  };

  const parseSize = (sizeVal: string | number | undefined, defaultVal: number): string => {
    const num = normalizeSizeToNumber(sizeVal, defaultVal);
    return `${num}px`;
  };

  const getTitleStyle = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (card.heroFontFamily) {
      s.fontFamily = `"${card.heroFontFamily}", Inter, system-ui, sans-serif`;
    } else {
      s.fontFamily = getFieldFontFamilyStyle(card.heroTitleFontStyle || fontStyle);
    }
    s.fontSize = parseSize(card.heroTitleSize, 26);
    if (card.heroFontWeight) {
      s.fontWeight = card.heroFontWeight;
    }
    return s;
  };

  const getSubtitleFontClass = () => {
    return getFieldFontClass(card.heroSubtitleFontStyle || fontStyle);
  };

  const getSubtitleStyle = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (card.heroFontFamily) {
      s.fontFamily = `"${card.heroFontFamily}", Inter, system-ui, sans-serif`;
    } else {
      s.fontFamily = getFieldFontFamilyStyle(card.heroSubtitleFontStyle || fontStyle);
    }
    s.fontSize = parseSize(card.heroSubtitleSize, 14);
    return s;
  };

  const getDescFontClass = () => {
    return getFieldFontClass(card.heroDescFontStyle || fontStyle);
  };

  const getDescStyle = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (card.heroFontFamily) {
      s.fontFamily = `"${card.heroFontFamily}", Inter, system-ui, sans-serif`;
    } else {
      s.fontFamily = getFieldFontFamilyStyle(card.heroDescFontStyle || fontStyle);
    }
    s.fontSize = parseSize(card.heroDescriptionSize, 12);
    if (card.heroLineHeight) {
      s.lineHeight = card.heroLineHeight;
    }
    return s;
  };

  const getTitleColorObj = () => {
    return getFieldColorStyle(card.heroTitleTextColor || card.heroTextColor || textColor, 'text-white');
  };

  const getSubtitleColorObj = () => {
    if (card.heroSubtitleTextColor) {
      return getFieldColorStyle(card.heroSubtitleTextColor, 'text-[#A855F7]');
    }
    if (textColor === 'dark') return { className: 'text-stone-700', style: {} };
    if (textColor === 'gold') return { className: 'text-white/80', style: {} };
    return { className: 'text-[#A855F7]', style: {} };
  };

  const getDescColorObj = () => {
    if (card.heroDescTextColor) {
      return getFieldColorStyle(card.heroDescTextColor, 'text-stone-250');
    }
    if (textColor === 'dark') return { className: 'text-stone-800', style: {} };
    return { className: 'text-stone-200/90', style: {} };
  };

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'text-left items-start';
      case 'right': return 'text-right items-end';
      case 'center':
      default:
        return 'text-center items-center';
    }
  };

  const getTextContainerClass = () => {
    // If layoutStyle is left-aligned or has custom positioned texts
    if (layoutStyle === 'textlinks') {
      return 'justify-end pb-6 pt-6';
    }

    const { effectiveTextPos } = getEffectivePositions();
    switch (effectiveTextPos as any) {
      case 'top': 
        return 'justify-start pt-5 sm:pt-6 pb-20';
      case 'top-center':
        return 'justify-start pt-14 sm:pt-16 pb-12';
      case 'center': 
        return 'justify-center py-4';
      case 'bottom':
      default:
        return 'justify-end pb-5 sm:pb-6 pt-20';
    }
  };

  const getEffectivePositions = () => {
    let effectiveTextPos = textPosition;
    let effectiveImgPos = profileImagePosition;

    if (showProfileImage) {
      if (profileImagePosition === 'bottom-left' || profileImagePosition === 'bottom-right') {
        if (textPosition === 'bottom' || textPosition === 'center') {
          effectiveTextPos = 'top';
        }
      } else if (profileImagePosition === 'top-left' || profileImagePosition === 'top-right') {
        if (textPosition === 'top' || textPosition === 'center') {
          effectiveTextPos = 'bottom';
        }
      } else if (profileImagePosition === 'center') {
        if (textPosition === 'center' || textPosition === 'bottom') {
          effectiveTextPos = 'bottom';
        } else if (textPosition === 'top') {
          effectiveTextPos = 'top';
        }
      }
    }

    return { effectiveTextPos, effectiveImgPos };
  };

  const getInnerCustomStyles = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (card.heroPadding) {
      s.padding = card.heroPadding;
    }
    return s;
  };

  const getHeroCardStyles = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    s.borderRadius = '0px';
    if (isBgEnabled) {
      if (card.heroBorderEnabled && card.heroBorderColor) {
        s.borderColor = card.heroBorderColor;
        s.borderWidth = card.heroBorderWidth !== undefined ? `${card.heroBorderWidth}px` : '1px';
        s.borderStyle = 'solid';
      }
      if (card.heroGlow && card.heroGlow !== 'none') {
        if (card.heroGlow === 'gold') {
          s.boxShadow = '0 0 15px rgba(201, 166, 70, 0.45)';
        } else if (card.heroGlow === 'light') {
          s.boxShadow = '0 0 15px rgba(255, 255, 255, 0.3)';
        }
      }
    }
    return s;
  };

  const getHeroCardShadowClass = () => {
    if (!isBgEnabled) return 'shadow-none';
    if (card.heroShadow) {
      switch (card.heroShadow) {
        case 'none': return 'shadow-none';
        case 'soft': return 'shadow-md';
        case 'medium': return 'shadow-xl';
        case 'strong': return 'shadow-2xl';
      }
    }
    return 'shadow-2xl';
  };

  const getMotionTransitionProps = (animType: string, isVisible: boolean, delayS: number) => {
    const transition = {
      duration: 0.8,
      delay: delayS,
      ease: [0.16, 1, 0.3, 1] as any,
    };

    if (!isVisible) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 0, y: 15 },
        transition,
      } as any;
    }

    switch (animType) {
      case 'slide_left':
        return {
          initial: { opacity: 0, x: -40 },
          animate: { opacity: 1, x: 0 },
          transition,
        } as any;
      case 'slide_up':
        return {
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          transition,
        } as any;
      case 'reveal':
        return {
          initial: { opacity: 0, scaleY: 0, originY: 0 },
          animate: { opacity: 1, scaleY: 1 },
          transition: { ...transition, duration: 0.9 },
        } as any;
      case 'focus':
        return {
          initial: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          transition: { ...transition, duration: 0.7 },
        } as any;
      case 'fade':
      default:
        return {
          initial: { opacity: 0, scale: 0.98 },
          animate: { opacity: 1, scale: 1 },
          transition,
        } as any;
    }
  };

  const renderHighlightedText = (
    text: string,
    emphasisMode: 'none' | 'last_word' | 'custom_word',
    emphasisWord?: string,
    emphasisColor: string = '#A855F7'
  ) => {
    if (emphasisMode === 'none' || !text) {
      return text;
    }
    const { before, highlighted, after } = getHighlightedTextElements(text, emphasisMode, emphasisWord, emphasisColor);
    if (!highlighted) return text;

    return (
      <>
        {before}
        <span style={{ color: emphasisColor }} className="font-bold underline decoration-current/20 underline-offset-4 inline-block">
          {highlighted}
        </span>
        {after}
      </>
    );
  };

  const titleColorStyles = getTitleColorObj();
  const subtitleColorStyles = getSubtitleColorObj();
  const descColorStyles = getDescColorObj();

  const getTextShadowStyle = (): React.CSSProperties => {
    const val = card.heroTextShadow || 'soft';
    switch (val as any) {
      case 'none': 
        return { textShadow: 'none' };
      case 'strong': 
        return { textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)' };
      case 'glow': 
        return { textShadow: '0 0 12px rgba(201, 166, 70, 0.55), 0 1px 3px rgba(0,0,0,0.8)' };
      case 'soft':
      default:
        return { textShadow: '0 1px 3px rgba(0,0,0,0.65)' };
    }
  };

  // Build the meta lists
  const subtitleRowItems: string[] = [];
  if (displaySubtitle) subtitleRowItems.push(displaySubtitle);
  if (displayCompany) subtitleRowItems.push(displayCompany);
  if (displayLocation) subtitleRowItems.push(displayLocation);
  const compositeSubtitle = subtitleRowItems.join(' • ');

  const sanitizedClassName = className
    .split(' ')
    .filter(c => !c.startsWith('rounded'))
    .join(' ');

  const hasBorderOverride = className.includes('border-') || (isBgEnabled && card.heroBorderEnabled);
  const borderClass = isBgEnabled ? (hasBorderOverride ? '' : 'border border-stone-850') : '';

  return (
    <div 
      onClick={onBlockClick}
      className={`w-full ${getHeroHeightClass()} rounded-none ${borderClass} overflow-hidden relative ${getHeroCardShadowClass()} ${isBgEnabled ? 'bg-[#121212]' : 'bg-transparent'} select-none transition-all duration-200 flex flex-col justify-end ${
        (isEditing || isEditor) ? 'cursor-pointer hover:border-[#A855F7]/60 group' : ''
      } ${sanitizedClassName}`}
      style={getHeroCardStyles()}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {renderBackground()}
      </div>

      {/* Overlays */}
      {/* 1. Custom overlays */}
      {isBgEnabled && customOverlayOpacity !== null && (
        <div className="absolute inset-0 bg-stone-950 pointer-events-none z-1" style={{ opacity: customOverlayOpacity }} />
      )}

      {/* 2. Legacy gradients, only active if no custom opacity specified */}
      {isBgEnabled && customOverlayOpacity === null && overlayStyle === 'dark-gradient' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-1 pointer-events-none" />
      )}
      {isBgEnabled && customOverlayOpacity === null && overlayStyle === 'light-gradient' && (
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/45 to-transparent z-1 pointer-events-none" />
      )}

      {/* Layout premium top accent indicator */}
      {layoutStyle === 'premium' && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#A855F7] to-transparent z-10" />
      )}

      {/* Profile Image/Avatar */}
      {showProfileImage && (
        <div 
          className={`${getProfileImagePosClass()} z-10 p-0.5`}
          style={getTimedElementStyle('image')}
        >
          <div 
            className={`flex items-center justify-center overflow-hidden transition-all duration-300 ${getImageBorderClass()}`}
            style={{
              width: `${avatarSizeValue}px`,
              height: `${avatarSizeValue}px`,
              borderRadius: getAvatarBorderRadius(),
              borderColor: card.heroImageBorderColor || undefined,
              borderWidth: card.heroImageBorderWidth !== undefined ? `${card.heroImageBorderWidth}px` : undefined,
              borderStyle: card.heroImageBorderWidth ? 'solid' : undefined,
              transform: `translate(${(card.heroProfileImageX !== undefined ? card.heroProfileImageX : card.heroImageXOffset) || 0}px, ${(card.heroProfileImageY !== undefined ? card.heroProfileImageY : card.heroImageYOffset) || 0}px)`,
            }}
          >
            {profileImageUrl || customLogoUrl ? (
              <img
                src={profileImageUrl || customLogoUrl}
                alt="Avatar"
                className="w-full h-full object-cover block"
                style={{
                  borderRadius: 'inherit',
                  width: '100%',
                  height: '100%',
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-full h-full bg-stone-900/65 flex items-center justify-center text-stone-400"
                style={{ borderRadius: 'inherit' }}
              >
                <LucideIcons.User size={avatarSizeValue > 60 ? 28 : 20} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Texts Block */}
      {showHeroText && (displayTitle || compositeSubtitle || displayDescription || isEditing) && (
        <div 
          className="absolute inset-0 flex flex-col px-4 sm:px-6 md:px-8 z-5 pointer-events-none text-center items-center justify-center"
          style={getInnerCustomStyles()}
        >
          {card.ureelTextTemplate && card.ureelTextTemplate.style && card.ureelTextTemplate.style !== 'none' ? (
            (() => {
              const textTemplate = normalizeUreelTextTemplate(card.ureelTextTemplate);
              const fontClass = getFontStyleClasses(textTemplate.fontStyle);
              const boxClass = getBoxStyleClasses(textTemplate.box.type, textTemplate.box.opacity);
              
              const animationType = textTemplate.animation;
              const emphasisMode = textTemplate.emphasis?.mode || 'none';
              const emphasisWord = textTemplate.emphasis?.word || '';
              const emphasisColor = textTemplate.emphasis?.color || '#A855F7';
              
              const frameColor = textTemplate.frame?.color || '#A855F7';

              // Get motion definitions with delay based on timeline states
              const titleMotion = getMotionTransitionProps(animationType, showTitle, 0.1);
              const subtitleMotion = getMotionTransitionProps(animationType, showSubtitle, 0.35);
              const descMotion = getMotionTransitionProps(animationType, showDescription, 0.65);

              const frameStyle: React.CSSProperties = {
                borderColor: frameColor,
              };
              if (textTemplate.frame.type === 'underline') {
                frameStyle.borderBottom = `3px solid ${frameColor}`;
              } else if (textTemplate.frame.type === 'side_line') {
                frameStyle.borderLeft = `4px solid ${frameColor}`;
              }

              return (
                <div 
                  className={`max-w-xs sm:max-w-md w-full relative p-6 sm:p-7 flex flex-col pointer-events-auto leading-tight space-y-3 transition-all duration-500 rounded-3xl ${boxClass} ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'}`}
                  style={{
                    transform: `translate(${card.heroTextXOffset || 0}px, ${card.heroTextYOffset || 0}px)`,
                    ...frameStyle,
                  }}
                >
                  {/* Corner brackets frame decoration */}
                  {textTemplate.frame.type === 'corner' && (
                    <>
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: frameColor }} />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: frameColor }} />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: frameColor }} />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: frameColor }} />
                    </>
                  )}

                  {/* Optional dashed inner border box decor */}
                  {textTemplate.frame.type === 'thin' && (
                    <div className="absolute inset-2 border border-dashed rounded-2xl pointer-events-none" style={{ borderColor: `${frameColor}40` }} />
                  )}

                  {/* Header Badge style frame (renders subtitle as a pill at the top) */}
                  {textTemplate.frame.type === 'badge' && compositeSubtitle && showHeroSubtitle && (
                    <motion.div
                      {...subtitleMotion}
                      className="inline-block px-4 py-1.5 rounded-full text-[10px] uppercase font-extrabold tracking-widest border"
                      style={{
                        backgroundColor: `${frameColor}15`,
                        borderColor: `${frameColor}40`,
                        color: frameColor,
                      }}
                    >
                      {compositeSubtitle}
                    </motion.div>
                  )}

                  {/* Title / Headline */}
                  {showHeroTitle && (
                    <motion.h1 
                      {...titleMotion}
                      className={`leading-tight font-black break-words w-full transition-all duration-300 ${fontClass} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}
                      style={{
                        fontSize: parseSize(card.heroTitleSize, 28),
                        ...getTitleStyle(),
                        fontFamily: undefined, // let class rule
                        color: textTemplate.box.type === 'light' ? '#1c1917' : undefined,
                      }}
                    >
                      {renderHighlightedText(displayTitle || (isEditing ? 'Werbebotschaft eingeben...' : ''), emphasisMode, emphasisWord, emphasisColor)}
                    </motion.h1>
                  )}

                  {/* Subtitle / Claims (skip if already rendered as a badge premium overlay) */}
                  {textTemplate.frame.type !== 'badge' && showHeroSubtitle && compositeSubtitle && (
                    <motion.p 
                      {...subtitleMotion}
                      className={`text-xs tracking-widest font-semibold uppercase break-words w-full ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}
                      style={{
                        fontSize: parseSize(card.heroSubtitleSize, 13),
                        color: textTemplate.box.type === 'light' ? '#44403c' : '#A855F7',
                        borderTop: textTemplate.fontStyle === 'serif' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '6px',
                        marginTop: '4px',
                      }}
                    >
                      {compositeSubtitle}
                    </motion.p>
                  )}

                  {/* Description / Pitch info */}
                  {showHeroDescription && displayDescription && (
                    <motion.p 
                      {...descMotion}
                      className={`text-xs leading-relaxed break-words w-full font-medium ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'}`}
                      style={{
                        fontSize: parseSize(card.heroDescriptionSize, 12.5),
                        color: textTemplate.box.type === 'light' ? '#57534e' : '#d6d3d1',
                      }}
                    >
                      {displayDescription}
                    </motion.p>
                  )}
                </div>
              );
            })()
          ) : layoutStyle === 'textrahmen' ? (
            <div 
              className={`max-w-xs sm:max-w-md w-full bg-stone-950/70 backdrop-blur-md border border-stone-850/60 rounded-xl p-3 sm:p-4 flex flex-col pointer-events-auto leading-tight space-y-1 relative shadow-2xl transition-all duration-500 ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'}`}
              style={{
                transform: `translate(${card.heroTextXOffset || 0}px, ${card.heroTextYOffset || 0}px)`,
              }}
            >
              {showHeroTitle && (
                <h1 
                  className={`leading-tight font-bold w-full break-words transition-all duration-500 ease-out ${getTitleFontClass()} ${titleColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('title', { ...getTitleStyle(), ...titleColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {displayTitle || (isEditing ? 'Geben Sie einen Namen ein...' : '')}
                </h1>
              )}

              {showHeroSubtitle && compositeSubtitle && (
                <p 
                  className={`tracking-wider border-t border-stone-800/80 pt-1 mt-1 w-full break-words transition-all duration-500 ease-out delay-75 ${getSubtitleFontClass()} ${subtitleColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('subtitle', { ...getSubtitleStyle(), ...subtitleColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {compositeSubtitle}
                </p>
              )}

              {showHeroDescription && displayDescription && (
                <p 
                  className={`mt-1.5 leading-snug w-full break-words transition-all duration-500 ease-out delay-150 ${getDescFontClass()} ${descColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('description', { ...getDescStyle(), ...descColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {displayDescription}
                </p>
              )}
            </div>
          ) : (
            <div 
              className={`max-w-xs sm:max-w-md w-full flex flex-col pointer-events-auto leading-tight space-y-1 transition-all duration-500 ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'}`}
              style={{
                transform: `translate(${card.heroTextXOffset || 0}px, ${card.heroTextYOffset || 0}px)`,
              }}
            >
              {showHeroTitle && (
                <h1 
                  className={`leading-tight break-words w-full transition-all duration-500 ease-out ${getTitleFontClass()} ${titleColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('title', { ...getTitleStyle(), ...titleColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {displayTitle || (isEditing ? 'Geben Sie einen Namen ein...' : '')}
                </h1>
              )}

              {showHeroSubtitle && compositeSubtitle && (
                <p 
                  className={`tracking-wider w-full break-words transition-all duration-500 ease-out delay-75 ${getSubtitleFontClass()} ${subtitleColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('subtitle', { ...getSubtitleStyle(), ...subtitleColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {compositeSubtitle}
                </p>
              )}

              {showHeroDescription && displayDescription && (
                <p 
                  className={`mt-1 md:mt-1.5 leading-snug w-full break-words transition-all duration-500 ease-out delay-150 ${getDescFontClass()} ${descColorStyles.className} ${textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'} ${
                    showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  }`}
                  style={getTimedElementStyle('description', { ...getDescStyle(), ...descColorStyles.style, ...getTextShadowStyle(), textAlign })}
                >
                  {displayDescription}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Editing Pen Overlay Icon */}
      {isEditing && (
        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#A855F7] text-stone-950 p-2 rounded-full shadow-2xl z-20">
          <LucideIcons.Edit2 size={12} className="stroke-[2.5px]" />
        </div>
      )}

      {/* Editor helper border overlay and customized buttons */}
      {isEditor && (
        <>
          {/* Transparent dashed border around the hero section */}
          <div className="absolute inset-1.5 border border-dashed border-[#A855F7]/35 rounded-xl pointer-events-none z-15 group-hover:border-[#A855F7]/50 group-hover:shadow-[inset_0_0_12px_rgba(201,166,70,0.15)] transition-all duration-200" />

          {/* Top row of buttons within the App/Card window */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1 pointer-events-auto z-25">
            {/* "Customize background" / "uReel Editor" button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditBackground) {
                  onEditBackground();
                } else if (onBlockClick) {
                  onBlockClick();
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 h-8 px-1.5 sm:px-2.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-[#A855F7]/50 hover:border-[#A855F7] text-[#A855F7] font-black text-[9px] sm:text-[10.5px] uppercase tracking-wider transition-all duration-150 shadow-xl active:scale-95 cursor-pointer"
              title={bgBtnText}
            >
              <LucideIcons.Palette size={11} className="stroke-[2.5] shrink-0" />
              <span className="min-[360px]:inline hidden">{bgBtnText}</span>
              <span className="min-[360px]:hidden inline">uReel</span>
            </button>

            {/* "Edit profile section" / "Texte & Timeline" button positioned between Background and Preview */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditProfileHero) {
                  onEditProfileHero();
                } else if (onBlockClick) {
                  onBlockClick();
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 h-8 px-1.5 sm:px-2.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-[#A855F7]/50 hover:border-[#A855F7] text-[#A855F7] font-black text-[9px] sm:text-[10.5px] uppercase tracking-wider transition-all duration-150 shadow-xl active:scale-95 cursor-pointer"
              title={profileBtnText}
            >
              <LucideIcons.User size={11} className="stroke-[2.5] shrink-0" />
              <span className="min-[360px]:inline hidden">{profileBtnText}</span>
              <span className="min-[360px]:hidden inline">Profil</span>
            </button>

            {/* "Preview" button (only if onPreview handler is passed) */}
            {onPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="flex items-center gap-1 sm:gap-1.5 h-8 px-2 sm:px-2.5 rounded-full bg-stone-950/80 hover:bg-stone-900 border border-[#A855F7]/50 hover:border-[#A855F7] text-[#A855F7] font-black text-[9px] sm:text-[10.5px] uppercase tracking-wider transition-all duration-150 shadow-xl active:scale-95 cursor-pointer"
                title={tLocal?.preview || 'Vorschau'}
              >
                <LucideIcons.Eye size={11} className="stroke-[2.5] shrink-0" />
                <span className="min-[360px]:inline hidden">{tLocal?.preview || 'Vorschau'}</span>
                <span className="min-[360px]:hidden inline">Preview</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
