import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDZIHwcKdLcznfiPV7JGzzTH3YpeP09E_o",
  authDomain: "ic-buffet.firebaseapp.com",
  projectId: "ic-buffet",
  storageBucket: "ic-buffet.appspot.com",
  messagingSenderId: "587210480598",
  appId: "1:587210480598:web:0c84fd239fab0784b32277"
}; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };