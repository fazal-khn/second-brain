import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByPk8Nme4lYPwgQwFLxmWVItsLrfTxTC4",
  authDomain: "second-brain-doc-analyzer.firebaseapp.com",
  projectId: "second-brain-doc-analyzer",
  storageBucket: "second-brain-doc-analyzer.firebasestorage.app",
  messagingSenderId: "692959184464",
  appId: "1:692959184464:web:29324a43b5755329d43355"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
