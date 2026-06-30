/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { OnboardingForm } from './components/OnboardingForm';
import { PublicCardView } from './components/PublicCardView';
import { PublicSharePage } from './components/PublicSharePage';
import { AdminView } from './components/AdminView';
import { LegalPages } from './components/LegalPages';
import { TestGate } from './components/TestGate';
import { Card } from './types';
import * as LucideIcons from 'lucide-react';
import { getSafeLocalStorage, setSafeLocalStorage, getSafeSessionStorage } from './utils/safeStorage';
import { resolvedConfig, db } from './firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import { hydrateCardMobileLayout } from './utils/mobileLayoutPersistence';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Clean & extremely robust slug extraction utility
 */
const extractSlugFromPath = (path: string): string => {
  try {
    let decoded = decodeURIComponent(path);
    
    // Ignore query parameters if mixed into router paths
    const qMarkIdx = decoded.indexOf('?');
    if (qMarkIdx !== -1) {
      decoded = decoded.substring(0, qMarkIdx);
    }
    const hashIdx = decoded.indexOf('#');
    if (hashIdx !== -1) {
      decoded = decoded.substring(0, hashIdx);
    }
    
    if (decoded.startsWith('/u/') || decoded.startsWith('/share/')) {
      let slugPart = decoded.startsWith('/share/') ? decoded.substring(7) : decoded.substring(3);
      // Strip trailing slashes
      if (slugPart.endsWith('/')) {
        slugPart = slugPart.substring(0, slugPart.length - 1);
      }
      return slugPart.trim();
    }
  } catch (e) {
    console.error("extractSlugFromPath failure:", e);
  }
  return "";
};

const AppContent: React.FC = () => {
  const { user, profile, loading, getCardBySlug } = useFirebase();

  // Navigation Routing States
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeLang, setActiveLang] = useState<'de' | 'en'>(() => {
    const saved = getSafeLocalStorage('konu_preferred_lang');
    if (saved === 'en' || saved === 'de') return saved;
    const browserLanguage = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : '';
    return browserLanguage.startsWith('en') ? 'en' : 'de';
  });

  // Test Gate Bypassed completely as requested to show normal standard registration/login
  const [testGatePassed, setTestGatePassed] = useState(true);

  useEffect(() => {
    setSafeLocalStorage('konu_preferred_lang', activeLang);
  }, [activeLang]);

  // Public visitor profile fetching states
  const [visitorCard, setVisitorCard] = useState<Card | null>(null);
  const [visitorError, setVisitorError] = useState('');
  const [visitorErrorType, setVisitorErrorType] = useState<string>('');
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync state on relative browser navigation (Back buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe navigation wrapper
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const loadPublicCard = (slug: string) => {
    if (!slug) {
      setVisitorError('No slug specified.');
      setVisitorErrorType('not_found');
      return;
    }

    setVisitorLoading(true);
    setVisitorError('');
    setVisitorErrorType('');
    setVisitorCard(null);

    const ua = navigator.userAgent || '';
    const isAnd = ua.toLowerCase().includes('android');
    const isSams = ua.toLowerCase().includes('samsungbrowser');
    const isWA = ua.toLowerCase().includes('whatsapp');

    console.info("KONU public load start", {
      requestedSlug: slug,
      userAgent: ua,
      isAndroid: isAnd,
      isSamsungInternet: isSams,
      isWhatsAppWebView: isWA,
      projectId: resolvedConfig.projectId,
      authDomain: resolvedConfig.authDomain
    });

    getCardBySlug(slug)
      .then((card) => {
        if (!card) {
          console.info("KONU public load result: CARD_NOT_FOUND");
          setVisitorError('Profile not found.');
          setVisitorErrorType('not_found');
          setDiagnostics({
            requestedSlug: slug,
            userAgent: ua,
            isAndroid: isAnd,
            isSamsungInternet: isSams,
            isWhatsAppWebView: isWA,
            projectId: resolvedConfig.projectId,
            databaseId: resolvedConfig.databaseId,
            route: currentPath.startsWith('/share/') ? `/share/${slug}` : `/u/${slug}`,
            slug: slug,
            queryCollection: 'cards',
            queryResultCount: 0,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Card slug not found inside Firestore database.',
            found: false,
            isPublished: 'N/A',
            visibility: 'N/A',
            isDeleted: 'N/A'
          });
        } else {
          const isDeleted = card.isDeleted === true;
          const isPublished = card.isPublished === true || (card.isPublished === undefined && card.status !== 'draft');
          const isPrivate = card.visibility !== 'public' && card.visibility !== undefined;

          console.info("KONU public load result success", {
            cardId: card.cardId,
            isDeleted,
            isPublished,
            visibility: card.visibility,
            isPrivate
          });

          const diagData = {
            requestedSlug: slug,
            userAgent: ua,
            isAndroid: isAnd,
            isSamsungInternet: isSams,
            isWhatsAppWebView: isWA,
            projectId: resolvedConfig.projectId,
            databaseId: resolvedConfig.databaseId,
            route: currentPath.startsWith('/share/') ? `/share/${slug}` : `/u/${slug}`,
            slug: slug,
            queryCollection: 'cards',
            queryResultCount: 1,
            errorCode: isDeleted ? 'DELETED' : (!isPublished ? 'NOT_PUBLISHED' : (isPrivate ? 'PRIVATE' : 'SUCCESS')),
            errorMessage: isDeleted ? 'The card is marked deleted.' : (!isPublished ? 'The card is not published yet.' : (isPrivate ? 'The card is not set as public.' : 'Card loaded successfully.')),
            found: true,
            isPublished: card.isPublished === undefined ? 'N/A' : String(card.isPublished),
            visibility: card.visibility || 'N/A',
            isDeleted: card.isDeleted === undefined ? 'false' : String(card.isDeleted)
          };

          if (isDeleted) {
            setVisitorError('This card has been deleted.');
            setVisitorErrorType('deleted');
            setDiagnostics(diagData);
          } else if (!isPublished) {
            setVisitorError('This card is not published yet.');
            setVisitorErrorType('not_published');
            setDiagnostics(diagData);
          } else if (isPrivate) {
            setVisitorError('This card is not publicly available.');
            setVisitorErrorType('private');
            setDiagnostics(diagData);
          } else {
            const hydratedCard = hydrateCardMobileLayout(card) as Card;
            setVisitorCard(hydratedCard);
            setDiagnostics(diagData);
          }
        }
      })
      .catch((err) => {
        console.error("KONU public load failed to fetch details:", err);
        const errMsg = err?.message || String(err);
        const isDbBlock = errMsg.includes('permission-denied') || errMsg.includes('insufficient permissions');
        
        setVisitorError('Failed to fetch database details.');
        setVisitorErrorType(isDbBlock ? 'blocked' : 'error');
        setDiagnostics({
          requestedSlug: slug,
          userAgent: ua,
          isAndroid: isAnd,
          isSamsungInternet: isSams,
          isWhatsAppWebView: isWA,
          projectId: resolvedConfig.projectId,
          databaseId: resolvedConfig.databaseId,
          route: currentPath.startsWith('/share/') ? `/share/${slug}` : `/u/${slug}`,
          slug: slug,
          queryCollection: 'cards',
          queryResultCount: -1,
          errorCode: err?.code || (isDbBlock ? 'PERMISSION_DENIED' : 'FETCH_ERROR'),
          errorMessage: errMsg,
          found: false,
          isPublished: 'N/A',
          visibility: 'N/A',
          isDeleted: 'N/A'
        });
      })
      .finally(() => {
        setVisitorLoading(false);
      });
  };

  // Evaluate visitor slug loads
  useEffect(() => {
    if (currentPath.startsWith('/u/') || currentPath.startsWith('/share/')) {
      const slug = extractSlugFromPath(currentPath);
      loadPublicCard(slug);
    } else {
      setVisitorCard(null);
      setVisitorError('');
      setVisitorErrorType('');
      setDiagnostics(null);
    }
  }, [currentPath]);

  // Real-time synchronization of visitorCard to ensure instantly updated video processing statuses
  useEffect(() => {
    if (!visitorCard || !visitorCard.cardId) return;

    // Do not listen to static demo profiles
    const cardId = visitorCard.cardId;
    if (['ceo', 'autohaus', 'schwimmverband'].includes(visitorCard.slug)) return;

    console.info(`[Real-time Sync Info] Registering live observer for card: ${cardId}`);
    const unsubscribe = onSnapshot(doc(db, 'cards', cardId), (snapshot) => {
      if (snapshot.exists()) {
        const updatedCard = hydrateCardMobileLayout(snapshot.data() as Card) as Card;
        setVisitorCard((current) => {
          if (!current || JSON.stringify(updatedCard) !== JSON.stringify(current)) {
            console.info("[Real-time Sync Info] Visitor card changed in database, hydrating and updating state.");
            return updatedCard;
          }
          return current;
        });
      }
    }, (error) => {
      console.warn("[Real-time Sync Info] Listener error:", error);
    });

    return () => unsubscribe();
  }, [visitorCard?.cardId]);

  // Global Auth Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
        <LucideIcons.Loader className="animate-spin text-[#A855F7] mb-3" size={32} />
        <span className="text-stone-400 text-xs font-mono uppercase tracking-widest">Initialisiere ureel...</span>
      </div>
    );
  }

  // Active Test Gate Guard (Completely bypassed for visitor profiles `/u/:slug`)
  const isPublicCardRoute = currentPath.startsWith('/u/') || currentPath.startsWith('/share/');
  if (!testGatePassed && !isPublicCardRoute) {
    return (
      <TestGate 
        lang={activeLang}
        onSuccess={() => setTestGatePassed(true)}
      />
    );
  }

  // ===== ROUTE 1: PUBLIC VISITOR PROFILE / PREMIUM SHARE PAGE =====
  if (currentPath.startsWith('/u/') || currentPath.startsWith('/share/')) {
    if (visitorLoading) {
      return (
        <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4">
          <LucideIcons.Loader className="animate-spin text-[#A855F7] mb-2" size={24} />
          <span className="text-stone-400 text-[11px] font-semibold tracking-wider uppercase">Lade ureel-Seite...</span>
        </div>
      );
    }

    if (visitorError) {
      const activeSlug = extractSlugFromPath(currentPath);
      
      const copyPageLink = () => {
        const fullUrl = window.location.href;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(fullUrl)
            .then(() => {
              setCopiedNotification(true);
              setTimeout(() => setCopiedNotification(false), 2000);
            })
            .catch(() => fallbackCopy(fullUrl));
        } else {
          fallbackCopy(fullUrl);
        }
      };

      const fallbackCopy = (text: string) => {
        try {
          const el = document.createElement('textarea');
          el.value = text;
          el.setAttribute('readonly', '');
          el.style.position = 'absolute';
          el.style.left = '-9999px';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2000);
        } catch (e) {
          console.error("fallbackCopy error", e);
        }
      };

      // Set titles according to German and English guidelines
      let errorTitle = activeLang === 'de' ? 'Karte konnte nicht geladen werden' : 'Card could not be loaded';
      let errorSub = activeLang === 'de' 
        ? 'Bitte prüfe deine Internetverbindung oder öffne den Link direkt im Browser.' 
        : 'Please check your internet connection or open the link directly in your browser.';
      let errorIcon = <LucideIcons.AlertTriangle className="text-[#A855F7]" size={24} />;

      if (visitorErrorType === 'not_found') {
        errorTitle = activeLang === 'de' ? 'ureel-Seite nicht gefunden' : 'ureel Page Not Found';
        errorSub = activeLang === 'de' ? 'Diese Seite existiert nicht in unserer CDN-Datenbank.' : 'This page was not found in our database.';
        errorIcon = <LucideIcons.SearchSlash className="text-stone-500" size={24} />;
      } else if (visitorErrorType === 'not_published') {
        errorTitle = activeLang === 'de' ? 'ureel-Seite nicht freigegeben' : 'ureel Page Not Released';
        errorSub = activeLang === 'de' ? 'Diese Seite existiert, wurde aber noch nicht freigegeben.' : 'This page exists but is not published yet.';
        errorIcon = <LucideIcons.Lock className="text-amber-500" size={24} />;
      } else if (visitorErrorType === 'deleted') {
        errorTitle = activeLang === 'de' ? 'ureel-Seite gelöscht' : 'ureel Page Deleted';
        errorSub = activeLang === 'de' ? 'Diese Seite wurde dauerhaft entfernt.' : 'This page has been permanently removed.';
        errorIcon = <LucideIcons.Trash2 className="text-red-500" size={24} />;
      } else if (visitorErrorType === 'private') {
        errorTitle = activeLang === 'de' ? 'ureel-Seite privat' : 'ureel Page Private';
        errorSub = activeLang === 'de' ? 'Diese Seite ist auf privat gestellt und nicht öffentlich verfügbar.' : 'This page is set as private and is not publicly accessible.';
        errorIcon = <LucideIcons.ShieldAlert className="text-amber-500" size={24} />;
      } else if (visitorErrorType === 'blocked' || visitorErrorType === 'error') {
        errorTitle = activeLang === 'de' ? 'Karte konnte nicht geladen werden' : 'Card could not be loaded';
        errorSub = activeLang === 'de' 
          ? 'Bitte prüfe deine Internetverbindung oder öffne den Link direkt im Browser.' 
          : 'Please check your internet connection or open the link directly in your browser.';
        errorIcon = <LucideIcons.WifiOff className="text-red-500" size={24} />;
      }

      const showBrowserNotice = diagnostics?.isWhatsAppWebView || diagnostics?.isSamsungInternet || diagnostics?.isAndroid;

      return (
        <div className="min-h-screen bg-[#0E0E0E] text-stone-300 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-[#121212] border border-stone-850 p-6 rounded-[28px] shadow-2xl relative overflow-hidden bg-premium-grid">
            
            {/* Visual Icon Header */}
            <div className="w-14 h-14 bg-stone-950 border border-stone-850 rounded-2xl flex items-center justify-center mx-auto mb-5">
              {errorIcon}
            </div>

            <h1 className="text-lg font-black text-white uppercase tracking-wide mb-2">
              {errorTitle}
            </h1>
            
            <p className="text-xs text-stone-400 font-semibold leading-relaxed mb-6">
              {errorSub}
            </p>

            {/* In-App Browser Warning banner */}
            {showBrowserNotice && (
              <div className="bg-[#A855F7]/10 border border-[#A855F7]/30 text-stone-200 rounded-xl p-3.5 text-xs font-bold leading-relaxed mb-6 text-left flex items-start gap-2.5">
                <LucideIcons.Compass size={16} className="text-[#A855F7] shrink-0 mt-0.5" />
                <span>
                  {activeLang === 'de' 
                    ? 'Falls die Karte nicht vollständig lädt, öffne den Link direkt im Browser.' 
                    : 'If the card does not load completely, open the link directly in your browser.'}
                </span>
              </div>
            )}

            {/* Beautiful Action Control Buttons */}
            <div className="space-y-2.5">
              <button 
                onClick={() => loadPublicCard(activeSlug)}
                className="w-full cursor-pointer bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <LucideIcons.RefreshCw size={14} className="stroke-[2.5]" />
                <span>{activeLang === 'de' ? 'Erneut versuchen' : 'Retry Load'}</span>
              </button>

              <button 
                onClick={copyPageLink}
                className="w-full cursor-pointer bg-[#181818] border border-stone-800 text-stone-300 hover:text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {copiedNotification ? <LucideIcons.Check size={14} className="text-emerald-500" /> : <LucideIcons.Copy size={14} />}
                <span>{copiedNotification ? (activeLang === 'de' ? 'Kopiert!' : 'Copied!') : (activeLang === 'de' ? 'Link kopieren' : 'Copy link')}</span>
              </button>

              <button 
                onClick={() => navigateTo('/')}
                className="w-full cursor-pointer bg-[#242424]/60 text-stone-400 hover:text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition"
              >
                {activeLang === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
              </button>
            </div>

            {/* Collapsible Diagnostic Trace Data */}
            {diagnostics && (
              <div className="mt-6 border-t border-stone-900 pt-4 text-left">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="text-[10px] uppercase tracking-wider font-extrabold text-[#A855F7] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <span>{showDiagnostics ? (activeLang === 'de' ? '▲ Diagnose verbergen' : '▲ Hide Diagnostics') : (activeLang === 'de' ? '▼ Diagnose-Details anzeigen' : '▼ Show Diagnostics')}</span>
                </button>

                {showDiagnostics && (
                  <pre className="mt-3 p-3 bg-stone-950 border border-stone-900 rounded-xl text-[9px] text-stone-500 font-mono overflow-x-auto select-text leading-4 max-h-56">
                    {JSON.stringify({
                      errorCode: diagnostics.errorCode || 'N/A',
                      route: diagnostics.route || `/u/${activeSlug}`,
                      slug: diagnostics.slug || activeSlug,
                      projectId: diagnostics.projectId || 'livecard-test',
                      databaseId: diagnostics.databaseId || '(default)',
                      errorMessage: diagnostics.errorMessage || 'N/A'
                    }, null, 2)}
                  </pre>
                )}
              </div>
            )}

          </div>
        </div>
      );
    }

    if (visitorCard && currentPath.startsWith('/share/')) {
      return (
        <ErrorBoundary
          lang={activeLang}
          fallbackNode={
            <div className="min-h-screen bg-[#0B0B0B] text-[#F5F2EA] flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div className="text-xs uppercase tracking-[0.24em] text-[#D7C9A0] font-black mb-2">share recovery</div>
                <h1 className="text-2xl font-black mb-3">{activeLang === 'de' ? 'Share-Seite konnte nicht angezeigt werden' : 'Share page could not be displayed'}</h1>
                <button type="button" onClick={() => window.location.href = `/u/${visitorCard.slug}`} className="mt-5 w-full rounded-2xl bg-[#F5F2EA] text-black font-black py-3 uppercase text-xs tracking-widest">{activeLang === 'de' ? 'UREEL öffnen' : 'Open card'}</button>
              </div>
            </div>
          }
        >
          <PublicSharePage card={visitorCard} lang={activeLang} setLang={setActiveLang} />
        </ErrorBoundary>
      );
    }

    if (visitorCard) {
      return (
        <ErrorBoundary
          lang={activeLang}
          fallbackNode={
            <div className="min-h-screen bg-[#0B0B0B] text-[#F5F2EA] flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div className="text-xs uppercase tracking-[0.24em] text-[#D7C9A0] font-black mb-2">ureel recovery</div>
                <h1 className="text-2xl font-black mb-3">{activeLang === 'de' ? 'Karte konnte nicht angezeigt werden' : 'Card could not be displayed'}</h1>
                <p className="text-sm text-stone-300 leading-relaxed">{activeLang === 'de' ? 'Der Public-Renderer wurde abgefangen, damit kein schwarzer Bildschirm bleibt. Bitte lade die Seite neu.' : 'The public renderer was caught so the screen does not stay black. Please reload the page.'}</p>
                <button type="button" onClick={() => window.location.reload()} className="mt-5 w-full rounded-2xl bg-[#F5F2EA] text-black font-black py-3 uppercase text-xs tracking-widest">{activeLang === 'de' ? 'Neu laden' : 'Reload'}</button>
              </div>
            </div>
          }
        >
          <PublicCardView 
            card={visitorCard} 
            lang={activeLang} 
            setLang={setActiveLang} 
          />
        </ErrorBoundary>
      );
    }
  }

  // ===== ROUTE 2: LEGAL COMPLIANCE INFORMATION PAGES =====
  const legalRoutes = [
    '/de/impressum', '/de/datenschutz', '/de/agb', '/de/cookies', '/de/widerruf', '/de/preise',
    '/en/legal-notice', '/en/privacy-policy', '/en/terms', '/en/cookies', '/en/withdrawal', '/en/pricing'
  ];

  if (legalRoutes.includes(currentPath)) {
    return <LegalPages route={currentPath} onGoHome={() => navigateTo('/')} />;
  }


  // ===== ROUTE 2A: PUBLIC LANDING PAGE (ALWAYS ACCESSIBLE) =====
  // /landing is intentionally public, even for signed-in users.
  // This allows the owner and testers to review the marketing page without logging out.
  if (currentPath === '/landing' || currentPath === '/home') {
    return (
      <LandingPage 
        lang={activeLang} 
        setLang={setActiveLang} 
        onEnterDashboard={() => navigateTo('/')}
        onGoToRoute={navigateTo}
      />
    );
  }

  // ===== ROUTE 3: SYSTEM ADMIN CONSOLE =====
  if (currentPath === '/admin') {
    return (
      <AdminView 
        lang={activeLang} 
        onBackToPortal={() => navigateTo('/')} 
      />
    );
  }

  // ===== ROUTE 4: SIGNED-IN USER DESK / LANDING GUEST BLOCK =====
  if (user) {
    if (profile && profile.onboardingComplete === false) {
      return (
        <OnboardingForm 
          lang={activeLang} 
        />
      );
    }

    return (
      <DashboardView 
        lang={activeLang} 
        setLang={setActiveLang} 
        onGoToAdmin={() => navigateTo('/admin')}
        onGoToRoute={navigateTo}
      />
    );
  }

  // Standard index fallback
  return (
    <LandingPage 
      lang={activeLang} 
      setLang={setActiveLang} 
      onEnterDashboard={() => navigateTo('/')}
      onGoToRoute={navigateTo}
    />
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
