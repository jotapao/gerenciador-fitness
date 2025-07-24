      // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCJsj49Y2HJOG72Sm_Q5fJQT3mSr26tEzg",
  authDomain: "gestor-fitness-app.firebaseapp.com",
  projectId: "gestor-fitness-app",
  storageBucket: "gestor-fitness-app.firebasestorage.app",
  messagingSenderId: "435273942891",
  appId: "1:435273942891:web:a378cbc597804a3518ae2e",
  measurementId: "G-8T24LJ8G33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = ge
nalytics(app);