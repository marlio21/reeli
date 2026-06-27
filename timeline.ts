/**
 * v52.5.38: one canonical mobile/public button size scale.
 * These values are the only card-tile sizes used by editor preview, monitor,
 * persistence snapshots and the public renderer.
 */
export type CardButtonSizePreset = 'compact' | 'standard' | 'large';

export const CARD_BUTTON_SIZE_PRESETS: Record<CardButtonSizePreset, number> = {
  compact: 60,
  standard: 90,
  large: 110,
};

export const CARD_BUTTON_GAP_PRESETS: Record<CardButtonSizePreset, number> = {
  compact: 8,
  standard: 7,
  large: 6,
};

export const CARD_BUTTON_FONT_PRESETS: Record<CardButtonSizePreset, number> = {
  compact: 9.0,
  standard: 10.5,
  large: 11.2,
};

export const CARD_BUTTON_ICON_PRESETS: Record<CardButtonSizePreset, number> = {
  compact: 20,
  standard: 28,
  large: 34,
};

export const CARD_BUTTON_SCALE_PRESETS: Record<CardButtonSizePreset, number> = {
  compact: 0.74,
  standard: 0.86,
  large: 0.94,
};

export const CARD_BUTTON_MIN_SIZE = CARD_BUTTON_SIZE_PRESETS.compact;
export const CARD_BUTTON_DEFAULT_SIZE = CARD_BUTTON_SIZE_PRESETS.standard;
export const CARD_BUTTON_MAX_SIZE = CARD_BUTTON_SIZE_PRESETS.large;

export const clampCardButtonSize = (value: any): number => {
  const n = Number(value);
  const raw = Number.isFinite(n) ? n : CARD_BUTTON_DEFAULT_SIZE;
  return Math.max(CARD_BUTTON_MIN_SIZE, Math.min(raw, CARD_BUTTON_MAX_SIZE));
};

export const getCardButtonSizePresetValue = (preset: CardButtonSizePreset): number => CARD_BUTTON_SIZE_PRESETS[preset];

export const getNearestCardButtonSizePreset = (value: any): CardButtonSizePreset => {
  const size = clampCardButtonSize(value);
  const entries = Object.entries(CARD_BUTTON_SIZE_PRESETS) as Array<[CardButtonSizePreset, number]>;
  return entries.reduce((best, item) => Math.abs(item[1] - size) < Math.abs(best[1] - size) ? item : best, entries[1])[0];
};
