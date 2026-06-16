import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CardButton } from '../../types';

interface ButtonTextTabProps {
  localButton: CardButton;
  updateButton: (updates: Partial<CardButton>) => void;
  lang: 'de' | 'en';
  subSection?: string;
}

export const ButtonTextTab: React.FC<ButtonTextTabProps> = ({
  localButton,
  updateButton,
  lang,
  subSection,
}) => {
  const fineTuningEnabled = localButton.textFineTuneEnabled !== undefined
    ? !!localButton.textFineTuneEnabled
    : ((localButton.textOffsetX !== undefined && localButton.textOffsetX !== 0) ||
       (localButton.textOffsetY !== undefined && localButton.textOffsetY !== 0));

  const colorSwatches = [
    '#1A1A1A', // Slate/Charcoal Dark
    '#A855F7', // KONU Gold
    '#F5F0E6', // Warm Off-white
    '#FFFFFF', // White
    '#E1306C', // Insta Rose
    '#3BB273', // WhatsApp Green
  ];

  return (
    <div className="space-y-6 bg-stone-900/40 p-5 rounded-2xl border border-stone-850/80">
      {/* 1. TEXT / BESCHRIFTUNG */}
      {(!subSection || subSection === 'text_content') && (
        <div>
          <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-2">
          {lang === 'de' ? 'Button-Text / Beschriftung' : 'Button Text / Label'}
        </label>
        <input
          type="text"
          value={localButton.title || ''}
          onChange={(e) => updateButton({ title: e.target.value })}
          placeholder={lang === 'de' ? 'z.B. Jetzt anrufen, Website besuchen...' : 'e.g. Call us, Visit website...'}
          className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 focus:outline-[#A855F7]"
          id="button-text-title-input"
        />
      </div>
      )}

      {/* 2. TEXTFARBE */}
      {(!subSection || subSection === 'text_color') && (
        <div className="border-t border-stone-800/80 pt-4 space-y-2">
        <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
          {lang === 'de' ? 'Textfarbe' : 'Text color'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={localButton.textColor || '#1E1E1E'}
            onChange={(e) => updateButton({ textColor: e.target.value })}
            className="w-10 h-10 rounded-xl bg-[#161616] border border-stone-850 cursor-pointer p-0.5"
            id="button-text-color-picker"
          />
          <input
            type="text"
            value={(localButton.textColor || '#1E1E1E').toUpperCase()}
            onChange={(e) => updateButton({ textColor: e.target.value })}
            className="flex-grow bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 font-mono uppercase focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {colorSwatches.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => updateButton({ textColor: col })}
              className="w-6 h-6 rounded-full border border-stone-950/60 cursor-pointer transition hover:scale-115"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>
      )}

      {/* 3. SCHRIFTART / VIBE */}
      {(!subSection || subSection === 'text_font') && (
        <>
          <div className="border-t border-stone-800/80 pt-4 space-y-2.5">
        <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
          {lang === 'de' ? 'Schriftart (Vibe)' : 'Font Family'}
        </label>
        <select
          value={localButton.fontFamily || 'Inter'}
          onChange={(e) => updateButton({ fontFamily: e.target.value })}
          className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
        >
          <option value="Inter">Inter (Clean / Modern)</option>
          <option value="Space Grotesk">Space Grotesk (Tech Vibe)</option>
          <option value="JetBrains Mono">JetBrains Mono (Technical / Mono)</option>
          <option value="Outfit">Outfit (Avant Garde)</option>
          <option value="Playfair Display">Playfair Display (Serif / Editorial)</option>
        </select>
      </div>

      {/* 4. GRÖSSE & GEWICHT */}
      <div className="border-t border-stone-800/80 pt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
              {lang === 'de' ? 'Schriftgröße' : 'Font size'}
            </label>
            <span className="text-[10px] text-[#A855F7] font-extrabold">{localButton.fontSize || 13}px</span>
          </div>
          <input
            type="range"
            min="10"
            max="24"
            value={localButton.fontSize || 13}
            onChange={(e) => updateButton({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-[#A855F7]"
            id="button-text-font-size-slider"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-[#161616] md:text-stone-400 tracking-wider mb-1.5 h-3 md:h-auto">
            {lang === 'de' ? 'Schriftgewicht' : 'Font weight'}
          </label>
          <select
            value={localButton.fontWeight || 'medium'}
            onChange={(e) => updateButton({ fontWeight: e.target.value })}
            className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
          >
            <option value="light">Light</option>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="semibold">Semibold</option>
            <option value="bold">Bold</option>
            <option value="extrabold">Extrabold</option>
          </select>
        </div>
      </div>
        </>
      )}

      {/* 5. AUSRICHTUNG & POSITION & DYNAMISCHE FEINPOSITIONIERUNG */}
      {(!subSection || subSection === 'text_align') && (
        <>
          <div className="border-t border-stone-800/80 pt-4 space-y-4">
        <label className="block text-[10px] uppercase font-black text-[#A855F7] tracking-wider font-mono">
          {lang === 'de' ? 'Ausrichtung & Feinpositionierung' : 'Alignment & Fine Tuning'}
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-wider mb-2">
              {lang === 'de' ? 'Horiz. Alignment' : 'Horiz. Alignment'}
            </label>
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-850 gap-1">
              {['left', 'center', 'right'].map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => updateButton({ textAlign: al as any })}
                  className={`flex-1 text-[10px] font-bold py-1 px-1 rounded-lg uppercase tracking-wide transition cursor-pointer ${localButton.textAlign === al ? 'bg-[#A855F7] text-stone-950' : 'text-stone-400 hover:text-white'}`}
                >
                  {al === 'left' ? (lang === 'de' ? 'Links' : 'Left') : al === 'center' ? (lang === 'de' ? 'Mitte' : 'Center') : (lang === 'de' ? 'Rechts' : 'Right')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-wider mb-2">
              {lang === 'de' ? 'Vert. Position' : 'Vert. Position'}
            </label>
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-850 gap-1">
              {['top', 'center', 'bottom'].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => updateButton({ textPosition: pos as any })}
                  className={`flex-1 text-[10px] font-bold py-1 px-1 rounded-lg uppercase tracking-wide transition cursor-pointer ${localButton.textPosition === pos ? 'bg-[#A855F7] text-stone-950' : 'text-stone-400 hover:text-white'}`}
                >
                  {pos === 'top' ? (lang === 'de' ? 'Oben' : 'Top') : pos === 'center' ? (lang === 'de' ? 'Mitte' : 'Mid') : (lang === 'de' ? 'Unten' : 'Bot')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cohesive Inline Toggle and Controls for Fine-Tuning */}
        <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-850/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider font-bold uppercase text-stone-300">
                {lang === 'de' ? 'Feinjustierung aktivieren' : 'Enable Fine Tuning'}
              </span>
              <span className="text-[9px] text-stone-400">
                {lang === 'de' ? 'Erhöht die gestalterische Freiheit durch pixelgenaue X/Y Verschiebung.' : 'Shift text rendering on an exact pixel ratio.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !fineTuningEnabled;
                updateButton({
                  textFineTuneEnabled: nextVal,
                  ...(!nextVal ? { textOffsetX: 0, textOffsetY: 0 } : {}),
                });
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
                fineTuningEnabled ? 'bg-[#A855F7]' : 'bg-stone-800'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-stone-950 transition-transform duration-200 ${
                  fineTuningEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {fineTuningEnabled && (
            <div className="space-y-4 pt-2.5 border-t border-stone-800/60 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase font-bold text-stone-400">
                      {lang === 'de' ? 'Horizontale Textposition' : 'Horizontal text position'}
                    </label>
                    <span className="text-[10px] text-[#A855F7] font-mono font-extrabold">{localButton.textOffsetX || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={localButton.textOffsetX || 0}
                    onChange={(e) => updateButton({ textOffsetX: parseInt(e.target.value) })}
                    className="w-full accent-[#A855F7] cursor-ew-resize"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase font-bold text-stone-400">
                      {lang === 'de' ? 'Vertikale Textposition' : 'Vertical text position'}
                    </label>
                    <span className="text-[10px] text-[#A855F7] font-mono font-extrabold">{localButton.textOffsetY || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="1"
                    value={localButton.textOffsetY || 0}
                    onChange={(e) => updateButton({ textOffsetY: parseInt(e.target.value) })}
                    className="w-full accent-[#A855F7] cursor-ns-resize"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => updateButton({ textOffsetX: 0, textOffsetY: 0 })}
                  className="text-[9px] font-black uppercase tracking-wider text-[#A855F7] hover:text-[#e6c66b] transition bg-transparent border-0 cursor-pointer flex items-center gap-1"
                >
                  <LucideIcons.RotateCcw size={10} />
                  <span>{lang === 'de' ? 'Textposition zurücksetzen' : 'Reset text position'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. ZEICHENABSTAND & SCHATTEN */}
      <div className="border-t border-stone-800/80 pt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
              {lang === 'de' ? 'Zeichenabstand' : 'Letter spacing'}
            </label>
            <span className="text-[10px] text-stone-400 font-bold">{localButton.letterSpacing ?? 0}px</span>
          </div>
          <input
            type="range"
            min="-1"
            max="3"
            step="0.5"
            value={localButton.letterSpacing ?? 0}
            onChange={(e) => updateButton({ letterSpacing: parseFloat(e.target.value) })}
            className="w-full accent-[#A855F7]"
            id="button-text-letter-spacing-slider"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1.5">
            {lang === 'de' ? 'Text-Schatten' : 'Text Shadow'}
          </label>
          <select
            value={localButton.textShadow || 'none'}
            onChange={(e) => updateButton({ textShadow: e.target.value as any })}
            className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
          >
            <option value="none">{lang === 'de' ? 'Kein Schatten' : 'No shadow'}</option>
            <option value="soft">{lang === 'de' ? 'Weich shadow' : 'Soft'}</option>
            <option value="strong">{lang === 'de' ? 'Kräftig shadow' : 'Strong'}</option>
          </select>
        </div>
      </div>

      {/* 7. UNTER-BEZEICHNUNG & WECHSEL */}
      <div className="border-t border-stone-800/80 pt-4">
        <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-2">
          {lang === 'de' ? 'Text-Umbruch / Wrapping' : 'Text Wrap / Formatting'}
        </label>
        <select
          value={localButton.textWrap || 'single'}
          onChange={(e) => updateButton({ textWrap: e.target.value as any })}
          className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-2.5 text-xs text-stone-200 focus:outline-[#A855F7]"
        >
          <option value="single">{lang === 'de' ? 'Einzeilig (Abschneiden ab 1 Zeile)' : 'Single Line truncation'}</option>
          <option value="multi">{lang === 'de' ? 'Mehrzeilig (Auto-Umbruch)' : 'Multi-line auto-wrapping'}</option>
          <option value="ellipsis">{lang === 'de' ? 'Ellipsis (... am Ende anzeigen)' : 'Ellipsis (... on overflow)'}</option>
        </select>
      </div>
        </>
      )}

    </div>
  );
};
