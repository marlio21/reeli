/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppPlanLimits {
  maxCards: number;
  maxButtonsPerCard: number;
  watermark: boolean;
  customSlug: boolean;
  fullAppBackgroundImage: boolean;
  buttonBackgroundImage: boolean;
  fileUpload: boolean;
  gallery: boolean;
  availabilityCalendar: boolean;
  passwordProtectedButtons: boolean;
  advancedExports: boolean;
  brandingHidden: boolean;
  simpleAnalytics?: boolean;
  seoSettings?: boolean;
  advancedQrExport?: boolean;
  analytics?: 'none' | 'basic' | 'advanced';
  teamMembers?: boolean;
  templates?: boolean;
  roles?: boolean;

  // Feature keys requested by user
  cards?: number;
  buttons?: number;
  websiteLink?: boolean;
  phoneLink?: boolean;
  emailLink?: boolean;
  socialLinks?: boolean;
  vCard?: boolean;
  sms?: boolean;
  locationRoute?: boolean;
  externalFileLink?: boolean;
  dropboxFileLink?: boolean;
  googleDriveFileLink?: boolean;
  oneDriveFileLink?: boolean;
  dropboxFolderLink?: boolean;
  googleDriveFolderLink?: boolean;
  oneDriveFolderLink?: boolean;
  downloadArea?: boolean;
  directFileUpload?: boolean;
  pdfUpload?: boolean;
  socialCollection?: boolean;
  appBackgroundImage?: boolean;
  advancedDesign?: boolean;
  contactForm?: boolean;
  inquiryForm?: boolean;
  callbackRequest?: boolean;
  qrExportOptions?: boolean;
  basicAnalytics?: boolean;
  teamFeatures?: boolean;
  employeeCards?: boolean;
  rolesAndPermissions?: boolean;
  companyManagement?: boolean;
  leadList?: boolean;
  storeFormsInFirestore?: boolean;
  companyTemplates?: boolean;
  unifiedBranding?: boolean;
  customDomainPreparation?: boolean;
  bulkCardDuplicate?: boolean;
  exportFeatures?: boolean;
  fullBrandingRemoval?: boolean;
}

export interface AppPlan {
  id: string;
  nameDe: string;
  nameEn: string;
  limits: AppPlanLimits;
}

export const APP_PLANS: Record<string, AppPlan> = {
  starter: {
    id: 'starter',
    nameDe: 'Starter',
    nameEn: 'Starter',
    limits: {
      maxCards: 1,
      maxButtonsPerCard: 6,
      watermark: true,
      customSlug: false,
      fullAppBackgroundImage: false,
      buttonBackgroundImage: false,
      fileUpload: false,
      gallery: false,
      availabilityCalendar: false,
      passwordProtectedButtons: false,
      advancedExports: false,
      brandingHidden: false,
      simpleAnalytics: false,
      seoSettings: false,
      advancedQrExport: false,
      analytics: 'none',
      teamMembers: false,
      templates: false,
      roles: false,

      cards: 1,
      buttons: 6,
      websiteLink: true,
      phoneLink: true,
      emailLink: true,
      socialLinks: true,
      vCard: true,
      sms: false,
      locationRoute: false,
      externalFileLink: false,
      dropboxFileLink: false,
      googleDriveFileLink: false,
      oneDriveFileLink: false,
      dropboxFolderLink: false,
      googleDriveFolderLink: false,
      oneDriveFolderLink: false,
      downloadArea: false,
      directFileUpload: false,
      pdfUpload: false,
      socialCollection: true,
      appBackgroundImage: false,
      advancedDesign: false,
      contactForm: false,
      inquiryForm: false,
      callbackRequest: false,
      qrExportOptions: false,
      basicAnalytics: false,
      teamFeatures: false,
      employeeCards: false,
      rolesAndPermissions: false,
      companyManagement: false,
      leadList: false,
      storeFormsInFirestore: false,
      companyTemplates: false,
      unifiedBranding: false,
      customDomainPreparation: false,
      bulkCardDuplicate: false,
      exportFeatures: false,
      fullBrandingRemoval: false,
    },
  },
  fun: {
    id: 'fun',
    nameDe: 'Starter [Legacy]',
    nameEn: 'Starter [Legacy]',
    limits: {
      maxCards: 1,
      maxButtonsPerCard: 6,
      watermark: true,
      customSlug: false,
      fullAppBackgroundImage: false,
      buttonBackgroundImage: false,
      fileUpload: false,
      gallery: false,
      availabilityCalendar: false,
      passwordProtectedButtons: false,
      advancedExports: false,
      brandingHidden: false,
      simpleAnalytics: false,
      seoSettings: false,
      advancedQrExport: false,
      analytics: 'none',
      teamMembers: false,
      templates: false,
      roles: false,

      cards: 1,
      buttons: 6,
      websiteLink: true,
      phoneLink: true,
      emailLink: true,
      socialLinks: true,
      vCard: true,
      sms: false,
      locationRoute: false,
      externalFileLink: false,
      dropboxFileLink: false,
      googleDriveFileLink: false,
      oneDriveFileLink: false,
      dropboxFolderLink: false,
      googleDriveFolderLink: false,
      oneDriveFolderLink: false,
      downloadArea: false,
      directFileUpload: false,
      pdfUpload: false,
      socialCollection: true,
      appBackgroundImage: false,
      advancedDesign: false,
      contactForm: false,
      inquiryForm: false,
      callbackRequest: false,
      qrExportOptions: false,
      basicAnalytics: false,
      teamFeatures: false,
      employeeCards: false,
      rolesAndPermissions: false,
      companyManagement: false,
      leadList: false,
      storeFormsInFirestore: false,
      companyTemplates: false,
      unifiedBranding: false,
      customDomainPreparation: false,
      bulkCardDuplicate: false,
      exportFeatures: false,
      fullBrandingRemoval: false,
    },
  },
  pro: {
    id: 'pro',
    nameDe: 'Pro',
    nameEn: 'Pro',
    limits: {
      maxCards: 5,
      maxButtonsPerCard: 20,
      watermark: false,
      customSlug: true, // customSlug is true according to "Fun/Pro/Business standard"
      fullAppBackgroundImage: true,
      buttonBackgroundImage: true,
      fileUpload: true,
      gallery: true,
      availabilityCalendar: true,
      passwordProtectedButtons: true,
      advancedExports: true,
      brandingHidden: true,
      simpleAnalytics: true,
      seoSettings: true,
      advancedQrExport: true,
      analytics: 'basic',
      teamMembers: false,
      templates: false,
      roles: false,

      cards: 5,
      buttons: 20,
      websiteLink: true,
      phoneLink: true,
      emailLink: true,
      socialLinks: true,
      vCard: true,
      sms: true,
      locationRoute: true,
      externalFileLink: true,
      dropboxFileLink: true,
      googleDriveFileLink: true,
      oneDriveFileLink: true,
      dropboxFolderLink: true,
      googleDriveFolderLink: true,
      oneDriveFolderLink: true,
      downloadArea: true,
      directFileUpload: true,
      pdfUpload: true,
      socialCollection: true,
      appBackgroundImage: true,
      advancedDesign: true,
      contactForm: true,
      inquiryForm: true,
      callbackRequest: true,
      qrExportOptions: true,
      basicAnalytics: true,
      teamFeatures: false,
      employeeCards: false,
      rolesAndPermissions: false,
      companyManagement: false,
      leadList: false,
      storeFormsInFirestore: false,
      companyTemplates: false,
      unifiedBranding: false,
      customDomainPreparation: false,
      bulkCardDuplicate: false,
      exportFeatures: false,
      fullBrandingRemoval: false,
    },
  },
  business: {
    id: 'business',
    nameDe: 'Business',
    nameEn: 'Business',
    limits: {
      maxCards: 25,
      maxButtonsPerCard: 30,
      watermark: false,
      customSlug: true,
      fullAppBackgroundImage: true,
      buttonBackgroundImage: true,
      fileUpload: true,
      gallery: true,
      availabilityCalendar: true,
      passwordProtectedButtons: true,
      advancedExports: true,
      brandingHidden: true,
      simpleAnalytics: true,
      seoSettings: true,
      advancedQrExport: true,
      analytics: 'advanced',
      teamMembers: true,
      templates: true,
      roles: true,

      cards: 25,
      buttons: 30,
      websiteLink: true,
      phoneLink: true,
      emailLink: true,
      socialLinks: true,
      vCard: true,
      sms: true,
      locationRoute: true,
      externalFileLink: true,
      dropboxFileLink: true,
      googleDriveFileLink: true,
      oneDriveFileLink: true,
      dropboxFolderLink: true,
      googleDriveFolderLink: true,
      oneDriveFolderLink: true,
      downloadArea: true,
      directFileUpload: true,
      pdfUpload: true,
      socialCollection: true,
      appBackgroundImage: true,
      advancedDesign: true,
      contactForm: true,
      inquiryForm: true,
      callbackRequest: true,
      qrExportOptions: true,
      basicAnalytics: true,
      teamFeatures: true,
      employeeCards: true,
      rolesAndPermissions: true,
      companyManagement: true,
      leadList: true,
      storeFormsInFirestore: true,
      companyTemplates: true,
      unifiedBranding: true,
      customDomainPreparation: true,
      bulkCardDuplicate: true,
      exportFeatures: true,
      fullBrandingRemoval: true,
    },
  },
};

export interface PricingPlan {
  id: string;
  name: string;
  targetGroup: { de: string; en: string };
  maxCards: number;
  monthlyPriceDe: string;
  monthlyPriceEn: string;
  yearlyPriceDe: string;
  yearlyPriceEn: string;
  yearlyNoteDe?: string;
  yearlyNoteEn?: string;
  featuresDe: string[];
  featuresEn: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    targetGroup: {
      de: "Für den einfachen Einstieg und persönliche Kontaktkarten.",
      en: "For simple entries and personal contact cards."
    },
    maxCards: 1,
    monthlyPriceDe: "0,00 €",
    monthlyPriceEn: "0.00 €",
    yearlyPriceDe: "0,00 €",
    yearlyPriceEn: "0.00 €",
    yearlyNoteDe: "Kostenlos starten",
    yearlyNoteEn: "Start for free",
    featuresDe: [
      "1 ureel-Karte",
      "maximal 6 Buttons pro Karte",
      "Website-Link, Telefon und E-Mail",
      "all Social-Media-Einzellinks",
      "vCard / Kontakt speichern",
      "ureel-Wasserzeichen sichtbar"
    ],
    featuresEn: [
      "1 ureel card",
      "Max 6 buttons per card",
      "Website, phone and email",
      "All individual social media links",
      "vCard / Save contact",
      "ureel watermark visible"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    targetGroup: {
      de: "Professioneller auftreten für Selbstständige, Creator & Dienstleister.",
      en: "Professional look for freelancers, creators & small businesses."
    },
    maxCards: 5,
    monthlyPriceDe: "3,90 €",
    monthlyPriceEn: "3.90 €",
    yearlyPriceDe: "37,44 €",
    yearlyPriceEn: "37.44 €",
    yearlyNoteDe: "jährlich bezahlt, entspricht 3,12 €/Monat",
    yearlyNoteEn: "paid annually, equivalent to 3.12 €/month",
    featuresDe: [
      "bis zu 5 ureel-Karten",
      "maximal 20 Buttons pro Karte",
      "alle Starter-Funktionen",
      "direkter Datei-Upload & PDF hochladen",
      "Download-Bereich unlimitiert",
      "passwortgeschützte Buttons",
      "Kontakt-, Anfrage-, Rückrufformular",
      "Branding ausblendbar",
      "einfache Besucherstatistik"
    ],
    featuresEn: [
      "Up to 5 ureel cards",
      "Max 20 buttons per card",
      "All Starter features",
      "Direct file upload & PDF upload",
      "Unlimited download area links",
      "Password-protected buttons",
      "Contact, inquiry & callback forms",
      "Hide branding / watermark",
      "Simple visitor analytics"
    ]
  },
  {
    id: "business",
    name: "Business",
    targetGroup: {
      de: "Mehrere Karten und Ansprechpartner für Teams und Unternehmen.",
      en: "Multiple cards and contacts for teams and enterprises."
    },
    maxCards: 25,
    monthlyPriceDe: "19,90 €",
    monthlyPriceEn: "19.90 €",
    yearlyPriceDe: "191,04 €",
    yearlyPriceEn: "191.04 €",
    yearlyNoteDe: "jährlich bezahlt, entspricht 15,92 €/Monat",
    yearlyNoteEn: "paid annually, equivalent to 15.92 €/month",
    featuresDe: [
      "bis zu 25 ureel-Karten",
      "maximal 30 Buttons pro Karte",
      "alle Pro-Funktionen",
      "Teamfunktionen & Mitarbeiterkarten",
      "Rollen & Rechteverwaltung",
      "zentrale Firmenverwaltung & -vorlagen",
      "Lead-Liste im Dashboard",
      "Branding vollständig ausblendbar"
    ],
    featuresEn: [
      "Up to 25 ureel cards",
      "Max 30 buttons per card",
      "All Pro features",
      "Team features & Employee cards",
      "Roles & Permissions management",
      "Central company workspace & templates",
      "Lead list on Dashboard",
      "Full branding removal"
    ]
  }
];

export const KONU_PLAN_FEATURES = {
  starter: {
    cards: 1,
    basicDesigns: true,
    advancedDesigns: false,
    premiumDarkDesign: false,
    customColors: false,
    extendedButtons: false,
    teamUse: false
  },
  fun: {
    cards: 3,
    basicDesigns: true,
    advancedDesigns: true,
    premiumDarkDesign: false,
    customColors: false,
    extendedButtons: true,
    teamUse: false
  },
  pro: {
    cards: 5,
    basicDesigns: true,
    advancedDesigns: true,
    premiumDarkDesign: true,
    customColors: true,
    extendedButtons: true,
    teamUse: false
  },
  business: {
    cards: 25,
    basicDesigns: true,
    advancedDesigns: true,
    premiumDarkDesign: true,
    customColors: true,
    extendedButtons: true,
    teamUse: true
  }
};

export interface CatalogButton {
  id: string;
  labelDe: string;
  labelEn: string;
  category: "contact" | "cloud" | "download" | "media" | "appointments" | "location" | "social" | "security";
  minPlan: "starter" | "fun" | "pro" | "business";
  descriptionDe: string;
  descriptionEn: string;
  actionType: string;
  placeholderDe: string;
  placeholderEn: string;
  lucideIcon: string;
}

export const BUTTON_CATALOG: CatalogButton[] = [
  // --- KONTAKT / CONTACT ---
  {
    id: "website",
    labelDe: "Website-Link",
    labelEn: "Website link",
    category: "contact",
    minPlan: "starter",
    descriptionDe: "Öffnet eine Webseite.",
    descriptionEn: "Opens a website.",
    actionType: "website",
    placeholderDe: "https://beispiel.de",
    placeholderEn: "https://example.com",
    lucideIcon: "Globe"
  },
  {
    id: "phone",
    labelDe: "Telefon",
    labelEn: "Phone",
    category: "contact",
    minPlan: "starter",
    descriptionDe: "Startet einen Anruf.",
    descriptionEn: "Starts a phone call.",
    actionType: "phone",
    placeholderDe: "+49 170 1234567",
    placeholderEn: "+43 664 1234567",
    lucideIcon: "Phone"
  },
  {
    id: "email",
    labelDe: "E-Mail",
    labelEn: "Email",
    category: "contact",
    minPlan: "starter",
    descriptionDe: "Öffnet eine neue E-Mail.",
    descriptionEn: "Opens a new email.",
    actionType: "email",
    placeholderDe: "beispiel@firma.de",
    placeholderEn: "hello@company.com",
    lucideIcon: "Mail"
  },
  {
    id: "vcard",
    labelDe: "vCard / Kontakt speichern",
    labelEn: "vCard / Save contact",
    category: "contact",
    minPlan: "starter",
    descriptionDe: "Handy-Kontaktdaten zum direkten Abspeichern.",
    descriptionEn: "Direct mobile contact file saving.",
    actionType: "vcard",
    placeholderDe: "Kein Wert nötig – nutzt Kartendaten",
    placeholderEn: "No value needed – uses card profile",
    lucideIcon: "UserCheck"
  },
  {
    id: "callback_request",
    labelDe: "Rückruf anfordern",
    labelEn: "Request callback",
    category: "contact",
    minPlan: "pro",
    descriptionDe: "Kontaktformulare sind ab ureel Pro verfügbar.",
    descriptionEn: "Contact forms are available from ureel Pro.",
    actionType: "callback_request",
    placeholderDe: "beispiel@firma.de (Empfänger für Anfrage)",
    placeholderEn: "contact@company.com (Inquiry recipient)",
    lucideIcon: "PhoneCall"
  },
  {
    id: "inquiry_form",
    labelDe: "Anfrageformular",
    labelEn: "Inquiry form",
    category: "contact",
    minPlan: "pro",
    descriptionDe: "Kontaktformulare sind ab ureel Pro verfügbar.",
    descriptionEn: "Contact forms are available from ureel Pro.",
    actionType: "inquiry_form",
    placeholderDe: "anfrage@firma.de (Empfänger)",
    placeholderEn: "sales@company.com (Recipient)",
    lucideIcon: "ClipboardList"
  },
  {
    id: "contact_form",
    labelDe: "Kontaktformular",
    labelEn: "Contact form",
    category: "contact",
    minPlan: "pro",
    descriptionDe: "Kontaktformulare sind ab ureel Pro verfügbar.",
    descriptionEn: "Contact forms are available from ureel Pro.",
    actionType: "contact_form",
    placeholderDe: "info@firma.de (Empfänger)",
    placeholderEn: "info@company.com (Recipient)",
    lucideIcon: "Send"
  },

  // --- CLOUD & DATEIEN / CLOUD & FILES ---
  {
    id: "external_file_link",
    labelDe: "Datei/PDF per externem Link",
    labelEn: "File/PDF via external link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Der Link muss öffentlich freigegeben sein. ureel speichert bei Cloud-Links nur den Link, nicht die Datei.",
    descriptionEn: "The link must be publicly shared. For cloud links, ureel only stores the link, not the file.",
    actionType: "external_file_link",
    placeholderDe: "https://beispiel.de/datei.pdf",
    placeholderEn: "https://example.com/file.pdf",
    lucideIcon: "FileText"
  },
  {
    id: "pdf_upload",
    labelDe: "PDF direkt in ureel hochladen",
    labelEn: "Upload PDF directly to ureel",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Lädt eine PDF-Datei direkt in ureel hoch. Ab ureel Pro.",
    descriptionEn: "Uploads a PDF file directly to ureel. From ureel Pro.",
    actionType: "pdf_upload",
    placeholderDe: "PDF-Datei im Buttoneditor hochladen",
    placeholderEn: "Upload PDF file in the button editor",
    lucideIcon: "UploadCloud"
  },
  {
    id: "direct_file_upload",
    labelDe: "Datei direkt in ureel hochladen",
    labelEn: "Upload file directly to ureel",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Lädt eine Datei direkt in ureel hoch. Ab ureel Pro.",
    descriptionEn: "Uploads a file directly to ureel. From ureel Pro.",
    actionType: "direct_file_upload",
    placeholderDe: "Datei im Buttoneditor hochladen",
    placeholderEn: "Upload file in the button editor",
    lucideIcon: "Upload"
  },
  {
    id: "dropbox_folder",
    labelDe: "Dropbox-Ordner per Link",
    labelEn: "Dropbox folder via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet einen freigegebenen Dropbox-Ordner.",
    descriptionEn: "Opens a shared Dropbox folder.",
    actionType: "dropbox_folder",
    placeholderDe: "https://www.dropbox.com/sh/...",
    placeholderEn: "https://www.dropbox.com/sh/...",
    lucideIcon: "FolderOpen"
  },
  {
    id: "dropbox_file",
    labelDe: "Dropbox-Datei per Link",
    labelEn: "Dropbox file via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet eine freigegebene Dropbox-Datei.",
    descriptionEn: "Opens a shared Dropbox file.",
    actionType: "dropbox_file",
    placeholderDe: "https://www.dropbox.com/s/...",
    placeholderEn: "https://www.dropbox.com/s/...",
    lucideIcon: "FileText"
  },
  {
    id: "google_drive_folder",
    labelDe: "Google-Drive-Ordner per Link",
    labelEn: "Google Drive folder via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet einen freigegebenen Google-Drive-Ordner.",
    descriptionEn: "Opens a shared Google Drive folder.",
    actionType: "google_drive_folder",
    placeholderDe: "https://drive.google.com/drive/folders/...",
    placeholderEn: "https://drive.google.com/drive/folders/...",
    lucideIcon: "FolderGit"
  },
  {
    id: "google_drive_file",
    labelDe: "Google-Drive-Datei per Link",
    labelEn: "Google Drive file via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet eine freigegebene Google-Drive-Datei.",
    descriptionEn: "Opens a shared Google Drive file.",
    actionType: "google_drive_file",
    placeholderDe: "https://drive.google.com/file/d/...",
    placeholderEn: "https://drive.google.com/file/d/...",
    lucideIcon: "File"
  },
  {
    id: "onedrive_folder",
    labelDe: "OneDrive-Ordner per Link",
    labelEn: "OneDrive folder via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet einen freigegebenen OneDrive-Ordner.",
    descriptionEn: "Opens a shared OneDrive folder.",
    actionType: "onedrive_folder",
    placeholderDe: "https://onedrive.live.com/...",
    placeholderEn: "https://onedrive.live.com/...",
    lucideIcon: "FolderGit2"
  },
  {
    id: "onedrive_file",
    labelDe: "OneDrive-Datei per Link",
    labelEn: "OneDrive file via link",
    category: "cloud",
    minPlan: "pro",
    descriptionDe: "Öffnet eine freigegebene OneDrive-Datei.",
    descriptionEn: "Opens a shared OneDrive file.",
    actionType: "onedrive_file",
    placeholderDe: "https://onedrive.live.com/...",
    placeholderEn: "https://onedrive.live.com/...",
    lucideIcon: "FileSpreadsheet"
  },
  {
    id: "file_link",
    labelDe: "Dateifreigabe per Link",
    labelEn: "File share via link",
    category: "cloud",
    minPlan: "starter",
    descriptionDe: "Öffnet eine im Web (Drive, Dropbox etc.) freigegebene Datei.",
    descriptionEn: "Opens a file shared on the web (Drive, Dropbox etc.).",
    actionType: "file_link",
    placeholderDe: "https://beispiel.de/meine-datei.zip",
    placeholderEn: "https://example.com/my-file.zip",
    lucideIcon: "FileCheck"
  },
  {
    id: "pdf_link",
    labelDe: "PDF-Dokument per Link",
    labelEn: "PDF document via link",
    category: "cloud",
    minPlan: "starter",
    descriptionDe: "Öffnet ein im Web freigegebenes PDF-Dokument.",
    descriptionEn: "Opens a PDF document shared on the web.",
    actionType: "pdf_link",
    placeholderDe: "https://beispiel.de/dokument.pdf",
    placeholderEn: "https://example.com/document.pdf",
    lucideIcon: "FileText"
  },

  // --- DOWNLOAD-BEREICH ---
  {
    id: "download_area",
    labelDe: "Download-Bereich",
    labelEn: "Download area",
    category: "download",
    minPlan: "pro",
    descriptionDe: "Sammelt mehrere Datei-Links in einem Button.",
    descriptionEn: "Collects multiple file links in one button.",
    actionType: "download_area",
    placeholderDe: "Kein Hauptlink nötig – richte die Download-Items ein",
    placeholderEn: "No main URL required – configure individual download items below",
    lucideIcon: "Download"
  },

  // --- MEDIEN / MEDIA ---
  {
    id: "youtube_video",
    labelDe: "YouTube-Video",
    labelEn: "YouTube video",
    category: "media",
    minPlan: "pro",
    descriptionDe: "Öffnet ein YouTube-Video.",
    descriptionEn: "Opens a YouTube video.",
    actionType: "youtube_video",
    placeholderDe: "https://www.youtube.com/watch?v=...",
    placeholderEn: "https://www.youtube.com/watch?v=...",
    lucideIcon: "Youtube"
  },
  {
    id: "vimeo_video",
    labelDe: "Vimeo-Video",
    labelEn: "Vimeo video",
    category: "media",
    minPlan: "pro",
    descriptionDe: "Öffnet ein Vimeo-Video.",
    descriptionEn: "Opens a Vimeo video.",
    actionType: "vimeo_video",
    placeholderDe: "https://vimeo.com/...",
    placeholderEn: "https://vimeo.com/...",
    lucideIcon: "Video"
  },
  {
    id: "video_link",
    labelDe: "Video per Link",
    labelEn: "Video via link",
    category: "media",
    minPlan: "pro",
    descriptionDe: "Verlinkt ein beliebiges Video im Web.",
    descriptionEn: "Links to any video on the web.",
    actionType: "video_link",
    placeholderDe: "https://beispiel.de/video.mp4",
    placeholderEn: "https://example.com/video.mp4",
    lucideIcon: "VideoOff"
  },
  {
    id: "audio_podcast",
    labelDe: "Audio / Podcast-Link",
    labelEn: "Audio / podcast link",
    category: "media",
    minPlan: "pro",
    descriptionDe: "Öffnet einen Audio- oder Podcast-Link.",
    descriptionEn: "Opens an audio or podcast link.",
    actionType: "audio_podcast",
    placeholderDe: "https://open.spotify.com/show/...",
    placeholderEn: "https://open.spotify.com/show/...",
    lucideIcon: "Mic"
  },

  // --- SOCIALS / SOCIAL ---
  {
    id: "instagram",
    labelDe: "Instagram",
    labelEn: "Instagram",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Verlinke dein Instagram-Profil.",
    descriptionEn: "Connect with your Instagram profile page.",
    actionType: "instagram",
    placeholderDe: "https://instagram.com/mein-name",
    placeholderEn: "https://instagram.com/your-username",
    lucideIcon: "Instagram"
  },
  {
    id: "linkedin",
    labelDe: "LinkedIn",
    labelEn: "LinkedIn",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Verknüpfe dein berufliches LinkedIn-Profil.",
    descriptionEn: "Link to your professional LinkedIn account.",
    actionType: "linkedin",
    placeholderDe: "https://linkedin.com/in/mein-name",
    placeholderEn: "https://linkedin.com/in/your-profile",
    lucideIcon: "Linkedin"
  },
  {
    id: "tiktok",
    labelDe: "TikTok",
    labelEn: "TikTok",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Verlinke dein TikTok-Konto.",
    descriptionEn: "Link to your active TikTok handle.",
    actionType: "tiktok",
    placeholderDe: "https://tiktok.com/@mein-name",
    placeholderEn: "https://tiktok.com/@your-profile",
    lucideIcon: "Video"
  },
  {
    id: "youtube_channel",
    labelDe: "YouTube-Kanal",
    labelEn: "YouTube Channel",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Verlinke deine YouTube-Kanalseite.",
    descriptionEn: "Connect users to your general YouTube channel page.",
    actionType: "youtube_channel",
    placeholderDe: "https://youtube.com/@mein-kanal",
    placeholderEn: "https://youtube.com/@your-channel",
    lucideIcon: "Youtube"
  },
  {
    id: "facebook",
    labelDe: "Facebook",
    labelEn: "Facebook",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Verlinke dein Facebook-Profil oder deine Fanpage.",
    descriptionEn: "Direct users to your Facebook personal or business page.",
    actionType: "facebook",
    placeholderDe: "https://facebook.com/mein-name",
    placeholderEn: "https://facebook.com/your-page",
    lucideIcon: "Facebook"
  },
  {
    id: "social_collection",
    labelDe: "Socials-Sammlung",
    labelEn: "Social collection",
    category: "social",
    minPlan: "starter",
    descriptionDe: "Bündelt mehrere Social-Media-Profile in einem Button.",
    descriptionEn: "Bundles multiple social media profiles in one button.",
    actionType: "social_collection",
    placeholderDe: "Kein Hauptlink nötig – richte Social Links darunter ein",
    placeholderEn: "No main url needed – set your social links below",
    lucideIcon: "Share2"
  },
  
  // --- LEGACY/HIDDEN/SAFETY ---
  {
    id: "none",
    labelDe: "Keine Funktion (Inaktiver Button / Label)",
    labelEn: "No Action (Inactive Button / Text Label)",
    category: "security",
    minPlan: "starter",
    descriptionDe: "Nutzbar als beschreibendes Infofeld, Trenner oder Spruch.",
    descriptionEn: "Acts as a pure informative text banner, label or spacer.",
    actionType: "none",
    placeholderDe: "Kein Link oder URL wirksam",
    placeholderEn: "No url or execution target will be accessed",
    lucideIcon: "Type"
  }
];

export function getCategoryLabel(cat: string, lang: 'de' | 'en'): string {
  const de: Record<string, string> = {
    contact: "1. Kontakt",
    cloud: "2. Cloud & Dateien",
    download: "3. Download-Bereich",
    media: "4. Medien",
    social: "5. Social & Folgen",
    appointments: "Termine & Verfügbarkeit",
    location: "Standort & Route",
    security: "Sicherheit / Spezial"
  };
  const en: Record<string, string> = {
    contact: "1. Contact",
    cloud: "2. Cloud & Files",
    download: "3. Download area",
    media: "4. Media",
    social: "5. Social & Follow",
    appointments: "Appointments & Availability",
    location: "Location & Directions",
    security: "Security / Special"
  };
  return lang === 'de' ? de[cat] || cat : en[cat] || cat;
}

export function normalizePlan(plan: any): string {
  if (!plan) return 'starter';
  const planLower = plan.toString().trim().toLowerCase();
  if (planLower === 'free' || planLower === 'fun' || planLower === 'starter') return 'starter';
  if (planLower === 'pro') return 'pro';
  if (planLower === 'business') return 'business';
  return 'starter';
}

/**
 * Helper to determine a user's plan from their user profile object
 */
export function getUserPlan(userProfile: any): string {
  if (!userProfile) return 'starter';
  const plan = userProfile.plan || userProfile.planId || 'starter';
  return normalizePlan(plan);
}

/**
 * Helper to retrieve a plan's defined limits
 */
export function getPlanLimits(plan: string): AppPlanLimits {
  const normPlan = normalizePlan(plan);
  const matched = APP_PLANS[normPlan] || APP_PLANS['starter'];
  return matched.limits;
}

/**
 * Check if a plan can utilize a specific feature
 */
export function canUseFeature(plan: string, featureKey: keyof AppPlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const val = limits[featureKey];
  return typeof val === 'boolean' ? val : !!val;
}

/**
 * Returns the minimum plan ID requirement for a given feature
 */
export function getRequiredPlan(featureKey: keyof AppPlanLimits): string {
  const order = ['starter', 'pro', 'business'];
  for (const p of order) {
    if (getPlanLimits(p)[featureKey]) {
      return p;
    }
  }
  return 'pro'; // default fallback for gated features
}

/**
 * Helper check to see if a feature is locked under a given plan
 */
export function isFeatureLocked(plan: string, featureKey: keyof AppPlanLimits): boolean {
  return !canUseFeature(plan, featureKey);
}
