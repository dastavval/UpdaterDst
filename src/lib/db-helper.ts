import { collection, getDocs, addDoc, serverTimestamp } from "./firebase-mock";
import { db } from "./firebase";
import { Product, NewsArticle, FactoryProfile } from "../types";

export const INITIAL_NEWS: NewsArticle[] = [];

export const INITIAL_FACTORIES: FactoryProfile[] = [];

export const INITIAL_PRODUCTS: Omit<Product, "id">[] = [];

export const INITIAL_CATEGORIES = [];

export async function seedProductsIfEmpty() {
  try {
    const q = collection(db, "products");
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Seeding products...");
      for (const p of INITIAL_PRODUCTS) {
        await addDoc(collection(db, "products"), {
          ...p,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.warn("Seeding products encountered issue:", err);
  }
}
