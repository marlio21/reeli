/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { TRANSLATIONS } from '../translations';
import { Card } from '../types';

interface LandingPageProps {
  lang: 'de' | 'en';
  setLang: (l: 'de' | 'en') => void;
  onEnterDashboard: () => void;
  onGoToRoute: (r: string) => void;
}

const UPlayIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <div
    className="relative rounded-[24%] bg-gradient-to-br from-[#171717] via-[#26221c] to-[#0b0b0b] border border-[#E9D8A6]/35 shadow-[0_18px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] flex items-center justify-center overflow-hidden"
    style={{ width: size, height: size }}
    aria-label="ureel icon"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_70%_80%,rgba(232,196,106,0.18),transparent_38%)]" />
    <div className="relative flex items-center gap-[-2px]">
      <span className="text-[#F7EFE0] font-black leading-none tracking-[-0.12em]" style={{ fontSize: size * 0.58 }}>U</span>
      <span className="ml-[-2px] w-0 h-0 border-y-[10px] border-y-transparent border-l-[15px] border-l-[#F0C45D] drop-shadow-[0_0_14px_rgba(240,196,93,0.45)]" />
    </div>
  </div>
);


const getYoutubeId = (url?: string): string => {
  if (!url) return '';
  const match = url.trim().match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
};

const withYouTubeCaptionsDisabled = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cc_load_policy=0&disablekb=1&fs=0`;
};

const getYoutubeThumbnail = (url?: string): string => {
  const id = getYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
};

const resolveShowcaseMedia = (card?: Card | null, directYoutubeUrl?: string, startSeconds = 0): { kind: 'youtube' | 'direct' | 'image' | 'none'; src: string; poster?: string } => {
  const directYtId = getYoutubeId(directYoutubeUrl);
  const startParam = startSeconds > 0 ? `&start=${startSeconds}` : '';
  if (directYtId) {
    return {
      kind: 'youtube',
      src: withYouTubeCaptionsDisabled(`https://www.youtube.com/embed/${directYtId}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&loop=1&playlist=${directYtId}${startParam}`),
      poster: getYoutubeThumbnail(directYoutubeUrl)
    };
  }
  if (!card) return { kind: 'none', src: '' };
  const sceneVideo = card.ureelScene?.mode === 'video' ? card.ureelScene.video?.url : '';
  const youtubeUrl = card.videoBackgroundConfig?.youtube?.url || card.videoBackgroundConfig?.youtubeUrl || sceneVideo || '';
  const uploadUrl = card.videoBackgroundConfig?.upload?.optimizedVideoUrl || card.videoBackgroundConfig?.upload?.fileUrl || card.heroVideoUrl || card.productVideoUrl || '';
  const poster = card.videoBackgroundConfig?.upload?.thumbnailUrl || card.coverImageUrl || card.heroImageUrl || card.cardBackgroundImageUrl || card.backgroundImageUrl || card.profileImageUrl || '';
  const ytId = getYoutubeId(youtubeUrl);
  if (ytId) {
    return { kind: 'youtube', src: withYouTubeCaptionsDisabled(`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&loop=1&playlist=${ytId}`), poster };
  }
  if (uploadUrl) return { kind: 'direct', src: uploadUrl, poster };
  if (poster) return { kind: 'image', src: poster };
  return { kind: 'none', src: '' };
};

const resolveShowcaseText = (item: any, _card?: Card | null) => ({
  // Landingpage texts are intentionally curated and short.
  // Public card texts can be longer and are not used in the hero sequence.
  title: item.landingTitle || item.title,
  subtitle: item.landingSubtitle || item.label,
  copy: item.landingCopy || 'Aus einem kurzen Moment entsteht eine klickbare UREEL – mit Video, Botschaft und direkter Aktion.',
});

const iconForButton = (button: any): string => {
  const value = String(button?.icon || button?.iconId || button?.actionType || '').toLowerCase();
  if (value.includes('phone') || value.includes('telefon') || value.includes('call')) return 'Phone';
  if (value.includes('mail') || value.includes('email')) return 'Mail';
  if (value.includes('web') || value.includes('globe') || value.includes('url')) return 'Globe';
  if (value.includes('folder') || value.includes('file') || value.includes('pdf') || value.includes('download')) return 'FileText';
  if (value.includes('map') || value.includes('route') || value.includes('location')) return 'MapPin';
  if (value.includes('share') || value.includes('teilen')) return 'Share2';
  if (value.includes('linkedin')) return 'Linkedin';
  return 'Sparkles';
};

const MiniUreelCard: React.FC<{
  title: string;
  subtitle: string;
  tone: 'private' | 'business' | 'gastro';
}> = ({ title, subtitle, tone }) => {
  const bg = tone === 'private'
    ? 'from-[#1b1b1b] via-[#3d3328] to-[#0d0d0d]'
    : tone === 'business'
      ? 'from-[#0e1726] via-[#242424] to-[#0c0c0c]'
      : 'from-[#21160f] via-[#70451c] to-[#110d09]';
  const accent = tone === 'gastro' ? '#F1B86A' : '#E8DCC2';
  return (
    <div className="w-[155px] h-[276px] rounded-[30px] p-2 bg-[#F5F1E8] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className={`relative w-full h-full rounded-[24px] overflow-hidden bg-gradient-to-br ${bg} text-white`}>
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.35),transparent_22%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.18),transparent_30%)]" />
        <div className="absolute top-4 left-4 right-4 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-center text-[8px] font-black uppercase tracking-[0.22em]">ureel</div>
        <div className="absolute top-[78px] left-4 right-4 text-center">
          <div className="text-[21px] font-black uppercase leading-[0.92] tracking-tight" style={{ color: accent }}>{title}</div>
          <div className="mt-2 text-[9px] leading-tight font-bold text-white/80">{subtitle}</div>
        </div>
        <div className="absolute bottom-5 left-4 right-4 grid grid-cols-3 gap-2">
          {['Phone','Mail','Share2','FileText','MapPin','UserPlus'].map((icon) => {
            const Icon = (LucideIcons as any)[icon] || LucideIcons.Circle;
            return (
              <div key={icon} className="aspect-square rounded-full bg-[#F7EFE0]/95 flex items-center justify-center shadow-lg">
                <Icon size={13} className="text-[#1b1b1b]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};




type ShowcaseTone = 'consulting' | 'hotel' | 'craft' | 'stage' | 'auto' | 'student' | 'travel';

const SHOWCASE_ITEMS: Array<{
  title: string;
  label: string;
  slug: string;
  youtubeUrl: string;
  startSeconds?: number;
  publicPath: string;
  icon: keyof typeof LucideIcons;
  tone: ShowcaseTone;
  reveal: 'reel' | 'headline' | 'buttons' | 'copy' | 'complete';
  landingTitle: string;
  landingSubtitle: string;
  landingCopy: string;
  desktopTitle: string;
  desktopSubtitle: string;
  desktopCopy: string;
  desktopPoints: string[];
}> = [
  {
    title: 'Jennifer Lawson',
    label: 'Studentin',
    slug: 'your-offer-instantly-clickable',
    youtubeUrl: 'https://youtube.com/shorts/VF41Qhgy7ik?feature=share',
    startSeconds: 4,
    publicPath: '/u/your-offer-instantly-clickable',
    icon: 'GraduationCap',
    tone: 'student',
    reveal: 'reel',
    landingTitle: 'Jennifer Lawson',
    landingSubtitle: 'Portfolio & Kontakt in Sekunden',
    landingCopy: 'Eine persönliche UREEL zeigt Profil, Motivation und Kontaktmöglichkeiten – ideal für Studium, Bewerbung und Netzwerk.',
    desktopTitle: 'Jennifer Lawson',
    desktopSubtitle: 'Studentin mit Profil',
    desktopCopy: 'Aus einem kurzen Video entsteht eine moderne persönliche Miniwebseite mit Bild, Text und direkten Kontaktaktionen.',
    desktopPoints: ['Portfolio', 'Kontakt', 'Persönlichkeit']
  },
  {
    title: 'Nadine Jersey',
    label: 'Unternehmensberaterin',
    slug: 'dein-angebot-sofort-klickbar',
    youtubeUrl: 'https://youtube.com/shorts/phgVor0F9Xw?feature=share',
    startSeconds: 4,
    publicPath: '/u/dein-angebot-sofort-klickbar',
    icon: 'BriefcaseBusiness',
    tone: 'consulting',
    reveal: 'reel',
    landingTitle: 'Nadine Jersey',
    landingSubtitle: 'Beratung klar präsentieren',
    landingCopy: 'Ein professionelles Reel wird zur strukturierten Beratungsvorstellung – mit Angebot, Kontakt und Miniwebseite.',
    desktopTitle: 'Strategie sichtbar machen',
    desktopSubtitle: 'Beratung. Vertrauen. Kontakt.',
    desktopCopy: 'Die Desktop-Miniwebseite bündelt Profil, Nutzen und Handlungsmöglichkeiten in einer klaren Präsentation.',
    desktopPoints: ['Expertise', 'Anfrage', 'Termin']
  },
  {
    title: 'MX9',
    label: 'Automarke',
    slug: 'dein-angebot-sofort-klickbar-6',
    youtubeUrl: 'https://youtube.com/shorts/UQEDw9BCDPo?feature=share',
    startSeconds: 4,
    publicPath: '/u/dein-angebot-sofort-klickbar-6',
    icon: 'Car',
    tone: 'auto',
    reveal: 'headline',
    landingTitle: 'Der neue MX9',
    landingSubtitle: 'Produkt, Anfrage und Termin',
    landingCopy: 'Ein Produktvideo wird zur klickbaren Präsentation mit Highlights, Anfrage-Button und direktem Kontakt.',
    desktopTitle: 'Der neue MX9',
    desktopSubtitle: 'Top Performance. Pure Electric.',
    desktopCopy: 'Elektrisch, edel und schnell: In 4 Sekunden von 0 auf 100 – mit hochwertigem Innenraum und moderner Technologie.',
    desktopPoints: ['E-Auto', '0–100 in 4 s', 'Edles Interieur']
  },
  {
    title: 'Irene Hager',
    label: 'Tischlerei',
    slug: 'dein-angebot-sofort-klickbar-4',
    youtubeUrl: 'https://youtube.com/shorts/nJi-Fl3u57o?feature=share',
    startSeconds: 4,
    publicPath: '/u/dein-angebot-sofort-klickbar-4',
    icon: 'Hammer',
    tone: 'craft',
    reveal: 'headline',
    landingTitle: 'Tischlerei Irene Hager',
    landingSubtitle: 'Handwerk sichtbar machen',
    landingCopy: 'Ein Werkstattmoment wird zur digitalen Präsentation für Möbel, Kurse, Anfragen und direkte Kontakte.',
    desktopTitle: 'Möbelmanufaktur',
    desktopSubtitle: 'Von Hand gefertigt',
    desktopCopy: 'Die Desktopseite zeigt Leistung, Bildwelt und Kontaktmöglichkeiten – sauber aus derselben UREEL-Karte.',
    desktopPoints: ['Maßarbeit', 'Restaurierung', 'Kurse']
  },

];

const toneBackground: Record<ShowcaseTone, string> = {
  consulting: 'from-[#1a1714] via-[#4b4036] to-[#0b0b0b]',
  hotel: 'from-[#20150f] via-[#75512d] to-[#0a0806]',
  craft: 'from-[#1c120a] via-[#604022] to-[#0d0906]',
  stage: 'from-[#16081c] via-[#4a1b58] to-[#09050b]',
  auto: 'from-[#07101a] via-[#26394c] to-[#05070a]',
  student: 'from-[#10151f] via-[#514333] to-[#08090b]',
  travel: 'from-[#062023] via-[#0f5f67] to-[#061012]'
};

const MARKETING_STORIES = [
  {
    audience: 'Schüler & Studenten',
    title: 'Teile dein Profil. Öffne Türen.',
    text: 'Mit einer UREEL wird ein kurzer Moment zu deinem digitalen Profil – mit Projekten, Portfolio, Dokumenten und Kontakt auf einen Blick.',
    image: '/landing/students-share-ureel.webp',
    icon: 'GraduationCap'
  },
  {
    audience: 'Business & Netzwerken',
    title: 'Aus einem Gespräch wird ein starker Eindruck.',
    text: 'Teile Expertise, Referenzen und direkte Kontaktwege in einer Präsentation, die professionell wirkt und in Erinnerung bleibt.',
    image: '/landing/business-share-ureel.webp',
    icon: 'BriefcaseBusiness'
  },
  {
    audience: 'Unternehmer & Selbstständige',
    title: 'Präsentiere Leistung, Produkt und Persönlichkeit.',
    text: 'Zeige Kunden sofort, wer du bist, was du anbietest und wie sie dich erreichen – per QR, Link oder NFC.',
    image: '/landing/entrepreneur-share-ureel.webp',
    icon: 'UserRound'
  }
];

const LANDING_TRANSLATION_KEYS = {
  de: {
    shareKicker: 'Teilen. Verbinden. Beeindrucken.',
    shareHeadline: 'UREEL tauschen. Chancen schaffen.',
    shareText: 'Mit einem Scan oder Klick wird aus einem Gespräch eine Präsentation: für Vereine, Schulen, Unternehmen, Messen, Produkte, Praxen, Sportclubs und persönliche Profile.',
    casesKicker: 'UREEL in Aktion',
    casesHeadline: 'Eine Karte. Zwei Erlebnisse.',
    casesText: 'Auf dem Smartphone entsteht Aufmerksamkeit. Auf dem Desktop entsteht die vollständige Miniwebseite – für Persönlichkeit, Produkt, Verein oder Unternehmen.',
    explainHeadline: 'Mehr als eine digitale Visitenkarte.',
    explainText: 'Eine UREEL verbindet Video, Botschaft, Buttons, QR-Code, Teilen und Desktop-Miniwebseite in einer einzigen Präsentation.',
    upgradesHeadline: 'Starte einfach. Wachse mit deinen Möglichkeiten.',
    upgradesText: 'Von der ersten kostenlosen UREEL bis zur professionellen Business-Präsentation mit Showcases, Domains und Erweiterungen.'
  },
  en: {
    shareKicker: 'Share. Connect. Impress.',
    shareHeadline: 'Exchange UREELs. Create opportunities.',
    shareText: 'With one scan or click, a conversation becomes a presentation: for clubs, schools, businesses, trade fairs, products, practices, sport teams and personal profiles.',
    casesKicker: 'UREEL in action',
    casesHeadline: 'One card. Two experiences.',
    casesText: 'On mobile, UREEL creates attention. On desktop, it becomes a complete mini website for your personality, product, club or business.',
    explainHeadline: 'More than a digital business card.',
    explainText: 'A UREEL combines video, message, buttons, QR code, sharing and desktop mini website in one presentation.',
    upgradesHeadline: 'Start simple. Grow with your needs.',
    upgradesText: 'From your first free UREEL to professional business presentations with showcases, domains and upgrades.'
  }
};

const LandingMiniUreelPreview: React.FC<{ item: typeof SHOWCASE_ITEMS[number]; index: number; card?: Card | null; loading?: boolean }> = ({ item, index, card, loading }) => {
  const FallbackIcon = (LucideIcons as any)[item.icon] || LucideIcons.Sparkles;
  const media = resolveShowcaseMedia(card, item.youtubeUrl, item.startSeconds || 4);
  const text = resolveShowcaseText(item, card);
  const activeButtons = (card?.buttons || []).filter((button) => button?.isActive !== false).slice(0, 6);
  const demoButtons = activeButtons.length > 0 ? activeButtons : [
    { title: 'Anruf', actionType: 'phone', icon: 'Phone' },
    { title: 'Web', actionType: 'url', icon: 'Globe' },
    { title: 'Mail', actionType: 'email', icon: 'Mail' },
    { title: 'Info', actionType: 'file', icon: 'FileText' },
    { title: 'Teilen', actionType: 'share', icon: 'Share2' },
    { title: 'Kontakt', actionType: 'contact', icon: 'UserPlus' }
  ];
  const showHeadline = index >= 2;
  const showButtons = index >= 4;
  const showCopy = index >= 6;
  const isComplete = index >= 7;
  const showReelOnly = index < 2;

  return (
    <motion.div
      key={`${item.slug}-${card?.cardId || 'fallback'}-${index}`}
      initial={{ opacity: 0, scale: 1.012, y: 8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`absolute inset-0 overflow-hidden bg-gradient-to-br ${toneBackground[item.tone]}`}
    >
      <div className="absolute inset-0 bg-black/20" />
      {media.kind === 'youtube' && media.poster && (
        <div className="absolute inset-0 bg-cover bg-center opacity-80 scale-[1.12]" style={{ backgroundImage: `url(${media.poster})` }} />
      )}
      {/* YouTube is intentionally not embedded in the premium landing hero.
          We use the poster/thumbnail only and open the real UREEL via the public link.
          This prevents visible YouTube controls, pause overlays and transition jitter. */}
      {media.kind === 'direct' && (
        <video
          key={media.src}
          src={media.src}
          poster={media.poster}
          className="absolute inset-0 h-full w-full object-cover opacity-85"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {media.kind === 'image' && (
        <div className="absolute inset-0 bg-cover bg-center opacity-86" style={{ backgroundImage: `url(${media.src})` }} />
      )}
      {media.kind === 'none' && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.06 }}
          transition={{ duration: 3.15, ease: 'linear' }}
          className="absolute inset-0 opacity-85"
        >
          <div className="absolute left-[-20%] top-[12%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-[-20%] bottom-[18%] h-52 w-52 rounded-full bg-[#F2D28B]/12 blur-3xl" />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_18%,rgba(255,255,255,0.10),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.35)_38%,rgba(0,0,0,0.82))]" />

      <div className="absolute top-9 left-6 right-6 z-10 flex items-center justify-between">
        <div className="rounded-full border border-white/16 bg-black/28 px-3 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-[#F2D28B] backdrop-blur-md">{item.title}</div>
        <div className="rounded-full border border-white/12 bg-black/22 px-2 py-1 text-[8px] font-black text-white/62">0:03</div>
      </div>

      {loading && (
        <div className="absolute inset-x-8 top-[138px] z-10 rounded-[28px] border border-white/10 bg-black/20 px-5 py-8 text-center backdrop-blur-md">
          <LucideIcons.Loader2 size={38} className="mx-auto animate-spin text-[#F2D28B]" />
          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.20em] text-white/62">Live-UREEL lädt</div>
        </div>
      )}

      {false && showReelOnly && !loading && (
        <div className="absolute inset-x-8 top-[132px] z-10 rounded-[30px] border border-white/10 bg-black/18 px-6 py-8 text-center backdrop-blur-[2px]">
          <FallbackIcon size={56} className="mx-auto text-white/72" strokeWidth={1.45} />
          <div className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#F2D28B]">Live-Reel</div>
          <div className="mt-2 text-xl font-black leading-tight text-white">{text.title}</div>
        </div>
      )}

      {false && showHeadline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-[96px] left-6 right-6 z-20 text-center">
          <FallbackIcon size={34} className="mx-auto mb-4 text-white/72" strokeWidth={1.45} />
          <div className="text-[28px] font-black uppercase leading-[0.9] tracking-[-0.055em] text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)]">{text.subtitle}</div>
          <div className="mx-auto mt-4 h-px w-20 bg-[#F2D28B]/62" />
        </motion.div>
      )}

      {false && showCopy && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="absolute left-7 right-7 bottom-[132px] z-20 rounded-[22px] bg-black/34 border border-white/10 px-4 py-4 text-center backdrop-blur-xl">
          <div className="text-[8px] font-black uppercase tracking-[0.22em] text-[#F2D28B]">Werbetext</div>
          <div className="mt-2 text-[12px] font-bold leading-snug text-white/88 line-clamp-4">{text.copy}</div>
        </motion.div>
      )}

      {showButtons && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-10 left-8 right-8 z-20 grid grid-cols-3 gap-3">
          {demoButtons.map((button: any, idx: number) => {
            const iconName = iconForButton(button);
            const ButtonIcon = (LucideIcons as any)[iconName] || LucideIcons.Circle;
            return (
              <div key={button?.id || `${iconName}-${idx}`} className="aspect-square rounded-full bg-[#F8F1E5]/96 border border-[#F2D28B]/25 flex flex-col items-center justify-center gap-1 shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
                <ButtonIcon size={17} className="text-[#111]" strokeWidth={1.8} />
                {isComplete && <span className="text-[7px] font-black text-[#111]/70 uppercase tracking-wide truncate max-w-[52px]">{button?.title || button?.label || button?.actionType || 'Aktion'}</span>}
              </div>
            );
          })}
        </motion.div>
      )}

      <div className="absolute bottom-4 left-7 right-7 z-30">
        <div className="h-[2px] rounded-full bg-white/16 overflow-hidden">
          <motion.div key={`${item.slug}-${index}`} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 4.75, ease: 'linear' }} className="h-full bg-[#F2D28B]" />
        </div>
      </div>
    </motion.div>
  );
};


const LandingDesktopMiniWebsitePreview: React.FC<{ item: typeof SHOWCASE_ITEMS[number]; card?: Card | null }> = ({ item, card }) => {
  const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Sparkles;
  const media = resolveShowcaseMedia(card, item.youtubeUrl, item.startSeconds || 4);
  const points = item.desktopPoints || [];
  return (
    <motion.div
      key={`desktop-${item.slug}`}
      initial={{ opacity: 0, x: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
      className="relative w-full max-w-[430px] rounded-[30px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(242,210,139,0.12),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_45%)]" />
      <div className="relative rounded-[22px] overflow-hidden border border-white/10 bg-black/28 min-h-[260px]">
        <div className={`absolute inset-0 bg-gradient-to-br ${toneBackground[item.tone]}`} />
        {media.poster && <div className="absolute inset-0 bg-cover bg-center opacity-36 scale-110" style={{ backgroundImage: `url(${media.poster})` }} />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/36 to-black/22" />
        <div className="relative z-10 p-6 md:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#F2D28B]">
            <Icon size={12} /> Desktop-Miniwebseite
          </div>
          <h3 className="mt-5 text-3xl md:text-4xl font-black leading-[0.95] tracking-[-0.05em] text-white">{item.desktopTitle}</h3>
          <p className="mt-3 text-base font-black text-[#F2D28B]">{item.desktopSubtitle}</p>
          <p className="mt-3 max-w-[320px] text-sm leading-relaxed text-white/72 font-semibold">{item.desktopCopy}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {points.map((point) => <span key={point} className="rounded-full border border-white/12 bg-white/7 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/78">{point}</span>)}
          </div>
          <div className="mt-5 flex gap-2">
            <span className="rounded-xl bg-[#F2D28B] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-black">Kontakt</span>
            <span className="rounded-xl border border-white/14 bg-black/22 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/75">Live ansehen</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LandingHeroTransformation: React.FC = () => {
  const { getCardBySlug } = useFirebase();
  const [index, setIndex] = useState(0);
  const [cardCache, setCardCache] = useState<Record<string, Card | null>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const item = SHOWCASE_ITEMS[index];
  const activeCard = cardCache[item.slug];

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SHOWCASE_ITEMS.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const slug = item.slug;
    if (Object.prototype.hasOwnProperty.call(cardCache, slug)) return;
    setLoadingSlug(slug);
    getCardBySlug(slug, true)
      .then((card) => {
        if (!cancelled) setCardCache((current) => ({ ...current, [slug]: card || null }));
      })
      .catch((error) => {
        console.warn('Landing showcase card could not be loaded', slug, error);
        if (!cancelled) setCardCache((current) => ({ ...current, [slug]: null }));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlug((current) => current === slug ? null : current);
      });
    return () => { cancelled = true; };
  }, [item.slug, cardCache, getCardBySlug]);

  useEffect(() => {
    const next = SHOWCASE_ITEMS[(index + 1) % SHOWCASE_ITEMS.length];
    if (!next || Object.prototype.hasOwnProperty.call(cardCache, next.slug)) return;
    const t = window.setTimeout(() => {
      getCardBySlug(next.slug, true)
        .then((card) => setCardCache((current) => ({ ...current, [next.slug]: card || null })))
        .catch(() => setCardCache((current) => ({ ...current, [next.slug]: null })));
    }, 900);
    return () => window.clearTimeout(t);
  }, [index, cardCache, getCardBySlug]);

  return (
    <div className="relative grid xl:grid-cols-[300px_430px] gap-6 items-center justify-center w-full">
      <div className="relative flex flex-col items-center gap-4">
        <div className="pointer-events-none absolute -inset-8 rounded-[64px] bg-[#F2D28B]/8 blur-3xl" />
        <div className="hidden" aria-hidden="true">
          {SHOWCASE_ITEMS.map((entry) => {
            const thumb = getYoutubeThumbnail(entry.youtubeUrl);
            return thumb ? <img key={entry.slug} src={thumb} alt="" /> : null;
          })}
        </div>
        <div className="relative w-[278px] h-[548px] rounded-[42px] border border-white/12 bg-white/[0.028] p-[3px] shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm">
          <div className="relative h-full rounded-[38px] overflow-hidden bg-[#070707] text-white ring-1 ring-white/7">
            <div className="absolute top-0 left-1/2 z-40 -translate-x-1/2 w-24 h-5 rounded-b-2xl bg-[#050505]/96 border-x border-b border-white/8" />
            <LandingMiniUreelPreview item={item} index={index} card={activeCard || null} loading={loadingSlug === item.slug && activeCard === undefined} />
            <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_24%,transparent_72%,rgba(255,255,255,0.04))]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {SHOWCASE_ITEMS.map((entry, i) => (
            <button key={entry.slug} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-[#F2D28B]' : 'w-2 bg-white/22 hover:bg-white/40'}`} aria-label={`Showcase ${entry.title}`} />
          ))}
        </div>
        <a href={item.publicPath || `/u/${item.slug}`} className="rounded-full border border-[#F2D28B]/25 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#F6E2A5] hover:bg-[#F2D28B] hover:text-black transition-colors">Live ansehen: {item.title}</a>
      </div>
      <div className="hidden xl:block">
        <LandingDesktopMiniWebsitePreview item={item} card={activeCard || null} />
      </div>
      <div className="xl:hidden w-full max-w-[430px] mx-auto">
        <LandingDesktopMiniWebsitePreview item={item} card={activeCard || null} />
      </div>
    </div>
  );
};

const ShowcasePhoneSequence: React.FC = () => {
  const { getCardBySlug } = useFirebase();
  const [index, setIndex] = useState(0);
  const [cardCache, setCardCache] = useState<Record<string, Card | null>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const item = SHOWCASE_ITEMS[index];
  const activeCard = cardCache[item.slug];

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SHOWCASE_ITEMS.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const slug = item.slug;
    if (Object.prototype.hasOwnProperty.call(cardCache, slug)) return;
    setLoadingSlug(slug);
    getCardBySlug(slug, true)
      .then((card) => {
        if (cancelled) return;
        setCardCache((current) => ({ ...current, [slug]: card || null }));
      })
      .catch((error) => {
        console.warn('Landing showcase card could not be loaded', slug, error);
        if (!cancelled) setCardCache((current) => ({ ...current, [slug]: null }));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlug((current) => current === slug ? null : current);
      });
    return () => { cancelled = true; };
  }, [item.slug, cardCache, getCardBySlug]);

  // Gentle prefetch of the next card only, so the hero feels alive without loading all videos at once.
  useEffect(() => {
    const next = SHOWCASE_ITEMS[(index + 1) % SHOWCASE_ITEMS.length];
    if (!next || Object.prototype.hasOwnProperty.call(cardCache, next.slug)) return;
    const t = window.setTimeout(() => {
      getCardBySlug(next.slug, true)
        .then((card) => setCardCache((current) => ({ ...current, [next.slug]: card || null })))
        .catch(() => setCardCache((current) => ({ ...current, [next.slug]: null })));
    }, 900);
    return () => window.clearTimeout(t);
  }, [index, cardCache, getCardBySlug]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="pointer-events-none absolute -inset-8 rounded-[64px] bg-[#F2D28B]/8 blur-3xl" />
      <div className="hidden" aria-hidden="true">
        {SHOWCASE_ITEMS.map((entry) => {
          const thumb = getYoutubeThumbnail(entry.youtubeUrl);
          return thumb ? <img key={entry.slug} src={thumb} alt="" /> : null;
        })}
      </div>
      <div className="relative w-[278px] h-[548px] rounded-[42px] border border-white/12 bg-white/[0.028] p-[3px] shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm">
        <div className="relative h-full rounded-[38px] overflow-hidden bg-[#070707] text-white ring-1 ring-white/7">
          <div className="absolute top-0 left-1/2 z-40 -translate-x-1/2 w-24 h-5 rounded-b-2xl bg-[#050505]/96 border-x border-b border-white/8" />
          <LandingMiniUreelPreview item={item} index={index} card={activeCard || null} loading={loadingSlug === item.slug && activeCard === undefined} />
          <div className="absolute inset-0 z-30 pointer-events-none bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_24%,transparent_72%,rgba(255,255,255,0.04))]" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {SHOWCASE_ITEMS.map((entry, i) => (
          <button key={entry.slug} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-[#F2D28B]' : 'w-2 bg-white/22 hover:bg-white/40'}`} aria-label={`Showcase ${entry.title}`} />
        ))}
      </div>
      <a href={item.publicPath || `/u/${item.slug}`} className="rounded-full border border-[#F2D28B]/25 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#F6E2A5] hover:bg-[#F2D28B] hover:text-black transition-colors">Live ansehen: {item.title}</a>
    </div>
  );
};


const DelayedPublicIframe: React.FC<{ title: string; src: string; delayMs?: number; eager?: boolean }> = ({ title, src, delayMs = 0, eager = false }) => {
  const [visible, setVisible] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!visible) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="h-8 w-8 rounded-full border border-[#F2D28B]/35 border-t-[#F2D28B] animate-spin" />
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      className="absolute inset-0 h-full w-full border-0 bg-black"
      loading={eager ? 'eager' : 'lazy'}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
    />
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ lang, setLang, onEnterDashboard, onGoToRoute }) => {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } = useFirebase();
  const tGlobal = TRANSLATIONS[lang];
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const scrollToAuth = () => document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const landingCopy = LANDING_TRANSLATION_KEYS[lang];

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccess('');
    if (!email.trim() || !password.trim()) {
      setAuthError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      setAuthError('Bitte Namen oder Firmennamen eingeben.');
      return;
    }
    try {
      setIsAuthenticating(true);
      if (authMode === 'register') {
        await registerWithEmail(email, password, true, true, false, {
          displayName: name.trim(),
          firstName: name.trim().split(' ')[0] || name.trim(),
          lastName: name.trim().split(' ').slice(1).join(' '),
          accountType: 'business'
        });
      } else {
        await loginWithEmail(email, password);
      }
      onEnterDashboard();
    } catch (err: any) {
      const message = String(err?.message || err || '');
      if (message.includes('email-already-in-use')) setAuthError('Diese E-Mail ist bereits registriert. Bitte einloggen.');
      else if (message.includes('weak-password')) setAuthError('Das Passwort muss mindestens 6 Zeichen haben.');
      else if (message.includes('invalid-credential') || message.includes('wrong-password')) setAuthError('E-Mail oder Passwort ist nicht korrekt.');
      else setAuthError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);
      await loginWithGoogle(true, true, false);
      onEnterDashboard();
    } catch (err: any) {
      setAuthError('Google-Anmeldung fehlgeschlagen.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setAuthError('Bitte zuerst deine E-Mail-Adresse eintragen.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setResetSuccess('Passwort-Link wurde gesendet.');
      setAuthError('');
    } catch {
      setAuthError('Passwort-Link konnte nicht gesendet werden.');
    }
  };

  const approvedCases = SHOWCASE_ITEMS.slice(0, 4);
  const featuredCases = SHOWCASE_ITEMS.filter((item) => item.slug === 'dein-angebot-sofort-klickbar-6');

  const publicUrl = (path: string) => path.startsWith('http') ? path : path;
  const publicPreviewUrl = (path: string, idx = 0) => `${publicUrl(path)}${path.includes('?') ? '&' : '?'}mobilePublic=1&landingPreview=1&autoplay=1&muted=1&once=1&delay=${idx * 1000}`;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F0E6] font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_8%,rgba(242,210,139,0.13),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.06),transparent_26%),linear-gradient(180deg,#111,#050505)]" />
      <header className="relative z-30 border-b border-white/8 bg-[#0B0B0B]/82 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UPlayIcon size={54} />
            <div>
              <div className="text-2xl font-black tracking-tight">ureel.me</div>
              <div className="text-[#E8DCC2] text-sm font-bold">Aus Video wird Aktion.</div>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-black uppercase tracking-[0.18em] text-white/60">
            <a href="#beispiele" className="hover:text-white">Beispiele</a>
            <a href="#desktop" className="hover:text-white">Desktop-Webseite</a>
            <a href="#vorteile" className="hover:text-white">Vorteile</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black bg-white/5">{lang.toUpperCase()}</button>
            {user ? (
              <button onClick={onEnterDashboard} className="rounded-2xl bg-[#F2D28B] text-black px-5 py-3 text-xs font-black uppercase tracking-widest">{tGlobal.dashboard}</button>
            ) : (
              <button onClick={scrollToAuth} className="rounded-2xl bg-[#F2D28B] text-black px-5 py-3 text-xs font-black uppercase tracking-widest">Kostenlos starten</button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 lg:py-18 grid xl:grid-cols-[0.92fr_0.92fr_0.78fr] gap-9 items-center min-h-[calc(100vh-88px)]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DCC2]/22 bg-white/[0.035] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#E8DCC2]">
              <LucideIcons.Sparkles size={14} /> Klickbare Smartphone-Werbekarten
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.92] tracking-[-0.06em]">
              Aus Video wird <span className="text-[#F2D28B]">Aktion.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl">
              Dein Reel wird zur klickbaren Präsentation – mit Smartphone-Karte, Buttons, QR-Code und Desktop-Miniwebseite.
            </p>
            <div className="grid gap-3 text-sm font-bold text-white/76">
              {[
                'Video als starker erster Eindruck',
                'Die echte UREEL läuft exakt wie konfiguriert',
                'Desktop-Webseite automatisch dabei'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-[#F2D28B] text-black flex items-center justify-center"><LucideIcons.Check size={15} /></span>{item}</div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={scrollToAuth} className="rounded-2xl bg-[#F2D28B] text-black px-7 py-4 text-sm font-black uppercase tracking-widest">Kostenlos starten</button>
              <a href="#beispiele" className="rounded-2xl border border-white/16 bg-white/[0.035] px-7 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">Live ansehen <LucideIcons.Play size={16} /></a>
            </div>
          </motion.div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-10 rounded-[64px] bg-[#F2D28B]/7 blur-3xl" />
            <div className="relative w-[306px] h-[620px] rounded-[46px] border border-white/16 bg-white/[0.035] p-[4px] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
              <div className="relative h-full rounded-[42px] overflow-hidden bg-black ring-1 ring-white/8">
                <iframe
                  title="Nadine Jersey UREEL"
                  src={publicUrl('/u/dein-angebot-sofort-klickbar')}
                  className="absolute inset-0 h-full w-full border-0 bg-black"
                  loading="eager"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                />
              </div>
            </div>
            <a href="/u/dein-angebot-sofort-klickbar" className="absolute -bottom-11 rounded-full border border-[#F2D28B]/25 bg-black/55 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#F6E2A5] hover:bg-[#F2D28B] hover:text-black transition-colors">Live ansehen: Nadine Jersey</a>
          </div>

          <div id="auth-box" className="rounded-[30px] bg-[#151515]/86 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.42)] p-6 md:p-7 backdrop-blur-xl">
            <div className="flex rounded-2xl bg-white/5 p-1 mb-6">
              <button onClick={() => setAuthMode('login')} className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest ${authMode === 'login' ? 'bg-[#F6F0E6] text-black' : 'text-white/60'}`}>Einloggen</button>
              <button onClick={() => setAuthMode('register')} className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest ${authMode === 'register' ? 'bg-[#F6F0E6] text-black' : 'text-white/60'}`}>Registrieren</button>
            </div>
            <h2 className="text-2xl font-black mb-1">{authMode === 'login' ? 'Willkommen zurück' : 'Starte deine UREEL'}</h2>
            <p className="text-sm text-white/55 mb-6">{authMode === 'login' ? 'Melde dich an und öffne dein Studio.' : 'Konto erstellen und direkt mit deiner ersten Karte loslegen.'}</p>
            <form onSubmit={handleEmailAction} className="space-y-4">
              {authMode === 'register' && (
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name oder Firma" className="w-full rounded-2xl bg-black/35 border border-white/12 px-4 py-4 text-sm font-bold outline-none focus:border-[#F2D28B]" />
              )}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail-Adresse" className="w-full rounded-2xl bg-black/35 border border-white/12 px-4 py-4 text-sm font-bold outline-none focus:border-[#F2D28B]" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" className="w-full rounded-2xl bg-black/35 border border-white/12 px-4 py-4 text-sm font-bold outline-none focus:border-[#F2D28B]" />
              {authError && <div className="rounded-xl bg-red-500/12 border border-red-500/20 p-3 text-xs font-bold text-red-200">{authError}</div>}
              {resetSuccess && <div className="rounded-xl bg-emerald-500/12 border border-emerald-500/20 p-3 text-xs font-bold text-emerald-200">{resetSuccess}</div>}
              <button disabled={isAuthenticating} className="w-full rounded-2xl bg-[#F2D28B] text-black px-5 py-4 text-sm font-black uppercase tracking-widest disabled:opacity-60">
                {isAuthenticating ? 'Bitte warten…' : authMode === 'login' ? 'Einloggen' : 'Kostenlos registrieren'}
              </button>
              <button type="button" onClick={handleGoogleLogin} className="w-full rounded-2xl border border-white/14 bg-white/5 px-5 py-4 text-sm font-black flex justify-center gap-2"><LucideIcons.Chrome size={18}/> Mit Google starten</button>
              {authMode === 'login' && <button type="button" onClick={handlePasswordReset} className="w-full text-xs text-[#F2D28B] font-bold">Passwort vergessen?</button>}
            </form>
          </div>
        </section>

        <section id="desktop" className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/8">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F2D28B] mb-3">Smartphone + Desktop</div>
            <h2 className="text-3xl md:text-6xl font-black tracking-[-0.055em] leading-[0.95]">Ein Reel. Eine Präsentation.</h2>
            <p className="mt-5 text-lg text-white/62 font-semibold leading-relaxed">Links läuft die echte UREEL-Karte. Rechts sieht man dieselbe Idee als multifunktionale Desktop-Miniwebseite – klar, hochwertig und sofort verständlich.</p>
          </div>
          <div className="space-y-10">
            {featuredCases.map((item) => (
              <article key={item.slug} className="grid lg:grid-cols-[360px_1fr] gap-7 items-start rounded-[38px] border border-white/10 bg-white/[0.028] p-5 md:p-7 overflow-hidden">
                <div>
                  <div className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.20em] text-[#F2D28B]">Mobile Version – perfekt für unterwegs</div>
                  <div className="mx-auto relative w-[260px] h-[520px] rounded-[40px] border border-white/14 bg-white/[0.025] p-[3px] shadow-2xl">
                    <div className="relative h-full rounded-[36px] overflow-hidden bg-black ring-1 ring-white/8">
                      <iframe title={`${item.title} mobile`} src={publicPreviewUrl(item.publicPath)} className="absolute inset-0 h-full w-full border-0 bg-black" loading="eager" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.20em] text-[#F2D28B]">Desktop-Version – deine multifunktionale Miniwebseite</div>
                  <div className="relative rounded-[30px] border border-white/10 bg-black/24 overflow-hidden min-h-[420px] shadow-[0_22px_70px_rgba(0,0,0,0.28)] flex items-center justify-center">
                    <img
                      src={item.slug === 'dein-angebot-sofort-klickbar-6' ? '/landing/auto-desktop-showcase.webp' : '/landing/jennifer-desktop-showcase.webp'}
                      alt={`${item.title} Desktop-Webseite`}
                      className="w-full h-auto max-h-[560px] object-contain object-center"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-black/8 pointer-events-none" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F2D28B] mb-3">Video oder Bild</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-[-0.055em] leading-[0.98]">Dein Inhalt bestimmt den Auftritt.</h2>
              <p className="mt-5 text-lg text-white/64 font-semibold leading-relaxed">Starte mit einem Reel, einem Bild oder einer Kombination aus beidem. UREEL macht daraus eine teilbare Präsentation mit Aktionen, QR-Code und Desktop-Webseite.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[['Video','Ein kurzer Spot erzeugt Aufmerksamkeit.','Video'],['Bild','Ein starkes Bild wird zur interaktiven Karte.','Image']].map(([title, text, icon]) => {
                const Icon = (LucideIcons as any)[icon] || LucideIcons.Sparkles;
                return <div key={title} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7"><div className="w-12 h-12 rounded-2xl bg-[#F2D28B] text-black flex items-center justify-center mb-5"><Icon size={22}/></div><h3 className="font-black text-2xl mb-3">{title}</h3><p className="text-white/58 font-semibold leading-relaxed">{text}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section id="beispiele" className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-9">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F2D28B] mb-3">Live-Showcases</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Vier echte Karten. Vier Einsatzbereiche.</h2>
              <p className="mt-3 text-white/60 font-bold max-w-2xl">Alle Karten kommen aus den echten Public-View-Links. Änderungen im Studio bleiben dadurch automatisch aktuell.</p>
            </div>
            <button onClick={scrollToAuth} className="rounded-2xl bg-[#F2D28B] text-black px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Eigene UREEL starten</button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {approvedCases.map((item, i) => (
              <article key={item.slug} className="rounded-[30px] border border-white/10 bg-white/[0.035] p-4 overflow-hidden">
                <div className="relative mx-auto w-full max-w-[230px] h-[455px] rounded-[34px] border border-white/13 bg-black p-[3px]">
                  <div className="relative h-full rounded-[30px] overflow-hidden bg-black">
                    <DelayedPublicIframe title={`${item.title} loop`} src={publicPreviewUrl(item.publicPath, i)} delayMs={i * 1000} eager />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black">{item.title}</div>
                    <div className="text-xs font-bold text-white/52">{item.label}</div>
                  </div>
                  <a href={item.publicPath} className="h-10 w-10 rounded-full bg-[#F2D28B] text-black flex items-center justify-center"><LucideIcons.ArrowRight size={18}/></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/8">
          <div className="mx-auto max-w-4xl text-center mb-10">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F2D28B] mb-3">{landingCopy.shareKicker}</div>
            <h2 className="text-3xl md:text-6xl font-black tracking-[-0.055em] leading-[0.95]">{landingCopy.shareHeadline}</h2>
            <p className="mt-5 text-lg text-white/62 font-semibold leading-relaxed">{landingCopy.shareText}</p>
          </div>
          <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.03] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <img src="/landing/ureel-chancen-schaffen.webp" alt="UREEL tauschen – Chancen schaffen" className="w-full h-auto object-cover" loading="lazy" />
          </div>
          <div className="mt-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-7 md:p-9">
              <h3 className="text-2xl md:text-4xl font-black tracking-[-0.04em] leading-tight">Eine UREEL passt zu fast jeder Begegnung.</h3>
              <p className="mt-5 text-white/68 font-semibold leading-relaxed text-lg">Ob Verein, Schule, Messe, Unternehmen, Praxis, Sportclub, Einzelunternehmen, Produkt oder persönliches Profil: Eine UREEL macht sichtbar, was sonst nach einem Gespräch oft verloren geht.</p>
              <p className="mt-4 text-white/68 font-semibold leading-relaxed text-lg">Ein Scan. Ein Link. Eine Präsentation. Der andere sieht sofort, wer du bist, was du anbietest und wie er handeln kann.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Vereine & Clubs', 'Mitglieder, Sponsoren und Projekte professionell zeigen.'],
                ['Schulen & Bildung', 'Profile, Projekte und Angebote modern teilen.'],
                ['Messen & Events', 'Aus jedem Kontakt wird eine vollständige Präsentation.'],
                ['Unternehmen & Produkte', 'Angebote, Dateien, Termine und Kontakt direkt öffnen.']
              ].map(([title, text]) => (
                <div key={title} className="rounded-[26px] border border-white/10 bg-black/22 p-5">
                  <div className="text-[#F2D28B] font-black text-sm uppercase tracking-[0.12em]">{title}</div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-white/62">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="vorteile" className="max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/8">
          <div className="rounded-[38px] border border-white/10 bg-[#111]/72 p-7 md:p-10 text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F2D28B] mb-3">Vorteile</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.05em] leading-[0.98]">Lust, es selbst auszuprobieren?</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-white/62 font-semibold leading-relaxed">Erstelle deine erste UREEL kostenlos und erlebe, wie aus deinem Video eine interaktive Präsentation wird.</p>
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-left">
              {[
                ['Free','Erste UREEL erstellen und teilen.'],
                ['Pro','Mehr Design, mehr Showcases, mehr Wirkung.'],
                ['Business','Für Unternehmen, Teams und professionelle Präsentationen.']
              ].map(([plan, desc]) => (
                <div key={plan} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-2xl font-black text-white">{plan}</div>
                  <p className="mt-3 text-sm font-semibold text-white/58 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <button onClick={scrollToAuth} className="mt-8 rounded-2xl bg-[#F2D28B] text-black px-8 py-4 text-sm font-black uppercase tracking-widest">Kostenlos starten</button>
          </div>
        </section>
      </main>
    </div>
  );
};
