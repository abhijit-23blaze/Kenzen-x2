// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCdcEH7BN6A6b-opjCZZxn-kyVM2pnOGoQ",
    authDomain: "kenzen-x1.firebaseapp.com",
    projectId: "kenzen-x1",
    storageBucket: "kenzen-x1.firebasestorage.app",
    messagingSenderId: "460667022191",
    appId: "1:460667022191:web:019ba3eca760d256c1969a",
    measurementId: "G-1KHM9RN7M0"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

