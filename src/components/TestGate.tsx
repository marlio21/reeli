/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { KonuLogo } from './KonuLogo';
import { setSafeSessionStorage } from '../utils/safeStorage';

interface TestGateProps {
  onSuccess: () => void;
  lang: 'de' | 'en';
}

export function TestGate({ onSuccess, lang = 'de' }: TestGateProps) {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordRaw, setShowPasswordRaw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Load expected gate password from environment (VITE_TEST_GATE_PASSWORD)
    const expectedPassword = (import.meta as any).env.VITE_TEST_GATE_PASSWORD || 'konu2026';

    setTimeout(() => {
      if (password === expectedPassword) {
        setSafeSessionStorage('konu_test_gate_auth', 'true');
        onSuccess();
      } else {
        setErrorMsg(
          lang === 'de' 
            ? 'Passwort nicht korrekt.' 
            : 'Incorrect password.'
        );
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] bg-premium-grid flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Absolute Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-[#A855F7]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A855F7]/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-sm bg-[#121212] border border-stone-850/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden premium-glow flex flex-col text-left">
        
        {/* Logo Unit */}
        <div className="flex justify-center mb-6">
          <KonuLogo size="xl" showSlogan={true} />
        </div>

        {/* Informative Header text */}
        <div className="text-center space-y-1.5 mb-6">
          <h2 className="text-white text-lg font-black uppercase tracking-wider">
            {lang === 'de' ? 'ureel Testzugang' : 'ureel Test Access'}
          </h2>
          <p className="text-stone-400 text-xs font-semibold leading-relaxed px-2">
            {lang === 'de' 
              ? 'Diese Version ist eine private Testversion. Bitte gib das Testpasswort ein.' 
              : 'This version is a private test environment. Please enter the test password.'}
          </p>
        </div>

        {/* Input & Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#A855F7]">
              {lang === 'de' ? 'Testpasswort' : 'Test Password'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <LucideIcons.Lock size={15} />
              </span>
              <input
                type={showPasswordRaw ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={lang === 'de' ? 'Kennwort eingeben' : 'Enter password'}
                className="w-full bg-stone-950/60 border border-stone-850 focus:border-[#A855F7]/60 rounded-xl pl-10 pr-10 py-3.5 text-stone-200 text-xs font-bold focus:outline-none transition-all placeholder-stone-650"
              />
              <button
                type="button"
                onClick={() => setShowPasswordRaw(!showPasswordRaw)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-[#A855F7] transition"
              >
                {showPasswordRaw ? <LucideIcons.EyeOff size={15} /> : <LucideIcons.Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Feedback message overlay */}
          {errorMsg && (
            <div className="flex gap-2 p-3 bg-red-950/20 border border-red-900/35 rounded-xl text-red-400 text-xs font-semibold items-center animate-shake leading-snug">
              <LucideIcons.AlertTriangle size={15} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#A855F7] hover:bg-[#7E22CE] active:bg-[#A855F7]/80 text-[#0B0B0B] font-black text-xs uppercase tracking-widest rounded-xl py-4 flex items-center justify-center gap-2 transition shadow-lg cursor-pointer select-none border-0"
          >
            {isSubmitting ? (
              <LucideIcons.Loader className="animate-spin text-stone-950" size={15} />
            ) : (
              <>
                <span>{lang === 'de' ? 'Weiter' : 'Continue'}</span>
                <LucideIcons.ChevronRight size={15} className="text-stone-900 mt-[0.5px]" />
              </>
            )}
          </button>
        </form>

        {/* Tiny foot decoration */}
        <p className="text-[10px] text-center text-stone-600 mt-6 select-none font-semibold uppercase tracking-wider">
          © 2026 ureel — DIGITAL CARD MARKETING
        </p>

      </div>
    </div>
  );
}
