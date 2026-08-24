import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom databaseId and resilient long-polling transport to eliminate WebChannel connection reset warnings
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

// Configure local persistence so authentication state survives page reloads and cross-origin iframe navigation
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Auth persistence initialization note:", err?.message || err);
  });
} catch (e) {
  // Ignore in environments where persistence is unavailable
}

// Error handling types and helper as specified by the Firebase Integration Skill
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
  }
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

// Validate connection on boot as requested by skill
async function testConnection() {
  try {
    // Wrap with a race to prevent long 10s blocking timeouts in sandboxed/headless environments
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout waiting for server connection")), 2000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Timeout'))) {
      console.warn("Firestore is running in offline mode. Local state and caching will be utilized.");
    } else {
      console.warn("Firestore connection check status:", error instanceof Error ? error.message : String(error));
    }
  }
}
testConnection();
