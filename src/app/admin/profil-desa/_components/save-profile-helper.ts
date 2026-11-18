import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { ProfilDesaContent } from '@/lib/types';

export async function saveProfileWithHistory({
  firestore,
  tab,
  action,
  summary,
  partialData,
}: {
  firestore: Firestore;
  tab: string;
  action: string;
  summary: string;
  partialData: Partial<ProfilDesaContent>;
}) {
  const profileDocRef = doc(firestore, 'villageProfile', 'default');
  
  // 1. Fetch current document to create complete snapshot
  let currentDocData: Record<string, any> = {};
  try {
    const snap = await getDoc(profileDocRef);
    if (snap.exists()) {
      currentDocData = snap.data();
    }
  } catch (err) {
    console.warn('Could not read previous profile document for snapshot', err);
  }

  // 2. Prepare combined updated data
  const mergedData = {
    ...currentDocData,
    ...partialData,
    updatedAt: serverTimestamp(),
  };

  // 3. Save to active villageProfile doc
  await setDoc(profileDocRef, mergedData, { merge: true });

  // 4. Save history record
  try {
    await addDoc(collection(firestore, 'villageProfileHistory'), {
      action,
      tab,
      summary,
      timestamp: serverTimestamp(),
      savedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      dataSnapshot: {
        ...currentDocData,
        ...partialData,
      },
    });
  } catch (histErr) {
    console.warn('Gagal mencatat riwayat villageProfileHistory', histErr);
  }

  return true;
}
