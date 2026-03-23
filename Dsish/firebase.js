import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANfc6lFeOo0iPOtkurHiUkB9tkUo_2c6I",
  authDomain: "practice-51cc4.firebaseapp.com",
  projectId: "practice-51cc4",
  storageBucket: "practice-51cc4.firebasestorage.app",
  messagingSenderId: "348353566802",
  appId: "1:348353566802:web:93873c1b5412e3adb7e78b",
  measurementId: "G-CRN1T6BSZ5"
};

// ================= INITIALIZE =================
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// ================= EXPORTS =================
export { app, auth, db };

// 🔥 Re-export Firestore helpers
export {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
};






