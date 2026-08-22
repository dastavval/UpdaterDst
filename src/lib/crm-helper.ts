import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from "./data-layer";
import { db } from "./data-layer";

export interface CRMCustomer {
  id: string;
  name: string;
  phone: string;
  company: string;
  establishedYear: number;
  badge: 'bronze' | 'silver' | 'gold' | 'vip';
  totalOrdersCount: number;
  totalPurchaseValue: number;
  city: string;
  status: 'active' | 'pending_verification' | 'suspended' | 'vip_candidate';
  notes: string;
  role?: 'customer' | 'representative' | 'marketer' | 'factory';
  createdAt?: any;
}

const INITIAL_CRM_CUSTOMERS: CRMCustomer[] = [];

export async function fetchCRMCustomers(): Promise<CRMCustomer[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "crm_customers"));
    
    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CRMCustomer[];
      localStorage.setItem("dastavval_crm_customers", JSON.stringify(fetched));
      return fetched;
    }
  } catch (error) {
    console.warn("Firestore CRM fetch failed, falling back to localStorage:", error);
  }

  // Local storage fallback
  const saved = localStorage.getItem("dastavval_crm_customers");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved CRM customers:", e);
    }
  }

  return [];
}

export async function addCRMCustomer(customer: Omit<CRMCustomer, "id">): Promise<string> {
  let newId = `crm-${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, "crm_customers"), {
      ...customer,
      createdAt: serverTimestamp()
    });
    newId = docRef.id;
  } catch (error) {
    console.error("Error adding CRM customer to Firestore, saving locally:", error);
  }

  // Sync to local storage
  try {
    const saved = localStorage.getItem("dastavval_crm_customers");
    const currentList: CRMCustomer[] = saved ? JSON.parse(saved) : [];
    currentList.unshift({ id: newId, ...customer });
    localStorage.setItem("dastavval_crm_customers", JSON.stringify(currentList));
  } catch (e) {
    console.error("Error updating local CRM cache:", e);
  }

  return newId;
}

export async function updateCRMCustomer(id: string, updatedFields: Partial<CRMCustomer>): Promise<void> {
  try {
    const docRef = doc(db, "crm_customers", id);
    await updateDoc(docRef, updatedFields);
  } catch (error) {
    console.error("Error updating CRM customer in Firestore:", error);
  }

  try {
    const saved = localStorage.getItem("dastavval_crm_customers");
    if (saved) {
      let currentList: CRMCustomer[] = JSON.parse(saved);
      currentList = currentList.map(c => c.id === id ? { ...c, ...updatedFields } : c);
      localStorage.setItem("dastavval_crm_customers", JSON.stringify(currentList));
    }
  } catch (e) {
    console.error("Error updating local CRM cache:", e);
  }
}

export async function deleteCRMCustomer(id: string): Promise<void> {
  try {
    const docRef = doc(db, "crm_customers", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting CRM customer from Firestore:", error);
  }

  try {
    const saved = localStorage.getItem("dastavval_crm_customers");
    if (saved) {
      let currentList: CRMCustomer[] = JSON.parse(saved);
      currentList = currentList.filter(c => c.id !== id);
      localStorage.setItem("dastavval_crm_customers", JSON.stringify(currentList));
    }
  } catch (e) {
    console.error("Error updating local CRM cache:", e);
  }
}

/**
 * Automatically links a checkout to CRM.
 * If a customer with the phone exists, updates their totals.
 * If not, inserts them as a new Bronze wholesaler.
 */
export async function recordCRMOrder(buyerName: string, buyerPhone: string, buyerCompany: string, amount: number): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, "crm_customers"));
    let foundDocId: string | null = null;
    let foundCust: CRMCustomer | null = null;

    querySnapshot.forEach(doc => {
      const data = doc.data() as CRMCustomer;
      if (data.phone === buyerPhone) {
        foundDocId = doc.id;
        foundCust = { id: doc.id, ...data };
      }
    });

    if (foundDocId && foundCust) {
      const updatedTotal = (foundCust.totalPurchaseValue || 0) + amount;
      const updatedCount = (foundCust.totalOrdersCount || 0) + 1;
      
      // Auto upgrade badges based on purchase volumes:
      let badge = foundCust.badge;
      if (updatedTotal >= 300000000) badge = 'vip';
      else if (updatedTotal >= 100000000) badge = 'gold';
      else if (updatedTotal >= 40000000) badge = 'silver';

      await updateCRMCustomer(foundDocId, {
        totalPurchaseValue: updatedTotal,
        totalOrdersCount: updatedCount,
        badge,
        status: 'active'
      });
      console.log(`CRM record updated for ${buyerPhone}. Added order of ${amount}.`);
    } else {
      // Create a brand new customer card in the CRM database!
      const newCustomer: Omit<CRMCustomer, "id"> = {
        name: buyerName,
        phone: buyerPhone,
        company: buyerCompany || "فروشگاه عمده پخش حسینی",
        establishedYear: 1405,
        badge: amount >= 100000000 ? 'vip' : amount >= 40000000 ? 'gold' : amount >= 15000000 ? 'silver' : 'bronze',
        totalOrdersCount: 1,
        totalPurchaseValue: amount,
        city: "تهران",
        status: "active",
        notes: "سیستم هوشمند: به صورت خودکار از طریق اولین سفارش پورتال ثبت شد."
      };
      await addCRMCustomer(newCustomer);
      console.log(`New wholesale customer auto-registered in CRM: ${buyerPhone}`);
    }
  } catch (e) {
    console.error("Failed to sync checkout with B2B CRM:", e);
  }
}
