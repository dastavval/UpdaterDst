import { collection, addDoc, getDocs, db, serverTimestamp } from "./data-layer";

export interface SystemLog {
  id: string;
  category: "product" | "factory" | "ad" | "safebuy" | "barter" | "callback" | "user" | "order" | "system" | "approval";
  action: string; // e.g., "create", "update", "delete", "approve", "reject", "login"
  title: string;  // e.g., "ثبت محصول جدید"
  details: string; // e.g., "محصول روغن آفتابگردان ۱۰ لیتری توسط کارخانه بهروز اضافه شد"
  userPhone?: string; // Who triggered it
  userName?: string;
  ip?: string;
  timestamp: any; // Date ISO string or Server Timestamp
}

export async function addSystemLog(log: Omit<SystemLog, "id" | "timestamp">): Promise<string> {
  const newLog: Omit<SystemLog, "id"> = {
    ...log,
    timestamp: new Date().toISOString()
  };

  let newId = `log-${Date.now()}`;
  try {
    const docRef = await addDoc(collection(db, "system_logs"), {
      ...newLog,
      timestamp: serverTimestamp()
    });
    newId = docRef.id;
  } catch (error) {
    console.error("Error saving system log to Firestore, saving locally:", error);
  }

  // Also sync to local storage cache to guarantee persistence
  try {
    const saved = localStorage.getItem("dastavval_system_logs");
    const currentList: SystemLog[] = saved ? JSON.parse(saved) : [];
    currentList.unshift({ id: newId, ...newLog, timestamp: new Date().toISOString() });
    
    // Cap at 1000 logs locally
    if (currentList.length > 1000) {
      currentList.length = 1000;
    }
    localStorage.setItem("dastavval_system_logs", JSON.stringify(currentList));
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent("dastavval_system_log_added"));
  } catch (e) {
    console.error("Error updating local system logs cache:", e);
  }

  // Optionally send logs to backend for audit
  try {
    fetch("/api/v1/dev/system-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newLog, id: newId })
    }).catch(err => console.warn("Log reporting warning:", err));
  } catch (err) {}

  return newId;
}

export async function fetchSystemLogs(): Promise<SystemLog[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "system_logs"));
    if (!querySnapshot.empty) {
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];

      // Sort by timestamp descending
      fetched.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      localStorage.setItem("dastavval_system_logs", JSON.stringify(fetched));
      return fetched;
    }
  } catch (error) {
    console.warn("Firestore logs fetch failed, falling back to localStorage:", error);
  }

  const saved = localStorage.getItem("dastavval_system_logs");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return parsed;
    } catch (e) {
      console.error("Error parsing system logs:", e);
    }
  }

  return [];
}
