/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardButton } from '../types';
import { KonuCardCore } from './KonuCardCore';

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
}

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

  return (
    <div ref={hostRef} className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
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
      </div>
    </div>
  );
};
