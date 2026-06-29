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
    const darken = (desktopPage.imageDarken ?? 30) / 100;
    return {
      backgroundImage: `linear-gradient(135deg, rgba(5,5,5,${Math.min(0.88, darken + 0.22)}), rgba(22,18,12,${darken})), url(${desktopPage.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {
    background: `radial-gradient(circle at 18% 18%, rgba(232,220,194,.14), transparent 28%), linear-gradient(135deg, ${desktopPage.gradientFrom || '#0F0F0F'}, ${desktopPage.gradientTo || '#3A3328'})`,
  };
};

const buildButtonAreaStyle = (desktopPage: any): React.CSSProperties | undefined => {
  if (desktopPage.buttonAreaBackgroundMode === 'image' && desktopPage.buttonAreaBackgroundImageUrl && desktopPage.buttonAreaBackgroundImageUrl !== desktopPage.backgroundImageUrl) {
    const darken = (desktopPage.buttonAreaDarken ?? 34) / 100;
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

const getDesktopContentMedia = (card: Card, desktopPage: any) => {
  const url = desktopPage.contentMediaUrl || desktopPage.contentImageUrl || desktopPage.contentVideoUrl || desktopPage.backgroundImageUrl || (card as any).cardBackgroundImageUrl || (card as any).backgroundImageUrl || '';
  const explicitType = desktopPage.contentMediaType || (desktopPage.contentVideoUrl ? 'video' : desktopPage.contentImageUrl ? 'image' : '');
  const type = explicitType || (/\.(mp4|webm|mov)(\?|#|$)/i.test(url) ? 'video' : 'image');
  return { url, type };
};

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
  const layout = desktopPage.layout || 'phone_left';
  const buttonArrangement = desktopPage.buttonLayout || 'ordered';
  const buttons = normalizeButtons(card.buttons || [])
    .filter((b: any) => b && b.isActive !== false)
    .slice(0, 6);
  const text = getDesktopText(card, desktopPage);
  const media = getDesktopContentMedia(card, desktopPage);
  const isStudioPreview = mode === 'studio-preview';

  const columnsClass = isStudioPreview
    ? 'grid-cols-[minmax(160px,0.82fr)_minmax(210px,1fr)_minmax(205px,0.98fr)]'
    : layout === 'phone_center'
    ? 'grid-cols-[minmax(310px,0.85fr)_minmax(410px,1fr)_minmax(360px,0.9fr)]'
    : layout === 'phone_right'
    ? 'grid-cols-[minmax(380px,1.02fr)_minmax(420px,1fr)_minmax(340px,0.92fr)]'
    : 'grid-cols-[minmax(340px,0.92fr)_minmax(420px,1fr)_minmax(380px,1.02fr)]';

  const phonePanel = (
    <section className={`${isStudioPreview ? 'rounded-[26px] border border-white/10 bg-black/20 p-3' : 'border-r border-white/10 p-5 xl:p-7'} h-full min-w-0 flex flex-col items-center justify-center overflow-hidden`}>
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <div>
          <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-[#E8DCC2]">Bereich 1</span>
          <span className="block text-[11px] font-black uppercase tracking-wider text-[#F5F2EA]">Reel / Video</span>
        </div>
        <span className="rounded-full border border-[#E8DCC2]/22 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#E8DCC2]/85">ohne Kartenbuttons</span>
      </div>
      <div className={isStudioPreview
        ? 'relative w-[132px] h-[235px] overflow-hidden rounded-[24px] border-[5px] border-[#1A1A1A] bg-black shadow-2xl mx-auto'
        : 'relative h-[78vh] max-h-[760px] aspect-[9/16] overflow-hidden rounded-[36px] border-[8px] border-[#D8D2C4] bg-black shadow-2xl'}>
        <UnifiedMobileLiveCardSurface
          card={card}
          lang={lang}
          isPreview={isStudioPreview}
          cleanPreview={isStudioPreview}
          previewFocus="full"
          visualMode="final"
          timelineMode="live"
          hideActionButtons={true}
          onButtonClick={onButtonClick}
          onContactSave={onContactSave}
          onShare={onShare}
        />
      </div>
      <p className={`${isStudioPreview ? 'mt-2 text-[8px]' : 'mt-4 text-[11px]'} max-w-[260px] text-center leading-relaxed text-[#F5F2EA]/48`}>
        {lang === 'de' ? 'Die mobile Karte bleibt unverändert. Auf Desktop werden die Aktionen separat daneben bedient.' : 'The mobile card stays unchanged. On desktop, actions are controlled in a separate panel.'}
      </p>
    </section>
  );

  const renderDesktopButtons = () => {
    const list = desktopPage.showActionButtons === false ? [] : buttons;
    if (list.length === 0) {
      return <div className="rounded-3xl border border-[#E8DCC2]/20 bg-black/30 p-6 text-center text-sm text-[#F5F2EA]/65">{lang === 'de' ? 'Desktop-Buttonbereich ist ausgeblendet.' : 'Desktop action area is hidden.'}</div>;
    }

    const getActionButton = (button: any) => ({
      ...button,
      iconPosition: button.iconPosition || 'top',
      iconCircleBg: false,
    });

    const tileSize = isStudioPreview ? 48 : 78;
    const largeTileSize = isStudioPreview ? 54 : 88;

    if (buttonArrangement === 'circle') {
      const pos = [
        'left-[50%] top-[5%] -translate-x-1/2', 'left-[13%] top-[28%]', 'right-[13%] top-[28%]',
        'left-[13%] bottom-[22%]', 'right-[13%] bottom-[22%]', 'left-[50%] bottom-[4%] -translate-x-1/2'
      ];
      return <div className={`${isStudioPreview ? 'h-[255px] max-w-[255px]' : 'h-[390px] max-w-[390px]'} relative w-full mx-auto rounded-full border border-[#E8DCC2]/15 bg-black/15`}>
        {list.map((b: any, i: number) => (
          <div key={b.id} className={`absolute ${pos[i] || pos[0]}`}>
            <ButtonRenderer button={getActionButton(b)} mode="public" lang={lang} forceSquare={true} forceSizePx={tileSize}/>
          </div>
        ))}
      </div>;
    }

    if (buttonArrangement === 'compact_grid') {
      return <div className="grid grid-cols-3 gap-3 place-items-center max-w-[390px] mx-auto">
        {list.map((b: any) => <ButtonRenderer key={b.id} button={getActionButton(b)} mode="public" lang={lang} forceSquare={true} forceSizePx={tileSize}/>) }
      </div>;
    }

    return <div className="grid grid-cols-2 gap-4 place-items-center max-w-[390px] mx-auto">
      {list.map((b: any) => <ButtonRenderer key={b.id} button={getActionButton(b)} mode="public" lang={lang} forceSquare={true} forceSizePx={largeTileSize}/>) }
    </div>;
  };

  const buttonsPanel = (
    <section className={`${isStudioPreview ? 'rounded-[26px] border border-white/10 p-3' : 'border-r border-white/10 p-6 xl:p-8'} h-full min-w-0 flex flex-col justify-center overflow-hidden`} style={buildButtonAreaStyle(desktopPage)}>
      <div className={`${isStudioPreview ? 'mb-3' : 'mb-5'} flex items-start justify-between gap-3`}>
        <div>
          <span className="block w-fit rounded-full border border-[#E8DCC2]/30 px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-black text-[#E8DCC2]">Bereich 2</span>
          <h2 className={`${isStudioPreview ? 'mt-3 text-lg' : 'mt-4 text-2xl xl:text-3xl'} font-black leading-tight text-[#F5F2EA]`}>{desktopPage.buttonAreaHeadline || (lang === 'de' ? 'Aktionen bedienen' : 'Use actions')}</h2>
          <p className={`${isStudioPreview ? 'mt-1 text-[9px] line-clamp-2' : 'mt-2 text-xs'} leading-relaxed text-[#F5F2EA]/60`}>{desktopPage.buttonAreaIntro || (lang === 'de' ? 'Dieselben Kartenbuttons, aber auf Desktop als eigener Bedienbereich.' : 'The same card buttons, shown as a dedicated desktop action area.')}</p>
        </div>
        <span className="rounded-full bg-black/35 px-2 py-1 text-[8px] font-black uppercase text-[#F5F2EA]/70">max. 6</span>
      </div>
      {renderDesktopButtons()}
      <div className={`${isStudioPreview ? 'mt-3' : 'mt-6'} grid grid-cols-3 gap-2`}>
        {(desktopPage.showQr !== false) && <button type="button" onClick={onQrClick} className={`${isStudioPreview ? 'h-8 text-[7px] rounded-xl' : 'h-10 text-[9px] rounded-2xl'} bg-[#F5F2EA] text-[#101010] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5`}><LucideIcons.QrCode size={14}/> QR</button>}
        {desktopPage.showShare !== false && <button type="button" onClick={onShare} className={`${isStudioPreview ? 'h-8 text-[7px] rounded-xl' : 'h-10 text-[9px] rounded-2xl'} border border-[#E8DCC2]/35 text-[#F5F2EA] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5`}><LucideIcons.Share2 size={14}/> Teilen</button>}
        {desktopPage.showContactSave !== false && <button type="button" onClick={onContactSave} className={`${isStudioPreview ? 'h-8 text-[7px] rounded-xl' : 'h-10 text-[9px] rounded-2xl'} border border-[#E8DCC2]/35 text-[#F5F2EA] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5`}><LucideIcons.Contact size={14}/> Kontakt</button>}
      </div>
    </section>
  );

  const contentPanel = (
    <section className={`${isStudioPreview ? 'rounded-[26px] border border-white/10 bg-black/25 p-4' : 'p-6 xl:p-9'} h-full min-w-0 flex flex-col justify-center overflow-hidden`}>
      <span className="w-fit rounded-full border border-[#E8DCC2]/35 px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-black text-[#E8DCC2]">Bereich 3</span>
      <h1 className={`${isStudioPreview ? 'mt-2 text-xl' : 'mt-5 text-4xl xl:text-5xl'} font-black leading-[0.96] text-[#F5F2EA] tracking-tight`}>{text.title}</h1>
      {text.subtitle && <p className={`${isStudioPreview ? 'mt-2 text-xs' : 'mt-5 text-xl xl:text-2xl'} font-bold leading-tight text-[#E8DCC2]`}>{text.subtitle}</p>}
      {text.description && <p className={`${isStudioPreview ? 'mt-2 text-[10px] line-clamp-3' : 'mt-5 text-base xl:text-lg'} max-w-xl leading-relaxed text-[#F5F2EA]/75`}>{text.description}</p>}

      {media.url ? (
        <div className={`${isStudioPreview ? 'mt-3 h-20' : 'mt-7 h-52 xl:h-64'} overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-2xl`}>
          {media.type === 'video' ? (
            <video src={media.url} className="h-full w-full object-cover" muted playsInline controls={mode === 'public'} preload="metadata" />
          ) : (
            <img src={media.url} alt="Desktop Inhalt" className="h-full w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          )}
        </div>
      ) : (
        <div className={`${isStudioPreview ? 'mt-3 p-2' : 'mt-7 p-5'} rounded-[28px] border border-[#E8DCC2]/16 bg-[#F5F2EA]/7`}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-black/22 p-3"><LucideIcons.FileText size={isStudioPreview ? 14 : 18} className="mx-auto text-[#E8DCC2]"/><span className="mt-2 block text-[8px] font-black uppercase tracking-wider text-[#F5F2EA]/70">Text</span></div>
            <div className="rounded-2xl bg-black/22 p-3"><LucideIcons.Image size={isStudioPreview ? 14 : 18} className="mx-auto text-[#E8DCC2]"/><span className="mt-2 block text-[8px] font-black uppercase tracking-wider text-[#F5F2EA]/70">Bild</span></div>
            <div className="rounded-2xl bg-black/22 p-3"><LucideIcons.Video size={isStudioPreview ? 14 : 18} className="mx-auto text-[#E8DCC2]"/><span className="mt-2 block text-[8px] font-black uppercase tracking-wider text-[#F5F2EA]/70">Video</span></div>
          </div>
        </div>
      )}

      {isStudioPreview && onEditText && <button type="button" onClick={onEditText} className="mt-3 h-8 rounded-xl border border-[#E8DCC2]/35 bg-[#181818]/80 px-3 text-[8px] font-black uppercase tracking-wider text-[#F5F2EA] inline-flex items-center justify-center gap-2 self-start"><LucideIcons.Type size={12}/> Inhalt bearbeiten</button>}
      {isStudioPreview && qrCodeUrl && <span className="mt-3 text-[8px] text-[#F5F2EA]/35 break-all">{qrCodeUrl.slice(0, 56)}…</span>}
    </section>
  );

  const columns = layout === 'phone_center'
    ? [buttonsPanel, phonePanel, contentPanel]
    : layout === 'phone_right'
    ? [contentPanel, buttonsPanel, phonePanel]
    : layout === 'minimal'
    ? [phonePanel, buttonsPanel, contentPanel]
    : [phonePanel, buttonsPanel, contentPanel];

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
      <div className={`hidden lg:grid h-full w-full ${columnsClass}`}>
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
