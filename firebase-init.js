/* ==========================================
   FIREBASE WEB APP INITIALIZATION
   ========================================== */

(function initializeFirebaseApp() {
  const firebaseConfig = {
    apiKey: "AIzaSyCk0kmu19IpNVk4qyIeasZ7-nGEkYhxKks",
    authDomain: "pub-manager-7d709.firebaseapp.com",
    projectId: "pub-manager-7d709",
    storageBucket: "pub-manager-7d709.firebasestorage.app",
    messagingSenderId: "694181736281",
    appId: "1:694181736281:web:b1cf3927bc7f0a3550e648",
    measurementId: "G-NKP29W051L"
  };

  if (!window.firebase) {
    throw new Error('Firebase SDK failed to load before firebase-init.js');
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }
})();
