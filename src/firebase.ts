import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwFr59sei266mg4Y1uPz7qjK03P40bP5k",
  authDomain: "routine-9423a.firebaseapp.com",
  projectId: "routine-9423a",
  storageBucket: "routine-9423a.firebasestorage.app",
  messagingSenderId: "739308956330",
  appId: "1:739308956330:web:3201bf116a7d9e50007ed3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, getDocs, query, orderBy, limit };
