/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'de' | 'en';
}

interface HelpTopic {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  description: string;
  steps?: string[];
  tip?: string;
  warning?: string;
  items?: { title: string; desc: string }[];
  faqs?: { q: string; a: string }[];
}

export function HelpCenterModal({ isOpen, onClose, lang = 'de' }: HelpCenterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('quickstart');

  // Load complete help data structure for both languages
  const helpData = useMemo<HelpTopic[]>(() => {
    if (lang === 'de') {
      return [
        {
          id: 'quickstart',
          category: 'Allg',
          title: 'Schnellstart',
          subtitle: 'So startest du mit ureel',
          description: 'Folge diesen einfachen Schritten, um deine digitale Präsenz mit ureel im Handumdrehen einzurichten.',
          steps: [
            'Bearbeite zuerst den Profilbereich.',
            'Erstelle oder ändere deine Buttons.',
            'Füge Kontakt, Website, WhatsApp, Dropbox oder Dateien hinzu.',
            'Passe Farben, Bilder und Design an.',
            'Öffne die öffentliche Ansicht.',
            'Teile deinen ureel-Link oder QR-Code.'
          ],
          tip: 'Starte einfach. Du kannst deine Karte jederzeit ändern. Der Link bleibt gleich.',
          warning: 'Alles, was du speicherst, ist danach über deinen öffentlichen ureel-Link erreichbar.'
        },
        {
          id: 'profile',
          category: 'Profil',
          title: 'Profilbereich bearbeiten',
          subtitle: 'Kartenkopf konfigurieren',
          description: 'Der Profilbereich ist der obere Bereich deiner ureel-Seite. Hier sehen Besucher sofort, wer du bist oder welches Unternehmen du präsentierst.',
          steps: [
            'Name oder Firmenname ändern',
            'Slogan / Beschreibung ändern',
            'Profilbild oder Hintergrundbild hochladen',
            'Farben anpassen',
            'Schriftgröße und Textposition ändern',
            'Speichern nicht vergessen',
            'öffentliche Ansicht prüfen'
          ],
          tip: 'Halte den Profilbereich klar und gut lesbar. Weniger Text wirkt oft professioneller.'
        },
        {
          id: 'buttons',
          category: 'Buttons',
          title: 'Buttons erstellen',
          subtitle: 'Aktionen hinzufügen',
          description: 'Buttons sind die wichtigsten Aktionen auf deiner ureel-Seite. Jeder Button kann eine Funktion haben, z. B. Anrufen, WhatsApp, Website, Datei oder Dropbox-Link.',
          steps: [
            '„Neue ureel erstellen“ ist nicht dasselbe wie „neuer Button“',
            'Button hinzufügen',
            'Button anklicken zum Bearbeiten',
            'Text ändern',
            'Oberfläche ändern',
            'Funktion festlegen',
            'Darstellung ändern',
            'Speichern'
          ],
          tip: 'Beginne mit 4 bis 9 Buttons. Zu viele Buttons können Besucher überfordern.'
        },
        {
          id: 'actions',
          category: 'Buttons',
          title: 'Button-Funktionen',
          subtitle: 'Aktionstypen verstehen',
          description: 'Du kannst jedem Button eine Aktion geben. Durch Antippen startet der Besucher direkt eine Aktion.',
          items: [
            { title: 'Website', desc: 'Öffnet eine hinterlegte Webadresse im Browser.' },
            { title: 'Telefon', desc: 'Startet direkt einen Anruf auf dem Smartphone des Besuchers.' },
            { title: 'E-Mail', desc: 'Öffnet das E-Mail-Programm mit voreingestelltem Empfänger.' },
            { title: 'WhatsApp', desc: 'Öffnet WhatsApp und startet direkt einen Chat mit deiner Nummer.' },
            { title: 'Datei/PDF', desc: 'Ermöglicht das Hochladen und direkte Öffnen oder Herunterladen einer Datei.' },
            { title: 'Dropbox-Link', desc: 'Verlinkt direkt auf einen externen Dropbox-Ordner oder eine bestimmte Datei.' },
            { title: 'vCard/Kontakt', desc: 'Lädt deine hinterlegten Kontaktdaten direkt als Telefonkontakt (.vcf) herunter.' },
            { title: 'Kein Aktionstyp', desc: 'Der Button bleibt ein inaktiver Platzhalter mit hilfreichem Hinweis.' }
          ],
          warning: 'Wenn ein Button noch keine Funktion hat, sieht der Besucher einen Hinweis statt einer Fehlermeldung.'
        },
        {
          id: 'design',
          category: 'Design',
          title: 'Design anpassen',
          subtitle: 'Farben & Formen anpassen',
          description: 'Mit ureel kannst du deine Visitenkarte optisch an deine Marke oder deinen persönlichen Stil anpassen.',
          steps: [
            'Farben ändern',
            'Button-Hintergrund ändern',
            'Button-Bild hochladen',
            'Textfarbe ändern',
            'Rahmen und Schatten ändern',
            'Button-Form wählen',
            'Profilbereich gestalten'
          ],
          tip: 'Nutze maximal zwei bis drei Hauptfarben. So wirkt die Karte ruhiger und hochwertiger.'
        },
        {
          id: 'share',
          category: 'Teilen',
          title: 'Teilen & QR-Code',
          subtitle: 'Reichweite erhöhen',
          description: 'Deine ureel-Seite hat einen öffentlichen Link. Diesen Link kannst du per WhatsApp, E-Mail, QR-Code oder Social Media teilen.',
          steps: [
            'Link kopieren',
            'WhatsApp teilen',
            'QR-Code anzeigen',
            'ureel-Werbebild teilen',
            'Link bleibt gleich, auch wenn du deine Karte aktualisierst'
          ],
          warning: 'Wenn du deine Karte änderst, bleibt der gleiche Link gültig. Besucher sehen automatisch die aktuelle Version.'
        },
        {
          id: 'contacts',
          category: 'Teilen',
          title: 'Kontakte speichern',
          subtitle: 'Direktes Abspeichern auf Handys',
          description: 'Besucher können deine ureel-Seite als Kontakt auf dem Smartphone speichern.',
          steps: [
            'Klick auf „In Kontakten speichern“',
            'vCard wird erstellt',
            'Smartphone bietet Kontaktimport an',
            'öffentlicher ureel-Link wird im Kontakt gespeichert'
          ],
          tip: 'Fülle Telefonnummer, E-Mail und Namen korrekt aus, damit der Kontakt sauber gespeichert wird.'
        },
        {
          id: 'public',
          category: 'Karte',
          title: 'Öffentliche Karte',
          subtitle: 'Besucheransicht',
          description: 'Die öffentliche Karte ist das, was andere sehen, wenn sie deinen ureel-Link öffnen.',
          steps: [
            'Keine Editor-Buttons sichtbar',
            'Kein Login nötig',
            'Funktioniert am Smartphone, Tablet und Desktop',
            'Änderungen erscheinen nach dem Speichern',
            'Public Link: /u/dein-linkname'
          ],
          tip: 'Teste deine öffentliche Karte im Inkognito-Fenster, damit du sie wie ein Besucher siehst.'
        },
        {
          id: 'multiple',
          category: 'Karten',
          title: 'Mehrere Karten verwalten',
          subtitle: 'Konto-Management',
          description: 'Du kannst mehrere ureel-Karten erstellen, z. B. für verschiedene Projekte, Unternehmen oder Angebote.',
          steps: [
            'Meine ureels anzeigen',
            'Neue Karte erstellen',
            'Karte bearbeiten',
            'Karte löschen',
            'Öffentliche Seite öffnen',
            'Link kopieren'
          ],
          warning: 'Lösche Karten nur, wenn du sicher bist. Gelöschte Karten sind öffentlich nicht mehr erreichbar.'
        },
        {
          id: 'faq',
          category: 'FAQ',
          title: 'Häufige Fragen',
          subtitle: 'Fragen & Antworten',
          description: 'Hier findest du schnelle Antworten auf die am häufigsten gestellten Fragen.',
          faqs: [
            {
              q: 'Warum sehe ich mehrere Karten?',
              a: 'Du kannst mehrere Karten erstellen. Wenn ungewollt mehrere Karten entstanden sind, kannst du die nicht benötigten Karten unter „Meine ureels“ löschen.'
            },
            {
              q: 'Warum sehe ich meine Änderungen öffentlich nicht?',
              a: 'Bitte speichere die Karte und lade die öffentliche Seite neu. Teste am besten im Inkognito-Fenster.'
            },
            {
              q: 'Kann ich den Link weiterverwenden, wenn ich etwas ändere?',
              a: 'Ja. Der Link bleibt gleich. Änderungen werden auf derselben öffentlichen Karte sichtbar.'
            },
            {
              q: 'Kann ich Dateien verlinken?',
              a: 'Ja. Du kannst Dateien hochladen oder externe Links wie Dropbox verwenden.'
            },
            {
              q: 'Warum öffnet sich Google beim Registrieren?',
              a: 'Google wird nur geöffnet, wenn du bewusst „Mit Google starten“ wählst.'
            }
          ]
        }
      ];
    } else {
      return [
        {
          id: 'quickstart',
          category: 'General',
          title: 'Quick start',
          subtitle: 'How to get started with ureel',
          description: 'Follow these simple steps to set up your digital presence with ureel in no time.',
          steps: [
            'Edit your profile section first.',
            'Create or customize your buttons.',
            'Add contact details, website, WhatsApp, Dropbox or files.',
            'Adjust colors, images and design.',
            'Open the public view.',
            'Share your ureel link or QR code.'
          ],
          tip: 'Start simple. You can update your card anytime. The link stays the same.',
          warning: 'Everything you save is available through your public ureel link.'
        },
        {
          id: 'profile',
          category: 'Profile',
          title: 'Edit profile section',
          subtitle: 'Configure card header',
          description: 'The profile section is the top area of your ureel page. Visitors immediately see who you are or which business you present.',
          steps: [
            'Change name or company name',
            'Change slogan / description',
            'Upload profile image or background image',
            'Adjust colors',
            'Change font size and text position',
            'Do not forget to save',
            'Check the public view'
          ],
          tip: 'Keep the profile section clear and readable. Less text often looks more professional.'
        },
        {
          id: 'buttons',
          category: 'Buttons',
          title: 'Create buttons',
          subtitle: 'Add interactive elements',
          description: 'Buttons are the main actions on your ureel page. Each button can perform an action, such as phone, WhatsApp, website, file or Dropbox link.',
          steps: [
            '“Create new ureel” is not the same as “add new button”',
            'Add a button',
            'Tap a button to edit it',
            'Change text',
            'Change button face',
            'Set action',
            'Change style',
            'Save'
          ],
          tip: 'Start with 4 to 9 buttons. Too many buttons can overwhelm visitors.'
        },
        {
          id: 'actions',
          category: 'Buttons',
          title: 'Button actions',
          subtitle: 'Understand action types',
          description: 'You can assign an action to every button. Tapping it triggers the selected command instantly.',
          items: [
            { title: 'Website', desc: 'Opens a pre-configured web address directly in their browser.' },
            { title: 'Phone', desc: 'Initiates a phone call to your phone number on the visitor\'s device.' },
            { title: 'Email', desc: 'Opens their default email application with your address prefilled.' },
            { title: 'WhatsApp', desc: 'Launches WhatsApp and starts a chat session to your number.' },
            { title: 'File/PDF', desc: 'Allows you to upload and lets visitors open/download any document.' },
            { title: 'Dropbox link', desc: 'Directly opens an external Dropbox folder or specific file.' },
            { title: 'vCard/contact', desc: 'Downloads your pre-filled contact card file (.vcf) straight to their handbook.' },
            { title: 'No action', desc: 'The button remains as a mockup placeholder with a friendly guidance message.' }
          ],
          warning: 'If a button does not have an action yet, visitors see a helpful message instead of an error.'
        },
        {
          id: 'design',
          category: 'Design',
          title: 'Customize design',
          subtitle: 'Colors & Shapes',
          description: 'With ureel, you can adapt your digital business card visually to your brand identity or individual style.',
          steps: [
            'Change colors',
            'Change button background',
            'Upload button image',
            'Change text color',
            'Change border and shadow',
            'Choose button shape',
            'Design profile section'
          ],
          tip: 'Use no more than two or three main colors. This makes the card look calmer and more premium.'
        },
        {
          id: 'share',
          category: 'Share',
          title: 'Share & QR code',
          subtitle: 'Grow your reach',
          description: 'Your ureel page has a public link. You can share this link via WhatsApp, email, QR code or social media.',
          steps: [
            'Copy link',
            'Share on WhatsApp',
            'Show QR code',
            'Share ureel promo image',
            'The link stays the same even when you update your card'
          ],
          warning: 'When you update your card, the same link stays valid. Visitors automatically see the latest version.'
        },
        {
          id: 'contacts',
          category: 'Share',
          title: 'Save contacts',
          subtitle: 'Download contact files',
          description: 'Visitors can save your ureel page as a contact on their phone.',
          steps: [
            'Tap “Save to contacts”',
            'A vCard is created',
            'The phone offers contact import',
            'The public ureel link is saved in the contact'
          ],
          tip: 'Fill in phone number, email and name correctly so the contact is saved properly.'
        },
        {
          id: 'public',
          category: 'Card',
          title: 'Public card',
          subtitle: 'Visitor experience',
          description: 'The public card is what others see when they open your ureel link.',
          steps: [
            'No editor buttons are visible',
            'No login required',
            'Works on phone, tablet and desktop',
            'Changes appear after saving',
            'Public link: /u/your-link-name'
          ],
          tip: 'Test your public card in an incognito window to see it like a visitor.'
        },
        {
          id: 'multiple',
          category: 'Cards',
          title: 'Manage multiple cards',
          subtitle: 'Account Management',
          description: 'You can create multiple ureel cards, for example for different projects, businesses or offers.',
          steps: [
            'View my cards',
            'Create new card',
            'Edit card',
            'Delete card',
            'Open public page',
            'Copy link'
          ],
          warning: 'Only delete cards if you are sure. Deleted cards are no longer publicly available.'
        },
        {
          id: 'faq',
          category: 'FAQ',
          title: 'FAQ',
          subtitle: 'Frequently Asked Questions',
          description: 'Quick responses to common enquiries about the KONU application.',
          faqs: [
            {
              q: 'Why do I see multiple cards?',
              a: 'You can create multiple cards. If multiple cards were created by accident, delete the ones you do not need under “My cards”.'
            },
            {
              q: 'Why do I not see my changes publicly?',
              a: 'Please save the card and reload the public page. It is best to test in an incognito window.'
            },
            {
              q: 'Can I keep using the same link after changes?',
              a: 'Yes. The link stays the same. Changes appear on the same public card.'
            },
            {
              q: 'Can I link files?',
              a: 'Yes. You can upload files or use external links such as Dropbox.'
            },
            {
              q: 'Why does Google open during registration?',
              a: 'Google only opens when you intentionally choose “Continue with Google”.'
            }
          ]
        }
      ];
    }
  }, [lang]);

  // Match keyword query in content
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return helpData;
    const q = searchQuery.toLowerCase();

    return helpData.filter(topic => {
      // Check title or description
      if (topic.title.toLowerCase().includes(q) || topic.description.toLowerCase().includes(q)) {
        return true;
      }
      if (topic.subtitle && topic.subtitle.toLowerCase().includes(q)) {
        return true;
      }
      // Check bullet steps
      if (topic.steps && topic.steps.some(step => step.toLowerCase().includes(q))) {
        return true;
      }
      // Check key-value items
      if (topic.items && topic.items.some(it => it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q))) {
        return true;
      }
      // Check FAQs
      if (topic.faqs && topic.faqs.some(faq => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [searchQuery, helpData]);

  // Auto-select first matching topic if query changes and selected topic is no longer present
  React.useEffect(() => {
    if (filteredTopics.length > 0) {
      const isSelectedStillValid = filteredTopics.some(t => t.id === selectedTopicId);
      if (!isSelectedStillValid) {
        setSelectedTopicId(filteredTopics[0].id);
      }
    }
  }, [filteredTopics, selectedTopicId]);

  if (!isOpen) return null;

  const activeTopic = helpData.find(t => t.id === selectedTopicId) || helpData[0];

  return (
    <div className="fixed inset-0 z-55 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-fade-in text-stone-200">
      {/* Container Panel: Fullscreen on mobile, centered modal/layout on desktop */}
      <div className="bg-[#121212] border-0 md:border border-stone-850 w-full h-full md:h-[85vh] md:max-h-[800px] md:max-w-4xl overflow-hidden md:rounded-3xl shadow-2xl flex flex-col font-sans">
        
        {/* Header Unit */}
        <div className="p-4 md:p-5 border-b border-stone-850 flex items-center justify-between bg-stone-900 text-left shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
              <LucideIcons.HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
                {lang === 'de' ? 'ureel HILFE-CENTER' : 'ureel HELP CENTER'}
              </h3>
              <p className="text-[10px] text-stone-400 font-semibold tracking-wide">
                {lang === 'de' ? 'Dein Schritt-für-Schritt Begleiter' : 'Your Step-by-Step Companion'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <LucideIcons.X size={18} />
          </button>
        </div>

        {/* Searching Field */}
        <div className="p-4 border-b border-stone-850/80 bg-[#161616] shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
              <LucideIcons.Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'de' ? 'Hilfe durchsuchen...' : 'Search help...'}
              className="w-full bg-[#1c1c1c] border border-stone-800 focus:border-[#A855F7]/50 rounded-2xl pl-10 pr-10 py-3 text-stone-200 text-xs font-bold font-sans placeholder-stone-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-white font-semibold transform hover:scale-115 transition"
              >
                <LucideIcons.XCircle size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Workspace: Split Panel layout */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-[#0A0A0A]">
          
          {/* LEFT COLUMN: Topic Sidebar (Scrollable chips on mobile, left sidebar list on desktop) */}
          <div className="w-full md:w-72 border-r-0 md:border-r border-stone-850 bg-[#121212]/92 flex md:flex-col shrink-0 min-h-0 overflow-x-auto md:overflow-y-auto py-2.5 px-3 md:py-4 gap-2 whitespace-nowrap md:whitespace-normal custom-scrollbar scrollbar-none">
            {filteredTopics.length === 0 ? (
              <div className="hidden md:flex flex-col items-center justify-center p-8 text-center text-stone-500 h-32 w-full">
                <LucideIcons.AlertCircle size={20} className="mb-2 text-stone-600" />
                <span className="text-[11px] font-bold">
                  {lang === 'de' ? 'Kein Thema gefunden' : 'No topics found'}
                </span>
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isActive = topic.id === selectedTopicId;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all text-left font-sans text-xs font-semibold select-none cursor-pointer shrink-0 ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#A855F7]/15 to-[#A855F7]/5 border-[#A855F7]/60 text-white shadow-[0_2px_10px_rgba(201,166,70,0.1)]' 
                        : 'bg-stone-900/60 border-stone-850/60 hover:bg-stone-850 hover:border-stone-700 hover:text-stone-100 text-stone-400'
                    }`}
                  >
                    <span className="hidden md:block text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-stone-950 text-stone-400">
                      {topic.category}
                    </span>
                    <span className="truncate max-w-[140px] md:max-w-[180px] font-bold">
                      {topic.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Content display (Supports both Desktop and Mobile nicely) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 md:p-8 bg-[#0D0D0D]">
            {filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-stone-500">
                <LucideIcons.History size={40} className="text-[#A855F7]/40 mb-3 animate-pulse" />
                <h4 className="text-white text-sm font-black uppercase tracking-wider">
                  {lang === 'de' ? 'Kein Hilfethema gefunden.' : 'No help topic found.'}
                </h4>
                <p className="text-[11px] text-stone-500 mt-1.5 max-w-xs font-medium">
                  {lang === 'de' 
                    ? 'Versuche es mit anderen Stichworten oder lösche den Suchtext.'
                    : 'Try looking for another term or clear the search query.'}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#A855F7] hover:text-[#A855F7] rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  {lang === 'de' ? 'Auswahl zurücksetzen' : 'Reset Search'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-left max-w-2xl mx-auto">
                
                {/* Header Information */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-[#A855F7] text-stone-950 px-2 py-0.5 rounded shrink-0">
                      {activeTopic.category}
                    </span>
                    {activeTopic.subtitle && (
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                        {activeTopic.subtitle}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">
                    {activeTopic.title}
                  </h2>
                  <p className="text-stone-300 text-xs leading-relaxed font-medium mt-3 border-l-2 border-stone-800 pl-3">
                    {activeTopic.description}
                  </p>
                </div>

                {/* Bullets Steps: Render numbered/flow or generic lists */}
                {activeTopic.steps && activeTopic.steps.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7]">
                      {lang === 'de' ? 'Schritt-für-Schritt Anleitung' : 'Step-By-Step Instructions'}
                    </h3>
                    <div className="space-y-2 bg-[#141414] border border-stone-850/60 p-4 rounded-2xl">
                      {activeTopic.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-stone-300 items-start py-1 border-b border-stone-900/35 last:border-0">
                          <span className="w-5 h-5 rounded-full bg-stone-900 border border-stone-800 text-[#A855F7] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold leading-relaxed pt-0.5">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key-Value Items: E.g., Button Actions Details */}
                {activeTopic.items && activeTopic.items.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7]">
                      {lang === 'de' ? 'Aktionstypen im Überblick' : 'Action Types Overview'}
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {activeTopic.items.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-stone-900/40 border border-stone-850/80 flex gap-3.5 items-start">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]/35 border border-[#A855F7] shrink-0 mt-1.5" />
                          <div>
                            <h4 className="text-xs font-extrabold text-stone-150 uppercase tracking-wider mb-0.5">{item.title}</h4>
                            <p className="text-[11px] text-stone-400 font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elegant Golden Hint Banner */}
                {activeTopic.tip && (
                  <div className="bg-[#1C1A14] border border-[#A855F7]/40 p-4 rounded-2xl flex gap-3.5 items-start shadow-lg">
                    <LucideIcons.Sparkles className="text-[#A855F7] shrink-0 mt-0.5" size={17} />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7] mb-0.5">
                        {lang === 'de' ? 'PROFI-TIPP' : 'PRO TIP'}
                      </h4>
                      <p className="text-stone-300 text-xs font-semibold leading-relaxed">
                        {activeTopic.tip}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dezent hervorheben Warning Alert Banner */}
                {activeTopic.warning && (
                  <div className="bg-red-950/15 border border-red-900/35 p-4 rounded-2xl flex gap-3.5 items-start">
                    <LucideIcons.AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={17} />
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">
                        {lang === 'de' ? 'HINWEIS' : 'ATTENTION'}
                      </h4>
                      <p className="text-stone-300 text-xs font-semibold leading-relaxed">
                        {activeTopic.warning}
                      </p>
                    </div>
                  </div>
                )}

                {/* FAQ Collapsible List Accordion */}
                {activeTopic.faqs && activeTopic.faqs.length > 0 && (
                  <div className="space-y-3.5 mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A855F7]">
                      {lang === 'de' ? 'Häufig gestellte Fragen (FAQ)' : 'Frequently Asked Questions (FAQ)'}
                    </h3>
                    <div className="space-y-3">
                      {activeTopic.faqs.map((faq, idx) => (
                        <div key={idx} className="bg-stone-900/40 border border-stone-850/60 rounded-2xl p-4 space-y-2">
                          <div className="flex gap-2.5 items-start">
                            <LucideIcons.HelpCircle className="text-[#A855F7] shrink-0 mt-0.5" size={15} />
                            <h4 className="text-xs font-extrabold text-white leading-snug">
                              {faq.q}
                            </h4>
                          </div>
                          <p className="text-stone-300 text-[11px] leading-relaxed font-semibold pl-6 border-l border-stone-800">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
          
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-850 bg-stone-900 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold py-2.5 px-5 rounded-2xl border border-stone-700 hover:text-white transition cursor-pointer"
          >
            {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
