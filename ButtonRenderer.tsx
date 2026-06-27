/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { TRANSLATIONS } from '../translations';
import { PLANS } from '../data';
import * as LucideIcons from 'lucide-react';
import { PlanType } from '../types';

interface AdminViewProps {
  lang: 'de' | 'en';
  onBackToPortal: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ lang, onBackToPortal }) => {
  const { 
    allUsers, 
    allCards, 
    allReports, 
    fetchAdminData, 
    adminUpdateUserPlan, 
    adminToggleCardPublished, 
    adminResolveReport 
  } = useFirebase();

  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'users' | 'cards' | 'reports' | 'landing'>('users');
  const [loading, setLoading] = useState(true);
  const [landingDraft, setLandingDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ureel_landing_admin_draft') || '{}');
    } catch { return {}; }
  });
  const updateLandingDraft = (updates: any) => {
    const next = { ...landingDraft, ...updates };
    setLandingDraft(next);
    try { localStorage.setItem('ureel_landing_admin_draft', JSON.stringify(next)); } catch {}
  };

  // Load telemetry data on render
  useEffect(() => {
    setLoading(true);
    fetchAdminData().then(() => setLoading(false));
  }, []);

  const handleUpdatePlan = async (userId: string, plan: PlanType) => {
    if (window.confirm(lang === 'de' ? `Plan dieses Nutzers wirklich zu '${plan}' ändern?` : `Change this user's plan to '${plan}'?`)) {
      await adminUpdateUserPlan(userId, plan);
    }
  };

  const handleToggleCard = async (cardId: string, currentStatus: boolean) => {
    const actionText = currentStatus 
      ? (lang === 'de' ? 'Deaktivieren' : 'Deactivate') 
      : (lang === 'de' ? 'Aktivieren' : 'Activate');
      
    if (window.confirm(lang === 'de' ? `Soll dieses Profil wirklich ${actionText} werden?` : `Really ${actionText} this card profile?`)) {
      await adminToggleCardPublished(cardId, !currentStatus);
    }
  };

  const handleResolveReport = async (reportId: string, decision: 'reviewed' | 'blocked' | 'dismissed') => {
    if (window.confirm(lang === 'de' ? `Meldung als '${decision}' markieren?` : `Mark report as '${decision}'?`)) {
      await adminResolveReport(reportId, decision);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-stone-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation title bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-stone-800 pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToPortal}
              className="bg-[#2A2A2A] hover:bg-stone-900 text-[#A855F7] p-2 rounded-xl border border-stone-800 transition cursor-pointer"
            >
              <LucideIcons.ArrowLeft size={18} />
            </button>
            <div>
              <span className="bg-[#A855F7]/10 text-[#A855F7] text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                System Console
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">{t.adminTitle}</h1>
            </div>
          </div>

          <button 
            onClick={() => fetchAdminData()}
            className="flex items-center gap-1 bg-[#2A2A2A] hover:bg-stone-900 border border-stone-800 text-xs text-stone-300 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <LucideIcons.RefreshCw size={12} />
            {lang === 'de' ? 'Aktualisieren' : 'Sync Telemetry'}
          </button>
        </div>

        {/* Telemetry statistical blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-[#2A2A2A] border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-xs uppercase font-extrabold tracking-wider">Benutzerregistrierungen</p>
              <p className="text-3xl font-black text-white mt-1">{allUsers.length}</p>
            </div>
            <div className="p-3 bg-stone-900/50 rounded-xl text-blue-400">
              <LucideIcons.Users size={22} />
            </div>
          </div>

          <div className="bg-[#2A2A2A] border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-xs uppercase font-extrabold tracking-wider">Erstellte Mini-Webseiten</p>
              <p className="text-3xl font-black text-white mt-1">{allCards.length}</p>
            </div>
            <div className="p-3 bg-stone-900/50 rounded-xl text-green-400">
              <LucideIcons.Globe size={22} />
            </div>
          </div>

          <div className="bg-[#2A2A2A] border border-stone-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-stone-500 text-xs uppercase font-extrabold tracking-wider">Verbleibende Meldungen</p>
              {/* Highlight dynamic alarm if warning pending */}
              <p className={`text-3xl font-black mt-1 ${allReports.filter(r => r.status === 'pending').length > 0 ? 'text-red-400' : 'text-stone-300'}`}>
                {allReports.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-stone-900/50 rounded-xl text-red-400">
              <LucideIcons.AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Console Tab Control Toggles */}
        <div className="flex border-b border-stone-800/80 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${activeTab === 'users' ? 'border-[#A855F7] text-white' : 'border-transparent text-stone-500'}`}
          >
            {t.allUsers} ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${activeTab === 'cards' ? 'border-[#A855F7] text-white' : 'border-transparent text-stone-500'}`}
          >
            {t.allCards} ({allCards.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${activeTab === 'reports' ? 'border-[#A855F7] text-[#A855F7]' : 'border-transparent text-stone-500'}`}
          >
            {t.allReports} ({allReports.filter(r => r.status === 'pending').length} neu)
          </button>
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${activeTab === 'landing' ? 'border-[#E8DCC2] text-[#E8DCC2]' : 'border-transparent text-stone-500'}`}
          >
            Startseite
          </button>
        </div>

        {/* Loading Spanners */}
        {loading ? (
          <div className="text-center py-12 text-stone-500 text-sm">
            <LucideIcons.Loader className="animate-spin mx-auto text-[#A855F7] mb-2" size={24} />
            Lade Telemetrie...
          </div>
        ) : (
          <div className="bg-[#2A2A2A] rounded-2xl border border-stone-800 overflow-hidden">
            
            {/* ====== USERS TAB PANEL ====== */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800 font-bold">
                    <tr>
                      <th className="px-6 py-4">Benutzer ID</th>
                      <th className="px-6 py-4">E-Mail</th>
                      <th className="px-6 py-4">Tarif-Plan</th>
                      <th className="px-6 py-4">Speicherverbrauch</th>
                      <th className="px-6 py-4">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {allUsers.map((usr) => (
                      <tr key={usr.userId} className="hover:bg-stone-900/40">
                        <td className="px-6 py-4 font-mono text-[10px] text-stone-500">{usr.userId}</td>
                        <td className="px-6 py-4 text-white font-semibold">{usr.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            usr.plan === 'business' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50' : 
                            usr.plan === 'premium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-stone-800 text-stone-400'
                          }`}>
                            {usr.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-[11px] text-stone-400">
                            {usr.storageUsedMB?.toFixed(2) || '0.00'} / {usr.storageLimitMB || '20'} MB
                          </p>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <select
                            value={usr.plan}
                            onChange={(e) => handleUpdatePlan(usr.userId, e.target.value as PlanType)}
                            className="bg-[#1E1E1E] border border-stone-800 rounded px-2 py-1 text-xs text-[#A855F7]"
                          >
                            {Object.keys(PLANS).map(p => (
                              <option key={p} value={p}>{p.toUpperCase()}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ====== CARDS TAB ====== */}
            {activeTab === 'cards' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800 font-bold">
                    <tr>
                      <th className="px-6 py-4">Besitzer UID</th>
                      <th className="px-6 py-4">Link-Name (Slug)</th>
                      <th className="px-6 py-4">ureel-Titel</th>
                      <th className="px-6 py-4">Sichtbarkeit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Aktion Take-Down</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {allCards.map((crd) => (
                      <tr key={crd.cardId} className="hover:bg-stone-900/40">
                        <td className="px-6 py-4 font-mono text-[10px] text-stone-500">{crd.ownerId}</td>
                        <td className="px-6 py-4 text-[#A855F7] font-mono">/u/{crd.slug}</td>
                        <td className="px-6 py-4 text-white font-medium">{crd.title}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] uppercase font-bold text-stone-400">{crd.visibility}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${crd.isPublished ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                            {crd.isPublished ? 'AKTIV' : 'GESPERRT'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCard(crd.cardId, crd.isPublished)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                              crd.isPublished ? 'bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-800 hover:text-white' : 'bg-emerald-950/30 border border-emerald-800 text-emerald-400 hover:bg-emerald-800 hover:text-[#1E1E1E]'
                            }`}
                          >
                            {crd.isPublished ? t.deactivate : t.activate}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ====== LANDING PAGE ADMIN TAB ====== */}
            {activeTab === 'landing' && (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-black text-[#E8DCC2] mb-2">Hero-Titel</label>
                    <input value={landingDraft.heroTitle || 'Aus Video wird Aktion.'} onChange={(e) => updateLandingDraft({ heroTitle: e.target.value })} className="w-full h-12 rounded-xl bg-[#1E1E1E] border border-stone-700 px-4 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-black text-[#E8DCC2] mb-2">Kurztext</label>
                    <textarea value={landingDraft.heroText || 'Verwandle Reels, Bilder und Angebote in klickbare Smartphone-Werbekarten.'} onChange={(e) => updateLandingDraft({ heroText: e.target.value })} className="w-full h-28 rounded-xl bg-[#1E1E1E] border border-stone-700 px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-black text-[#E8DCC2] mb-2">Button-Text</label>
                    <input value={landingDraft.cta || 'Kostenlos starten'} onChange={(e) => updateLandingDraft({ cta: e.target.value })} className="w-full h-12 rounded-xl bg-[#1E1E1E] border border-stone-700 px-4 text-white" />
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">MVP: Diese Startseiten-Einstellungen werden lokal als Admin-Draft gespeichert. Im nächsten Schritt können wir sie in Firestore anbinden, damit sie öffentlich live werden.</p>
                </div>
                <div className="rounded-[28px] border border-[#E8DCC2]/20 bg-[#0F0F0F] p-8 min-h-[420px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5F2EA] text-[#101010] flex items-center justify-center mb-6"><LucideIcons.Play size={24}/><span className="font-black text-2xl">U</span></div>
                  <h2 className="text-4xl font-black text-white leading-tight">{landingDraft.heroTitle || 'Aus Video wird Aktion.'}</h2>
                  <p className="mt-4 text-stone-300 leading-relaxed">{landingDraft.heroText || 'Verwandle Reels, Bilder und Angebote in klickbare Smartphone-Werbekarten.'}</p>
                  <button className="mt-8 h-12 px-6 rounded-xl bg-[#E8DCC2] text-[#101010] font-black uppercase text-xs tracking-wider w-fit">{landingDraft.cta || 'Kostenlos starten'}</button>
                </div>
              </div>
            )}

            {/* ====== REPORTS TAB ====== */}
            {activeTab === 'reports' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800 font-bold">
                    <tr>
                      <th className="px-6 py-4">Reporter E-Mail</th>
                      <th className="px-6 py-4">ureel ID</th>
                      <th className="px-6 py-4">Grund</th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Resolutionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {allReports.map((rp) => (
                      <tr key={rp.reportId} className="hover:bg-stone-900/40">
                        <td className="px-6 py-4 font-semibold">{rp.reporterEmail}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-stone-500">
                          <a href={`/u/${allCards.find(c => c.cardId === rp.cardId)?.slug}`} className="text-[#A855F7] hover:underline" target="_blank" rel="noreferrer">
                            {allCards.find(c => c.cardId === rp.cardId)?.slug || rp.cardId}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-red-400 capitalize font-bold text-[10px]">{rp.reason}</span>
                        </td>
                        <td className="px-6 py-4 text-stone-400 text-xs italic">{rp.message}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            rp.status === 'pending' ? 'bg-red-950 text-red-300 animate-pulse' : 'bg-stone-800 text-stone-400'
                          }`}>
                            {rp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-1.5">
                          <button
                            onClick={() => handleResolveReport(rp.reportId, 'reviewed')}
                            className="bg-[#1E1E1E] hover:bg-stone-900 border border-stone-800 text-[9px] font-bold text-stone-300 px-2 py-1 rounded cursor-pointer"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => handleResolveReport(rp.reportId, 'blocked')}
                            className="bg-red-900/40 hover:bg-red-900 text-[9px] font-bold text-red-200 px-2 py-1 rounded cursor-pointer"
                          >
                            SPERRE
                          </button>
                          <button
                            onClick={() => handleResolveReport(rp.reportId, 'dismissed')}
                            className="bg-[#2A2A2A] hover:bg-stone-900 text-[9px] font-bold text-stone-500 px-2 py-1 rounded cursor-pointer"
                          >
                            IGNORIERE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
