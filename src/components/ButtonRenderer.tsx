/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { CardButton } from '../types';
import { normalizeButton, getButtonScaleFactor } from '../utils/buttonUtils';

interface ButtonRendererProps {
  button: CardButton;
  mode: 'designer' | 'editor' | 'public';
  onClick?: (e: React.MouseEvent) => void;
  previewScale?: number;
  isSelected?: boolean;
  isSortingMode?: boolean;
  dragProps?: any; // For React DnD or custom dragging props
  extraClassName?: string;
  lang?: 'de' | 'en';
  forceSquare?: boolean;
  forceSizePx?: number;
}

export const ButtonRenderer: React.FC<ButtonRendererProps> = ({
  button,
  mode,
  onClick,
  previewScale = 1,
  isSelected,
  isSortingMode,
  dragProps = {},
  extraClassName = '',
  lang = 'de',
  forceSquare = false,
  forceSizePx,
}) => {
  const btn = normalizeButton(button);

  // Parse font family
  const getFontFamily = () => {
    if (!btn.fontFamily) return 'inherit';
    const fam = btn.fontFamily.toLowerCase();
    if (fam.includes('grotesk') || fam.includes('space')) {
      return '"Space Grotesk", sans-serif';
    }
    if (fam.includes('mono') || fam.includes('jetbrains')) {
      return '"JetBrains Mono", monospace';
    }
    if (fam.includes('outfit') || fam.includes('avant')) {
      return '"Outfit", sans-serif';
    }
    if (fam.includes('space') || fam.includes('grotesk') || fam.includes('modern')) {
      return '"Space Grotesk", sans-serif';
    }
    if (fam.includes('nunito') || fam.includes('rund') || fam.includes('round')) {
      return '"Nunito", "Inter", sans-serif';
    }
    if (fam.includes('mono') || fam.includes('jetbrains') || fam.includes('code')) {
      return '"JetBrains Mono", monospace';
    }
    if (fam.includes('georgia') || fam.includes('elegant') || fam.includes('serif') || fam.includes('playfair')) {
      return '"Playfair Display", Georgia, serif';
    }
    return '"Inter", sans-serif';
  };

  const hexToRgba = (value: string, alpha: number): string => {
    const input = (value || '').trim();
    if (!input.startsWith('#')) return input;
    const hex = input.replace('#', '');
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    if (full.length !== 6) return input;
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return input;
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  };

  // Border styles
  const getBorderStyle = () => {
    if (btn.borderEnabled === false) {
      return { borderWidth: '0px' };
    }
    const color = btn.borderColor || '#A855F7';
    let width = '1px';
    if (btn.borderWidth === 'thin') width = '1px';
    else if (btn.borderWidth === 'medium') width = '2px';
    else if (btn.borderWidth === 'thick') width = '3px';
    else if (btn.borderWidth === 'none') return { borderWidth: '0px' };
    else if (typeof btn.borderWidth === 'number') width = `${btn.borderWidth}px`;
    else if (btn.hasGoldBorder) {
      width = '2px';
    }

    return {
      borderWidth: width,
      borderColor: color,
      borderStyle: btn.borderStyle || 'solid',
    };
  };

  // Shadow styles
  const getShadowStyle = () => {
    if (!btn.shadow || btn.shadow === 'none') return 'none';
    const color = btn.shadowColor || 'rgba(0, 0, 0, 0.15)';
    switch (btn.shadow) {
      case 'soft':
        return `0 2px 8px ${color}`;
      case 'medium':
        return `0 4px 14px ${color}`;
      case 'strong':
        return `0 8px 24px ${color}`;
      default:
        return 'none';
    }
  };

  // Background and style variant handling
  const getBgStyleAndColor = () => {
    let backgroundColor = btn.bgColor || btn.backgroundColor || '#F5F0E6';
    let backgroundStyle = {};

    const rawOpacity = typeof btn.opacity === 'number' ? btn.opacity : (typeof (btn as any).transparency === 'number' ? 100 - Number((btn as any).transparency) : 100);
    const op = Math.max(0, Math.min(1, rawOpacity / 100));

    // Check if simplified background mode is preset
    if (btn.bgMode === 'gradient') {
      const dirMap: any = {
        'to-bottom': 'to bottom',
        'to-right': 'to right',
        'to-br': 'to bottom right',
        'to-bl': 'to bottom left',
      };
      const direction = dirMap[btn.gradientDirection || 'to-bottom'] || 'to bottom';
      const c1 = btn.bgColor || '#F5F0E6';
      const c2 = btn.gradientColor || '#A855F7';
      backgroundStyle = {
        background: `linear-gradient(${direction}, ${hexToRgba(c1, op)}, ${hexToRgba(c2, op)})`,
      };
    } else if (btn.bgMode === 'solid') {
      backgroundStyle = {
        backgroundColor: hexToRgba(backgroundColor, op),
      };
    } else if (btn.styleVariant === 'gradient' && btn.gradient) {
      backgroundStyle = {
        background: btn.gradient,
        opacity: op,
      };
    } else if (btn.styleVariant === 'outline') {
      backgroundStyle = {
        backgroundColor: 'transparent',
      };
    } else if (btn.styleVariant === 'minimal') {
      backgroundStyle = {
        backgroundColor: 'transparent',
      };
    } else if (btn.styleVariant === 'soft') {
      // Add soft transparency
      backgroundStyle = {
        backgroundColor: hexToRgba(backgroundColor, Math.min(op, 0.22)),
      };
    } else {
      // filled standard
      backgroundStyle = {
        backgroundColor: hexToRgba(backgroundColor, op),
      };
    }

    return backgroundStyle;
  };

  // Normalize button shape to one of 'rounded', 'round', 'square'.
  // v52.5.29: The mobile UI label "Rund / Kreis" must mean an actual
  // circle in forced square card tiles.  Older data may store the same choice
  // as buttonShape='round', radius='pill', shape='circle', or German labels.
  // "Abgerundet" remains the rounded-square option.
  const shapeSources = [
    (btn as any).buttonShape,
    (btn as any).shape,
    (btn as any).style?.shape,
    btn.radius,
    (btn as any).style?.radius,
    (btn as any).borderRadius,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
    .map((value) => String(value).toLowerCase().trim());

  let shape: 'rounded' | 'round' | 'square' = 'rounded';
  if (shapeSources.some((value) => ['round', 'pill', 'circle', 'kreis', 'rundkreis', 'rund / kreis'].includes(value))) {
    shape = 'round';
  } else if (shapeSources.some((value) => ['square', 'eckig', 'corner', 'sharp', 'none'].includes(value))) {
    shape = 'square';
  } else if (shapeSources.some((value) => ['rounded', 'classic', 'abgerundet', 'soft', 'rund'].includes(value))) {
    shape = 'rounded';
  }

  // v52.5.27/v52.5.29: forceSquare means the tile keeps square dimensions
  // only. It must never overwrite the visual shape chosen by the user.

  const bSize = btn.buttonSize;
  const scaleFactor = getButtonScaleFactor(btn);
  
  // v52.5.4 mobile sync: the mobile card offers Quadrat, Kreis and abgerundetes Quadrat.
  // Forced-size card tiles therefore stay square; only future explicit rectangle modes may opt out.
  const isSquare = forceSquare || (!!forceSizePx && (shape === 'round' || shape === 'square' || shape === 'rounded'));

  // Calculate buttonSize presets
  let paddingXStyle = '';
  let paddingYStyle = '';
  let customWidth: string | number | undefined = undefined;
  let customHeight: number | undefined = undefined;
  let customMinHeight: number | undefined = undefined;

  const defaultPaddingX = 18;
  const defaultPaddingY = 10;
  const defaultMinHeight = 44;

  if (bSize && bSize.preset === 'custom' && bSize.scale === undefined) {
    if (bSize.paddingX !== undefined) paddingXStyle = `${bSize.paddingX}px`;
    if (bSize.paddingY !== undefined) paddingYStyle = `${bSize.paddingY}px`;
    if (bSize.width !== undefined) customWidth = bSize.width;
    if (bSize.height !== undefined) customHeight = bSize.height;
    if (bSize.minHeight !== undefined) customMinHeight = bSize.minHeight;
  } else {
    paddingXStyle = `${Math.round(defaultPaddingX * scaleFactor)}px`;
    paddingYStyle = `${Math.round(defaultPaddingY * scaleFactor)}px`;
    customMinHeight = Math.round(defaultMinHeight * scaleFactor);
  }

  // Padding & Text properties
  const forcedPx = typeof forceSizePx === 'number' ? forceSizePx : undefined;
  const isTinyTile = !!forcedPx && forcedPx <= 54;
  const isLargeForcedTile = !!forcedPx && forcedPx >= 66;
  const isExtremeShape = shape === 'round';
  // Forced mobile card tiles are real square buttons in a small 3x2 grid.
  // Pixel padding from the large editor preview makes the visible text area too
  // narrow and clips labels such as Company/Telefon. Use proportional padding
  // in forced tiles so Editor, Preview and Public calculate the same usable box.
  const paddingStyle = forceSizePx
    ? (isExtremeShape ? (isLargeForcedTile ? '10% 10%' : '8% 8%') : (isLargeForcedTile ? '9% 9%' : '7% 7%'))
    : (isExtremeShape 
        ? (isTinyTile ? '7% 7%' : '12% 12%') 
        : (paddingYStyle && paddingXStyle 
            ? `${paddingYStyle} ${paddingXStyle}` 
            : (btn.textPadding !== undefined ? `${Math.round(btn.textPadding * scaleFactor)}px` : `${Math.round(10 * scaleFactor)}px`)));

  // v52.5.5 mobile sync: forced 3x2 card tiles must use the same visible
  // scale as the button editor preview.  Older logic multiplied by the grid
  // scale factor, so text stayed tiny on the real 9:16 card although the editor
  // looked correct.  For forced mobile tiles we scale from the actual tile size.
  const tileRatio = forceSizePx ? Math.max(0.68, Math.min(0.96, forceSizePx / 68)) : 1;
  const fontScale = forceSizePx ? tileRatio : Math.min(scaleFactor, isTinyTile ? 1.0 : 1.12);
  const iconScale = forceSizePx ? Math.max(0.72, Math.min(0.92, forceSizePx / 76)) : Math.min(scaleFactor, isTinyTile ? 0.92 : 1.15);

  const labelLength = (btn.title || '').trim().length;
  const hasUsableIcon = btn.iconEnabled !== false && !!btn.icon;
  // On forced square mobile tiles, left/right icon layout leaves too little
  // horizontal room for labels and clips first/last characters. The full-size
  // editor tile can still show left/right, but the real 9:16 card tile uses a
  // stacked layout for readable public buttons.
  const rawIconPosition = btn.iconPosition;
  const effectiveIconPosition = forceSizePx && hasUsableIcon && (rawIconPosition === 'left' || rawIconPosition === 'right')
    ? 'top'
    : rawIconPosition;
  const baseFontSize = btn.fontSize !== undefined ? btn.fontSize : 12;
  const lengthPenalty = forceSizePx
    ? (labelLength > 28 ? 2.4 : labelLength > 20 ? 1.55 : labelLength > 14 ? 0.82 : labelLength > 9 ? 0.28 : 0)
    : (labelLength > 28 ? 4 : labelLength > 20 ? 3 : labelLength > 14 ? 1.8 : labelLength > 10 ? 0.8 : 0);
  // v52.5.10 mobile final fit: each text-size preset receives a clearly
  // different tile cap, while short 6-9 character labels stay readable instead
  // of hyphenating.  The card and editor preview share these exact values.
  const isSmallTextPreset = baseFontSize <= 10.8;
  const isNormalTextPreset = baseFontSize > 10.8 && baseFontSize < 13.2;
  const isLargeTextPreset = baseFontSize >= 13.2 && baseFontSize < 15.4;
  const forcedTextCap = forceSizePx
    ? (hasUsableIcon
      ? (isSmallTextPreset ? 7.6 : isNormalTextPreset ? 8.6 : isLargeTextPreset ? 9.6 : 10.4)
      : (isSmallTextPreset ? 9.4 : isNormalTextPreset ? 10.8 : isLargeTextPreset ? 12.0 : 13.0))
    : (hasUsableIcon ? 11.2 : 13.2);
  const forcedTextFloor = hasUsableIcon ? (isTinyTile ? 6.2 : 6.8) : (isTinyTile ? 7.4 : 8.0);
  const iconTextFactor = hasUsableIcon ? (isSmallTextPreset ? 0.82 : isNormalTextPreset ? 0.9 : isLargeTextPreset ? 0.96 : 1.02) : 1.0;
  const widthFitCap = forceSizePx && labelLength > 0
    ? Math.max(forcedTextFloor, (forceSizePx * (hasUsableIcon ? 0.84 : 0.9)) / Math.max(1, labelLength * 0.56))
    : forcedTextCap;
  const autoFitFontSize = forceSizePx
    ? Math.max(forcedTextFloor, Math.min(forcedTextCap, widthFitCap, (baseFontSize * fontScale * iconTextFactor) - lengthPenalty))
    : Math.max(isTinyTile ? 6.2 : 7, Math.round((baseFontSize * fontScale) - lengthPenalty));
  const sizeStyle = `${Number(autoFitFontSize.toFixed(1))}px`;

  const fontWeights: any = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    '300': '300',
    '400': '400',
    '500': '500',
    '600': '600',
    '700': '700',
    '800': '800',
    '900': '900',
  };
  const weightStyle = btn.fontWeight ? fontWeights[String(btn.fontWeight).toLowerCase()] || '500' : '500';

  // Text Shadow Style
  let textShadowVal = 'none';
  if (btn.textShadow === 'soft') {
    textShadowVal = '0 1px 3px rgba(0,0,0,0.3)';
  } else if (btn.textShadow === 'strong') {
    textShadowVal = '0 2px 6px rgba(0,0,0,0.6)';
  }

  // Border Roundness (Radius)
  const getRadiusClass = () => {
    if (shape === 'square') return 'rounded-none';
    if (shape === 'round') return 'rounded-full';
    return 'rounded-[18px]'; // standard ureel rounded-rectangle button style
  };
  const radiusStyleValue = shape === 'square' ? (forceSizePx ? '8px' : '6px') : shape === 'round' ? '999px' : (forceSizePx ? `${Math.max(10, Math.round(forceSizePx * 0.18))}px` : '20px');

  // Render internal Icon
  const renderIcon = (iconId: string, color: string, size = 18) => {
    if (!iconId) return null;
    const IconComp = (LucideIcons as any)[iconId];
    if (IconComp) {
      return <IconComp size={size} style={{ color }} className="shrink-0" />;
    }
    const SparklesComp = LucideIcons.Sparkles;
    return <SparklesComp size={size} style={{ color }} className="shrink-0" />;
  };

  const renderIconOrImage = (extraStyle: React.CSSProperties = {}) => {
    if (btn.iconEnabled === false) return null;
    if (!btn.icon) return null;

    const finalStyle: React.CSSProperties = {
      transform: `translate(${btn.iconOffsetX || 0}px, ${btn.iconOffsetY || 0}px)`,
      ...extraStyle,
    };

    // v52.5.7 mobile parity: action icons must be pure icons in both the editor preview
    // and the real 9:16 card. Older starter buttons carried iconCircleBg=true,
    // which produced the small grey blob behind icons on the card. Ignore that
    // legacy background for forced square mobile tiles.
    const circleBg = !forceSizePx && ((btn as any).iconCircleBg || (btn as any).iconBackground === 'circle');
    const circleStyle: React.CSSProperties = circleBg ? {
      width: Math.max(isTinyTile ? 18 : 22, iconSize + (isTinyTile ? 8 : 14)),
      height: Math.max(isTinyTile ? 18 : 22, iconSize + (isTinyTile ? 8 : 14)),
      borderRadius: 999,
      background: (btn as any).iconCircleColor || 'rgba(26,26,26,0.16)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35)',
    } : {};

    return (
      <div style={{ ...finalStyle, ...circleStyle }} className="pointer-events-none shrink-0 flex items-center justify-center">
        {renderIcon(btn.icon, iconColor, iconSize)}
      </div>
    );
  };

  // Image mode & overlay classes
  const getOverlayOpacityClass = () => {
    if (btn.imageOverlay === 'none' || btn.imageOverlay === 0 || btn.imageOverlay === undefined) return 'bg-transparent';
    if (btn.imageOverlay === 'light') return 'bg-black/20';
    if (btn.imageOverlay === 'dark') return 'bg-black/50';
    if (typeof btn.imageOverlay === 'number') {
      return `rgba(0,0,0,${btn.imageOverlay / 100})`;
    }
    return 'bg-black/35'; // default
  };

  // Glow classes
  const getGlowStyles = () => {
    if (btn.glow === 'gold') {
      return 'shadow-[0_0_15px_rgba(201,166,70,0.4)] ring-1 ring-[#A855F7]/30';
    }
    if (btn.glow === 'light') {
      return 'shadow-[0_0_15px_rgba(255,255,255,0.2)] ring-1 ring-white/10';
    }
    return '';
  };

  // Wiggle / Pulse style variants for motion (Disabled)
  const animateProp: any = {};

  // Text wrapper properties
  const getTextWrapClass = () => {
    if (btn.textWrap === 'ellipsis') return 'truncate whitespace-nowrap block w-full';
    if (btn.textWrap === 'single') return 'line-clamp-1 break-words';
    return 'line-clamp-3 break-words whitespace-normal';
  };

  // Layout alignment classes
  const getTextAlignClass = () => {
    if (btn.textAlign === 'left') return 'text-left items-start';
    if (btn.textAlign === 'right') return 'text-right items-end';
    return 'text-center items-center';
  };

  const getTextPositionClass = () => {
    // v52.5.33: forced card tiles must keep icon/text centered. Legacy starter
    // buttons often store textPosition='bottom', which pushed content to the
    // lower edge on the live card. The editor field may still store bottom, but
    // the real 9:16 tile uses a clean centered stack.
    if (forceSizePx) return 'justify-center';
    // v52.5.8: if the user disables the icon, keep the text visually centered.
    // Starter action buttons often store textPosition='bottom' for icon+label;
    // without an icon that made the label stick to the lower edge.
    if (btn.iconEnabled === false || !btn.icon) return 'justify-center';
    if (btn.textPosition === 'top') return 'justify-start';
    if (btn.textPosition === 'bottom') return 'justify-end';
    return 'justify-center';
  };

  // Image Positions
  const getImagePositionClass = () => {
    if (btn.imagePosition === 'top') return 'object-top';
    if (btn.imagePosition === 'bottom') return 'object-bottom';
    if (btn.imagePosition === 'left') return 'object-left';
    if (btn.imagePosition === 'right') return 'object-right';
    return 'object-center';
  };

  // Determine actual color for the text / items
  const textColor = btn.textColor || '#1E1E1E';
  const iconColor = btn.iconColor || '#1E1E1E';
  const requestedIconSize = Math.round((btn.iconSize || 18) * iconScale);
  const iconSize = forceSizePx
    ? Math.max(isTinyTile ? 8 : 10, Math.min(Math.round(requestedIconSize * 0.52), Math.round(forceSizePx * 0.16)))
    : requestedIconSize;


  // Visible button text: exactly what is entered in Button-Text.
  // A second line is allowed only via a manual line break in this field.
  // Action type / action label is never rendered as visible text.
  const rawVisibleTitle = (btn.title || '').toString().replace(/\r/g, '').trim();
  const rawVisibleSubtitle = ((btn as any).subtitle || '').toString().replace(/\r/g, '').trim();
  const buttonTextLines = (rawVisibleSubtitle
      ? [rawVisibleTitle || (lang === 'en' ? 'Untitled' : 'Ohne Titel'), rawVisibleSubtitle]
      : (rawVisibleTitle ? rawVisibleTitle.split('\n') : [lang === 'en' ? 'Untitled' : 'Ohne Titel']))
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (buttonTextLines.length === 0) {
    buttonTextLines.push(lang === 'en' ? 'Untitled' : 'Ohne Titel');
  }
  const hasSecondButtonLine = buttonTextLines.length > 1;
  const compactSingleLine = !!forceSizePx && !hasSecondButtonLine && (buttonTextLines[0] || '').length <= 10;

  // Render Image Layer
  const buttonImageUrlToUse = btn.buttonImageUrl || btn.imageUrl || '';
  const hasBackgroundImg = !!buttonImageUrlToUse;
  const buttonImageFitToUse = btn.buttonImageFit || btn.imageMode || 'cover';
  const buttonImageOverlayToUse = btn.buttonImageOverlay ?? (btn.imageOverlay !== 'none' && btn.imageOverlay !== 0 && btn.imageOverlay !== undefined);

  const inlineStyles: React.CSSProperties = {
    color: textColor,
    fontFamily: getFontFamily(),
    boxShadow: getShadowStyle(),
    transform: `scale(${previewScale})`,
    ...getBorderStyle(),
    ...getBgStyleAndColor(),
  };

  if (customHeight !== undefined) {
    inlineStyles.height = `${customHeight}px`;
  }
  if (customMinHeight !== undefined) {
    inlineStyles.minHeight = `${customMinHeight}px`;
  }
  if (customWidth !== undefined) {
    inlineStyles.width = typeof customWidth === 'number' ? `${customWidth}px` : customWidth;
  }

  // Apply percentage dimensions if no fixed custom bounds are set
  if (customHeight === undefined && customWidth === undefined) {
    if (isSquare) {
      inlineStyles.width = `${Math.round(scaleFactor * 100)}%`;
      inlineStyles.height = `${Math.round(scaleFactor * 100)}%`;
      inlineStyles.margin = 'auto';
    } else {
      inlineStyles.width = `${Math.min(100, Math.round(scaleFactor * 100))}%`;
      inlineStyles.margin = 'auto';
    }
  }

  // Force size absolute override (e.g. for ureel design).
  // v52.5.3: real 9:16 card buttons must never collapse to border lines.
  // Button content is positioned absolutely, so a forced-width non-square button also
  // needs a real min-height. Otherwise the visible card button becomes a thin line.
  if (forceSizePx !== undefined) {
    inlineStyles.width = `${forceSizePx}px`;
    inlineStyles.maxWidth = `${forceSizePx}px`;
    inlineStyles.flex = '0 0 auto';
    if (isSquare) {
      inlineStyles.height = `${forceSizePx}px`;
      inlineStyles.maxHeight = `${forceSizePx}px`;
      inlineStyles.minHeight = `${forceSizePx}px`;
    } else {
      inlineStyles.minHeight = `${Math.max(32, Math.round(forceSizePx * 0.72))}px`;
    }
  }

  // Apply normalized shape style
  if (shape === 'round') {
    inlineStyles.borderRadius = '999px';
  } else if (shape === 'square') {
    inlineStyles.borderRadius = radiusStyleValue;
  } else {
    // rounded - proportional slightly
    inlineStyles.borderRadius = radiusStyleValue;
  }

  // Click Handler wrapping
  const handleOnClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  const contentMarkup = (
    <div className="absolute inset-0 z-0 flex flex-col h-full w-full pointer-events-none">
      {/* Background full-bleed image if present */}
      {hasBackgroundImg && (
        <>
          <img
            src={buttonImageUrlToUse}
            alt=""
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full ${
              buttonImageFitToUse === 'contain' ? 'object-contain' : 'object-cover'
            } ${getImagePositionClass()} z-0 pointer-events-none`}
            style={{
              filter: btn.imageSaturation !== undefined ? `saturate(${btn.imageSaturation}%)` : undefined
            }}
          />
          {/* Abdunklung/Overlay layer */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              backgroundColor: buttonImageOverlayToUse === true
                ? 'rgba(0,0,0,0.45)'
                : typeof btn.imageDarken === 'number'
                ? `rgba(0,0,0,${btn.imageDarken / 100})`
                : typeof btn.imageOverlay === 'number' 
                ? `rgba(0,0,0,${btn.imageOverlay / 100})` 
                : btn.imageOverlay === 'dark' || btn.darkOverlay
                ? 'rgba(0,0,0,0.5)'
                : btn.imageOverlay === 'light'
                ? 'rgba(0,0,0,0.2)'
                : 'transparent'
            }}
          />
        </>
      )}

      {/* Background position icon if present */}
      {btn.iconEnabled !== false && btn.iconPosition === 'background' && btn.icon && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden"
          style={{
            padding: paddingStyle,
            opacity: 0.15,
            transform: `translate(${btn.iconOffsetX || 0}px, ${btn.iconOffsetY || 0}px)`
          }}
        >
          {renderIcon(btn.icon, iconColor, iconSize * 2)}
        </div>
      )}

      {/* Grid cells layout aligning Text & Media */}
      <div
        className={`absolute inset-0 p-2 z-20 flex flex-col h-full w-full ${getTextPositionClass()} ${getTextAlignClass()} pointer-events-none`}
        style={{ 
          padding: paddingStyle,
        }}
      >
        <div 
          className={`flex ${(effectiveIconPosition === 'top' || effectiveIconPosition === 'bottom' || effectiveIconPosition === 'center') ? 'flex-col' : 'flex-row'} items-center max-w-full ${getTextAlignClass()} pointer-events-none`}
          style={{
            gap: `${Math.round(((effectiveIconPosition === 'top' || effectiveIconPosition === 'bottom' || effectiveIconPosition === 'center') ? (isTinyTile ? 2 : 3) : 5) * scaleFactor)}px`,
            transform: forceSizePx ? 'translateY(-10%)' : undefined
          }}
        >
          
          {(effectiveIconPosition === 'top' || effectiveIconPosition === 'center') && renderIconOrImage()}

          {effectiveIconPosition === 'left' && renderIconOrImage()}

          <span
            className={`font-semibold z-10 ${hasSecondButtonLine ? '' : getTextWrapClass()} pointer-events-none`}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: btn.textAlign === 'left' ? 'flex-start' : btn.textAlign === 'right' ? 'flex-end' : 'center',
              width: forceSizePx ? '100%' : undefined,
              maxWidth: forceSizePx ? '100%' : '100%',
              textAlign: btn.textAlign || 'center',
              transform: forceSizePx
                ? undefined
                : (btn.textFineTuneEnabled === true
                  ? `translate(${Number(btn.textOffsetX ?? 0)}px, ${Number(btn.textOffsetY ?? 0)}px)`
                  : undefined),
              fontSize: sizeStyle,
              fontWeight: weightStyle,
              letterSpacing: btn.letterSpacing ? `${btn.letterSpacing}px` : undefined,
              textShadow: textShadowVal,
              color: textColor,
              lineHeight: hasSecondButtonLine ? 1.02 : 1.06,
              overflowWrap: forceSizePx ? 'normal' : (compactSingleLine ? 'normal' : 'anywhere'),
              wordBreak: forceSizePx ? 'normal' : (compactSingleLine ? 'keep-all' : 'break-word'),
              whiteSpace: forceSizePx && !hasSecondButtonLine ? 'nowrap' : (compactSingleLine ? 'nowrap' : 'normal'),
              hyphens: forceSizePx ? 'manual' : (compactSingleLine ? 'manual' : 'auto'),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {hasSecondButtonLine ? (
              <>
                <span className="block max-w-full truncate">{buttonTextLines[0]}</span>
                <span className="block max-w-full truncate opacity-90" style={{ fontSize: `calc(${sizeStyle} * ${forceSizePx ? 0.72 : 0.72})`, fontWeight: 700 }}>
                  {buttonTextLines[1]}
                </span>
              </>
            ) : (
              buttonTextLines[0]
            )}
          </span>

          {effectiveIconPosition === 'right' && renderIconOrImage()}

          {effectiveIconPosition === 'bottom' && renderIconOrImage()}

        </div>
      </div>
    </div>
  );

  const containerClasses = `
    relative overflow-hidden cursor-pointer select-none flex flex-col justify-center items-center shadow-md transition-all duration-150
    ${isSquare ? 'aspect-square h-full' : ''}
    ${getRadiusClass()}
    ${getGlowStyles()}
    ${isSelected ? 'ring-2 ring-gold border-purple-500 scale-[1.05] shadow-[0_0_20px_rgba(201,166,70,0.6)]' : ''}
    ${mode === 'editor' && !isSortingMode ? 'hover:scale-[1.03] hover:ring-1 hover:ring-[#A855F7]/30' : ''}
    ${mode === 'public' ? 'hover:scale-[1.03] transition' : ''}
    ${extraClassName}
  `.trim();

  // If in designer mode, or preview, we do not require touch DnD event parameters
  const combinedProps = {
    className: containerClasses,
    style: inlineStyles,
    onClick: handleOnClick,
    ...dragProps,
  };

  return (
    <motion.div
      {...combinedProps}
      {...animateProp}
      whileTap={mode === 'public' ? { scale: 0.95 } : undefined}
    >
      {contentMarkup}

      {/* Lock Indicator overlay */}
      {btn.isProtected && (
        <span className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-lg z-30 shadow-md backdrop-blur-xxs border border-stone-800">
          <LucideIcons.Lock size={10} className="text-[#A855F7]" />
        </span>
      )}
    </motion.div>
  );
};
