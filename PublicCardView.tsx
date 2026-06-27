/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import * as LucideIcons from 'lucide-react';
import { KonuLogo } from './KonuLogo';

interface OnboardingFormProps {
  lang: 'de' | 'en';
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ lang }) => {
  const { user, updateUserProfile } = useFirebase();

  // Onboarding Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [accountType, setAccountType] = useState<'private' | 'business' | 'product' | 'project' | 'family'>('private');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [companyLegalForm, setCompanyLegalForm] = useState('');
  const [vatId, setVatId] = useState('');
  const [companyAddressLine1, setCompanyAddressLine1] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('Deutschland');
  const [contactPerson, setContactPerson] = useState('');
  const [website, setWebsite] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() && !lastName.trim() && !displayName.trim()) {
      setFormError(lang === 'de' ? 'Bitte füllen Sie mindestens einen Vor- und Nachnamen oder einen Anzeigenamen aus.' : 'Please enter at least a first name, last name, or display name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        displayName: displayName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim() || user?.displayName || user?.email?.split('@')[0] || 'User',
        phone: phone.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        accountType,
        companyName: accountType === 'business' ? companyName.trim() : undefined,
        companyLegalForm: accountType === 'business' ? companyLegalForm.trim() : undefined,
        vatId: accountType === 'business' ? vatId.trim() : undefined,
        companyAddressLine1: accountType === 'business' ? companyAddressLine1.trim() : undefined,
        companyPostalCode: accountType === 'business' ? companyPostalCode.trim() : undefined,
        companyCity: accountType === 'business' ? companyCity.trim() : undefined,
        companyCountry: accountType === 'business' ? companyCountry.trim() : undefined,
        contactPerson: accountType === 'business' ? contactPerson.trim() : undefined,
        website: accountType === 'business' ? website.trim() : undefined,
        onboardingComplete: true, // Mark onboarding complete
      });
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      setFormError(lang === 'de' ? 'Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.' : 'Failed to save details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131111] text-stone-200 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl bg-[#1C1A1A] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        
        {/* Brand identity */}
        <div className="flex flex-col items-center mb-6 text-center">
          <KonuLogo variant="icon" size="md" className="mb-3" />
          <h1 className="text-xl font-black text-white tracking-tight">
            {lang === 'de' ? 'Fast fertig!' : 'Almost there!'}
          </h1>
          <p className="text-xs text-stone-400 max-w-xs mt-1">
            {lang === 'de' 
              ? 'Ergänzen Sie bitte Ihre Stammdaten, um Ihre kostenlose KONU-Seite freizuschalten.' 
              : 'Please complete your primary information to activate your complimentary KONU page.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Vorname' : 'First Name'} <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Max"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Nachname' : 'Last Name'} <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Mustermann"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Anzeigename' : 'Display Name'} <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Tag size={16} />
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Telefonnummer (optional)' : 'Phone Number (optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 170 1234567"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Straße & Hausnummer (optional)' : 'Street & Number (optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.MapPin size={16} />
                </span>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Musterstraße 123"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'PLZ (optional)' : 'Postal Code (optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Hash size={16} />
                </span>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12345"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Ort (optional)' : 'City (optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Map size={16} />
                </span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Musterstadt"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Land (optional)' : 'Country (optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Globe size={16} />
                </span>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Deutschland"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                {lang === 'de' ? 'Profiltyp' : 'Profile Type'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <LucideIcons.Briefcase size={16} />
                </span>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="private">{lang === 'de' ? 'Privatperson' : 'Private Person'}</option>
                  <option value="business">{lang === 'de' ? 'Unternehmen' : 'Company'}</option>
                  <option value="product">{lang === 'de' ? 'Produkt' : 'Product'}</option>
                  <option value="project">{lang === 'de' ? 'Projekt' : 'Project'}</option>
                  <option value="family">{lang === 'de' ? 'Familie / Gruppe' : 'Family / Group'}</option>
                </select>
              </div>
            </div>

            {accountType === 'business' && (
              <div className="sm:col-span-2 space-y-4 bg-purple-600/5 border border-purple-500/15 p-4 rounded-xl mt-2">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LucideIcons.Briefcase size={14} />
                  {lang === 'de' ? 'Unternehmensdaten' : 'Company Information'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Firmenname' : 'Company Name'}
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Muster GmbH"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Rechtsform' : 'Legal Form'}
                    </label>
                    <input
                      type="text"
                      value={companyLegalForm}
                      onChange={(e) => setCompanyLegalForm(e.target.value)}
                      placeholder="GmbH / KG"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'UID-/USt-IdNr. (optional)' : 'VAT ID (optional)'}
                    </label>
                    <input
                      type="text"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value)}
                      placeholder="DE123456789"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Firmenadresse (falls abweichend)' : 'Company Address (if different)'}
                    </label>
                    <input
                      type="text"
                      value={companyAddressLine1}
                      onChange={(e) => setCompanyAddressLine1(e.target.value)}
                      placeholder="Gewerbepark 1a"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'PLZ (Firma)' : 'Postal Code (Company)'}
                    </label>
                    <input
                      type="text"
                      value={companyPostalCode}
                      onChange={(e) => setCompanyPostalCode(e.target.value)}
                      placeholder="54321"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Ort (Firma)' : 'City (Company)'}
                    </label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="Gewerbestadt"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Land (Firma)' : 'Country (Company)'}
                    </label>
                    <input
                      type="text"
                      value={companyCountry}
                      onChange={(e) => setCompanyCountry(e.target.value)}
                      placeholder="Deutschland"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Ansprechpartner' : 'Contact Person'}
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Herr Schmidt"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">
                      {lang === 'de' ? 'Website' : 'Website'}
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://muster-gmbh.de"
                      className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {formError && (
            <div className="bg-red-950/40 border border-red-800 text-red-350 p-3 rounded-xl text-xs flex items-center gap-1.5 leading-snug">
              <LucideIcons.AlertTriangle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-600/90 text-anthracite font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-transparent premium-glow disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <>
                <LucideIcons.Loader className="animate-spin" size={16} />
                <span>{lang === 'de' ? 'Speichere...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <LucideIcons.Save size={16} />
                <span>{lang === 'de' ? 'Registrierung abschließen' : 'Complete Onboarding'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
