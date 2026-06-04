import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_748BgcRPqJsKVvZzsZRGewr8_454kCo",
  authDomain: "exalt-exchange.firebaseapp.com",
  projectId: "exalt-exchange",
  storageBucket: "exalt-exchange.firebasestorage.app",
  messagingSenderId: "356906556266",
  appId: "1:356906556266:web:d8ac2485d122d11fa7a313",
  measurementId: "G-LCP5N50RQW"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);