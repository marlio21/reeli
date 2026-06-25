/**
 * v52.5.20 Public Sync Debug & Hard Publish Fix
 *
 * The editor preview can read local in-memory values immediately. The public
 * card reads Firestore data. This utility now treats the persisted public
 * snapshot as the canonical public/mobile layout source and writes a small
 * debug payload so we can verify which values reached the public card.
 */
import { Card, ButtonGridLayout } from '../types';
import { normalizeUreelTextTemplate } from './textTemplates';

const num = (value: any, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value: any, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, num(value, fallback)));

const isUreelCard = (card: Partial<Card> | undefined) => !!(card && (card.ureelTimeline || card.ureelScene || card.ureelEndCard));

export const deriveCanonicalButtonGridLayout = (card: Partial<Card> | undefined, preferSnapshot = true): Required<ButtonGridLayout> => {
  const gl: any = card?.buttonGridLayout || {};
  // v52.5.20: public hydration prefers the persisted snapshot, while editor
  // persistence must prefer the user's current unsaved/grid update.
  const snapshotButtons: any = (card as any)?.publicLayoutSnapshot?.buttons || (card as any)?.mobileLayout?.buttons || {};
  const mobileButtons: any = preferSnapshot ? snapshotButtons : {};
  const ureel = isUreelCard(card);
  const rawSize = mobileButtons.buttonSizePx ?? mobileButtons.tileSizePx ?? gl.buttonSizePx ?? (card as any)?.buttonSizePx ?? snapshotButtons.buttonSizePx ?? snapshotButtons.tileSizePx ?? 72;
  const rawGap = mobileButtons.gapPx ?? mobileButtons.gap ?? gl.gapPx ?? gl.gap ?? (card as any)?.buttonGapPx ?? snapshotButtons.gapPx ?? snapshotButtons.gap ?? 10;
  const cols = clamp(mobileButtons.cols ?? gl.cols ?? (card as any)?.buttonGridCols ?? snapshotButtons.cols ?? 3, 1, 3, 3) as 1 | 2 | 3;
  const size = ureel ? clamp(rawSize, 48, 112, 72) : num(rawSize, 72);
  const gap = ureel ? clamp(rawGap, 4, 18, 10) : num(rawGap, 12);
  return {
    mode: (mobileButtons.mode || gl.mode || snapshotButtons.mode || (ureel ? 'grid' : 'list')) as any,
    cols,
    square: mobileButtons.square !== undefined ? !!mobileButtons.square : (gl.square !== undefined ? !!gl.square : (snapshotButtons.square !== undefined ? !!snapshotButtons.square : ureel)),
    gapPx: gap,
    buttonSizePx: size,
    gap,
    align: (mobileButtons.align || gl.align || snapshotButtons.align || 'center') as any,
  };
};

export const buildMobileLayoutSnapshot = (card: Partial<Card>, preferSnapshot = true) => {
  const grid = deriveCanonicalButtonGridLayout(card, preferSnapshot);
  const titleSize = clamp((card as any).heroTitleSize ?? (card as any).mobileLayout?.text?.titleSizePx, 16, 56, 30);
  const subtitleSize = clamp((card as any).heroSubtitleSize ?? (card as any).mobileLayout?.text?.subtitleSizePx, 10, 40, 14);
  const descriptionSize = clamp((card as any).heroDescriptionSize ?? (card as any).mobileLayout?.text?.descriptionSizePx, 10, 40, 22);
  return {
    version: 'v52.5.20',
    buttons: {
      mode: grid.mode,
      cols: grid.cols,
      square: grid.square,
      align: grid.align,
      buttonSizePx: grid.buttonSizePx,
      tileSizePx: grid.buttonSizePx,
      gapPx: grid.gapPx,
      gap: grid.gap,
    },
    text: {
      titleSizePx: titleSize,
      subtitleSizePx: subtitleSize,
      descriptionSizePx: descriptionSize,
      heroTitleSize: titleSize,
      heroSubtitleSize: subtitleSize,
      heroDescriptionSize: descriptionSize,
      templateId: (card.ureelTextTemplate as any)?.id || '',
      templateStyle: (card.ureelTextTemplate as any)?.style || '',
      boxEnabled: (card.ureelTextTemplate as any)?.box?.enabled !== false,
    },
    debug: {
      source: 'mobile-layout-persistence',
      buttonSizePx: grid.buttonSizePx,
      gapPx: grid.gapPx,
      titleSizePx: titleSize,
      subtitleSizePx: subtitleSize,
      descriptionSizePx: descriptionSize,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const persistMobileLayoutFields = <T extends Partial<Card>>(updates: T, base?: Partial<Card> | null): T => {
  const merged: Partial<Card> = {
    ...(base || {}),
    ...(updates || {}),
    buttonGridLayout: {
      ...((base as any)?.buttonGridLayout || {}),
      ...((updates as any)?.buttonGridLayout || {}),
    } as any,
    ureelTextTemplate: (updates as any)?.ureelTextTemplate
      ? normalizeUreelTextTemplate({ ...((base as any)?.ureelTextTemplate || {}), ...((updates as any).ureelTextTemplate || {}) } as any) as any
      : (base as any)?.ureelTextTemplate,
  };
  // During persistence, explicit editor updates must beat older snapshots.
  const grid = deriveCanonicalButtonGridLayout(merged, false);
  const snapshot = buildMobileLayoutSnapshot({ ...merged, buttonGridLayout: grid }, false);
  return {
    ...(updates as any),
    buttonGridLayout: grid as any,
    buttonGridCols: grid.cols as any,
    buttonSizePx: grid.buttonSizePx as any,
    buttonGapPx: grid.gapPx as any,
    mobileLayout: {
      ...((base as any)?.mobileLayout || {}),
      ...((updates as any)?.mobileLayout || {}),
      ...snapshot,
    } as any,
    publicLayoutSnapshot: snapshot as any,
    ureelTextTemplate: (updates as any)?.ureelTextTemplate
      ? normalizeUreelTextTemplate({ ...((base as any)?.ureelTextTemplate || {}), ...((updates as any).ureelTextTemplate || {}) } as any) as any
      : (updates as any)?.ureelTextTemplate,
  } as T;
};

export const hydrateCardMobileLayout = <T extends Partial<Card> | null | undefined>(card: T): T => {
  if (!card) return card;
  const grid = deriveCanonicalButtonGridLayout(card, true);
  const snapshot = buildMobileLayoutSnapshot({ ...card, buttonGridLayout: grid }, true);
  // v52.5.20: public snapshot wins over stale legacy hero*Size fields.
  const text: any = (card as any).publicLayoutSnapshot?.text || (card as any).mobileLayout?.text || {};
  const hydratedTitleSize = text.heroTitleSize ?? text.titleSizePx ?? (card as any).heroTitleSize;
  const hydratedSubtitleSize = text.heroSubtitleSize ?? text.subtitleSizePx ?? (card as any).heroSubtitleSize;
  const hydratedDescriptionSize = text.heroDescriptionSize ?? text.descriptionSizePx ?? (card as any).heroDescriptionSize;
  return {
    ...(card as any),
    buttonGridLayout: grid,
    buttonGridCols: grid.cols as any,
    buttonSizePx: grid.buttonSizePx,
    buttonGapPx: grid.gapPx,
    heroTitleSize: hydratedTitleSize,
    heroSubtitleSize: hydratedSubtitleSize,
    heroDescriptionSize: hydratedDescriptionSize,
    mobileLayout: {
      ...((card as any).mobileLayout || {}),
      ...snapshot,
    },
    publicLayoutSnapshot: {
      ...((card as any).publicLayoutSnapshot || {}),
      ...snapshot,
    },
    ureelTextTemplate: normalizeUreelTextTemplate((card as any).ureelTextTemplate || undefined) as any,
  } as T;
};
