/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from '../firebase';
import { doc, updateDoc, setDoc, increment } from 'firebase/firestore';

/**
 * Returns YYYY-MM-DD local date string
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Anonymously tracks a card view with sessionStorage-based de-duplication.
 * Fail-silent wrapper, never halts regular application flow.
 */
export function trackCardView(cardId: string): void {
  if (typeof window === 'undefined' || !cardId) return;
  
  // Try/catch safety wrapper to avoid breaking viewer flow
  try {
    const storageKey = `konu_view_${cardId}`;
    if (sessionStorage.getItem(storageKey)) {
      return; // Already tracked in this session
    }
    sessionStorage.setItem(storageKey, '1');
    
    const today = getTodayDateString();
    const docRef = doc(db, 'cards', cardId, 'analytics', 'summary');
    
    // Perform writing natively and asynchronously without await blocking the main threads
    updateDoc(docRef, {
      totalViews: increment(1),
      [`dailyViews.${today}`]: increment(1),
      lastUpdated: new Date().toISOString()
    }).catch(() => {
      // Document probably doesn't exist yet, bootstrap it
      setDoc(docRef, {
        totalViews: 1,
        dailyViews: {
          [today]: 1
        },
        totalButtonClicks: 0,
        buttonClicks: {},
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch((e) => {
        // Safe console notice, silent to user
        console.warn('Analytics view bootstrap failed:', e);
      });
    });
  } catch (error) {
    console.warn('Could not launch card view tracking:', error);
  }
}

/**
 * Anonymously tracks a button click with sessionStorage-based de-duplication.
 * Fail-silent wrapper, never halts click routing flows.
 */
export function trackButtonClick(cardId: string, buttonId: string): void {
  if (typeof window === 'undefined' || !cardId || !buttonId) return;
  
  try {
    const storageKey = `konu_click_${cardId}_${buttonId}`;
    if (sessionStorage.getItem(storageKey)) {
      return; // Already tracked in this session
    }
    sessionStorage.setItem(storageKey, '1');
    
    const docRef = doc(db, 'cards', cardId, 'analytics', 'summary');
    
    // Perform writing natively and asynchronously
    updateDoc(docRef, {
      totalButtonClicks: increment(1),
      [`buttonClicks.${buttonId}`]: increment(1),
      lastUpdated: new Date().toISOString()
    }).catch(() => {
      // Document probably doesn't exist yet, bootstrap it
      setDoc(docRef, {
        totalViews: 0,
        dailyViews: {},
        totalButtonClicks: 1,
        buttonClicks: {
          [buttonId]: 1
        },
        lastUpdated: new Date().toISOString()
      }, { merge: true }).catch((e) => {
        console.warn('Analytics click bootstrap failed:', e);
      });
    });
  } catch (error) {
    console.warn('Could not launch button click tracking:', error);
  }
}
