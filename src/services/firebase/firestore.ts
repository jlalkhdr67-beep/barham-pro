import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config';
import { UserProfile, Shop, MaintenanceTicket, Product, Invoice, ShopRequest, Warranty, Offer, Staff, AppNotification } from '../../types';

// USERS COLLECTION: users/{uid}
export const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, profile.uid);
    // User requested document structure: uid, name, email, role, createdAt + profile details
    const userData = {
      uid: profile.uid,
      name: profile.displayName || '',
      displayName: profile.displayName || '',
      email: profile.email,
      role: profile.role || 'customer',
      createdAt: profile.createdAt || new Date().toISOString(),
      phoneNumber: profile.phoneNumber || '',
      photoURL: profile.photoURL || '',
      shopId: profile.shopId || '',
      status: profile.status || 'active',
      updatedAt: new Date().toISOString()
    };
    await setDoc(userDocRef, userData, { merge: true });
  } catch (error) {
    console.error('Error setting user profile in Firestore:', error);
    throw error;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const updateData: Record<string, any> = { ...updates, updatedAt: new Date().toISOString() };
    if (updates.displayName) {
      updateData.name = updates.displayName;
    }
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.error('Error updating user profile in Firestore:', error);
    throw error;
  }
}

export async function getAllUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching all users from Firestore:', error);
    return [];
  }
}

// SHOPS COLLECTION: shops/{shopId}
export const SHOPS_COLLECTION = 'shops';

export async function getAllShopsFromFirestore(): Promise<Shop[]> {
  try {
    const snap = await getDocs(collection(db, SHOPS_COLLECTION));
    return snap.docs.map(d => d.data() as Shop);
  } catch (error) {
    console.error('Error fetching shops from Firestore:', error);
    return [];
  }
}

export async function setShopInFirestore(shop: Shop): Promise<void> {
  try {
    const ref = doc(db, SHOPS_COLLECTION, shop.id);
    await setDoc(ref, shop, { merge: true });
  } catch (error) {
    console.error('Error saving shop to Firestore:', error);
    throw error;
  }
}

// TICKETS COLLECTION: tickets/{ticketId}
export const TICKETS_COLLECTION = 'tickets';

export async function getAllTicketsFromFirestore(): Promise<MaintenanceTicket[]> {
  try {
    const snap = await getDocs(collection(db, TICKETS_COLLECTION));
    return snap.docs.map(d => d.data() as MaintenanceTicket);
  } catch (error) {
    console.error('Error fetching tickets from Firestore:', error);
    return [];
  }
}

export async function setTicketInFirestore(ticket: MaintenanceTicket): Promise<void> {
  try {
    const ref = doc(db, TICKETS_COLLECTION, ticket.id);
    await setDoc(ref, ticket, { merge: true });
  } catch (error) {
    console.error('Error saving ticket to Firestore:', error);
    throw error;
  }
}

// PRODUCTS COLLECTION: products/{productId}
export const PRODUCTS_COLLECTION = 'products';

export async function getAllProductsFromFirestore(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return snap.docs.map(d => d.data() as Product);
  } catch (error) {
    console.error('Error fetching products from Firestore:', error);
    return [];
  }
}

export async function setProductInFirestore(product: Product): Promise<void> {
  try {
    const ref = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(ref, product, { merge: true });
  } catch (error) {
    console.error('Error saving product to Firestore:', error);
    throw error;
  }
}

// INVOICES COLLECTION: invoices/{invoiceId}
export const INVOICES_COLLECTION = 'invoices';

export async function getAllInvoicesFromFirestore(): Promise<Invoice[]> {
  try {
    const snap = await getDocs(collection(db, INVOICES_COLLECTION));
    return snap.docs.map(d => d.data() as Invoice);
  } catch (error) {
    console.error('Error fetching invoices from Firestore:', error);
    return [];
  }
}

export async function setInvoiceInFirestore(invoice: Invoice): Promise<void> {
  try {
    const ref = doc(db, INVOICES_COLLECTION, invoice.id);
    await setDoc(ref, invoice, { merge: true });
  } catch (error) {
    console.error('Error saving invoice to Firestore:', error);
    throw error;
  }
}
