/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from '../types';
import { canUseFeature } from '../config/plans';

/**
 * Formats a clean vCard contact file structure. Matches standard iOS/Android specifications.
 */
export function generateVCardString(
  card: Card,
  email: string = '',
  phone: string = '',
  organization: string = '',
  jobTitle: string = '',
  appUrl: string = window.location.origin
): string {
  const absoluteProfileUrl = appUrl.startsWith('http') ? `${appUrl}/u/${card.slug}` : `${window.location.origin}/u/${card.slug}`;

  // Find contact values if empty
  let finalEmail = email;
  let finalPhone = phone;
  let finalOrg = organization || card.companyName || card.heroCompany || '';
  let finalTitle = jobTitle || card.subtitle || card.heroSubtitle || '';
  const finalLocation = card.location || card.heroLocation || '';

  if (!finalEmail) {
    const eb = card.buttons?.find(b => b.isActive && (b.actionType === 'email' || b.actionType === 'mailto') && b.actionValue && b.actionValue !== '[LOCKED]');
    if (eb) {
      finalEmail = eb.actionValue.replace(/^mailto:/i, '').trim();
    }
  } else {
    finalEmail = finalEmail.replace(/^mailto:/i, '').trim();
  }

  if (!finalPhone) {
    const pb = card.buttons?.find(b => b.isActive && (b.actionType === 'phone' || b.actionType === 'tel') && b.actionValue && b.actionValue !== '[LOCKED]');
    if (pb) {
      finalPhone = pb.actionValue.replace(/^tel:/i, '').trim();
    }
  } else {
    finalPhone = finalPhone.replace(/^tel:/i, '').trim();
  }

  // Build the vCard payload complying with standard version 3.0 formatting. Matches target format.
  const fields = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.title || 'ureel'}`
  ];

  if (finalOrg) fields.push(`ORG:${finalOrg}`);
  if (finalTitle) fields.push(`TITLE:${finalTitle}`);
  if (finalPhone) fields.push(`TEL;TYPE=CELL:${finalPhone}`);
  if (finalEmail) fields.push(`EMAIL:${finalEmail}`);
  
  fields.push(`URL:${absoluteProfileUrl}`);
  
  if (finalLocation) {
    fields.push(`ADR;TYPE=WORK:;;${finalLocation};;;;`);
  }
  
  const cardPlan = card?.plan || 'starter';
  const hasBrandingHiddenFeature = canUseFeature(cardPlan, 'brandingHidden');
  if (hasBrandingHiddenFeature && card.brandingHidden === true) {
    fields.push(`NOTE:Digitale Visitenkarte - ${absoluteProfileUrl}`);
  } else {
    fields.push(`NOTE:ureel digitale Karte - ${absoluteProfileUrl}`);
  }
  fields.push('END:VCARD');

  // Filter out empty lines and join with standard CRLF double characters
  return fields.filter(Boolean).join('\r\n');
}

/**
 * Triggers a client-side download of a .vcf contact card.
 */
export function downloadVCardFile(card: Card, email?: string, phone?: string, organization?: string, jobTitle?: string) {
  const vcardText = generateVCardString(card, email, phone, organization, jobTitle);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Clean special characters from slug to make a safe filename
  const cleanSlug = card.slug.replace(/[^a-zA-Z0-9_\-]/g, '');
  link.download = `ureel-contact-${cleanSlug || 'profile'}.vcf`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
