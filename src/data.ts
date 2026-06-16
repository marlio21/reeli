/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlanConfig, LibraryIcon, CardType } from './types';

export const PLANS: Record<string, PlanConfig> = {
  free: {
    planId: 'free',
    name: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    storageLimitMB: 20,
    maxCards: 1,
    maxButtonsPerCard: 6,
    maxPdfFiles: 3,
    passwordButtonsEnabled: false,
    backgroundImageEnabled: false,
    analyticsEnabled: false,
    brandingRequired: true,
    buttonImagesEnabled: false,
  },
  starter: {
    planId: 'starter',
    name: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    storageLimitMB: 20,
    maxCards: 1,
    maxButtonsPerCard: 6,
    maxPdfFiles: 3,
    passwordButtonsEnabled: false,
    backgroundImageEnabled: false,
    analyticsEnabled: false,
    brandingRequired: true,
    buttonImagesEnabled: false,
  },
  fun: {
    planId: 'fun',
    name: 'Starter [Legacy]',
    priceMonthly: 0,
    priceYearly: 0,
    storageLimitMB: 20,
    maxCards: 1,
    maxButtonsPerCard: 6,
    maxPdfFiles: 3,
    passwordButtonsEnabled: false,
    backgroundImageEnabled: false,
    analyticsEnabled: false,
    brandingRequired: true,
    buttonImagesEnabled: false,
  },
  pro: {
    planId: 'pro',
    name: 'Pro',
    priceMonthly: 3.90,
    priceYearly: 37.44,
    storageLimitMB: 250,
    maxCards: 5,
    maxButtonsPerCard: 20,
    maxPdfFiles: 15,
    passwordButtonsEnabled: true,
    backgroundImageEnabled: true,
    analyticsEnabled: true,
    brandingRequired: false,
    buttonImagesEnabled: true,
  },
  business: {
    planId: 'business',
    name: 'Business',
    priceMonthly: 19.90,
    priceYearly: 191.04,
    storageLimitMB: 1024,
    maxCards: 25,
    maxButtonsPerCard: 30,
    maxPdfFiles: 50,
    passwordButtonsEnabled: true,
    backgroundImageEnabled: true,
    analyticsEnabled: true,
    brandingRequired: false,
    buttonImagesEnabled: true,
  },
  // Compatibility fallbacks for legacy/test db values
  premium: {
    planId: 'pro',
    name: 'Pro',
    priceMonthly: 3.90,
    priceYearly: 37.44,
    storageLimitMB: 250,
    maxCards: 5,
    maxButtonsPerCard: 20,
    maxPdfFiles: 15,
    passwordButtonsEnabled: true,
    backgroundImageEnabled: true,
    analyticsEnabled: true,
    brandingRequired: false,
    buttonImagesEnabled: true,
  },
  family: {
    planId: 'pro',
    name: 'Pro',
    priceMonthly: 3.90,
    priceYearly: 37.44,
    storageLimitMB: 250,
    maxCards: 5,
    maxButtonsPerCard: 10,
    maxPdfFiles: 15,
    passwordButtonsEnabled: true,
    backgroundImageEnabled: true,
    analyticsEnabled: true,
    brandingRequired: false,
    buttonImagesEnabled: true,
  },
  enterprise: {
    planId: 'business',
    name: 'Business',
    priceMonthly: 19.90,
    priceYearly: 191.04,
    storageLimitMB: 1024,
    maxCards: 20,
    maxButtonsPerCard: 15,
    maxPdfFiles: 50,
    passwordButtonsEnabled: true,
    backgroundImageEnabled: true,
    analyticsEnabled: true,
    brandingRequired: false,
    buttonImagesEnabled: true,
  }
};

export const LIBRARY_ICONS: LibraryIcon[] = [
  // Contact
  { id: 'Phone', name: 'Anrufen / Call', category: 'contact', defaultColor: '#3BB273', defaultActionType: 'tel' },
  { id: 'Mail', name: 'E-Mail schreiben', category: 'contact', defaultColor: '#A855F7', defaultActionType: 'mailto' },
  { id: 'MessageSquare', name: 'SMS öffnen', category: 'contact', defaultColor: '#c084fc', defaultActionType: 'sms' },
  { id: 'MapPin', name: 'Google Maps Standort', category: 'contact', defaultColor: '#ef4444', defaultActionType: 'url' },
  { id: 'Globe', name: 'Webseite / URL', category: 'contact', defaultColor: '#60a5fa', defaultActionType: 'url' },
  { id: 'Calendar', name: 'Termin buchen', category: 'contact', defaultColor: '#fb923c', defaultActionType: 'url' },
  { id: 'UserCheck', name: 'Kontakt im Handy speichern', category: 'contact', defaultColor: '#3BB273', defaultActionType: 'vcard' },

  // Social
  { id: 'Instagram', name: 'Instagram', category: 'social', defaultColor: '#E1306C', defaultActionType: 'url' },
  { id: 'Facebook', name: 'Facebook', category: 'social', defaultColor: '#1877F2', defaultActionType: 'url' },
  { id: 'Linkedin', name: 'LinkedIn', category: 'social', defaultColor: '#0A66C2', defaultActionType: 'url' },
  { id: 'Youtube', name: 'YouTube Channel', category: 'social', defaultColor: '#FF0000', defaultActionType: 'url' },
  { id: 'Twitter', name: 'X / Twitter', category: 'social', defaultColor: '#1DA1F2', defaultActionType: 'url' },
  { id: 'MessageCircle', name: 'Telegram', category: 'social', defaultColor: '#0088cc', defaultActionType: 'url' },
  { id: 'Compass', name: 'Pinterest', category: 'social', defaultColor: '#BD081C', defaultActionType: 'url' },

  // Business
  { id: 'Award', name: 'Portfolio / Referenzen', category: 'business', defaultColor: '#A855F7', defaultActionType: 'url' },
  { id: 'Briefcase', name: 'Dienstleistungen / Angebot', category: 'business', defaultColor: '#A855F7', defaultActionType: 'url' },
  { id: 'FileText', name: 'Preisliste / Speisekarte', category: 'business', defaultColor: '#e2e8f0', defaultActionType: 'pdf' },
  { id: 'ThumbsUp', name: 'Bewertungen / Social Proof', category: 'business', defaultColor: '#3BB273', defaultActionType: 'url' },

  // Files
  { id: 'FileCode', name: 'Broschüre herunterladen', category: 'files', defaultColor: '#e2e8f0', defaultActionType: 'pdf' },
  { id: 'Download', name: 'Allgemeiner Dateidownload', category: 'files', defaultColor: '#a8a29e', defaultActionType: 'url' },

  // Shopping
  { id: 'ShoppingCart', name: 'Online Shop', category: 'shopping', defaultColor: '#059669', defaultActionType: 'url' },
  { id: 'DollarSign', name: 'Zahlungslink / Checkout', category: 'shopping', defaultColor: '#A855F7', defaultActionType: 'url' },
  { id: 'Tag', name: 'Rabattcode / Coupon', category: 'shopping', defaultColor: '#f43f5e', defaultActionType: 'url' },

  // Protected
  { id: 'Lock', name: 'Passwortgeschützter Bereich', category: 'protected', defaultColor: '#64748b', defaultActionType: 'password_link' },
  { id: 'ShieldAlert', name: 'VIP Partnerbereich', category: 'protected', defaultColor: '#A855F7', defaultActionType: 'password_link' }
];

export const CARD_CATEGORIES: { id: CardType; de: string; en: string }[] = [
  { id: 'person', de: 'Person / Visitenkarte', en: 'Person / Digital Business Card' },
  { id: 'company', de: 'Unternehmen / Geschäft', en: 'Company / Business Page' },
  { id: 'product', de: 'Produkt / Smartcard', en: 'Product Display Page' },
  { id: 'project', de: 'Projektvorstellung', en: 'Project Showroom' },
  { id: 'family', de: 'Familie', en: 'Family Hub / Card' },
  { id: 'team', de: 'Teamkarte', en: 'Team Profile' },
  { id: 'club', de: 'Verein / Organisation', en: 'Club / Association Highlight' },
  { id: 'event', de: 'Veranstaltung / Event', en: 'Event / Celebration Invitation' }
];
