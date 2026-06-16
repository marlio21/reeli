/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card } from '../../types';

interface HeroProfileImageTabProps {
  draft: any;
  updateDraft: (fields: Partial<Card>) => void;
  isUploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'heroImageUrl' | 'heroProfileImageUrl') => Promise<void>;
  lang?: 'de' | 'en';
}

export const HeroProfileImageTab: React.FC<HeroProfileImageTabProps> = ({
  draft,
  updateDraft,
  isUploading,
  handleFileUpload,
  lang = 'de',
}) => {
  const showProfile = draft.showProfileImage !== false;

  return (
    <div className="space-y-5">
      {/* 1. Toggle visibility */}
      <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-white block">
            {lang === 'de' ? 'Profilbild anzeigen' : 'Show profile image'}
          </span>
          <span className="text-[10px] text-stone-400">
            {lang === 'de' ? 'Schaltet das obere kleine Avatar/Logo Bild an/aus' : 'Toggle top avatar/logo visibility'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => updateDraft({ showProfileImage: !showProfile })}
          className={`w-10 h-6 shrink-0 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
            showProfile ? 'bg-[#A855F7]' : 'bg-stone-700'
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-stone-900 transition-transform duration-200 ${
            showProfile ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {showProfile && (
        <>
          {/* 2. File Upload Box */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {lang === 'de' ? 'Profilbild-Datei' : 'Profile Image File'}
            </span>

            <div className="border border-stone-850 bg-stone-900/40 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] text-center relative">
              {draft.heroProfileImageUrl ? (
                <div className="w-full flex items-center justify-between p-2.5 bg-stone-950/40 rounded-xl border border-stone-850">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={draft.heroProfileImageUrl} className="w-12 h-12 rounded-full object-cover bg-stone-950 border border-stone-800 shrink-0" alt="" />
                    <span className="text-[11px] text-stone-300 font-mono truncate max-w-[140px] md:max-w-[200px]">Profile-Avatar</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDraft({ heroProfileImageUrl: '' })}
                    className="text-red-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-full transition cursor-pointer"
                    title={lang === 'de' ? 'Bild entfernen' : 'Remove Image'}
                  >
                    <LucideIcons.Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative flex flex-col items-center justify-center w-full min-h-[100px] cursor-pointer">
                  <input
                    id="hero-avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'heroProfileImageUrl')}
                    disabled={isUploading !== null}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <LucideIcons.UserPlus className="text-[#A855F7]/85 mb-1.5" size={24} />
                  <span className="text-xs font-bold text-stone-200">
                    {isUploading === 'heroProfileImageUrl' ? (lang === 'de' ? 'Wird hochgeladen...' : 'Uploading...') : (lang === 'de' ? 'Avatar hochladen' : 'Upload Avatar')}
                  </span>
                  <span className="text-[9px] text-stone-500 mt-1">
                    {lang === 'de' ? 'Bevorzugt: Quadratisches Seitenverhältnis (1:1)' : 'Preferred: Square aspect ratio (1:1)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Shape selection */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-3">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {lang === 'de' ? 'Darstellungs-Schnitt' : 'Avatar Shape'}
            </span>
            <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
              {(['circle', 'square', 'rounded'] as const).map((sh) => (
                <button
                  key={sh}
                  type="button"
                  onClick={() => updateDraft({ heroImageShape: sh })}
                  className={`text-[9.5px] py-1.5 font-bold rounded uppercase transition truncate ${
                    (draft.heroImageShape || 'circle') === sh ? 'bg-[#A855F7] text-stone-950 shadow-sm font-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {sh === 'circle' ? (lang === 'de' ? 'Kreis' : 'Circle')
                    : sh === 'square' ? (lang === 'de' ? 'Quadrat' : 'Square')
                    : (lang === 'de' ? 'Abgerundet' : 'Rounded')}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Placement/Alignment buttons */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-3">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {lang === 'de' ? 'Ausrichtung' : 'Bilder-Ausrichtung'}
            </span>
            <div className="grid grid-cols-3 gap-1 bg-stone-850 p-1 rounded-lg border border-stone-750">
              {(['left', 'center', 'right'] as const).map((pl) => {
                const Icon = pl === 'left' ? LucideIcons.AlignLeft : pl === 'center' ? LucideIcons.AlignCenter : LucideIcons.AlignRight;
                return (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => updateDraft({ heroImagePlacement: pl })}
                    className={`flex items-center justify-center py-1.5 rounded transition ${
                      (draft.heroImagePlacement || 'center') === pl ? 'bg-[#A855F7] text-stone-950' : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Icon size={14} className="mr-1" />
                    <span className="text-[9.5px] font-bold uppercase">
                      {pl === 'left' ? (lang === 'de' ? 'Links' : 'Left') 
                        : pl === 'center' ? (lang === 'de' ? 'Mittig' : 'Center')
                        : (lang === 'de' ? 'Rechts' : 'Right')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Size Slider */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-3">
            <div className="flex justify-between text-[11px] font-mono text-stone-300">
              <span>{lang === 'de' ? 'Profilbild-Größe (px)' : 'Profile image size (px)'}</span>
              <span className="font-bold text-[#A855F7]">
                {(() => {
                  let currentProfileImageSize = 110;
                  if (draft.heroProfileImageSize !== undefined && draft.heroProfileImageSize !== null) {
                    currentProfileImageSize = Number(draft.heroProfileImageSize) || 110;
                  } else if (draft.heroImageSize !== undefined && draft.heroImageSize !== null) {
                    if (typeof draft.heroImageSize === 'number') {
                      currentProfileImageSize = draft.heroImageSize;
                    } else if (typeof draft.heroImageSize === 'string') {
                      const lower = (draft.heroImageSize as string).toLowerCase();
                      if (lower === 'small') currentProfileImageSize = 80;
                      else if (lower === 'medium') currentProfileImageSize = 110;
                      else if (lower === 'large') currentProfileImageSize = 160;
                      else if (lower === 'xlarge') currentProfileImageSize = 220;
                    }
                  }
                  return currentProfileImageSize;
                })()}px
              </span>
            </div>
            <input
              type="range"
              min="48"
              max="360"
              step="1"
              value={(() => {
                let currentProfileImageSize = 110;
                if (draft.heroProfileImageSize !== undefined && draft.heroProfileImageSize !== null) {
                  currentProfileImageSize = Number(draft.heroProfileImageSize) || 110;
                } else if (draft.heroImageSize !== undefined && draft.heroImageSize !== null) {
                  if (typeof draft.heroImageSize === 'number') {
                    currentProfileImageSize = draft.heroImageSize;
                  } else if (typeof draft.heroImageSize === 'string') {
                    const lower = (draft.heroImageSize as string).toLowerCase();
                    if (lower === 'small') currentProfileImageSize = 80;
                    else if (lower === 'medium') currentProfileImageSize = 110;
                    else if (lower === 'large') currentProfileImageSize = 160;
                    else if (lower === 'xlarge') currentProfileImageSize = 220;
                  }
                }
                return currentProfileImageSize;
              })()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 110;
                updateDraft({ heroProfileImageSize: val, heroImageSize: val });
              }}
              className="w-full accent-[#A855F7] cursor-pointer"
            />
          </div>

          {/* 5.5 Position fine tuning */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {lang === 'de' ? 'Profilbild-Position (Offset)' : 'Profile Image Position (Offset)'}
            </span>

            {(() => {
              let hSize = draft.heroSize || draft.heroHeight || draft.heroBackgroundSize || 'medium';
              if (hSize === 'normal') hSize = 'medium';
              if (hSize === 'compact') hSize = 'small';
              if (hSize === 'xlarge') hSize = 'large';

              let minX = -180, maxX = 180;
              let minY = -220, maxY = 220;

              if (hSize === 'small') {
                minX = -160; maxX = 160;
                minY = -140; maxY = 140;
              } else if (hSize === 'large') {
                minX = -220; maxX = 220;
                minY = -340; maxY = 340;
              }

              return (
                <div className="space-y-4">
                  {/* Horizontal Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                      <span>{lang === 'de' ? 'Horizontale Position' : 'Horizontal position'}</span>
                      <span className="font-bold text-[#A855F7]">
                        {draft.heroProfileImageX !== undefined ? draft.heroProfileImageX : (draft.heroImageXOffset || 0)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={minX}
                      max={maxX}
                      step="1"
                      value={draft.heroProfileImageX !== undefined ? draft.heroProfileImageX : (draft.heroImageXOffset || 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        updateDraft({ heroProfileImageX: val, heroImageXOffset: val });
                      }}
                      className="w-full accent-[#A855F7] cursor-pointer"
                    />
                  </div>

                  {/* Vertical Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                      <span>{lang === 'de' ? 'Vertikale Position' : 'Vertical position'}</span>
                      <span className="font-bold text-[#A855F7]">
                        {draft.heroProfileImageY !== undefined ? draft.heroProfileImageY : (draft.heroImageYOffset || 0)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={minY}
                      max={maxY}
                      step="1"
                      value={draft.heroProfileImageY !== undefined ? draft.heroProfileImageY : (draft.heroImageYOffset || 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        updateDraft({ heroProfileImageY: val, heroImageYOffset: val });
                      }}
                      className="w-full accent-[#A855F7] cursor-pointer"
                    />
                  </div>

                  {/* Reset button */}
                  <button
                    type="button"
                    onClick={() => updateDraft({
                      heroProfileImageX: 0,
                      heroImageXOffset: 0,
                      heroProfileImageY: 0,
                      heroImageYOffset: 0
                    })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-750 rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    <LucideIcons.RefreshCw size={12} className="shrink-0" />
                    <span>{lang === 'de' ? 'Position zurücksetzen' : 'Reset position'}</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* 6. Border decoration styles */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-[#A855F7] block">
              {lang === 'de' ? 'Rahmen-Einstellungen' : 'Border Settings'}
            </span>

            <div className="grid grid-cols-2 gap-4">
              {/* Width slider */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-stone-300 mb-1">
                  <span>{lang === 'de' ? 'Stärke' : 'Width'}</span>
                  <span className="text-[#A855F7] font-bold">{(draft.heroImageBorderWidth !== undefined ? draft.heroImageBorderWidth : 2)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={draft.heroImageBorderWidth !== undefined ? draft.heroImageBorderWidth : 2}
                  onChange={(e) => updateDraft({ heroImageBorderWidth: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#A855F7] cursor-pointer"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-[11px] font-mono text-stone-300 mb-1">
                  {lang === 'de' ? 'Farbe' : 'Color'}
                </label>
                <div className="flex items-center gap-1.5 bg-stone-850 border border-stone-750 rounded-lg p-1">
                  <input
                    type="color"
                    value={draft.heroImageBorderColor?.startsWith('#') ? draft.heroImageBorderColor : '#A855F7'}
                    onChange={(e) => updateDraft({ heroImageBorderColor: e.target.value })}
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-[10px] font-mono text-stone-300">
                    {draft.heroImageBorderColor || '#A855F7'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
