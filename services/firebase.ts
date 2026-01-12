import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  arrayUnion, 
  increment,
  query,
  orderBy,
  Firestore
} from "firebase/firestore";

// --- CẤU HÌNH FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCqq8nXyLHf0y56WE_5s3iNhqKCqJ6AMKk",
  authDomain: "studywithme-a89e3.firebaseapp.com",
  projectId: "studywithme-a89e3",
  storageBucket: "studywithme-a89e3.firebasestorage.app",
  messagingSenderId: "21758943028",
  appId: "1:21758943028:web:15bb5375191c74eb668f61",
  measurementId: "G-F7M3SM9431"
};

let db: Firestore | null = null;
let isConfigured = false;

// Khởi tạo Firebase
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isConfigured = true;
  console.log("🔥 Firebase connected successfully");
} catch (error) {
  console.error("🔥 Firebase initialization error:", error);
}

// Export database instance
export { db, isConfigured };

// Re-export Firestore functions to be used in App.tsx
export { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  arrayUnion, 
  increment, 
  query, 
  orderBy 
};