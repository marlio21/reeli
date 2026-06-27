/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Support VITE_ prefix as instructed, falling back to JSON configuration
const metaEnv = (import.meta as any).env;
export const resolvedConfig = {
  apiKey: (metaEnv && metaEnv.VITE_FIREBASE_API_KEY) || firebaseConfig.apiKey,
  authDomain: (metaEnv && metaEnv.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfig.authDomain,
  projectId: (metaEnv && metaEnv.VITE_FIREBASE_PROJECT_ID) || firebaseConfig.projectId,
  storageBucket: (metaEnv && metaEnv.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfig.storageBucket,
  messagingSenderId: (metaEnv && metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfig.messagingSenderId,
  appId: (metaEnv && metaEnv.VITE_FIREBASE_APP_ID) || firebaseConfig.appId,
  measurementId: (metaEnv && metaEnv.VITE_FIREBASE_MEASUREMENT_ID) || firebaseConfig.measurementId,
  databaseId: (metaEnv && metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || (firebaseConfig as any).firestoreDatabaseId || '(default)'
};

const dbId = resolvedConfig.databaseId === '(default)' ? undefined : resolvedConfig.databaseId;

const app = initializeApp(resolvedConfig);
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Pre-packaged Connection Validator
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Mandatory Error handler from firebrand SDK criteria
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
