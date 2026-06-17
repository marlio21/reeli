/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  increment,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable
} from 'firebase/storage';
import { auth, db, storage, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Card, CardButton, PlanType, CardType, VisibilityType, OverlayType, BackgroundType, Report } from '../types';
import { PLANS } from '../data';
import { DEMO_CARDS } from '../utils/demoCards';
import { normalizePlan } from '../config/plans';

export const getKonuStarterCardTemplate = (
  user: any,
  profile: any,
  lang: 'de' | 'en' = 'de'
): Partial<Card> => {
  let preferredName = '';
  if (profile?.firstName && profile?.lastName) {
    preferredName = `${profile.firstName} ${profile.lastName}`;
  } else if (profile?.displayName) {
    preferredName = profile.displayName;
  } else if (user?.displayName) {
    preferredName = user.displayName;
  } else if (user?.email) {
    preferredName = user.email.split('@')[0] || '';
  }

  let cardTitle = '';
  if (preferredName) {
    cardTitle = lang === 'de' 
      ? `ureel-Seite von ${preferredName}`
      : `${preferredName}'s ureel page`;
  } else {
    cardTitle = lang === 'de'
      ? 'Meine ureel'
      : 'My ureel';
  }

  const d = Date.now();
  const starterButton = (suffix: string, title: string, actionType: string, icon: string, position: number): CardButton => ({
    id: `btn_${suffix}_${d}`,
    title,
    actionType,
    actionValue: '',
    icon,
    iconId: icon,
    iconColor: '#1A1A1A',
    backgroundColor: '#F5F2EA',
    bgColor: '#F5F2EA',
    textColor: '#1A1A1A',
    hasGoldBorder: false,
    borderEnabled: true,
    borderColor: '#E8DCC2',
    borderWidth: 'thin',
    borderStyle: 'solid',
    radius: 'rounded',
    buttonShape: 'rounded' as any,
    shadow: 'soft',
    shadowColor: 'rgba(0,0,0,0.22)',
    isActive: true,
    position,
    imageStyle: 'none',
    iconPosition: 'top',
    iconSize: 15,
    iconCircleBg: true as any,
    iconCircleColor: 'rgba(26,26,26,0.18)' as any,
    buttonImageUrl: '',
    imageUrl: '',
    buttonImageFit: 'cover',
    imageMode: 'cover',
    buttonImageOverlay: false,
    imageOverlay: 'none',
    fontFamily: 'Inter',
    fontSize: 8.5,
    fontWeight: 'bold',
    textWrap: 'multi',
    textAlign: 'center',
    textPosition: 'bottom',
    buttonSize: { preset: 'standard', scale: 0.82 } as any,
  });

  const defaultButtons: CardButton[] = [
    starterButton('phone', lang === 'de' ? 'Telefon hinzufügen' : 'Add phone', 'phone', 'Phone', 0),
    starterButton('website', lang === 'de' ? 'Webseite hinzufügen' : 'Add website', 'url', 'Globe', 1),
    starterButton('mail', lang === 'de' ? 'Mail hinzufügen' : 'Add mail', 'email', 'Mail', 2),
    starterButton('whatsapp', lang === 'de' ? 'WhatsApp hinzufügen' : 'Add WhatsApp', 'whatsapp', 'MessageCircle', 3),
    starterButton('company', lang === 'de' ? 'Unternehmen hinzufügen' : 'Add company', 'contact_form', 'Building2', 4),
    starterButton('file', lang === 'de' ? 'Datei hinzufügen' : 'Add file', 'pdf_link', 'FileText', 5),
  ];

  return {
    title: lang === 'de' ? 'Willkommen auf deiner ureel' : 'Welcome to your ureel',
    subtitle: lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn video into action.',
    description: lang === 'de' ? 'Telefon, Webseite, Mail, WhatsApp, Unternehmen und Datei sind vorbereitet. Ergänze nur noch deine Daten.' : 'Phone, website, mail, WhatsApp, company and file are prepared. Just add your details.',
    profileImageUrl: '',
    backgroundType: 'image',
    backgroundColor: '#111111',
    backgroundImageUrl: '/ureel-start-bg.svg',
    backgroundImageFit: 'cover',
    overlay: 'none',
    buttons: defaultButtons,
    isPublished: false,
    visibility: 'draft',
    cardBackgroundEnabled: true,
    cardBackgroundImageUrl: '/ureel-start-bg.svg',
    cardBackgroundMode: 'cover',
    cardBackgroundDarken: 18,
    cardBackgroundSaturation: 105,
    buttonGridCols: 3 as any,
    buttonSizePx: 54 as any,
    buttonGapPx: 10 as any,
    buttonColor: '#F5F2EA',
    buttonTextColor: '#1A1A1A',
    buttonGridLayout: { mode: 'grid', cols: 3, square: true, buttonSizePx: 54, gapPx: 10, gap: 10, align: 'center' } as any,
    ureelScene: {
      mode: 'image',
      backgroundImageUrl: '/ureel-start-bg.svg',
      backgroundColor: '#111111',
      gradient: { from: '#0F0F0F', to: '#3A3328', direction: '135deg' },
      overlay: { darken: 18, blur: 0, vignette: true },
      video: { type: 'none', url: '', duration: 12, displayMode: 'cover', placement: 'background', startAt: 0 },
    } as any,
    ureelTimeline: { preset: 'starter', titleAt: 0.3, subtitleAt: 1.0, descriptionAt: 1.8, buttonsAt: 2.8, endCardAt: 12 } as any,
    ureelTextTemplate: {
      id: 'ureel_starter',
      style: 'premium_product',
      animation: 'fade',
      animationDuration: 1.2,
      frame: { type: 'corner', color: '#E8DCC2', opacity: 100 },
      box: { type: 'glass', opacity: 72 },
      fontStyle: 'elegant',
      emphasis: { mode: 'last_word', color: '#E8DCC2' },
      blockMode: true,
    } as any,
    
    // Premium KONU layouts
    heroBackgroundEnabled: false,
    heroImageUrl: '',
    heroBackgroundSize: 'medium',
    heroVideoUrl: '',
    heroVideoMode: 'auto',
    heroBgColor: '#1C1C1E',
    heroGradientEnabled: false,
    heroGradientColor: '',
    heroGradientDirection: 'to-bottom',
    heroSaturation: 100,
    heroDarken: 35,
    heroProfileImageUrl: '',
    heroImageShape: 'circle',
    heroImageSize: 80,
    heroImagePlacement: 'center',
    heroImageBorderColor: '#A855F7',
    heroImageBorderWidth: 2,
    heroTitle: lang === 'de' ? 'Willkommen auf deiner ureel' : 'Welcome to your ureel',
    heroSubtitle: lang === 'de' ? 'Aus Video wird Aktion.' : 'Turn video into action.',
    heroDescription: lang === 'de' ? 'Telefon, Webseite, Mail, WhatsApp, Unternehmen und Datei sind vorbereitet.' : 'Phone, website, mail, WhatsApp, company and file are prepared.',
    heroCompany: '',
    heroLocation: '',
    heroTextColor: 'cream',
    heroAccentColor: '#E8DCC2',
    heroFontFamily: 'Inter',
    heroTitleSize: 26 as any,
    heroSubtitleSize: 13 as any,
    heroDescriptionSize: 10.5 as any,
    heroFontWeight: 'medium',
    heroTextAlign: 'center',
    heroTextShadow: 'soft',
  };
};

export interface SimulatedOverrides {
  simulatedPlan: PlanType | null;
  simulatedProfileType: string | null;
  overrideButtons: boolean;
  overrideButtonsValue: number;
  overrideStorage: boolean;
  overrideStorageValue: number;
  overrideBranding: boolean;
  overrideBrandingValue: 'on' | 'off';
  overridePasswordButtons: boolean;
  overridePasswordButtonsValue: boolean;
  overridePdfUpload: boolean;
  overridePdfUploadValue: boolean;
  overrideCustomBg: boolean;
  overrideCustomBgValue: boolean;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  cards: Card[];
  cardsLoaded: boolean;
  allReports: Report[]; // For admin pane
  allUsers: UserProfile[]; // For admin pane
  allCards: Card[]; // For admin pane
  isAdminMode: boolean;
  simulatedPlan: PlanType | null;
  setSimulatedPlan: (plan: PlanType | null) => void;
  simulatedOverrides: SimulatedOverrides;
  setSimulatedOverrides: React.Dispatch<React.SetStateAction<SimulatedOverrides>>;
  sendPasswordReset: (email: string) => Promise<void>;
  effectivePlanId: PlanType;
  loginWithGoogle: (termsAccepted: boolean, privacyAccepted: boolean, newsletter: boolean) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    termsAccepted: boolean,
    privacyAccepted: boolean,
    newsletter: boolean,
    extraData?: Partial<UserProfile>
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchUserCards: () => Promise<Card[]>;
  getCardBySlug: (slug: string, onlyPublished?: boolean) => Promise<Card | null>;
  createCard: (title: string, slug: string, type: CardType) => Promise<Card>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  saveCurrentCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  createNewCard: (template?: Partial<Card>, lang?: 'de' | 'en') => Promise<Card>;
  publishCard: (cardId: string) => Promise<void>;
  updatePublishedCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  createStarterCardIfNeeded: (forceCreate?: boolean) => Promise<Card | null>;
  uploadFile: (
    cardId: string,
    file: File | Blob,
    type: 'profile' | 'background' | 'button-images' | 'documents' | 'cover' | 'product' | 'reel-video' | 'after-sequence' | 'slideshow' | 'branding' | 'seo',
    onStoragePathCreated?: (storagePath: string) => void,
    onProgress?: (progress: number) => void
  ) => Promise<string>;
  submitAbuseReport: (cardId: string, reason: string, message: string, email: string) => Promise<void>;
  logAnalyticsEvent: (cardId: string, buttonId: string | undefined, eventType: 'view' | 'click') => Promise<void>;
  
  // Admin Methods
  fetchAdminData: () => Promise<void>;
  adminUpdateUserPlan: (userId: string, newPlan: PlanType) => Promise<void>;
  adminToggleCardPublished: (cardId: string, isPublished: boolean) => Promise<void>;
  adminResolveReport: (reportId: string, status: 'reviewed' | 'blocked' | 'dismissed') => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used inside a FirebaseProvider');
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const isCreatingCardRef = useRef(false);
  const hasBootstrappedRef = useRef(false);
  const lastFetchedUserUidRef = useRef<string | null>(null);
  const lastOnboardingStateRef = useRef<boolean | null>(null);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [simulatedPlan, setSimulatedPlanState] = useState<PlanType | null>(null);

  const setSimulatedPlan = (plan: PlanType | null) => {
    setSimulatedPlanState(plan);
    setSimulatedOverrides((prev) => ({ ...prev, simulatedPlan: plan }));
  };
  const [simulatedOverrides, setSimulatedOverrides] = useState<SimulatedOverrides>({
    simulatedPlan: null,
    simulatedProfileType: null,
    overrideButtons: false,
    overrideButtonsValue: 6,
    overrideStorage: false,
    overrideStorageValue: 20,
    overrideBranding: false,
    overrideBrandingValue: 'on',
    overridePasswordButtons: false,
    overridePasswordButtonsValue: false,
    overridePdfUpload: false,
    overridePdfUploadValue: false,
    overrideCustomBg: false,
    overrideCustomBgValue: false,
  });

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Passwort-Reset E-Mail senden fehlgeschlagen:", error);
      throw error;
    }
  };

  const isRoleAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';
  const rawPlanId = (isRoleAdminOrOwner && simulatedPlan) 
    ? simulatedPlan 
    : (profile?.plan || 'starter');
  const effectivePlanId: PlanType = normalizePlan(rawPlanId) as PlanType;

  // onAuthStateChanged logic to load/bootstrap profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Check for existing profile
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const data = profileSnap.data() as UserProfile;
            const fallbackProfile: UserProfile = {
              ...data,
              role: data.role || 'user',
              onboardingComplete: data.onboardingComplete !== false
            };
            setProfile(fallbackProfile);
            setIsAdminMode(fallbackProfile.role === 'admin' || fallbackProfile.role === 'owner');
          } else {
            // Auto-bootstrap user document if missing
            const newProfile: UserProfile = {
              userId: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'LiveCard Benutzer',
              plan: 'free',
              planId: 'free',
              storageLimitMB: 20,
              storageUsedMB: 0,
              brandingRequired: true,
              role: 'user',
              acceptedTermsAt: new Date().toISOString(),
              acceptedPrivacyAt: new Date().toISOString(),
              newsletterConsent: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              onboardingComplete: false
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
            setIsAdminMode(false);
          }
        } catch (error) {
          console.error("Failed to load user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setCards([]);
        setCardsLoaded(false);
        setIsAdminMode(false);
        // Reset tracking refs on logout
        lastFetchedUserUidRef.current = null;
        lastOnboardingStateRef.current = null;
        hasBootstrappedRef.current = false;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync users' own cards with strict change guards
  useEffect(() => {
    if (user && profile && profile.onboardingComplete !== false) {
      const currentUid = user.uid;
      const currentOnboarding = profile.onboardingComplete;
      
      // Only fetch if different user or onboarding completion state changed
      if (lastFetchedUserUidRef.current !== currentUid || lastOnboardingStateRef.current !== currentOnboarding) {
        lastFetchedUserUidRef.current = currentUid;
        lastOnboardingStateRef.current = currentOnboarding;
        fetchUserCards();
      }
    } else if (!user) {
      // Clear tracking refs on signout
      lastFetchedUserUidRef.current = null;
      lastOnboardingStateRef.current = null;
      hasBootstrappedRef.current = false;
    }
  }, [user, profile]);

  const loginWithGoogle = async (termsAccepted: boolean, privacyAccepted: boolean, newsletter: boolean) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Validate or bootstrap user profile
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'LiveCard Benutzer',
          plan: 'free',
          planId: 'free',
          storageLimitMB: 20,
          storageUsedMB: 0,
          brandingRequired: true,
          role: 'user',
          acceptedTermsAt: termsAccepted ? new Date().toISOString() : '',
          acceptedPrivacyAt: privacyAccepted ? new Date().toISOString() : '',
          newsletterConsent: newsletter,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          onboardingComplete: false // Onboarding Form needed
        };

        // Write bootstrap profile to firestore
        try {
          await setDoc(profileRef, newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        setProfile(newProfile);
      } else {
        const existingData = profileSnap.data() as UserProfile;
        const fallbackProfile: UserProfile = {
          ...existingData,
          role: existingData.role || 'user',
          onboardingComplete: existingData.onboardingComplete !== false
        };
        setProfile(fallbackProfile);
        setIsAdminMode(fallbackProfile.role === 'admin' || fallbackProfile.role === 'owner');
      }
    } catch (error) {
      console.error("Google Authentifizierung fehlgeschlagen:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      // Validate or bootstrap user profile
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || email.split('@')[0],
          plan: 'free',
          planId: 'free',
          storageLimitMB: 20,
          storageUsedMB: 0,
          brandingRequired: true,
          role: 'user',
          acceptedTermsAt: new Date().toISOString(),
          acceptedPrivacyAt: new Date().toISOString(),
          newsletterConsent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          onboardingComplete: false
        };
        try {
          await setDoc(profileRef, newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        setProfile(newProfile);
      } else {
        const existingData = profileSnap.data() as UserProfile;
        const fallbackProfile: UserProfile = {
          ...existingData,
          role: existingData.role || 'user',
          onboardingComplete: existingData.onboardingComplete !== false
        };
        setProfile(fallbackProfile);
        setIsAdminMode(fallbackProfile.role === 'admin' || fallbackProfile.role === 'owner');
      }
    } catch (error) {
      console.error("Email Login fehlgeschlagen:", error);
      throw error;
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    termsAccepted: boolean,
    privacyAccepted: boolean,
    newsletter: boolean,
    extraData?: Partial<UserProfile>
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      // Create users document
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const newProfile: UserProfile = {
        userId: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: extraData?.displayName || firebaseUser.displayName || email.split('@')[0],
        plan: 'starter',
        planId: 'starter',
        storageLimitMB: 20,
        storageUsedMB: 0,
        brandingRequired: true,
        role: 'user',
        acceptedTermsAt: termsAccepted ? new Date().toISOString() : '',
        acceptedPrivacyAt: privacyAccepted ? new Date().toISOString() : '',
        newsletterConsent: newsletter,
        onboardingComplete: true, // Registrant starts complete
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...extraData
      };
      
      try {
        await setDoc(profileRef, newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
      }
      setProfile(newProfile);
    } catch (error) {
      console.error("Email Registrierung fehlgeschlagen:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setCards([]);
    setCardsLoaded(false);
    setIsAdminMode(false);
    lastFetchedUserUidRef.current = null;
    lastOnboardingStateRef.current = null;
    hasBootstrappedRef.current = false;
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      const cleanUpdates = cleanUndefined(updates);
      await updateDoc(profileRef, {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      });
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const createStarterCardIfNeeded = async (forceCreate: boolean = false): Promise<Card | null> => {
    if (!user) return null;
    if (isCreatingCardRef.current) return null;

    try {
      isCreatingCardRef.current = true;

      // If NOT forced, ensure user doesn't already have any cards
      if (!forceCreate) {
        const q = query(collection(db, 'cards'), where('ownerId', '==', user.uid));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          isCreatingCardRef.current = false;
          return null;
        }
      }

      // Check limits if force creating
      if (forceCreate && profile) {
        const activePlan = PLANS[profile.plan];
        if (cards.length >= activePlan.maxCards) {
          isCreatingCardRef.current = false;
          throw new Error(`Limit erreicht: Ihr Tarif '${activePlan.name}' erlaubt maximal ${activePlan.maxCards} LiveCard(s).`);
        }
      }

      // Generate names
      let preferredName = '';
      if (profile?.firstName && profile?.lastName) {
        preferredName = `${profile.firstName} ${profile.lastName}`;
      } else if (profile?.displayName) {
        preferredName = profile.displayName;
      } else if (user.displayName) {
        preferredName = user.displayName;
      } else {
        preferredName = user.email?.split('@')[0] || 'livecard';
      }

      let baseSlug = preferredName
        .toLowerCase()
        .trim()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!baseSlug) baseSlug = 'livecard';

      let uniqueSlug = baseSlug;
      let suffix = 2;
      while (true) {
        const qCheck = query(collection(db, 'cards'), where('slug', '==', uniqueSlug));
        const queryCheckSnap = await getDocs(qCheck);
        if (queryCheckSnap.empty) {
          break;
        }
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      const cardId = doc(collection(db, 'cards')).id;
      const starterTemplate = getKonuStarterCardTemplate(user, profile, 'de');
      const newCard: Card = {
        ...starterTemplate as Card,
        cardId,
        ownerId: user.uid,
        type: 'person',
        slug: uniqueSlug,
        brandingRequired: profile ? PLANS[profile.plan].brandingRequired : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'cards', cardId), newCard);
      setCards((prev) => {
        if (prev.some((c) => c.cardId === cardId)) return prev;
        return [...prev, newCard];
      });
      return newCard;
    } catch (err) {
      console.error("Fehler beim Erstellen der Karte:", err);
      throw err;
    } finally {
      isCreatingCardRef.current = false;
    }
  };

  const fetchUserCards = async (): Promise<Card[]> => {
    if (!user) return [];
    try {
      setCardsLoaded(false);
      const q = query(collection(db, 'cards'), where('ownerId', '==', user.uid));
      const querySnap = await getDocs(q);
      const userCardsList: Card[] = [];
      querySnap.forEach((doc) => {
        userCardsList.push(doc.data() as Card);
      });

      let alreadyCreatedInSession = false;
      const sessionKey = 'konu_bootstrapped_' + user.uid;
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          alreadyCreatedInSession = window.sessionStorage.getItem(sessionKey) === 'true';
        }
      } catch (e) {
        console.warn("Storage is blocked, bypassing session-level cache:", e);
      }

      if (userCardsList.length === 0 && !hasBootstrappedRef.current && !alreadyCreatedInSession) {
        hasBootstrappedRef.current = true;
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(sessionKey, 'true');
          }
        } catch (e) {
          console.warn("Storage write failed:", e);
        }
        const starter = await createStarterCardIfNeeded(false);
        if (starter) {
          userCardsList.push(starter);
        }
      }

      // Stably sort the cards client-side by createdAt descending (newest first)
      userCardsList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setCards(userCardsList);
      setCardsLoaded(true);
      return userCardsList;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'cards');
      setCardsLoaded(true);
      return [];
    }
  };

  const saveCurrentCard = async (cardId: string, updates: Partial<Card>) => {
    await updateCard(cardId, updates);
  };

  const createNewCard = async (template?: Partial<Card>, lang?: 'de' | 'en'): Promise<Card> => {
    if (!user || !profile) throw new Error('Nicht authentifiziert / Unauthenticated');

    const planId = effectivePlanId || profile.plan || 'starter';
    const activePlan = PLANS[planId] || PLANS['starter'];
    if (cards.length >= activePlan.maxCards) {
      throw new Error(`Limit erreicht: Ihr Tarif '${activePlan.name}' erlaubt maximal ${activePlan.maxCards} LiveCard(s).`);
    }

    const cardId = doc(collection(db, 'cards')).id;
    const activeLang = lang || 'de';
    const starterTemplate = getKonuStarterCardTemplate(user, profile, activeLang);

    const cleanCard: Card = {
      ...starterTemplate as Card,
      ownerId: user.uid,
      brandingRequired: activePlan.brandingRequired,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...template,
      cardId // Ensure the designated cardId is never overwritten by template properties
    };

    try {
      await setDoc(doc(db, 'cards', cardId), cleanCard);
      setCards((prev) => {
        if (prev.some((c) => c.cardId === cardId)) return prev;
        return [...prev, cleanCard];
      });
      return cleanCard;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `cards/${cardId}`);
      throw error;
    }
  };

  const publishCard = async (cardId: string) => {
    await updateCard(cardId, { isPublished: true });
  };

  const updatePublishedCard = async (cardId: string, updates: Partial<Card>) => {
    await updateCard(cardId, { ...updates, isPublished: true });
  };

  const getCardBySlug = async (slug: string, onlyPublished?: boolean): Promise<Card | null> => {
    const cleanSlug = slug.toLowerCase().trim();
    if (cleanSlug === 'ceo' || cleanSlug === 'autohaus' || cleanSlug === 'schwimmverband') {
      return DEMO_CARDS[cleanSlug] || null;
    }
    try {
      const q = query(
        collection(db, 'cards'),
        where('slug', '==', cleanSlug),
        limit(1)
      );

      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      let targetCard: Card | null = null;
      querySnap.forEach((doc) => {
        targetCard = doc.data() as Card;
      });
      return targetCard;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isPermissionDenied = errMsg.includes('permission-denied') || errMsg.includes('insufficient permissions');
      const authUser = auth.currentUser;

      if (isPermissionDenied && authUser) {
        console.warn("getCardBySlug permission denied for authenticated check (slug taken by another user)");
        return { slug, cardId: 'taken', ownerId: 'other', isPublished: false } as any;
      }

      throw error;
    }
  };

  const createCard = async (title: string, slug: string, type: CardType): Promise<Card> => {
    if (!user || !profile) throw new Error('Nicht authentifiziert / Unauthenticated');

    const normalizedSlug = slug.toLowerCase().trim();
    
    // Check local or database plan limits first
    const planId = effectivePlanId || profile.plan || 'starter';
    const activePlan = PLANS[planId] || PLANS['starter'];
    if (cards.length >= activePlan.maxCards) {
      throw new Error(`Limit erreicht: Ihr Tarif '${activePlan.name}' erlaubt maximal ${activePlan.maxCards} LiveCard(s).`);
    }

    // Verify slug is completely unique in Firestore
    const existingSameSlug = await getCardBySlug(normalizedSlug);
    if (existingSameSlug) {
      throw new Error('Dieser Link-Name ist bereits vergeben. Bitte waehlen Sie einen anderen Namen / Slug already in use.');
    }

    // Delegate to createNewCard to reuse getKonuStarterCardTemplate
    return createNewCard({
      title,
      slug: normalizedSlug,
      type
    });
  };

  const updateCard = async (cardId: string, updates: Partial<Card>) => {
    if (!user) return;
    try {
      const cardRef = doc(db, 'cards', cardId);
      const cleanUpdates = cleanUndefined(updates);
      await updateDoc(cardRef, {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      });
      setCards((prev) => prev.map((c) => c.cardId === cardId ? { ...c, ...updates } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${cardId}`);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      setCards((prev) => prev.filter((c) => c.cardId !== cardId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cards/${cardId}`);
    }
  };

  // Upload file, checking/accounting size into the budget
  const uploadFile = async (
    cardId: string,
    file: File | Blob,
    type: 'profile' | 'background' | 'button-images' | 'documents' | 'cover' | 'product' | 'reel-video' | 'after-sequence' | 'slideshow' | 'branding' | 'seo',
    onStoragePathCreated?: (storagePath: string) => void,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!user || !profile) throw new Error('Unauthenticated');

    const fileSizeMB = file.size / (1024 * 1024);
    const activePlan = PLANS[effectivePlanId];

    // Quota limits checks
    if (profile.storageUsedMB + fileSizeMB > activePlan.storageLimitMB) {
      throw new Error(`Speicherplatz voll! Ihr Tarif (${activePlan.name}) limitiert Sie auf ${activePlan.storageLimitMB}MB. Freier Speicher reicht für diese Datei nicht aus.`);
    }

    const originalName = (file as any).name || 'file.webp';
    const cleanFileName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    
    // Construct robust unified paths as requested
    let storagePath = `users/${user.uid}/cards/${cardId}/${type}/${cleanFileName}`;
    if (type === 'cover') {
      storagePath = `users/${user.uid}/cards/${cardId}/cover/cover.webp`;
    } else if (type === 'profile') {
      storagePath = `users/${user.uid}/cards/${cardId}/profile/profile.webp`;
    } else if (type === 'product') {
      storagePath = `users/${user.uid}/cards/${cardId}/product/product.webp`;
    } else if (type === 'reel-video') {
      storagePath = `users/${user.uid}/cards/${cardId}/reel/video-original/${cleanFileName}`;
    } else if (type === 'background') {
      storagePath = `users/${user.uid}/cards/${cardId}/backgrounds/${cleanFileName}`;
    } else if (type === 'button-images') {
      storagePath = `users/${user.uid}/cards/${cardId}/buttons/${cleanFileName}`;
    } else if (type === 'after-sequence') {
      storagePath = `users/${user.uid}/cards/${cardId}/after-sequence/${cleanFileName}`;
    } else if (type === 'slideshow') {
      storagePath = `users/${user.uid}/cards/${cardId}/slideshow/${cleanFileName}`;
    } else if (type === 'branding') {
      storagePath = `users/${user.uid}/cards/${cardId}/branding/${cleanFileName}`;
    } else if (type === 'seo') {
      storagePath = `users/${user.uid}/cards/${cardId}/seo/${cleanFileName}`;
    }

    if (onStoragePathCreated) {
      onStoragePathCreated(storagePath);
    }

    const storageRef = ref(storage, storagePath);

    try {
      const metadata = {
        contentType: file.type || 'application/octet-stream'
      };
      
      const snapshot = await new Promise<any>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        uploadTask.on('state_changed', 
          (progSnap) => {
            const progress = (progSnap.bytesTransferred / progSnap.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          }, 
          (error) => {
            reject(error);
          }, 
          () => {
            resolve(uploadTask.snapshot);
          }
        );
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Increment Firestore user size count
      await updateUserProfile({
        storageUsedMB: Number((profile.storageUsedMB + fileSizeMB).toFixed(3))
      });

      return downloadUrl;
    } catch (error: any) {
      console.error("[Storage Upload Diagnostics] Error object:", error);
      
      const errorMsgStr = error?.message || String(error);
      const errorCode = error?.code || '';
      const isReelVideo = type === 'reel-video';

      if (isReelVideo) {
        // ZIEL 4: Disable local fallback for videos completely
        console.warn("[Storage Uploader] Video upload failed, fallback is structurally disabled for videos.");
        let deMsg = '';
        if (errorCode === 'storage/unauthorized' || errorCode === 'storage/forbidden') {
          deMsg = 'Upload wurde von Storage-Regeln blockiert (CORS- oder Berechtigungsproblem).';
        } else if (errorCode === 'storage/quota-exceeded') {
          deMsg = 'Datei ist zu groß oder das Firebase Speicherlimit ist erschöpft.';
        } else if (errorCode === 'storage/invalid-checksum') {
          deMsg = 'Datei konnte nicht gespeichert werden (Integritätsprüfung fehlgeschlagen).';
        } else if (errorCode === 'storage/retry-limit-exceeded' || errorMsgStr.includes('network') || errorMsgStr.includes('Network')) {
          deMsg = 'Netzwerkfehler aufgetreten. Bitte prüfen Sie Ihre Verbindung.';
        } else if (!user) {
          deMsg = 'Nutzer ist nicht authentifiziert.';
        } else if (fileSizeMB > 100) {
          deMsg = 'Datei ist zu groß (maximal 100 MB erlaubt).';
        } else if (file.type && !file.type.startsWith('video/')) {
          deMsg = 'Videoformat wird nicht unterstützt.';
        } else {
          deMsg = 'Datei konnte nicht im Firebase Storage gespeichert werden.';
        }
        throw new Error(`${deMsg} [Technical details: ${errorCode || 'N/A'} - ${errorMsgStr}]`);
      }
      
      try {
        console.warn("[Storage Uploader Fallback] Initiating secure backend fallback pipeline...");
        
        // Convert file/blob to base64
        const fileToBase64 = (f: File | Blob): Promise<string> => 
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1];
              resolve(base64String);
            };
            reader.onerror = (err) => reject(err);
          });
          
        if (onProgress) {
          onProgress(35); // Show start of fallback progress
        }
        
        const base64Data = await fileToBase64(file);
        
        if (onProgress) {
          onProgress(65); // Base64 encoding complete
        }
        
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) throw new Error("No authentication token available");
        
        const fallbackRes = await fetch('/api/upload-file-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            idToken,
            userId: user.uid,
            cardId,
            type,
            fileName: cleanFileName,
            contentType: file.type || 'application/octet-stream',
            base64Data
          })
        });
        
        if (onProgress) {
          onProgress(90); // Payload received by backend and currently processed
        }
        
        if (!fallbackRes.ok) {
          const fallbackErr = await fallbackRes.json();
          throw new Error(fallbackErr.error || 'Server upload proxy failed');
        }
        
        const fallbackData = await fallbackRes.json();
        
        if (onProgress) {
          onProgress(100); // Complete
        }
        
        // Increment Firestore user size count
        await updateUserProfile({
          storageUsedMB: Number((profile.storageUsedMB + fileSizeMB).toFixed(3))
        });
        
        console.log("[Storage Uploader Fallback] Backup pipeline succeeded, media URL:", fallbackData.downloadUrl);
        return fallbackData.downloadUrl;
        
      } catch (fallbackError: any) {
        console.error("[Storage Uploader Fallback] Critical backup pipeline failure:", fallbackError);
        
        const isReelVideo = (type as any) === 'reel-video';
        let deMsg = '';
        if (errorCode === 'storage/unauthorized' || errorCode === 'storage/forbidden') {
          deMsg = 'Upload wurde von Storage-Regeln blockiert (CORS- oder Berechtigungsproblem).';
        } else if (errorCode === 'storage/quota-exceeded') {
          deMsg = 'Datei ist zu groß oder das Firebase Speicherlimit ist erschöpft.';
        } else if (errorCode === 'storage/invalid-checksum') {
          deMsg = 'Datei konnte nicht gespeichert werden (Integritätsprüfung fehlgeschlagen).';
        } else if (errorCode === 'storage/retry-limit-exceeded' || errorMsgStr.includes('network') || errorMsgStr.includes('Network')) {
          deMsg = 'Netzwerkfehler aufgetreten. Bitte prüfen Sie Ihre Verbindung.';
        } else if (!user) {
          deMsg = 'Nutzer ist nicht authentifiziert.';
        } else if (fileSizeMB > 100) {
          deMsg = 'Datei ist zu groß (maximal 100 MB erlaubt).';
        } else if (file.type && !file.type.startsWith('video/') && isReelVideo) {
          deMsg = 'Videoformat wird nicht unterstützt.';
        } else {
          deMsg = 'Datei konnte nicht gespeichert werden (Download-URL-Generierung oder Speicherung fehlgeschlagen).';
        }

        const fullTechnicalMessage = `${deMsg} [Technical details: ${errorCode || 'N/A'} - ${errorMsgStr}. Backup-Fehler: ${fallbackError.message}]`;
        throw new Error(fullTechnicalMessage);
      }
    }
  };

  const submitAbuseReport = async (cardId: string, reason: string, message: string, email: string) => {
    const reportId = doc(collection(db, 'reports')).id;
    const newReport: Report = {
      reportId,
      cardId,
      reason,
      message,
      reporterEmail: email,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'reports', reportId), newReport);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
    }
  };

  const logAnalyticsEvent = async (cardId: string, buttonId: string | undefined, eventType: 'view' | 'click') => {
    const eventId = doc(collection(db, 'analytics')).id;
    const eventData = {
      eventId,
      cardId,
      buttonId: buttonId || null,
      eventType,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'analytics', eventId), eventData);
    } catch (error) {
      // Quiet fail to avoid interrupting guest navigation sessions
      console.warn("Analytics write failed:", error);
    }
  };

  // Admin Methods
  const fetchAdminData = async () => {
    if (!isAdminMode) return;
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedUsers: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserProfile);
      });
      setAllUsers(fetchedUsers);

      // 2. Fetch Cards
      const cardsSnap = await getDocs(collection(db, 'cards'));
      const fetchedCards: Card[] = [];
      cardsSnap.forEach((doc) => {
        fetchedCards.push(doc.data() as Card);
      });
      setAllCards(fetchedCards);

      // 3. Fetch Reports
      const reportsSnap = await getDocs(collection(db, 'reports'));
      const fetchedReports: Report[] = [];
      reportsSnap.forEach((doc) => {
        fetchedReports.push(doc.data() as Report);
      });
      setAllReports(fetchedReports);
    } catch (error) {
      console.error("Failed to load admin telemetry data:", error);
    }
  };

  const adminUpdateUserPlan = async (userId: string, newPlan: PlanType) => {
    if (!isAdminMode) return;
    try {
      const targetUserRef = doc(db, 'users', userId);
      const targetLimits = PLANS[newPlan].storageLimitMB;
      await updateDoc(targetUserRef, {
        plan: newPlan,
        storageLimitMB: targetLimits,
        updatedAt: new Date().toISOString()
      });
      // Refresh local array
      setAllUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, plan: newPlan, storageLimitMB: targetLimits } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const adminToggleCardPublished = async (cardId: string, isPublished: boolean) => {
    if (!isAdminMode) return;
    try {
      const cardRef = doc(db, 'cards', cardId);
      await updateDoc(cardRef, { isPublished });
      setAllCards((prev) => prev.map((c) => c.cardId === cardId ? { ...c, isPublished } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cards/${cardId}`);
    }
  };

  const adminResolveReport = async (reportId: string, status: 'reviewed' | 'blocked' | 'dismissed') => {
    if (!isAdminMode) return;
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, { 
        status,
        updatedAt: new Date().toISOString()
      });
      setAllReports((prev) => prev.map((r) => r.reportId === reportId ? { ...r, status } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      profile,
      loading,
      cards,
      cardsLoaded,
      allReports,
      allUsers,
      allCards,
      isAdminMode,
      simulatedPlan,
      setSimulatedPlan,
      simulatedOverrides,
      setSimulatedOverrides,
      sendPasswordReset,
      effectivePlanId,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      updateUserProfile,
      fetchUserCards,
      getCardBySlug,
      createCard,
      updateCard,
      deleteCard,
      saveCurrentCard,
      createNewCard,
      publishCard,
      updatePublishedCard,
      createStarterCardIfNeeded,
      uploadFile,
      submitAbuseReport,
      logAnalyticsEvent,
      fetchAdminData,
      adminUpdateUserPlan,
      adminToggleCardPublished,
      adminResolveReport
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

function cleanUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanUndefined(v));
  } else if (obj !== null && typeof obj === 'object') {
    const cleanObj: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleanObj[key] = cleanUndefined(val);
      }
    }
    return cleanObj;
  }
  return obj;
}
