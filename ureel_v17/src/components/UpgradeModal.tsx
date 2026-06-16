/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { APP_PLANS, AppPlanLimits, getUserPlan, getRequiredPlan, pricingPlans } from '../config/plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'de' | 'en';
  featureKey?: string;
}

export function UpgradeModal({ isOpen, onClose, lang = 'de', featureKey = '' }: UpgradeModalProps) {
  const { profile, updateUserProfile } = useFirebase();
  const [showPlans, setShowPlans] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const currentPlanId = getUserPlan(profile);
  const reqPlan = getRequiredPlan(featureKey as any);
  const isBusinessFeature = reqPlan === 'business';

  // Feature specific upgrade text strings helper
  const getFeatureText = () => {
    if (lang === 'de') {
      switch (featureKey) {
        case 'buttons_fun':
        case 'buttons_pro':
          return 'Mehr als 6 Buttons sind ab ureel Pro verfügbar.';
        case 'buttons_business':
          return 'Mehr als 20 Buttons sind ab ureel Unternehmen verfügbar.';
        case 'cards_fun':
        case 'multipleCards':
        case 'cards':
          return 'Mehr als eine Karte erstellen ist ab ureel Pro verfügbar.';
        case 'fileUpload':
        case 'pdf_upload':
        case 'pdfUpload':
          return 'PDF-Dateien direkt in ureel hochladen ist ab ureel Pro verfügbar.';
        case 'cloud_folders':
        case 'cloudFolders':
          return 'Cloud-Ordner sind ab ureel Pro verfügbar.';
        case 'download_area':
        case 'downloadArea':
        case 'download_links_pro':
        case 'downloadLinksPro':
          return 'Der Download-Bereich ist ab ureel Pro verfügbar.';
        case 'passwordProtectedButtons':
          return 'Passwortgeschützte Buttons sind ab ureel Pro verfügbar.';
        case 'availabilityCalendar':
          return 'Kalender / Abwesenheit ist ab ureel Pro verfügbar.';
        case 'fullAppBackgroundImage':
        case 'appBackgroundImage':
          return 'App-Hintergrundbilder sind ab ureel Pro verfügbar.';
        case 'customSlug':
          return 'Eigene Link-Endung ist ab ureel Pro verfügbar.';
        case 'buttonBackgroundImage':
          return 'Button-Hintergrundbilder sind ab ureel Pro verfügbar.';
        case 'gallery':
          return 'Galerie ist ab ureel Pro verfügbar.';
        case 'teamFeatures':
        case 'teamMembers':
          return 'Teamfunktionen sind ab ureel Unternehmen verfügbar.';
        case 'businessTemplates':
        case 'businessBranding':
        case 'businessBulkDuplicate':
        case 'businessExport':
        case 'businessCustomDomainPrep':
        case 'companyTemplates':
        case 'unifiedBranding':
        case 'customDomainPreparation':
        case 'bulkCardDuplicate':
        case 'exportFeatures':
          return 'Diese Business-Funktion ist ab ureel Unternehmen verfügbar.';
        case 'leadList':
          return 'Lead-Liste ist ab ureel Unternehmen verfügbar.';
        case 'brandingHidden':
        case 'brandingCanBeHidden':
          return 'Branding ausblenden ist ab ureel Pro verfügbar.';
        case 'seoSettings':
          return 'SEO & Teilen ist ab ureel Pro verfügbar.';
        case 'fullBrandingRemoval':
          return 'ureel-Branding vollständig ausblenden ist ab ureel Unternehmen verfügbar.';
        default:
          return 'Diese Funktion ist in deinem aktuellen ureel-Plan nicht enthalten.';
      }
    } else {
      switch (featureKey) {
        case 'buttons_fun':
        case 'buttons_pro':
          return 'More than 6 buttons are available from ureel Pro.';
        case 'buttons_business':
          return 'More than 20 buttons are available from ureel Business.';
        case 'cards_fun':
        case 'multipleCards':
        case 'cards':
          return 'Creating multiple cards is available from ureel Pro.';
        case 'fileUpload':
        case 'pdf_upload':
        case 'pdfUpload':
          return 'Uploading PDF files directly to ureel is available from ureel Pro.';
        case 'cloud_folders':
        case 'cloudFolders':
          return 'Cloud folders are available from ureel Pro.';
        case 'download_area':
        case 'downloadArea':
        case 'download_links_pro':
        case 'downloadLinksPro':
          return 'The download area is available from ureel Pro.';
        case 'passwordProtectedButtons':
          return 'Password-protected buttons are available from ureel Pro.';
        case 'availabilityCalendar':
          return 'Calendar / Availability is available from ureel Pro.';
        case 'fullAppBackgroundImage':
        case 'appBackgroundImage':
          return 'Full app background images are available from ureel Pro.';
        case 'customSlug':
          return 'Custom link endings are available from ureel Pro.';
        case 'buttonBackgroundImage':
          return 'Button background images are available from ureel Pro.';
        case 'gallery':
          return 'Gallery is available from ureel Pro.';
        case 'teamFeatures':
        case 'teamMembers':
          return 'Team features are available from ureel Business.';
        case 'businessTemplates':
        case 'businessBranding':
        case 'businessBulkDuplicate':
        case 'businessExport':
        case 'businessCustomDomainPrep':
        case 'companyTemplates':
        case 'unifiedBranding':
        case 'customDomainPreparation':
        case 'bulkCardDuplicate':
        case 'exportFeatures':
          return 'This business feature is available from ureel Business.';
        case 'leadList':
          return 'Lead list is available from ureel Business.';
        case 'brandingHidden':
        case 'brandingCanBeHidden':
          return 'Hiding branding is available from ureel Pro.';
        case 'seoSettings':
          return 'SEO & Sharing is available from ureel Pro.';
        case 'fullBrandingRemoval':
          return 'Fully hiding ureel branding is available from ureel Business.';
        default:
          return 'This feature is not included in your current ureel plan.';
      }
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setUpdating(true);
      await updateUserProfile({ plan: planId as any });
      setSuccessMsg(lang === 'de' ? 'Erfolgreich aktualisiert!' : 'Successfully upgraded!');
      setTimeout(() => {
        setSuccessMsg('');
        setShowPlans(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal dialog card */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="bg-[#1C1C1E] border border-stone-850 rounded-[28px] w-full max-w-md p-6 z-10 relative overflow-hidden shadow-2xl text-left font-sans"
        >
          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-stone-500 hover:text-stone-300 transition-colors p-1"
            aria-label="Close"
          >
            <LucideIcons.X size={18} />
          </button>

          {!showPlans ? (
            /* Warning / Trigger View */
            <div className="space-y-6">
              {/* Header Icon */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/25 flex items-center justify-center text-[#A855F7]">
                  <LucideIcons.Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#F5F0E6] text-base uppercase tracking-wide">
                    {lang === 'de' 
                      ? (isBusinessFeature ? 'Mit Unternehmen freischalten' : 'Mit Pro freischalten') 
                      : (isBusinessFeature ? 'Unlock with Business' : 'Unlock with Pro')}
                  </h3>
                  <span className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">
                    Premium Feature Gate
                  </span>
                </div>
              </div>

              {/* Core Content Text */}
              <div className="space-y-3 bg-stone-900/40 border border-stone-850 p-4.5 rounded-2xl">
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  {lang === 'de'
                    ? 'Diese Funktion ist in deinem aktuellen ureel-Plan nicht enthalten.'
                    : 'This feature is not included in your current ureel plan.'}
                </p>
                <div className="flex items-start gap-2 text-xs font-semibold text-[#A855F7] pt-1">
                  <LucideIcons.Info size={14} className="shrink-0 mt-0.5" />
                  <span>{getFeatureText()}</span>
                </div>
              </div>

              {/* Buttons actions layout */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !updating && handleSelectPlan(isBusinessFeature ? 'business' : 'pro')}
                  className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <LucideIcons.Zap size={14} />
                  <span>
                    {lang === 'de' 
                      ? (isBusinessFeature ? 'Unternehmen freischalten' : 'Auf Pro upgraden') 
                      : (isBusinessFeature ? 'Unlock Business' : 'Upgrade to Pro')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlans(true)}
                  className="w-full bg-transparent hover:bg-stone-850 border border-stone-850 text-stone-400 hover:text-stone-200 font-black text-xs uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
                >
                  <span>{lang === 'de' ? 'Tarife vergleichen' : 'Compare plans'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Plan list interactive picker view */
            <div className="space-y-5">
              {/* Header back & title button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPlans(false)}
                  className="text-stone-400 hover:text-stone-200 p-1 flex items-center justify-center"
                >
                  <LucideIcons.ArrowLeft size={16} />
                </button>
                <div>
                  <h3 className="font-extrabold text-[#F5F0E6] text-sm uppercase tracking-wide">
                    {lang === 'de' ? 'ureel Tarifmodelle' : 'ureel Plans'}
                  </h3>
                  <span className="text-[10px] text-[#A855F7] font-bold tracking-wider uppercase">
                    {lang === 'de' ? 'Jetzt wechseln zum Testen' : 'Select a pack to activate'}
                  </span>
                </div>
              </div>

              {/* Plans Listing Cards Container */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {pricingPlans.map((p) => {
                  const isActive = currentPlanId === p.id;
                  let planCost = '';
                  if (p.id === 'starter') planCost = '0,00 €';
                  else if (p.id === 'pro') planCost = lang === 'de' ? '3,90 € / Monat' : '3.90 € / Month';
                  else if (p.id === 'business') planCost = lang === 'de' ? '19,90 € / Monat' : '19.90 € / Month';

                  return (
                    <div
                      key={p.id}
                      onClick={() => !updating && handleSelectPlan(p.id)}
                      className={`p-3.5 rounded-2xl border transition text-left cursor-pointer relative flex items-center justify-between gap-3
                        ${isActive 
                          ? 'bg-[#A855F7]/10 border-[#A855F7] text-stone-200' 
                          : 'bg-stone-900/60 border-stone-850 hover:border-stone-750 text-stone-300'}`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs uppercase tracking-wider text-[#F5F0E6]">
                            {p.id === 'business' ? (lang === 'de' ? 'Unternehmen' : 'Business') : p.name}
                          </span>
                          {isActive && (
                            <span className="bg-[#A855F7] text-stone-950 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <LucideIcons.Check size={8} strokeWidth={3} />
                              <span>{lang === 'de' ? 'Aktiv' : 'Active'}</span>
                            </span>
                          )}
                        </div>
                        {/* Highlight limits summaries brief */}
                        <div className="text-[9.5px] text-stone-400 font-sans truncate leading-relaxed">
                          {p.id === 'starter' && (lang === 'de' ? '1 ureel-Karte, max. 6 Buttons' : '1 ureel card, max 6 buttons')}
                          {p.id === 'pro' && (lang === 'de' ? 'bis zu 5 ureel-Karten, max. 20 Buttons' : 'Up to 5 ureel cards, max 20 buttons')}
                          {p.id === 'business' && (lang === 'de' ? 'bis zu 25 ureel-Karten, max. 30 Buttons' : 'Up to 25 ureel cards, max 30 buttons')}
                        </div>
                      </div>

                      {/* Right details button & cost */}
                      <div className="text-right shrink-0">
                        <span className="block font-mono text-[10px] font-bold text-[#F5EFE3]">
                          {planCost}
                        </span>
                        <span className="text-[9px] text-[#A855F7] hover:underline font-bold tracking-tight block">
                          {isActive ? (lang === 'de' ? 'Aktuell' : 'Current') : (lang === 'de' ? 'Wechseln' : 'Switch') } →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status overlay */}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-bounce">
                  <LucideIcons.CheckCircle2 size={14} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Footer pricing notice */}
              <p className="text-[10px] text-stone-500 text-center leading-relaxed">
                {lang === 'de'
                  ? 'Kein echtes Geld nötig. Wähle einfach den Tarif aus, um ihn für deinen Account zu simulieren.'
                  : 'No payment needed. Just click on a plan card to simulate the account capability.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
