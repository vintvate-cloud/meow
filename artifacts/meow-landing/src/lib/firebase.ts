import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNJ2NbHERaWqhUWCKcVfB7k1b1aRktOa0",
  authDomain: "meow-4a019.firebaseapp.com",
  projectId: "meow-4a019",
  storageBucket: "meow-4a019.firebasestorage.app",
  messagingSenderId: "991881591577",
  appId: "1:991881591577:web:3719fb349bf3a7582c2388",
  measurementId: "G-Y9DPS2GZJH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
