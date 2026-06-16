/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card } from '../../types';

interface HeroBackgroundTabProps {
  draft: any;
  updateDraft: (fields: Partial<Card>) => void;
  isUploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'heroImageUrl' | 'heroProfileImageUrl') => Promise<void>;
  lang?: 'de' | 'en';
}

const COLOR_PRESETS = [
  { name: 'Slate', value: '#121212' },
  { name: 'Charcoal', value: '#1C1917' },
  { name: 'Burgundy', value: '#1C0D0D' },
  { name: 'Navy', value: '#0F172A' },
  { name: 'Forest', value: '#022C22' },
  { name: 'Schokobraun', value: '#1C160E' },
];

export const HeroBackgroundTab: React.FC<HeroBackgroundTabProps> = ({
  draft,
  updateDraft,
  isUploading,
  handleFileUpload,
  lang = 'de',
}) => {
  const isBgEnabled = draft.heroBackgroundEnabled !== false;
  const isImageActive = draft.heroBackgroundType === 'image';
  const isVideoActive = draft.heroBackgroundType === 'video';
  const isColorActive = draft.heroBackgroundType === 'color' || !draft.heroBackgroundType;

  // Resolve sizes
  const currentSize = draft.heroSize || 'medium';

  const t = {
    bgToggle: lang === 'de' ? 'Profilhintergrund aktivieren' : 'Enable profile background',
    sectionSize: lang === 'de' ? 'Profilbereich-Größe' : 'Profile section size',
    small: lang === 'de' ? 'Klein' : 'Small',
    medium: lang === 'de' ? 'Mittel' : 'Medium',
    large: lang === 'de' ? 'Groß' : 'Large',
    bgMode: lang === 'de' ? 'Hintergrund-Modus' : 'Background Mode',
    color: lang === 'de' ? 'Farbfläche' : 'Color background',
    image: lang === 'de' ? 'Hintergrund Bild hochladen' : 'Upload background image',
    video: lang === 'de' ? 'Video' : 'Video',
    bgColorField: lang === 'de' ? 'Hintergrundfarbe' : 'Background color',
    gradientField: lang === 'de' ? 'Verlauf' : 'Gradient',
    secondColorField: lang === 'de' ? 'Zweite Farbe' : 'Second color',
    directionField: lang === 'de' ? 'Richtung' : 'Direction',
    dirBottom: lang === 'de' ? 'Oben nach unten' : 'Top to bottom',
    dirRight: lang === 'de' ? 'Links nach rechts' : 'Left to right',
    dirDiag: lang === 'de' ? 'Diagonal' : 'Diagonal',
    uploadBtn: lang === 'de' ? 'Hintergrundbild hochladen' : 'Upload background image',
    removeBtn: lang === 'de' ? 'Hintergrundbild entfernen' : 'Remove background image',
    videoLink: lang === 'de' ? 'Videolink' : 'Video link',
    removeVideoBtn: lang === 'de' ? 'Video entfernen' : 'Remove video',
    videoFormat: lang === 'de' ? 'Videoformat' : 'Video format',
    auto: lang === 'de' ? 'Automatisch' : 'Auto',
    portrait: lang === 'de' ? 'Hochformat' : 'Portrait',
    landscape: lang === 'de' ? 'Querformat 16:9' : 'Landscape 16:9',
    portraitWarning: lang === 'de' ? 'Für Hochformat-Videos empfehlen wir Größe Groß.' : 'For portrait videos, we recommend Large.',
    landscapeWarning: lang === 'de' ? 'Für 16:9 Videos empfehlen wir Größe Klein.' : 'For 16:9 videos, we recommend Small.',
    saturation: lang === 'de' ? 'Sättigung' : 'Saturation',
    darken: lang === 'de' ? 'Abdunkeln' : 'Darken',
  };

  return (
    <div className="space-y-5 select-none text-cream" id="hero-bg-tab-container">
      {/* 1. ENABLE/DISABLE PROFILE HERO BACKGROUND */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 flex items-center justify-between" id="bg-enable-toggle">
        <div className="space-y-0.5">
          <span className="text-xs font-black uppercase tracking-wider text-[#A855F7] block">
            {t.bgToggle}
          </span>
          <span className="text-[10px] text-stone-400">
            {lang === 'de' ? 'Deaktivierte Hintergründe nutzen ein sattes Standard-Grau' : 'Deactivated backgrounds use standard rich charcoal'}
          </span>
        </div>
        <button
          type="button"
          id="btn-bg-toggle"
          onClick={() => updateDraft({ heroBackgroundEnabled: !isBgEnabled })}
          className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
            isBgEnabled ? 'bg-[#A855F7]' : 'bg-stone-700'
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-stone-900 transition-transform duration-200 ${
            isBgEnabled ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* 2. PROFILE SECTION SIZES */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4" id="section-size-selector">
        <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
          {t.sectionSize}
        </span>
        <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
          {(['small', 'medium', 'large'] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => updateDraft({ heroSize: sz as any, heroHeight: sz })}
              className={`text-[9.5px] py-2 font-bold rounded uppercase transition ${
                currentSize === sz ? 'bg-[#A855F7] text-stone-950 shadow-md font-black' : 'text-stone-400 hover:text-white'
              }`}
            >
              {sz === 'small' ? t.small : sz === 'medium' ? t.medium : t.large}
            </button>
          ))}
        </div>
      </div>

      {/* ALL SUBSEQUENT FIELDS REQUIRE BG ENABLED */}
      <div className={`space-y-5 transition-opacity duration-200 ${isBgEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        
        {/* Background Mode Switcher */}
        <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
          <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
            {t.bgMode}
          </span>
          <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
            {(['color', 'image', 'video'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateDraft({ heroBackgroundType: mode })}
                className={`text-[9.5px] py-1.5 font-bold rounded uppercase transition truncate px-1 ${
                  draft.heroBackgroundType === mode ? 'bg-[#A855F7] text-stone-950 shadow-md font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                {mode === 'color' ? t.color : mode === 'image' ? (lang === 'de' ? 'Hintergrundbild' : 'Background image') : t.video}
              </button>
            ))}
          </div>
        </div>

        {/* MODE 1: COLOR / GRADIENT BACKDROP */}
        {isColorActive && (
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block" id="color-title">
              {t.bgColorField}
            </span>

            {/* Presets */}
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((p) => {
                const active = draft.heroBgColor === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateDraft({ heroBgColor: p.value })}
                    className={`h-8 rounded-lg border relative transition ${active ? 'border-[#A855F7] scale-[1.05] shadow-[0_0_10px_rgba(201,166,70,0.3)]' : 'border-stone-800 hover:border-stone-700'}`}
                    style={{ background: p.value }}
                  >
                    {active && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <LucideIcons.Check size={11} className="text-[#A855F7]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Selection Picker */}
            <div className="flex items-center gap-1.5 bg-stone-850 border border-stone-750 rounded-lg p-1.5 pt-2">
              <input
                type="color"
                value={draft.heroBgColor?.startsWith('#') ? draft.heroBgColor : '#121212'}
                onChange={(e) => updateDraft({ heroBgColor: e.target.value })}
                className="w-7 h-7 rounded-md cursor-pointer bg-transparent border-0 flex-shrink-0"
              />
              <span className="text-xs font-mono text-stone-300">
                {draft.heroBgColor || '#121212'}
              </span>
            </div>

            {/* Gradient options */}
            <div className="border-t border-stone-850/60 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] text-stone-300 font-mono uppercase tracking-wider">
                  {t.gradientField}
                </span>
                <button
                  type="button"
                  onClick={() => updateDraft({ heroGradientEnabled: !draft.heroGradientEnabled })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    draft.heroGradientEnabled ? 'bg-[#A855F7]' : 'bg-stone-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-stone-900 transition-transform duration-200 ${
                    draft.heroGradientEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {draft.heroGradientEnabled && (
                <div className="space-y-3 pt-2">
                  {/* Second Gradient Color */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                      {t.secondColorField}
                    </label>
                    <div className="flex items-center gap-1.5 bg-stone-850 border border-stone-750 rounded-lg p-1.5">
                      <input
                        type="color"
                        value={draft.heroGradientColor?.startsWith('#') ? draft.heroGradientColor : '#A855F7'}
                        onChange={(e) => updateDraft({ heroGradientColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-stone-300">
                        {draft.heroGradientColor || '#A855F7'}
                      </span>
                    </div>
                  </div>

                  {/* Gradient Direction */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                      {t.directionField}
                    </label>
                    <select
                      value={draft.heroGradientDirection || 'to bottom'}
                      onChange={(e) => updateDraft({ heroGradientDirection: e.target.value })}
                      className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#A855F7]"
                    >
                      <option value="to bottom">{t.dirBottom}</option>
                      <option value="to right">{t.dirRight}</option>
                      <option value="to bottom right">{t.dirDiag}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: IMAGE BACKDROP */}
        {isImageActive && (
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7]">
              {t.image}
            </span>

            {/* Upload panel */}
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] text-center relative group">
              {draft.heroImageUrl ? (
                <div className="w-full flex flex-col gap-3">
                  <div className="w-full flex items-center justify-between p-2.5 bg-stone-950/40 rounded-xl border border-stone-850">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={draft.heroImageUrl} className="w-12 h-12 rounded-lg object-cover bg-stone-950 border border-stone-850 shrink-0" alt="" />
                      <span className="text-[11px] text-stone-300 font-mono truncate max-w-[145px] md:max-w-[210px]">{t.image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateDraft({ heroImageUrl: '' })}
                      className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition cursor-pointer"
                      title={t.removeBtn}
                    >
                      <LucideIcons.Trash2 size={15} />
                    </button>
                  </div>

                  {/* Redundant trash text button under image block as requested */}
                  <button
                    type="button"
                    onClick={() => updateDraft({ heroImageUrl: '' })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 rounded-lg transition"
                  >
                    <LucideIcons.Trash2 size={13} />
                    <span>{t.removeBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="relative flex flex-col items-center justify-center w-full min-h-[100px] cursor-pointer">
                  <input
                    id="hero-bg-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'heroImageUrl')}
                    disabled={isUploading !== null}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <LucideIcons.UploadCloud className="text-[#A855F7]/85 mb-1.5" size={24} />
                  <span className="text-xs font-black text-stone-200">
                    {isUploading === 'heroImageUrl' ? (lang === 'de' ? 'Wird hochgeladen...' : 'Uploading...') : t.uploadBtn}
                  </span>
                  <span className="text-[9px] text-stone-500 mt-1 max-w-[240px]">
                    {lang === 'de' ? 'Empfohlen: Premium Querformat (PNG/JPG)' : 'Recommended: premium landscapes (PNG/JPG)'}
                  </span>
                </div>
              )}
            </div>

            {/* Bildanpassungen (nur wenn Bild vorhanden) */}
            {draft.heroImageUrl && (
              <div className="border-t border-stone-850/60 pt-4 space-y-4">
                <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7]/80 block">
                  {lang === 'de' ? 'Bild-Anpassung' : 'Image Adjustments'}
                </span>

                {/* Grid for Image Mode and Position */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Image Mode */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                      {lang === 'de' ? 'Bildmodus' : 'Image mode'}
                    </label>
                    <select
                      value={draft.heroImageMode || 'cover'}
                      onChange={(e) => updateDraft({ heroImageMode: e.target.value as any })}
                      className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#A855F7]"
                    >
                      <option value="cover">{lang === 'de' ? 'Füllend' : 'Cover'}</option>
                      <option value="contain">{lang === 'de' ? 'Eingepasst' : 'Contain'}</option>
                    </select>
                  </div>

                  {/* Image Position */}
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                      {lang === 'de' ? 'Bildposition' : 'Image position'}
                    </label>
                    <select
                      value={draft.heroImagePosition || 'center'}
                      onChange={(e) => updateDraft({ heroImagePosition: e.target.value })}
                      className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#A855F7]"
                    >
                      <option value="center">{lang === 'de' ? 'Mitte' : 'Center'}</option>
                      <option value="top">{lang === 'de' ? 'Oben' : 'Top'}</option>
                      <option value="bottom">{lang === 'de' ? 'Unten' : 'Bottom'}</option>
                      <option value="left">{lang === 'de' ? 'Links' : 'Left'}</option>
                      <option value="right">{lang === 'de' ? 'Rechts' : 'Right'}</option>
                    </select>
                  </div>
                </div>

                {/* Custom Sliders for Offset X / Y */}
                <div className="space-y-4 pt-2">
                  {/* X Offset */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                      <span>{lang === 'de' ? 'Horizontale Bildposition' : 'Horizontal image position'}</span>
                      <span className="font-bold text-[#A855F7]">{draft.heroImageOffsetX || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={draft.heroImageOffsetX || 0}
                      onChange={(e) => updateDraft({ heroImageOffsetX: parseInt(e.target.value, 10) })}
                      className="w-full accent-[#A855F7] cursor-pointer"
                    />
                  </div>

                  {/* Y Offset */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                      <span>{lang === 'de' ? 'Vertikale Bildposition' : 'Vertical image position'}</span>
                      <span className="font-bold text-[#A855F7]">{draft.heroImageOffsetY || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={draft.heroImageOffsetY || 0}
                      onChange={(e) => updateDraft({ heroImageOffsetY: parseInt(e.target.value, 10) })}
                      className="w-full accent-[#A855F7] cursor-pointer"
                    />
                  </div>

                  {/* Reset Buttons */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => updateDraft({ heroImageOffsetX: 0, heroImageOffsetY: 0, heroImageMode: 'cover', heroImagePosition: 'center' })}
                      className="text-[10px] font-extrabold uppercase hover:text-[#A855F7] text-stone-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <LucideIcons.RefreshCw size={11} />
                      {lang === 'de' ? 'Bildposition zurücksetzen' : 'Reset image position'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: VIDEO BACKDROP */}
        {isVideoActive && (
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {t.video}
            </span>

            {/* Video Url Input */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-mono text-stone-400">
                {t.videoLink}
              </label>
              <input
                type="text"
                value={draft.heroVideoUrl || ''}
                onChange={(e) => updateDraft({ heroVideoUrl: e.target.value })}
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A855F7]"
              />
            </div>

            {/* Remove Video Button if set */}
            {draft.heroVideoUrl && (
              <button
                type="button"
                onClick={() => updateDraft({ heroVideoUrl: '', heroVideoMode: 'auto' })}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 rounded-lg transition"
              >
                <LucideIcons.Trash2 size={13} />
                <span>{t.removeVideoBtn}</span>
              </button>
            )}

            {/* Video format chooser */}
            <div className="space-y-2 pt-2 border-t border-stone-850/60">
              <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1.5">
                {t.videoFormat}
              </label>
              <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
                {(['auto', 'portrait', 'landscape'] as const).map((vMode) => (
                  <button
                    key={vMode}
                    type="button"
                    onClick={() => updateDraft({ heroVideoMode: vMode })}
                    className={`text-[9.5px] py-1.5 font-bold rounded uppercase transition truncate ${
                      (draft.heroVideoMode || 'auto') === vMode ? 'bg-[#A855F7] text-stone-950 shadow-sm font-black' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {vMode === 'auto' ? t.auto : vMode === 'portrait' ? t.portrait : t.landscape}
                  </button>
                ))}
              </div>

              {/* Informational Size Helpers (warnings) */}
              {draft.heroVideoMode === 'portrait' && (
                <p className="text-[10px] text-amber-400/90 leading-normal flex items-start gap-1">
                  <LucideIcons.AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{t.portraitWarning}</span>
                </p>
              )}
              {draft.heroVideoMode === 'landscape' && (
                <p className="text-[10px] text-amber-400/90 leading-normal flex items-start gap-1">
                  <LucideIcons.AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{t.landscapeWarning}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4. MEDIENFILTER: SÄTTIGUNG & ABDUNKLEN */}
        <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
          <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
            {lang === 'de' ? 'Effekte: Sättigung & Abdunkeln' : 'Effects: Saturation & Darken'}
          </span>

          {/* Sättigung */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
              <span>{t.saturation}</span>
              <span className="font-bold text-[#A855F7]">{draft.heroSaturation !== undefined ? draft.heroSaturation : 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={draft.heroSaturation !== undefined ? draft.heroSaturation : 100}
              onChange={(e) => updateDraft({ heroSaturation: parseInt(e.target.value) })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>

          {/* Abdunkeln */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
              <span>{t.darken}</span>
              <span className="font-bold text-[#A855F7]">{draft.heroDarken !== undefined ? draft.heroDarken : 35}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={draft.heroDarken !== undefined ? draft.heroDarken : 35}
              onChange={(e) => updateDraft({ heroDarken: parseInt(e.target.value) })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
