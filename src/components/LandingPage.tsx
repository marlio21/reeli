/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { TRANSLATIONS } from '../translations';
import { PLANS } from '../data';
import { pricingPlans } from '../config/plans';
import { PlanType, UserProfile } from '../types';
import { KonuLogo } from './KonuLogo';

/// Local high quality Landing Page translations matching DE and EN
const L_TXTS = {
  de: {
    badge: "★ KLICKBARER UREEL · MINI-WEBSITE · EIN LINK",
    headline: "Eine interaktive ureel-Karte. So einfach oder umfangreich, wie du sie brauchst.",
    subheadline: "Mit ureel.me erstellst du klickbare Werbekarten – von der einfachen 3-Button-Karte bis zur umfangreichen Profilkarte mit vielen Aktionen.",
    explanation: "Wähle eine Vorlage, füge deine Inhalte hinzu und teile deine ureel.me per Link oder QR-Code. Ideal für Schüler, Bewerber, Selbstständige, Unternehmen, Vereine und Dienstleister.",
    ctaStart: "Kostenlos starten",
    ctaSample: "Beispiel ansehen",
    trustNoApp: "Ohne App nutzbar",
    trustSave: "In Kontakten speichern",
    trustQr: "QR-Code & Link teilen",
    trustCurrent: "Immer aktuell",
    
    authTitle: "Willkommen bei ureel.me",
    authSubtitle: "Erstelle deine interaktive ureel-Karte in wenigen Minuten.",
    tabLogin: "Einloggen",
    tabRegister: "Neu registrieren",
    labelEmail: "E-Mail-Adresse",
    labelPassword: "Passwort",
    labelConfirmPassword: "Passwort bestätigen",
    placeholderEmail: "name@beispiel.de",
    placeholderPassword: "••••••••",
    btnForget: "Passwort vergessen?",
    btnEmailLogin: "Jetzt einloggen",
    btnEmailRegister: "Kostenlos registrieren",
    btnGoogle: "Mit Google starten",
    separatorOr: "Oder weiter mit",
    noAccount: "Du hast noch kein Konto? Kostenlos starten",
    haveAccount: "Du hast bereits ein Konto? Einloggen",
    startCreateNotice: "Starte jetzt mit deiner eigenen ureel.me-Karte.",
    
    regFirstName: "Vorname",
    regLastName: "Nachname",
    regDisplayName: "Anzeigename (für deine ureel.me-Seite)",
    regPhone: "Telefonnummer (optional)",
    regStreet: "Straße & Nr. (optional)",
    regPostal: "PLZ (optional)",
    regCity: "Ort (optional)",
    regCountry: "Land (optional)",
    regProfileType: "Profiltyp",
    
    typePrivate: "Privatperson / Creator",
    typeBusiness: "Unternehmen / Business",
    typeProduct: "Produkt",
    typeProject: "Projekt",
    typeFamily: "Familie / Gruppe",
    
    bizHeader: "Unternehmensdaten",
    bizName: "Firmenname",
    bizLegal: "Rechtsform (z.B. GmbH)",
    bizVat: "USt-IdNr. (optional)",
    bizAddress: "Firmenadresse (Straße & Nr.)",
    bizPostal: "PLZ (Firma)",
    bizCity: "Ort (Firma)",
    bizCountry: "Land (Firma)",
    bizContact: "Ansprechpartner",
    bizWebsite: "Website URL",
    
    featuresTitle: "Alles, was du für deinen Auftritt brauchst",
    featuresSub: "ureel.me vereint die Stärke einer Smartphone-Werbekarte mit der Einfachheit einer Werbekarte.",
    
    feat1Title: "Klickbare Werbekarte",
    feat1Desc: "Alle wichtigen Kontaktdaten, Social-Links und Anschriften vereint in einem einzigen Premium-Link.",
    
    feat2Title: "Smartphone-Werbekarte",
    feat2Desc: "Präsentiere dein gesamtes Profil, Portfoliogalerien, Angebote, PDFs und Dateien stilvoll auf einer Seite.",
    
    feat3Title: "Kontakt speichern",
    feat3Desc: "Empfänger können deine kompletten Kontaktdaten mit einem einzigen Klick direkt in ihrem Adressbuch sichern.",
    
    feat4Title: "QR-Code & Teilen",
    feat4Desc: "Teile deine Seite blitzschnell per elegantem QR-Code, über WhatsApp, Social Media oder als Link.",
    
    feat5Title: "Individuelles Design",
    feat5Desc: "Gestalte alles nach deinen Wünschen: Ändere Hintergrundbilder, Design-Presse, Buttons, Schriftarten und Icons.",
    
    feat6Title: "Immer aktuell",
    feat6Desc: "Ändere Kontaktdaten oder Verlinkungen jederzeit im Handumdrehen – deine geteilten Links bleiben dauerhaft gleich.",
    
    showcaseTitle: "So kann deine ureel.me aussehen",
    showcaseSub: "Entdecke inspirierende Layouts aus unterschiedlichen Branchen.",
    
    showcase1Title: "Business & Beratung",
    showcase1Name: "MSc. Elena Weber",
    showcase1Subtitle: "Unternehmensberaterin & Coach",
    showcase1Desc: "Exklusives dunkles Minimal-Design für professionelle Dienstleister.",
    
    showcase2Title: "Tischlerei & Handwerk",
    showcase2Name: "Holzmanufaktur Holzer",
    showcase2Subtitle: "Meisterbetrieb seit 1994",
    showcase2Desc: "Warmes, erdiges Design. Ideal für Handwerk, Ateliers und Manufakturen.",
    
    showcase3Title: "Gastro & Service",
    showcase3Name: "Ristorante Bella Vista",
    showcase3Subtitle: "Authentische italienische Küche",
    showcase3Desc: "Elegantes Design mit direkter Menükarte (PDF) und Tischreservierung.",
    
    pricingTeaser: "Kostenlos starten – später upgraden, wenn du mehr brauchst.",
    pricingBestseller: "Empfohlen",
    pricingTitle: "Tarife & Leistungspakete",
    pricingSub: "Wähle das passende Paket für deine Ansprüche. Alle Limits im Gratis-Aufenthalt sind voll funktionsfähig.",
    
    mockupName: "Marc Lehmann",
    mockupJob: "Unternehmensberater & Coach",
    mockupBio: "Strategische Beratung für KMU & Selbstständige. Lass uns gemeinsam wachsen und neue Potenziale heben.",
    btnSaveContact: "In Kontakten speichern",
    btnCreateOwn: "Eigene ureel.me erstellen",
    
    mockBtnPhone: "Telefon",
    mockBtnWhatsapp: "WhatsApp",
    mockBtnEmail: "E-Mail",
    mockBtnWebsite: "Website",
    mockBtnInsta: "Instagram",
    mockBtnMap: "Standort",
    mockBtnPortfolio: "Portfolio (PDF)",
    mockBtnPrices: "Preise & Tarife",
    mockBtnBooking: "Termin buchen",
    
    helpLabel: "Hilfe",
    featuresLabel: "Funktionen",
    examplesLabel: "Beispiele",
    pricingLabel: "Preise",
    signUpLabel: "Kostenlos starten"
  },
  en: {
    badge: "★ DIGITAL BUSINESS CARD · MINI WEBSITE · ONE LINK",
    headline: "One digital card. As simple or comprehensive as you need it.",
    subheadline: "With ureel.me you create modern contact cards – from a simple 3-button card to a comprehensive profile card with many actions.",
    explanation: "Choose a template, add your content, and share your ureel.me via link or QR code. Ideal for students, applicants, freelancers, companies, clubs, and service providers.",
    ctaStart: "Start for free",
    ctaSample: "View example",
    trustNoApp: "No app required",
    trustSave: "Save to contacts",
    trustQr: "Share by QR code & link",
    trustCurrent: "Always up to date",
    
    authTitle: "Welcome to ureel.me",
    authSubtitle: "Create your digital card in just a few minutes.",
    tabLogin: "Sign in",
    tabRegister: "Create account",
    labelEmail: "Email address",
    labelPassword: "Password",
    labelConfirmPassword: "Confirm password",
    placeholderEmail: "name@example.com",
    placeholderPassword: "••••••••",
    btnForget: "Forgot password?",
    btnEmailLogin: "Sign in",
    btnEmailRegister: "Create free account",
    btnGoogle: "Continue with Google",
    separatorOr: "Or continue with",
    noAccount: "No account yet? Start for free",
    haveAccount: "Already have an account? Sign in",
    startCreateNotice: "Start now with your own ureel.me card.",
    
    regFirstName: "First Name",
    regLastName: "Last Name",
    regDisplayName: "Display Name (for your ureel.me page)",
    regPhone: "Phone number (optional)",
    regStreet: "Street & No. (optional)",
    regPostal: "PLZ (optional)",
    regCity: "City (optional)",
    regCountry: "Country (optional)",
    regProfileType: "Profile Type",
    
    typePrivate: "Private individual / Creator",
    typeBusiness: "Company / Business",
    typeProduct: "Product Showcase",
    typeProject: "Project page",
    typeFamily: "Family / Group",
    
    bizHeader: "Corporate details",
    bizName: "Company Name",
    bizLegal: "Legal form (e.g. Inc.)",
    bizVat: "Vat ID (optional)",
    bizAddress: "Company Address (Street & No.)",
    bizPostal: "PLZ (Company)",
    bizCity: "City (Company)",
    bizCountry: "Country (Company)",
    bizContact: "Contact Person",
    bizWebsite: "Website URL",
    
    featuresTitle: "Everything you need for your presence",
    featuresSub: "ureel.me combines the power of a mini-website with the absolute simplicity of a smart business card.",
    
    feat1Title: "Digital business card",
    feat1Desc: "Your vital contact info, social accounts, and addresses beautifully curated into a single link.",
    
    feat2Title: "Mini website",
    feat2Desc: "Broadcast your portfolio galleries, products, service descriptions, menu lists and files elegantly.",
    
    feat3Title: "Save contact",
    feat3Desc: "Allow visitors to instant-save your complete phone book records with a unified action button directly.",
    
    feat4Title: "QR code & sharing",
    feat4Desc: "Propagate your card using dynamic luxury QR codes, WhatsApp messages, NFC tokens or clear handles.",
    
    feat5Title: "Custom design",
    feat5Desc: "Customize your layout completely: swap cover and wallpaper images, button rounding, custom scales, icons, and colors.",
    
    feat6Title: "Always up to date",
    feat6Desc: "Update details instantly within the editor – no re-printing or re-sharing required. The link stays the same.",
    
    showcaseTitle: "This is what your ureel.me can look like",
    showcaseSub: "Discover inspiring layouts across various industries.",
    
    showcase1Title: "Business & Consulting",
    showcase1Name: "MSc. Elena Weber",
    showcase1Subtitle: "Management Consultant & Coach",
    showcase1Desc: "Premium dark minimal design for professional consultants and executives.",
    
    showcase2Title: "Carpentry & Crafts",
    showcase2Name: "Holzmanufaktur Holzer",
    showcase2Subtitle: "Master craftsman since 1994",
    showcase2Desc: "Warm, textured timber palette. Perfect for makers, studios and workshops.",
    
    showcase3Title: "Dining & Gastronomy",
    showcase3Name: "Ristorante Bella Vista",
    showcase3Subtitle: "Authentic Italian hospitality",
    showcase3Desc: "Sleek card design with online tables booking CTA and food PDF menu.",
    
    pricingTeaser: "Start free – upgrade later when you need more.",
    pricingBestseller: "Popular",
    pricingTitle: "Tariffs & Service plans",
    pricingSub: "Choose the package matching your needs. All features inside the Free tier are fully production ready.",
    
    mockupName: "Marc Lehmann",
    mockupJob: "Unternehmensberater & Coach",
    mockupBio: "Strategische Beratung für KMU & Selbstständige. Lass uns gemeinsam wachsen und neue Pfade beschreiten.",
    btnSaveContact: "Save contact",
    btnCreateOwn: "Create your own ureel.me",
    
    mockBtnPhone: "Phone",
    mockBtnWhatsapp: "WhatsApp",
    mockBtnEmail: "Email",
    mockBtnWebsite: "Website",
    mockBtnInsta: "Instagram",
    mockBtnMap: "Location",
    mockBtnPortfolio: "Portfolio (PDF)",
    mockBtnPrices: "Pricing & Plans",
    mockBtnBooking: "Book Session",
    
    helpLabel: "Help",
    featuresLabel: "Features",
    examplesLabel: "Showcase",
    pricingLabel: "Pricing",
    signUpLabel: "Get Started Free"
  }
};

interface ExampleCard {
  id: string;
  title: { de: string; en: string };
  type: { de: string; en: string };
  targetGroup: { de: string; en: string };
  useCase: { de: string; en: string };
  benefit: { de: string; en: string };
  buttonCountLabel: { de: string; en: string };
  name: string;
  subtitle: { de: string; en: string };
  bio: { de: string; en: string };
  theme: string;
  avatar: string;
  bgImage?: string;
  bgOverlay?: string;
  banner?: string;
  background: string;
  textColor: string;
  subtitleColor: string;
  bioColor: string;
  avatarBorder: string;
  buttonShape: string;
  buttonBg: string;
  buttonTextColor?: string;
  buttonIconColor: string;
  hasProfileArea: boolean;
  buttons: Array<{ label: { de: string; en: string }; icon: string }>;
}

const CARD_ROTATION_INTERVAL_MS = 2500;

const EXAMPLE_CARDS: ExampleCard[] = [
  {
    id: "visitenkarte",
    title: { de: "1. Werbekarte", en: "1. Business Card" },
    type: { de: "Klassische digitale Werbekarte", en: "Classic Digital Business Card" },
    targetGroup: { de: "Für Beruf, Networking und schnellen Kontakt.", en: "For business, networking, and quick contact." },
    useCase: { de: "Ideal, wenn du deine wichtigsten Kontaktdaten professionell teilen möchtest.", en: "Ideal when you want to share your key contact details professionally." },
    benefit: { de: "Kompakt, übersichtlich und sofort speicherbar.", en: "Compact, clear, and instantly saveable." },
    buttonCountLabel: { de: "3 Buttons: Telefon, E-Mail, LinkedIn", en: "3 buttons: Phone, Email, LinkedIn" },
    name: "Anna Berger",
    subtitle: { de: "Marketing & Kommunikation", en: "Marketing & Communication" },
    bio: { 
      de: "Klickbare Werbekarte für schnellen Kontakt und professionellen Austausch.",
      en: "Digital business card for quick contact and professional networking."
    },
    theme: "light",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=305&q=80",
    background: "bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EE] to-[#F1E8DC] border border-stone-200/80 shadow-md",
    textColor: "text-stone-800",
    subtitleColor: "text-[#A855F7] font-extrabold",
    bioColor: "text-stone-550 font-medium",
    avatarBorder: "border-white shadow-md ring-4 ring-[#A855F7]/20",
    buttonShape: "circle",
    buttonBg: "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-stone-200 hover:border-stone-300",
    buttonTextColor: "text-stone-800",
    buttonIconColor: "#A855F7",
    hasProfileArea: true,
    buttons: [
      { label: { de: "Telefon", en: "Phone" }, icon: "Phone" },
      { label: { de: "E-Mail", en: "Email" }, icon: "Mail" },
      { label: { de: "LinkedIn", en: "LinkedIn" }, icon: "Linkedin" }
    ]
  },
  {
    id: "privat",
    title: { de: "2. Privatkarte", en: "2. Private Card" },
    type: { de: "Private Profilkarte", en: "Private Profile Card" },
    targetGroup: { de: "Für Bewerbung, Social Links und direkten Kontakt.", en: "For applications, social links, and direct contact." },
    useCase: { de: "Ideal, wenn nur die wichtigsten Kontaktwege sichtbar sein sollen.", en: "Ideal when only the most important contact ways should be visible." },
    benefit: { de: "Frisch, modern und besonders geeignet für Jugendliche, Bewerber und Creator.", en: "Fresh, modern, and especially suited for students, applicants, and creators." },
    buttonCountLabel: { de: "4 Buttons: WhatsApp, E-Mail, Instagram, Website", en: "4 buttons: WhatsApp, Email, Instagram, Website" },
    name: "Lena Weiss",
    subtitle: { de: "Privatprofil & Bewerbung", en: "Private Profile & Application" },
    bio: { 
      de: "Eine persönliche Karte für Kontakt, Bewerbung und Social Links.",
      en: "A personal card for contact, applications, and social links."
    },
    theme: "fresh",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=305&q=80",
    background: "bg-gradient-to-tr from-[#FFF1F2] via-[#F5F3FF] to-[#ECFDF5] border border-stone-200/80 shadow-md",
    textColor: "text-stone-900",
    subtitleColor: "text-violet-600 font-extrabold",
    bioColor: "text-stone-600 font-semibold",
    avatarBorder: "border-white shadow-md ring-4 ring-violet-300/40",
    buttonShape: "circle",
    buttonBg: "bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-stone-200/60 backdrop-blur-sm hover:bg-white",
    buttonTextColor: "text-stone-950",
    buttonIconColor: "#8B5CF6",
    hasProfileArea: true,
    buttons: [
      { label: { de: "WhatsApp", en: "WhatsApp" }, icon: "MessageSquare" },
      { label: { de: "E-Mail", en: "Email" }, icon: "Mail" },
      { label: { de: "Instagram", en: "Instagram" }, icon: "Instagram" },
      { label: { de: "Website", en: "Website" }, icon: "Globe" }
    ]
  },
  {
    id: "produkt",
    title: { de: "3. Produktkarte", en: "3. Product Card" },
    type: { de: "Produkt- oder Angebotskarte", en: "Product or Offer Card" },
    targetGroup: { de: "Für Produkte, Aktionen, NFC-Karten oder digitale Services.", en: "For products, campaigns, NFC cards, or digital services." },
    useCase: { de: "Ein Produktprofil zeigt dein Angebot kompakt mit Website, Anfrage und Download.", en: "A product profile displays your offer compactly with website, inquiry, and download." },
    benefit: { de: "Produktorientiert, modern und verkaufsstark.", en: "Product-oriented, modern, and sales-focused." },
    buttonCountLabel: { de: "5 Buttons: Produkt, Website, Anfrage, Download, Kontakt", en: "5 buttons: Product, Website, Inquiry, Download, Contact" },
    name: "ureel.me NFC Card",
    subtitle: { de: "Digitale Karte für dein Netzwerk", en: "Digital Card for your network" },
    bio: { 
      de: "Ein Produktprofil mit Kontakt, Website und Downloadmöglichkeit.",
      en: "A product profile with contact option, website link and specs download."
    },
    theme: "produkt",
    avatar: "logo-crown",
    bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    bgOverlay: "bg-gradient-to-b from-stone-950/85 via-stone-900/60 to-stone-950/90",
    background: "border border-stone-800 shadow-xl overflow-hidden",
    textColor: "text-stone-100",
    subtitleColor: "text-amber-500 font-extrabold",
    bioColor: "text-stone-300 font-medium",
    avatarBorder: "border-[#A855F7] shadow-lg ring-4 ring-amber-500/25",
    buttonShape: "rect",
    buttonBg: "bg-stone-900/80 backdrop-blur-md border border-stone-800 hover:border-stone-700 hover:bg-stone-850",
    buttonTextColor: "text-stone-200",
    buttonIconColor: "#F59E0B",
    hasProfileArea: false,
    buttons: [
      { label: { de: "Produkt", en: "Product" }, icon: "ShoppingBag" },
      { label: { de: "Website", en: "Website" }, icon: "Globe" },
      { label: { de: "Anfrage", en: "Inquiry" }, icon: "MessageSquare" },
      { label: { de: "Download", en: "Download" }, icon: "Download" },
      { label: { de: "Kontakt", en: "Contact" }, icon: "User" }
    ]
  },
  {
    id: "tischler",
    title: { de: "4. Tischler", en: "4. Carpenter" },
    type: { de: "Dienstleisterkarte", en: "Service Provider Card" },
    targetGroup: { de: "Für lokale Dienstleister, Handwerker und Betriebe.", en: "For local service providers, craftsmen, and businesses." },
    useCase: { de: "Ideal, damit Kunden direkt Kontakt aufnehmen, Leistungen ansehen oder Termine buchen.", en: "Ideal for clients to contact you directly, view services, or book appointments." },
    benefit: { de: "Warmes, hochwertiges Handwerker-Design, das Vertrauen schafft.", en: "Warm, premium craftsman design that fosters trust." },
    buttonCountLabel: { de: "6 Buttons: Anrufen, WhatsApp, Website, Standort, Leistungen, Termin", en: "6 buttons: Call, WhatsApp, Website, Location, Services, Appointment" },
    name: "Tischlerei Hofer",
    subtitle: { de: "Möbelbau & Innenausbau", en: "Bespoke Custom Furniture" },
    bio: { 
      de: "Maßgefertigte Möbel, Reparaturen und persönliche Beratung.",
      en: "Custom furniture, repair work, and personalized consulting."
    },
    theme: "tischler",
    avatar: "logo-hammer",
    bgImage: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80",
    bgOverlay: "bg-gradient-to-b from-stone-950/85 via-stone-900/65 to-stone-950/90",
    background: "border border-orange-950/20 shadow-xl overflow-hidden",
    textColor: "text-amber-50",
    subtitleColor: "text-amber-400 font-extrabold",
    bioColor: "text-amber-100/70 font-medium",
    avatarBorder: "border-[#A855F7] shadow-lg ring-4 ring-[#A855F7]/20",
    buttonShape: "circle",
    buttonBg: "bg-stone-950/80 backdrop-blur-md border border-stone-800 hover:bg-stone-900 hover:border-stone-700 active:scale-95 transition",
    buttonTextColor: "text-stone-200",
    buttonIconColor: "#B45309",
    hasProfileArea: true,
    buttons: [
      { label: { de: "Anrufen", en: "Call" }, icon: "Phone" },
      { label: { de: "WhatsApp", en: "WhatsApp" }, icon: "MessageSquare" },
      { label: { de: "Website", en: "Website" }, icon: "Globe" },
      { label: { de: "Standort", en: "Location" }, icon: "MapPin" },
      { label: { de: "Leistungen", en: "Services" }, icon: "Wrench" },
      { label: { de: "Termin", en: "Appointment" }, icon: "Calendar" }
    ]
  },
  {
    id: "schwimmverein",
    title: { de: "5. Schwimmverein", en: "5. Swimming Club" },
    type: { de: "Vereinskarte", en: "Club Card" },
    targetGroup: { de: "Für Sportvereine, Gruppen und Organisationen.", en: "For sports clubs, groups, and organizations." },
    useCase: { de: "Bündelt alle wichtigen Links wie Trainingszeiten, Termine und Mitgliedschaft.", en: "Bundles all important links such as training schedules, dates, and membership." },
    benefit: { de: "Sportlich, frisch und perfekt abgestimmt auf Vereinsaktivitäten.", en: "Athletic, fresh, and perfectly tuned for club activities." },
    buttonCountLabel: { de: "7 Buttons: Training, Termine, Mitgliedschaft, Kontakt, Standort, Galerie, Aktuelles", en: "7 buttons: Training, Dates, Membership, Contact, Location, Gallery, Feed" },
    name: "Aqua Futura",
    subtitle: { de: "Schwimmverein", en: "Swimming Club" },
    bio: { 
      de: "Trainingszeiten, Veranstaltungen und Mitgliedschaft auf einen Blick.",
      en: "Training hours, upcoming events, and membership details at a glance."
    },
    theme: "schwimmverein",
    avatar: "logo-swim",
    bgImage: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?auto=format&fit=crop&w=600&q=80",
    bgOverlay: "bg-gradient-to-b from-sky-950/85 via-sky-900/65 to-sky-950/90",
    background: "border border-sky-900/20 shadow-xl overflow-hidden",
    textColor: "text-sky-50",
    subtitleColor: "text-sky-400 font-extrabold",
    bioColor: "text-sky-100/70 font-medium",
    avatarBorder: "border-sky-400 shadow-lg ring-4 ring-sky-400/30",
    buttonShape: "circle",
    buttonBg: "bg-sky-950/80 backdrop-blur-md border border-sky-850 hover:bg-sky-900 hover:border-sky-700 active:scale-95 transition",
    buttonTextColor: "text-sky-200",
    buttonIconColor: "#38BDF8",
    hasProfileArea: true,
    buttons: [
      { label: { de: "Training", en: "Training" }, icon: "CalendarDays" },
      { label: { de: "Termine", en: "Dates" }, icon: "Calendar" },
      { label: { de: "Mitglied", en: "Join" }, icon: "UserPlus" },
      { label: { de: "Kontakt", en: "Contact" }, icon: "Mail" },
      { label: { de: "Standort", en: "Map" }, icon: "MapPin" },
      { label: { de: "Galerie", en: "Gallery" }, icon: "Camera" },
      { label: { de: "Aktuelles", en: "Feed" }, icon: "Info" }
    ]
  },
  {
    id: "autohaus",
    title: { de: "6. Autohaus", en: "6. Car Dealership" },
    type: { de: "Unternehmenskarte", en: "Corporate/Enterprise Card" },
    targetGroup: { de: "Für Autohäuser, Händler, Premium-Marken und Verkaufsstellen.", en: "For car dealerships, retailers, premium brands, and outlets." },
    useCase: { de: "Kunden können unkompliziert Probefahrten buchen, Fahrzeuge suchen oder Angebote einholen.", en: "Clients can easily book test drives, view stock, or request financial quotes." },
    benefit: { de: "Premium Dark-Look mit maximalem Funktionsumfang auf einer Karte.", en: "Premium dark look bundling maximum functions efficiently on one single page." },
    buttonCountLabel: { de: "9 Buttons: Anrufen, WhatsApp, Fahrzeuge, Probefahrt, Standort, Service, Finanzierung, Galerie, Kontakt", en: "9 buttons: Call, WhatsApp, Vehicles, Test Drive, Location, Service, Finance, Gallery, Contact" },
    name: "Luxoria Motors",
    subtitle: { de: "Autohaus & Premium Service", en: "Dealership & Premium Service" },
    bio: { 
      de: "Fahrzeuge, Probefahrt, Service und persönliche Beratung.",
      en: "Premium vehicles, certified garage services and personal assistance."
    },
    theme: "autohaus",
    avatar: "logo-crest",
    bgImage: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80",
    bgOverlay: "bg-gradient-to-b from-stone-950/90 via-stone-900/70 to-stone-950/95",
    background: "border border-stone-850 shadow-2xl overflow-hidden",
    textColor: "text-stone-50",
    subtitleColor: "text-rose-500 font-extrabold",
    bioColor: "text-stone-300 font-medium",
    avatarBorder: "border-stone-850 shadow-lg ring-4 ring-rose-500/20",
    buttonShape: "rect",
    buttonBg: "bg-[#121214]/90 backdrop-blur-md border border-stone-850 hover:bg-[#161619] active:scale-[0.98] transition shadow-sm",
    buttonTextColor: "text-stone-200",
    buttonIconColor: "#EF4444",
    hasProfileArea: true,
    buttons: [
      { label: { de: "Anrufen", en: "Call" }, icon: "Phone" },
      { label: { de: "WhatsApp", en: "WhatsApp" }, icon: "MessageSquare" },
      { label: { de: "Fahrzeuge", en: "Vehicles" }, icon: "Car" },
      { label: { de: "Probefahrt", en: "Test Drive" }, icon: "CalendarRange" },
      { label: { de: "Standort", en: "Map" }, icon: "MapPin" },
      { label: { de: "Service", en: "Service" }, icon: "Wrench" },
      { label: { de: "Finanzierung", en: "Finance" }, icon: "CreditCard" },
      { label: { de: "Galerie", en: "Gallery" }, icon: "Camera" },
      { label: { de: "Kontakt", en: "Contact" }, icon: "Mail" }
    ]
  }
];

const renderExampleIcon = (iconName: string, color: string, size = 18) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
  return <IconComponent size={size} style={{ color }} />;
};

interface LandingPageProps {
  lang: 'de' | 'en';
  setLang: (l: 'de' | 'en') => void;
  onEnterDashboard: () => void;
  onGoToRoute: (r: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  setLang,
  onEnterDashboard,
  onGoToRoute
}) => {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, sendPasswordReset } = useFirebase();
  const tGlobal = TRANSLATIONS[lang];
  const t = L_TXTS[lang];

  // User agreement states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isStartCreateHighlighted, setIsStartCreateHighlighted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Active example card selection tab
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Billing Period state for pricing
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Authentication mode ('login' vs 'register')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<number>(1);

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Extended Account Profile Form
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [accountType, setAccountType] = useState<'private' | 'business' | 'product' | 'project' | 'family'>('private');
  
  // Custom Company attributes
  const [companyName, setCompanyName] = useState('');
  const [companyLegalForm, setCompanyLegalForm] = useState('');
  const [vatId, setVatId] = useState('');
  const [companyAddressLine1, setCompanyAddressLine1] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('Deutschland');
  const [contactPerson, setContactPerson] = useState('');
  const [website, setWebsite] = useState('');

  // Auto trigger check for ?start=create URL parameter or /signup route
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSignupUrl = window.location.pathname === '/signup';
    const isStartCreate = params.get('start') === 'create';
    const isModeSignup = params.get('mode') === 'signup';
    
    if (isStartCreate || isSignupUrl || isModeSignup) {
      setAuthMode('register');
      setIsStartCreateHighlighted(true);
      const authBox = document.getElementById('auth-box');
      if (authBox) {
        setTimeout(() => {
          authBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 180);
      }
    }
  }, []);

  // Automatically rotate showcase cards every second (CARD_ROTATION_INTERVAL_MS)
  // Re-creates the interval on activeCardIndex change to ensure a full second of display after manual clicks
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % EXAMPLE_CARDS.length);
    }, CARD_ROTATION_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeCardIndex]);

  const translateAuthError = (errCode: string): string => {
    switch (errCode) {
      case 'auth/email-already-in-use':
        return lang === 'de' 
          ? 'Die E-Mail-Adresse ist bereits registriert. Bitte wähle den Login.'
          : 'Detailed email is already registered. Please login instead.';
      case 'auth/weak-password':
        return lang === 'de'
          ? 'Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.'
          : 'Password is too weak. Minimum 6 character length necessary.';
      case 'auth/invalid-email':
        return lang === 'de'
          ? 'Die angegebene E-Mail-Adresse ist ungültig.'
          : 'The entered email address is invalid.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return lang === 'de'
          ? 'Die E-Mail-Adresse oder das Kennwort ist nicht korrekt.'
          : 'Incorrect credentials or password. Please verify your typed key.';
      case 'auth/user-not-found':
        return lang === 'de'
          ? 'Es wurde kein Benutzer mit dieser E-Mail-Adresse gefunden.'
          : 'No account matching this email resolved.';
      case 'auth/permission-denied':
        return lang === 'de'
          ? 'Fehlende Berechtigung für den Zugriff.'
          : 'Permission denied. Could not access record.';
      default:
        return lang === 'de'
          ? 'Ein unvorhergesehener Fehler ist aufgetreten. Bitte versuche es erneut.'
          : 'An unexpected authentication error happened. Please retry.';
    }
  };

  const getGermanErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || String(err);
    if (code) {
      return translateAuthError(code);
    }
    if (message.includes('auth/email-already-in-use') || message.includes('email-already-in-use')) {
      return translateAuthError('auth/email-already-in-use');
    }
    if (message.includes('auth/weak-password') || message.includes('weak-password')) {
      return translateAuthError('auth/weak-password');
    }
    if (message.includes('auth/invalid-email') || message.includes('invalid-email')) {
      return translateAuthError('auth/invalid-email');
    }
    if (message.includes('auth/wrong-password') || message.includes('wrong-password') || message.includes('invalid-credential') || message.includes('auth/invalid-credential')) {
      return translateAuthError('auth/wrong-password');
    }
    if (message.includes('auth/user-not-found') || message.includes('user-not-found')) {
      return translateAuthError('auth/user-not-found');
    }
    if (message.includes('auth/permission-denied') || message.includes('permission-denied')) {
      return translateAuthError('auth/permission-denied');
    }
    return translateAuthError('default');
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regStep === 1) {
      if (!email.trim()) {
        setAuthError(lang === 'de' ? 'Bitte E-Mail-Adresse eingeben.' : 'Please enter your email address.');
        return;
      }
      if (!password.trim()) {
        setAuthError(lang === 'de' ? 'Bitte Passwort eingeben.' : 'Please enter your password.');
        return;
      }
      if (password.length < 6) {
        setAuthError(lang === 'de' ? 'Das Passwort muss mindestens 6 Zeichen lang sein.' : 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError(lang === 'de' ? 'Passwörter stimmen nicht überein.' : 'Passwords do not match.');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!firstName.trim() || !lastName.trim() || !displayName.trim()) {
        setAuthError(lang === 'de' ? 'Bitte Vorname, Nachname und Anzeigename ausfüllen. (Diese werden auf deiner Karte verwendet)' : 'Please fill in first name, last name and display name. (These will be used on your card)');
        return;
      }
      setRegStep(3);
    } else if (regStep === 3) {
      setRegStep(4);
    }
  };

  const handleBackStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthError('');
    if (regStep > 1) {
      setRegStep(regStep - 1);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetSuccess('');

    if (!email.trim() || !password.trim()) {
      setAuthError(lang === 'de' ? 'Bitte geben Sie E-Mail und Passwort ein.' : 'Please enter your email and password.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setAuthError(lang === 'de' ? 'Bitte Name eingeben.' : 'Please enter your name.');
        return;
      }
      if (!email.trim() || !email.includes('@') || !email.split('@')[1]?.includes('.')) {
        setAuthError(lang === 'de' ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : 'Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setAuthError(lang === 'de' ? 'Das Passwort muss mindestens 6 Zeichen lang sein.' : 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError(lang === 'de' ? 'Die Passwörter stimmen nicht überein.' : 'Passwords do not match.');
        return;
      }
      if (!acceptedTerms || !acceptedPrivacy) {
        setAuthError(lang === 'de' ? 'Bitte akzeptiere AGB und Datenschutzerklärung.' : 'Please accept terms and privacy declarations.');
        return;
      }
    }

    setIsAuthenticating(true);
    try {
      if (authMode === 'register') {
        const extraData: Partial<UserProfile> = {
          name: name.trim(),
          displayName: name.trim(),
          companyName: companyName.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          street: street.trim() || undefined,
          zip: zip.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || 'Deutschland',
          vatId: vatId.trim() || undefined,
          accountType: companyName.trim() ? 'business' : 'private',
        };
        await registerWithEmail(email, password, acceptedTerms, acceptedPrivacy, newsletterConsent, extraData);
      } else {
        await loginWithEmail(email, password);
      }
      onEnterDashboard();
    } catch (err: any) {
      console.error(err);
      setAuthError(getGermanErrorMessage(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setAuthError(lang === 'de' ? 'Bitte trage zuerst deine E-Mail-Adresse ein.' : 'Please enter your email address first.');
      return;
    }
    setAuthError('');
    setResetSuccess('');
    setIsAuthenticating(true);
    try {
      await sendPasswordReset(email);
      setResetSuccess(
        lang === 'de' 
          ? 'Eine E-Mail zum Zurücksetzen deines Passworts wurde versendet.' 
          : 'Password reset link sent to your email.'
      );
    } catch (err: any) {
      setAuthError(getGermanErrorMessage(err));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setResetSuccess('');
    setIsAuthenticating(true);
    try {
      await loginWithGoogle(true, true, newsletterConsent);
      onEnterDashboard();
    } catch (err: any) {
      console.error(err);
      const errStr = String(err?.message || err?.code || err);
      if (errStr.includes('auth/unauthorized-domain') || errStr.includes('unauthorized-domain')) {
        setAuthError(
          lang === 'de'
            ? 'Autorisierungs-Fehler (unauthorized-domain): Diese Domain ist nicht freigegeben in Firebase Authentication.'
            : 'Authorization Error (unauthorized-domain): This domain is not authorized under Firebase authentication yet.'
        );
      } else {
        setAuthError(
          lang === 'de' 
            ? `Google-Authentifizierung fehlgeschlagen: ${err?.message || err}` 
            : `Google authentication failed: ${err?.message || err}`
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] bg-premium-grid text-[#F5EFE3] font-sans selection:bg-[#A855F7] selection:text-stone-950 relative overflow-hidden transition-all duration-300">
      
      {/* Decorative Radial Glass Orbs */}
      <div className="absolute top-[-10%] left-[5%] w-[450px] h-[450px] bg-[#A855F7]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[450px] h-[450px] bg-[#A855F7]/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Modern Navigation Header */}
      <header className="border-b border-stone-900 bg-[#0E0E0E]/90 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-3 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo Left */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <KonuLogo size="sm" variant="gold" showSlogan={false} />
          </div>

          {/* Core Central Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-stone-400">
            <button 
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition duration-200 cursor-pointer"
            >
              {t.featuresLabel}
            </button>
            <button 
              onClick={() => scrollToSection('showcase')}
              className="hover:text-white transition duration-200 cursor-pointer"
            >
              {t.examplesLabel}
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="hover:text-white transition duration-200 cursor-pointer"
            >
              {t.pricingLabel}
            </button>
            <a 
              href="#auth-box"
              onClick={(e) => { e.preventDefault(); scrollToSection('auth-box'); }}
              className="hover:text-white transition duration-200 text-stone-300"
            >
              {lang === 'de' ? 'Anmelden' : 'Login'}
            </a>
          </nav>

          {/* Action Tools Right */}
          <div className="flex items-center gap-3">
            
            {/* Minimal Language switcher badge */}
            <div className="flex bg-stone-950/80 p-0.5 rounded-full border border-stone-850 text-[10px] font-extrabold tracking-tight">
              <button 
                type="button"
                onClick={() => setLang('de')}
                className={`cursor-pointer px-2.5 py-1 rounded-full transition-all ${lang === 'de' ? 'bg-[#A855F7] text-stone-950 font-black' : 'text-stone-450 hover:text-white'}`}
              >
                DE
              </button>
              <button 
                type="button"
                onClick={() => setLang('en')}
                className={`cursor-pointer px-2.5 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-[#A855F7] text-stone-950 font-black' : 'text-stone-450 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {user ? (
              <button
                onClick={onEnterDashboard}
                className="bg-[#A855F7] hover:bg-[#7E22CE] shadow-[0_4px_16px_rgba(201,166,70,0.2)] text-stone-950 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {tGlobal.dashboard}
              </button>
            ) : (
              <button
                onClick={() => scrollToSection('auth-box')}
                className="hidden sm:inline-block bg-[#161616] hover:bg-[#1E1E1E] border border-[#A855F7]/30 text-[#F5EFE3] font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {t.signUpLabel}
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Premium Hero and Interactive Main split area */}
      <section id="hero" className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-20 relative z-10">
        
        {/* Responsive Grid layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
          
          {/* Left Block: Bold Headline and Visual Elements */}
          <div className="lg:col-span-7 space-y-8 flex flex-col justify-center text-left">
            
            <div className="space-y-4">
              <motion.span 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] text-[10px] sm:text-[11px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm"
              >
                {t.badge}
              </motion.span>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight leading-tight text-white uppercase">
                {t.headline.split(' ').map((w, idx) => (
                  <span key={idx} className={w === 'präsenz' || w === 'presence' ? 'text-[#A855F7] italic font-light lowercase' : ''}>
                    {w}{' '}
                  </span>
                ))}
              </h1>

              <p className="text-stone-400 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                {t.subheadline}
              </p>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap gap-4 pt-1">
              <button 
                onClick={() => scrollToSection('auth-box')} 
                className="bg-[#C9A641] hover:bg-[#7E22CE] text-stone-950 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-[0_4px_24px_rgba(201,166,70,0.3)] hover:shadow-[0_8px_32px_rgba(201,166,70,0.45)] transition-all flex items-center gap-2 cursor-pointer border-0"
              >
                <LucideIcons.Sparkles size={15} />
                <span>{t.ctaStart}</span>
              </button>
              
              <button 
                onClick={() => scrollToSection('showcase')} 
                className="bg-[#141414] hover:bg-[#1C1C1C] border border-stone-800 text-stone-200 hover:text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition duration-250 cursor-pointer flex items-center gap-2"
              >
                <LucideIcons.Eye size={15} />
                <span>{t.ctaSample}</span>
              </button>
            </div>

            {/* Premium Small Trust points row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-900 max-w-2xl">
              {[
                { icon: <LucideIcons.Tv size={15} />, text: t.trustNoApp },
                { icon: <LucideIcons.Save size={15} />, text: t.trustSave },
                { icon: <LucideIcons.QrCode size={15} />, text: t.trustQr },
                { icon: <LucideIcons.Flame size={15} />, text: t.trustCurrent }
              ].map((pt, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-stone-500 hover:text-stone-300 transition-colors">
                  <span className="text-[#A855F7]">{pt.icon}</span>
                  <span>{pt.text}</span>
                </div>
              ))}
            </div>

            {/* Examples Showcase inside Hero */}
            <div className="pt-8 block space-y-6">
              <div className="space-y-2 text-left">
                <span className="text-[#A855F7] text-[10px] font-black uppercase tracking-widest block font-mono">★★★ {t.examplesLabel}</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {lang === 'de' ? 'Beispiele für deine ureel.me-Karte' : 'Examples of your ureel.me card'}
                </h3>
                <p className="text-stone-400 text-xs font-semibold leading-relaxed max-w-lg">
                  {lang === 'de' ? 'Ob kompakt, klassisch oder umfangreich – wähle ein Design:' : 'Whether compact, classic or comprehensive – choose a design:'}
                </p>
              </div>

              {/* Segmented Controller Tab Bar for Showcase (Available on all devices) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {EXAMPLE_CARDS.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCardIndex(idx)}
                    type="button"
                    className={`py-2 px-3.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 duration-200 transition ${activeCardIndex === idx ? 'bg-[#A855F7] text-stone-950 font-black' : 'bg-[#121214] border border-stone-850 text-stone-400 hover:text-white'}`}
                  >
                    {c.title[lang === 'de' ? 'de' : 'en']}
                  </button>
                ))}
              </div>

              {/* Selected Card Preview & Description Row (Responsive Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-4">
                
                {/* Smartphone Preview Column */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-[320px] h-[580px]">
                    {EXAMPLE_CARDS.map((card, idx) => {
                      if (idx !== activeCardIndex) return null;
                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0"
                        >
                          {/* Smartphone Frame Outer Body container */}
                          <div className="w-[320px] h-[580px] rounded-[48px] bg-[#121214] p-3 border-4 border-stone-800 shadow-2xl flex flex-col justify-between overflow-hidden relative">
                            {/* Speaker notch / hardware pill at top */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#121214] rounded-full z-20 flex items-center justify-center border border-stone-850">
                              <div className="w-10 h-1 bg-stone-800 rounded-full"></div>
                            </div>

                            {/* Screen Content Wrapper */}
                            <div className={`w-full h-full rounded-[38px] ${card.background} flex flex-col overflow-y-auto overflow-x-hidden scrollbar-none pb-4 relative pt-6`}>
                              
                              {/* Full-bleed background image if specified */}
                              {card.bgImage ? (
                                <div className="absolute inset-0 z-0 overflow-hidden rounded-[38px]">
                                  <img 
                                    src={card.bgImage} 
                                    className="w-full h-full object-cover" 
                                    alt="card background" 
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Overlay for legibility inside the phone */}
                                  <div className={`absolute inset-0 z-0 ${card.bgOverlay || 'bg-black/50'}`}></div>
                                </div>
                              ) : null}

                              {/* Realistic phone wallpaper / banner if present */}
                              {card.banner && !card.bgImage ? (
                                <div className="absolute top-0 left-0 w-full h-[120px] overflow-hidden z-0">
                                  <img src={card.banner} className="w-full h-full object-cover opacity-80" alt="banner" />
                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121214]/65"></div>
                                </div>
                              ) : null}

                              {/* Header brand strip */}
                              <div className={`flex items-center justify-between px-5 pt-3 pb-2 z-10 relative ${card.textColor === 'text-white' || card.textColor === 'text-stone-100' || card.textColor === 'text-amber-50' || card.textColor === 'text-sky-50' || card.bgImage ? 'text-white/80' : 'text-stone-705/80'}`}>
                                <div className="flex items-center gap-1.5 font-bold tracking-wider text-[9px] uppercase">
                                  <span className="w-3.5 h-3.5 rounded bg-stone-950 flex items-center justify-center text-[#A855F7] text-[7.5px] font-black">K</span>
                                  <span>ureel.me</span>
                                </div>
                              </div>

                              {/* Profile details */}
                              <div className={`px-5 text-center mt-3 mb-3 z-10 relative ${card.bgImage ? 'pt-4' : card.banner ? 'pt-8' : 'pt-0'}`}>
                                {/* Avatar or Product Hero Graphic */}
                                {card.hasProfileArea ? (
                                  <div className="relative inline-block mb-2.5">
                                    {card.avatar === 'logo-crest' ? (
                                      <div className={`w-18 h-18 rounded-full bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 flex items-center justify-center mx-auto shadow-lg relative ${card.avatarBorder}`}>
                                        <div className="absolute inset-1 border border-[#EF4444]/20 rounded-full flex items-center justify-center">
                                          <LucideIcons.Car size={24} className="text-[#EF4444]" />
                                        </div>
                                      </div>
                                    ) : card.avatar === 'logo-crown' ? (
                                      <div className={`w-18 h-18 rounded-full bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 flex items-center justify-center mx-auto shadow-lg relative ${card.avatarBorder}`}>
                                        <div className="absolute inset-1 border border-amber-500/20 rounded-full flex items-center justify-center">
                                          <LucideIcons.Crown size={24} className="text-[#F59E0B]" />
                                        </div>
                                      </div>
                                    ) : card.avatar === 'logo-hammer' ? (
                                      <div className={`w-18 h-18 rounded-full bg-[#1c120a] border border-amber-900 flex items-center justify-center mx-auto shadow-lg relative ${card.avatarBorder}`}>
                                        <div className="absolute inset-1 border border-[#D97706]/20 rounded-full flex items-center justify-center">
                                          <LucideIcons.Hammer size={24} className="text-[#D97706]" />
                                        </div>
                                      </div>
                                    ) : card.avatar === 'logo-swim' ? (
                                      <div className={`w-18 h-18 rounded-full bg-gradient-to-b from-sky-900 to-sky-950 border border-sky-600 flex items-center justify-center mx-auto shadow-lg relative ${card.avatarBorder}`}>
                                        <div className="absolute inset-1 border border-sky-400/20 rounded-full flex items-center justify-center">
                                          <LucideIcons.Waves size={24} className="text-[#38BDF8]" />
                                        </div>
                                      </div>
                                    ) : (
                                      <img src={card.avatar} className={`w-18 h-18 rounded-full object-cover shadow-lg mx-auto ${card.avatarBorder}`} alt="avatar" referrerPolicy="no-referrer" />
                                    )}
                                  </div>
                                ) : (
                                  /* Product Card NFC Graphic */
                                  <div className="px-1 py-1 text-center">
                                    <div className="w-full bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-850 rounded-2xl p-4 my-2 shadow-lg relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between text-left select-none">
                                      {/* Background sheen */}
                                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                                      <div className="flex justify-between items-start">
                                        <span className="font-sans text-[8px] font-black tracking-widest text-[#A855F7] uppercase">ureel.me PREMIUM</span>
                                        <LucideIcons.Cpu size={14} className="text-amber-500/80 animate-pulse" />
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="text-[11px] font-black text-white/95 tracking-wide">NFC BUSINESS CARD</div>
                                        <div className="text-[7px] font-mono text-stone-500 uppercase">TAP KEY TO SHARE</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <h3 className={`text-sm font-black uppercase tracking-wide leading-tight ${card.textColor}`}>{card.name}</h3>
                                <p className={`text-[9px] font-extrabold uppercase tracking-widest mt-0.5 ${card.subtitleColor}`}>{card.subtitle[lang === 'de' ? 'de' : 'en']}</p>
                                <p className={`text-[10px] font-bold leading-relaxed mt-2 px-1 ${card.bioColor}`}>{card.bio[lang === 'de' ? 'de' : 'en']}</p>
                              </div>

                              {/* Display Buttons based on shape */}
                              <div className="px-3 py-1.5 z-10 relative">
                                {card.buttonShape === 'circle' ? (
                                  <div className="grid grid-cols-3 gap-y-3 gap-x-1 justify-items-center font-bold">
                                    {card.buttons.map((btn, bIdx) => (
                                      <div key={bIdx} className="flex flex-col items-center text-center max-w-[80px] group/btn cursor-pointer">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${card.buttonBg} transition duration-200 active:scale-95 shadow-sm`}>
                                          {renderExampleIcon(btn.icon, card.buttonIconColor, 15)}
                                        </div>
                                        <span className={`text-[9px] font-black tracking-tight mt-1.5 leading-none opacity-90 ${card.textColor}`}>{btn.label[lang === 'de' ? 'de' : 'en']}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : card.buttonShape === 'rect' ? (
                                  <div className="grid grid-cols-3 gap-1.5 px-0.5 font-bold">
                                    {card.buttons.map((btn, bIdx) => (
                                      <div key={bIdx} className={`rounded-lg p-2 flex flex-col items-center justify-center text-center gap-1 ${card.buttonBg} shadow-sm aspect-square active:scale-[0.98] transition cursor-pointer`}>
                                        {renderExampleIcon(btn.icon, card.buttonIconColor, 15)}
                                        <span className={`text-[8.5px] font-extrabold uppercase tracking-wide truncate max-w-full ${card.textColor === 'text-white' || card.textColor === 'text-stone-100' ? 'text-stone-300' : 'text-stone-705'}`}>{btn.label[lang === 'de' ? 'de' : 'en']}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 px-0.5 font-bold">
                                    {card.buttons.map((btn, bIdx) => (
                                      <div key={bIdx} className={`rounded-lg px-2.5 py-2 flex items-center gap-1.5 ${card.buttonBg} shadow-sm active:scale-[0.98] transition cursor-pointer`}>
                                        <div className="shrink-0">{renderExampleIcon(btn.icon, card.buttonIconColor, 14)}</div>
                                        <span className={`text-[9.5px] font-black tracking-tight truncate ${card.buttonTextColor}`}>{btn.label[lang === 'de' ? 'de' : 'en']}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex-grow min-h-[12px]"></div>

                              {/* Save to contacts pill action */}
                              <div className="px-4 pt-0.5 pb-0.5 z-10 relative">
                                <button className={`w-full py-2 px-3 rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.99] border cursor-pointer ${card.textColor === 'text-stone-800' ? 'bg-white border-stone-200 text-stone-900 font-bold' : 'bg-stone-900/90 border-stone-800 text-[#A855F7] font-bold'}`}>
                                  <LucideIcons.UserCheck size={12} className="shrink-0" />
                                  <span>{lang === 'de' ? 'In Kontakten speichern' : 'Save contact'}</span>
                                </button>
                              </div>

                              {/* Create Own ureel.me link CTA */}
                              <div className="px-4 py-0.5 z-10 relative">
                                <button
                                  onClick={() => scrollToSection('auth-box')}
                                  className="w-full py-2 px-3 rounded-lg text-[9.5px] font-black uppercase tracking-widest flex items-center justify-between transition active:scale-[0.99] bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 border-0 cursor-pointer shadow-sm font-black"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-stone-950 flex items-center justify-center text-[#A855F7] text-[8.5px] font-black leading-none">U</span>
                                    <span className="truncate">{lang === 'de' ? 'Eigene ureel erstellen' : 'Create Own ureel'}</span>
                                  </div>
                                  <LucideIcons.ChevronRight size={12} />
                                </button>
                              </div>

                              {/* Card Template Footer text */}
                              <div className={`text-center pt-2 text-[8px] font-semibold tracking-wider opacity-60 uppercase ${card.textColor === 'text-stone-800' ? 'text-stone-500' : 'text-stone-405'}`}>
                                ureel – {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Indicator Dots Navigation */}
                  <div className="flex items-center justify-center gap-2.5 mt-5">
                    {EXAMPLE_CARDS.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCardIndex(idx)}
                        type="button"
                        aria-label={`Select item ${idx + 1}`}
                        className={`w-3 h-3 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                          activeCardIndex === idx 
                            ? 'bg-[#A855F7] scale-125 shadow-[0_0_8px_rgba(201,166,70,0.8)]' 
                            : 'bg-stone-700 hover:bg-stone-500 hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Description Column (Visible beside the smartphone card mockup on desktop, below on mobile) */}
                <div className="md:col-span-7 w-full">
                  {EXAMPLE_CARDS.map((card, idx) => {
                    if (idx !== activeCardIndex) return null;
                    return (
                      <motion.div
                        key={`desc-${card.id}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-[#141416]/60 border border-stone-850 p-6 sm:p-7 rounded-[32px] space-y-6 shadow-xl md:min-h-[580px] flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          {/* Title with badge */}
                          <div className="flex items-center gap-2">
                            <span className="bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded">
                              {card.type[lang === 'de' ? 'de' : 'en']}
                            </span>
                          </div>

                          <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                            {lang === 'de' ? `${card.title.de}` : `${card.title.en}`}
                          </h4>

                          {/* Detail fields of the selected mock card */}
                          <div className="space-y-3.5 pt-2">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-850 flex items-center justify-center text-[#A855F7] shrink-0 mt-0.5">
                                <LucideIcons.Briefcase size={14} />
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-extrabold block">
                                  {lang === 'de' ? '★ Zielgruppe' : '★ Target Group'}
                                </span>
                                <span className="text-stone-250 text-xs sm:text-sm font-semibold leading-relaxed block">
                                  {card.targetGroup[lang === 'de' ? 'de' : 'en']}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 border-t border-stone-850/60 pt-3.5">
                              <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-850 flex items-center justify-center text-[#A855F7] shrink-0 mt-0.5">
                                <LucideIcons.Tv size={14} />
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-extrabold block">
                                  {lang === 'de' ? '★ Nutzung' : '★ Use Case'}
                                </span>
                                <span className="text-stone-250 text-xs sm:text-sm font-semibold leading-relaxed block">
                                  {card.useCase[lang === 'de' ? 'de' : 'en']}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 border-t border-stone-850/60 pt-3.5">
                              <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-850 flex items-center justify-center text-[#A855F7] shrink-0 mt-0.5">
                                <LucideIcons.Sliders size={14} />
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-extrabold block">
                                  {lang === 'de' ? '★ Buttonanzahl & Funktionen' : '★ Button Count & Features'}
                                </span>
                                <span className="text-stone-250 text-xs sm:text-sm font-semibold leading-relaxed block">
                                  {card.buttonCountLabel[lang === 'de' ? 'de' : 'en']}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-start gap-4 border-t border-stone-850/60 pt-3.5">
                              <div className="w-8 h-8 rounded-lg bg-stone-950 border border-stone-850 flex items-center justify-center text-[#A855F7] shrink-0 mt-0.5">
                                <LucideIcons.CheckCircle size={14} />
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 font-extrabold block">
                                  {lang === 'de' ? '★ Nutzen' : '★ Benefit'}
                                </span>
                                <span className="text-stone-250 text-xs sm:text-sm font-semibold leading-relaxed block">
                                  {card.benefit[lang === 'de' ? 'de' : 'en']}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Informative helper label */}
                        <div className="p-4 bg-stone-950/40 rounded-xl border border-stone-850 text-left text-[11px] font-semibold text-stone-400 flex items-center gap-3">
                          <LucideIcons.Info size={14} className="text-[#A855F7] shrink-0" />
                          <span>
                            {lang === 'de' 
                              ? 'Alle gezeigten Beispiele lassen sich unkompliziert und realitätsnah mit der ureel.me-App gestalten.' 
                              : 'All showcased designs can be fully configured in real-time with the ureel.me dashboard features.'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>

          {/* Right Block: Interactive Glass Registration Component */}
          <div className="lg:col-span-5 w-full">
            <div 
              id="auth-box"
              className="w-full bg-[#FCFCFC] border border-stone-200 rounded-[32px] p-5 md:p-6 shadow-xl relative overflow-hidden transition-all duration-300 text-stone-900"
              style={{
                boxShadow: isStartCreateHighlighted 
                  ? '0 0 32px rgba(201,166,70,0.18), inset 0 0 0 1.2px rgba(201,166,70,0.2)' 
                  : '0 10px 40px rgba(0,0,0,0.06)'
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
              
              <div className="text-left mb-5 space-y-1">
                <h3 className="text-lg font-black text-stone-900 tracking-wide uppercase flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
                  {t.authTitle}
                </h3>
                <p className="text-xs text-stone-500 font-bold leading-none">
                  {t.authSubtitle}
                </p>
              </div>

              {/* Special start=create highlight alert label banner if active */}
              {isStartCreateHighlighted && (
                <div className="flex gap-2.5 p-3.5 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-xl mb-4 text-stone-700 text-xs font-bold leading-relaxed shadow-sm">
                  <LucideIcons.Sparkles size={15} className="text-[#A855F7] shrink-0 mt-0.5" />
                  <span>{t.startCreateNotice}</span>
                </div>
              )}

              {user ? (
                <div className="space-y-4">
                  <div className="space-y-3 text-center py-5 bg-stone-100 p-5 rounded-2xl border border-stone-200">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      {lang === 'de' ? 'Angemeldet als' : 'Signed in as'}
                    </p>
                    <p className="text-sm font-black text-stone-900">{user.email}</p>
                    
                    <button
                      onClick={onEnterDashboard}
                      className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer border-0 mt-2"
                    >
                      <LucideIcons.LayoutDashboard size={15} />
                      <span>{tGlobal.dashboard}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Auth Mode Tabs toggle controls button pairs */}
                  <div className="flex bg-stone-100 border border-stone-200 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setRegStep(1);
                        setAuthError('');
                        setResetSuccess('');
                      }}
                      className={`flex-1 text-center text-[10px] font-black uppercase rounded-lg transition-all duration-200 cursor-pointer py-2.5 ${authMode === 'login' ? 'bg-[#A855F7] text-stone-950 font-black' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      {t.tabLogin}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setRegStep(1);
                        setAuthError('');
                        setResetSuccess('');
                      }}
                      className={`flex-1 text-center text-[10px] font-black uppercase rounded-lg transition-all duration-200 cursor-pointer py-2.5 ${authMode === 'register' ? 'bg-[#A855F7] text-stone-950 font-black' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      {t.tabRegister}
                    </button>
                  </div>

                  {/* Step progressive status row (only for registration) */}
                  {authMode === 'register' && (
                    <div className="text-center py-2">
                      <h3 className="text-sm font-black text-stone-850 uppercase tracking-widest">
                        {lang === 'de' ? 'Konto erstellen' : 'Create account'}
                      </h3>
                    </div>
                  )}

                  {/* Mail & Password forms */}
                  <form onSubmit={handleEmailAction} className="space-y-4 text-left">
                    
                    {/* -- LOGIN MODE -- */}
                    {authMode === 'login' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">{t.labelEmail}</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                              <LucideIcons.Mail size={15} />
                            </span>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={t.placeholderEmail}
                              className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">{t.labelPassword}</label>
                          <div className="relative mb-1">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                              <LucideIcons.Lock size={15} />
                            </span>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t.placeholderPassword}
                              className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                            />
                          </div>
                          
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={handlePasswordReset}
                              className="text-[10px] text-[#A855F7] hover:underline font-bold bg-transparent border-0 cursor-pointer p-0"
                            >
                              {t.btnForget}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* -- REGISTER SINGLE FORM VIEW -- */}
                    {authMode === 'register' && (
                      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1.5 scrollbar-thin">
                        
                        {/* Section A: Persönliche Daten */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                            <LucideIcons.User size={13} />
                            {lang === 'de' ? 'A) Persönliche Daten' : 'A) Personal Data'}
                          </h4>
                          
                          <div>
                            <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                              {lang === 'de' ? 'Name' : 'Name'} <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={lang === 'de' ? 'Max Mustermann' : 'John Doe'}
                              className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'Firmenname (Optional)' : 'Company Name (Optional)'}
                              </label>
                              <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Gegenwart GmbH"
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'Ansprechpartner (Optional)' : 'Contact Person (Optional)'}
                              </label>
                              <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="Erika Musterfrau"
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                              <p className="text-[8px] text-stone-400 mt-0.5">
                                {lang === 'de' ? 'Nur erforderlich, wenn ein Unternehmen registriert wird.' : 'Only required when registering a company.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section B: Adresse */}
                        <div className="space-y-3 pt-1">
                          <h4 className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                            <LucideIcons.MapPin size={13} />
                            {lang === 'de' ? 'B) Adresse' : 'B) Address'}
                          </h4>
                          
                          <div>
                            <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                              {lang === 'de' ? 'Straße / Adresse' : 'Street / Address'}
                            </label>
                            <input
                              type="text"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="Musterstraße 42"
                              className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'PLZ' : 'ZIP'}
                              </label>
                              <input
                                type="text"
                                value={zip}
                                onChange={(e) => setZip(e.target.value)}
                                placeholder="80331"
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'Ort' : 'City'}
                              </label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="München"
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'Land' : 'Country'}
                              </label>
                              <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Deutschland"
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section C: Steuerdaten optional */}
                        <div className="space-y-3 pt-1">
                          <h4 className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                            <LucideIcons.Scale size={13} />
                            {lang === 'de' ? 'C) Steuerdaten (Optional)' : 'C) Tax details (Optional)'}
                          </h4>
                          <div>
                            <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                              {lang === 'de' ? 'UID-Nummer / USt-ID' : 'VAT-ID'}
                            </label>
                            <input
                              type="text"
                              value={vatId}
                              onChange={(e) => setVatId(e.target.value)}
                              placeholder="DE123456789"
                              className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                            />
                            <p className="text-[8px] text-stone-400 mt-0.5">
                              {lang === 'de' ? 'Nur ausfüllen, wenn du ein Unternehmen registrierst.' : 'Only fill in if registering a company.'}
                            </p>
                          </div>
                        </div>

                        {/* Section D: Login-Daten */}
                        <div className="space-y-3 pt-1">
                          <h4 className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                            <LucideIcons.Lock size={13} />
                            {lang === 'de' ? 'D) Login-Daten' : 'D) Login details'}
                          </h4>
                          
                          <div>
                            <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                              {t.labelEmail} <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                <LucideIcons.Mail size={15} />
                              </span>
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.placeholderEmail}
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {t.labelPassword} <span className="text-red-500 font-bold">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                                  <LucideIcons.Lock size={15} />
                                </span>
                                <input
                                  type="password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder={t.placeholderPassword}
                                  className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-black text-stone-500 tracking-wider mb-1">
                                {lang === 'de' ? 'Passwort wiederholen' : 'Repeat password'} <span className="text-red-500 font-bold">*</span>
                              </label>
                              <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t.placeholderPassword}
                                className="w-full bg-white border border-stone-300 focus:border-[#A855F7]/80 focus:ring-1 focus:ring-[#A855F7]/50 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none placeholder-stone-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Einwilligungen */}
                        <div className="space-y-2.5 p-3.5 bg-stone-100 rounded-2xl border border-stone-200 mt-2">
                          <label className="flex items-start gap-2.5 text-[11px] text-stone-700 font-bold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              required
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                              className="mt-0.5 rounded border-stone-300 bg-white text-[#A855F7] focus:ring-0 cursor-pointer w-4 h-4 shrink-0"
                            />
                            <span>
                              {tGlobal.acceptTerms} (<span onClick={(e) => { e.stopPropagation(); onGoToRoute(lang === 'de' ? '/de/agb' : '/en/terms'); }} className="text-[#A855F7] underline hover:text-stone-900 cursor-pointer inline font-extrabold">{lang === 'de' ? 'AGB lesen' : 'Read T&C'}</span>) <span className="text-red-500 font-bold">*</span>
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 text-[11px] text-stone-700 font-bold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              required
                              checked={acceptedPrivacy}
                              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                              className="mt-0.5 rounded border-stone-300 bg-white text-[#A855F7] focus:ring-0 cursor-pointer w-4 h-4 shrink-0"
                            />
                            <span>
                              {tGlobal.acceptPrivacy} (<span onClick={(e) => { e.stopPropagation(); onGoToRoute(lang === 'de' ? '/de/datenschutz' : '/en/privacy-policy'); }} className="text-[#A855F7] underline hover:text-stone-900 cursor-pointer inline font-extrabold">{lang === 'de' ? 'Datenschutzerklärung' : 'Read privacy policy'}</span>) <span className="text-red-500 font-bold">*</span>
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 text-[11px] text-stone-400 font-semibold cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={newsletterConsent}
                              onChange={(e) => setNewsletterConsent(e.target.checked)}
                              className="mt-0.5 rounded border-stone-300 bg-white text-[#A855F7] focus:ring-0 cursor-pointer w-4 h-4 shrink-0"
                            />
                            <span>{tGlobal.newsletterOptIn}</span>
                          </label>
                        </div>

                      </div>
                    )}

                    {authError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2 leading-snug animate-fadeIn">
                        <LucideIcons.AlertTriangle size={14} className="shrink-0 text-red-500 mt-0.5" />
                        <span className="whitespace-pre-line">{authError}</span>
                      </div>
                    )}

                    {resetSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-semibold flex items-start gap-2 leading-snug animate-fadeIn">
                        <LucideIcons.CheckCircle size={14} className="shrink-0 text-emerald-500 mt-0.5" />
                        <span>{resetSuccess}</span>
                      </div>
                    )}

                    {/* Action buttons area */}
                    <div className="pt-2">
                      {authMode === 'login' ? (
                        /* Login submit button */
                        <button
                          type="submit"
                          disabled={isAuthenticating}
                          className="w-full bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-50 text-stone-950 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer border-0 select-none animate-fadeIn"
                        >
                          {isAuthenticating ? (
                            <>
                              <LucideIcons.Loader className="animate-spin text-stone-950" size={15} />
                              <span>{'Melde an...'}</span>
                            </>
                          ) : (
                            <>
                              <LucideIcons.LogIn size={15} />
                              <span>{t.btnEmailLogin}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        /* Register submit button without steps */
                        <button
                          type="submit"
                          disabled={isAuthenticating}
                          className="w-full bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-50 text-stone-950 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer border-0 select-none animate-fadeIn"
                        >
                          {isAuthenticating ? (
                            <>
                              <LucideIcons.Loader className="animate-spin text-stone-950" size={15} />
                              <span>{'Erstelle...'}</span>
                            </>
                          ) : (
                            <>
                              <LucideIcons.UserPlus size={15} />
                              <span>{lang === 'de' ? 'Registrieren' : 'Register'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Divider - only sign-in or registration gets helper OAuth */}
                  {(authMode === 'login' || authMode === 'register') && (
                    <div className="animate-fadeIn">
                      <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-x-0 h-[1.2px] bg-stone-200" />
                        <span className="relative bg-[#FCFCFC] px-3.5 text-[9px] uppercase font-black text-stone-400 tracking-widest">
                          {t.separatorOr}
                        </span>
                      </div>

                      {/* Google OAuth Login Block */}
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isAuthenticating}
                        className="w-full bg-[#EDEDED] hover:bg-stone-200/85 text-stone-950 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2.5 active:scale-[0.995] disabled:opacity-50 cursor-pointer border-0"
                      >
                        <LucideIcons.Chrome size={15} className="text-[#A855F7] shrink-0" />
                        <span>{t.btnGoogle}</span>
                      </button>
                    </div>
                  )}

                  {/* Helper account switch links on bottom */}
                  <div className="text-center pt-1.5 pb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === 'login' ? 'register' : 'login');
                        setRegStep(1);
                        setAuthError('');
                        setResetSuccess('');
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-stone-500 hover:text-stone-850 duration-150 transition underline bg-transparent border-0 cursor-pointer"
                    >
                      {authMode === 'login' ? t.noAccount : t.haveAccount}
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* Structured advantages / Funktionskarten grid */}
      <section id="features" className="bg-[#0B0B0B] border-y border-stone-900 py-24 px-4 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#A855F7] text-[10px] font-black uppercase tracking-widest block">★★★ {t.featuresLabel}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">{t.featuresTitle}</h2>
            <p className="text-stone-400 text-xs sm:text-sm font-semibold">{t.featuresSub}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            {[
              { title: t.feat1Title, desc: t.feat1Desc, icon: <LucideIcons.UserSquare2 size={22} /> },
              { title: t.feat2Title, desc: t.feat2Desc, icon: <LucideIcons.LayoutTemplate size={22} /> },
              { title: t.feat3Title, desc: t.feat3Desc, icon: <LucideIcons.UserPlus size={22} /> },
              { title: t.feat4Title, desc: t.feat4Desc, icon: <LucideIcons.QrCode size={22} /> },
              { title: t.feat5Title, desc: t.feat5Desc, icon: <LucideIcons.Palette size={22} /> },
              { title: t.feat6Title, desc: t.feat6Desc, icon: <LucideIcons.Orbit size={22} /> }
            ].map((ft, key) => (
              <div 
                key={key} 
                className="bg-[#111111] border border-stone-900/80 p-6 md:p-8 rounded-[24px] hover:border-[#A855F7]/30 transitionduration-300 shadow-md flex flex-col items-start gap-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] group relative overflow-hidden bg-premium-grid"
              >
                <div className="w-12 h-12 bg-stone-950/80 border border-stone-850 text-[#A855F7] rounded-xl flex items-center justify-center transition group-hover:bg-[#A855F7] group-hover:text-stone-950 shrink-0">
                  {ft.icon}
                </div>
                <div>
                  <h4 className="text-white text-base font-black uppercase tracking-wide mb-2">{ft.title}</h4>
                  <p className="text-stone-400 text-xs leading-relaxed font-semibold">{ft.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>



      {/* Clear Tarife & Leistungspakete (Brighter, Simple, and Highly Trustworthy Tier List) */}
      <section id="pricing" className="bg-[#FAF9F6] border-t border-stone-200 py-24 px-4 relative z-10 scroll-mt-20 text-stone-900">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-[#A855F7] text-[10px] font-black uppercase tracking-widest block">★★★ {t.pricingLabel}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 uppercase tracking-tight">
              {lang === 'de' ? 'Tarife & Leistungspakete' : 'Rates & Upgrades'}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm font-semibold">
              {lang === 'de' ? 'Wähle das passende Upgrade für deinen Erfolg. Keine versteckten Kosten.' : 'Choose the matching upgrade for your success. No hidden fees.'}
            </p>
          </div>

          {/* Simple Monthly/Yearly Toggle Switch */}
          <div className="flex justify-center pt-2">
            <div className="bg-stone-200/60 p-1 rounded-xl flex items-center border border-stone-300">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer border-0 ${billingPeriod === 'monthly' ? 'bg-[#A855F7] text-stone-950 font-black shadow-sm' : 'text-stone-655 hover:text-stone-900'}`}
              >
                {lang === 'de' ? 'Monatlich' : 'Monthly'}
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition duration-150 relative cursor-pointer border-0 ${billingPeriod === 'yearly' ? 'bg-[#A855F7] text-stone-950 font-black shadow-sm' : 'text-stone-655 hover:text-stone-900'}`}
              >
                <span>{lang === 'de' ? 'Jährlich' : 'Yearly'}</span>
                <span className="absolute -top-2.5 -right-2 bg-stone-950 text-[#A855F7] text-[7.5px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest border border-stone-850 shadow-sm leading-none">
                  %
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {pricingPlans.map((p) => {
              const isPro = p.id === 'pro';
              
              // Prices / Period logic
              let priceDisplay = '';
              let periodDisplay = '';
              let noteDisplay = '';

              if (billingPeriod === 'monthly') {
                priceDisplay = lang === 'de' ? p.monthlyPriceDe : p.monthlyPriceEn;
                periodDisplay = p.id === 'starter' ? '' : (lang === 'de' ? '/ Monat' : '/ month');
              } else {
                priceDisplay = lang === 'de' ? p.yearlyPriceDe : p.yearlyPriceEn;
                periodDisplay = p.id === 'starter' ? '' : (lang === 'de' ? '/ Jahr' : '/ year');
                noteDisplay = lang === 'de' ? p.yearlyNoteDe || '' : p.yearlyNoteEn || '';
              }

              // Buttons labels based on ID
              let buttonLabel = '';
              if (p.id === 'starter') {
                buttonLabel = lang === 'de' ? 'Kostenlos starten' : 'Get Started Free';
              } else if (p.id === 'pro') {
                buttonLabel = lang === 'de' ? 'Jetzt Pro sichern' : 'Get PRO License';
              } else {
                buttonLabel = lang === 'de' ? 'Business wählen' : 'Select Business';
              }

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-[28px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200 relative overflow-hidden flex-1
                    ${isPro ? 'border-2 border-[#A855F7] shadow-md hover:shadow-lg' : 'border border-stone-200'}`}
                >
                  {isPro && (
                    <div className="absolute top-3 right-3 bg-[#A855F7] text-stone-950 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                      {lang === 'de' ? 'Beliebt' : 'Popular'}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <span className="text-stone-400 text-[9px] font-black uppercase tracking-widest block mb-1">
                        {p.id === 'starter' && (lang === 'de' ? 'Einfacher Einstieg' : 'Simple Entry')}
                        {p.id === 'pro' && (lang === 'de' ? 'Selbstständige & Creator' : 'Freelancing & Creators')}
                        {p.id === 'business' && (lang === 'de' ? 'Teams & Unternehmen' : 'Teams & Enterprise')}
                      </span>
                      <h4 className="text-stone-900 text-xl font-black uppercase tracking-wider">
                        {p.id === 'business' ? (lang === 'de' ? 'Unternehmen' : 'Business') : p.name}
                      </h4>
                      <p className="text-stone-500 text-xs font-semibold leading-relaxed mt-1">
                        {lang === 'de' ? p.targetGroup.de : p.targetGroup.en}
                      </p>
                      
                      {/* Dynamic Pricing display */}
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <div className="flex items-baseline gap-1">
                          <span className={p.id === 'pro' ? "text-3xl font-black text-stone-900" : "text-2xl font-black text-stone-900"}>
                            {priceDisplay}
                          </span>
                          {periodDisplay && (
                            <span className="text-stone-400 text-xs font-bold">{periodDisplay}</span>
                          )}
                        </div>
                        {noteDisplay && (
                          <div className="mt-1.5">
                            <span className="bg-[#A855F7] text-stone-950 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block font-sans">
                              {noteDisplay}
                            </span>
                          </div>
                        )}
                        {!noteDisplay && p.id !== 'starter' && billingPeriod === 'yearly' && (
                          <div className="mt-1.5">
                            <span className="bg-[#A855F7]/10 text-[#A855F7] text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded inline-block">
                              {lang === 'de' ? 'Jährlich günstiger' : 'More affordable annually'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="text-stone-655 text-xs space-y-3 border-t border-stone-100 pt-5 font-semibold">
                      {(lang === 'de' ? p.featuresDe : p.featuresEn).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <LucideIcons.Check size={14} className="text-[#A855F7] shrink-0 mt-0.5" />
                          <span className={feat.includes('alle Fun-Funktionen') || feat.includes('alle Pro-Funktionen') || feat.includes('All FUN features') || feat.includes('All PRO features') ? 'font-extrabold' : ''}>
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => scrollToSection('auth-box')}
                      className={`w-full text-center py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest duration-150 cursor-pointer shadow-sm border-0 font-bold
                        ${isPro ? 'bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950' : 'bg-stone-900 hover:bg-stone-800 text-stone-50'}`}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
              {lang === 'de' ? 'Einfach. Transparent. Jederzeit flexibel upgradebar.' : 'Simple. Transparent. Flexibly upgradeable at any time.'}
            </p>
          </div>
        </div>
      </section>

      {/* Structured Footer */}
      <footer className="bg-[#050505] text-stone-500 py-16 px-4 border-t border-stone-900 text-xs relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          <div className="md:col-span-4 text-center md:text-left space-y-3">
            <KonuLogo size="sm" variant="gold" showSlogan={true} className="!items-start" />
            <p className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">
              {lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn Video into Action.'}
            </p>
            <span className="text-[10px] text-stone-600 block pt-1">© 2026 ureel. Alle Rechte vorbehalten.</span>
          </div>

          <div className="md:col-span-8 flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">
            <span onClick={() => onGoToRoute(lang === 'de' ? '/de/impressum' : '/en/impressum')} className="cursor-pointer hover:text-white transition">{lang === 'de' ? 'Impressum' : 'Legal Notice'}</span>
            <span onClick={() => onGoToRoute(lang === 'de' ? '/de/datenschutz' : '/en/privacy-policy')} className="cursor-pointer hover:text-white transition">{lang === 'de' ? 'Datenschutz' : 'Privacy Policy'}</span>
            <span onClick={() => onGoToRoute(lang === 'de' ? '/de/agb' : '/en/terms')} className="cursor-pointer hover:text-white transition">{lang === 'de' ? 'AGB' : 'Terms of Use'}</span>
            <span onClick={() => onGoToRoute(lang === 'de' ? '/de/cookies' : '/en/cookies')} className="cursor-pointer hover:text-white transition">Cookies</span>
            <span onClick={() => onGoToRoute(lang === 'de' ? '/de/widerruf' : '/en/withdrawal')} className="cursor-pointer hover:text-white transition">{lang === 'de' ? 'Widerruf' : 'Withdrawal'}</span>
          </div>

        </div>
      </footer>

    </div>
  );
};
