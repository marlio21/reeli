import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CardButton } from '../../types';

interface ButtonFaceTabProps {
  localButton: CardButton;
  updateButton: (updates: Partial<CardButton>) => void;
  lang: 'de' | 'en';
  isBtnImageUploading: boolean;
  handleButtonImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImageLocked?: boolean;
  onImageLockClick?: () => void;
  subSection?: string;
}

export const ButtonFaceTab: React.FC<ButtonFaceTabProps> = ({
  localButton,
  updateButton,
  lang,
  isBtnImageUploading,
  handleButtonImageUpload,
  isImageLocked = false,
  onImageLockClick,
  subSection,
}) => {
  // Configured quick swatches for solid color as requested
  const solidColors = [
    { name: lang === 'de' ? 'ureel Gold' : 'ureel Gold', val: '#A855F7' },
    { name: lang === 'de' ? 'Cremeweiß' : 'Cream White', val: '#F5F0E6' },
    { name: lang === 'de' ? 'Anthrazit' : 'Anthracite', val: '#1C1917' },
    { name: lang === 'de' ? 'Schwarz' : 'Black', val: '#000000' },
    { name: lang === 'de' ? 'Holzbraun' : 'Wood Brown', val: '#8B5A2B' },
    { name: lang === 'de' ? 'Grün' : 'Green', val: '#10B981' },
  ];

  const directions = [
    { id: 'to-bottom', de: 'Oben nach unten', en: 'Top to bottom' },
    { id: 'to-right', de: 'Links nach rechts', en: 'Left to right' },
    { id: 'to-br', de: 'Diagonal', en: 'Diagonal' },
    { id: 'to-bl', de: 'Diagonal umgekehrt', en: 'Reverse diagonal' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const eventMock = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleButtonImageUpload(eventMock);
    }
  };

  const activeBgMode = localButton.bgMode || 'solid';

  return (
    <div className="space-y-6 bg-stone-900/40 p-5 rounded-2xl border border-stone-850/80">
      {/* 1) BILD HOCHLADEN */}
      {(!subSection || subSection === 'face_image') && (
        <>
          <div className="space-y-3">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.Image size={14} className="text-[#A855F7]" />
          {lang === 'de' ? 'Buttonbild hochladen' : 'Upload button image'}
        </h4>

        {localButton.imageUrl ? (
          <div className="flex items-center gap-3 p-3 bg-stone-950 border border-stone-850 rounded-2xl">
            <div className="w-14 h-14 rounded-xl border border-[#A855F7]/30 overflow-hidden shrink-0">
              <img src={localButton.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <span className="text-[11px] font-extrabold text-stone-200 block uppercase tracking-wider">
                {lang === 'de' ? 'BILD AKTIV' : 'IMAGE ACTIVE'}
              </span>
              <button
                type="button"
                onClick={() => updateButton({ imageUrl: '' })}
                className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-wider block mt-1 transition cursor-pointer"
              >
                {lang === 'de' ? 'Bild entfernen' : 'Remove image'}
              </button>
            </div>
          </div>
        ) : isImageLocked ? (
          <div
            onClick={onImageLockClick}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-500/15 rounded-2xl bg-stone-950 hover:border-amber-500/25 transition cursor-pointer relative"
          >
            <LucideIcons.Lock className="text-[#A855F7] mb-2 animate-pulse" size={24} />
            <span className="text-xs text-stone-300 font-bold text-center">
              {lang === 'de' ? 'Button-Hintergrundbild (ab FUN)' : 'Button background image (from FUN)'}
            </span>
            <span className="text-[10px] text-[#A855F7] mt-1 block font-semibold">
              {lang === 'de' ? 'Hier klicken zum Freischalten' : 'Click here to unlock'} 🔒
            </span>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-800 rounded-2xl bg-stone-950 hover:bg-stone-900/50 transition cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleButtonImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="button-image-file-input"
            />
            <LucideIcons.UploadCloud className="text-[#A855F7] mb-2" size={24} />
            <span className="text-xs text-stone-300 font-bold text-center">
              {isBtnImageUploading ? (lang === 'de' ? 'Wird optimiert...' : 'Optimizing / Uploading...') : (lang === 'de' ? 'Bild hier ablegen oder klicken' : 'Drop image here or click')}
            </span>
            <span className="text-[10px] text-stone-500 mt-1 block">
              {lang === 'de' ? 'WebP automatische Komprimierung' : 'WebP automatic compression'}
            </span>
          </div>
        )}

        {localButton.imageUrl && (
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            <div>
              <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Bild-Modus' : 'Image Mode'}
              </label>
              <select
                value={localButton.imageMode || 'cover'}
                onChange={(e) => updateButton({ imageMode: e.target.value as any })}
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2 py-1.5 text-xs text-stone-200 focus:outline-none"
              >
                <option value="cover">{lang === 'de' ? 'Ausfüllen (Cover)' : 'Cover'}</option>
                <option value="contain">{lang === 'de' ? 'Einpassen (Contain)' : 'Contain'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Bild-Position' : 'Image Position'}
              </label>
              <select
                value={localButton.imagePosition || 'center'}
                onChange={(e) => updateButton({ imagePosition: e.target.value as any })}
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2 py-1.5 text-xs text-stone-200 focus:outline-none"
              >
                <option value="center">{lang === 'de' ? 'Mitte' : 'Center'}</option>
                <option value="top">{lang === 'de' ? 'Oben' : 'Top'}</option>
                <option value="bottom">{lang === 'de' ? 'Unten' : 'Bottom'}</option>
                <option value="left">{lang === 'de' ? 'Links' : 'Left'}</option>
                <option value="right">{lang === 'de' ? 'Rechts' : 'Right'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 1B) COMPACT SQUARE BUTTON IMAGE (UREEL ACTION IMAGE) */}
      {(!subSection || subSection === 'face_image') && (
        <div className="border-t border-stone-800/80 pt-4 space-y-3 text-left">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Image size={14} className="text-[#A855F7]" />
            {lang === 'de' ? 'Aktionsbild (Ureel quadratisch)' : 'Action Image (Ureel Square)'}
          </h4>
          <p className="text-[10px] text-stone-400 font-medium">
            {lang === 'de'
              ? 'Füge ein spezifisches Bild hinzu, das auf dem quadratischen Aktions-Button angezeigt werden soll.'
              : 'Add a specific icon or photo to be centered inside your grid action button.'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase font-black text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Bild-Web-URL' : 'Image Web URL'}
              </label>
              <input
                type="text"
                value={localButton.buttonImageUrl || ''}
                onChange={(e) => updateButton({ buttonImageUrl: e.target.value })}
                placeholder="https://example.com/my-image.webp"
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7]"
              />
            </div>

            {localButton.buttonImageUrl && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[9px] uppercase font-black text-stone-400 tracking-wider mb-1">
                    {lang === 'de' ? 'Bild-Skalierung' : 'Image Fit'}
                  </label>
                  <select
                    value={localButton.buttonImageFit || 'cover'}
                    onChange={(e) => updateButton({ buttonImageFit: e.target.value as any })}
                    className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2 py-1.5 text-xs text-stone-200 focus:outline-none"
                  >
                    <option value="cover">{lang === 'de' ? 'Ausfüllen (Cover)' : 'Cover'}</option>
                    <option value="contain">{lang === 'de' ? 'Einpassen (Contain)' : 'Contain'}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between mt-4 py-1.5 px-2 bg-stone-950/60 rounded-xl border border-stone-850">
                  <span className="text-[11px] font-bold text-stone-400">{lang === 'de' ? 'Overlay Maske' : 'Overlay Mask'}</span>
                  <input
                    type="checkbox"
                    checked={!!localButton.buttonImageOverlay}
                    onChange={(e) => updateButton({ buttonImageOverlay: e.target.checked })}
                    className="accent-[#A855F7] h-4 w-4 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2) BILD-EFFEKTE */}
      {localButton.imageUrl && (
        <div className="border-t border-stone-800/80 pt-4 space-y-4">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Sparkles size={14} className="text-[#A855F7]" />
            {lang === 'de' ? 'Bild-Effekte' : 'Image Effects'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Abdunkeln' : 'Overlay Darken'}
                </label>
                <span className="text-[10px] text-[#A855F7] font-extrabold">{localButton.imageDarken ?? 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={localButton.imageDarken ?? 0}
                onChange={(e) => updateButton({ imageDarken: parseInt(e.target.value) })}
                className="w-full accent-[#A855F7]"
                id="button-image-darken-slider"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                  {lang === 'de' ? 'Sättigung' : 'Saturation'}
                </label>
                <span className="text-[10px] text-[#A855F7] font-extrabold">{localButton.imageSaturation ?? 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={localButton.imageSaturation ?? 100}
                onChange={(e) => updateButton({ imageSaturation: parseInt(e.target.value) })}
                className="w-full accent-[#A855F7]"
                id="button-image-saturation-slider"
              />
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* 3) FARBMODUS: VOLLFARBE ODER VERLAUF */}
      {(!subSection || subSection === 'face_color') && (
        <div className="border-t border-stone-800/80 pt-4 space-y-4">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.Palette size={14} className="text-[#A855F7]" />
          {lang === 'de' ? 'Farbmodus' : 'Color Mode'}
        </h4>

        {/* Toggle between Solid and Gradient */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-xl border border-stone-850">
          <button
            type="button"
            onClick={() => updateButton({ bgMode: 'solid' })}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeBgMode === 'solid'
                ? 'bg-[#A855F7] text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LucideIcons.Maximize size={13} />
            <span>{lang === 'de' ? 'Vollfarbe' : 'Solid color'}</span>
          </button>
          <button
            type="button"
            onClick={() => updateButton({ bgMode: 'gradient' })}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeBgMode === 'gradient'
                ? 'bg-[#A855F7] text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LucideIcons.TrendingUp size={13} />
            <span>{lang === 'de' ? 'Verlauf' : 'Gradient'}</span>
          </button>
        </div>

        {/* Dynamic configuration options */}
        {activeBgMode === 'solid' ? (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1.5">
                {lang === 'de' ? 'Hintergrundfarbe' : 'Background Color'}
              </label>
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-stone-800 shrink-0 bg-stone-950">
                  <input
                    type="color"
                    value={localButton.bgColor || '#1C1917'}
                    onChange={(e) => updateButton({ bgColor: e.target.value })}
                    className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-[1.5]"
                    id="button-background-color-picker"
                  />
                </div>
                <input
                  type="text"
                  value={(localButton.bgColor || '#1C1917').toUpperCase()}
                  onChange={(e) => updateButton({ bgColor: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-grow bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#A855F7] uppercase"
                />
              </div>
            </div>

            {/* Schnellfarben (Custom Grid) */}
            <div>
              <label className="block text-[9px] uppercase font-bold text-stone-500 tracking-wider mb-1.5">
                {lang === 'de' ? 'Schnellfarben' : 'Preset Colors'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {solidColors.map((sc) => (
                  <button
                    key={sc.val}
                    type="button"
                    onClick={() => updateButton({ bgColor: sc.val })}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition cursor-pointer text-left truncate ${
                      (localButton.bgColor || '').toLowerCase() === sc.val.toLowerCase()
                        ? 'border-[#A855F7] bg-[#A855F7]/10 text-white'
                        : 'border-stone-850 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-md shrink-0 border border-black/10" style={{ backgroundColor: sc.val }} />
                    <span className="truncate">{sc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1.5">
                  {lang === 'de' ? 'Farbe 1' : 'Color 1'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-800 shrink-0 bg-stone-950">
                    <input
                      type="color"
                      value={localButton.bgColor || '#1C1917'}
                      onChange={(e) => updateButton({ bgColor: e.target.value })}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-[1.5]"
                    />
                  </div>
                  <input
                    type="text"
                    value={(localButton.bgColor || '#111').toUpperCase()}
                    onChange={(e) => updateButton({ bgColor: e.target.value })}
                    className="w-full bg-[#161616] border border-stone-800 rounded-lg px-2 py-1 text-[10px] text-stone-200 font-mono focus:outline-none focus:border-[#A855F7] uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1.5">
                  {lang === 'de' ? 'Farbe 2' : 'Color 2'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stone-800 shrink-0 bg-stone-950">
                    <input
                      type="color"
                      value={localButton.gradientColor || '#A855F7'}
                      onChange={(e) => updateButton({ gradientColor: e.target.value })}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-[1.5]"
                    />
                  </div>
                  <input
                    type="text"
                    value={(localButton.gradientColor || '#A855F7').toUpperCase()}
                    onChange={(e) => updateButton({ gradientColor: e.target.value })}
                    className="w-full bg-[#161616] border border-stone-800 rounded-lg px-2 py-1 text-[10px] text-stone-200 font-mono focus:outline-none focus:border-[#A855F7] uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Verlaufsrichtung dropdown design */}
            <div>
              <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1.5">
                {lang === 'de' ? 'Richtung' : 'Direction'}
              </label>
              <select
                value={localButton.gradientDirection || 'to-bottom'}
                onChange={(e) => updateButton({ gradientDirection: e.target.value as any })}
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none cursor-pointer"
              >
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {lang === 'de' ? d.de : d.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 4) TRANSPARENZ / GLAS & GRUNDFORM */}
      {(!subSection || subSection === 'face_glass') && (
        <>
          <div className="border-t border-stone-800/80 pt-4 space-y-4">
          {/* Deckkraft inside the design area */}
          <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
              {lang === 'de' ? 'Flächen-Deckkraft' : 'Opacity'}
            </label>
            <span className="text-[10px] text-[#A855F7] font-extrabold">{localButton.opacity ?? 100}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={localButton.opacity ?? 100}
            onChange={(e) => updateButton({ opacity: parseInt(e.target.value) })}
            className="w-full accent-[#A855F7]"
            id="button-opacity-slider"
          />
        </div>
      </div>

      {/* 4) BUTTONFLÄCHE-GRUNDFORM */}
      <div className="border-t border-stone-800/80 pt-4 space-y-4">
        <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <LucideIcons.Layers size={14} className="text-[#A855F7]" />
          {lang === 'de' ? 'Base-Schnitt & Padding' : 'Layout & Padding'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                {lang === 'de' ? 'Breiten-Modus' : 'Width Mode'}
              </label>
            </div>
            <select
              value={(localButton.imagePosition as any) === 'background' ? 'full' : (localButton.imagePosition || 'full')}
              onChange={(e) => updateButton({ imagePosition: e.target.value as any })}
              className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-2 text-xs text-stone-200 focus:outline-none"
            >
              <option value="full">{lang === 'de' ? 'Volle Breite (Full-width)' : 'Full width'}</option>
              <option value="auto">{lang === 'de' ? 'Automatisch anpassen (Auto)' : 'Auto scale'}</option>
              <option value="compact">{lang === 'de' ? 'Kompakt / Boxed (Compact)' : 'Compact'}</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                {lang === 'de' ? 'Text-Padding (Innenabstand)' : 'Inner padding'}
              </label>
              <span className="text-[10px] text-stone-400 font-bold">{localButton.textPadding ?? 8}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              value={localButton.textPadding ?? 8}
              onChange={(e) => updateButton({ textPadding: parseInt(e.target.value) })}
              className="w-full accent-[#A855F7]"
              id="button-inner-padding-slider"
            />
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
