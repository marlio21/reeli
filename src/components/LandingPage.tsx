/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { TRANSLATIONS } from '../translations';

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



type ShowcaseTone = 'consulting' | 'golf' | 'hotel' | 'craft' | 'stage' | 'auto' | 'student' | 'portrait';

const SHOWCASE_ITEMS: Array<{
  title: string;
  label: string;
  slug: string;
  icon: keyof typeof LucideIcons;
  tone: ShowcaseTone;
  reveal: 'reel' | 'headline' | 'buttons' | 'copy' | 'complete';
}> = [
  { title: 'Unternehmensberaterin', label: 'Beratung klar präsentieren', slug: 'dein-angebot-sofort-klickbar', icon: 'BriefcaseBusiness', tone: 'consulting', reveal: 'reel' },
  { title: 'Golfclub', label: 'Erlebnis & Buchung verbinden', slug: 'your-offer-instantly-clickable-2', icon: 'Flag', tone: 'golf', reveal: 'reel' },
  { title: 'Hotel', label: 'Angebot direkt buchbar machen', slug: 'dein-angebot-sofort-klickbar-3', icon: 'Building2', tone: 'hotel', reveal: 'headline' },
  { title: 'Tischlerei', label: 'Handwerk sichtbar machen', slug: 'dein-angebot-sofort-klickbar-4', icon: 'Hammer', tone: 'craft', reveal: 'headline' },
  { title: 'Rednerpult', label: 'Event und Produkt inszenieren', slug: 'dein-angebot-sofort-klickbar-2', icon: 'Mic2', tone: 'stage', reveal: 'buttons' },
  { title: 'Automarke', label: 'Produkt, Anfrage und Termin', slug: 'mario-kozuh-schneeberger', icon: 'Car', tone: 'auto', reveal: 'buttons' },
  { title: 'Studentin', label: 'Portfolio & Kontakt in Sekunden', slug: 'your-offer-instantly-clickable', icon: 'GraduationCap', tone: 'student', reveal: 'copy' },
  { title: 'Baron Lukas', label: 'Persönlichkeit & Story', slug: 'dein-angebot-sofort-klickbar-5', icon: 'Crown', tone: 'portrait', reveal: 'complete' }
];

const toneBackground: Record<ShowcaseTone, string> = {
  consulting: 'from-[#1a1714] via-[#4b4036] to-[#0b0b0b]',
  golf: 'from-[#07140e] via-[#1d5a35] to-[#070b08]',
  hotel: 'from-[#20150f] via-[#75512d] to-[#0a0806]',
  craft: 'from-[#1c120a] via-[#604022] to-[#0d0906]',
  stage: 'from-[#16081c] via-[#4a1b58] to-[#09050b]',
  auto: 'from-[#07101a] via-[#26394c] to-[#05070a]',
  student: 'from-[#10151f] via-[#514333] to-[#08090b]',
  portrait: 'from-[#1f1510] via-[#8a642b] to-[#070604]'
};

const ShowcasePhoneSequence: React.FC = () => {
  const [index, setIndex] = useState(0);
  const item = SHOWCASE_ITEMS[index];
  const showHeadline = index >= 2;
  const showButtons = index >= 4;
  const showCopy = index >= 6;
  const isComplete = index >= 7;

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SHOWCASE_ITEMS.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-5">
      <div className="pointer-events-none absolute -inset-10 rounded-[70px] bg-[#F2D28B]/10 blur-3xl" />
      <div className="relative w-[292px] h-[578px] rounded-[44px] border border-white/18 bg-white/[0.055] p-[5px] shadow-[0_26px_78px_rgba(0,0,0,0.46)] backdrop-blur-sm">
        <div className="relative h-full rounded-[38px] overflow-hidden bg-[#070707] text-white ring-1 ring-white/10">
          <div className="absolute top-0 left-1/2 z-30 -translate-x-1/2 w-28 h-6 rounded-b-2xl bg-[#050505]/95 border-x border-b border-white/10" />
          <motion.div
            key={item.slug}
            initial={{ opacity: 0, scale: 1.025, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <iframe
              title={`Live UREEL Vorschau ${item.title}`}
              src={`/u/${item.slug}`}
              className="absolute left-1/2 top-1/2 h-[844px] w-[390px] -translate-x-1/2 -translate-y-1/2 border-0 bg-black"
              style={{ transform: 'translate(-50%, -50%) scale(0.73)', transformOrigin: 'center center' }}
              loading="eager"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
            {!isComplete && (
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.24))]" />
            )}
            {index < 2 && (
              <div className="absolute inset-x-8 bottom-10 z-20 rounded-2xl border border-white/12 bg-black/50 px-4 py-3 backdrop-blur-md">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F2D28B]">Reel läuft</div>
                <div className="mt-1 text-sm font-black">{item.title}</div>
              </div>
            )}
          </motion.div>

          <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_35%_15%,rgba(255,255,255,0.11),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_22%,rgba(0,0,0,0.18))]" />

          {showHeadline && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="absolute top-[72px] left-6 right-6 z-20 text-center">
              <div className="inline-flex rounded-full border border-[#F2D28B]/35 bg-black/48 px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-[#F2D28B] backdrop-blur-md">{item.title}</div>
              <div className="mt-3 text-[27px] font-black uppercase leading-[0.92] tracking-[-0.04em] drop-shadow-[0_5px_18px_rgba(0,0,0,0.5)]">{item.label}</div>
            </motion.div>
          )}

          {showCopy && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="absolute left-7 right-7 bottom-[124px] z-20 rounded-2xl bg-black/46 border border-white/12 px-4 py-3 text-center backdrop-blur-md">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F2D28B]">Werbetext</div>
              <div className="mt-1 text-[12px] font-bold leading-snug text-white/88">Aus einem kurzen Reel entsteht eine klickbare UREEL mit Botschaft, Link und direkter Aktion.</div>
            </motion.div>
          )}

          {showButtons && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 left-7 right-7 z-20 grid grid-cols-3 gap-3">
              {['Phone','Globe','Mail','Link','FileText','Share2'].map((icon) => {
                const ButtonIcon = (LucideIcons as any)[icon] || LucideIcons.Circle;
                return <div key={icon} className="aspect-square rounded-full bg-[#F6F0E6]/96 border border-[#F2D28B]/30 flex items-center justify-center shadow-lg"><ButtonIcon size={18} className="text-[#141414]" /></div>;
              })}
            </motion.div>
          )}

          <div className="absolute bottom-4 left-7 right-7 z-30">
            <div className="h-[3px] rounded-full bg-white/18 overflow-hidden">
              <motion.div key={index} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.05, ease: 'linear' }} className="h-full bg-[#F2D28B]" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {SHOWCASE_ITEMS.map((entry, i) => (
          <button key={entry.slug} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-[#F2D28B]' : 'w-2 bg-white/25'}`} aria-label={`Showcase ${entry.title}`} />
        ))}
      </div>
      <a href={`/u/${item.slug}`} className="rounded-full border border-[#F2D28B]/35 bg-[#F2D28B]/10 px-5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F6E2A5] hover:bg-[#F2D28B] hover:text-black transition-colors">Live ansehen: {item.title}</a>
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
      await loginWithGoogle();
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
        <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 lg:py-20 grid lg:grid-cols-[1.05fr_0.9fr_0.85fr] gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DCC2]/25 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#E8DCC2]">
              <LucideIcons.Sparkles size={14} /> Klickbare Smartphone-Werbekarten
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.92] tracking-[-0.06em]">
              Aus Video wird <span className="text-[#F2D28B]">Aktion.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/72 leading-relaxed max-w-xl">
              Verwandle Reels, Bilder und Angebote in interaktive ureel-Karten mit Werbetext, Buttons, QR-Code, Teilen und Desktop-Miniwebseite.
            </p>
            <div className="grid gap-3 text-sm font-bold text-white/78">
              {[
                'Video oder Bild als starke Szene',
                'Werbebotschaft mit Timing und Vorlagen',
                'Direkte Aktionen: Telefon, Website, Mail, Datei'
              ].map((item) => (
                <div key={item} className="flex items-center gap-3"><span className="w-7 h-7 rounded-full bg-[#F2D28B] text-black flex items-center justify-center"><LucideIcons.Check size={15} /></span>{item}</div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={scrollToAuth} className="rounded-2xl bg-[#F2D28B] text-black px-7 py-4 text-sm font-black uppercase tracking-widest">Kostenlos starten</button>
              <a href="#beispiele" className="rounded-2xl border border-white/18 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">Demo ansehen <LucideIcons.Play size={16} /></a>
            </div>
          </motion.div>

          <div className="relative min-h-[560px] flex items-center justify-center">
            <div className="absolute w-[360px] h-[540px] rounded-[56px] bg-[#F2D28B]/8 blur-3xl" />
            <ShowcasePhoneSequence />
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
              <p className="mt-3 text-white/60 font-bold max-w-2xl">Diese Beispiele sind als Links eingebunden. Wenn du die Karten später im Studio änderst, bleiben die Landingpage-Beispiele aktuell.</p>
            </div>
            <a href="#auth-box" className="rounded-2xl bg-[#F2D28B] text-black px-6 py-4 text-xs font-black uppercase tracking-widest text-center">Eigene UREEL starten</a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SHOWCASE_ITEMS.map((item, i) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Sparkles;
              return (
                <a key={item.slug} href={`/u/${item.slug}`} className="group rounded-[28px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-[#F2D28B]/45 transition-all p-4 overflow-hidden">
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
