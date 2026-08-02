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

// System Super Admin Email
export const SUPER_ADMIN_EMAIL = 'brhmyrwhy39@gmail.com';

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

  // Enforce super admin role for owner email
  const finalRole: UserRole = cleanEmail === SUPER_ADMIN_EMAIL ? 'admin' : role;

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser = credential.user;

  if (displayName) {
    try {
      await updateProfile(fbUser, { displayName });
    } catch (err) {
      console.warn('Failed to update firebase user auth profile display name:', err);
    }
  }

  const newProfile: UserProfile = {
    uid: fbUser.uid,
    email: cleanEmail,
    displayName: displayName || cleanEmail.split('@')[0],
    phoneNumber: phoneNumber || '',
    role: finalRole,
    createdAt: new Date().toISOString(),
    status: 'active',
    shopId: shopId || (finalRole === 'owner' ? `shop_${Date.now()}` : undefined)
  };

  // Save profile to Firestore collection users/{uid}
  await setUserProfile(newProfile);

  return newProfile;
}

/**
 * Log in an existing user with Firebase Authentication and retrieve profile from Firestore
 */
export async function loginWithFirebase(email: string, pass: string): Promise<{ fbUser: FirebaseUser; profile: UserProfile }> {
  const cleanEmail = email.toLowerCase().trim();

  const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser = credential.user;

  // Retrieve user document from Firestore users/{uid}
  let profile = await getUserProfile(fbUser.uid);

  // If user profile does not exist in Firestore (e.g. system owner), auto-create
  if (!profile) {
    const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL;
    profile = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: fbUser.displayName || (isSuperAdmin ? 'مالك المنصة الرئيسي (برهام)' : cleanEmail.split('@')[0]),
      phoneNumber: fbUser.phoneNumber || '',
      role: isSuperAdmin ? 'admin' : 'customer',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    await setUserProfile(profile);
  }

  if (profile.status === 'suspended') {
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
