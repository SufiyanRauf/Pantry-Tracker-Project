// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlVE2uKJR-tgaOJvRGLOcigqpsX2XV1_A",
  authDomain: "inventory-management-e1fab.firebaseapp.com",
  projectId: "inventory-management-e1fab",
  storageBucket: "inventory-management-e1fab.firebasestorage.app",
  messagingSenderId: "946869194826",
  appId: "1:946869194826:web:7fb3585c7c20afa1c316b3",
  measurementId: "G-M8NMH4Y3XE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)

export {firestore}