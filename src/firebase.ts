import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const ADMIN_EMAIL = 'adjieprasatia@gmail.com';

export const BLUEPRINT_LIMITS = {
  WISH_SENDER_MAX: 80,
  WISH_MESSAGE_MAX: 500,
  RSVP_NAME_MAX: 100,
  GUEST_OVERRIDE_NAME_MAX: 100
} as const;

let connectionChecked = false;

export async function testConnection(): Promise<void> {
  if (connectionChecked) return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanText(raw: unknown, maxLength: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, maxLength);
}

function generateSecureHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function isHighEntropyRsvpId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.length >= 24 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(id)
  );
}

function toIsoString(ts: unknown): string | null {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toISOString();
  }
  return null;
}

function toEpochMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as Timestamp).toMillis === 'function') {
    return (ts as Timestamp).toMillis();
  }
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export interface PublicWishView {
  id: string;
  name: string;
  message: string;
  timestamp: string | null;
}

export interface AdminWishView {
  id: string;
  sender_name: string;
  message: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  moderation_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string | null;
  moderated_at: string | null;
}

export async function submitWishToFirestore(input: {
  sender_name?: string;
  message?: string;
  visibility?: string;
}): Promise<{
  id: string;
  name: string;
  message: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  moderation_status: 'APPROVED' | 'PENDING';
}> {
  const sender_name = cleanText(input.sender_name, BLUEPRINT_LIMITS.WISH_SENDER_MAX) || 'Tamu Undangan';
  const message = cleanText(input.message, BLUEPRINT_LIMITS.WISH_MESSAGE_MAX);
  if (!message) {
    throw new Error('Mohon tuliskan doa atau pesan terlebih dahulu ya.');
  }

  const rawVis = typeof input.visibility === 'string' ? input.visibility.trim().toUpperCase() : 'PUBLIC';
  const visibility: 'PUBLIC' | 'PRIVATE' = rawVis === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  const moderation_status: 'APPROVED' | 'PENDING' = visibility === 'PUBLIC' ? 'APPROVED' : 'PENDING';

  const wishId = `wish_${Date.now()}_${generateSecureHex(8)}`;
  const docPath = `wishes/${wishId}`;

  try {
    await setDoc(doc(db, 'wishes', wishId), {
      sender_name,
      message,
      visibility,
      moderation_status,
      createdAt: serverTimestamp()
    });
    return {
      id: wishId,
      name: sender_name,
      message,
      visibility,
      moderation_status
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function fetchPublicWishesFromFirestore(options: {
  limitCount?: number;
  randomize?: boolean;
} = {}): Promise<PublicWishView[]> {
  const limitCount = Math.min(100, Math.max(1, options.limitCount ?? 50));
  const path = 'wishes';
  try {
    const q = query(
      collection(db, 'wishes'),
      where('visibility', '==', 'PUBLIC'),
      where('moderation_status', '==', 'APPROVED')
    );
    const snap = await getDocs(q);
    const rows: Array<PublicWishView & { _ms: number }> = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      rows.push({
        id: docSnap.id,
        name: cleanText(data.sender_name, BLUEPRINT_LIMITS.WISH_SENDER_MAX) || 'Tamu Undangan',
        message: cleanText(data.message, BLUEPRINT_LIMITS.WISH_MESSAGE_MAX),
        timestamp: toIsoString(data.createdAt),
        _ms: toEpochMs(data.createdAt)
      });
    });

    rows.sort((a, b) => b._ms - a._ms);
    let sliced = rows.slice(0, limitCount).map(({ id, name, message, timestamp }) => ({
      id,
      name,
      message,
      timestamp
    }));

    if (options.randomize && sliced.length > 1) {
      sliced = [...sliced].sort(() => Math.random() - 0.5);
    }
    return sliced;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface RsvpSubmissionResult {
  rsvp_id: string;
  guest_name: string;
  attending: boolean;
  guest_count: 0 | 1;
  rsvp_status: 'WILL_ATTEND' | 'DECLINED';
  confirmed_at: string;
}

export async function submitRsvpToFirestore(input: {
  rsvp_id?: string | number | null;
  guest_name?: string;
  attending: boolean;
}): Promise<RsvpSubmissionResult> {
  const guest_name = cleanText(input.guest_name, BLUEPRINT_LIMITS.RSVP_NAME_MAX) || 'Tamu Undangan';
  const attending = Boolean(input.attending);
  const guest_count: 0 | 1 = attending ? 1 : 0;
  const rsvp_status: 'WILL_ATTEND' | 'DECLINED' = attending ? 'WILL_ATTEND' : 'DECLINED';

  const existingId = isHighEntropyRsvpId(input.rsvp_id) ? input.rsvp_id : null;

  if (existingId) {
    const updatePath = `rsvps/${existingId}`;
    try {
      await updateDoc(doc(db, 'rsvps', existingId), {
        attending,
        guest_count,
        rsvp_status,
        updatedAt: serverTimestamp()
      });
      return {
        rsvp_id: existingId,
        guest_name,
        attending,
        guest_count,
        rsvp_status,
        confirmed_at: new Date().toISOString()
      };
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
      if (code !== 'not-found') {
        handleFirestoreError(error, OperationType.UPDATE, updatePath);
      }
    }
  }

  const newId = `rsvp_${generateSecureHex(16)}`;
  const createPath = `rsvps/${newId}`;
  try {
    await setDoc(doc(db, 'rsvps', newId), {
      guest_name,
      attending,
      guest_count,
      rsvp_status,
      invitation_category: 'B',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return {
      rsvp_id: newId,
      guest_name,
      attending,
      guest_count,
      rsvp_status,
      confirmed_at: new Date().toISOString()
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, createPath);
  }
}

export function isVerifiedAdminUser(user: User | null): boolean {
  return Boolean(
    user &&
      user.email &&
      user.email.toLowerCase() === ADMIN_EMAIL &&
      user.emailVerified === true
  );
}

export async function signInAdminWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeAdminAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export interface AdminRsvpView {
  id: string;
  guest_name: string;
  attending: boolean;
  guest_count: number;
  rsvp_status: 'WILL_ATTEND' | 'DECLINED';
  created_at: string | null;
  updated_at: string | null;
  _updatedMs: number;
}

export function subscribeAdminWishes(
  onData: (wishes: AdminWishView[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'wishes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Array<AdminWishView & { _ms: number }> = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          sender_name: cleanText(d.sender_name, BLUEPRINT_LIMITS.WISH_SENDER_MAX) || 'Tamu Undangan',
          message: cleanText(d.message, BLUEPRINT_LIMITS.WISH_MESSAGE_MAX),
          visibility: d.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
          moderation_status:
            d.moderation_status === 'APPROVED' || d.moderation_status === 'REJECTED'
              ? d.moderation_status
              : 'PENDING',
          created_at: toIsoString(d.createdAt),
          moderated_at: toIsoString(d.moderatedAt),
          _ms: toEpochMs(d.createdAt)
        });
      });
      items.sort((a, b) => b._ms - a._ms);
      onData(items.map(({ _ms: _ignored, ...rest }) => rest));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeAdminRsvps(
  onData: (rsvps: AdminRsvpView[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'rsvps';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: AdminRsvpView[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const attending = Boolean(d.attending);
        items.push({
          id: docSnap.id,
          guest_name: cleanText(d.guest_name, BLUEPRINT_LIMITS.RSVP_NAME_MAX) || 'Tamu Undangan',
          attending,
          guest_count: attending ? 1 : 0,
          rsvp_status: attending ? 'WILL_ATTEND' : 'DECLINED',
          created_at: toIsoString(d.createdAt),
          updated_at: toIsoString(d.updatedAt),
          _updatedMs: toEpochMs(d.updatedAt) || toEpochMs(d.createdAt)
        });
      });
      items.sort((a, b) => a._updatedMs - b._updatedMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeAdminGuestOverrides(
  onData: (overrides: Record<string, string>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'guest_overrides';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const name = cleanText(d.guest_name, BLUEPRINT_LIMITS.GUEST_OVERRIDE_NAME_MAX);
        if (name) {
          map[docSnap.id] = name;
        }
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function moderateWishInFirestore(
  wishId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<void> {
  const path = `wishes/${wishId}`;
  const moderation_status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  try {
    await updateDoc(doc(db, 'wishes', wishId), {
      moderation_status,
      moderatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWishInFirestore(wishId: string): Promise<void> {
  const path = `wishes/${wishId}`;
  try {
    await deleteDoc(doc(db, 'wishes', wishId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGuestOverrideInFirestore(no: number, guestName: string): Promise<void> {
  const cleanName = cleanText(guestName, BLUEPRINT_LIMITS.GUEST_OVERRIDE_NAME_MAX);
  if (!cleanName || !Number.isInteger(no) || no < 1 || no > 500) {
    throw new Error('Nama tamu atau nomor tidak valid.');
  }
  const docId = String(no);
  const path = `guest_overrides/${docId}`;
  try {
    await setDoc(doc(db, 'guest_overrides', docId), {
      no,
      guest_name: cleanName,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
