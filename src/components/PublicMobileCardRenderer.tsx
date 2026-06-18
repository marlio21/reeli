/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, CardButton } from '../types';
import { KonuCardCore } from './KonuCardCore';

interface PublicMobileCardRendererProps {
  card: Card;
  lang: 'de' | 'en';
  onButtonClick?: (btn: CardButton) => void;
  onContactSave?: () => void;
  onShare?: () => void;
}

/**
 * Public mobile live renderer.
 *
 * This component is intentionally small: it keeps the public link on phones in
 * one predictable 9:16 card surface and avoids reusing desktop page columns or
 * editor chrome. The actual visual card still comes from KonuCardCore, so the
 * scene, text, buttons, end-card and replay logic stay centralized.
 */
export const PublicMobileCardRenderer: React.FC<PublicMobileCardRendererProps> = ({
  card,
  lang,
  onButtonClick,
  onContactSave,
  onShare,
}) => {
  const cardFrameStyle: React.CSSProperties = {
    width: 'min(100vw, calc(100svh * 9 / 16))',
    height: 'min(100svh, calc(100vw * 16 / 9))',
    maxWidth: '28rem',
    aspectRatio: '9 / 16',
  };

  return (
    <main className="min-h-[100svh] h-[100svh] w-screen overflow-hidden bg-black text-[#F5F2EA] flex items-center justify-center">
      <div
        className="relative overflow-hidden bg-black shadow-2xl"
        style={cardFrameStyle}
        aria-label="ureel mobile live card"
      >
        <KonuCardCore
          card={card}
          lang={lang}
          isPreview={false}
          handleButtonClick={onButtonClick}
          triggerVCardDownload={onContactSave}
          handleCtaClick={onShare}
          setShowShareModal={(show) => { if (show) onShare?.(); }}
        />
      </div>
    </main>
  );
};
