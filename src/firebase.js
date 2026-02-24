// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCV6HqErlgqHSjgZ0N1zEzxq6ydaTvqMQ4",
  projectId: "nichegometr",
  authDomain: "nichegometr.firebaseapp.com",
  storageBucket: "nichegometr.appspot.com",
  messagingSenderId: "697221676191",
  appId: "1:697221676191:web:09055354c2d8d3a12236aa",
  measurementId: "G-LYN482JF03"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firebase функции для App.jsx
export { collection, getDocs, setDoc, doc, query, orderBy, limit, createUserWithEmailAndPassword, signInWithEmailAndPassword };