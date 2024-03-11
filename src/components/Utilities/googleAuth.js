import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./../../../firebaseConfig";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error(error);
  }
};

export const signUpWithEmailPassword = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(userCredential.user);
  } catch (error) {
    console.error(error);
  }
};

export const signInWithEmailPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(userCredential.user);
  } catch (error) {
    console.error(error);
  }
};

export const signOutUser = async (callback) => {
  try {
    await signOut(auth);
    if (callback) callback();
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
