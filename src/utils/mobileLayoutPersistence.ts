/**
 * v52.5.19 Public Save Hydration & Layout Persistence Fix
 *
 * The editor preview can read local in-memory values immediately. The public
 * card, however, reads Firestore data. To prevent public views from falling
 * back to old defaults, persist the mobile layout in a canonical snapshot and
 * hydrate legacy cards from that snapshot before rendering.
 */
import { Card, ButtonGridLayout } from '../types';
import { normalizeUreelTextTemplate } from './textTemplates';

const num = (value: any, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value: any, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, num(value, fallback)));

const isUreelCard = (card: Partial<Card> | undefined) => !!(card && (card.ureelTimeline || card.ureelScene || card.ureelEndCard));

export const deriveCanonicalButtonGridLayout = (card: Partial<Card> | undefined): Required<ButtonGridLayout> => {
  const gl: any = card?.buttonGridLayout || {};
  const publicButtons: any = (card as any)?.publicLayoutSnapshot?.buttons || {};
  const mobileButtons: any = (card as any)?.mobileLayout?.buttons || {};
  // v52.5.24: public/mobile snapshots are the canonical persisted layout.
  // Legacy buttonGridLayout is only a fallback, otherwise stale top-level values
  // can keep public cards small even after the editor has saved a newer snapshot.
  const canonicalButtons: any = { ...gl, ...mobileButtons, ...publicButtons };
  const ureel = isUreelCard(card);
  const rawSize = canonicalButtons.buttonSizePx ?? canonicalButtons.tileSizePx ?? (card as any)?.buttonSizePx ?? 80;
  const rawGap = canonicalButtons.gapPx ?? canonicalButtons.gap ?? (card as any)?.buttonGapPx ?? 10;
  const cols = clamp(canonicalButtons.cols ?? (card as any)?.buttonGridCols ?? 3, 1, 3, 3) as 1 | 2 | 3;
  const size = ureel ? clamp(rawSize, 48, 112, 80) : num(rawSize, 80);
  const gap = ureel ? clamp(rawGap, 4, 18, 10) : num(rawGap, 12);
  return {
    mode: (canonicalButtons.mode || (ureel ? 'grid' : 'list')) as any,
    cols,
    square: canonicalButtons.square !== undefined ? !!canonicalButtons.square : ureel,
    gapPx: gap,
    buttonSizePx: size,
    gap,
    align: (canonicalButtons.align || 'center') as any,
  };
};

export const buildMobileLayoutSnapshot = (card: Partial<Card>) => {
  const grid = deriveCanonicalButtonGridLayout(card);
  const titleSize = clamp((card as any).heroTitleSize ?? (card as any).mobileLayout?.text?.titleSizePx, 16, 56, 30);
  const subtitleSize = clamp((card as any).heroSubtitleSize ?? (card as any).mobileLayout?.text?.subtitleSizePx, 10, 40, 14);
  const descriptionSize = clamp((card as any).heroDescriptionSize ?? (card as any).mobileLayout?.text?.descriptionSizePx, 10, 40, 22);
  return {
    version: 'v52.5.19',
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
  const grid = deriveCanonicalButtonGridLayout(merged);
  const snapshot = buildMobileLayoutSnapshot({ ...merged, buttonGridLayout: grid });
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
  const grid = deriveCanonicalButtonGridLayout(card);
  const snapshot = buildMobileLayoutSnapshot({ ...card, buttonGridLayout: grid });
  const text: any = { ...((card as any).mobileLayout?.text || {}), ...((card as any).publicLayoutSnapshot?.text || {}) };
  return {
    ...(card as any),
    buttonGridLayout: grid,
    buttonGridCols: grid.cols as any,
    buttonSizePx: grid.buttonSizePx,
    buttonGapPx: grid.gapPx,
    // Snapshot-first: the public/editor saved mobile layout is canonical.
    // Top-level legacy fields remain as fallback only.
    heroTitleSize: text.heroTitleSize ?? text.titleSizePx ?? (card as any).heroTitleSize,
    heroSubtitleSize: text.heroSubtitleSize ?? text.subtitleSizePx ?? (card as any).heroSubtitleSize,
    heroDescriptionSize: text.heroDescriptionSize ?? text.descriptionSizePx ?? (card as any).heroDescriptionSize,
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
