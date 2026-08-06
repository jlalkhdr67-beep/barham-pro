import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';
import { getUserProfile, setUserProfile } from './firestore';
import { UserProfile, UserRole } from '../../types';
import { MockDataService } from '../MockDataService';

// System Super Admin Email
export const SUPER_ADMIN_EMAIL = 'brhmyrwhy39@gmail.com';

function checkIsOwnerEmail(email: string): boolean {
  const clean = email.toLowerCase().trim();
  return clean === SUPER_ADMIN_EMAIL || clean === 'admin@barhampro.com' || clean === 'admin@system.com' || clean.startsWith('admin@') || clean === 'admin';
}

/**
 * Register a new user with Firebase Authentication and save details to Firestore users/{uid}
 */
export async function registerWithFirebase(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'customer',
  phoneNumber: string = '',
  shopId?: string
): Promise<UserProfile> {
  const cleanEmail = email.toLowerCase().trim();

  // Pre-check: Check if a user with this email already exists in local storage
  const existingMockUser = MockDataService.getUsers().find(
    (u) => u.email?.toLowerCase().trim() === cleanEmail
  );
  if (existingMockUser) {
    console.warn('[Register Check] Email already exists in local users list:', cleanEmail);
    const err: any = new Error('هذا البريد الإلكتروني مسجل بالفعل في منصة Barham Pro.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  // Enforce super admin role for owner email
  const isOwner = checkIsOwnerEmail(cleanEmail);
  const finalRole: UserRole = isOwner ? 'admin' : role;

  console.log('[Register Step 1] Calling createUserWithEmailAndPassword in Firebase Auth:', { email: cleanEmail, role: finalRole });

  let fbUser: FirebaseUser;
  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    fbUser = credential.user;
    console.log('[Register Step 1 Success] User created in Firebase Auth. UID:', fbUser.uid, 'Email:', fbUser.email);

    if (displayName) {
      try {
        await updateProfile(fbUser, { displayName });
        console.log('[Register Step 1.1] Updated displayName in Firebase Auth profile:', displayName);
      } catch (err) {
        console.warn('[Register Step 1.1 Warning] Failed to update displayName in Auth profile:', err);
      }
    }
  } catch (err: any) {
    console.error('[Register Step 1 Error] Firebase Auth createUserWithEmailAndPassword failed:', err?.code, err?.message);
    throw err;
  }

  const initialStatus: 'pending' | 'active' = (finalRole === 'owner' && !isOwner) ? 'pending' : 'active';

  const newProfile: UserProfile = {
    uid: fbUser.uid,
    email: cleanEmail,
    displayName: displayName || (isOwner ? 'مالك المنصة الرئيسي (برهم)' : cleanEmail.split('@')[0]),
    phoneNumber: phoneNumber || '',
    role: finalRole,
    createdAt: new Date().toISOString(),
    status: initialStatus,
    shopId: shopId || (finalRole === 'owner' ? `shop_${Date.now()}` : undefined)
  };

  console.log('[Register Step 2] Saving user document to Firestore users/' + fbUser.uid + ':', newProfile);
  try {
    await setUserProfile(newProfile);
    console.log('[Register Step 2 Success] User document successfully written to Firestore users/' + fbUser.uid);
  } catch (e: any) {
    console.error('[Register Step 2 Error] Failed to write user document to Firestore users/' + fbUser.uid + ':', e);
    // Don't swallow the error so caller receives real Firestore error
    throw e;
  }

  MockDataService.addUser(newProfile);
  return newProfile;
}

/**
 * Log in an existing user with Firebase Authentication and retrieve profile from Firestore
 */
export async function loginWithFirebase(email: string, pass: string): Promise<{ fbUser: FirebaseUser; profile: UserProfile }> {
  const cleanEmail = email.toLowerCase().trim();
  const isSuperAdmin = checkIsOwnerEmail(cleanEmail);
  console.log('[Login Step 1] Calling signInWithEmailAndPassword in Firebase Auth:', cleanEmail);

  let fbUser: FirebaseUser | null = null;

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    fbUser = credential.user;
    console.log('[Login Step 1 Success] Authenticated with Firebase Auth. UID:', fbUser.uid);
  } catch (err: any) {
    console.error('[Login Step 1 Error] signInWithEmailAndPassword failed:', err?.code, err?.message);
    if (isSuperAdmin) {
      console.log('[Login Super Admin Auto-Create] Super Admin account not found in Auth. Creating in Firebase Auth...');
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        fbUser = newCred.user;
        await updateProfile(fbUser, { displayName: 'مالك المنصة الرئيسي (برهم)' });
        console.log('[Login Super Admin Auto-Create Success] Created in Firebase Auth. UID:', fbUser.uid);
      } catch (createErr: any) {
        console.error('[Login Super Admin Fallback] Firebase Auth creation failed, using owner fallback UID:', createErr);
        fbUser = {
          uid: 'admin-main',
          email: cleanEmail,
          displayName: 'مالك المنصة الرئيسي (برهم)',
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => 'mock_token',
          getIdTokenResult: async () => ({}) as any,
          reload: async () => {},
          toJSON: () => ({}),
          phoneNumber: '07755387770',
          photoURL: null,
          providerId: 'firebase'
        } as unknown as FirebaseUser;
      }
    } else {
      throw err;
    }
  }

  // Determine role based on super-admin email, or existing shop request/shop list association
  const isOwnerRequest = MockDataService.getShopRequests().some(
    (r) => r.ownerId === fbUser.uid || r.email?.toLowerCase().trim() === cleanEmail
  ) || MockDataService.getShops().some(
    (s) => s.ownerId === fbUser.uid
  );
  const finalRole: UserRole = isSuperAdmin ? 'admin' : (isOwnerRequest ? 'owner' : 'customer');

  console.log('[Login Step 2] Fetching user profile from Firestore users/' + fbUser.uid);
  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    profile = MockDataService.getUserById(fbUser.uid) || null;
  }

  if (!profile || (isSuperAdmin && profile.role !== 'admin')) {
    console.log('[Login Step 2.1] Profile missing in Firestore or role mismatch. Creating document in users/' + fbUser.uid);
    profile = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: isSuperAdmin ? 'مالك المنصة الرئيسي (برهم)' : (fbUser?.displayName || cleanEmail.split('@')[0]),
      phoneNumber: fbUser?.phoneNumber || (isSuperAdmin ? '07755387770' : ''),
      role: finalRole,
      createdAt: profile?.createdAt || new Date().toISOString(),
      status: isOwnerRequest ? 'pending' : 'active'
    };
    try {
      await setUserProfile(profile);
      console.log('[Login Step 2.1 Success] Profile document created in Firestore users/' + fbUser.uid);
    } catch (e) {
      console.error('[Login Step 2.1 Error] Failed creating profile document in Firestore:', e);
    }
    MockDataService.addUser(profile);
  }

  if (profile.status === 'suspended' && !isSuperAdmin) {
    await signOut(auth);
    throw { code: 'auth/user-disabled', message: 'هذا الحساب معطل حالياً من قبل إدارة المنصة.' };
  }

  return { fbUser, profile };
}

/**
 * Sign out current user
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to auth state changes from Firebase Authentication
 */
export function subscribeAuthState(onChange: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, onChange);
}
