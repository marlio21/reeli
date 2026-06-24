/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Card, CardButton } from '../types';
import { ButtonRenderer } from './ButtonRenderer';
import { PublicMobileCardRenderer } from './PublicMobileCardRenderer';
import { UnifiedMobileLiveCardSurface } from './UnifiedMobileLiveCardSurface';
import { normalizeButtons } from '../utils/buttonUtils';

interface PublicDesktopPageRendererProps {
  card: Card;
  lang: 'de' | 'en';
  mode?: 'public' | 'studio-preview';
  qrCodeUrl?: string;
  onButtonClick?: (btn: CardButton) => void;
  onContactSave?: () => void;
  onShare?: () => void;
  onQrClick?: () => void;
  onEditText?: () => void;
}

const buildPageBackgroundStyle = (desktopPage: any): React.CSSProperties => {
  if (desktopPage.backgroundImageUrl) {
    const darken = (desktopPage.imageDarken ?? 28) / 100;
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${darken}), rgba(0,0,0,${darken})), url(${desktopPage.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {
    background: `linear-gradient(135deg, ${desktopPage.gradientFrom || '#0F0F0F'}, ${desktopPage.gradientTo || '#3A3328'})`,
  };
};

const buildButtonAreaStyle = (desktopPage: any): React.CSSProperties | undefined => {
  if (desktopPage.buttonAreaBackgroundMode === 'image' && desktopPage.buttonAreaBackgroundImageUrl && desktopPage.buttonAreaBackgroundImageUrl !== desktopPage.backgroundImageUrl) {
    const darken = (desktopPage.buttonAreaDarken ?? 28) / 100;
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${darken}), rgba(0,0,0,${darken})), url(${desktopPage.buttonAreaBackgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (desktopPage.buttonAreaBackgroundMode === 'gradient') {
    return {
      background: `linear-gradient(135deg, ${desktopPage.buttonAreaGradientFrom || '#181818'}, ${desktopPage.buttonAreaGradientTo || '#3A3328'})`,
    };
  }

  return undefined;
};

const getDesktopText = (card: Card, desktopPage: any) => ({
  title: desktopPage.contentMode === 'custom' && desktopPage.title ? desktopPage.title : (card.title || card.heroTitle || 'ureel'),
  subtitle: desktopPage.contentMode === 'custom' && desktopPage.subtitle ? desktopPage.subtitle : (card.subtitle || card.heroSubtitle || 'Aus Video wird Aktion.'),
  description: desktopPage.contentMode === 'custom' && desktopPage.description ? desktopPage.description : (card.description || card.heroDescription || ''),
});

export const PublicDesktopPageRenderer: React.FC<PublicDesktopPageRendererProps> = ({
  card,
  lang,
  mode = 'public',
  qrCodeUrl,
  onButtonClick,
  onContactSave,
  onShare,
  onQrClick,
  onEditText,
}) => {
  const desktopPage: any = (card as any).desktopPage || {};
  const layout = desktopPage.layout || 'three_columns';
  const buttonArrangement = desktopPage.buttonLayout || 'ordered';
  const buttons = normalizeButtons(card.buttons || []).filter((b: any) => b && b.isActive !== false);
  const text = getDesktopText(card, desktopPage);
  const isStudioPreview = mode === 'studio-preview';

  const columnsClass = layout === 'phone_center'
    ? (isStudioPreview ? 'grid-cols-[minmax(220px,1fr)_240px_minmax(240px,1fr)]' : 'grid-cols-3')
    : layout === 'minimal'
    ? (isStudioPreview ? 'grid-cols-[220px_minmax(240px,1fr)_minmax(220px,0.85fr)]' : 'grid-cols-3')
    : (isStudioPreview ? 'grid-cols-[250px_minmax(240px,1fr)_minmax(240px,1fr)]' : 'grid-cols-3');

  const phonePanel = (
    <section className={`${isStudioPreview ? 'flex flex-col rounded-[26px] border border-white/10 bg-black/20 p-3' : 'border-r border-white/10 p-4 lg:p-6'} h-full min-w-0 flex items-center justify-center overflow-hidden`}>
      {isStudioPreview && <span className="mb-3 text-[9px] font-black uppercase tracking-wider text-[#E8DCC2]">Smartphone-Ansicht</span>}
      <div className={isStudioPreview
        ? 'relative w-[174px] h-[310px] overflow-hidden rounded-[30px] border-[7px] border-[#1A1A1A] bg-black shadow-2xl mx-auto'
        : 'relative h-[86vh] max-h-[760px] aspect-[9/16] rounded-[34px] border-[8px] border-[#D8D2C4] bg-black shadow-2xl overflow-hidden'}>
        <UnifiedMobileLiveCardSurface
          card={card}
          lang={lang}
          isPreview={isStudioPreview}
          cleanPreview={isStudioPreview}
          previewFocus="full"
          visualMode="final"
          hideActionButtons={desktopPage.showPhoneButtons !== true}
          onButtonClick={onButtonClick}
          onContactSave={onContactSave}
          onShare={onShare}
        />
      </div>
      {isStudioPreview && <span className="mt-3 max-w-[190px] text-center text-[8px] leading-tight text-[#F5F2EA]/45">Skalierte Live-Karte ohne Text-Neuumbruch</span>}
    </section>
  );

  const textPanel = (
    <section className={`${isStudioPreview ? 'rounded-[26px] border border-white/10 bg-black/25 p-5' : 'border-r border-white/10 p-5 lg:p-7'} h-full min-w-0 flex flex-col justify-center overflow-hidden`}>
      <span className="w-fit rounded-full border border-[#E8DCC2]/35 px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-black text-[#E8DCC2]">
        {isStudioPreview ? 'Desktop Werbetext' : 'ureel.me'}
      </span>
      <h1 className={`${isStudioPreview ? 'mt-3 text-2xl md:text-3xl' : 'mt-4 text-3xl xl:text-4xl'} font-black leading-[0.98] text-[#F5F2EA] tracking-tight`}>{text.title}</h1>
      {text.subtitle && <p className={`${isStudioPreview ? 'mt-3 text-sm' : 'mt-5 text-lg xl:text-xl'} font-bold text-[#E8DCC2]`}>{text.subtitle}</p>}
      {text.description && <p className={`${isStudioPreview ? 'mt-3 text-xs' : 'mt-4 text-sm xl:text-base'} max-w-xl leading-relaxed text-[#F5F2EA]/75`}>{text.description}</p>}
      {isStudioPreview && onEditText && <button type="button" onClick={onEditText} className="mt-5 h-10 rounded-xl border border-[#E8DCC2]/35 bg-[#181818]/80 px-3 text-[9px] font-black uppercase tracking-wider text-[#F5F2EA] inline-flex items-center justify-center gap-2 self-start"><LucideIcons.Type size={12}/> Werbetexte bearbeiten</button>}
      <div className="mt-5 flex flex-wrap gap-2">
        {(desktopPage.showQr !== false) && <button type="button" onClick={onQrClick} className="h-11 px-5 rounded-2xl bg-[#F5F2EA] text-[#101010] text-[11px] font-black uppercase tracking-wider flex items-center gap-2"><LucideIcons.QrCode size={16}/> QR-Code</button>}
        {desktopPage.showShare !== false && <button type="button" onClick={onShare} className="h-11 px-5 rounded-2xl border border-[#E8DCC2]/35 text-[#F5F2EA] text-[11px] font-black uppercase tracking-wider flex items-center gap-2"><LucideIcons.Share2 size={16}/> Teilen</button>}
        {desktopPage.showContactSave !== false && <button type="button" onClick={onContactSave} className="h-11 px-5 rounded-2xl border border-[#E8DCC2]/35 text-[#F5F2EA] text-[11px] font-black uppercase tracking-wider flex items-center gap-2"><LucideIcons.Contact size={16}/> Kontakt</button>}
      </div>
      {isStudioPreview && qrCodeUrl && <span className="mt-2 text-[8px] text-[#F5F2EA]/35 break-all">{qrCodeUrl.slice(0, 42)}…</span>}
    </section>
  );

  const renderDesktopButtons = () => {
    const list = desktopPage.showActionButtons === false ? [] : buttons.slice(0, isStudioPreview ? 18 : 12);
    const roundButton = (button: any) => ({ ...button, radius: button.radius || 'pill', buttonShape: button.buttonShape || 'round', iconPosition: button.iconPosition || 'top' });

    if (list.length === 0) {
      return <div className="rounded-3xl border border-[#E8DCC2]/20 bg-black/30 p-6 text-center text-sm text-[#F5F2EA]/65">Desktop-Buttonbereich ist ausgeblendet.</div>;
    }

    if (buttonArrangement === 'circle') {
      const pos = [
        'left-[50%] top-[6%] -translate-x-1/2', 'left-[16%] top-[26%]', 'right-[16%] top-[26%]',
        'left-[16%] bottom-[26%]', 'right-[16%] bottom-[26%]', 'left-[50%] bottom-[6%] -translate-x-1/2'
      ];
      return <div className="relative h-[330px] w-full max-w-[330px] mx-auto rounded-full border border-[#E8DCC2]/15 bg-black/15">{list.slice(0,6).map((b: any, i: number) => <div key={b.id} className={`absolute ${pos[i] || pos[0]}`}><ButtonRenderer button={roundButton(b)} mode="public" lang={lang} forceSquare={true} forceSizePx={isStudioPreview ? 54 : 56}/></div>)}</div>;
    }

    if (buttonArrangement === 'triangle') {
      return <div className="grid grid-cols-3 gap-3 max-w-[330px] mx-auto place-items-center">{list.slice(0,6).map((b: any, i: number) => <div key={b.id} className={i === 0 ? 'col-start-2' : i === 4 ? 'col-start-1' : ''}><ButtonRenderer button={roundButton(b)} mode="public" lang={lang} forceSquare={true} forceSizePx={isStudioPreview ? 54 : 58}/></div>)}</div>;
    }

    if (buttonArrangement === 'compact_grid') {
      return <div className="grid grid-cols-4 gap-2 max-w-[430px] mx-auto">{list.map((b: any) => <ButtonRenderer key={b.id} button={b} mode="public" lang={lang} forceSquare={true} forceSizePx={54}/>)}</div>;
    }

    return <div className="grid grid-cols-3 gap-4 max-w-[430px] mx-auto">{list.map((b: any) => <ButtonRenderer key={b.id} button={b} mode="public" lang={lang} forceSquare={true} forceSizePx={isStudioPreview ? 56 : 58}/>)}</div>;
  };

  const buttonsPanel = (
    <section className={`${isStudioPreview ? 'rounded-[26px] border border-white/10 p-4' : 'p-5 lg:p-7'} h-full min-w-0 flex flex-col justify-center overflow-hidden`} style={buildButtonAreaStyle(desktopPage)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <span className="block w-fit rounded-full border border-[#E8DCC2]/30 px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-black text-[#E8DCC2]">Aktionen</span>
          <h2 className="mt-4 text-xl xl:text-2xl font-black text-[#F5F2EA]">Direkt verbinden</h2>
          <p className="mt-2 text-xs text-[#F5F2EA]/60">Alle wichtigen Aktionen deiner ureel auf einen Blick.</p>
        </div>
        {isStudioPreview && <span className="rounded-full bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-[#F5F2EA]/70">{buttonArrangement === 'circle' ? 'Kreis' : buttonArrangement === 'triangle' ? 'Dreieck' : buttonArrangement === 'compact_grid' ? 'Eng' : '3er Raster'}</span>}
      </div>
      {renderDesktopButtons()}
    </section>
  );

  const columns = layout === 'phone_center' ? [textPanel, phonePanel, buttonsPanel] : layout === 'minimal' ? [textPanel, phonePanel, buttonsPanel] : [phonePanel, textPanel, buttonsPanel];

  if (isStudioPreview) {
    return (
      <div className="h-full w-full overflow-hidden text-[#F5F2EA]" style={buildPageBackgroundStyle(desktopPage)}>
        <div className={`grid ${columnsClass} gap-3 items-stretch h-full overflow-hidden p-3`}>
          {columns.map((col, i) => <React.Fragment key={i}>{col}</React.Fragment>)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0B0B0B] text-[#F5F2EA]" style={buildPageBackgroundStyle(desktopPage)}>
      <div className="hidden lg:grid h-full w-full grid-cols-3">
        {columns.map((col, i) => <React.Fragment key={i}>{col}</React.Fragment>)}
      </div>
      <div className="lg:hidden">
        <PublicMobileCardRenderer
          card={card}
          lang={lang}
          onButtonClick={onButtonClick}
          onContactSave={onContactSave}
          onShare={onShare}
        />
      </div>
    </div>
  );
};
