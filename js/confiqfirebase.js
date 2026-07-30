// QC DASHBORD/js/firebaseConfig.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi General Firebase Milikmu
const firebaseConfig = {
  apiKey: "AIzaSyBAz-MvIPiv4tZliNQ6iZL9NMpTV5upAiM",
  authDomain: "engineering-system-93af1.firebaseapp.com",
  projectId: "engineering-system-93af1",
  storageBucket: "engineering-system-93af1.firebasestorage.app",
  messagingSenderId: "1066633617612",
  appId: "1:1066633617612:web:6b4915f61dc8dc99ada269",
  measurementId: "G-6YGGTRD1S5"
};

// Inisialisasi Firebase & Firestore Database
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export modul Firestore agar siap di-import oleh menu apa pun
export { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy };