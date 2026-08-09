import { auth } from "./firebase";
import { signOut, updatePassword, updateProfile } from "./firebase-mock";

export const logoutUser = async () => {
  await signOut(auth);
};

export const changePassword = async (newPassword: string) => {
  if (auth.currentUser) {
    await updatePassword(auth.currentUser, newPassword);
  } else {
    throw new Error("No user signed in");
  }
};

export const updateDisplayName = async (displayName: string) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  } else {
    throw new Error("No user signed in");
  }
};
