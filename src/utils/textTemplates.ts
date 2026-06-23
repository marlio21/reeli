import { UreelTextTemplate } from '../types';

export interface UreelTextTemplatePreset {
  id: string;
  labelDe: string;
  labelEn: string;
  descriptionDe: string;
  descriptionEn: string;
  defaultAnimation: 'fade' | 'slide_left' | 'slide_up' | 'reveal' | 'focus';
  defaultFrame: 'none' | 'thin' | 'corner' | 'underline' | 'side_line' | 'badge';
  defaultBox: 'none' | 'transparent' | 'glass' | 'dark' | 'light';
  defaultFontStyle: 'modern' | 'elegant' | 'serif' | 'condensed' | 'tech';
  defaultEmphasis: {
    mode: 'none' | 'last_word' | 'custom_word';
    word?: string;
    color?: string;
  };
  recommendedTimelinePreset: 'direct' | 'short_intro' | 'ad_reel' | 'manual';
}

export const UREEL_TEXT_TEMPLATES: Record<string, UreelTextTemplatePreset> = {
  premium_product: {
    id: 'premium_product',
    labelDe: 'Premium Produkt',
    labelEn: 'Premium Product',
    descriptionDe: 'Für feine Produkte, Luxusgüter und Design-Meisterwerke mit goldenen Akzenten.',
    descriptionEn: 'For fine products, luxury goods, and design masterpieces with golden accents.',
    defaultAnimation: 'fade',
    defaultFrame: 'side_line',
    defaultBox: 'none',
    defaultFontStyle: 'modern',
    defaultEmphasis: {
      mode: 'last_word',
      color: '#A855F7',
    },
    recommendedTimelinePreset: 'short_intro'
  },
  business_clean: {
    id: 'business_clean',
    labelDe: 'Business Clean',
    labelEn: 'Business Clean',
    descriptionDe: 'Professioneller, seriöser Business-Auftritt mit klarer und unaufdringlicher Schriftstruktur.',
    descriptionEn: 'Professional, serious business appearance with a clean and unobtrusive structure.',
    defaultAnimation: 'fade',
    defaultFrame: 'none',
    defaultBox: 'glass',
    defaultFontStyle: 'modern',
    defaultEmphasis: {
      mode: 'none',
    },
    recommendedTimelinePreset: 'direct'
  },
  social_reel: {
    id: 'social_reel',
    labelDe: 'Social Reel',
    labelEn: 'Social Reel',
    descriptionDe: 'Klare Ansage mit farbigen Schlüsselbörtern und dynamischen Einblendungen.',
    descriptionEn: 'Clear announcement with colorful keywords and dynamic slide ins.',
    defaultAnimation: 'slide_left',
    defaultFrame: 'underline',
    defaultBox: 'none',
    defaultFontStyle: 'condensed',
    defaultEmphasis: {
      mode: 'last_word',
      color: '#EF4444',
    },
    recommendedTimelinePreset: 'ad_reel'
  },
  luxury_frame: {
    id: 'luxury_frame',
    labelDe: 'Luxury Frame',
    labelEn: 'Luxury Frame',
    descriptionDe: 'Herausragender Stil für anspruchsvolle Services, Luxus-Realität und edle Schriftästhetik.',
    descriptionEn: 'Outstanding style for high-end services, luxury reality, and elegant typography.',
    defaultAnimation: 'fade',
    defaultFrame: 'corner',
    defaultBox: 'none',
    defaultFontStyle: 'elegant',
    defaultEmphasis: {
      mode: 'none',
    },
    recommendedTimelinePreset: 'short_intro'
  },
  offer_action: {
    id: 'offer_action',
    labelDe: 'Aktion / Angebot',
    labelEn: 'Deal or Offer',
    descriptionDe: 'Impulsgebendes Verkaufs-Layout mit Badge und farblich hervorgehobenen Schlüsselworten.',
    descriptionEn: 'Impulsive sales layout with badges and color-accentuated keywords.',
    defaultAnimation: 'reveal',
    defaultFrame: 'badge',
    defaultBox: 'dark',
    defaultFontStyle: 'condensed',
    defaultEmphasis: {
      mode: 'last_word',
      color: '#F59E0B',
    },
    recommendedTimelinePreset: 'ad_reel'
  },
  event_messe: {
    id: 'event_messe',
    labelDe: 'Event & Messe',
    labelEn: 'Event & Fair',
    descriptionDe: 'Teaser-Layout für Events, Keynotes und Kongresse in modernem, technischem Stil.',
    descriptionEn: 'Teaser layout for events, keynotes, and congresses in a modern, technical style.',
    defaultAnimation: 'slide_up',
    defaultFrame: 'side_line',
    defaultBox: 'glass',
    defaultFontStyle: 'tech',
    defaultEmphasis: {
      mode: 'none',
    },
    recommendedTimelinePreset: 'short_intro'
  },
  contact_premium: {
    id: 'contact_premium',
    labelDe: 'Kontaktkarte Premium',
    labelEn: 'Premium Business Card',
    descriptionDe: 'Perfekt für Berater, Vertriebskräfte und Agenturen mitsamt elegantem Rahmen.',
    descriptionEn: 'Perfect for consultants, sales teams, and agencies with an elegant frame.',
    defaultAnimation: 'focus',
    defaultFrame: 'underline',
    defaultBox: 'light',
    defaultFontStyle: 'elegant',
    defaultEmphasis: {
      mode: 'last_word',
      color: '#06B6D4',
    },
    recommendedTimelinePreset: 'direct'
  },
  real_estate: {
    id: 'real_estate',
    labelDe: 'Immobilien / Objekt',
    labelEn: 'Real Estate Layout',
    descriptionDe: 'Ansprechendes Design für Makler, Immobilienportfolios und Standorte.',
    descriptionEn: 'Appealing design for realtors, real estate portfolios, and locations.',
    defaultAnimation: 'reveal',
    defaultFrame: 'thin',
    defaultBox: 'glass',
    defaultFontStyle: 'serif',
    defaultEmphasis: {
      mode: 'last_word',
      color: '#10B981',
    },
    recommendedTimelinePreset: 'short_intro'
  },
  minimal_clear: {
    id: 'minimal_clear',
    labelDe: 'Minimal Klar',
    labelEn: 'Minimal Clear',
    descriptionDe: 'Sehr reduzierte Vorlage mit viel Ruhe, ideal für klare Botschaften.',
    descriptionEn: 'Very reduced template with calm spacing, ideal for clear messages.',
    defaultAnimation: 'fade',
    defaultFrame: 'none',
    defaultBox: 'transparent',
    defaultFontStyle: 'modern',
    defaultEmphasis: { mode: 'none' },
    recommendedTimelinePreset: 'direct'
  },
  handwerk_bold: {
    id: 'handwerk_bold',
    labelDe: 'Handwerk Bold',
    labelEn: 'Craft Bold',
    descriptionDe: 'Kräftige, ehrliche Werbeschrift für Handwerk, Bau, Werkstatt und Services.',
    descriptionEn: 'Strong and honest copy style for craft, construction, workshop, and services.',
    defaultAnimation: 'slide_up',
    defaultFrame: 'side_line',
    defaultBox: 'dark',
    defaultFontStyle: 'condensed',
    defaultEmphasis: { mode: 'last_word', color: '#F97316' },
    recommendedTimelinePreset: 'ad_reel'
  },
  gastro_appetite: {
    id: 'gastro_appetite',
    labelDe: 'Gastro Appetit',
    labelEn: 'Gastro Appetite',
    descriptionDe: 'Warme Textbox für Restaurants, Cafés, Speisekarten und Tagesangebote.',
    descriptionEn: 'Warm text box for restaurants, cafés, menus, and daily specials.',
    defaultAnimation: 'reveal',
    defaultFrame: 'badge',
    defaultBox: 'light',
    defaultFontStyle: 'serif',
    defaultEmphasis: { mode: 'last_word', color: '#B45309' },
    recommendedTimelinePreset: 'short_intro'
  },
  story_soft: {
    id: 'story_soft',
    labelDe: 'Story Soft',
    labelEn: 'Story Soft',
    descriptionDe: 'Sanfte Story-Vorlage für emotionale Angebote und persönliche Marken.',
    descriptionEn: 'Soft story template for emotional offers and personal brands.',
    defaultAnimation: 'focus',
    defaultFrame: 'underline',
    defaultBox: 'glass',
    defaultFontStyle: 'elegant',
    defaultEmphasis: { mode: 'none' },
    recommendedTimelinePreset: 'short_intro'
  },
  startup_pitch: {
    id: 'startup_pitch',
    labelDe: 'Startup Pitch',
    labelEn: 'Startup Pitch',
    descriptionDe: 'Moderner Pitch-Look für neue Produkte, Apps und digitale Services.',
    descriptionEn: 'Modern pitch look for new products, apps, and digital services.',
    defaultAnimation: 'slide_left',
    defaultFrame: 'thin',
    defaultBox: 'glass',
    defaultFontStyle: 'tech',
    defaultEmphasis: { mode: 'last_word', color: '#38BDF8' },
    recommendedTimelinePreset: 'ad_reel'
  },
  beauty_premium: {
    id: 'beauty_premium',
    labelDe: 'Beauty Premium',
    labelEn: 'Beauty Premium',
    descriptionDe: 'Eleganter Look für Beauty, Wellness, Studio, Salon und hochwertige Termine.',
    descriptionEn: 'Elegant look for beauty, wellness, studio, salon, and high-value bookings.',
    defaultAnimation: 'fade',
    defaultFrame: 'corner',
    defaultBox: 'transparent',
    defaultFontStyle: 'elegant',
    defaultEmphasis: { mode: 'last_word', color: '#E9A8B8' },
    recommendedTimelinePreset: 'short_intro'
  },
  fitness_energy: {
    id: 'fitness_energy',
    labelDe: 'Fitness Energy',
    labelEn: 'Fitness Energy',
    descriptionDe: 'Dynamische, laute Vorlage für Training, Kurse, Aktionen und Challenge-Angebote.',
    descriptionEn: 'Dynamic and loud template for training, classes, deals, and challenges.',
    defaultAnimation: 'slide_up',
    defaultFrame: 'underline',
    defaultBox: 'dark',
    defaultFontStyle: 'condensed',
    defaultEmphasis: { mode: 'last_word', color: '#22C55E' },
    recommendedTimelinePreset: 'ad_reel'
  },

};

export function normalizeUreelTextTemplate(template?: Partial<UreelTextTemplate>): Required<UreelTextTemplate> {
  const defaultTemplate: Required<UreelTextTemplate> = {
    id: '',
    style: 'none',
    animation: 'fade',
    emphasis: {
      mode: 'none',
      word: '',
      color: '#A855F7',
    },
    frame: {
      type: 'none',
      color: '#A855F7',
      opacity: 100,
    },
    box: {
      type: 'none',
      opacity: 80,
    },
    fontStyle: 'modern',
  };

  if (!template) return defaultTemplate;

  const styleId = template.style;
  const p = styleId && UREEL_TEXT_TEMPLATES[styleId] ? UREEL_TEXT_TEMPLATES[styleId] : null;

  return {
    id: template.id || styleId || '',
    style: styleId || 'none',
    animation: template.animation || (p ? p.defaultAnimation : 'fade'),
    emphasis: {
      mode: template.emphasis?.mode || (p ? p.defaultEmphasis.mode : 'none'),
      word: template.emphasis?.word || (p ? p.defaultEmphasis.word : '') || '',
      color: template.emphasis?.color || (p ? p.defaultEmphasis.color : '#A855F7') || '#A855F7',
    },
    frame: {
      type: template.frame?.type || (p ? p.defaultFrame : 'none'),
      color: template.frame?.color || '#A855F7',
      opacity: typeof template.frame?.opacity === 'number' ? template.frame.opacity : 100,
    },
    box: {
      type: template.box?.type || (p ? p.defaultBox : 'none'),
      opacity: typeof template.box?.opacity === 'number' ? template.box.opacity : 80,
    },
    fontStyle: template.fontStyle || (p ? p.defaultFontStyle : 'modern'),
  };
}

/**
 * Returns Tailwind/CSS customization variables corresponding to layout settings
 */
export function getFontStyleClasses(fontStyle: 'modern' | 'elegant' | 'serif' | 'condensed' | 'tech'): string {
  switch (fontStyle) {
    case 'elegant':
      return 'font-sans font-extralight tracking-[0.16em] uppercase text-stone-100';
    case 'serif':
      return 'font-serif italic font-normal tracking-wide text-stone-200';
    case 'condensed':
      return 'font-sans font-black tracking-tighter uppercase text-white scale-y-[1.05] origin-center';
    case 'tech':
      return 'font-mono text-stone-300 font-medium tracking-tight';
    case 'modern':
    default:
      return 'font-sans font-bold tracking-tight text-stone-50';
  }
}

export function getBoxStyleClasses(boxType: 'none' | 'transparent' | 'glass' | 'dark' | 'light', opacity: number): string {
  const opDecimal = (opacity ?? 80) / 100;
  switch (boxType) {
    case 'transparent':
      return `bg-black/20 p-5 rounded-2xl border border-white/5`;
    case 'glass':
      return `bg-stone-900/60 backdrop-blur-md p-6 rounded-2xl border border-stone-800/40 shadow-xl`;
    case 'dark':
      return `bg-stone-950/90 p-6 rounded-2xl border border-stone-900 shadow-2xl`;
    case 'light':
      return `bg-white/95 text-stone-900 p-6 rounded-2xl border border-stone-200 shadow-lg`;
    case 'none':
    default:
      return '';
  }
}

export function getFrameStyleClasses(frameType: 'none' | 'thin' | 'corner' | 'underline' | 'side_line' | 'badge'): string {
  switch (frameType) {
    case 'thin':
      return 'border border-solid p-4 rounded-xl';
    case 'corner':
      return 'relative p-4 border border-transparent'; // Will use custom corner rendering in CSS
    case 'underline':
      return 'border-b-4 pb-2.5';
    case 'side_line':
      return 'border-l-4 pl-4 text-left';
    case 'badge':
      return 'inline-block bg-[#A855F7]/10 text-[#A855F7] px-4 py-1 rounded-full text-xs font-bold leading-relaxed mb-3 border border-[#A855F7]/20';
    case 'none':
    default:
      return '';
  }
}

/**
 * Split text to highligth the custom word or last word with standard regex matching.
 */
export function getHighlightedTextElements(
  text: string, 
  emphasisMode: 'none' | 'last_word' | 'custom_word', 
  customWord?: string, 
  emphasisColor: string = '#A855F7'
): { before: string; highlighted: string; after: string } {
  if (!text || emphasisMode === 'none') {
    return { before: text, highlighted: '', after: '' };
  }

  const cleanText = text.trim();

  if (emphasisMode === 'last_word') {
    // Find the last word in the string
    const words = cleanText.split(/\s+/);
    if (words.length <= 1) {
      return { before: '', highlighted: cleanText, after: '' };
    }
    const lastWord = words[words.length - 1];
    const beforePart = cleanText.substring(0, cleanText.lastIndexOf(lastWord));
    return { before: beforePart, highlighted: lastWord, after: '' };
  }

  if (emphasisMode === 'custom_word' && customWord) {
    const target = customWord.trim();
    const idx = cleanText.toLowerCase().indexOf(target.toLowerCase());
    if (idx !== -1) {
      const before = cleanText.substring(0, idx);
      const highlighted = cleanText.substring(idx, idx + target.length);
      const after = cleanText.substring(idx + target.length);
      return { before, highlighted, after };
    }
  }

  return { before: text, highlighted: '', after: '' };
}
