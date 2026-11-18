const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCI-iHAFaENnsAOBLX-_dEHE9bOR7qkHeg",
  authDomain: "manajsampeldes-39292.firebaseapp.com",
  projectId: "manajsampeldes-39292",
  storageBucket: "manajsampeldes-39292.firebasestorage.app",
  messagingSenderId: "848021001600",
  appId: "1:848021001600:web:80cd73e77efaaa0b689d65",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

getDoc(doc(db, 'counters', 'visitors'))
  .then(s => {
    console.log('Doc exists?', s.exists(), 'data:', s.data());
    process.exit(0);
  })
  .catch(e => {
    console.error('Error fetching doc:', e.message);
    process.exit(1);
  });
