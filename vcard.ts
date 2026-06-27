import { Card } from '../types';

const num = (value: any, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const HERO_TEXT_Y_MIN = 4;
export const HERO_TEXT_Y_MAX = 88;
export const HERO_TEXT_Y_DEFAULT = 44;

export const clampHeroTextY = (value: any, fallback = HERO_TEXT_Y_DEFAULT) => {
  const n = num(value, fallback);
  return Math.max(HERO_TEXT_Y_MIN, Math.min(HERO_TEXT_Y_MAX, n));
};

/**
 * v52.5.60: canonical vertical Werbetext position.
 * Top-level live fields win. Snapshots are fallbacks for hydrated/public cards.
 */
export const getHeroTextY = (card: Partial<Card> | null | undefined, fallback = HERO_TEXT_Y_DEFAULT): number => {
  const anyCard: any = card || {};
  const mobileText = anyCard.mobileLayout?.text || {};
  const publicText = anyCard.publicLayoutSnapshot?.text || {};
  return clampHeroTextY(
    anyCard.heroTextTopPercent ??
    anyCard.heroTextHeightPercent ??
    mobileText.heroTextTopPercent ??
    mobileText.topPercent ??
    mobileText.heroTextHeightPercent ??
    mobileText.heightPercent ??
    publicText.heroTextTopPercent ??
    publicText.topPercent ??
    publicText.heroTextHeightPercent ??
    publicText.heightPercent,
    fallback
  );
};

export const buildHeroTextYPatch = <T extends Partial<Card>>(card: T | null | undefined, value: any): Partial<Card> => {
  const next = clampHeroTextY(value);
  const anyCard: any = card || {};
  return {
    heroTextTopPercent: next as any,
    heroTextHeightPercent: next as any,
    mobileLayout: {
      ...(anyCard.mobileLayout || {}),
      text: {
        ...(anyCard.mobileLayout?.text || {}),
        topPercent: next,
        heightPercent: next,
        heroTextTopPercent: next,
        heroTextHeightPercent: next,
      },
    } as any,
    publicLayoutSnapshot: {
      ...(anyCard.publicLayoutSnapshot || {}),
      text: {
        ...(anyCard.publicLayoutSnapshot?.text || {}),
        topPercent: next,
        heightPercent: next,
        heroTextTopPercent: next,
        heroTextHeightPercent: next,
      },
    } as any,
  };
};
