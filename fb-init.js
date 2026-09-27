const firebaseConfig = {
  apiKey: "AIzaSyBbV8d7VjImRi5ZQQWdOaM1j-BG6G31pBo",
  authDomain: "amrita-clubs-portal.firebaseapp.com",
  projectId: "amrita-clubs-portal",
  storageBucket: "amrita-clubs-portal.firebasestorage.app",
  messagingSenderId: "869059215334",
  appId: "1:869059215334:web:cc22ae633346c5c98e2027",
  measurementId: "G-3RR14KC6VK"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
