// Mock Firebase implementation to decouple from Firebase
export const db = {} as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb: any) => cb(null),
} as any;

