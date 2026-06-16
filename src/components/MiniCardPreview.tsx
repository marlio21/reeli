/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton } from '../types';
import { KonuCardCore } from './KonuCardCore';
import { parseVideoUrl } from '../utils/video';

interface MiniCardPreviewProps {
  card: Partial<Card>;
  lang?: 'de' | 'en';
  highlightArea?: 'hero' | 'background';
  videoBackgroundPreviewState?: 'start' | 'reveal' | 'fully_visible' | 'final' | 'autoplay';
}

export const MiniCardPreview: React.FC<MiniCardPreviewProps> = ({
  card,
  lang = 'de',
  highlightArea,
  videoBackgroundPreviewState,
}) => {
  const isDe = lang === 'de';
  const containerRef = useRef<HTMLDivElement>(null);
  const cardOuterRef = useRef<HTMLDivElement>(null);
  
  const [parentWidth, setParentWidth] = useState(320);
  const [parentHeight, setParentHeight] = useState(500);
  const [baseH, setBaseH] = useState(750);

  // Monitor size of parent container
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (containerRef.current) {
        setParentWidth(containerRef.current.clientWidth || 320);
        setParentHeight(containerRef.current.clientHeight || 500);
      }
    };

    handleResize();
    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Monitor the genuine rendered height of the card
  useEffect(() => {
    if (!cardOuterRef.current) return;

    const handleCardResize = () => {
      if (cardOuterRef.current) {
        setBaseH(cardOuterRef.current.offsetHeight || 750);
      }
    };

    handleCardResize();
    const observer = new ResizeObserver(() => {
      handleCardResize();
    });
    observer.observe(cardOuterRef.current);

    return () => {
      observer.disconnect();
    };
  }, [card]);

  // Desktop: force preview to be at most 94% height to leave perfect frame/spacing
  // Mobile: screen physical size is already constrained, so we use 94% height limit
  const isMobile = window.innerWidth < 768;
  const maxHeightMultiplier = 0.94;
  const maxAllowedHeight = parentHeight * maxHeightMultiplier;

  // Compute final scaling factor to fit card inside parent width & height
  const scaleX = (parentWidth * 0.92) / 390; // safely add tiny horizontal margins
  const scaleY = maxAllowedHeight / baseH;
  const scale = Math.min(scaleX, scaleY, 1);

  // Center horizontally & vertically inside the viewport boundaries
  const topOffset = Math.max(0, (parentHeight - (baseH * scale)) / 2);

  // Video attributes
  const isHeroBackgroundEnabled = card.heroBackgroundEnabled !== false;
  const heroBackgroundType = card.heroBackgroundType || 'color';
  const heroVideoUrl = card.heroVideoUrl || '';
  const isVideoActive = isHeroBackgroundEnabled && heroBackgroundType === 'video' && heroVideoUrl;

  const currentSize = card.heroSize || card.heroHeight || 'medium';
  let heroSizeHeight = 320;
  if (currentSize === 'small') heroSizeHeight = 220;
  if (currentSize === 'large') heroSizeHeight = 440;

  // Video source helper
  const getVideoSourceLabel = (url: string) => {
    if (!url) return '';
    try {
      const parsed = parseVideoUrl(url);
      if (parsed.type === 'youtube') return 'YouTube Video';
      if (parsed.type === 'vimeo') return 'Vimeo Video';
      if (parsed.type === 'direct') return isDe ? 'Direkt-Videodatei' : 'Direct Video File';
    } catch (_) {}
    return isDe ? 'Video-Quelle' : 'Video Source';
  };

  // Build resolved fully loaded card structure
  const defaultButtons: CardButton[] = [
    { id: 'sb-1', title: isDe ? '📍 Adresse & Kontakt' : '📍 Location & Contact', actionType: 'address', isProtected: false, actionValue: '', radius: 'rounded' },
    { id: 'sb-2', title: isDe ? '📞 Jetzt Anrufen' : '📞 Call Now', actionType: 'phone', isProtected: false, actionValue: '', radius: 'rounded' },
    { id: 'sb-3', title: isDe ? '💼 Portfolio' : '💼 Portfolio', actionType: 'link', isProtected: false, actionValue: '', radius: 'rounded' }
  ] as CardButton[];

  const resolvedCard: Card = {
    plan: 'business',
    ...card,
    // Safely resolve Profile Hero Sizes from fallback fields
    heroSize: card.heroSize || card.heroHeight || card.productHeroSize || card.heroBackgroundSize || 'medium',
    heroHeight: card.heroSize || card.heroHeight || card.productHeroSize || card.heroBackgroundSize || 'medium',
    productHeroSize: card.heroSize || card.heroHeight || card.productHeroSize || card.heroBackgroundSize || 'medium',
    heroBackgroundSize: card.heroSize || card.heroHeight || card.productHeroSize || card.heroBackgroundSize || 'medium',
    
    // Safely resolve Profile Hero Background types
    heroBackgroundType: card.heroBackgroundType || card.productMediaType || 'color',
    productMediaType: card.heroBackgroundType || card.productMediaType || 'color',

    // Profile and cover configurations (Hero-only)
    heroProfileImageUrl: card.heroProfileImageUrl || card.profileImageUrl || '',
    profileImageUrl: card.heroProfileImageUrl || card.profileImageUrl || '',
    
    heroImageUrl: card.heroImageUrl || card.coverImageUrl || '',
    coverImageUrl: card.heroImageUrl || card.coverImageUrl || '',

    heroVideoUrl: card.heroVideoUrl || card.productVideoUrl || '',
    productVideoUrl: card.heroVideoUrl || card.productVideoUrl || '',

    // Hero repositioning/zoom modes
    heroImagePosition: card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center',
    heroMediaPosition: card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center',
    coverImagePosition: card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center',
    productMediaPosition: card.heroImagePosition || card.heroMediaPosition || card.coverImagePosition || card.productMediaPosition || 'center',

    heroImageMode: card.heroImageMode || 'cover',

    // Overall Card general background remains standard and isolated as passed inside card
    cardBackgroundEnabled: card.cardBackgroundEnabled,
    cardBackgroundImageUrl: card.cardBackgroundImageUrl || card.backgroundImageUrl || '',
    cardBackgroundMode: card.cardBackgroundMode || card.backgroundImageFit || 'cover',
    cardBackgroundDarken: card.cardBackgroundDarken,
    cardBackgroundSaturation: card.cardBackgroundSaturation,
    cardBackgroundOffsetX: card.cardBackgroundOffsetX,
    cardBackgroundOffsetY: card.cardBackgroundOffsetY,
    cardBackgroundColor: card.cardBackgroundColor || card.backgroundColor || '',
    cardBackgroundGradientEnabled: card.cardBackgroundGradientEnabled,
    cardBackgroundGradientColor: card.cardBackgroundGradientColor,
    cardBackgroundGradientDirection: card.cardBackgroundGradientDirection,

    // Filter active items and supply defaults if empty block
    buttons: (card.buttons && card.buttons.length > 0)
      ? card.buttons.filter(b => b.isActive !== false)
      : defaultButtons,
  } as Card;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-0 flex flex-col items-center justify-center overflow-hidden select-none relative pointer-events-none"
    >
      
      {/* Scope Label Banner */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-full py-1 px-3 flex items-center gap-1.5 shadow-xl">
        <LucideIcons.Tv size={11} className="text-[#A855F7] animate-pulse" />
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A855F7]">
          {isDe ? 'Echte Vorschau' : 'Real Preview'}
        </span>
        <span className="text-stone-500 font-bold text-[9px]">•</span>
        <span className="text-stone-300 font-bold text-[9px] uppercase">
          {highlightArea === 'hero' ? (isDe ? 'BILD- & MEDIENBEREICH' : 'Hero & Media') : (isDe ? 'HINTERGRUND' : 'Background')}
        </span>
      </div>

      {/* Scaled viewport shell - absolutely centered inside parent boundaries */}
      <div 
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: '390px', // Perfect smartphone render width matching CSS media metrics
          height: `${baseH}px`,
          position: 'absolute',
          top: `${topOffset}px`,
          left: '50%',
          marginLeft: '-195px', // Perfectly centers custom absolute card container
        }}
        className="shrink-0 transition-transform duration-100 ease-out"
      >
        
        {/* Physical phone device frame around the real card */}
        <div 
          ref={cardOuterRef}
          className={`relative w-full rounded-[40px] border-[5px] border-stone-800 bg-stone-950 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
            highlightArea === 'background' ? 'ring-4 ring-[#A855F7]/40' : ''
          }`}
        >
          
          {/* Main layout card wrapper */}
          <div className="relative w-full h-auto">
            
            {/* RENDER GENUINE LIVE CARD LAYOUT */}
            <KonuCardCore 
              card={resolvedCard}
              lang={lang}
              isPreview={false}
              isMiniPreview={true}
              videoBackgroundPreviewState={videoBackgroundPreviewState}
            />

          </div>

          {/* Device bar bottom decor */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-stone-800 rounded-full z-20 pointer-events-none" />

        </div>

      </div>

    </div>
  );
};
