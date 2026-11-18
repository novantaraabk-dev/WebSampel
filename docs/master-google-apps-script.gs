/**
 * =================================================================================
 * MASTER BACKEND GOOGLE APPS SCRIPT - PEMERINTAH DESA SAMPELDES
 * Versi: Master Unified 8.0
 * Melayani:
 *  1. Website Publik: Upload lampiran surat pengajuan warga & dokumen anti korupsi.
 *  2. Manajemen Desa: Upload kegiatan, arsip SPPD, integrasi kalender & notulensi.
 *  3. Integrasi Spreadsheet: Pencarian PBB-P2 (BNBA PBB 26).
 * =================================================================================
 *
 * PETUNJUK SETUP & DEPLOY:
 * 1. Di Google Apps Script Editor -> Klik tanda '+' di Services:
 *    - Tambahkan "Google Calendar API"
 *    - Tambahkan "Google Drive API"
 * 2. Ganti seluruh isi script dengan kode ini.
 * 3. Jalankan fungsi 'forceGrantAllPermissions' satu kali untuk otorisasi izin.
 * 4. Klik "Deploy" -> "New Deployment" -> Type: "Web App".
 *    - Execute as: Me (akun Anda)
 *    - Who has access: Anyone (Siapa saja, termasuk anonim)
 * 5. Salin URL Web App yang dihasilkan ke menu Pengaturan di Website/Manajemen.
 * =================================================================================
 */

const GEMINI_API_KEY = "AIzaSyC14sMFsIWhjaZHEv8BzMyAQJtYqUxp6Xo"; 

// --- HANDLER GET (PENCARIAN PBB & STATUS CHECK) ---
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);

    // 1. Pencarian NOP PBB-P2
    if (params.nop) {
      return output.setContent(JSON.stringify(handleSearchPbb(params.nop)));
    }

    // 2. Health check endpoint
    return output.setContent(JSON.stringify({
      status: 'ready',
      message: 'Master Apps Script Desa Sampeldes aktif dan siap digunakan.'
    }));
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- HANDLER POST (UPLOAD & MANAJEMEN OPERASIONAL) ---
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Tidak ada data post yang diterima.");
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    // Deteksi otomatis jika request berasal dari Web Publik Pengajuan Surat / Dokumen
    if (!action && data.rootFolderId && data.files) {
      result = handleWebSubmissionUpload(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Switch action untuk Sistem Manajemen Desa
    switch (action) {
      case 'uploadSubmission':
        result = handleWebSubmissionUpload(data);
        break;

      case 'saveToDrive':
        result = handleSaveToDrive(data);
        break;

      case 'uploadArchiveFile':
        result = handleArchiveUpload(data);
        break;

      case 'createEventAndUpload':
        result = handleCreateEventAndUpload(data);
        break;

      case 'getCalendar':
        result = handleGetCalendar(data);
        break;

      case 'updateEventDescription':
        result = handleUpdateDescription(data);
        break;

      case 'updateEvent':
        result = handleUpdateEvent(data);
        break;

      case 'deleteEvent':
        result = handleDeleteEvent(data);
        break;

      case 'generateNumber':
        result = handleGenerateNumber(data);
        break;

      case 'askAI':
        result = handleAskAI(data);
        break;

      default:
        throw new Error("Aksi tidak dikenal: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost Error: ' + error.toString() + "\n" + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      status: 'error',
      error: error.message,
      message: "Apps Script Error: " + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===================================================================
// 1. HANDLER WEBSITE: UPLOAD BERKAS PENGAJUAN WARGA & ADMIN WEB
// ===================================================================
function handleWebSubmissionUpload(data) {
  const { rootFolderId, folderName, files } = data;
  if (!rootFolderId || !files || files.length === 0) {
    throw new Error("ID Folder Utama dan berkas upload diperlukan.");
  }

  let rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(rootFolderId);
  } catch (err) {
    throw new Error("Folder ID Google Drive tidak ditemukan atau tidak memiliki izin akses.");
  }

  // Buat folder subjek/pemohon jika ada spesifikasi folderName
  let targetFolder = rootFolder;
  if (folderName) {
    const existingFolders = rootFolder.getFoldersByName(folderName);
    if (existingFolders.hasNext()) {
      targetFolder = existingFolders.next();
    } else {
      targetFolder = rootFolder.createFolder(folderName);
    }
  }

  const uploadedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const fileItem = files[i];
    const decoded = Utilities.base64Decode(fileItem.base64Data || fileItem.base64);
    const mime = fileItem.mimeType || fileItem.type || 'application/octet-stream';
    const name = fileItem.targetFileName || fileItem.name || ('FILE_' + (i + 1));
    const blob = Utilities.newBlob(decoded, mime, name);
    const newFile = targetFolder.createFile(blob);

    uploadedFiles.push({
      fileId: newFile.getId(),
      fileName: name,
      fileUrl: newFile.getUrl()
    });
  }

  return {
    status: 'success',
    success: true,
    message: 'Berkas berhasil disimpan ke Google Drive.',
    files: uploadedFiles
  };
}

// ===================================================================
// 2. HANDLER MANAJEMEN: KEGIATAN & ARSIP DOKUMEN
// ===================================================================
function handleSaveToDrive(data) {
  const { folderName, parentFolderId, files } = data;
  let parentFolder;
  
  try {
    parentFolder = DriveApp.getFolderById(parentFolderId);
  } catch (e) {
    parentFolder = DriveApp.getRootFolder();
  }

  const newFolder = parentFolder.createFolder(folderName);
  const fileUrls = { photos: [], materials: [] };

  const saveFile = (fileInfo, folder) => {
    if (!fileInfo || !fileInfo.base64) return null;
    const decoded = Utilities.base64Decode(fileInfo.base64);
    const blob = Utilities.newBlob(decoded, fileInfo.type, fileInfo.name);
    const file = folder.createFile(blob);
    return file.getUrl();
  };

  if (files && files.photos) {
    files.photos.forEach(photo => {
      const url = saveFile(photo, newFolder);
      if (url) fileUrls.photos.push(url);
    });
  }
  
  if (files && files.materials) {
    files.materials.forEach(material => {
      const url = saveFile(material, newFolder);
      if (url) fileUrls.materials.push(url);
    });
  }
  
  if (files) {
    fileUrls.undangan = saveFile(files.undangan, newFolder);
    fileUrls.notulen = saveFile(files.notulen, newFolder);
    fileUrls.bast = saveFile(files.bast, newFolder);
  }

  return {
    folderId: newFolder.getId(),
    fileUrls: fileUrls
  };
}

function handleArchiveUpload(data) {
  const { fileData, fileName, folderId } = data;
  if (!fileData || !fileData.base64 || !fileName || !folderId) {
    throw new Error("Data arsip tidak lengkap.");
  }

  let targetFolder;
  try {
    targetFolder = DriveApp.getFolderById(folderId);
  } catch (e) {
    targetFolder = DriveApp.getRootFolder();
  }

  const decoded = Utilities.base64Decode(fileData.base64);
  const blob = Utilities.newBlob(decoded, fileData.type, fileName);
  const file = targetFolder.createFile(blob);
  
  return {
    fileUrl: file.getUrl(),
    fileId: file.getId()
  };
}

// ===================================================================
// 3. HANDLER KALENDER & AGENDA KEGIATAN
// ===================================================================
function handleGetCalendar(data) {
  const { calendarId, date } = data;
  if (!date) throw new Error("Tanggal agenda diperlukan.");
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) throw new Error("Format tanggal tidak valid.");

  const timeMin = targetDate.toISOString();
  const timeMax = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";

  try {
    const response = Calendar.Events.list(calId, {
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    return { items: response.items || [] };
  } catch (err) {
    if (calId !== "primary") {
      console.warn("Gagal membaca kalender " + calId + ", mencoba fallback ke primary: " + err.message);
      const fallbackResponse = Calendar.Events.list("primary", {
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });
      return { items: fallbackResponse.items || [] };
    }
    throw err;
  }
}

function handleCreateEventAndUpload(data) {
  const { eventData, fileData, folderId } = data;
  let fileUrl = null;
  let fileName = fileData?.name || "Berkas Undangan.pdf";

  if (fileData && fileData.base64) {
    try {
      let targetFolder;
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (e) {
        targetFolder = DriveApp.getRootFolder();
      }

      const decoded = Utilities.base64Decode(fileData.base64);
      const blob = Utilities.newBlob(decoded, fileData.type || "application/pdf", fileName);
      const createdFile = targetFolder.createFile(blob);
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        console.warn("Set sharing warning:", shareErr);
      }
      fileUrl = createdFile.getUrl();
    } catch (e) {
      console.warn("Gagal unggah berkas ke Drive: " + e.message);
    }
  }

  const calId = (eventData.calendarId && eventData.calendarId.includes("@")) ? eventData.calendarId : "primary";

  // Susun deskripsi dengan lampiran berkas yang sangat jelas
  let attachmentSection = "";
  if (fileUrl) {
    attachmentSection = "\n\n📎 BERKAS UNDANGAN / LAMPIRAN RESMI:\n" + fileUrl;
  }

  const eventResource = {
    summary: eventData.title,
    location: eventData.location,
    description: (eventData.description || '') + attachmentSection,
    start: { dateTime: eventData.start, timeZone: 'Asia/Jakarta' },
    end: { dateTime: eventData.end, timeZone: 'Asia/Jakarta' },
    reminders: { 'useDefault': false, 'overrides': [{ 'method': 'popup', 'minutes': 60 }] }
  };

  // Lampirkan sebagai official attachment Google Calendar jika ada berkas
  if (fileUrl) {
    eventResource.attachments = [{
      fileUrl: fileUrl,
      title: fileName,
      mimeType: fileData.type || "application/pdf"
    }];
  }

  let createdEvent;
  let fallbackUsed = false;
  let usedCalendarId = calId;
  try {
    createdEvent = Calendar.Events.insert(eventResource, calId, { supportsAttachments: true });
  } catch (insertErr) {
    // Fallback 1: Jika Google Calendar API belum mengaktifkan supportsAttachments
    delete eventResource.attachments;
    try {
      createdEvent = Calendar.Events.insert(eventResource, calId);
    } catch (retryErr) {
      // Fallback 2: Jika calId kustom (email desa) tidak ditemukan / tidak punya akses, fallback ke kalender utama ('primary')
      if (calId !== "primary") {
        console.warn("Gagal simpan ke " + calId + ", mencoba fallback ke primary: " + retryErr.message);
        createdEvent = Calendar.Events.insert(eventResource, "primary");
        fallbackUsed = true;
        usedCalendarId = "primary";
      } else {
        throw retryErr;
      }
    }
  }

  return {
    eventUrl: createdEvent.htmlLink,
    fileUrl: fileUrl,
    usedCalendarId: usedCalendarId,
    fallbackUsed: fallbackUsed
  };
}

function handleUpdateDescription(data) {
  const { calendarId, eventId, newContent } = data;
  const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";
  const event = Calendar.Events.get(calId, eventId);
  const separator = "\n\n--- NOTULENSI ---";
  let description = (event.description || "").split(separator)[0];
  const finalDescription = description.trim() + separator + "\n" + newContent.trim();
  Calendar.Events.patch({ description: finalDescription }, calId, eventId);
  return { message: "Notulensi berhasil diperbarui di Kalender." };
}

function handleUpdateEvent(data) {
  const { calendarId, eventId, title, location, description, start, end } = data;
  if (!eventId) {
    throw new Error("ID Acara (eventId) wajib disertakan.");
  }

  const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";
  const patchData = {};
  if (title) patchData.summary = title;
  if (location !== undefined) patchData.location = location;
  if (description !== undefined) patchData.description = description;
  if (start) patchData.start = { dateTime: start, timeZone: 'Asia/Jakarta' };
  if (end) patchData.end = { dateTime: end, timeZone: 'Asia/Jakarta' };

  const updatedEvent = Calendar.Events.patch(patchData, calId, eventId);
  return {
    success: true,
    message: "Agenda berhasil diperbarui di Google Calendar.",
    eventUrl: updatedEvent.htmlLink
  };
}

function handleDeleteEvent(data) {
  const { calendarId, eventId } = data;
  if (!eventId) {
    throw new Error("ID Acara (eventId) wajib disertakan.");
  }

  const calId = (calendarId && calendarId.includes("@")) ? calendarId : "primary";
  let deleted = false;
  let lastErr = null;

  // 1. Coba hapus dengan Google Calendar Advanced API Service
  try {
    Calendar.Events.remove(calId, eventId);
    deleted = true;
  } catch (err) {
    lastErr = err;
    console.warn("Calendar.Events.remove gagal: " + err.message);
  }

  // 2. Fallback menggunakan CalendarApp jika Calendar Advanced Service belum diaktifkan
  if (!deleted) {
    try {
      const cal = (calId === "primary") ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(calId);
      if (cal) {
        const event = cal.getEventById(eventId);
        if (event) {
          event.deleteEvent();
          deleted = true;
        } else {
          // Cari jika ID event memiliki format prefix/suffix Google Calendar
          const series = cal.getEvents(new Date(Date.now() - 365*24*3600*1000), new Date(Date.now() + 365*24*3600*1000));
          const match = series.find(function(ev) { return ev.getId() === eventId || ev.getId().split('@')[0] === eventId.split('@')[0]; });
          if (match) {
            match.deleteEvent();
            deleted = true;
          }
        }
      }
    } catch (calAppErr) {
      lastErr = calAppErr;
      console.warn("CalendarApp delete error: " + calAppErr.message);
    }
  }

  if (!deleted) {
    throw new Error("Gagal menghapus acara dari Google Calendar: " + (lastErr ? lastErr.message : "Acara tidak ditemukan."));
  }

  return {
    success: true,
    message: "Agenda berhasil dihapus secara permanen dari Google Calendar."
  };
}

// ===================================================================
// 4. PENOMORAN OTOMATIS & AI HELPER
// ===================================================================
function handleGenerateNumber() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  const year = new Date().getFullYear();
  return { docNumber: `090/${randomNum}/SPPD/${year}` };
}

function handleAskAI(data) {
  const { prompt } = data;
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = { 'method': 'post', 'contentType': 'application/json', 'payload': JSON.stringify(payload) };
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  return { text: result.candidates[0].content.parts[0].text };
}

// ===================================================================
// 5. HANDLER PENCARIAN PBB-P2 (BNBA PBB 26)
// ===================================================================
function handleSearchPbb(nopQuery) {
  function cleanNop(val) {
    if (!val) return '';
    return String(val).replace(/[^0-9a-zA-Z]/g, '').trim().toUpperCase();
  }

  const cleanTarget = cleanNop(nopQuery);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('BNBA PBB 26');
  if (!sheet) {
    const allSheets = ss.getSheets();
    for (let s = 0; s < allSheets.length; s++) {
      if (allSheets[s].getName().indexOf('BNBA') !== -1) {
        sheet = allSheets[s];
        break;
      }
    }
    if (!sheet) sheet = allSheets[0];
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 6) {
    return { status: 'not_found', message: 'Data PBB kosong atau belum diisi.' };
  }

  const headers = sheet.getRange(5, 1, 1, lastCol).getValues()[0];
  let nopColIdx = 3;
  for (let h = 0; h < headers.length; h++) {
    const hText = String(headers[h]).toUpperCase().trim();
    if (hText === 'NOP' || (hText.indexOf('NOP') !== -1 && hText.indexOf('NJOP') === -1)) {
      nopColIdx = h;
      break;
    }
  }

  const nopRangeValues = sheet.getRange(6, nopColIdx + 1, lastRow - 5, 1).getValues();
  let foundRow = -1;
  for (let r = 0; r < nopRangeValues.length; r++) {
    if (cleanNop(nopRangeValues[r][0]) === cleanTarget) {
      foundRow = r + 6;
      break;
    }
  }

  if (foundRow === -1) {
    return { status: 'not_found', message: 'NOP tidak ditemukan dalam buku data PBB.' };
  }

  const rowData = sheet.getRange(foundRow, 1, 1, lastCol).getValues()[0];
  return {
    status: 'success',
    data: {
      nop: rowData[nopColIdx] || nopQuery,
      namaWp: rowData[5] || '',
      alamatObjek: rowData[6] || '',
      pbbYangDibayar: rowData[13] || 0,
      keterangan: rowData[15] || 'LUNAS'
    }
  };
}

// ===================================================================
// 6. FUNGSI DIAGNOSTIK & OTORISASI PERTAMA
// ===================================================================
function forceGrantAllPermissions() {
  const root = DriveApp.getRootFolder();
  Logger.log("Akses Drive OK: " + root.getName());
  const cal = CalendarApp.getDefaultCalendar();
  Logger.log("Akses Kalender OK: " + cal.getName());
}
