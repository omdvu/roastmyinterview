// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "roastmyinterview.firebaseapp.com",
  projectId: "roastmyinterview",
  storageBucket: "roastmyinterview.firebasestorage.app",
  messagingSenderId: "368039672918",
  appId: "1:368039672918:web:1d11f8e4502760c3804ff7",
  measurementId: "G-VK7K6JHSLQ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth=getAuth(app)
const provider=new GoogleAuthProvider()

export {auth,provider}