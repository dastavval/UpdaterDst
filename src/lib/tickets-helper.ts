import { db, collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc } from "./data-layer";
import { ResilientVault } from "./resilient-storage";

export interface TicketMessage {
  id: string;
  sender: "user" | "admin";
  senderName: string;
  text: string;
  createdAt: string;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  trackingCode: string;
  userId?: string;
  userName: string;
  userPhone: string;
  userCompany?: string;
  userRole?: string;
  category: string;
  subject: string;
  status: "open" | "in_progress" | "answered" | "closed";
  priority: "normal" | "high" | "urgent";
  productContext?: {
    productId: string;
    productName: string;
    brand?: string;
  };
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

const STORAGE_KEY = "dastavval_support_tickets_v2";

// Clean initial state with no fake tickets
const DEFAULT_TICKETS: SupportTicket[] = [];

// Helper to filter out legacy dummy demo tickets
function filterOutMockTickets(list: SupportTicket[]): SupportTicket[] {
  return list.filter(t => 
    t.id !== "TCK-84920" && 
    t.id !== "TCK-84921" && 
    t.trackingCode !== "TCK-84920" && 
    t.trackingCode !== "TCK-84921" &&
    t.userName !== "حاج رضا کریمی" &&
    t.userName !== "مهندس صابری"
  );
}

export async function fetchAllTickets(): Promise<SupportTicket[]> {
  try {
    // 1. Check Firestore
    const snap = await getDocs(collection(db, "tickets"));
    if (snap && snap.docs.length > 0) {
      const rawTickets: SupportTicket[] = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          trackingCode: data.trackingCode || d.id.substring(0, 8).toUpperCase(),
          userName: data.userName || data.name || "کاربر ناشناس",
          userPhone: data.userPhone || data.phone || "",
          userCompany: data.userCompany || data.company || "",
          userRole: data.userRole || "customer",
          category: data.category || "عمومی",
          subject: data.subject || data.details || "درخواست پشتیبانی",
          status: data.status || "open",
          priority: data.priority || "normal",
          productContext: data.productContext,
          messages: Array.isArray(data.messages) ? data.messages : [
            {
              id: "msg-initial",
              sender: "user" as const,
              senderName: data.userName || data.name || "کاربر",
              text: data.message || data.details || "متن پیام اولیه",
              createdAt: data.createdAt || new Date().toLocaleDateString("fa-IR"),
              timestamp: Date.now()
            }
          ],
          createdAt: data.createdAt || new Date().toLocaleDateString("fa-IR"),
          updatedAt: data.updatedAt || new Date().toLocaleDateString("fa-IR"),
          adminNotes: data.adminNotes || ""
        };
      });

      const tickets = filterOutMockTickets(rawTickets);
      // Save locally
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
      return tickets;
    }
  } catch (err) {
    console.warn("Could not read tickets from Firestore, falling back to local vault:", err);
  }

  // 2. Local fallback
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        const cleaned = filterOutMockTickets(parsed);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKETS));
  return DEFAULT_TICKETS;
}

export async function createNewTicket(
  ticketData: {
    userName: string;
    userPhone: string;
    userCompany?: string;
    userRole?: string;
    category: string;
    subject: string;
    initialMessage: string;
    priority?: "normal" | "high" | "urgent";
    productContext?: {
      productId: string;
      productName: string;
      brand?: string;
    };
  }
): Promise<SupportTicket> {
  const dateStr = new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const trackingCode = `TCK-${randomNum}`;

  const newTicket: SupportTicket = {
    id: trackingCode,
    trackingCode,
    userName: ticketData.userName,
    userPhone: ticketData.userPhone,
    userCompany: ticketData.userCompany || "",
    userRole: ticketData.userRole || "customer",
    category: ticketData.category || "استعلام عمومی و پشتیبانی",
    subject: ticketData.subject || "درخواست پشتیبانی",
    status: "open",
    priority: ticketData.priority || "normal",
    productContext: ticketData.productContext,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "user",
        senderName: ticketData.userName,
        text: ticketData.initialMessage,
        createdAt: dateStr,
        timestamp: Date.now()
      }
    ],
    createdAt: dateStr,
    updatedAt: dateStr
  };

  // 1. Save in Firestore if available
  try {
    await setDoc(doc(db, "tickets", trackingCode), newTicket);
  } catch (err) {
    console.warn("Error saving ticket to Firestore, saving to local vault:", err);
  }

  // 2. Save locally
  try {
    const current = await fetchAllTickets();
    const updated = [newTicket, ...current.filter(t => t.id !== trackingCode)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dastavval-tickets-updated", { detail: updated }));
  } catch (e) {}

  return newTicket;
}

export async function addMessageToTicket(
  ticketId: string,
  text: string,
  sender: "user" | "admin",
  senderName: string
): Promise<SupportTicket | null> {
  const dateStr = new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  const current = await fetchAllTickets();
  const ticket = current.find(t => t.id === ticketId || t.trackingCode === ticketId);

  if (!ticket) return null;

  const newMessage: TicketMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    text,
    createdAt: dateStr,
    timestamp: Date.now()
  };

  const updatedTicket: SupportTicket = {
    ...ticket,
    status: sender === "admin" ? "answered" : "open",
    updatedAt: dateStr,
    messages: [...ticket.messages, newMessage]
  };

  // Firestore update
  try {
    await setDoc(doc(db, "tickets", ticketId), updatedTicket);
  } catch (err) {
    console.warn("Error updating ticket in Firestore:", err);
  }

  // Local update
  const updatedList = current.map(t => (t.id === ticketId ? updatedTicket : t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent("dastavval-tickets-updated", { detail: updatedList }));

  return updatedTicket;
}

export async function updateTicketStatusInStore(
  ticketId: string,
  status: SupportTicket["status"],
  adminNotes?: string
): Promise<void> {
  const current = await fetchAllTickets();
  const ticket = current.find(t => t.id === ticketId);
  if (!ticket) return;

  const updatedTicket: SupportTicket = {
    ...ticket,
    status,
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    updatedAt: new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
  };

  try {
    await setDoc(doc(db, "tickets", ticketId), updatedTicket);
  } catch (err) {
    console.warn("Error updating ticket status in Firestore:", err);
  }

  const updatedList = current.map(t => (t.id === ticketId ? updatedTicket : t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent("dastavval-tickets-updated", { detail: updatedList }));
}

export async function deleteTicketFromStore(ticketId: string): Promise<void> {
  const current = await fetchAllTickets();
  const updatedList = current.filter(t => t.id !== ticketId && t.trackingCode !== ticketId);
  
  try {
    await deleteDoc(doc(db, "tickets", ticketId));
  } catch (err) {
    console.warn("Error deleting ticket in Firestore:", err);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent("dastavval-tickets-updated", { detail: updatedList }));
}

