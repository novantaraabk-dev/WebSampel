const path = require('path');
const { initializeApp } = require(path.resolve('./node_modules/firebase/app'));
const { getFirestore, collection, query, where, getDocs, limit } = require(path.resolve('./node_modules/firebase/firestore'));
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim().replace(/^['"]|['"]$/g, '');
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'pbb_dhkp'), where('nop', '>=', '33.01.070.011.031-0016.0'), limit(2));
  const snap = await getDocs(q);
  snap.forEach(d => {
    console.log('Doc ID:', d.id);
    console.log(JSON.stringify(d.data(), null, 2));
  });
}
check().catch(console.error);
