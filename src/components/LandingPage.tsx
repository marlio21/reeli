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
    slug: 'mario-kozuh-schneeberger',
    youtubeUrl: 'https://youtube.com/shorts/UQEDw9BCDPo?feature=share',
    startSeconds: 4,
    publicPath: '/u/mario-kozuh-schneeberger',
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
  {
    title: 'Rednerpult',
    label: 'Event & Produkt',
    slug: 'dein-angebot-sofort-klickbar-2',
    youtubeUrl: 'https://youtube.com/shorts/fGvO5yAjxjo?',
    startSeconds: 4,
    publicPath: '/u/dein-angebot-sofort-klickbar-2',
    icon: 'Mic2',
    tone: 'stage',
    reveal: 'buttons',
    landingTitle: 'Rednerpult',
    landingSubtitle: 'Event und Produkt inszenieren',
    landingCopy: 'Ein Produkt wird nicht nur gezeigt, sondern direkt erlebbar – mit Präsentation, Kontakt und Anfrage.',
    desktopTitle: 'Perfekt inszeniert',
    desktopSubtitle: 'Produkt. Bühne. Anfrage.',
    desktopCopy: 'Aus dem Video entsteht eine Landing-Erfahrung, die das Produkt erklärt und sofort zur Aktion führt.',
    desktopPoints: ['Event', 'Produkt', 'Kontakt']
  },
  {
    title: 'Reisebüro',
    label: 'Reiseangebot',
    slug: 'dein-angebot-sofort-klickbar-3',
    youtubeUrl: 'https://youtube.com/shorts/Pi30hv6D7WA?feature=sharefeature=share',
    startSeconds: 4,
    publicPath: '/u/dein-angebot-sofort-klickbar-3',
    icon: 'Plane',
    tone: 'travel',
    reveal: 'copy',
    landingTitle: 'Reisebüro',
    landingSubtitle: 'Reisen emotional präsentieren',
    landingCopy: 'Aus einem Reisetraum wird eine klickbare Angebotsseite – mit Anfrage, Buchung und persönlichem Kontakt.',
    desktopTitle: 'Reise erleben',
    desktopSubtitle: 'Inspiration trifft Anfrage',
    desktopCopy: 'Die Miniwebseite verbindet Emotion, Angebot und Kontakt in einer kompakten Präsentation.',
    desktopPoints: ['Inspiration', 'Angebot', 'Buchung']
  }
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
      {media.kind === 'youtube' && (
        <iframe
          title={`UREEL Video ${item.title}`}
          src={media.src}
          className="absolute inset-0 h-full w-full scale-[1.46] opacity-72 pointer-events-none"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
        />
      )}
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

      {showReelOnly && !loading && (
        <div className="absolute inset-x-8 top-[132px] z-10 rounded-[30px] border border-white/10 bg-black/18 px-6 py-8 text-center backdrop-blur-[2px]">
          <FallbackIcon size={56} className="mx-auto text-white/72" strokeWidth={1.45} />
          <div className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#F2D28B]">Live-Reel</div>
          <div className="mt-2 text-xl font-black leading-tight text-white">{text.title}</div>
        </div>
      )}

      {showHeadline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-[96px] left-6 right-6 z-20 text-center">
          <FallbackIcon size={34} className="mx-auto mb-4 text-white/72" strokeWidth={1.45} />
          <div className="text-[28px] font-black uppercase leading-[0.9] tracking-[-0.055em] text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.45)]">{text.subtitle}</div>
          <div className="mx-auto mt-4 h-px w-20 bg-[#F2D28B]/62" />
        </motion.div>
      )}

      {showCopy && (
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

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F6F0E6] font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_10%_8%,rgba(232,196,106,0.16),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#111,#050505)]" />
      <header className="relative z-10 border-b border-white/10 bg-[#0B0B0B]/78 backdrop-blur-xl">
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
            <a href="#vorteile" className="hover:text-white">Vorteile</a>
            <a href="#auth-box" className="hover:text-white">Login</a>
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
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 lg:py-20 grid lg:grid-cols-[1.0fr_1.45fr_0.85fr] gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DCC2]/25 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#E8DCC2]">
              <LucideIcons.Sparkles size={14} /> Klickbare Smartphone-Werbekarten
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.92] tracking-[-0.06em]">
              Aus Video wird <span className="text-[#F2D28B]">Aktion.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/72 leading-relaxed max-w-xl">
              Dein Reel wird zur klickbaren Präsentation – mit Smartphone-Karte, Buttons, QR-Code und Desktop-Miniwebseite.
            </p>
            <div className="grid gap-3 text-sm font-bold text-white/78">
              {[
                'Video als starker erster Eindruck',
                'Botschaft, die im richtigen Moment erscheint',
                'Kontakt, Anfrage, Datei oder Website direkt öffnen'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-[#F2D28B] text-black flex items-center justify-center"><LucideIcons.Check size={15} /></span>{item}</div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={scrollToAuth} className="rounded-2xl bg-[#F2D28B] text-black px-7 py-4 text-sm font-black uppercase tracking-widest">Kostenlos starten</button>
              <a href="#beispiele" className="rounded-2xl border border-white/18 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">Demo ansehen <LucideIcons.Play size={16} /></a>
            </div>
          </motion.div>

          <div className="relative min-h-[560px] flex items-center justify-center lg:col-span-2 xl:col-span-1">
            <div className="absolute w-[640px] h-[540px] rounded-[56px] bg-[#F2D28B]/8 blur-3xl" />
            <LandingHeroTransformation />
          </div>

          <div id="auth-box" className="rounded-[34px] bg-[#151515]/88 border border-white/12 shadow-[0_30px_90px_rgba(0,0,0,0.45)] p-6 md:p-7 backdrop-blur-xl">
            <div className="flex rounded-2xl bg-white/5 p-1 mb-6">
              <button onClick={() => setAuthMode('login')} className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest ${authMode === 'login' ? 'bg-[#F6F0E6] text-black' : 'text-white/60'}`}>Einloggen</button>
              <button onClick={() => setAuthMode('register')} className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest ${authMode === 'register' ? 'bg-[#F6F0E6] text-black' : 'text-white/60'}`}>Registrieren</button>
            </div>
            <h2 className="text-2xl font-black mb-1">{authMode === 'login' ? 'Willkommen zurück' : 'Starte deine ureel'}</h2>
            <p className="text-sm text-white/55 mb-6">{authMode === 'login' ? 'Melde dich an und öffne dein Studio.' : 'Konto erstellen und direkt mit deiner ersten Startkarte loslegen.'}</p>
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

        <section id="beispiele" className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-9">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F2D28B] mb-3">Live-Showcases</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Echte UREELs. Echte Beispiele.</h2>
              <p className="mt-3 text-white/60 font-bold max-w-2xl">Nur freigegebene Showcases mit YouTube-Link und Public-View-Link werden hier gezeigt. Die vollständige UREEL öffnet sich über „Live ansehen“.</p>
            </div>
            <a href="#auth-box" className="rounded-2xl bg-[#F2D28B] text-black px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Eigene UREEL starten</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SHOWCASE_ITEMS.map((item, i) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Sparkles;
              return (
                <a key={item.slug} href={item.publicPath || `/u/${item.slug}`} className="group rounded-[28px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-[#F2D28B]/45 transition-all p-4 overflow-hidden">
                  <div className={`relative h-48 rounded-[22px] overflow-hidden bg-gradient-to-br ${toneBackground[item.tone]} border border-white/10 mb-4`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,0.68))]" />
                    <div className="absolute top-3 left-3 rounded-full bg-black/45 border border-white/15 px-3 py-1 text-[10px] font-black text-[#F2D28B]">{String(i + 1).padStart(2, '0')}</div>
                    <Icon size={58} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/70" />
                    <div className="absolute left-4 right-4 bottom-4">
                      <div className="text-lg font-black leading-tight">{item.title}</div>
                      <div className="text-xs text-white/70 font-bold mt-1">{item.label}</div>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-[#F2D28B] text-black flex items-center justify-center"><LucideIcons.Play size={22} /></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">Live ansehen</span>
                    <LucideIcons.ArrowRight size={17} className="text-[#F2D28B] group-hover:translate-x-1 transition-transform" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section id="vorteile" className="max-w-7xl mx-auto px-5 md:px-8 pb-20 grid md:grid-cols-4 gap-4">
          {[
            ['Video oder Bild','Wähle deine Szene und schaffe Aufmerksamkeit.','Image'],
            ['Texte & Timing','Botschaften erscheinen im richtigen Moment.','TextCursorInput'],
            ['Aktionen & Buttons','Besucher rufen an, schreiben oder öffnen Dateien.','MousePointerClick'],
            ['Link & QR-Code','Überall teilen – online, offline und mobil.','QrCode']
          ].map(([title, desc, icon]) => {
            const Icon = (LucideIcons as any)[icon] || LucideIcons.Star;
            return (
              <div key={title} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#F2D28B] text-black flex items-center justify-center mb-5"><Icon size={22}/></div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/55 font-bold leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
};
