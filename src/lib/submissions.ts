'use client';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  Firestore,
  query,
  orderBy,
  limit,
  DocumentReference,
  where,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { LetterSubmission, UploadedFile, DriveSettingsInfo } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { invalidateCollectionCache } from '@/firebase/firestore/use-collection';
import { invalidateDocCache } from '@/firebase/firestore/use-doc';

// Cache In-Memory untuk driveSettings/default (0 Read saat pengajuan surat berikutnya)
let cachedDriveSettings: { data: DriveSettingsInfo | null; ts: number } | null = null;
const DRIVE_SETTINGS_TTL = 30 * 60 * 1000; // 30 Menit

/** Extracts a Google Drive folder ID from a full URL or returns the raw ID. */
function extractFolderId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  const id = match ? match[1] : trimmed;
  // Strip query parameters like ?hl=ID or ?usp=sharing
  return id.split('?')[0].split('#')[0];
}

// Helper interface for file data before it's sent to Google Drive
export interface FileToUpload {
  base64Data: string;
  mimeType: string;
  targetFileName: string;
  fieldName: string; // To map back the result from Google Drive
}

// Updated data structure for new anonymous submissions from the client forms
export interface NewSubmissionData {
  ticketNumber: string;
  requesterName: string;
  nik: string;
  letterType: string;
  formData: { [key: string]: any };
  filesToUpload?: FileToUpload[]; // Contains files to be uploaded to Google Drive
  fileLinks?: UploadedFile[]; // Optional pre-uploaded file links (for mock or external uploads)
  requestorAuthUid?: string; // NEW: To store real user UID
  status?: 'pending' | 'processing' | 'approved' | 'rejected' | string;
  documentNumber?: string;
  urlSurat?: string;
  kodeSurat?: string;
  masterSuratId?: string;
  purpose?: string;
  phoneNumber?: string;
  email?: string;
}

export const getLetterRequestsCollection = (db: Firestore) => collection(db, 'letterRequests');

// HEMAT KUOTA: Batasi ke 25 permohonan terbaru (kapasitas desa < 20 surat/hari)
export const getLetterRequestsQuery = (db: Firestore) =>
  query(getLetterRequestsCollection(db), orderBy('createdAt', 'desc'), limit(25));

// Cache In-Memory untuk pencarian tiket/dokumen permohonan (2 Menit TTL agar klik Cek Tiket berulang = 0 Read)
const submissionTicketCache = new Map<string, { data: LetterSubmission | null; ts: number }>();
const TICKET_CACHE_TTL = 2 * 60 * 1000;

export const getSubmissionById = async (
  db: Firestore,
  id: string
): Promise<LetterSubmission | null> => {
  if (!id || !db) return null;

  const trimmedId = id.trim();
  const cached = submissionTicketCache.get(trimmedId);
  if (cached && Date.now() - cached.ts < TICKET_CACHE_TTL) {
    return cached.data;
  }

  try {
    let docSnap = null;

    // 1. Jika input 6 digit angka (format Nomor Tiket), langsung query ticketNumber dengan limit(1) (Hemat 1 Read!)
    const isShortTicket = /^\d{5,8}$/.test(trimmedId) || trimmedId.startsWith('TKT-');
    if (isShortTicket) {
      const q = query(
        getLetterRequestsCollection(db),
        where('ticketNumber', '==', trimmedId),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0];
      }
    }

    // 2. Jika belum ketemu atau input berupa Firestore Document ID, panggil getDoc (1 Read)
    if (!docSnap) {
      const docRef = doc(db, 'letterRequests', trimmedId);
      const directSnap = await getDoc(docRef);
      if (directSnap.exists()) {
        docSnap = directSnap;
      } else if (!isShortTicket) {
        const q = query(
          getLetterRequestsCollection(db),
          where('ticketNumber', '==', trimmedId),
          limit(1)
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          docSnap = querySnap.docs[0];
        }
      }
    }

    if (docSnap && docSnap.exists()) {
      const data = docSnap.data();

      // Robust parsing for legacy submissionData
      let mainData = data;
      if (data.submissionData && typeof data.submissionData === 'string') {
        try {
          mainData = JSON.parse(data.submissionData);
        } catch (e) {
          console.warn('Failed to parse legacy submissionData for ID:', docSnap.id, e);
        }
      }

      const mergedFormData = {
        ...(mainData || {}),
        ...(mainData.formData || {}),
        ...(data.formData || {}),
      };

      const result = {
        id: docSnap.id,
        requesterName: data.requesterName || mainData.name || mainData.requesterName || '',
        nik: data.nik || mainData.nik || '',
        phoneNumber: mainData.phoneNumber || data.phoneNumber || mergedFormData.phoneNumber || '',
        email: mainData.email || data.email || mergedFormData.email || '',
        letterType: data.letterType || 'Surat Keterangan',
        status: data.status || 'pending',
        date: data.createdAt?.toDate()?.toISOString() ?? new Date().toISOString(),
        formData: mergedFormData,
        documentNumber: data.documentNumber,
        fileLinks: data.fileLinks || [],
        createdAt: data.createdAt,
        ticketNumber: data.ticketNumber,
        purpose: data.purpose || mergedFormData.purpose || mergedFormData.form_keperluan || '',
        urlSurat: data.urlSurat || mergedFormData.urlSurat || '',
        kodeSurat: data.kodeSurat || mergedFormData.kodeSurat || '',
        masterSuratId: data.masterSuratId || mergedFormData.masterSuratId || '',
      } as LetterSubmission;

      submissionTicketCache.set(trimmedId, { data: result, ts: Date.now() });
      submissionTicketCache.set(docSnap.id, { data: result, ts: Date.now() });
      return result;
    }

    submissionTicketCache.set(trimmedId, { data: null, ts: Date.now() });
  } catch (error) {
    console.error('Error in getSubmissionById:', error);
    throw error;
  }
  return null;
};

/**
 * Membersihkan objek secara rekursif dari nilai `undefined`
 * agar Firestore addDoc / updateDoc tidak melemparkan error:
 * "Unsupported field value: undefined"
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as any;
  }
  if (typeof data === 'object') {
    // Jangan ubah objek bawaan Firestore seperti serverTimestamp() / FieldValue / Timestamp
    if (
      data.constructor &&
      data.constructor.name !== 'Object' &&
      typeof (data as any).toMillis !== 'function'
    ) {
      return data;
    }
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleanObj[key] = sanitizeFirestoreData(val);
      }
    }
    return cleanObj as T;
  }
  return data;
}

/**
 * Adds a new letter submission by first uploading files to Google Drive via Apps Script,
 * then saving the submission data with the returned file links to Firestore.
 */
export const addSubmission = async (
  db: Firestore,
  submissionData: NewSubmissionData
): Promise<DocumentReference> => {
  // Default fallbacks
  let APP_SCRIPT_URL = '';
  let ROOT_FOLDER_ID = '';

  try {
    let driveData: DriveSettingsInfo | null = null;
    if (cachedDriveSettings && Date.now() - cachedDriveSettings.ts < DRIVE_SETTINGS_TTL) {
      driveData = cachedDriveSettings.data;
    } else {
      const driveRef = doc(db, 'driveSettings', 'default');
      const driveSnap = await getDoc(driveRef);
      driveData = driveSnap.exists() ? (driveSnap.data() as DriveSettingsInfo) : null;
      cachedDriveSettings = { data: driveData, ts: Date.now() };
    }
    if (driveData) {
      APP_SCRIPT_URL = (driveData.appsScriptUrl || '').trim();
      ROOT_FOLDER_ID = extractFolderId(driveData.rootFolderId || '');
    }
  } catch (e) {
    console.warn('Failed to load Drive settings from Firestore.');
  }

  const { formData, filesToUpload, requestorAuthUid, ...restOfData } = submissionData;
  const collectionRef = getLetterRequestsCollection(db);

  let finalFileLinks: UploadedFile[] = submissionData.fileLinks ? [...submissionData.fileLinks] : [];

  // Step 1: Upload files to Google Drive if they exist and settings are available
  if (APP_SCRIPT_URL && ROOT_FOLDER_ID && filesToUpload && filesToUpload.length > 0) {
    try {
      const uploadPayload = {
        rootFolderId: ROOT_FOLDER_ID, // KIRIM ROOT_FOLDER_ID KE APPS SCRIPT
        folderName: `${submissionData.letterType} - ${submissionData.requesterName} - ${submissionData.nik}`.toUpperCase(),
        letterType: submissionData.letterType,
        requesterName: submissionData.requesterName,
        files: filesToUpload.map((f) => ({
          base64Data: f.base64Data,
          mimeType: f.mimeType,
          targetFileName: f.targetFileName,
        })),
      };

      const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(uploadPayload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      const resultText = await response.text();
      const result = JSON.parse(resultText);

      if (result.status !== 'success') {
        throw new Error(result.message || 'Error dari Apps Script.');
      }

      const uploadedFiles: Array<{ fileId: string; fileName: string }> = result.files;

      finalFileLinks = uploadedFiles.map((uploadedFile, index) => {
        const originalFile = filesToUpload[index];
        return {
          fieldName: originalFile.fieldName,
          fileId: uploadedFile.fileId,
          fileName: uploadedFile.fileName,
        };
      });
    } catch (error: any) {
      console.error('Error during Google Drive upload:', error);
      throw new Error(
        `Gagal mengunggah file. Pastikan URL Apps Script dan ID Folder sudah benar di Pengaturan. (${error.message})`
      );
    }
  } else if ((!APP_SCRIPT_URL || !ROOT_FOLDER_ID) && filesToUpload && filesToUpload.length > 0) {
    // Jika Google Drive belum dikonfigurasi, simpan metadata berkas agar pengajuan tetap dapat masuk tanpa error
    finalFileLinks = filesToUpload.map((f, idx) => ({
      fieldName: f.fieldName,
      fileId: `local-${Date.now()}-${idx}`,
      fileName: f.targetFileName,
    }));
  }

  // Step 2: Save submission metadata to Firestore
  const auth = getAuth();
  const inferredPurpose =
    restOfData.purpose ||
    formData?.purpose ||
    formData?.['[form_keperluan]'] ||
    formData?.form_keperluan ||
    formData?.['[form_keterangan]'] ||
    formData?.reason ||
    `Permohonan ${submissionData.letterType}`;

  const docToSave = {
    ...formData,
    ...restOfData,
    purpose: inferredPurpose,
    phoneNumber: restOfData.phoneNumber || formData?.phoneNumber || '-',
    email: restOfData.email || formData?.email || '',
    formData: {
      ...formData,
      purpose: inferredPurpose,
    },
    fileLinks: finalFileLinks,
    status: restOfData.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    requestorAuthUid: requestorAuthUid || auth.currentUser?.uid || 'anonymous',
  };

  try {
    const cleanDoc = sanitizeFirestoreData(docToSave);
    const docRef = await addDoc(collectionRef, cleanDoc);
    invalidateCollectionCache('letterRequests');
    submissionTicketCache.clear();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('sampeldes_letter_count_cache');
      } catch {
        // ignore
      }
    }
    return docRef;
  } catch (error) {
    console.error('Error adding document to Firestore:', error);
    throw new Error('Gagal menyimpan data pengajuan ke database.');
  }
};

// --- Admin Panel Functions ---

export const updateSubmissionStatus = async (
  db: Firestore,
  id: string,
  status: 'approved' | 'rejected' | 'pending' | 'processing' | string,
  documentNumber?: string
): Promise<void> => {
  const updatePayload: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (documentNumber !== undefined) {
    updatePayload.documentNumber = documentNumber;
  }

  try {
    const lrRef = doc(db, 'letterRequests', id);
    await updateDoc(lrRef, updatePayload);
    invalidateCollectionCache('letterRequests');
    invalidateDocCache(`letterRequests/${id}`);
  } catch (error) {
    try {
      const docRef = doc(db, 'submissions', id);
      await updateDoc(docRef, updatePayload);
      invalidateCollectionCache('letterRequests');
    } catch (innerError) {
      console.error('Error updating submission status:', error);
      throw error;
    }
  }
};

export const setSubmissionDocumentNumber = (
  db: Firestore,
  id: string,
  documentNumber: string
) => {
  const docRef = doc(db, 'letterRequests', id);
  const data = { documentNumber, updatedAt: serverTimestamp() };
  const promise = updateDoc(docRef, data);
  promise.catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
  return promise;
};

export const deleteSubmission = (db: Firestore, id: string) => {
  const docRef = doc(db, 'letterRequests', id);
  invalidateCollectionCache('letterRequests');
  invalidateDocCache(`letterRequests/${id}`);
  deleteDoc(docRef).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
  });
};

/**
 * Mendapatkan Nomor Dokumen/Surat Otomatis Berurutan
 * Format: 400 / [urutan] / 04 / 2026
 */
export const getNextDocumentNumber = async (db: Firestore): Promise<string> => {
  try {
    // Ultra-hemat kuota: Hanya baca 10 dokumen surat terakhir berurutan waktu (bukan seluruh database)
    const q = query(collection(db, 'letterRequests'), orderBy('createdAt', 'desc'), limit(10));
    const lrSnap = await getDocs(q);
    let maxSeq = 0;

    lrSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.documentNumber && typeof data.documentNumber === 'string') {
        const match = data.documentNumber.match(/(\d{1,4})/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num < 9000 && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });

    const nextSeq = maxSeq > 0 ? maxSeq + 1 : Math.max(1, lrSnap.size + 1);
    const seqStr = String(nextSeq).padStart(3, '0');
    const year = new Date().getFullYear();

    return `400 / ${seqStr} / 04 / ${year}`;
  } catch (error) {
    console.error('Error generating document number:', error);
    return `400 / 001 / 04 / ${new Date().getFullYear()}`;
  }
};
