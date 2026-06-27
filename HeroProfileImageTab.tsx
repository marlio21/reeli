import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton } from '../../types';

interface ButtonAppearanceTabProps {
  localButton: CardButton;
  updateButton: (updates: Partial<CardButton>) => void;
  lang: 'de' | 'en';
  activeCard?: Card;
  onSaveAllButtons?: (buttons: CardButton[]) => Promise<void>;
  subSection?: string;
}

export const ButtonAppearanceTab: React.FC<ButtonAppearanceTabProps> = ({
  localButton,
  updateButton,
  lang,
  activeCard,
  onSaveAllButtons,
  subSection,
}) => {
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('contact');

  return (
    <div className="space-y-6 bg-stone-900/40 p-5 rounded-2xl border border-stone-850/80">
      
      {/* 1. BUTTON-FORM */}
      {(!subSection || subSection === 'styling_shape') && (
        <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Sparkles size={14} className="text-[#A855F7]" />
            {lang === 'de' ? 'Buttonform' : 'Button shape'}
          </h4>
          <p className="text-[10px] text-stone-400 font-medium">
            {lang === 'de' ? 'Wähle die passende Eckenabrundung für deinen Button.' : 'Choose the corner roundness for your button.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'rounded', de: 'Leicht rund', en: 'Slightly rounded', radius: 'rounded' },
            { id: 'round', de: 'Pillenförmig', en: 'Pill', radius: 'pill' },
            { id: 'square', de: 'Eckig', en: 'Square', radius: 'square' },
          ].map((s) => {
            // Determine active based on compatibility matching
            const normalizedShape = localButton.buttonShape === 'round' || localButton.radius === 'pill'
              ? 'round'
              : localButton.buttonShape === 'square' || localButton.radius === 'square'
              ? 'square'
              : 'rounded';

            const isActive = normalizedShape === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  updateButton({ 
                    buttonShape: s.id,
                    radius: s.radius as any
                  });
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center relative ${
                  isActive
                    ? 'bg-[#A855F7]/10 border-[#A855F7] text-white shadow-[0_0_12px_rgba(201,166,70,0.2)]'
                    : 'bg-stone-950 border-stone-850 hover:bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                {/* Visual miniature of the shape */}
                <div 
                  className="w-8 h-4 bg-stone-750/70 border border-stone-600/80"
                  style={{
                    borderRadius: s.id === 'round' 
                      ? '999px' 
                      : s.id === 'square'
                      ? '0px'
                      : '8px'
                  }}
                />
                <span className="text-[10px] font-extrabold uppercase tracking-wide">
                  {lang === 'de' ? s.de : s.en}
                </span>
                {isActive && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 2. SYMBOL-ICON AUSSUCHEN */}
      {(!subSection || subSection === 'styling_icon') && (
        <div className="border-t border-stone-800/80 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Tv size={14} className="text-[#A855F7]" />
            {lang === 'de' ? 'Icon' : 'Icon'}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-stone-400">
              {lang === 'de' ? 'Icon anzeigen' : 'Show icon'}
            </span>
            <input
              type="checkbox"
              id="icon-enabled-toggle"
              checked={localButton.iconEnabled !== false}
              onChange={(e) => {
                const checked = e.target.checked;
                updateButton({ 
                  iconEnabled: checked,
                  icon: checked && !localButton.icon ? 'Globe' : localButton.icon
                });
              }}
              className="w-4.5 h-4.5 accent-[#A855F7] cursor-pointer"
            />
          </div>
        </div>

        {localButton.iconEnabled !== false && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-stone-400 font-bold">
                  {lang === 'de' ? 'Aktives Symbol:' : 'Selected Icon:'} <strong className="text-[#A855F7] font-mono">{localButton.icon || (lang === 'de' ? 'Keines' : 'None')}</strong>
                </span>
                {localButton.icon && (
                  <button
                    type="button"
                    onClick={() => updateButton({ icon: '' })}
                    className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <LucideIcons.Trash2 size={11} />
                    {lang === 'de' ? 'Icon entfernen' : 'Remove icon'}
                  </button>
                )}
              </div>

              <input
                type="text"
                value={iconSearchTerm}
                onChange={(e) => setIconSearchTerm(e.target.value)}
                placeholder={lang === 'de' ? 'Icon suchen... (z.B. Mail, Phone)' : 'Search icon... (e.g. Mail, Phone)'}
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-[#A855F7] mb-3"
                id="button-icon-search-input"
              />

              {/* Category Chips - Only visible if search input is empty */}
              {!iconSearchTerm && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
                  {[
                    { id: 'contact', de: 'Kontakt', en: 'Contact' },
                    { id: 'social', de: 'Social', en: 'Social' },
                    { id: 'files', de: 'Dateien', en: 'Files' },
                    { id: 'business', de: 'Business', en: 'Business' },
                    { id: 'media', de: 'Medien', en: 'Media' },
                    { id: 'action', de: 'Aktion', en: 'Action' },
                  ].map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer border ${
                          isActive
                            ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7]'
                            : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-white'
                        }`}
                      >
                        {lang === 'de' ? cat.de : cat.en}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Icon Grid with max height & scrollbar */}
              <div className="max-h-[220px] overflow-y-auto scrollbar-thin pr-1 bg-stone-950 p-2.5 rounded-xl border border-stone-850/60">
                {iconSearchTerm ? (
                  // Search view
                  <div>
                    <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block mb-2 pl-1">
                      {lang === 'de' ? 'Suchergebnisse:' : 'Search results:'}
                    </span>
                    {(() => {
                      const list: Array<{ id: string; name: string }> = [];
                      const seen = new Set<string>();
                      const term = iconSearchTerm.toLowerCase();
                      const mapping: Record<string, string[]> = {
                        contact: ['Phone', 'PhoneCall', 'Mail', 'MailOpen', 'AtSign', 'MessageCircle', 'MessageSquare', 'Contact', 'User', 'Users', 'UserPlus', 'MapPin', 'Map', 'Home', 'Calendar', 'Clock'],
                        social: ['Instagram', 'Facebook', 'Linkedin', 'Youtube', 'Twitter', 'Send', 'Share2', 'QrCode', 'ExternalLink', 'Globe', 'Github', 'Twitch', 'Slack', 'Megaphone'],
                        files: ['File', 'FileText', 'Folder', 'FolderOpen', 'Download', 'Upload', 'BookOpen', 'Bookmark', 'Clipboard', 'ClipboardList', 'Paperclip', 'Image', 'Images'],
                        business: ['Store', 'Briefcase', 'Building2', 'ShoppingBag', 'ShoppingCart', 'CreditCard', 'Coins', 'Euro', 'DollarSign', 'Percent', 'Tag', 'Award', 'TrendingUp', 'Activity', 'ShieldCheck', 'Target'],
                        media: ['Video', 'Play', 'Tv', 'Camera', 'Image', 'Music', 'Mic', 'Headphones', 'Volume2', 'Radio', 'Film', 'Podcast'],
                        action: ['Link', 'Heart', 'Star', 'Gift', 'Sparkles', 'Zap', 'CheckCircle', 'Plus', 'ArrowRight', 'ChevronRight', 'Settings', 'Sliders', 'Search', 'Bell', 'ThumbsUp', 'Flame', 'Coffee', 'Crown', 'Lightbulb', 'Smile']
                      };

                      Object.values(mapping).forEach((iconsArr) => {
                        iconsArr.forEach((id) => {
                          if (!seen.has(id) && id.toLowerCase().includes(term)) {
                            seen.add(id);
                            list.push({ id, name: id });
                          }
                        });
                      });

                      if (list.length === 0) {
                        return (
                          <div className="text-center py-6 text-stone-500 text-xs">
                            {lang === 'de' ? 'Keine passenden Symbole gefunden' : 'No matching icons found'}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-4 gap-2">
                          {list.map((ico) => {
                            const IconComp = (LucideIcons as any)[ico.id];
                            const isActive = localButton.icon === ico.id;
                            return (
                              <button
                                key={ico.id}
                                type="button"
                                onClick={() => updateButton({ icon: ico.id })}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition cursor-pointer min-h-[58px] ${
                                  isActive
                                    ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7] ring-1 ring-[#A855F7]/35'
                                    : 'border-stone-850 text-stone-400 hover:text-white hover:bg-stone-900 border-dashed'
                                }`}
                              >
                                {IconComp ? <IconComp size={16} /> : <LucideIcons.Globe size={16} />}
                                <span className="text-[7.5px] font-bold mt-1 truncate max-w-full text-center">
                                  {ico.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  // Tab category view
                  <div>
                    {(() => {
                      const mapping: Record<string, string[]> = {
                        contact: ['Phone', 'PhoneCall', 'Mail', 'MailOpen', 'AtSign', 'MessageCircle', 'MessageSquare', 'Contact', 'User', 'Users', 'UserPlus', 'MapPin', 'Map', 'Home', 'Calendar', 'Clock'],
                        social: ['Instagram', 'Facebook', 'Linkedin', 'Youtube', 'Twitter', 'Send', 'Share2', 'QrCode', 'ExternalLink', 'Globe', 'Github', 'Twitch', 'Slack', 'Megaphone'],
                        files: ['File', 'FileText', 'Folder', 'FolderOpen', 'Download', 'Upload', 'BookOpen', 'Bookmark', 'Clipboard', 'ClipboardList', 'Paperclip', 'Image', 'Images'],
                        business: ['Store', 'Briefcase', 'Building2', 'ShoppingBag', 'ShoppingCart', 'CreditCard', 'Coins', 'Euro', 'DollarSign', 'Percent', 'Tag', 'Award', 'TrendingUp', 'Activity', 'ShieldCheck', 'Target'],
                        media: ['Video', 'Play', 'Tv', 'Camera', 'Image', 'Music', 'Mic', 'Headphones', 'Volume2', 'Radio', 'Film', 'Podcast'],
                        action: ['Link', 'Heart', 'Star', 'Gift', 'Sparkles', 'Zap', 'CheckCircle', 'Plus', 'ArrowRight', 'ChevronRight', 'Settings', 'Sliders', 'Search', 'Bell', 'ThumbsUp', 'Flame', 'Coffee', 'Crown', 'Lightbulb', 'Smile']
                      };
                      const activeIcons = mapping[selectedCategory] || [];
                      return (
                        <div className="grid grid-cols-4 gap-2">
                          {activeIcons.map((icoId) => {
                            const IconComp = (LucideIcons as any)[icoId];
                            const isActive = localButton.icon === icoId;
                            return (
                              <button
                                key={icoId}
                                type="button"
                                onClick={() => updateButton({ icon: icoId })}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition cursor-pointer min-h-[58px] ${
                                  isActive
                                    ? 'bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7] ring-1 ring-[#A855F7]/35'
                                    : 'border-stone-850 text-stone-400 hover:text-white hover:bg-stone-900 border-dashed'
                                }`}
                              >
                                {IconComp ? <IconComp size={16} /> : <LucideIcons.Globe size={16} />}
                                <span className="text-[7.5px] font-bold mt-1 truncate max-w-full text-center">
                                  {icoId}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {localButton.icon && (
              <div className="space-y-4 bg-stone-950/80 p-4 rounded-xl border border-stone-850/60">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Iconfarbe' : 'Icon color'}
                    </label>
                    <input
                      type="color"
                      value={localButton.iconColor || '#1E1E1E'}
                      onChange={(e) => updateButton({ iconColor: e.target.value })}
                      className="w-full h-8 rounded-lg bg-[#161616] border border-stone-800 cursor-pointer"
                      id="button-icon-color"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider">
                        {lang === 'de' ? 'Icongröße' : 'Icon size'}
                      </label>
                      <span className="text-[9px] font-bold text-[#A855F7]">
                        {localButton.iconSize !== undefined ? localButton.iconSize : 28}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="64"
                      value={localButton.iconSize !== undefined ? localButton.iconSize : 28}
                      onChange={(e) => updateButton({ iconSize: parseInt(e.target.value, 10) })}
                      className="w-full h-8 accent-[#A855F7] cursor-pointer"
                      id="button-icon-size-slider"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Iconposition' : 'Icon position'}
                    </label>
                    <select
                      value={localButton.iconPosition || 'left'}
                      onChange={(e) => updateButton({ iconPosition: e.target.value as any })}
                      className="w-full bg-[#161616] border border-stone-800 rounded-lg py-1.5 px-2 text-xs text-stone-200 focus:outline-none"
                    >
                      <option value="left">{lang === 'de' ? 'Links' : 'Left'}</option>
                      <option value="right">{lang === 'de' ? 'Rechts' : 'Right'}</option>
                      <option value="top">{lang === 'de' ? 'Oben' : 'Top'}</option>
                      <option value="bottom">{lang === 'de' ? 'Unten' : 'Bottom'}</option>
                      <option value="center">{lang === 'de' ? 'Mittig' : 'Center'}</option>
                      <option value="background">{lang === 'de' ? 'Hintergrund' : 'Background'}</option>
                    </select>
                  </div>
                </div>

                {/* Fine Position sliders */}
                <div className="border-t border-stone-850 pt-3 space-y-3">
                  <span className="text-[9px] font-bold uppercase text-stone-450 block">
                    {lang === 'de' ? 'Feinabstimmung Position' : 'Position Fine Adjustment'}
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-[9px] text-stone-400 mb-1">
                        <span>{lang === 'de' ? 'Horizontale Iconposition' : 'Horizontal icon position'}</span>
                        <span className="text-[#A855F7] font-bold">{localButton.iconOffsetX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={localButton.iconPosition === 'background' ? -120 : -80}
                        max={localButton.iconPosition === 'background' ? 120 : 80}
                        value={localButton.iconOffsetX || 0}
                        onChange={(e) => updateButton({ iconOffsetX: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#A855F7] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] text-stone-400 mb-1">
                        <span>{lang === 'de' ? 'Vertikale Iconposition' : 'Vertical icon position'}</span>
                        <span className="text-[#A855F7] font-bold">{localButton.iconOffsetY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={localButton.iconPosition === 'background' ? -120 : -80}
                        max={localButton.iconPosition === 'background' ? 120 : 80}
                        value={localButton.iconOffsetY || 0}
                        onChange={(e) => updateButton({ iconOffsetY: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#A855F7] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateButton({ iconOffsetX: 0, iconOffsetY: 0 })}
                      className="text-[9px] font-extrabold uppercase hover:text-[#A855F7] text-stone-400 transition cursor-pointer"
                    >
                      {lang === 'de' ? 'Iconposition zurücksetzen' : 'Reset icon position'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Mini state helper block bypassing Schatten & Glow */}

      {/* 4. RAHMEN */}
      {(!subSection || subSection === 'styling_border') && (
        <>
          <div className="border-t border-stone-800/80 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-stone-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Square size={14} className="text-[#A855F7]" />
            {lang === 'de' ? 'Rahmen' : 'Border'}
          </h4>
          <input
            type="checkbox"
            checked={!!localButton.borderEnabled}
            onChange={(e) => {
              const checked = e.target.checked;
              updateButton({
                borderEnabled: checked,
                borderWidth: checked && localButton.borderWidth === 'none' ? 'thin' : localButton.borderWidth,
              });
            }}
            className="w-4.5 h-4.5 accent-[#A855F7] cursor-pointer"
            id="button-border-enabled"
          />
        </div>

        {localButton.borderEnabled && (
          <div className="space-y-3.5 p-4 bg-stone-950 border border-stone-850 rounded-2xl animate-scaleIn">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                  {lang === 'de' ? 'Rahmenstärke' : 'Border width'}
                </label>
                <select
                  value={localButton.borderWidth?.toString() || 'thin'}
                  onChange={(e) => updateButton({ borderWidth: e.target.value as any })}
                  className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
                >
                  <option value="thin">{lang === 'de' ? 'Fein' : 'Thin'}</option>
                  <option value="medium">{lang === 'de' ? 'Mittel' : 'Medium'}</option>
                  <option value="thick">{lang === 'de' ? 'Kräftig' : 'Thick'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                  {lang === 'de' ? 'Rahmenfarbe' : 'Border color'}
                </label>
                <input
                  type="color"
                  value={localButton.borderColor || '#A855F7'}
                  onChange={(e) => updateButton({ borderColor: e.target.value })}
                  className="w-full h-8 rounded-lg bg-[#161616] border border-stone-800 cursor-pointer"
                  id="button-border-color"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Rahmenstil' : 'Border style'}
              </label>
              <select
                value={localButton.borderStyle || 'solid'}
                onChange={(e) => updateButton({ borderStyle: e.target.value as any })}
                className="w-full bg-[#161616] border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
              >
                <option value="solid">{lang === 'de' ? 'Durchgezogen' : 'Solid'}</option>
                <option value="dashed">{lang === 'de' ? 'Gestrichelt' : 'Dashed'}</option>
                <option value="dotted">{lang === 'de' ? 'Gepunktet' : 'Dotted'}</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => updateButton({ borderEnabled: true, borderColor: '#A855F7', borderWidth: 'medium', borderStyle: 'solid' })}
            className="w-full bg-[#A855F7]/10 hover:bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] rounded-xl font-bold text-[10px] uppercase tracking-wider py-2.5 transition cursor-pointer text-center"
          >
            {lang === 'de' ? 'Akzentrahmen setzen (Violett)' : 'Set accent border (Purple)'}
          </button>
        </div>
      </div>
        </>
      )}

    </div>
  );
};
