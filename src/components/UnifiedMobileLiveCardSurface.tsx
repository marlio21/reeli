/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardButton } from '../types';
import { KonuCardCore } from './KonuCardCore';
import { deriveCanonicalButtonGridLayout } from '../utils/mobileLayoutPersistence';

export const MOBILE_LIVE_CARD_WIDTH = 390;
export const MOBILE_LIVE_CARD_HEIGHT = 693;

interface UnifiedMobileLiveCardSurfaceProps {
  card: Card;
  lang: 'de' | 'en';
  isPreview?: boolean;
  cleanPreview?: boolean;
  previewFocus?: 'full' | 'background';
  hideActionButtons?: boolean;
  visualMode?: 'live' | 'final';
  timelineMode?: 'live' | 'final';
  className?: string;
  innerClassName?: string;
  onButtonClick?: (btn: CardButton) => void;
  onContactSave?: () => void;
  onShare?: () => void;
  onEditButton?: (btn: CardButton) => void;
  onEditText?: () => void;
  showLayoutDebug?: boolean;
  debugLabel?: string;
}

const readPath = (obj: any, path: string) => path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

const fmt = (value: any) => {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'number') return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : 'NaN';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

const MobileLayoutDebugInspector: React.FC<{
  card: Card;
  scale: number;
  isPreview: boolean;
  visualMode?: string;
  timelineMode?: string;
  label?: string;
}> = ({ card, scale, isPreview, visualMode, timelineMode, label }) => {
  const grid = React.useMemo(() => deriveCanonicalButtonGridLayout(card), [card]);
  const rows = [
    ['label', label || (isPreview ? 'editor-preview' : 'public')],
    ['cardId', (card as any).cardId || (card as any).id || '—'],
    ['slug', (card as any).slug || '—'],
    ['renderer', `${isPreview ? 'preview' : 'public'} / ${visualMode || '—'} / ${timelineMode || '—'}`],
    ['surfaceScale', scale],
    ['grid.buttonSizePx', readPath(card, 'buttonGridLayout.buttonSizePx')],
    ['canonical.buttonSizePx', grid.buttonSizePx],
    ['public.buttons.size', readPath(card, 'publicLayoutSnapshot.buttons.buttonSizePx')],
    ['mobile.buttons.size', readPath(card, 'mobileLayout.buttons.buttonSizePx')],
    ['top.buttonSizePx', (card as any).buttonSizePx],
    ['grid.gapPx', readPath(card, 'buttonGridLayout.gapPx')],
    ['heroTitleSize', (card as any).heroTitleSize],
    ['public.title', readPath(card, 'publicLayoutSnapshot.text.heroTitleSize') || readPath(card, 'publicLayoutSnapshot.text.titleSizePx')],
    ['mobile.title', readPath(card, 'mobileLayout.text.heroTitleSize') || readPath(card, 'mobileLayout.text.titleSizePx')],
    ['heroSubtitleSize', (card as any).heroSubtitleSize],
    ['heroDescriptionSize', (card as any).heroDescriptionSize],
    ['layoutVersion', readPath(card, 'publicLayoutSnapshot.version') || readPath(card, 'mobileLayout.version')],
    ['updatedAt', (card as any).updatedAt || readPath(card, 'publicLayoutSnapshot.updatedAt')],
  ];
  return (
    <div className="absolute left-2 bottom-2 z-[9999] max-w-[240px] rounded-xl border border-amber-300/70 bg-black/82 p-2 text-[8px] leading-tight text-amber-50 shadow-2xl backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-2 border-b border-amber-300/25 pb-1">
        <span className="font-black uppercase tracking-widest text-amber-200">Layout Debug</span>
        <span className="font-mono text-amber-100/70">v52.5.42</span>
      </div>
      <div className="grid grid-cols-[96px_1fr] gap-x-2 gap-y-0.5 font-mono">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <span className="truncate text-amber-200/70">{k}</span>
            <span className="truncate text-white">{fmt(v)}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * A single fixed 9:16 mobile live surface used by Public, Studio preview and
 * Desktop phone preview. KonuCardCore always lays out inside the same base
 * 390x693 coordinate space; outer previews only scale the whole surface.
 *
 * This avoids the old mismatch where the public card, side preview and editor
 * preview recomputed text/buttons at different CSS sizes.
 */
export const UnifiedMobileLiveCardSurface: React.FC<UnifiedMobileLiveCardSurfaceProps> = ({
  card,
  lang,
  isPreview = false,
  cleanPreview = false,
  previewFocus = 'full',
  hideActionButtons = false,
  visualMode = 'final',
  timelineMode = 'live',
  className = '',
  innerClassName = '',
  onButtonClick,
  onContactSave,
  onShare,
  onEditButton,
  onEditText,
  showLayoutDebug = false,
  debugLabel,
}) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const next = Math.min(rect.width / MOBILE_LIVE_CARD_WIDTH, rect.height / MOBILE_LIVE_CARD_HEIGHT);
      setScale(Math.max(0.1, next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const debugEnabled = showLayoutDebug && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugLayout') === 'force';

  const fallbackImage = (card as any).ureelScene?.backgroundImageUrl || (card as any).ureelScene?.posterUrl || (card as any).cardBackgroundImageUrl || (card as any).backgroundImageUrl || (card as any).ogImageUrl || '';

  return (
    <div ref={hostRef} className={`relative h-full w-full overflow-hidden bg-[#111] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(232,220,194,0.08),transparent_42%),linear-gradient(180deg,#151515,#050505)]" aria-hidden="true" />
      {fallbackImage && <img src={fallbackImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" loading="eager" decoding="async" referrerPolicy="no-referrer" />}
      <div
        className={`absolute left-1/2 top-1/2 overflow-hidden bg-black ${innerClassName}`}
        style={{
          width: MOBILE_LIVE_CARD_WIDTH,
          height: MOBILE_LIVE_CARD_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <KonuCardCore
          card={card}
          lang={lang}
          isPreview={isPreview}
          cleanPreview={cleanPreview}
          previewFocus={previewFocus}
          hideActionButtons={hideActionButtons}
          visualMode={visualMode}
          timelineMode={timelineMode}
          handleButtonClick={onButtonClick}
          triggerVCardDownload={onContactSave}
          handleCtaClick={onShare}
          setShowShareModal={(show) => { if (show) onShare?.(); }}
          onEditButton={onEditButton}
          onEditText={onEditText}
        />
        {debugEnabled && (
          <MobileLayoutDebugInspector
            card={card}
            scale={scale}
            isPreview={isPreview}
            visualMode={visualMode}
            timelineMode={timelineMode}
            label={debugLabel}
          />
        )}
      </div>
    </div>
  );
};
