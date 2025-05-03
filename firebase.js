// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAo5ObSGTPOznj_njzCA6JcE0GGxFIkruY",
  authDomain: "extension-9f7f8.firebaseapp.com",
  projectId: "extension-9f7f8",
  storageBucket: "extension-9f7f8.appspot.com",
  messagingSenderId: "925964859967",
  appId: "1:925964859967:web:b3275e4c4cf5b4134d568a",
  measurementId: "G-PJFBSHPF3P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
