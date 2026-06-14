import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyD5uXXbG0Quhg0Fqbg8K02UpfxAe8oX0hw",
  authDomain: "pedidos-oficina-d34f9.firebaseapp.com",
  projectId: "pedidos-oficina-d34f9",
  storageBucket: "pedidos-oficina-d34f9.firebasestorage.app",
  messagingSenderId: "719565975842",
  appId: "1:719565975842:web:d7cfbcdf1469381977757b"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
