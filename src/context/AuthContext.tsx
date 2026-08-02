import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  auth,
  subscribeAuthState,
  loginWithFirebase,
  registerWithFirebase,
  logoutFirebase,
  getUserProfile,
  setUserProfile,
  updateUserProfile as updateFirestoreUserProfile,
  getAllUsersFromFirestore,
  SUPER_ADMIN_EMAIL
} from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export interface MockConfirmationResult {
  confirm: (otpCode: string) => Promise<void>;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  hasAdmin: boolean | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerCustomer: (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
    photoURL?: string;
  }) => Promise<void>;
  registerShopOwner: (data: {
    ownerName: string;
    shopName: string;
    email: string;
    phone: string;
    pass: string;
    city: string;
    address: string;
    description: string;
    logoUrl?: string;
    coverUrl?: string;
  }) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  registerFirstAdmin: (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
  }) => Promise<void>;
  performFactoryReset: () => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<MockConfirmationResult>;
  confirmPhoneOtp: (confirmationResult: MockConfirmationResult, otpCode: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkAdminPresence: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  const checkAdminPresence = async (): Promise<boolean> => {
    try {
      const users = await getAllUsersFromFirestore();
      const adminExists = users.some((u) => u.role === 'admin' && u.status !== 'suspended');
      setHasAdmin(adminExists);
      return adminExists;
    } catch {
      return false;
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        try {
          // Fetch user profile from Firestore users/{uid}
          let profile = await getUserProfile(fbUser.uid);

          if (!profile) {
            // Auto create profile in Firestore if missing
            const cleanEmail = (fbUser.email || '').toLowerCase().trim();
            const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL;
            profile = {
              uid: fbUser.uid,
              email: cleanEmail,
              displayName: fbUser.displayName || (isSuperAdmin ? 'مالك المنصة الرئيسي (برهام)' : cleanEmail.split('@')[0] || 'مستخدم المنصة'),
              phoneNumber: fbUser.phoneNumber || '',
              role: isSuperAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString(),
              status: 'active'
            };
            await setUserProfile(profile);
          }

          setCurrentUser(profile);
          setUserProfile(profile);
          setActiveRole(profile.role);
          if (profile.role === 'admin') {
            setHasAdmin(true);
          }
        } catch (err) {
          console.error('Error fetching/creating Firestore user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setActiveRole('customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    try {
      const { profile } = await loginWithFirebase(email, pass);
      setCurrentUser(profile);
      setUserProfile(profile);
      setActiveRole(profile.role);
      if (profile.role === 'admin') {
        setHasAdmin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerCustomer = async (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
    photoURL?: string;
  }): Promise<void> => {
    setLoading(true);
    try {
      const profile = await registerWithFirebase(
        data.email,
        data.pass,
        data.name,
        'customer',
        data.phone
      );
      if (data.photoURL) {
        await updateFirestoreUserProfile(profile.uid, { photoURL: data.photoURL });
        profile.photoURL = data.photoURL;
      }
      setCurrentUser(profile);
      setUserProfile(profile);
      setActiveRole('customer');
    } finally {
      setLoading(false);
    }
  };

  const registerShopOwner = async (data: {
    ownerName: string;
    shopName: string;
    email: string;
    phone: string;
    pass: string;
    city: string;
    address: string;
    description: string;
    logoUrl?: string;
    coverUrl?: string;
  }): Promise<void> => {
    setLoading(true);
    try {
      const generatedShopId = `shop_${Date.now()}`;
      const profile = await registerWithFirebase(
        data.email,
        data.pass,
        data.ownerName,
        'owner',
        data.phone,
        generatedShopId
      );
      setCurrentUser(profile);
      setUserProfile(profile);
      setActiveRole('owner');
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole
  ): Promise<void> => {
    setLoading(true);
    try {
      const profile = await registerWithFirebase(email, pass, name, role);
      setCurrentUser(profile);
      setUserProfile(profile);
      setActiveRole(role);
      if (role === 'admin') {
        setHasAdmin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerFirstAdmin = async (data: {
    email: string;
    pass: string;
    name: string;
    phone: string;
  }): Promise<void> => {
    setLoading(true);
    try {
      const profile = await registerWithFirebase(
        data.email,
        data.pass,
        data.name,
        'admin',
        data.phone
      );
      setCurrentUser(profile);
      setUserProfile(profile);
      setActiveRole('admin');
      setHasAdmin(true);
    } finally {
      setLoading(false);
    }
  };

  const performFactoryReset = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutFirebase();
      setCurrentUser(null);
      setUserProfile(null);
      setHasAdmin(false);
      setActiveRole('customer');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (_role: UserRole = 'customer'): Promise<void> => {
    throw new Error('يرجى استخدام البريد الإلكتروني وكلمة المرور لتسجيل الدخول.');
  };

  const sendPhoneOtp = async (
    _phoneNumber: string,
    _recaptchaContainerId: string
  ): Promise<MockConfirmationResult> => {
    throw new Error('يرجى تسجيل الدخول بواسطة البريد الإلكتروني وكلمة المرور.');
  };

  const confirmPhoneOtp = async (
    _confirmationResult: MockConfirmationResult,
    _otpCode: string,
    _role?: UserRole
  ): Promise<void> => {
    throw new Error('غير مدعوم.');
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutFirebase();
      setCurrentUser(null);
      setUserProfile(null);
      setActiveRole('customer');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!email) return;
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (currentUser) {
      await updateFirestoreUserProfile(currentUser.uid, updates);
      const updated = { ...currentUser, ...updates };
      setCurrentUser(updated);
      setUserProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        hasAdmin,
        activeRole,
        setActiveRole,
        loginWithEmail,
        registerCustomer,
        registerShopOwner,
        registerWithEmail,
        registerFirstAdmin,
        performFactoryReset,
        loginWithGoogle,
        sendPhoneOtp,
        confirmPhoneOtp,
        logout,
        resetPassword,
        updateUserProfile,
        checkAdminPresence
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
