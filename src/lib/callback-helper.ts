import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "./firebase-mock";
import { db } from "./firebase";

export interface CallbackRequest {
  id: string;
  phone: string;
  status: 'pending' | 'called' | 'archived';
  notes: string;
  factoryName: string; // If specific to a factory or general
  createdAt: any;
}

export async function fetchCallbackRequests(): Promise<CallbackRequest[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "callback_requests"));
    
    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CallbackRequest[];
      // Sort by createdAt descending (newest first)
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      localStorage.setItem("dastavval_callback_requests", JSON.stringify(fetched));
      return fetched;
    }
  } catch (error) {
    console.warn("Firestore callback fetch failed, falling back to localStorage:", error);
  }

  // Local storage fallback
  const saved = localStorage.getItem("dastavval_callback_requests");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return parsed;
    } catch (e) {
      console.error("Error parsing saved callback requests:", e);
    }
  }

  return [];
}

export async function addCallbackRequest(phone: string, factoryName: string = "مشاوره عمومی (صفحه اصلی)"): Promise<string> {
  const newRequest: Omit<CallbackRequest, "id"> = {
    phone,
    status: 'pending',
    notes: '',
    factoryName,
    createdAt: new Date().toISOString()
  };

  let newId = `cb-${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, "callback_requests"), {
      ...newRequest,
      createdAt: serverTimestamp()
    });
    newId = docRef.id;
  } catch (error) {
    console.error("Error adding callback request to Firestore, saving locally:", error);
  }

  // Sync to local storage
  try {
    const saved = localStorage.getItem("dastavval_callback_requests");
    const currentList: CallbackRequest[] = saved ? JSON.parse(saved) : [];
    currentList.unshift({ id: newId, ...newRequest });
    localStorage.setItem("dastavval_callback_requests", JSON.stringify(currentList));
    
    // Dispatch a custom event to notify other components (like Admin Panel) to refresh
    window.dispatchEvent(new CustomEvent("dastavval_callback_added"));
  } catch (e) {
    console.error("Error updating local callback cache:", e);
  }

  return newId;
}

export async function updateCallbackStatus(id: string, status: 'pending' | 'called' | 'archived', notes: string = ""): Promise<void> {
  try {
    const docRef = doc(db, "callback_requests", id);
    await updateDoc(docRef, { status, notes });
  } catch (error) {
    console.error("Error updating callback request in Firestore:", error);
  }

  try {
    const saved = localStorage.getItem("dastavval_callback_requests");
    if (saved) {
      let currentList: CallbackRequest[] = JSON.parse(saved);
      currentList = currentList.map(c => c.id === id ? { ...c, status, notes } : c);
      localStorage.setItem("dastavval_callback_requests", JSON.stringify(currentList));
    }
  } catch (e) {
    console.error("Error updating local callback cache:", e);
  }
}

export async function deleteCallbackRequest(id: string): Promise<void> {
  try {
    const docRef = doc(db, "callback_requests", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting callback request from Firestore:", error);
  }

  try {
    const saved = localStorage.getItem("dastavval_callback_requests");
    if (saved) {
      let currentList: CallbackRequest[] = JSON.parse(saved);
      currentList = currentList.filter(c => c.id !== id);
      localStorage.setItem("dastavval_callback_requests", JSON.stringify(currentList));
    }
  } catch (e) {
    console.error("Error deleting callback request from cache:", e);
  }
}
