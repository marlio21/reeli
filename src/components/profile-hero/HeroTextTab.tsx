/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card } from '../../types';
import { UREEL_TEXT_TEMPLATES, normalizeUreelTextTemplate } from '../../utils/textTemplates';

interface HeroTextTabProps {
  draft: any;
  updateDraft: (fields: Partial<Card>) => void;
  lang?: 'de' | 'en';
}

export const HeroTextTab: React.FC<HeroTextTabProps> = ({
  draft,
  updateDraft,
  lang = 'de',
}) => {
  const currentTemplate = normalizeUreelTextTemplate(draft.ureelTextTemplate);

  const updateTemplate = (fields: any) => {
    const current = normalizeUreelTextTemplate(draft.ureelTextTemplate);
    updateDraft({
      ureelTextTemplate: {
        ...current,
        ...fields
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* WERBESCHRIFT / TEXTVORLAGE SELECTION */}
      <div className="p-4 bg-stone-904/60 rounded-xl border border-stone-800 space-y-4">
        <div className="flex items-center gap-2">
          <LucideIcons.Tv size={16} className="text-[#A855F7]" />
          <span className="text-[11px] font-mono tracking-widest font-bold uppercase text-stone-200">
            {lang === 'de' ? 'Werbeschriften & Textvorlagen' : 'Advertising & Text Templates'}
          </span>
        </div>
        <p className="text-[10px] text-stone-400 leading-normal">
          {lang === 'de' 
            ? 'Aktiviere eine professionelle Textvorlage, um deine Texte in Smartphone-kompatible Werbeclips mit perfekten Blickpunkten zu verwandeln.'
            : 'Activate a professional text template to turn your text messages into crisp, smartphone-optimized ad clips.'}
        </p>

        {/* Dropdown for preset selection */}
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1">
              {lang === 'de' ? 'Design-Vorlage wählen' : 'Choose Design Preset'}
            </label>
            <select
              value={currentTemplate.style || 'none'}
              onChange={(e) => {
                const styleId = e.target.value;
                if (styleId === 'none') {
                  updateDraft({ ureelTextTemplate: { id: '', style: 'none', animation: 'fade' } });
                } else {
                  const p = UREEL_TEXT_TEMPLATES[styleId];
                  if (p) {
                    updateDraft({
                      ureelTextTemplate: {
                        id: p.id,
                        style: p.id,
                        animation: p.defaultAnimation,
                        emphasis: { ...p.defaultEmphasis, word: currentTemplate.emphasis?.word || '' },
                        frame: { type: p.defaultFrame, color: currentTemplate.frame?.color || '#A855F7', opacity: 100 },
                        box: { type: p.defaultBox, opacity: 85 },
                        fontStyle: p.defaultFontStyle,
                      }
                    });
                  }
                }
              }}
              className="w-full bg-[#161616] border border-stone-850 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
            >
              <option value="none">{lang === 'de' ? 'Keine / Klassisches Layout' : 'None / Classic Layout'}</option>
              {Object.values(UREEL_TEXT_TEMPLATES).map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {lang === 'de' ? tmpl.labelDe : tmpl.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Quick interactive cards */}
          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
            <button
              onClick={() => updateDraft({ ureelTextTemplate: { id: '', style: 'none', animation: 'fade' } })}
              className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                currentTemplate.style === 'none' 
                  ? 'border-[#A855F7] bg-[#A855F7]/10 text-stone-100 shadow-md' 
                  : 'border-stone-850 bg-stone-950/40 text-stone-400 hover:border-stone-750'
              }`}
            >
              <span className="text-[10px] font-bold">{lang === 'de' ? 'Klassisch (Original)' : 'Classic (Original)'}</span>
              <span className="text-[8px] text-stone-500 line-clamp-1 mt-0.5">{lang === 'de' ? 'Keine Vorlage' : 'No preset template'}</span>
            </button>
            {Object.values(UREEL_TEXT_TEMPLATES).map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => {
                  updateDraft({
                    ureelTextTemplate: {
                      id: tmpl.id,
                      style: tmpl.id,
                      animation: tmpl.defaultAnimation,
                      emphasis: { ...tmpl.defaultEmphasis, word: currentTemplate.emphasis?.word || '' },
                      frame: { type: tmpl.defaultFrame, color: currentTemplate.frame?.color || '#A855F7', opacity: 100 },
                      box: { type: tmpl.defaultBox, opacity: 85 },
                      fontStyle: tmpl.defaultFontStyle,
                    }
                  });
                }}
                className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  currentTemplate.style === tmpl.id 
                    ? 'border-[#A855F7] bg-[#A855F7]/10 text-stone-100 shadow-md animate-pulseSlow' 
                    : 'border-stone-850 bg-stone-950/40 text-stone-400 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold line-clamp-1">{lang === 'de' ? tmpl.labelDe : tmpl.labelEn}</span>
                  {currentTemplate.style === tmpl.id && <LucideIcons.Check size={10} className="text-[#A855F7]" />}
                </div>
                <span className="text-[8px] text-stone-500 line-clamp-1 mt-0.5">{lang === 'de' ? tmpl.descriptionDe : tmpl.descriptionEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOMIZATION DRAWER FOR THE SELECTED TEXT TEMPLATE */}
        {currentTemplate.style !== 'none' && (
          <div className="pt-3 border-t border-stone-800 space-y-4">
            {/* 1. ANIMATION */}
            <div>
              <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1 flex items-center gap-1.5">
                <LucideIcons.PlayCircle size={11} className="text-[#A855F7]" />
                {lang === 'de' ? 'Text-Animation' : 'Text Animation'}
              </label>
              <select
                value={currentTemplate.animation}
                onChange={(e) => updateTemplate({ animation: e.target.value })}
                className="w-full bg-[#161616] border border-stone-850 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-[#A855F7]"
              >
                <option value="fade">{lang === 'de' ? 'Sanftes Erscheinen (Fade)' : 'Soft Fade In'}</option>
                <option value="slide_left">{lang === 'de' ? 'Von links einfliegen (Slide Left)' : 'Slide In Left'}</option>
                <option value="slide_up">{lang === 'de' ? 'Von unten hochfliegen (Slide Up)' : 'Slide In From Bottom'}</option>
                <option value="reveal">{lang === 'de' ? 'Enthüllen / Aufklappen (Reveal)' : 'Clean Unfolding'}</option>
                <option value="focus">{lang === 'de' ? 'Kurzer Fokus-Effekt (Fokus Zoom)' : 'Focus Accent'}</option>
              </select>
            </div>

            {/* 2. SCHRIFTART */}
            <div>
              <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1 flex items-center gap-1.5">
                <LucideIcons.Type size={11} className="text-[#A855F7]" />
                {lang === 'de' ? 'Schriftstil & Typografie' : 'Font Style'}
              </label>
              <select
                value={currentTemplate.fontStyle || 'modern'}
                onChange={(e) => updateTemplate({ fontStyle: e.target.value })}
                className="w-full bg-[#161616] border border-stone-850 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-[#A855F7]"
              >
                <option value="modern">{lang === 'de' ? 'Modern Grotesk (Serifenlos, fett)' : 'Modern Grotesk'}</option>
                <option value="elegant">{lang === 'de' ? 'Elegant Minimal (Großbuchstaben)' : 'Elegant Minimalist'}</option>
                <option value="serif">{lang === 'de' ? 'Prestige Serif (Klassisch, Kursiv)' : 'Prestige Serif'}</option>
                <option value="condensed">{lang === 'de' ? 'Impact Condensed (Aktion, Laut)' : 'Impact Condensed'}</option>
                <option value="tech">{lang === 'de' ? 'Tech Mono (Geometrisch, Code)' : 'Technical Code'}</option>
              </select>
            </div>

            {/* 3. REGLER UND BOX */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1">
                  {lang === 'de' ? 'Rahmentyp' : 'Frame Border'}
                </label>
                <select
                  value={currentTemplate.frame?.type || 'none'}
                  onChange={(e) => updateTemplate({ frame: { ...currentTemplate.frame, type: e.target.value as any } })}
                  className="w-full bg-[#161616] border border-stone-850 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
                >
                  <option value="none">{lang === 'de' ? 'Kein Rahmen' : 'No Frame'}</option>
                  <option value="thin">{lang === 'de' ? 'Dünner Rahmen' : 'Thin Box'}</option>
                  <option value="corner">{lang === 'de' ? 'Eck-Klammern' : 'Corner Marks'}</option>
                  <option value="underline">{lang === 'de' ? 'Unterstreichung' : 'Underline'}</option>
                  <option value="side_line">{lang === 'de' ? 'Seiten-Linie (Links)' : 'Side line (Left)'}</option>
                  <option value="badge">{lang === 'de' ? 'Badge (Untertitel oben)' : 'Badge Header'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1">
                  {lang === 'de' ? 'Hintergrund-Box' : 'Box Style'}
                </label>
                <select
                  value={currentTemplate.box?.type || 'none'}
                  onChange={(e) => updateTemplate({ box: { ...currentTemplate.box, type: e.target.value as any } })}
                  className="w-full bg-[#161616] border border-stone-850 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
                >
                  <option value="none">{lang === 'de' ? 'Kein Hintergrund' : 'No Background'}</option>
                  <option value="transparent">{lang === 'de' ? 'Teil-Transparent' : 'Semi-Transparent'}</option>
                  <option value="glass">{lang === 'de' ? 'Milchglas-Effekt' : 'Glassmorphism'}</option>
                  <option value="dark">{lang === 'de' ? 'Nacht-Schwarz' : 'Black Canvas'}</option>
                  <option value="light">{lang === 'de' ? 'Schnee-Weiß' : 'Clean White'}</option>
                </select>
              </div>
            </div>

            {/* Frame Custom Color & Box Opacity */}
            <div className="grid grid-cols-2 gap-3.5 items-center">
              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1">
                  {lang === 'de' ? 'Rahmen-Farbe' : 'Frame Color'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={currentTemplate.frame?.color || '#A855F7'}
                    onChange={(e) => updateTemplate({ frame: { ...currentTemplate.frame, color: e.target.value } })}
                    className="w-7 h-7 bg-[#161616] border border-stone-800 rounded cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={currentTemplate.frame?.color || '#A855F7'}
                    onChange={(e) => updateTemplate({ frame: { ...currentTemplate.frame, color: e.target.value } })}
                    className="w-full bg-[#161616] border border-stone-850 rounded px-2 py-0.5 text-[11px] text-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-stone-400 mb-1">
                  {lang === 'de' ? 'Box Deckkraft' : 'Box Opacity'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={currentTemplate.box?.opacity ?? 80}
                    onChange={(e) => updateTemplate({ box: { ...currentTemplate.box, opacity: parseInt(e.target.value, 10) } })}
                    className="w-full accent-[#A855F7] cursor-pointer"
                  />
                  <span className="text-[10px] text-stone-400 font-bold shrink-0">{currentTemplate.box?.opacity ?? 80}%</span>
                </div>
              </div>
            </div>

            {/* 4. KEYWORD EMPHASIS */}
            <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-850/80 space-y-3">
              <span className="block text-[9px] uppercase font-black tracking-wider text-stone-300">
                {lang === 'de' ? 'Schlüsselwort-Hervorhebung' : 'Keyword Emphasis'}
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-stone-400 mb-1">
                    {lang === 'de' ? 'Hervorhebungs-Modus' : 'Emphasis Mode'}
                  </label>
                  <select
                    value={currentTemplate.emphasis?.mode || 'none'}
                    onChange={(e) => updateTemplate({ emphasis: { ...currentTemplate.emphasis, mode: e.target.value as any } })}
                    className="w-full bg-[#161616] border border-stone-850 rounded px-2 py-1 text-[11px] text-stone-200 focus:outline-none"
                  >
                    <option value="none">{lang === 'de' ? 'Keines' : 'None'}</option>
                    <option value="last_word">{lang === 'de' ? 'Letztes Wort' : 'Last Word'}</option>
                    <option value="custom_word">{lang === 'de' ? 'Eigener Begriff' : 'Custom Term'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] tracking-wider uppercase text-stone-400 mb-1">
                    {lang === 'de' ? 'Akzent-Farbe' : 'Accent Color'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={currentTemplate.emphasis?.color || '#A855F7'}
                      onChange={(e) => updateTemplate({ emphasis: { ...currentTemplate.emphasis, color: e.target.value } })}
                      className="w-6 h-6 bg-[#161616] border border-stone-800 rounded cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={currentTemplate.emphasis?.color || '#A855F7'}
                      onChange={(e) => updateTemplate({ emphasis: { ...currentTemplate.emphasis, color: e.target.value } })}
                      className="w-full bg-[#161616] border border-stone-850 rounded px-2 py-0.5 text-[10px] text-stone-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {currentTemplate.emphasis?.mode === 'custom_word' && (
                <div className="animate-fadeIn">
                  <label className="block text-[8px] tracking-wider uppercase text-stone-400 mb-1">
                    {lang === 'de' ? 'Hervorzuhebendes Wort' : 'Word to Highlight'}
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.emphasis?.word || ''}
                    onChange={(e) => updateTemplate({ emphasis: { ...currentTemplate.emphasis, word: e.target.value } })}
                    placeholder={lang === 'de' ? 'z.B. Story' : 'e.g. Story'}
                    className="w-full bg-[#161616] border border-stone-850 rounded-lg px-2.5 py-1.5 text-xs text-[#A855F7] font-bold focus:outline-none focus:border-[#A855F7]"
                  />
                  <span className="text-[8px] text-stone-500 mt-1 block">
                    {lang === 'de' 
                      ? 'Das hier eingetragene Wort wird im Titel farblich akzentuiert.' 
                      : 'The word specified here will be highlighted with the color accent inside the main headline.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. DIRECT NAME & INFO INPUTS */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
        <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
          {lang === 'de' ? 'Texte der Visitenkarte' : 'Card text content'}
        </span>

        {/* Title / Name */}
        <div>
          <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 mb-1">
            {lang === 'de' ? 'Haupt-Titel (z.B. Name)' : 'Main title (e.g. Name)'}
          </label>
          <input
            type="text"
            value={draft.heroTitle || ''}
            onChange={(e) => updateDraft({ heroTitle: e.target.value })}
            placeholder={lang === 'de' ? 'z.B. Max Mustermann' : 'e.g. Max Mustermann'}
            className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A855F7]"
          />
        </div>

        {/* Subtitle & Company in 2 cols */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 mb-1">
              {lang === 'de' ? 'Untertitel' : 'Subtitle'}
            </label>
            <input
              type="text"
              value={draft.heroSubtitle || ''}
              onChange={(e) => updateDraft({ heroSubtitle: e.target.value })}
              placeholder={lang === 'de' ? 'z.B. Geschäftsführer' : 'e.g. CEO'}
              className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A855F7]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 mb-1">
              {lang === 'de' ? 'Firma' : 'Company'}
            </label>
            <input
              type="text"
              value={draft.heroCompany || ''}
              onChange={(e) => updateDraft({ heroCompany: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A855F7]"
            />
          </div>
        </div>

        {/* Description Description */}
        <div>
          <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-stone-400 mb-1">
            {lang === 'de' ? 'Slogan & Kurzbiographie' : 'Slogan & Biography'}
          </label>
          <textarea
            rows={2}
            value={draft.heroDescription || ''}
            onChange={(e) => updateDraft({ heroDescription: e.target.value })}
            placeholder={lang === 'de' ? 'Kurzer Slogan oder Firmen-Motto...' : 'A short motto or corporate slogan...'}
            className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#A855F7] resize-none"
          />
        </div>

        {/* 5. Farbauswahl directly under the text fields */}
        <div className="border-t border-stone-850/60 pt-4 space-y-3">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#A855F7] block">
            {lang === 'de' ? 'Farbauswahl' : 'Color Selection'}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Title Color */}
            <div>
              <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                {lang === 'de' ? 'Textfarbe (Titel)' : 'Text Color (Title)'}
              </label>
              <div className="flex items-center gap-1.5 bg-stone-850 border border-stone-750 rounded-lg p-1.5">
                <input
                  type="color"
                  value={draft.heroTitleTextColor?.startsWith('#') ? draft.heroTitleTextColor : '#ffffff'}
                  onChange={(e) => updateDraft({ heroTitleTextColor: e.target.value as any })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10.5px] font-mono text-stone-300">
                  {draft.heroTitleTextColor || '#ffffff'}
                </span>
              </div>
            </div>

            {/* Subtitle Color / Accent */}
            <div>
              <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1">
                {lang === 'de' ? 'Akzentfarbe' : 'Accent Color'}
              </label>
              <div className="flex items-center gap-1.5 bg-[#121212]/80 border border-stone-750 rounded-lg p-1.5">
                <input
                  type="color"
                  value={draft.heroSubtitleTextColor?.startsWith('#') ? draft.heroSubtitleTextColor : '#A855F7'}
                  onChange={(e) => updateDraft({ heroSubtitleTextColor: e.target.value as any })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-[10.5px] font-mono text-stone-300">
                  {draft.heroSubtitleTextColor || '#A855F7'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TYPOGRAPHY & ALIGNMENTS */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
        <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
          {lang === 'de' ? 'Typographie & Stil-Auswahl' : 'Typography & Style Options'}
        </span>

        {/* Font Style Preset */}
        <div>
          <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1.5">
            {lang === 'de' ? 'Stilrichtung' : 'Style Preset'}
          </label>
          <div className="grid grid-cols-4 gap-1 bg-stone-850 p-1 rounded-lg">
            {(['modern', 'elegant', 'bold', 'minimal'] as const).map((sty) => (
              <button
                key={sty}
                type="button"
                onClick={() => updateDraft({ 
                  heroTitleFontStyle: sty,
                  heroSubtitleFontStyle: sty,
                  heroDescFontStyle: sty,
                  heroFontStyle: sty 
                })}
                className={`text-[9.5px] py-1 font-bold rounded uppercase transition truncate ${
                  draft.heroFontStyle === sty ? 'bg-[#A855F7] text-stone-950 shadow-sm' : 'text-stone-400 hover:text-white'
                }`}
              >
                {sty}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family Selection */}
        <div>
          <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1.5">
            {lang === 'de' ? 'Globale Schriftart' : 'Global Font Family'}
          </label>
          <select
            value={draft.heroFontFamily || 'Inter'}
            onChange={(e) => updateDraft({ heroFontFamily: e.target.value })}
            className="w-full bg-stone-850 border border-stone-750 text-stone-250 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#A855F7] cursor-pointer"
          >
            {[
              'Inter',
              'Space Grotesk',
              'Playfair Display',
              'Poppins',
              'Montserrat',
              'Lora',
              'Merriweather',
              'Roboto Slab',
              'Manrope',
              'Nunito',
              'Raleway',
              'DM Sans',
              'Cinzel',
              'Pacifico',
              'Bebas Neue',
              'Courier Prime'
            ].map((f) => (
              <option key={f} value={f} className="bg-stone-900 text-stone-100">
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Text shadows with glowing choice */}
        <div>
          <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1.5">
            {lang === 'de' ? 'Text-Schatten' : 'Text Shadow'}
          </label>
          <div className="grid grid-cols-4 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
            {(['none', 'soft', 'strong', 'glow'] as const).map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => updateDraft({ heroTextShadow: sh as any })}
                className={`text-[9px] py-1.5 font-bold rounded uppercase transition truncate ${
                  (draft.heroTextShadow || 'soft') === sh ? 'bg-[#A855F7] text-stone-950 font-black' : 'text-stone-400 hover:text-white'
                }`}
              >
                {sh === 'none' ? (lang === 'de' ? 'Kein' : 'None')
                  : sh === 'soft' ? (lang === 'de' ? 'Weich' : 'Soft')
                  : sh === 'strong' ? (lang === 'de' ? 'Stark' : 'Strong')
                  : (lang === 'de' ? 'Glow' : 'Glow')}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-[10px] uppercase font-mono text-stone-400 mb-1.5">
            {lang === 'de' ? 'Textausrichtung' : 'Text Alignment'}
          </label>
          <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
            {(['left', 'center', 'right'] as const).map((align) => {
              const Icon = align === 'left' ? LucideIcons.AlignLeft : align === 'center' ? LucideIcons.AlignCenter : LucideIcons.AlignRight;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => updateDraft({ heroTextAlign: align })}
                  className={`flex items-center justify-center py-1.5 rounded transition ${
                    (draft.heroTextAlign || 'center') === align ? 'bg-[#A855F7] text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} className="mr-1" />
                  <span className="text-[10px] font-bold uppercase">
                    {align === 'left' ? (lang === 'de' ? 'Links' : 'Left')
                      : align === 'center' ? (lang === 'de' ? 'Zentriert' : 'Center')
                      : (lang === 'de' ? 'Rechts' : 'Right')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2.2. BOXRAHMEN / HINTERGRUND-BOX */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7]">
              {lang === 'de' ? 'Hintergrund-Box (Boxrahmen)' : 'Text Box Frame'}
            </span>
            <span className="text-[9px] text-stone-400 mt-0.5">
              {lang === 'de' ? 'Wählt einen eleganten, abgerundeten Hintergrund-Rahmen für die Texte.' : 'Enables a sleek, rounded background box frame for the texts.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateDraft({ heroLayout: draft.heroLayout === 'textrahmen' ? 'klassisch' : 'textrahmen' })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
              draft.heroLayout === 'textrahmen' ? 'bg-[#A855F7]' : 'bg-stone-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-stone-950 transition-transform duration-200 ${
                draft.heroLayout === 'textrahmen' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2.5. SCHRIFTGRÖSSEN (FONT SIZES) */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4 font-mono">
        <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
          {lang === 'de' ? 'Schriftgrößen' : 'Font Sizes'}
        </span>

        <div className="space-y-4">
          {/* Title Size Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-stone-300 mb-1">
              <span>{lang === 'de' ? 'Titel-Größe' : 'Title Size'}</span>
              <span className="text-[#A855F7] font-bold">{draft.heroTitleSize !== undefined ? draft.heroTitleSize : 26}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="64"
              value={draft.heroTitleSize !== undefined ? draft.heroTitleSize : 26}
              onChange={(e) => updateDraft({ heroTitleSize: parseInt(e.target.value, 10) || 26 })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>

          {/* Subtitle Size Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-stone-300 mb-1">
              <span>{lang === 'de' ? 'Untertitel-Größe' : 'Subtitle Size'}</span>
              <span className="text-[#A855F7] font-bold">{draft.heroSubtitleSize !== undefined ? draft.heroSubtitleSize : 14}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="36"
              value={draft.heroSubtitleSize !== undefined ? draft.heroSubtitleSize : 14}
              onChange={(e) => updateDraft({ heroSubtitleSize: parseInt(e.target.value, 10) || 14 })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>

          {/* Description Size Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-stone-300 mb-1">
              <span>{lang === 'de' ? 'Beschreibung-Größe' : 'Description Size'}</span>
              <span className="text-[#A855F7] font-bold">{draft.heroDescriptionSize !== undefined ? draft.heroDescriptionSize : 12}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="28"
              value={draft.heroDescriptionSize !== undefined ? draft.heroDescriptionSize : 12}
              onChange={(e) => updateDraft({ heroDescriptionSize: parseInt(e.target.value, 10) || 12 })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. POSITION FINE TUNING SLIDERS */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
        <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
          {lang === 'de' ? 'Schrift-Feinpositionierung' : 'Text Fine-Tuning'}
        </span>

        <div className="grid grid-cols-2 gap-4">
          {/* Vertical Y-Offset */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-0.5">
              <span>Y-Offset (Vertikal)</span>
              <span className="text-[#A855F7] font-bold">{draft.heroTextYOffset || 0}px</span>
            </div>
            <input
              type="range"
              min="-120"
              max="120"
              value={draft.heroTextYOffset !== undefined ? draft.heroTextYOffset : 0}
              onChange={(e) => updateDraft({ heroTextYOffset: parseInt(e.target.value) || 0 })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>

          {/* Horizontal X-Offset */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-0.5">
              <span>X-Offset (Horizontal)</span>
              <span className="text-[#A855F7] font-bold">{draft.heroTextXOffset || 0}px</span>
            </div>
            <input
              type="range"
              min="-120"
              max="120"
              value={draft.heroTextXOffset !== undefined ? draft.heroTextXOffset : 0}
              onChange={(e) => updateDraft({ heroTextXOffset: parseInt(e.target.value) || 0 })}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
