/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Card } from '../types';
import { ProfileHeroSection } from './ProfileHeroSection';
import { compressAndSquareImage, compressImageKeepAspect, compressImageBeforeUpload } from '../utils/image';
import { useFirebase } from '../context/FirebaseContext';
import { HeroBackgroundTab } from './profile-hero/HeroBackgroundTab';
import { HeroProfileImageTab } from './profile-hero/HeroProfileImageTab';
import { HeroTextTab } from './profile-hero/HeroTextTab';
import { MiniCardPreview } from './MiniCardPreview';

interface ProfileHeroDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: Card;
  onSave: (updates: Partial<Card>) => Promise<void>;
  lang?: 'de' | 'en';
}

const normalizeSizeToNumber = (val: string | number | undefined, defaultVal: number): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return val;
  if (val === 'normal') return defaultVal;
  const num = parseInt(val, 10);
  return isNaN(num) ? defaultVal : num;
};

const TRANSLATIONS = {
  de: {
    title: 'Profilbereich bearbeiten',
    preview: 'Vorschau',
    tabText: 'Text',
    tabBg: 'Hintergrund',
    tabImage: 'Profilbild',
    save: 'Speichern',
    cancel: 'Abbrechen',
    saved: 'Profilbereich gespeichert',
    failed: 'Profilbereich konnte nicht gespeichert werden.',
    confirmCloseTitle: 'Änderungen verwerfen?',
    confirmCloseDesc: 'Möchten Sie Ihre ungespeicherten Änderungen am Profilbereich wirklich verwerfen?',
    discard: 'Verwerfen',
    continueEditing: 'Weiter bearbeiten',
    uploading: 'Komprimierung läuft...',
  },
  en: {
    title: 'Edit profile section',
    preview: 'Preview',
    tabText: 'Text',
    tabBg: 'Background',
    tabImage: 'Profile image',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Profile section saved',
    failed: 'Profile section could not be saved.',
    confirmCloseTitle: 'Discard changes?',
    confirmCloseDesc: 'Are you sure you want to discard your unsaved changes?',
    discard: 'Discard',
    continueEditing: 'Continue editing',
    uploading: 'Compressing...',
  }
};

export const ProfileHeroDesigner: React.FC<ProfileHeroDesignerProps> = ({
  isOpen,
  onClose,
  activeCard,
  onSave,
  lang = 'de',
}) => {
  const { uploadFile } = useFirebase();
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'bg' | 'image' | 'text'>('bg');
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Draft state initialized
  const [draft, setDraft] = useState<Partial<Card>>({});

  useEffect(() => {
    if (isOpen && activeCard) {
      setDraft({
        ...activeCard,
        heroTitle: activeCard.heroTitle || activeCard.title || '',
        heroSubtitle: activeCard.heroSubtitle || activeCard.subtitle || '',
        heroDescription: activeCard.heroDescription || activeCard.description || '',
        heroCompany: activeCard.heroCompany || activeCard.companyName || '',
        heroLocation: activeCard.heroLocation || activeCard.location || '',
        heroLayout: activeCard.heroLayout || 'klassisch',
        heroBackgroundType: activeCard.heroBackgroundType || 'color',
        heroBgColor: activeCard.heroBgColor || activeCard.heroBackgroundColor || activeCard.backgroundColor || '#121212',
        heroGradient: activeCard.heroGradient || '',
        heroImageUrl: activeCard.heroImageUrl || activeCard.coverImageUrl || '',
        heroImageMode: activeCard.heroImageMode || 'cover',
        heroImagePosition: activeCard.heroImagePosition || 'center',
        heroBackgroundEnabled: activeCard.heroBackgroundEnabled !== false,
        heroBackgroundSize: activeCard.heroBackgroundSize || 'medium',
        heroVideoUrl: activeCard.heroVideoUrl || '',
        heroVideoMode: activeCard.heroVideoMode || 'auto',
        heroSaturation: activeCard.heroSaturation !== undefined ? activeCard.heroSaturation : 100,
        heroDarken: activeCard.heroDarken !== undefined ? activeCard.heroDarken : 35,
        heroTextShadow: activeCard.heroTextShadow || 'soft',
        showProfileImage: activeCard.showProfileImage !== false,
        heroProfileImageUrl: activeCard.heroProfileImageUrl || activeCard.profileImageUrl || '',
        heroImageShape: activeCard.heroImageShape || activeCard.profileImageShape || 'circle',
        heroImageSize: activeCard.heroImageSize || 110,
        heroProfileImageSize: activeCard.heroProfileImageSize !== undefined ? activeCard.heroProfileImageSize : (typeof activeCard.heroImageSize === 'number' ? activeCard.heroImageSize : 110),
        heroImagePlacement: activeCard.heroImagePlacement || activeCard.profileImagePosition || 'center',
        heroImageBorderColor: activeCard.heroImageBorderColor || '#A855F7',
        heroImageBorderWidth: activeCard.heroImageBorderWidth !== undefined ? activeCard.heroImageBorderWidth : 2,
        heroHeight: activeCard.heroHeight || activeCard.heroSize || 'normal',
        heroPadding: activeCard.heroPadding || '',
        heroRadius: activeCard.heroRadius || '16px',
        heroBorderEnabled: activeCard.heroBorderEnabled || false,
        heroBorderColor: activeCard.heroBorderColor || '#232323',
        heroBorderWidth: activeCard.heroBorderWidth !== undefined ? activeCard.heroBorderWidth : 1,
        heroShadow: activeCard.heroShadow || 'strong',
        heroGlow: activeCard.heroGlow || 'none',
        heroTextColor: activeCard.heroTextColor || 'white',
        heroTitleTextColor: activeCard.heroTitleTextColor || 'white',
        heroSubtitleTextColor: (activeCard.heroSubtitleTextColor || 'white') as any,
        heroDescTextColor: (activeCard.heroDescTextColor || 'white') as any,
        heroTitleSize: normalizeSizeToNumber(activeCard.heroTitleSize, 26),
        heroSubtitleSize: normalizeSizeToNumber(activeCard.heroSubtitleSize, 14),
        heroDescriptionSize: normalizeSizeToNumber(activeCard.heroDescriptionSize, 12),
        heroFontStyle: activeCard.heroFontStyle || 'modern',
        heroTitleFontStyle: activeCard.heroTitleFontStyle || 'modern',
        heroSubtitleFontStyle: activeCard.heroSubtitleFontStyle || 'modern',
        heroDescFontStyle: activeCard.heroDescFontStyle || 'modern',
        heroFontWeight: activeCard.heroFontWeight || 'bold',
        heroTextAlign: activeCard.heroTextAlign || 'center',
        heroTextPosition: activeCard.heroTextPosition || 'bottom',
        heroTextXOffset: activeCard.heroTextXOffset !== undefined ? activeCard.heroTextXOffset : 0,
        heroTextYOffset: activeCard.heroTextYOffset !== undefined ? activeCard.heroTextYOffset : 0,
        heroImageXOffset: activeCard.heroImageXOffset !== undefined ? activeCard.heroImageXOffset : 0,
        heroImageYOffset: activeCard.heroImageYOffset !== undefined ? activeCard.heroImageYOffset : 0,
        heroSize: (activeCard.heroSize || activeCard.heroHeight || 'normal') as any,
        heroProfileImageX: activeCard.heroProfileImageX !== undefined ? activeCard.heroProfileImageX : (activeCard.heroImageXOffset || 0),
        heroProfileImageY: activeCard.heroProfileImageY !== undefined ? activeCard.heroProfileImageY : (activeCard.heroImageYOffset || 0),
        heroGradientEnabled: activeCard.heroGradientEnabled || false,
        heroGradientColor: activeCard.heroGradientColor || '#A855F7',
        heroGradientDirection: activeCard.heroGradientDirection || 'to bottom',
      });
      setIsDirty(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, activeCard]);

  const updateDraft = (fields: Partial<Card>) => {
    setDraft((prev) => ({ ...prev, ...fields }));
    setIsDirty(true);
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'heroImageUrl' | 'heroProfileImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fieldName === 'heroImageUrl') {
      console.log("Hero background image selected", file.name);
    }

    try {
      setIsUploading(fieldName);

      if (file.size > 1.5 * 1024 * 1024) {
        showToast(lang === 'de' 
          ? 'Das Bild ist sehr groß. Wir optimieren es automatisch für deine ureel-Seite.' 
          : 'The image is very large. We will automatically optimize it for your ureel page.'
        );
        await new Promise((r) => setTimeout(r, 1200));
      }

      showToast(lang === 'de' ? 'Wird hochgeladen...' : 'Uploading...');

      let processedBlob: Blob;
      let storageType: 'background' | 'profile' = 'background';

      if (fieldName === 'heroImageUrl') {
        storageType = 'background';
        processedBlob = await compressImageBeforeUpload(file, 'hero');
      } else {
        storageType = 'profile';
        processedBlob = await compressImageBeforeUpload(file, 'profile');
      }

      const downloadUrl = await uploadFile(activeCard.cardId, processedBlob, storageType);

      if (fieldName === 'heroImageUrl') {
        console.log("Hero background image uploaded", downloadUrl);
        updateDraft({ 
          heroImageUrl: downloadUrl,
          heroBackgroundEnabled: true,
          heroBackgroundType: 'image'
        });
        showToast(lang === 'de' ? 'Hintergrundbild hochgeladen.' : 'Background image uploaded.');
      } else {
        updateDraft({ [fieldName]: downloadUrl });
        showToast(lang === 'de' ? 'Profilbild hochgeladen.' : 'Profile image uploaded.');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      if (fieldName === 'heroImageUrl') {
        showToast(lang === 'de' ? 'Hintergrundbild konnte nicht hochgeladen werden.' : 'Background image could not be uploaded.', true);
      } else {
        showToast(err?.message || 'Upload error.', true);
      }
    } finally {
      setIsUploading(null);
    }
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const savedUpdates: Partial<Card> = {
        heroTitle: draft.heroTitle,
        heroSubtitle: draft.heroSubtitle,
        heroDescription: draft.heroDescription,
        heroCompany: draft.heroCompany,
        heroLocation: draft.heroLocation,
        heroLayout: draft.heroLayout,
        heroBackgroundType: draft.heroBackgroundType,
        heroBgColor: draft.heroBgColor,
        heroGradient: draft.heroGradient,
        heroImageUrl: draft.heroImageUrl,
        heroImageMode: draft.heroImageMode,
        heroImagePosition: draft.heroImagePosition,
        heroBackgroundEnabled: draft.heroBackgroundEnabled !== false,
        heroBackgroundSize: draft.heroBackgroundSize || 'medium',
        heroVideoUrl: draft.heroVideoUrl || '',
        heroVideoMode: draft.heroVideoMode || 'auto',
        heroSaturation: draft.heroSaturation !== undefined ? draft.heroSaturation : 100,
        heroDarken: draft.heroDarken !== undefined ? draft.heroDarken : 35,
        heroTextShadow: draft.heroTextShadow || 'soft',
        showProfileImage: draft.showProfileImage,
        heroProfileImageUrl: draft.heroProfileImageUrl,
        heroImageShape: draft.heroImageShape,
        heroImageSize: draft.heroImageSize,
        heroProfileImageSize: draft.heroProfileImageSize,
        heroImagePlacement: draft.heroImagePlacement,
        heroImageBorderColor: draft.heroImageBorderColor,
        heroImageBorderWidth: draft.heroImageBorderWidth,
        heroHeight: draft.heroHeight,
        heroPadding: draft.heroPadding,
        heroRadius: draft.heroRadius,
        heroBorderEnabled: draft.heroBorderEnabled,
        heroBorderColor: draft.heroBorderColor,
        heroBorderWidth: draft.heroBorderWidth,
        heroShadow: draft.heroShadow,
        heroGlow: draft.heroGlow,
        heroTextColor: draft.heroTextColor,
        heroTitleTextColor: draft.heroTitleTextColor,
        heroSubtitleTextColor: draft.heroSubtitleTextColor,
        heroDescTextColor: draft.heroDescTextColor,
        heroTitleSize: draft.heroTitleSize,
        heroSubtitleSize: draft.heroSubtitleSize,
        heroDescriptionSize: draft.heroDescriptionSize,
        heroFontStyle: draft.heroFontStyle,
        heroTitleFontStyle: draft.heroTitleFontStyle,
        heroSubtitleFontStyle: draft.heroSubtitleFontStyle,
        heroDescFontStyle: draft.heroDescFontStyle,
        heroFontWeight: draft.heroFontWeight,
        heroTextAlign: draft.heroTextAlign,
        heroTextPosition: draft.heroTextPosition,
        heroTextXOffset: draft.heroTextXOffset !== undefined ? draft.heroTextXOffset : 0,
        heroTextYOffset: draft.heroTextYOffset !== undefined ? draft.heroTextYOffset : 0,
        heroImageXOffset: draft.heroImageXOffset !== undefined ? draft.heroImageXOffset : 0,
        heroImageYOffset: draft.heroImageYOffset !== undefined ? draft.heroImageYOffset : 0,
        heroSize: (draft.heroSize || draft.heroHeight || 'normal') as any,
        heroProfileImageX: draft.heroProfileImageX !== undefined ? draft.heroProfileImageX : 0,
        heroProfileImageY: draft.heroProfileImageY !== undefined ? draft.heroProfileImageY : 0,
        heroGradientEnabled: draft.heroGradientEnabled || false,
        heroGradientColor: draft.heroGradientColor || '#A855F7',
        heroGradientDirection: draft.heroGradientDirection || 'to bottom',
        heroFontFamily: draft.heroFontFamily || 'Inter',
      };

      // Keep default fields synced for safety list rendering
      if (draft.heroTitle !== undefined) savedUpdates.title = draft.heroTitle;
      if (draft.heroSubtitle !== undefined) savedUpdates.subtitle = draft.heroSubtitle;
      if (draft.heroDescription !== undefined) savedUpdates.description = draft.heroDescription;
      if (draft.heroProfileImageUrl !== undefined) savedUpdates.profileImageUrl = draft.heroProfileImageUrl;
      if (draft.heroImageUrl !== undefined) {
        savedUpdates.coverImageUrl = draft.heroImageUrl;
      } else {
        savedUpdates.coverImageUrl = '';
      }

      // Remove any undefined keys to sanitize firestore payload
      Object.keys(savedUpdates).forEach((key) => {
        const k = key as keyof Partial<Card>;
        if (savedUpdates[k] === undefined) {
          delete savedUpdates[k];
        }
      });

      await onSave(savedUpdates);
      showToast(t.saved);
      setIsDirty(false);
      onClose();
    } catch (err: any) {
      console.error('Error saving profile areas:', err);
      showToast(err?.message || t.failed, true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'bg', label: lang === 'de' ? 'Hintergrundbild' : 'Background Image', icon: LucideIcons.Palette, desc: lang === 'de' ? 'Bild, Sättigung' : 'Image filters' },
    { id: 'image', label: lang === 'de' ? 'Profilbild' : 'Profile Image', icon: LucideIcons.User, desc: lang === 'de' ? 'Foto & Rahmen' : 'Photo & border' },
    { id: 'text', label: lang === 'de' ? 'Text' : 'Text', icon: LucideIcons.Type, desc: lang === 'de' ? 'Titel & Schatten' : 'Fonts & shadows' },
  ] as const;

  const renderTabContents = () => {
    switch (activeTab) {
      case 'bg':
        return (
          <HeroBackgroundTab
            draft={draft}
            updateDraft={updateDraft}
            isUploading={isUploading}
            handleFileUpload={handleFileUpload}
            lang={lang}
          />
        );
      case 'image':
        return (
          <HeroProfileImageTab
            draft={draft}
            updateDraft={updateDraft}
            isUploading={isUploading}
            handleFileUpload={handleFileUpload}
            lang={lang}
          />
        );
      case 'text':
        return (
          <HeroTextTab
            draft={draft}
            updateDraft={updateDraft}
            lang={lang}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 font-sans overflow-hidden animate-fade-in">
      <div className="bg-[#0E0E0E] md:bg-stone-900 md:border md:border-stone-850 w-full h-[92vh] md:h-full md:max-w-6xl md:h-[90vh] flex flex-col rounded-t-[32px] md:rounded-[28px] overflow-hidden shadow-2xl relative">
        
        {/* Top Header */}
        <div className="px-4 md:px-5 py-2.5 md:py-4 border-b border-stone-850 shrink-0 bg-stone-950 flex items-center justify-between h-14 md:h-16">
          <button 
            type="button"
            onClick={handleCancelClick} 
            className="md:hidden text-stone-400 hover:text-white transition p-1.5 rounded-full hover:bg-stone-800 cursor-pointer"
          >
            <LucideIcons.X size={20} />
          </button>
          
          <div className="flex items-center gap-2 md:gap-2.5 flex-grow md:flex-grow-0 justify-center md:justify-start">
            <div className="w-7 h-7 rounded-full bg-[#A855F7]/10 hidden md:flex items-center justify-center border border-[#A855F7]/30">
              <LucideIcons.Sparkles className="text-[#A855F7]" size={14} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-extrabold text-white text-xs md:text-sm tracking-tight uppercase">
                {t.title}
              </h3>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleCancelClick} 
            className="hidden md:block text-stone-400 hover:text-white transition p-1.5 rounded-full hover:bg-stone-800 cursor-pointer"
          >
            <LucideIcons.X size={18} />
          </button>
          <div className="w-8 h-8 md:hidden flex items-center justify-center shrink-0" />
        </div>

        {/* Core Layout Split */}
        <div className="flex-1 flex flex-col md:flex-row-reverse overflow-hidden bg-[#0E0E0E] md:bg-[#121212]">
          
          {/* MOBILE ONLY COHESIVE PREVIEW + EDITOR TABS ROW */}
          <div className="md:hidden flex-none bg-[#0E0E0E] border-b border-stone-850 px-3 py-3 flex items-stretch gap-3 h-[210px] shrink-0 sticky top-0 z-20">
            {/* Left: Live aspect ratio container */}
            <div className="flex-1 min-w-0 bg-stone-950 rounded-2xl border border-stone-850/80 p-1 flex items-center justify-center relative overflow-hidden shadow-inner font-sans">
              <MiniCardPreview 
                card={draft} 
                lang={lang} 
                highlightArea="hero"
              />
            </div>

            {/* Right: Category buttons list */}
            <div className="w-[110px] shrink-0 flex flex-col justify-between gap-1 py-0.5" id="mobile-sections-tabs">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const active = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveTab(sec.id)}
                    className={`flex-1 flex items-center justify-start gap-2 px-2 rounded-xl border text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                      active
                        ? sec.id === 'bg'
                          ? 'border-[#A855F7] bg-[#A855F7] text-stone-950 shadow-[0_0_12px_rgba(201,166,70,0.35)] font-black scale-[1.03]'
                          : 'border-[#A855F7] bg-[#A855F7] text-stone-950 shadow-md font-black scale-[1.03]'
                        : 'border-stone-800 bg-stone-900/40 text-stone-300'
                    }`}
                  >
                    <Icon size={12} className={active ? 'text-stone-950' : 'text-[#A855F7]'} />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESKTOP-ONLY VISUAL PREVIEW & SELECTION SIDEBAR */}
          <div className="hidden md:flex w-full md:w-[380px] lg:w-[410px] shrink-0 border-b md:border-b-0 md:border-l border-stone-850 bg-[radial-gradient(circle_at_center,_#1F1F1F_0%,_#0B0B0B_100%)] flex-col justify-start p-4 md:p-6 lg:p-7 overflow-y-auto gap-4 md:gap-5 shrink-0">
            
            {/* Area Grid Selection Buttons (Now placed first/at the top) */}
            <div className="space-y-2">
              <label className="block text-center text-[10px] uppercase font-black tracking-wider text-[#A855F7]">
                {lang === 'de' ? 'Beispielbereich bearbeiten:' : 'Edit example section:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5" id="desktop-sections-tabs">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const active = activeTab === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setActiveTab(sec.id);
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        active
                          ? sec.id === 'bg'
                            ? 'border-[#A855F7] bg-[#A855F7]/10 text-white font-black scale-[1.03] shadow-[0_0_15px_rgba(201,166,70,0.25)] ring-1 ring-[#A855F7]/35'
                            : 'border-[#A855F7] bg-[#A855F7]/10 text-white font-black scale-[1.03] shadow-[0_0_10px_rgba(201,166,70,0.1)]'
                          : 'border-stone-800 bg-stone-900/40 text-stone-300 hover:border-stone-750'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg mb-1 transition ${active ? 'bg-[#A855F7] text-stone-950' : 'bg-stone-950 text-[#A855F7]'}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Box (Now placed below the tabs) */}
            <div className="flex flex-col items-center text-center bg-stone-950/40 p-4 rounded-3xl border border-stone-850/60 shadow-inner">
              <span className="text-[9px] font-black uppercase text-[#A855F7] tracking-widest bg-[#A855F7]/10 px-3 py-1 rounded-full border border-[#A855F7]/20 mb-2.5">
                {t.preview}
              </span>
              <div className={`w-full rounded-b-2xl h-[440px] rounded-t-none border shadow-lg flex items-center justify-center relative overflow-hidden bg-stone-950/20 backdrop-blur-xs transition-all duration-300 flex flex-col ${
                activeTab === 'bg' ? 'border-[#A855F7]/50 shadow-[0_0_18px_rgba(201,166,70,0.15)]' : 'border-stone-800'
              }`}>
                <MiniCardPreview 
                  card={draft} 
                  lang={lang} 
                  highlightArea="hero"
                />
              </div>
            </div>

          </div>

          {/* FLUID SETTINGS SCROLL PANEL */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-0 min-w-0 transition-all duration-300 ${
            activeTab === 'bg' ? 'ring-1 ring-[#A855F7]/25 bg-stone-950/10 shadow-[inset_0_0_20px_rgba(201,166,70,0.03)]' : ''
          }`}>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 text-[#E1E1E1]">
              
              {/* Active Section Descriptive Header */}
              <div className="mb-6 pb-4 border-b border-stone-850/60 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  activeTab === 'bg' ? 'bg-[#A855F7]/15 text-[#A855F7] shadow-[0_0_10px_rgba(201,166,70,0.15)]' : 'bg-stone-900 text-stone-400'
                }`}>
                  {activeTab === 'bg' ? <LucideIcons.Palette size={18} /> : activeTab === 'image' ? <LucideIcons.User size={18} /> : <LucideIcons.Type size={18} />}
                </div>
                <div>
                  <h4 className={`text-sm md:text-base font-black uppercase tracking-wider transition-colors duration-300 ${
                    activeTab === 'bg' ? 'text-[#A855F7]' : 'text-stone-200'
                  }`}>
                    {activeTab === 'bg' 
                      ? (lang === 'de' ? 'Profilhintergrund bearbeiten' : 'Edit profile background')
                      : activeTab === 'image' 
                        ? (lang === 'de' ? 'Profilbild bearbeiten' : 'Edit profile image')
                        : (lang === 'de' ? 'Profiltexte & Stil bearbeiten' : 'Edit profile text & style')
                    }
                  </h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {activeTab === 'bg'
                      ? (lang === 'de' ? 'Passe die Cover-Größe, Sättigung, Abdunklung oder Hintergrund-Medien an.' : 'Adjust the cover size, saturation, darken amount or background media.')
                      : activeTab === 'image'
                        ? (lang === 'de' ? 'Lade dein Profilfoto hoch, ändere Rahmen-Farbe, Größe oder Form.' : 'Upload your profile photo, change border color, size or shape.')
                        : (lang === 'de' ? 'Ändere deinen Namen, Slogan, Schriftarten, Ausrichtung und Textfarben.' : 'Change your name, slogan, font styles, alignment and text colors.')
                    }
                  </p>
                </div>
              </div>

              {renderTabContents()}
            </div>
          </div>

        </div>

        {/* Footer toolbar actions */}
        <div className="p-4 border-t border-stone-850 shrink-0 bg-stone-950 flex items-center justify-end gap-3 h-16 md:h-20">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-stone-850 hover:bg-stone-850 text-stone-300 font-bold text-xs transition duration-150 cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving || isUploading !== null}
            className="bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg transition duration-150 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <LucideIcons.Loader2 className="animate-spin" size={13} />
                {lang === 'de' ? 'Wird gespeichert...' : 'Saving...'}
              </>
            ) : (
              <>
                <LucideIcons.CheckSquare size={13} />
                {t.save}
              </>
            )}
          </button>
        </div>

        {/* Floating toast notifications */}
        {toastMessage && (
          <div id="designer-success-toast" className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-stone-950/95 border border-green-600/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 z-50 animate-bounce">
            <LucideIcons.CheckCircle size={14} className="text-green-500 flex-shrink-0" />
            <span className="text-stone-250 font-sans font-semibold text-[11px] leading-tight text-white">{toastMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div id="designer-error-toast" className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-stone-950/95 border border-red-600/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 z-50 animate-bounce">
            <LucideIcons.AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-stone-250 font-sans font-semibold text-[11px] leading-tight text-red-300">{errorMessage}</span>
          </div>
        )}

        {/* MODAL: DISCARD CONFIRM */}
        {showDiscardConfirm && (
          <div id="discard-confirm-dialog" className="absolute inset-0 bg-black/90 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up text-sans">
              <div className="text-amber-500 bg-amber-500/10 p-3 rounded-full w-fit mx-auto">
                <LucideIcons.AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="text-white font-bold text-sm tracking-tight">{t.confirmCloseTitle}</h4>
                <p className="text-stone-400 text-xs leading-relaxed">{t.confirmCloseDesc}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDirty(false);
                    onClose();
                  }}
                  className="bg-red-900 hover:bg-red-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  {t.discard}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="bg-stone-800 hover:bg-stone-750 text-stone-350 hover:text-white font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  {t.continueEditing}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
