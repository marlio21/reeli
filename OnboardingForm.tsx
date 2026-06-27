/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
            <div className="absolute w-[380px] h-[560px] rounded-[48px] bg-[#F6F0E6]/10 blur-3xl" />
            <div className="relative w-[300px] h-[590px] rounded-[48px] p-3 bg-[#F6F0E6] shadow-[0_40px_100px_rgba(0,0,0,0.55)]">
              <div className="h-full rounded-[38px] overflow-hidden bg-gradient-to-br from-[#211b16] via-[#101010] to-[#322112] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#F6F0E6] rounded-b-2xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(232,196,106,0.28),transparent_28%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.12),transparent_28%)]" />
                <div className="absolute top-20 left-6 right-6 rounded-[26px] bg-black/38 border border-[#E8DCC2]/30 p-5 text-center backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[#E8DCC2] font-black">mein angebot</div>
                  <div className="mt-4 text-3xl leading-[0.9] font-black uppercase">Deine Aktion startet hier</div>
                  <p className="mt-4 text-xs text-white/75 font-bold">Video, Bild oder Angebot in eine klickbare Werbekarte verwandeln.</p>
                </div>
                <div className="absolute bottom-8 left-6 right-6 grid grid-cols-3 gap-4">
                  {['Phone','Globe','Mail','MessageCircle','FileText','UserPlus'].map((icon) => {
                    const Icon = (LucideIcons as any)[icon] || LucideIcons.Circle;
                    return <div key={icon} className="aspect-square rounded-full bg-[#F6F0E6] flex items-center justify-center shadow-xl"><Icon size={20} className="text-[#151515]" /></div>;
                  })}
                </div>
              </div>
            </div>
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
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Beispiele für deine ureel-Karten</h2>
            <p className="mt-3 text-white/60 font-bold">Kurz, verständlich und direkt als Aktion nutzbar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ['Privatperson','Momente, Kontakte und Links in einer persönlichen Karte.','private'],
              ['Unternehmen','Leistungen, Ansprechpartner und Aktionen professionell präsentieren.','business'],
              ['Gastro / Event','Angebote, Reservierung, Standort und Datei direkt erreichbar.','gastro']
            ].map(([title, desc, tone]) => (
              <div key={title} className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 flex gap-5 items-center">
                <MiniUreelCard title={title as string} subtitle={desc as string} tone={tone as any} />
                <div>
                  <h3 className="text-2xl font-black mb-2">{title}</h3>
                  <p className="text-sm text-white/62 leading-relaxed font-bold">{desc}</p>
                </div>
              </div>
            ))}
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
