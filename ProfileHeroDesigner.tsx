/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LegalPagesProps {
  route: string; // e.g. "/de/impressum"
  onGoHome: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ route, onGoHome }) => {
  const isDe = route.startsWith('/de/');
  
  // Highlight the disclaimer badge for compliance
  const renderDisclaimer = () => (
    <div className="bg-yellow-950/40 border border-[#A855F7]/45 text-yellow-300 rounded-xl p-4 mb-6 text-xs leading-relaxed flex items-start gap-2.5 shadow-sm">
      <LucideIcons.AlertTriangle className="text-[#A855F7] shrink-0 mt-0.5" size={16} />
      <div>
        <strong>{isDe ? 'WICHTIGER JURISTISCHER HINWEIS' : 'IMPORTANT LEGAL DISCLAIMER'}</strong>:
        <p className="mt-1">
          {isDe 
            ? 'Dieser Text dient ausschließlich als redaktionelles Muster und Strukturbeispiel. Er stellt keine Rechtsberatung dar und muss vor der produktiven Verwendung durch einen qualifizierten Juristen geprüft und an Ihr konkretes Unternehmen angepasst werden.'
            : 'This text is a structural template for demonstration purposes only. It is not legal advice and must be audited and revised by qualified legal counsel in your jurisdiction before commercial deployment.'}
        </p>
      </div>
    </div>
  );

  const getPageContent = () => {
    switch (route) {
      // ===== DEUTSCH =====
      case '/de/impressum':
        return {
          title: "Impressum gemäß § 5 TMG",
          body: (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Angaben gemäß § 5 TMG</h3>
                <p>ureel GmbH i.Gr.</p>
                <p>Musterstraße 100</p>
                <p>10115 Berlin</p>
                <p>Deutschland</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Vertreten durch:</h3>
                <p>Max Mustermann (Geschäftsführer)</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Kontakt</h3>
                <p>Telefon: +49 (0) 30 12345678</p>
                <p>E-Mail: support@ureel.me</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Registereintrag</h3>
                <p>Eintragung im Handelsregister.</p>
                <p>Registergericht: Amtsgericht Charlottenburg</p>
                <p>Registernummer: HRB 999999</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Umsatzsteuer-ID</h3>
                <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
                <p>DE 123456789</p>
              </div>
            </div>
          )
        };

      case '/de/datenschutz':
        return {
          title: "Datenschutzerklärung (Datenschutz nach DSGVO)",
          body: (
            <div className="space-y-6 text-stone-300">
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">1. Datenschutz auf einen Blick</h3>
                <p className="leading-relaxed">
                  Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können.
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">2. Datenerfassung auf unserer Website</h3>
                <p className="leading-relaxed">
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen. Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.B. durch Eingabe im Kontaktformular, bei Google-Anmeldung oder beim Erstellen eines Live-Profils). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (z.B. technische Browsereigenschaften, Uhrzeit des Seitenaufrufs).
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">3. Firebase und Cloud Hosting</h3>
                <p className="leading-relaxed">
                  Wir hosten unsere Anwendung und Datenbanken bei Google Firebase (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Firebase stellt Tools zur Authentifizierung und Datenpersistenz (Firestore) bereit. Weitere Details finden Sie in den Datenschutzrichtlinien von Google unter: <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-[#A855F7] underline">https://policies.google.com/privacy</a>.
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">4. Ihre Rechte</h3>
                <p className="leading-relaxed">
                  Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen.
                </p>
              </section>
            </div>
          )
        };

      case '/de/agb':
        return {
          title: "Allgemeine Geschäftsbedingungen (AGB)",
          body: (
            <div className="space-y-6 text-stone-300">
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">§ 1 Geltungsbereich und Vertragsgegenstand</h3>
                <p className="leading-relaxed">
                  Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform ureel sowie für alle Verträge, die über die Erstellung digitaler Mini-Webseiten und digitaler Auftritte zustande kommen. Verträge werden mit der ureel GmbH i.Gr. abgeschlossen.
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">§ 2 Anmeldung, Profile und Speichergrenzen</h3>
                <p className="leading-relaxed">
                  Um die Dienste von ureel nutzen zu können, ist die Registrierung über Google Authentication oder E-Mail/Passwort erforderlich. Jeder kostenfreie Nutzer darf maximal 1 aktive ureel-Seite betreiben sowie maximal 20 MB Dateispeicher für Bilder nutzen. Hochgeladene Bilder werden vor dem Einspielen in den Cloud-Speicher automatisch komprimiert und in das WebP-Format überführt, um Quoten zu kontrollieren. 
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">§ 3 Urheberrechte und Verbotene Inhalte</h3>
                <p className="leading-relaxed">
                  Der Nutzer sichert ausdrücklich zu, dass er die alleinigen Rechte an allen hochgeladenen Bilddateien, PDF-Dokumenten, Handelsmarken und verlinkten Medien besitzt. Es ist strengstens untersagt, anstößige, rassistische, betrügerische, irreführende, urheberrechtswidrige oder anderweitig illegale Inhalte hochzuladen. Zuwiderhandlungen führen zur Deaktivierung der Links und zur Kontosperrung.
                </p>
              </section>
            </div>
          )
        };

      case '/de/cookies':
        return {
          title: "Cookie-Richtlinie",
          body: (
            <div className="space-y-4 text-stone-300">
              <p>
                Unsere Website verwendet ausschließlich technisch notwendige Cookies zur Aufrechterhaltung der Identität (Google Firebase Authentication Session Token).
              </p>
              <p>
                Marketing-Cookies oder Tracking-Cookies von Google Analytics werden ausschließlich nach ausdrücklicher Opt-In Einwilligung geladen.
              </p>
            </div>
          )
        };

      case '/de/widerruf':
        return {
          title: "Widerrufsbelehrung & Widerrufsrecht",
          body: (
            <div className="space-y-4 text-stone-300">
              <h3 className="text-white font-semibold text-lg mb-2">Widerrufsrecht</h3>
              <p>
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
              </p>
              <p>
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (ureel GmbH, support@ureel.me) mittels einer eindeutigen Erklärung per E-Mail über Ihren Entschluss informieren.
              </p>
            </div>
          )
        };

      case '/de/preise':
        return {
          title: "Preistabelle und Leistungsverzeichnis",
          body: (
            <div className="space-y-4 text-stone-300">
              <p>Aktuelle Preisliste für Dienstleistungen und Hosting-Varianten:</p>
              <ul className="list-disc leading-relaxed pl-6 space-y-1 text-stone-200">
                <li><strong>Starter-Tarif:</strong> 0,00 € (1 Karte, 50MB Speicher, max. 8 Knöpfe)</li>
                <li><strong>Fun-Tarif:</strong> 2,90 € / Monat (3 Karten, 100MB Speicher, eigene Hintergründe, Galerie)</li>
                <li><strong>Pro-Tarif:</strong> 3,90 € / Monat (5 Karten, 500MB Speicher, eigene Hintergründe, Statistiken, Passwort-Schutz)</li>
                <li><strong>Business-Tarif:</strong> 19,90 € / Monat (20 Karten, 5GB Speicher, premium Support, etc.)</li>
              </ul>
            </div>
          )
        };

      // ===== ENGLISH =====
      case '/en/legal-notice':
        return {
          title: "Legal Notice",
          body: (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Information according to § 5 TMG</h3>
                <p>ureel Platform GmbH i.Gr.</p>
                <p>Musterstrasse 100</p>
                <p>10115 Berlin</p>
                <p>Germany</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Represented by:</h3>
                <p>Max Mustermann (Managing Director)</p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Contact</h3>
                <p>Phone: +49 (0) 30 12345678</p>
                <p>Email: support@ureel.me</p>
              </div>
            </div>
          )
        };

      case '/en/privacy-policy':
        return {
          title: "Privacy Policy (GDPR)",
          body: (
            <div className="space-y-6 text-stone-300">
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">1. Overview of Data Protection</h3>
                <p className="leading-relaxed">
                  We take the security of your private parameters seriously. All data uploaded via registration or link generators are strictly isolated and saved within European Google Firebase regions. We use your logged details exclusively to maintain operational capabilities and compile dynamic visitor links.
                </p>
              </section>
              <section>
                <h3 className="text-white font-semibold text-lg mb-2">2. Data Hosting</h3>
                <p className="leading-relaxed">
                  Application files and user profiles are stored and served through secure databases hosted by Google Firebase (Google Ireland Limited).
                </p>
              </section>
            </div>
          )
        };

      case '/en/terms':
        return {
          title: "Terms and Conditions (T&C)",
          body: (
            <div className="space-y-4 text-stone-300">
              <section>
                <h3 className="text-[#A855F7] font-semibold text-lg mb-2">§ 1 Contract Scope</h3>
                <p>These terms regulate the publication of digital mini-websites. Submitting content constitutes an instant agreement to these conditions.</p>
              </section>
              <section>
                <h3 className="text-[#A855F7] font-semibold text-lg mb-2">§ 2 Resource Boundaries</h3>
                <p>Starter accounts are limited to 1 ureel Page, 50 Megabytes of asset storage, and 8 active layout buttons. Bypassing these quota limitations via programmatic exploits prompts immediate service cancellation.</p>
              </section>
            </div>
          )
        };

      case '/en/cookies':
        return {
          title: "Cookie Statement",
          body: (
            <div className="space-y-4 text-stone-300">
              <p>We only use essential functional cookies required by Google Firebase Authentication to keep your browser session active.</p>
              <p>Anonymous visitor analytics are only loaded upon receiving explicit consent.</p>
            </div>
          )
        };

      case '/en/withdrawal':
        return {
          title: "Right of Withdrawal",
          body: (
            <p className="text-stone-300">
              Consumers inside the European Union retain a statutory right to withdraw from their digital subscriptions within 14 days of account initialization. Please contact support@ureel.me to execute this cancellation.
            </p>
          )
        };

      case '/en/pricing':
        return {
          title: "Pricing Directory",
          body: (
            <div className="space-y-4 text-stone-300">
              <p>Transparent membership fees:</p>
              <ul className="list-disc pl-6 space-y-1 text-stone-100 font-mono text-sm">
                <li>Free Tier: 0.00 € / mo (1 Card, 20MB, 6 Buttons max)</li>
                <li>Starter Tier: 4.90 € / mo (1 Card, 50MB, Custom backgrounds)</li>
                <li>Premium Tier: 9.90 € / mo (5 Cards, 200MB, Password protection, Stats)</li>
              </ul>
            </div>
          )
        };

      default:
        return {
          title: "Rechtliche Informationen / Legal Archive",
          body: <p>Bitte wählen Sie eine Seite aus / Please select a relevant policy document.</p>
        };
    }
  };

  const page = getPageContent();

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-stone-300 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[#2A2A2A] rounded-3xl border border-stone-800 p-6 md:p-8 shadow-2xl relative">
        <button 
          onClick={onGoHome}
          className="flex items-center gap-1.5 bg-[#1E1E1E] hover:bg-stone-900 border border-stone-800 text-[#A855F7] px-4 py-2 rounded-xl text-xs font-semibold mb-8 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <LucideIcons.ArrowLeft size={14} />
          {isDe ? 'Zurück zum Portal' : 'Back to Home Portal'}
        </button>

        {renderDisclaimer()}

        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-6 border-b border-stone-800 pb-4">
          {page.title}
        </h1>

        <div className="leading-relaxed text-sm space-y-4">
          {page.body}
        </div>
      </div>
    </div>
  );
};
