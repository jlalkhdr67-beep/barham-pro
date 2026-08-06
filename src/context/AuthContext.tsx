import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserProfile, UserRole, Shop } from '../types';
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
  setShopInFirestore,
  setShopRequestInFirestore,
  SUPER_ADMIN_EMAIL
} from '../services/firebase';
import { MockDataService } from '../services/MockDataService';
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
    category?: string;
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
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const pendingRoleRef = useRef<UserRole | null>(null);

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

          // Retry delay if profile creation in registerWithFirebase is still writing
          if (!profile) {
            await new Promise((res) => setTimeout(res, 400));
            profile = await getUserProfile(fbUser.uid);
          }

          // Check MockDataService
          if (!profile) {
            const mockUser = MockDataService.getUserById(fbUser.uid);
            if (mockUser) {
              profile = mockUser;
            }
          }

          if (!profile) {
            // Auto create profile in Firestore if missing
            const cleanEmail = (fbUser.email || '').toLowerCase().trim();
            const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL;
            const isOwnerRequest = MockDataService.getShopRequests().some(
              (r) => r.ownerId === fbUser.uid || r.email?.toLowerCase().trim() === cleanEmail
            ) || MockDataService.getShops().some(
              (s) => s.ownerId === fbUser.uid
            );
            const targetRole: UserRole = isSuperAdmin ? 'admin' : (pendingRoleRef.current || (isOwnerRequest ? 'owner' : 'customer'));
            const initialStatus: 'pending' | 'active' = (targetRole === 'owner' && !isSuperAdmin) ? 'pending' : 'active';
            profile = {
              uid: fbUser.uid,
              email: cleanEmail,
              displayName: fbUser.displayName || (isSuperAdmin ? 'مالك المنصة الرئيسي (برهم)' : cleanEmail.split('@')[0] || 'مستخدم المنصة'),
              phoneNumber: fbUser.phoneNumber || '',
              role: targetRole,
              createdAt: new Date().toISOString(),
              status: initialStatus
            };
            await setUserProfile(profile);
            MockDataService.addUser(profile);
          }

          setCurrentUser(profile);
          setUserProfileState(profile);
          setActiveRole(profile.role);
          if (profile.role === 'admin') {
            setHasAdmin(true);
          }
        } catch (err) {
          console.error('Error fetching/creating Firestore user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfileState(null);
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
      if (profile.email === SUPER_ADMIN_EMAIL) {
        localStorage.setItem('super_admin_session', 'true');
      } else {
        localStorage.removeItem('super_admin_session');
      }
      setCurrentUser(profile);
      setUserProfileState(profile);
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
    pendingRoleRef.current = 'customer';
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
      setUserProfileState(profile);
      setActiveRole('customer');
    } finally {
      pendingRoleRef.current = null;
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
    category?: string;
    logoUrl?: string;
    coverUrl?: string;
  }): Promise<void> => {
    setLoading(true);
    pendingRoleRef.current = 'owner';
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

      profile.status = 'pending';
      profile.shopId = generatedShopId;
      await updateFirestoreUserProfile(profile.uid, { status: 'pending', shopId: generatedShopId });
      MockDataService.updateUser(profile.uid, { status: 'pending', shopId: generatedShopId });

      // DO NOT create a Shop record yet. Only create ShopRequest and pending UserProfile.
      // The Shop will be created in Firestore/shops ONLY after the Super Admin approves the request.
      const reqObj = {
        id: `req_${Date.now()}`,
        shopName: data.shopName,
        ownerName: data.ownerName,
        phone: data.phone,
        email: data.email,
        city: data.city,
        address: data.address,
        description: data.description,
        category: data.category || 'هواتف',
        logoUrl: data.logoUrl,
        ownerId: profile.uid,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      MockDataService.addShopRequest(reqObj);

      try {
        await setShopRequestInFirestore(reqObj);
        console.log('[Register Owner Success] Saved shopRequest to Firestore (awaiting Super Admin approval)');
      } catch (e) {
        console.warn('Firestore setShopRequest error:', e);
      }

      setCurrentUser(profile);
      setUserProfileState(profile);
      setActiveRole('owner');
    } finally {
      pendingRoleRef.current = null;
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
    pendingRoleRef.current = role;
    try {
      const profile = await registerWithFirebase(email, pass, name, role);
      setCurrentUser(profile);
      setUserProfileState(profile);
      setActiveRole(role);
      if (role === 'admin') {
        setHasAdmin(true);
      }
    } finally {
      pendingRoleRef.current = null;
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
    pendingRoleRef.current = 'admin';
    try {
      const profile = await registerWithFirebase(
        data.email,
        data.pass,
        data.name,
        'admin',
        data.phone
      );
      setCurrentUser(profile);
      setUserProfileState(profile);
      setActiveRole('admin');
      setHasAdmin(true);
    } finally {
      pendingRoleRef.current = null;
      setLoading(false);
    }
  };

  const performFactoryReset = async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutFirebase();
      setCurrentUser(null);
      setUserProfileState(null);
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
      localStorage.removeItem('super_admin_session');
      await logoutFirebase();
      setCurrentUser(null);
      setUserProfileState(null);
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
      setUserProfileState(updated);
      if (updates.role) {
        setActiveRole(updates.role);
      }
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
