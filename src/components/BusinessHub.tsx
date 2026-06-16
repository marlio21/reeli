import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import * as LucideIcons from 'lucide-react';
import { db, auth } from '../firebase';
import { 
  Card, 
  UserProfile, 
  Company, 
  CompanyMember, 
  CompanyRole,
  canManageCompany,
  canManageTeam,
  canEditEmployeeCards,
  canViewBusiness,
  Lead,
  CompanyTemplate,
  CardButton
} from '../types';
import { UpgradeModal } from './UpgradeModal';
import { canUseFeature } from '../config/plans';

interface BusinessHubProps {
  user: any;
  profile: UserProfile | null;
  lang: 'de' | 'en';
  effectivePlanId: string;
  cards: Card[];
  simulatedOverrides: {
    simulatedPlan?: string | null;
  };
  onUpdateCards?: () => void;
}

const LOCAL_TRANSLATIONS = {
  de: {
    businessHub: 'Business-Zentrale',
    businessSub: 'Verwalte dein Firmenprofil, dein Team und Mitarbeiterkarten.',
    lockedTitle: 'Business-Zentrale gesperrt',
    lockedDesc: 'Verwalte dein Team, erstelle Mitarbeiterkarten und weise Rollen zu. Nur verfügbar ab KONU Unternehmen/Business.',
    upgradeBtn: 'Jetzt upgraden auf Unternehmen/Business',
    createCompanyTitle: 'Firmenprofil erstellen',
    createCompanyDesc: 'Erstellen Sie Ihr Firmenprofil, um Ihr Team und die Mitarbeiterkarten zu verwalten.',
    companyName: 'Firmenname',
    companyEmail: 'Firmen-E-Mail (kontakt)',
    companyPhone: 'Firmen-Telefon',
    companyAddress: 'Adresse / Firmensitz',
    btnCreateCompany: 'Firmenprofil anlegen',
    companySettings: 'Firmenprofil bearbeiten',
    saveChanges: 'Änderungen speichern',
    teamManagement: 'Teammitglieder verwalten',
    addMember: 'Mitglied einladen',
    emailPlaceholder: 'mitarbeiter@firma.de',
    fullName: 'Name des Mitarbeiters',
    role: 'Rolle im Team',
    btnAdd: 'Zuweisen / Einladen',
    status: 'Status',
    action: 'Aktion',
    roleOwner: 'Owner (Besitzer)',
    roleAdmin: 'Admin (Verwalter)',
    roleEditor: 'Editor (Bearbeiter)',
    roleViewer: 'Viewer (Betrachter)',
    active: 'Aktiv',
    deactivated: 'Deaktiviert',
    deactivate: 'Deaktivieren',
    activate: 'Aktivieren',
    remove: 'Entfernen',
    employeeCards: 'Mitarbeiterkarten',
    createEmployeeCard: 'Neue Mitarbeiterkarte erstellen',
    markExistingCard: 'Bestehende Karte zuweisen',
    chooseCard: 'Karte auswählen...',
    btnMarkCard: 'Als Mitarbeiterkarte markieren',
    unmarkCard: 'Vom Unternehmen entkoppeln',
    quickEditTitle: 'Mitarbeiterkarte anpassen',
    employeeNameLabel: 'Anzeige-Name',
    employeeRoleLabel: 'Position / Abteilung',
    employeeEmailLabel: 'E-Mail',
    employeePhoneLabel: 'Telefon direkt',
    managedByCompanyLabel: 'Wird von Firma verwaltet',
    successSaved: 'Erfolgreich gespeichert!',
    errorFillName: 'Bitte einen Firmennamen eingeben.',
    emptyEmployeeList: 'Noch keine Mitarbeiterkarten angelegt.',
    noExistingCards: 'Keine weiteren eigenen Karten verfügbar, um sie zuzuweisen.',
    saving: 'Speichert...',
    loading: 'Lade Business-Daten...',
    
    // Prompt 7B translations
    leads: 'Leads',
    emptyLeads: 'Noch keine Leads vorhanden.',
    storeResponseLabel: 'Formularantworten in KONU speichern',
    storeResponseDesc: 'Antworten erscheinen in der Business-Zentrale als Leads.',
    thanksLeadSaved: 'Danke, deine Anfrage wurde gespeichert.',
    optionalMailto: 'Optional kannst du zusätzlich eine E-Mail vorbereiten.',
    changeStatus: 'Status ändern',
    statusNew: 'Neu',
    statusContacted: 'Kontaktiert',
    statusDone: 'Erledigt',
    statusArchived: 'Archiviert',
    openLead: 'Lead öffnen',
    copyEmail: 'E-Mail kopieren',
    copyPhone: 'Telefonnummer kopieren',
    copyMsg: 'Nachricht kopieren',
    archiveLead: 'Lead archivieren',
    deleteLead: 'Lead löschen',
    templates: 'Firmenvorlagen',
    newTemplate: 'Neue Vorlage',
    useTemplate: 'Vorlage verwenden',
    saveTemplate: 'Vorlage speichern',
    applyBranding: 'Firmenbranding auf Mitarbeiterkarten anwenden',
    brandingConfirm: 'Dies aktualisiert das Design deiner Mitarbeiterkarten. Inhalte und Buttons bleiben erhalten.',
    duplicateSelected: 'Ausgewählte Karten duplizieren',
    export: 'Export',
    exportLeadsCsv: 'Leads als CSV exportieren',
    exportCardsCsv: 'Mitarbeiterkarten als CSV exportieren',
    exportLinksTxt: 'Kartenlinks als TXT exportieren',
    noExportData: 'Keine Daten zum Exportieren vorhanden.',
    prepCustomDomain: 'Eigene Domain vorbereiten',
    domain: 'Domain',
    dnsLaterAdvice: 'DNS-Verknüpfung wird später aktiviert.',
    statusNotConfigured: 'Noch nicht konfiguriert',
    statusPending: 'Ausstehend',
    statusVerified: 'Verifiziert',
    statusDisabled: 'Deaktiviert',
    featureLockedText: 'Diese Business-Funktion ist ab KONU Business verfügbar.'
  },
  en: {
    businessHub: 'Business Hub',
    businessSub: 'Manage your company profile, team members, and employee cards.',
    lockedTitle: 'Business Hub Locked',
    lockedDesc: 'Manage your team, create corporate business cards and verify roles. Available starting at KONU Company/Business.',
    upgradeBtn: 'Upgrade to Company/Business now',
    createCompanyTitle: 'Create Company Profile',
    createCompanyDesc: 'Set up your company profile to start managing corporate employee cards and permissions.',
    companyName: 'Company Name',
    companyEmail: 'Company E-Mail (contact)',
    companyPhone: 'Company Phone',
    companyAddress: 'Address / Headquarters',
    btnCreateCompany: 'Create Profile',
    companySettings: 'Edit Company Profile',
    saveChanges: 'Save Changes',
    teamManagement: 'Team Management',
    addMember: 'Invite Member',
    emailPlaceholder: 'employee@company.com',
    fullName: 'Employee Name',
    role: 'Team Role',
    btnAdd: 'Assign / Invite',
    status: 'Status',
    action: 'Action',
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleEditor: 'Editor',
    roleViewer: 'Viewer',
    active: 'Active',
    deactivated: 'Deactivated',
    deactivate: 'Deactivate',
    activate: 'Activate',
    remove: 'Remove',
    employeeCards: 'Employee Cards',
    createEmployeeCard: 'Create New Employee Card',
    markExistingCard: 'Attach Existing Card',
    chooseCard: 'Select custom card...',
    btnMarkCard: 'Attach to Company',
    unmarkCard: 'Detach from Company',
    quickEditTitle: 'Customize Employee Card',
    employeeNameLabel: 'Display Name',
    employeeRoleLabel: 'Position / Role',
    employeeEmailLabel: 'Email',
    employeePhoneLabel: 'Direct Phone',
    managedByCompanyLabel: 'Managed by Company',
    successSaved: 'Successfully saved!',
    errorFillName: 'Please fill out a company name.',
    emptyEmployeeList: 'No employee cards created yet.',
    noExistingCards: 'No other owned cards available to attach.',
    saving: 'Saving...',
    loading: 'Loading Business hub details...',
    
    // Prompt 7B translations
    leads: 'Leads',
    emptyLeads: 'No leads yet.',
    storeResponseLabel: 'Store form responses in KONU',
    storeResponseDesc: 'Responses will appear as leads in the Business hub.',
    thanksLeadSaved: 'Thank you, your request has been saved.',
    optionalMailto: 'Optionally, you can also prepare an email.',
    changeStatus: 'Change status',
    statusNew: 'New',
    statusContacted: 'Contacted',
    statusDone: 'Done',
    statusArchived: 'Archived',
    openLead: 'Open lead',
    copyEmail: 'Copy email',
    copyPhone: 'Copy phone number',
    copyMsg: 'Copy message',
    archiveLead: 'Archive lead',
    deleteLead: 'Delete lead',
    templates: 'Company templates',
    newTemplate: 'New template',
    useTemplate: 'Use template',
    saveTemplate: 'Save template',
    applyBranding: 'Apply company branding to employee cards',
    brandingConfirm: 'This updates the design of your employee cards. Content and buttons remain unchanged.',
    duplicateSelected: 'Duplicate selected cards',
    export: 'Export',
    exportLeadsCsv: 'Export leads as CSV',
    exportCardsCsv: 'Export employee cards as CSV',
    exportLinksTxt: 'Export card links as TXT',
    noExportData: 'No data available for export.',
    prepCustomDomain: 'Prepare custom domain',
    domain: 'Domain',
    dnsLaterAdvice: 'DNS connection will be activated later.',
    statusNotConfigured: 'Not configured',
    statusPending: 'Pending',
    statusVerified: 'Verified',
    statusDisabled: 'Disabled',
    featureLockedText: 'This business feature is available from KONU Business.'
  }
};

export function BusinessHub({ 
  user, 
  profile, 
  lang = 'de', 
  effectivePlanId, 
  cards, 
  simulatedOverrides,
  onUpdateCards 
}: BusinessHubProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [employeeCards, setEmployeeCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for Company creation / updates
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyVat, setCompanyVat] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');

  // Form states for adding member
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CompanyRole>('editor');

  // Selected card to attach
  const [selectedCardToAttach, setSelectedCardToAttach] = useState('');

  // Editing state for employee cards
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editEmployeeRole, setEditEmployeeRole] = useState('');
  const [editEmployeeEmail, setEditEmployeeEmail] = useState('');
  const [editEmployeePhone, setEditEmployeePhone] = useState('');
  const [editManagedByCompany, setEditManagedByCompany] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Prompt 7B State Variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [brandColor, setBrandColor] = useState('#1c1917');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'employee_card' | 'product_card' | 'service_card' | 'event_card'>('employee_card');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplateSourceCardId, setSelectedTemplateSourceCardId] = useState('');
  const [activeBusinessTab, setActiveBusinessTab] = useState<'profile' | 'team' | 'employee_cards' | 'duplicate' | 'leads' | 'templates' | 'branding' | 'export' | 'domain'>('profile');

  const t = LOCAL_TRANSLATIONS[lang];

  // Determine pricing & feature plans
  const activePlanId = simulatedOverrides.simulatedPlan || effectivePlanId || 'starter';
  const hasBusinessAccess = activePlanId === 'business' || activePlanId === 'enterprise';

  const companyId = user?.uid ? `c_${user.uid}` : '';

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time synchronization
  useEffect(() => {
    if (!user?.uid || !hasBusinessAccess || !companyId) {
      setCompany(null);
      setMembers([]);
      setEmployeeCards([]);
      return;
    }

    setIsLoading(true);

    let unsubscribeCompany: (() => void) | null = null;
    let unsubscribeMembers: (() => void) | null = null;
    let unsubscribeCards: (() => void) | null = null;
    let unsubscribeLeads: (() => void) | null = null;
    let unsubscribeTemplates: (() => void) | null = null;

    try {
      // 1. Listen to company doc
      const companyRef = doc(db, 'companies', companyId);
      unsubscribeCompany = onSnapshot(companyRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Company;
          if (data) {
            setCompany(data);
            setCompanyName(data.name || '');
            setCompanyEmail(data.email || '');
            setCompanyPhone(data.phone || '');
            setCompanyAddress(data.address || '');
            setCompanyVat(data.vat || '');
            setCompanyCountry(data.country || '');
            if (data.brandColor) setBrandColor(data.brandColor);
            if (data.brandLogoUrl) setBrandLogoUrl(data.brandLogoUrl);
            if (data.customDomain?.domain) setDomainInput(data.customDomain.domain);
          }
        } else {
          setCompany(null);
        }
        setIsLoading(false);
      }, (err) => {
        console.warn('Failed to subscribe company safely:', err);
        setIsLoading(false);
      });

      // 2. Listen to members
      const membersRef = collection(db, 'companies', companyId, 'members');
      unsubscribeMembers = onSnapshot(membersRef, (snap) => {
        const list: CompanyMember[] = [];
        snap.forEach((d) => {
          if (d.exists()) {
            list.push({ memberId: d.id, ...d.data() } as CompanyMember);
          }
        });
        setMembers(list);
      }, (err) => {
        console.warn('Failed to subscribe members safely:', err);
      });

      // 3. Listen to company cards
      unsubscribeCards = onSnapshot(
        query(collection(db, 'cards'), where('companyId', '==', companyId)),
        (snap) => {
          const list: Card[] = [];
          snap.forEach((d) => {
            if (d.exists()) {
              const cardData = d.data() as Card;
              if (cardData && cardData.isEmployeeCard && !cardData.isDeleted) {
                list.push(cardData);
              }
            }
          });
          setEmployeeCards(list);
        },
        (err) => {
          console.warn('Failed to fetch employee cards safely:', err);
        }
      );

      // 4. Listen to Leads
      const leadsRef = collection(db, 'companies', companyId, 'leads');
      unsubscribeLeads = onSnapshot(leadsRef, (snap) => {
        const list: Lead[] = [];
        snap.forEach((d) => {
          if (d.exists()) {
            list.push({ leadId: d.id, ...d.data() } as Lead);
          }
        });
        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeads(list);
      }, (err) => {
        console.warn('Failed to fetch leads safely:', err);
      });

      // 5. Listen to Templates
      const templatesRef = collection(db, 'companies', companyId, 'templates');
      unsubscribeTemplates = onSnapshot(templatesRef, (snap) => {
        const list: CompanyTemplate[] = [];
        snap.forEach((d) => {
          if (d.exists()) {
            list.push({ templateId: d.id, ...d.data() } as CompanyTemplate);
          }
        });
        setTemplates(list);
      }, (err) => {
        console.warn('Failed to fetch templates safely:', err);
      });

    } catch (e) {
      console.error('Error starting BusinessHub Firestore subscriptions:', e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeCompany) unsubscribeCompany();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeCards) unsubscribeCards();
      if (unsubscribeLeads) unsubscribeLeads();
      if (unsubscribeTemplates) unsubscribeTemplates();
    };
  }, [user?.uid, hasBusinessAccess, companyId]);

  // Handle Company Profile Save / Create
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast(t.errorFillName);
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Company> = {
        companyId,
        name: companyName,
        ownerId: user?.uid || '',
        email: companyEmail,
        phone: companyPhone,
        address: companyAddress,
        vat: companyVat,
        country: companyCountry,
        updatedAt: new Date().toISOString()
      };

      if (!company) {
        payload.createdAt = new Date().toISOString();
        // Also auto-add the owner to members
        const firstMember: CompanyMember = {
          memberId: user?.uid || '',
          email: user?.email || '',
          role: 'owner',
          status: 'active',
          name: profile?.displayName || 'Owner',
          userId: user?.uid || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'companies', companyId), payload);
        if (user?.uid) {
          await setDoc(doc(db, 'companies', companyId, 'members', user.uid), firstMember);
        }
      } else {
        await setDoc(doc(db, 'companies', companyId), payload, { merge: true });
      }

      showToast(t.successSaved);
    } catch (err) {
      console.error('Error saving company profile:', err);
      showToast('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Team Member Invitation
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsSaving(true);
    try {
      const cleanEmail = newMemberEmail.trim().toLowerCase();
      // Generate standard clean key from email slug
      const slugId = cleanEmail.replace(/[^a-z0-9]/g, '_');

      const payload: CompanyMember = {
        memberId: slugId,
        email: cleanEmail,
        role: newMemberRole,
        status: 'active',
        name: newMemberName.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'companies', companyId, 'members', slugId), payload);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberRole('editor');
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error adding team member:', err);
      showToast('Error adding member');
    } finally {
      setIsSaving(false);
    }
  };

  // Modify Team Member Role
  const handleUpdateMemberRole = async (memberId: string, role: CompanyRole) => {
    try {
      await updateDoc(doc(db, 'companies', companyId, 'members', memberId), {
        role,
        updatedAt: new Date().toISOString()
      });
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error updating member role:', err);
    }
  };

  // Toggle Member Status (Active / Deactivated)
  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'deactivated' : 'active';
      await updateDoc(doc(db, 'companies', companyId, 'members', memberId), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error updating member status:', err);
    }
  };

  // Remove Member completely from list
  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.uid) return; // cannot delete owner
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'members', memberId));
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  // Create an entirely new Employee Card
  const handleCreateNewEmployeeCard = async () => {
    setIsSaving(true);
    try {
      const rawRes = await getDocs(collection(db, 'cards'));
      const cardCount = rawRes.size;
      const slugSuffix = Math.floor(1000 + Math.random() * 9000);
      const tempSlug = `staff-${slugSuffix}-${cardCount}`;

      const cardId = doc(collection(db, 'cards')).id;
      const defaultEmployeeCard: Card = {
        cardId,
        ownerId: user?.uid || '',
        type: 'person',
        slug: tempSlug,
        title: 'Mitarbeiter Name',
        subtitle: 'Ihre Position | Abteilung',
        profileImageUrl: '',
        backgroundType: 'color',
        backgroundColor: '#111111',
        overlay: 'none',
        buttons: [],
        isPublished: true,
        visibility: 'public',
        brandingRequired: false,
        brandingHidden: true,

        // Employee extensions
        companyId,
        isEmployeeCard: true,
        employeeName: 'Neuer Mitarbeiter',
        employeeRole: 'Mitarbeiter',
        employeeEmail: '',
        employeePhone: '',
        managedByCompany: true,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'cards', cardId), defaultEmployeeCard);
      showToast(t.successSaved);
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error creating employee card:', err);
      showToast('Error creating card');
    } finally {
      setIsSaving(false);
    }
  };

  // Mark existing card as employee
  const handleMarkExistingCard = async () => {
    if (!selectedCardToAttach) return;
    setIsSaving(true);
    try {
      const cardRef = doc(db, 'cards', selectedCardToAttach);
      const cardSnap = await getDoc(cardRef);
      if (cardSnap.exists()) {
        const cardData = cardSnap.data() as Card;
        await updateDoc(cardRef, {
          companyId,
          isEmployeeCard: true,
          employeeName: cardData.title || '',
          employeeRole: cardData.subtitle || '',
          managedByCompany: true,
          updatedAt: new Date().toISOString()
        });
        setSelectedCardToAttach('');
        showToast(t.successSaved);
        if (onUpdateCards) onUpdateCards();
      }
    } catch (err) {
      console.error('Error matching existing card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Unmark / Detach a card from company
  const handleDetachCard = async (cardId: string) => {
    try {
      await updateDoc(doc(db, 'cards', cardId), {
        isEmployeeCard: false,
        companyId: null,
        managedByCompany: false,
        updatedAt: new Date().toISOString()
      });
      showToast(t.successSaved);
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error detaching card:', err);
    }
  };

  // Edit Employee Details Modal Panel triggers
  const startEditingCard = (card: Card) => {
    setEditingCardId(card.cardId);
    setEditEmployeeName(card.employeeName || card.title || '');
    setEditEmployeeRole(card.employeeRole || card.subtitle || '');
    setEditEmployeeEmail(card.employeeEmail || '');
    setEditEmployeePhone(card.employeePhone || '');
    setEditManagedByCompany(card.managedByCompany !== false);
  };

  const saveEmployeeDetails = async () => {
    if (!editingCardId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'cards', editingCardId), {
        employeeName: editEmployeeName,
        employeeRole: editEmployeeRole,
        employeeEmail: editEmployeeEmail,
        employeePhone: editEmployeePhone,
        managedByCompany: editManagedByCompany,
        // Sync root title and subtitle too for unified layout
        title: editEmployeeName,
        subtitle: editEmployeeRole,
        updatedAt: new Date().toISOString()
      });
      setEditingCardId(null);
      showToast(t.successSaved);
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error saving employee fields:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- LEAD MANAGERS (7B) ---
  const handleUpdateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      await updateDoc(doc(db, 'companies', companyId, 'leads', leadId), {
        status,
        updatedAt: new Date().toISOString()
      });
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'leads', leadId));
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // --- CORPORATE TEMPLATES (7B) ---
  const handleSaveAsTemplate = async (sourceCardId: string) => {
    if (!templateName.trim()) {
      showToast(lang === 'de' ? 'Bitte Vorlagennamen eingeben.' : 'Please enter template name.');
      return;
    }
    const card = cards.find(c => c.cardId === sourceCardId) || employeeCards.find(c => c.cardId === sourceCardId);
    if (!card) {
      showToast(lang === 'de' ? 'Karte nicht gefunden.' : 'Card not found.');
      return;
    }

    setIsSaving(true);
    try {
      const templateId = doc(collection(db, 'companies', companyId, 'templates')).id;
      const cleanButtons = card.buttons.map(b => ({
        title: b.title || '',
        actionType: b.actionType || 'url',
        actionValue: b.actionValue || '',
        icon: b.icon || '',
        bgColor: b.bgColor || '',
        textColor: b.textColor || '',
        styleVariant: b.styleVariant || 'filled',
        radius: b.radius || 'rounded',
        position: b.position || 0,
        isActive: b.isActive !== false
      })) as CardButton[];

      const payload: CompanyTemplate = {
        templateId,
        companyId,
        name: templateName.trim(),
        type: templateType,
        description: templateDescription.trim(),
        design: {
          backgroundType: card.backgroundType === 'video' ? 'color' : (card.backgroundType || 'color'),
          backgroundColor: card.backgroundColor || '#111111',
          backgroundImageUrl: card.backgroundImageUrl || '',
          backgroundImageFit: card.backgroundImageFit || 'cover',
          overlay: card.overlay || 'none'
        },
        defaultButtons: cleanButtons,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'companies', companyId, 'templates', templateId), payload);
      setTemplateName('');
      setTemplateDescription('');
      setSelectedTemplateSourceCardId('');
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error saving template:', err);
      showToast('Error saving template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseTemplate = async (tmpl: CompanyTemplate) => {
    setIsSaving(true);
    try {
      const cardCount = cards.length;
      const slugSuffix = Math.floor(1000 + Math.random() * 9000);
      const tempSlug = `staff-template-${slugSuffix}-${cardCount}`;
      const cardId = doc(collection(db, 'cards')).id;

      const newCard: Card = {
        cardId,
        ownerId: user?.uid || '',
        type: 'person',
        slug: tempSlug,
        title: 'Mitarbeiter Name (Vorlage)',
        subtitle: tmpl.name,
        profileImageUrl: '',
        backgroundType: tmpl.design.backgroundType || 'color',
        backgroundColor: tmpl.design.backgroundColor || '#111111',
        backgroundImageUrl: tmpl.design.backgroundImageUrl || '',
        backgroundImageFit: tmpl.design.backgroundImageFit || 'cover',
        overlay: tmpl.design.overlay || 'none',
        buttons: (tmpl.defaultButtons || []).map((b, idx) => ({
          id: doc(collection(db, 'cards')).id + '_' + idx,
          title: b.title || '',
          actionType: b.actionType || 'url',
          actionValue: b.actionValue || '',
          icon: b.icon || '',
          bgColor: b.bgColor || '',
          textColor: b.textColor || '',
          styleVariant: b.styleVariant || 'filled',
          radius: b.radius || 'rounded',
          position: b.position ?? idx,
          isActive: b.isActive !== false
        })) as CardButton[],
        isPublished: true,
        visibility: 'public',
        brandingRequired: false,
        brandingHidden: true,

        // Employee extensions
        companyId,
        isEmployeeCard: true,
        employeeName: 'Mitarbeiter Name',
        employeeRole: tmpl.name,
        employeeEmail: '',
        employeePhone: '',
        managedByCompany: true,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'cards', cardId), newCard);
      showToast(t.successSaved);
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error creating from template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (tmplId: string) => {
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'templates', tmplId));
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  // --- CORPORATE BRANDING (7B) ---
  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'companies', companyId), {
        brandColor,
        brandLogoUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error saving branding:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyBrandingToAll = async () => {
    const confirmMsg = t.brandingConfirm;
    if (typeof window !== 'undefined' && window.confirm && !window.confirm(confirmMsg)) {
      return;
    }

    setIsSaving(true);
    try {
      // Find all company employee cards count
      const staffCards = employeeCards.filter(c => c.companyId === companyId);
      for (const sc of staffCards) {
        await updateDoc(doc(db, 'cards', sc.cardId), {
          backgroundColor: brandColor,
          brandColor: brandColor, // Keep corporate reference
          customLogoUrl: brandLogoUrl || null,
          heroLogoUrl: brandLogoUrl || null, // Ensure visible in modern hero too
          companyName: company?.name || null,
          customBrandingEnabled: true,
          updatedAt: new Date().toISOString()
        });
      }
      showToast(t.successSaved);
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error applying corporate brand:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- MULTIPLE COPY / DUPLICATE (7B) ---
  const handleToggleCardSelection = (id: string) => {
    setSelectedCardIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDuplicateSelectedCards = async () => {
    if (selectedCardIds.length === 0) {
      showToast(lang === 'de' ? 'Bitte wähle mindestens eine Karte aus.' : 'Please select at least one card.');
      return;
    }
    setIsSaving(true);
    try {
      for (const cid of selectedCardIds) {
        const source = cards.find(c => c.cardId === cid) || employeeCards.find(c => c.cardId === cid);
        if (source) {
          const cardCount = cards.length;
          const slugSuffix = Math.floor(1000 + Math.random() * 9000);
          const tempSlug = `${source.slug}-copy-${slugSuffix}`;
          const newId = doc(collection(db, 'cards')).id;

          const titleSuffix = lang === 'de' ? 'Kopie' : 'Copy';
          const duplicated: Card = {
            ...source,
            cardId: newId,
            slug: tempSlug,
            title: `${source.title} (${titleSuffix})`,
            employeeName: source.employeeName ? `${source.employeeName} (${titleSuffix})` : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          // Remove analytics references or leads
          delete duplicated.status;

          await setDoc(doc(db, 'cards', newId), duplicated);
        }
      }
      setSelectedCardIds([]);
      showToast(lang === 'de' ? 'Karten wurden dupliziert.' : 'Cards were duplicated.');
      if (onUpdateCards) onUpdateCards();
    } catch (err) {
      console.error('Error duplicating multiple card elements:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- BUSINESS EXPORT (7B) ---
  const handleExportLeadsCsv = () => {
    if (leads.length === 0) {
      showToast(t.noExportData);
      return;
    }
    const headers = ['createdAt', 'status', 'formType', 'cardTitle', 'name', 'email', 'phone', 'topic', 'message', 'preferredTime'];
    const rows = leads.map(l => [
      l.createdAt || '',
      l.status || '',
      l.formType || '',
      l.cardTitle || '',
      l.name || '',
      l.email || '',
      l.phone || '',
      l.topic || '',
      l.message?.replace(/"/g, '""') || '',
      l.preferredTime || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${companyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCardsCsv = () => {
    const list = employeeCards.filter(c => c.companyId === companyId);
    if (list.length === 0) {
      showToast(t.noExportData);
      return;
    }
    const headers = ['cardTitle', 'employeeName', 'employeeRole', 'employeeEmail', 'employeePhone', 'publicUrl', 'status'];
    const rows = list.map(c => [
      c.title || '',
      c.employeeName || '',
      c.employeeRole || '',
      c.employeeEmail || '',
      c.employeePhone || '',
      `https://konu.de/u/${c.slug}`,
      c.isPublished ? 'active' : 'draft'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${companyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLinksTxt = () => {
    const list = employeeCards.filter(c => c.companyId === companyId);
    if (list.length === 0) {
      showToast(t.noExportData);
      return;
    }
    const content = list.map(c => `${c.title || 'Mitarbeiter'}: https://konu.de/u/${c.slug}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `links_${companyId}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CUSTOM DOMAIN PREPARATION (7B) ---
  const handleSaveCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    let cleanDomain = domainInput.trim().toLowerCase();
    // Clean protocol references (http, https, www)
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove any trailing path/folders
    if (cleanDomain.includes('/')) {
      cleanDomain = cleanDomain.split('/')[0];
    }

    if (!cleanDomain || !cleanDomain.includes('.')) {
      showToast(lang === 'de' ? 'Bitte gib eine gültige Domain ein.' : 'Please enter a valid domain.');
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'companies', companyId), {
        customDomain: {
          domain: cleanDomain,
          status: 'pending',
          notes: 'DNS setup pending.',
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast(t.successSaved);
    } catch (err) {
      console.error('Error saving domain config:', err);
    } finally {
      setIsSaving(false);
    }
  };
  if (!hasBusinessAccess) {
    return (
      <div className="bg-[#121212] border border-stone-850 rounded-3xl p-5 md:p-6 shadow-xl font-sans relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Beautiful glassmorphism lock banner */}
        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6">
          <div className="bg-[#A855F7] p-3.5 rounded-2xl text-stone-950 mb-3 shadow-lg select-none">
            <LucideIcons.Lock size={22} className="stroke-[2.5]" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{t.lockedTitle}</h3>
          <p className="text-stone-400 text-xs max-w-sm mb-4 leading-relaxed">{t.lockedDesc}</p>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="bg-[#A855F7] hover:bg-purple-500 text-stone-950 text-[10px] uppercase tracking-wider font-extrabold py-3 px-5 rounded-2xl transition shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <LucideIcons.Sparkles size={12} className="stroke-[2.5]" />
            <span>{t.upgradeBtn}</span>
          </button>
        </div>

        {/* Muted background skeleton representing structure */}
        <div className="w-full opacity-15 pointer-events-none select-none">
          <div className="flex items-center gap-2 pb-5 border-b border-stone-800">
            <LucideIcons.Building size={16} />
            <span className="text-xs font-bold uppercase">{t.businessHub}</span>
          </div>
          <div className="space-y-4 pt-5">
            <div className="h-10 bg-stone-800 rounded-lg"></div>
            <div className="h-28 bg-stone-800 rounded-lg"></div>
          </div>
        </div>

        {showUpgradeModal && (
          <UpgradeModal 
            isOpen={showUpgradeModal} 
            onClose={() => setShowUpgradeModal(false)}
            lang={lang}
            featureKey="teamFeatures"
          />
        )}
      </div>
    );
  }

  // Cards owned by user that can potentially be converted to staff profiles
  const eligibleAttachCards = cards.filter(c => !c.isEmployeeCard && !c.isDeleted);

  return (
    <div className="bg-[#121212] border border-stone-850 rounded-3xl p-5 md:p-6 shadow-xl font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-850">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <LucideIcons.Building size={18} className="text-[#A855F7]" />
            {t.businessHub}
          </h2>
          <p className="text-[10px] text-stone-400 mt-1">{t.businessSub}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] bg-emerald-950 text-emerald-300 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-900/60">
            KONU Business
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-stone-550 text-xs font-bold gap-2">
          <LucideIcons.Loader size={16} className="animate-spin text-[#A855F7]" />
          <span>{t.loading}</span>
        </div>
      ) : (
        <div className="space-y-6 pt-6">
          
          {/* TOAST NOTIFICATE AREA */}
          {toastMessage && (
            <div className="bg-stone-900 border border-[#A855F7]/30 text-stone-200 text-xs py-2 px-3 rounded-xl flex items-center gap-2 animate-fadeIn mb-4">
              <LucideIcons.CheckCircle size={14} className="text-[#A855F7]" />
              <span>{toastMessage}</span>
            </div>
          )}

          {!company ? (
            /* COMPANY CREATION FIRST CARD DISPLAY */
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-850/40 pb-2">
                <LucideIcons.Briefcase size={14} className="text-[#A855F7]" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  {t.createCompanyTitle}
                </h3>
              </div>
              <p className="text-stone-400 text-xs">{t.createCompanyDesc}</p>
              
              <form onSubmit={handleSaveCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-950/50 p-4 rounded-2xl border border-stone-880/40">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">{t.companyName}</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ACME Corp. GmbH"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">{t.companyEmail}</label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">{t.companyPhone}</label>
                  <input
                    type="text"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+49 (0) 123 45678"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">{t.companyAddress}</label>
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Musterstraße 42, 10115 Berlin"
                    rows={2}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none resize-none"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-50 text-stone-950 font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow"
                  >
                    <LucideIcons.Save size={12} />
                    <span>{isSaving ? t.saving : t.btnCreateCompany}</span>
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* DETAILED TABBED NAVIGATION FOR CORPORATE HUB */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* SIDEBAR NAVIGATION BUTTONS */}
              <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-stone-850 pr-0 lg:pr-4 shrink-0 whitespace-nowrap scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('profile')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'profile'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Briefcase size={12} />
                  <span>{lang === 'de' ? 'Profil' : 'Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('team')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'team'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Users size={12} />
                  <span>{lang === 'de' ? 'Mitarbeiter' : 'Colleagues'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('employee_cards')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'employee_cards'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.FolderPlus size={12} />
                  <span>{t.employeeCards}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('duplicate')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'duplicate'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Copy size={12} />
                  <span>{lang === 'de' ? 'Massenkopierung' : 'Bulk Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('leads')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left justify-between ${
                    activeBusinessTab === 'leads'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LucideIcons.Inbox size={12} />
                    <span>{t.leads}</span>
                  </span>
                  {leads.length > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeBusinessTab === 'leads' ? 'bg-stone-950 text-[#A855F7]' : 'bg-red-500 text-white'}`}>
                      {leads.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('templates')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'templates'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Layers size={12} />
                  <span>{t.templates}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('branding')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'branding'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Palette size={12} />
                  <span>{lang === 'de' ? 'Firmen-Design' : 'Corporate Style'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('export')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'export'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Download size={12} />
                  <span>{t.export}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBusinessTab('domain')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] tracking-wide font-black uppercase transition text-left ${
                    activeBusinessTab === 'domain'
                      ? 'bg-[#A855F7] text-stone-950'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900/40'
                  }`}
                >
                  <LucideIcons.Globe size={12} />
                  <span>Domain</span>
                </button>
              </div>

              {/* ACTIVE TAB DISPLAY AREA */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. PROFILE TAB VIEW */}
                {activeBusinessTab === 'profile' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.companySettings}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Verwalte dein Firmenprofil und die Kontaktdaten deiner Business Zentrale.</p>
                    </div>

                    <form onSubmit={handleSaveCompany} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.companyName}</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white uppercase font-bold focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.emailPlaceholder} (Support)</label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.employeePhoneLabel}</label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{lang === 'de' ? 'Firmen-Anschrift / Hauptsitz' : 'Corporate HQ Address'}</label>
                        <input
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder="z.B. Musterstr. 10, 80808 München"
                          className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{lang === 'de' ? 'UID-Nummer / USt-ID' : 'UID / VAT-ID'}</label>
                        <input
                          type="text"
                          value={companyVat}
                          onChange={(e) => setCompanyVat(e.target.value)}
                          placeholder="z.B. DE123456789"
                          className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{lang === 'de' ? 'Land' : 'Country'}</label>
                        <input
                          type="text"
                          value={companyCountry}
                          onChange={(e) => setCompanyCountry(e.target.value)}
                          placeholder="z.B. Deutschland"
                          className="w-full bg-stone-900 border border-stone-850 rounded-xl px-3 py-2 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end pt-3">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-[10px] uppercase tracking-wider py-2 px-6 rounded-xl transition cursor-pointer"
                        >
                          {isSaving ? t.saving : t.saveChanges}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. TEAM MEMBERS TAB VIEW */}
                {activeBusinessTab === 'team' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.teamManagement}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Lade neue Teammitglieder ein und steuere ihre Berechtigungen im System.</p>
                    </div>

                    {/* Sub-Form: Add member */}
                    <form onSubmit={handleAddMember} className="bg-stone-950/50 p-4 rounded-2xl border border-stone-880/40 space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-stone-400 leading-none">{t.addMember}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <input
                            type="email"
                            required
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder={t.emailPlaceholder}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder={t.fullName}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as CompanyRole)}
                            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-2 py-1.5 text-xs text-stone-300 focus:outline-[#A855F7] focus:outline-none"
                          >
                            <option value="owner">{t.roleOwner}</option>
                            <option value="admin">{t.roleAdmin}</option>
                            <option value="editor">{t.roleEditor}</option>
                            <option value="viewer">{t.roleViewer}</option>
                          </select>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 font-black text-[10px] py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0"
                          >
                            {t.btnAdd}
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="border border-stone-850 rounded-2xl overflow-hidden text-stone-300 text-xs">
                      <div className="bg-stone-950 px-4 py-2.5 grid grid-cols-12 gap-2 text-[10px] uppercase font-black tracking-wider text-stone-400">
                        <span className="col-span-5">{t.fullName} / E-Mail</span>
                        <span className="col-span-4">{t.role}</span>
                        <span className="col-span-3 text-right">{t.action}</span>
                      </div>

                      {members.length === 0 ? (
                        <div className="px-4 py-6 text-center text-stone-550 italic">
                          No team members assigned yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-850/60 bg-stone-900/10">
                          {members.map((mb) => {
                            const isPrimaryOwner = mb.memberId === user?.uid;
                            return (
                              <div key={mb.memberId} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-stone-950/25 transition">
                                <div className="col-span-5 min-w-0">
                                  <h5 className="font-bold text-white truncate text-xs">{mb.name || 'Invitationsmitglied'}</h5>
                                  <p className="text-[10px] text-stone-550 font-mono truncate">{mb.email}</p>
                                </div>
                                
                                <div className="col-span-4 flex items-center gap-1.5">
                                  {isPrimaryOwner ? (
                                    <span className="text-[10px] text-[#A855F7] font-extrabold uppercase">
                                      {t.roleOwner} (Host)
                                    </span>
                                  ) : (
                                    <select
                                      value={mb.role}
                                      onChange={(e) => handleUpdateMemberRole(mb.memberId, e.target.value as CompanyRole)}
                                      className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-[11px] text-stone-300 focus:outline-none"
                                    >
                                      <option value="owner">{t.roleOwner}</option>
                                      <option value="admin">{t.roleAdmin}</option>
                                      <option value="editor">{t.roleEditor}</option>
                                      <option value="viewer">{t.roleViewer}</option>
                                    </select>
                                  )}
                                  <span className={`w-1.5 h-1.5 rounded-full ${mb.status === 'active' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-stone-600'}`} />
                                </div>

                                <div className="col-span-3 flex justify-end gap-2 shrink-0">
                                  {!isPrimaryOwner && (
                                    <>
                                      <button
                                        onClick={() => handleToggleMemberStatus(mb.memberId, mb.status)}
                                        className="text-[10px] font-bold text-stone-400 hover:text-white transition"
                                        title={mb.status === 'active' ? t.deactivate : t.activate}
                                      >
                                        {mb.status === 'active' ? (
                                          <LucideIcons.ShieldMinus size={13} />
                                        ) : (
                                          <LucideIcons.ShieldAlert size={13} className="text-amber-500" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleRemoveMember(mb.memberId)}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition"
                                        title={t.remove}
                                      >
                                        <LucideIcons.Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. EMPLOYEE CARDS TAB VIEW */}
                {activeBusinessTab === 'employee_cards' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.employeeCards}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Weise Visitenkarten zu oder erstelle neue Mitarbeiterkarten für dein Unternehmen.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Create New Employee Card directly */}
                      <button
                        onClick={handleCreateNewEmployeeCard}
                        disabled={isSaving}
                        className="bg-gradient-to-br from-stone-950 to-[#191919] border border-stone-800 p-4 rounded-2xl hover:border-[#A855F7]/45 transition text-left cursor-pointer group shadow"
                      >
                        <LucideIcons.Sparkles size={18} className="text-[#A855F7] mb-2 group-hover:scale-110 transition" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{t.createEmployeeCard}</h4>
                        <p className="text-[10px] text-stone-550 leading-relaxed">
                          Erstellt eine fertige neue Mitarbeiter-Karte im Firmenpool mit geschütztem Branding.
                        </p>
                      </button>

                      {/* Connect existing owned custom cards */}
                      <div className="bg-gradient-to-br from-stone-950 to-[#191919] border border-stone-800 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <LucideIcons.Link size={13} className="text-[#A855F7]" />
                            {t.markExistingCard}
                          </h4>
                          <p className="text-[10px] text-stone-550 leading-relaxed">
                            Weise eine deiner bereits erstellten Karten dem Firmenpool zu.
                          </p>
                        </div>

                        {eligibleAttachCards.length === 0 ? (
                          <span className="text-[9px] text-stone-600 block italic">{t.noExistingCards}</span>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value={selectedCardToAttach}
                              onChange={(e) => setSelectedCardToAttach(e.target.value)}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-[11px] text-stone-300 focus:outline-[#A855F7] focus:outline-none"
                            >
                              <option value="">{t.chooseCard}</option>
                              {eligibleAttachCards.map(c => (
                                <option key={c.cardId} value={c.cardId}>{c.title || c.slug} (/u/{c.slug})</option>
                              ))}
                            </select>
                            <button
                              onClick={handleMarkExistingCard}
                              disabled={!selectedCardToAttach || isSaving}
                              className="w-full bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-45 text-stone-950 text-[10px] uppercase tracking-wider font-extrabold py-2 px-3 rounded-xl transition cursor-pointer text-center"
                            >
                              {t.btnMarkCard}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-400">{t.employeeCards} (Übersicht)</h4>
                      
                      {employeeCards.length === 0 ? (
                        <div className="bg-stone-950/20 border border-stone-850 border-dashed rounded-2xl p-6 text-center text-xs text-stone-500 italic">
                          {t.emptyEmployeeList}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {employeeCards.map((ec) => {
                            const isEditingThisCard = editingCardId === ec.cardId;
                            return (
                              <div key={ec.cardId} className="bg-[#171717] border border-stone-800 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3 min-w-0">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="bg-[#A855F7]/10 text-[#A855F7] text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md">
                                        Card Profile
                                      </span>
                                      <span className="text-[9px] font-mono text-stone-500 select-all font-bold">
                                        /u/{ec.slug}
                                      </span>
                                    </div>
                                    <h4 className="text-white text-xs font-black truncate mt-1">{ec.employeeName || ec.title}</h4>
                                    <p className="text-stone-400 text-[10px] font-medium truncate">{ec.employeeRole || ec.subtitle}</p>
                                    
                                    <div className="mt-3.5 space-y-1 text-[10px] text-stone-450 font-mono">
                                      {ec.employeeEmail && (
                                        <div className="flex items-center gap-1.5 truncate">
                                          <LucideIcons.Mail size={11} className="text-stone-600 shrink-0" />
                                          <span className="truncate">{ec.employeeEmail}</span>
                                        </div>
                                      )}
                                      {ec.employeePhone && (
                                        <div className="flex items-center gap-1.5 truncate">
                                          <LucideIcons.Phone size={11} className="text-stone-600 shrink-0" />
                                          <span className="truncate">{ec.employeePhone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleDetachCard(ec.cardId)}
                                    className="text-stone-550 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20 transition shrink-0"
                                    title={t.unmarkCard}
                                  >
                                    <LucideIcons.Link2Off size={13} />
                                  </button>
                                </div>

                                {isEditingThisCard ? (
                                  <div className="space-y-3 pt-3.5 border-t border-stone-850 bg-stone-950/60 p-3 rounded-xl animate-fadeIn">
                                    <h5 className="text-[9px] uppercase tracking-wider text-[#A855F7] font-black">{t.quickEditTitle}</h5>
                                    
                                    <div className="space-y-2">
                                      <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.employeeNameLabel}</label>
                                        <input
                                          type="text"
                                          value={editEmployeeName}
                                          onChange={(e) => setEditEmployeeName(e.target.value)}
                                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-2.5 py-1 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.employeeRoleLabel}</label>
                                        <input
                                          type="text"
                                          value={editEmployeeRole}
                                          onChange={(e) => setEditEmployeeRole(e.target.value)}
                                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-2.5 py-1 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.employeeEmailLabel}</label>
                                        <input
                                          type="email"
                                          value={editEmployeeEmail}
                                          onChange={(e) => setEditEmployeeEmail(e.target.value)}
                                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-2.5 py-1 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">{t.employeePhoneLabel}</label>
                                        <input
                                          type="text"
                                          value={editEmployeePhone}
                                          onChange={(e) => setEditEmployeePhone(e.target.value)}
                                          className="w-full bg-stone-900 border border-stone-850 rounded-lg px-2.5 py-1 text-xs text-white focus:border-[#A855F7] focus:outline-none"
                                        />
                                      </div>

                                      <div className="flex items-center gap-2 pt-1 select-none">
                                        <input
                                          type="checkbox"
                                          id={`managed-by-${ec.cardId}`}
                                          checked={editManagedByCompany}
                                          onChange={(e) => setEditManagedByCompany(e.target.checked)}
                                          className="accent-[#A855F7]"
                                        />
                                        <label htmlFor={`managed-by-${ec.cardId}`} className="text-[9px] text-stone-400 font-bold uppercase cursor-pointer">
                                          {t.managedByCompanyLabel}
                                        </label>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => setEditingCardId(null)}
                                        className="text-stone-400 hover:text-white text-[10px] font-bold py-1 px-2"
                                      >
                                        Abbrechen
                                      </button>
                                      <button
                                        onClick={saveEmployeeDetails}
                                        disabled={isSaving}
                                        className="bg-[#A855F7] hover:bg-purple-500 text-stone-950 text-[10px] font-black py-1 px-3 rounded-lg"
                                      >
                                        {t.saveChanges}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={() => startEditingCard(ec)}
                                      className="bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-purple-500/30 text-stone-300 hover:text-white text-[10px] font-extrabold py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                    >
                                      <LucideIcons.UserCheck size={11} className="text-[#A855F7]" />
                                      <span>{lang === 'de' ? 'Profildetails bearbeiten' : 'Edit details'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. MULTIPLY / DUPLICATE TAB VIEW */}
                {activeBusinessTab === 'duplicate' && (
                  <div className="space-y-4 animate-fadeIn font-sans">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{lang === 'de' ? 'Visitenkarten kopieren (Bulk)' : 'Copy Cards / Bulk Duplicate'}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Wähle eine oder mehrere bestehende Visitenkarten aus, um diese mit einem Klick gleichzeitig zu duplizieren. Ideal zum Onboarding großer Teams!</p>
                    </div>

                    <div className="bg-stone-950/30 p-4 rounded-xl border border-stone-850 flex flex-col sm:flex-row items-center justify-between gap-4 shadow">
                      <div className="text-xs text-stone-300">
                        {selectedCardIds.length === 0 ? (
                          <span className="italic text-stone-500">{lang === 'de' ? 'Keine Karten ausgewählt. Wähle unten eine Karte aus.' : 'No cards selected. Mark cards from the list below.'}</span>
                        ) : (
                          <span>{lang === 'de' ? `Ausgewählt: ${selectedCardIds.length} Visitenkarte(n)` : `Selected: ${selectedCardIds.length} cards`}</span>
                        )}
                      </div>

                      <button
                        onClick={handleDuplicateSelectedCards}
                        disabled={selectedCardIds.length === 0 || isSaving}
                        className="bg-[#A855F7] hover:bg-[#7E22CE] disabled:opacity-45 text-stone-950 text-[10px] uppercase font-black tracking-wider py-2.5 px-5 rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow"
                      >
                        <LucideIcons.Copy size={13} />
                        <span>{isSaving ? t.saving : t.duplicateSelected}</span>
                      </button>
                    </div>

                    <div className="border border-stone-850 rounded-2xl overflow-hidden bg-stone-950/10">
                      <div className="bg-stone-950 px-4 py-2.5 grid grid-cols-12 gap-2 text-[10px] uppercase font-black tracking-wider text-stone-400 items-center">
                        <span className="col-span-1 text-center font-bold">Select</span>
                        <span className="col-span-6">Karten-Name / Link</span>
                        <span className="col-span-1 text-center font-bold">●</span>
                        <span className="col-span-4 text-right">Typ</span>
                      </div>

                      {cards.length === 0 && employeeCards.length === 0 ? (
                        <div className="p-8 text-center text-stone-550 italic text-xs">No cards found in your account.</div>
                      ) : (
                        <div className="divide-y divide-stone-850/60 max-h-96 overflow-y-auto">
                          {[...cards.filter(c => !c.isDeleted), ...employeeCards].map((c) => {
                            const isSelect = selectedCardIds.includes(c.cardId);
                            return (
                              <label key={c.cardId} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-stone-900/40 transition cursor-pointer select-none">
                                <div className="col-span-1 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelect}
                                    onChange={() => handleToggleCardSelection(c.cardId)}
                                    className="accent-[#A855F7] h-3.5 w-3.5"
                                  />
                                </div>
                                <div className="col-span-6 min-w-0">
                                  <h5 className="font-bold text-white text-xs truncate">{c.title || c.employeeName || 'Unbenannt'}</h5>
                                  <p className="text-[10px] text-[#A855F7] font-mono truncate font-bold">/u/{c.slug}</p>
                                </div>
                                <div className="col-span-1 text-center">
                                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.isEmployeeCard ? 'bg-emerald-500' : 'bg-stone-600'}`} />
                                </div>
                                <div className="col-span-4 text-right font-mono text-[9px] text-stone-550 uppercase">
                                  {c.isEmployeeCard ? 'Mitarbeiter' : 'Persönlich'}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. LEADS TAB VIEW */}
                {activeBusinessTab === 'leads' && (
                  <div className="space-y-4 animate-fadeIn font-sans">
                    <div className="border-b border-stone-850 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.leads}</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Hier findest du eingehende Kontaktanfragen, Termine und Leads von all deinen Formularkarten.</p>
                      </div>

                      <button
                        onClick={handleExportLeadsCsv}
                        disabled={leads.length === 0}
                        className="bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-[#A855F7]/30 text-stone-200 text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
                      >
                        <LucideIcons.Download size={11} className="text-[#A855F7]" />
                        <span>CSV Export</span>
                      </button>
                    </div>

                    {leads.length === 0 ? (
                      <div className="bg-stone-950/20 border border-stone-850 border-dashed rounded-2xl p-8 text-center text-xs text-stone-500 italic flex flex-col items-center justify-center gap-2">
                        <LucideIcons.Inbox size={22} className="text-stone-700" />
                        <span>{t.emptyLeads}</span>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {leads.map((ld) => {
                          const dt = ld.createdAt ? new Date(ld.createdAt).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          }) : '-';
                          const isNew = ld.status === 'new' || !ld.status;
                          return (
                            <div key={ld.leadId} className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 transition ${
                              isNew ? 'bg-stone-950/50 border-[#A855F7]/30' : 'bg-stone-900/10 border-stone-850'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                                      ld.status === 'done' ? 'bg-emerald-950/80 text-emerald-400' :
                                      ld.status === 'contacted' ? 'bg-blue-950/80 text-blue-400' :
                                      ld.status === 'archived' ? 'bg-stone-950/80 text-stone-500' :
                                      'bg-amber-950/80 text-[#A855F7]'
                                    }`}>
                                      {ld.status === 'done' ? t.statusDone :
                                       ld.status === 'contacted' ? t.statusContacted :
                                       ld.status === 'archived' ? t.statusArchived :
                                       t.statusNew}
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-mono">{dt}</span>
                                    <span className="text-[10px] text-stone-500 font-mono">from: {ld.cardTitle || 'Form Card'}</span>
                                  </div>
                                  <h4 className="text-xs font-black text-white mt-1.5">{ld.name}</h4>
                                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">{ld.email} | {ld.phone || '-'}</p>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                  <select
                                    value={ld.status || 'new'}
                                    onChange={(e) => handleUpdateLeadStatus(ld.leadId || '', e.target.value as any)}
                                    className="bg-stone-900 border border-stone-800 rounded-lg py-1 px-1.5 text-[9px] text-stone-300 font-bold focus:outline-none"
                                  >
                                    <option value="new">{t.statusNew}</option>
                                    <option value="contacted">{t.statusContacted}</option>
                                    <option value="done">{t.statusDone}</option>
                                    <option value="archived">{t.statusArchived}</option>
                                  </select>

                                  <button
                                    onClick={() => handleDeleteLead(ld.leadId || '')}
                                    className="text-stone-550 hover:text-red-400 p-1.5 rounded-lg hover:bg-stone-900 transition"
                                    title={t.deleteLead}
                                  >
                                    <LucideIcons.Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {ld.topic && (
                                <p className="text-[10px] font-bold text-stone-400">Betreff: <span className="text-stone-300 font-medium">{ld.topic}</span></p>
                              )}

                              {ld.message && (
                                <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-850/60 text-[11px] text-stone-300 leading-relaxed font-sans whitespace-pre-wrap select-text">
                                  {ld.message}
                                </div>
                              )}

                              {ld.preferredTime && (
                                <div className="flex items-center gap-1 text-[9px] text-[#A855F7] font-mono font-bold uppercase">
                                  <LucideIcons.Phone size={10} />
                                  <span>{lang === 'de' ? `Wunschzeit für Rückruf: ${ld.preferredTime}` : `Callback preference: ${ld.preferredTime}`}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. TEMPLATES TAB VIEW */}
                {activeBusinessTab === 'templates' && (
                  <div className="space-y-4 animate-fadeIn font-sans">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.templates}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {lang === 'de'
                          ? 'Erstelle corporate Standardvorlagen, um schnell neue Visitenkarten mit voreingestellten Buttons, Branding und Layouts zu generieren.'
                          : 'Create corporate standard templates to quickly generate new business cards with predefined buttons, branding, and layouts.'}
                      </p>
                    </div>

                    <div className="bg-stone-950/30 p-4 rounded-2xl border border-stone-850 space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-stone-400 leading-none">
                        {lang === 'de' ? `${t.newTemplate} (Vorlage anlegen)` : `${t.newTemplate} (Create template)`}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">
                            {lang === 'de' ? 'Aus Karte erstellen' : 'Create from card'}
                          </label>
                          <select
                            value={selectedTemplateSourceCardId}
                            onChange={(e) => setSelectedTemplateSourceCardId(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-[11px] text-stone-300 focus:outline-[#A855F7] focus:outline-none"
                          >
                            <option value="">{t.chooseCard}</option>
                            {[...cards.filter(c => !c.isDeleted), ...employeeCards].map(c => (
                              <option key={c.cardId} value={c.cardId}>{c.title || c.slug}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">
                            {lang === 'de' ? 'Name der Vorlage (z.B. Vertrieb Standard)' : 'Template name (e.g. Sales Standard)'}
                          </label>
                          <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder={lang === 'de' ? 'z.B. Sales-Team Standard' : 'e.g. Sales Team Standard'}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">
                            {lang === 'de' ? 'Vorlagentyp' : 'Template Type'}
                          </label>
                          <select
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value as any)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
                          >
                            <option value="employee_card">{lang === 'de' ? 'Mitarbeiterkarte (Employee)' : 'Employee Card'}</option>
                            <option value="product_card">{lang === 'de' ? 'Produkt-Präsentation' : 'Product Showcase'}</option>
                            <option value="service_card">{lang === 'de' ? 'Dienstleistungs-Info' : 'Service Info'}</option>
                            <option value="event_card">{lang === 'de' ? 'Event-Einladung' : 'Event Invitation'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">
                            {lang === 'de' ? 'Beschreibung' : 'Description'}
                          </label>
                          <input
                            type="text"
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            placeholder={lang === 'de' ? 'z.B. Vordefinierte Buttons für Kontaktaufnahme' : 'e.g. Pre-defined contact options'}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => handleSaveAsTemplate(selectedTemplateSourceCardId)}
                          disabled={!selectedTemplateSourceCardId || !templateName.trim() || isSaving}
                          className="bg-[#A855F7] hover:bg-purple-500 disabled:opacity-50 text-stone-950 text-[10px] uppercase font-black tracking-wider py-2 px-4 rounded-xl cursor-pointer transition shadow"
                        >
                          {t.saveTemplate}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                        {lang === 'de' ? 'Aktive Firmenvorlagen' : 'Active Corporate Templates'}
                      </h4>

                      {templates.length === 0 ? (
                        <div className="bg-stone-950/20 border border-stone-850 border-dashed rounded-2xl p-6 text-center text-xs text-stone-500 italic">
                          {lang === 'de'
                            ? 'Keine Vorlagen gespeichert. Erstelle oben eine Vorlage aus deinen besten Visitenkarten.'
                            : 'No templates stored yet. Create a standard template from your best business cards above.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {templates.map((tmpl) => (
                            <div key={tmpl.templateId} className="bg-[#171717] border border-stone-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="bg-[#A855F7]/10 text-[#A855F7] text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                                    {tmpl.type}
                                  </span>
                                </div>
                                <h4 className="text-white text-xs font-black mt-1">{tmpl.name}</h4>
                                {tmpl.description && (
                                  <p className="text-stone-400 text-[10px] mt-0.5">{tmpl.description}</p>
                                )}
                                <p className="text-stone-550 text-[9px] mt-2 font-mono flex items-center gap-1">
                                  {lang === 'de' ? 'Buttons: ' : 'Buttons: '}
                                  <span className="text-[#A855F7] font-bold">{tmpl.defaultButtons?.length || 0}</span>
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-stone-850">
                                <button
                                  onClick={() => handleDeleteTemplate(tmpl.templateId || '')}
                                  className="text-[9px] uppercase tracking-wider font-extrabold text-red-500 hover:text-red-300 px-1 py-1 rounded cursor-pointer"
                                >
                                  {lang === 'de' ? 'Vorlage löschen' : 'Delete template'}
                                </button>
                                <button
                                  onClick={() => handleUseTemplate(tmpl)}
                                  disabled={isSaving}
                                  className="bg-[#A855F7] hover:bg-purple-500 text-stone-950 text-[9px] uppercase font-black px-2.5 py-1.5 rounded-lg shrink-0 transition cursor-pointer"
                                >
                                  {t.useTemplate}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. BRANDING TAB VIEW */}
                {activeBusinessTab === 'branding' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{lang === 'de' ? 'Einheitliches Firmenbranding' : 'Corporate Identity Settings'}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Definiere die offizielle Farbe und das Logo deines Unternehmens. Du kannst das Design mit einem Klick auf alle Mitarbeiter-Visitenkarten übertragen!</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#171717] border border-stone-800 p-4 rounded-2xl space-y-3 font-sans">
                        <h4 className="text-[10px] font-black uppercase text-stone-400">Branding konfigurieren</h4>

                        <div className="space-y-3 font-sans">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">Firmenfarbe (HEX)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="h-8 w-8 rounded bg-transparent cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="flex-1 bg-stone-900 border border-stone-850 rounded-lg px-2 text-xs text-white text-center font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5">Firmen-Logo Bild-URL (z.B. https://example.com/logo.png)</label>
                            <input
                              type="text"
                              value={brandLogoUrl}
                              onChange={(e) => setBrandLogoUrl(e.target.value)}
                              placeholder="Füge hier eine Bild-URL ein"
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none"
                            />
                          </div>

                          {brandLogoUrl && (
                            <div className="flex items-center gap-2 p-2 bg-stone-950/50 rounded-lg border border-stone-800">
                              <img src={brandLogoUrl} className="h-8 w-8 object-contain rounded" alt="Logo Preview" referrerPolicy="no-referrer" />
                              <span className="text-[9px] text-stone-550 italic font-mono truncate">Logo-Preview</span>
                            </div>
                          )}

                          <button
                            onClick={handleSaveBranding}
                            disabled={isSaving}
                            className="w-full bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-[10px] uppercase font-black py-2 rounded-xl transition cursor-pointer"
                          >
                            Branding-Daten speichern
                          </button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-[#1c1212] to-stone-950 border border-stone-800/80 p-5 rounded-2xl flex flex-col justify-between gap-4 font-sans">
                        <div>
                          <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md inline-block mb-2">
                            Massen-Zuweisung
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{t.applyBranding}</h4>
                          <p className="text-[10px] text-stone-400 leading-relaxed">
                            Achtung: Dies überschreibt die Hintergrundfarben und Logos aller deiner aktiven Mitarbeiterkarten (employeeCards) im Firmenpool mit deiner Firmenfarbe und dem Logo! Bereits eingepflegte Profilinhalte der Mitarbeiter bleiben unberührt.
                          </p>
                        </div>

                        <button
                          onClick={handleApplyBrandingToAll}
                          disabled={isSaving}
                          className="w-full bg-stone-900 hover:bg-stone-850 hover:border-red-500/30 border border-stone-800 text-stone-200 text-[10px] uppercase tracking-wide font-extrabold py-3 px-4 rounded-xl transition cursor-pointer text-center"
                        >
                          Design jetzt erzwingen & synchronisieren
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. EXPORTS TAB VIEW */}
                {activeBusinessTab === 'export' && (
                  <div className="space-y-4 animate-fadeIn font-sans">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.export}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Lade deine Kundendaten und Mitarbeiterlisten für Excel oder deine HR-Software offline herunter.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#171717] border border-stone-800 p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow border-dashed">
                        <div>
                          <LucideIcons.Inbox className="text-[#A855F7] mb-2" size={20} />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{t.exportLeadsCsv}</h4>
                          <p className="text-[10px] text-stone-400">Lädt alle Leads mit Daten, Nachricht und Nummern herunter.</p>
                        </div>
                        <button
                          onClick={handleExportLeadsCsv}
                          className="mt-4 bg-stone-900 hover:bg-stone-800 text-stone-200 text-[9px] uppercase font-black py-2 rounded-xl transition cursor-pointer"
                        >
                          Jetzt CSV laden
                        </button>
                      </div>

                      <div className="bg-[#171717] border border-stone-800 p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow border-dashed">
                        <div>
                          <LucideIcons.Users className="text-[#A855F7] mb-2" size={20} />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{t.exportCardsCsv}</h4>
                          <p className="text-[10px] text-stone-450 leading-snug"> HR-Verzeichnis aller Mitarbeiterkarten im CSV Format.</p>
                        </div>
                        <button
                          onClick={handleExportCardsCsv}
                          className="mt-4 bg-stone-900 hover:bg-stone-800 text-stone-200 text-[9px] uppercase font-black py-2 rounded-xl transition cursor-pointer"
                        >
                          Jetzt CSV laden
                        </button>
                      </div>

                      <div className="bg-[#171717] border border-stone-800 p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow border-dashed">
                        <div>
                          <LucideIcons.Briefcase className="text-[#A855F7] mb-2" size={20} />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{t.exportLinksTxt}</h4>
                          <p className="text-[10px] text-stone-400 font-sans leading-snug">Liefert eine Liste aller Visitenkarten-URLs im TXT Format.</p>
                        </div>
                        <button
                          onClick={handleExportLinksTxt}
                          className="mt-4 bg-stone-900 hover:bg-stone-800 text-stone-200 text-[9px] uppercase font-black py-2 rounded-xl transition cursor-pointer"
                        >
                          Jetzt TXT laden
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. DOMAIN TAB VIEW */}
                {activeBusinessTab === 'domain' && (
                  <div className="space-y-4 animate-fadeIn font-sans">
                    <div className="border-b border-stone-850 pb-2">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">{t.prepCustomDomain}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Bereite deine eigene Domain vor, um deine Visitenkarten unter deiner eigenen Firmenadresse (z.B. cards.firma.de) statt konu.de aufzurufen!</p>
                    </div>

                    <div className="bg-[#171717] border border-stone-800 p-4 rounded-2xl space-y-4 font-sans shadow">
                      <form onSubmit={handleSaveCustomDomain} className="space-y-3 font-sans">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-stone-500 block mb-0.5 font-sans">Firmen-eigene Domain (z.B. cards.mycompany.com)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={domainInput}
                              onChange={(e) => setDomainInput(e.target.value)}
                              placeholder="cards.acme-corp.de"
                              className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-[#A855F7] focus:outline-none font-sans"
                            />
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="bg-[#A855F7] hover:bg-[#7E22CE] text-stone-950 text-[10px] font-black uppercase tracking-wider px-4 rounded-xl transition shrink-0 cursor-pointer"
                            >
                              Domain eintragen
                            </button>
                          </div>
                        </div>
                      </form>

                      {company?.customDomain && (
                        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3 font-mono text-xs">
                          <div className="flex items-center justify-between font-sans">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Aktueller Domain Status</span>
                            <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-950 text-[#A855F7] border border-[#A855F7]/20">
                              {company?.customDomain?.status === 'pending' ? t.statusPending : company?.customDomain?.status}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-stone-900">
                              <span className="text-stone-550 font-sans">Domain</span>
                              <span className="font-mono text-white text-[11px] font-bold">{company?.customDomain?.domain}</span>
                            </div>

                            <div className="space-y-1.5 pt-1 text-[10px] text-stone-450 leading-relaxed font-sans">
                              <p className="font-bold text-[#A855F7] flex items-center gap-1">
                                <LucideIcons.Info size={11} />
                                <span>{t.dnsLaterAdvice}</span>
                              </p>
                              <p>Bitte erstelle bei deinem Domain-Anbieter (z.B. GoDaddy, IONOS, Strato) folgenden DNS-CName-Eintrag:</p>
                              <div className="bg-stone-900 p-2.5 rounded border border-stone-800 font-mono text-stone-300 text-[10px] break-all leading-relaxed font-mono">
                                Type: CNAME<br />
                                Name/Host: cards (bzw. deine Subdomain)<br />
                                Value/Target: custom.konu.de
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
