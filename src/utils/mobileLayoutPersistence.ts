/**
 * v52.5.32 Mobile Editor Public Size Writer Fix
 *
 * The editor preview can read local in-memory values immediately. The public
 * card, however, reads Firestore data. To prevent public views from falling
 * back to old defaults, persist the mobile layout in a canonical snapshot and
 * hydrate legacy cards from that snapshot before rendering.
 */
import { Card, ButtonGridLayout } from '../types';
import { normalizeUreelTextTemplate } from './textTemplates';
import { clampCardButtonSize, CARD_BUTTON_DEFAULT_SIZE } from './cardButtonSizePresets';

const num = (value: any, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value: any, min: number, max: number, fallback: number) => Math.max(min, Math.min(max, num(value, fallback)));

// v52.5.38: central mobile/public button scale. No local 56/100/112 clamps here.
const normalizeMobileButtonSize = (value: any) => clampCardButtonSize(value);

const isUreelCard = (card: Partial<Card> | undefined) => !!(card && (card.ureelTimeline || card.ureelScene || card.ureelEndCard));

export const deriveCanonicalButtonGridLayout = (
  card: Partial<Card> | undefined,
  options?: { preferLiveFields?: boolean }
): Required<ButtonGridLayout> => {
  const gl: any = card?.buttonGridLayout || {};
  const publicSnapshot: any = (card as any)?.publicLayoutSnapshot || {};
  const mobileSnapshot: any = (card as any)?.mobileLayout || {};
  const publicButtons: any = publicSnapshot.buttons || {};
  const mobileButtons: any = mobileSnapshot.buttons || {};
  // v52.5.27: Top-level/live layout fields must always win over snapshots.
  // Snapshots are fallbacks for legacy Public cards only. This prevents a stale
  // publicLayoutSnapshot from keeping buttons/text at old sizes after edits.
  const canonicalButtons: any = { ...publicButtons, ...mobileButtons, ...gl };

  const ureel = isUreelCard(card);
  // v52.5.32: when the editor/persist path provides live top-level values,
  // those values must win over stale mobile/public snapshots. Previously a
  // saved snapshot value (for example 58px) could override a fresh
  // buttonSizePx=88 update when no full buttonGridLayout object was present.
  const rawSize = options?.preferLiveFields
    ? (gl.buttonSizePx ?? gl.tileSizePx ?? (card as any)?.buttonSizePx ?? mobileButtons.buttonSizePx ?? mobileButtons.tileSizePx ?? publicButtons.buttonSizePx ?? publicButtons.tileSizePx ?? CARD_BUTTON_DEFAULT_SIZE)
    : (gl.buttonSizePx ?? gl.tileSizePx ?? mobileButtons.buttonSizePx ?? mobileButtons.tileSizePx ?? publicButtons.buttonSizePx ?? publicButtons.tileSizePx ?? (card as any)?.buttonSizePx ?? CARD_BUTTON_DEFAULT_SIZE);
  const rawGap = options?.preferLiveFields
    ? (gl.gapPx ?? gl.gap ?? (card as any)?.buttonGapPx ?? mobileButtons.gapPx ?? mobileButtons.gap ?? publicButtons.gapPx ?? publicButtons.gap ?? 10)
    : (gl.gapPx ?? gl.gap ?? mobileButtons.gapPx ?? mobileButtons.gap ?? publicButtons.gapPx ?? publicButtons.gap ?? (card as any)?.buttonGapPx ?? 10);
  const cols = clamp(canonicalButtons.cols ?? (card as any)?.buttonGridCols ?? 3, 1, 3, 3) as 1 | 2 | 3;
  const size = ureel ? normalizeMobileButtonSize(rawSize) : num(rawSize, CARD_BUTTON_DEFAULT_SIZE);
  const gap = ureel ? clamp(rawGap, 8, 36, 16) : num(rawGap, 12);
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

export const buildMobileLayoutSnapshot = (card: Partial<Card>, options?: { preferLiveFields?: boolean }) => {
  const grid = deriveCanonicalButtonGridLayout(card, options);
  const titleSize = clamp((card as any).heroTitleSize ?? (card as any).mobileLayout?.text?.titleSizePx, 10, 56, 24);
  const subtitleSize = clamp((card as any).heroSubtitleSize ?? (card as any).mobileLayout?.text?.subtitleSizePx, 8, 40, 14);
  const descriptionSize = clamp((card as any).heroDescriptionSize ?? (card as any).mobileLayout?.text?.descriptionSizePx, 8, 36, 12);
  const textHeightPercent = clamp((card as any).heroTextHeightPercent ?? (card as any).mobileLayout?.text?.heightPercent ?? (card as any).publicLayoutSnapshot?.text?.heightPercent, 24, 76, 44);
  return {
    version: 'v52.5.40',
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
      heightPercent: textHeightPercent,
      heroTextHeightPercent: textHeightPercent,
      templateId: (card.ureelTextTemplate as any)?.id || '',
      templateStyle: (card.ureelTextTemplate as any)?.style || '',
      boxEnabled: (card.ureelTextTemplate as any)?.box?.enabled !== false,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const persistMobileLayoutFields = <T extends Partial<Card>>(updates: T, base?: Partial<Card> | null): T => {
  const updateAny: any = updates || {};
  const baseAny: any = base || {};

  const freshButtonGridLayout = updateAny.buttonGridLayout
    ? { ...(updateAny.buttonGridLayout || {}) }
    : undefined;

  const merged: Partial<Card> = {
    ...(base || {}),
    ...(updates || {}),
    buttonGridLayout: freshButtonGridLayout
      ? freshButtonGridLayout as any
      : {
          ...(baseAny.buttonGridLayout || {}),
          ...(updateAny.buttonGridLayout || {}),
        } as any,
    ureelTextTemplate: updateAny.ureelTextTemplate
      ? normalizeUreelTextTemplate({ ...(baseAny.ureelTextTemplate || {}), ...(updateAny.ureelTextTemplate || {}) } as any) as any
      : baseAny.ureelTextTemplate,
  };

  // v52.5.27: when the editor sends a fresh buttonGridLayout update, build the
  // persisted grid snapshot from that fresh update path only. Older
  // mobileLayout/publicLayoutSnapshot values from base must not be mixed back in,
  // otherwise the Public card can fall back to stale/smaller button sizes.
  const gridSource: Partial<Card> = freshButtonGridLayout
    ? {
        ...(updates as any),
        buttonGridLayout: freshButtonGridLayout as any,
        buttonSizePx: updateAny.buttonSizePx ?? freshButtonGridLayout.buttonSizePx ?? freshButtonGridLayout.tileSizePx,
        buttonGapPx: updateAny.buttonGapPx ?? freshButtonGridLayout.gapPx ?? freshButtonGridLayout.gap,
      } as any
    : merged;

  const grid = deriveCanonicalButtonGridLayout(gridSource, { preferLiveFields: true });
  const snapshot = buildMobileLayoutSnapshot({ ...merged, buttonGridLayout: grid }, { preferLiveFields: true });
  return {
    ...(updates as any),
    buttonGridLayout: grid as any,
    buttonGridCols: grid.cols as any,
    buttonSizePx: grid.buttonSizePx as any,
    buttonGapPx: grid.gapPx as any,
    heroTitleSize: snapshot.text.heroTitleSize as any,
    heroSubtitleSize: snapshot.text.heroSubtitleSize as any,
    heroDescriptionSize: snapshot.text.heroDescriptionSize as any,
    heroTextHeightPercent: snapshot.text.heroTextHeightPercent as any,
    mobileLayout: {
      ...(baseAny.mobileLayout || {}),
      ...(updateAny.mobileLayout || {}),
      ...snapshot,
      version: 'v52.5.40',
    } as any,
    publicLayoutSnapshot: {
      ...snapshot,
      version: 'v52.5.40',
    } as any,
    ureelTextTemplate: updateAny.ureelTextTemplate
      ? normalizeUreelTextTemplate({ ...(baseAny.ureelTextTemplate || {}), ...(updateAny.ureelTextTemplate || {}) } as any) as any
      : updateAny.ureelTextTemplate,
  } as T;
};

export const hydrateCardMobileLayout = <T extends Partial<Card> | null | undefined>(card: T): T => {
  if (!card) return card;
  const grid = deriveCanonicalButtonGridLayout(card);
  const snapshot = buildMobileLayoutSnapshot({ ...card, buttonGridLayout: grid });
  const text: any = { ...((card as any).mobileLayout?.text || {}), ...((card as any).publicLayoutSnapshot?.text || {}) };
  const heroTitleSize = (card as any).heroTitleSize ?? text.heroTitleSize ?? text.titleSizePx;
  const heroSubtitleSize = (card as any).heroSubtitleSize ?? text.heroSubtitleSize ?? text.subtitleSizePx;
  const heroDescriptionSize = (card as any).heroDescriptionSize ?? text.heroDescriptionSize ?? text.descriptionSizePx;
  const heroTextHeightPercent = (card as any).heroTextHeightPercent ?? text.heroTextHeightPercent ?? text.heightPercent;
  return {
    ...(card as any),
    buttonGridLayout: grid,
    buttonGridCols: grid.cols as any,
    buttonSizePx: grid.buttonSizePx,
    buttonGapPx: grid.gapPx,
    // v52.5.27: explicit top-level editor values win over stale snapshots.
    // Snapshots remain fallback for old saved public cards.
    heroTitleSize,
    heroSubtitleSize,
    heroDescriptionSize,
    heroTextHeightPercent,
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
