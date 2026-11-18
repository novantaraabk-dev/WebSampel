/**
 * src/lib/pdf-to-image.ts
 * Utilitas konversi dokumen PDF (jsPDF Blob) menjadi gambar JPG berkualitas tinggi (High DPI)
 * secara murni di browser client-side tanpa memicu error Turbopack / Webpack 'canvas'.
 */

// Memuat library pdfjs secara dinamis via script tag di browser agar kebal terhadap bundler Next.js Turbopack
function loadPdfJsInBrowser(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Konversi PDF ke JPG hanya dapat dijalankan di browser."));
  }

  const w = window as any;
  if (w.pdfjsLib) {
    return Promise.resolve(w.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    // Cek jika script sudah ada di DOM
    const existingScript = document.getElementById("pdfjs-dist-cdn-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (w.pdfjsLib) {
          w.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(w.pdfjsLib);
        } else {
          reject(new Error("Gagal menginisialisasi pustaka PDF"));
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-dist-cdn-script";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      if (w.pdfjsLib) {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(w.pdfjsLib);
      } else {
        reject(new Error("Gagal menginisialisasi pdfjsLib di browser"));
      }
    };

    script.onerror = () => {
      reject(new Error("Gagal memuat pustaka konversi PDF ke JPG dari CDN. Pastikan perangkat terhubung internet."));
    };

    document.head.appendChild(script);
  });
}

export async function convertPdfBlobToJpgBlob(
  pdfBlob: Blob,
  scale = 3.0
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("Konversi PDF ke JPG hanya dapat dijalankan di browser.");
  }

  const pdfjsLib = await loadPdfJsInBrowser();
  const arrayBuffer = await pdfBlob.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (numPages === 0) {
    throw new Error("Dokumen PDF kosong atau tidak memiliki halaman.");
  }

  // Render halaman pertama
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale });

  if (numPages === 1) {
    // Dokumen 1 Halaman (Struk Thermal, Nota Kontan 1 Lembar)
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(firstViewport.width);
    canvas.height = Math.floor(firstViewport.height);

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Gagal menginisialisasi Canvas 2D context.");

    // Beri latar belakang putih bersih
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await firstPage.render({
      canvasContext: ctx,
      viewport: firstViewport,
    }).promise;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Gagal mengubah canvas menjadi file JPG."));
        },
        "image/jpeg",
        0.96
      );
    });
  }

  // Jika dokumen multi-halaman (misal Nota rangkap atau Dokumen 2 Halaman)
  // Gabungkan semua halaman secara vertikal dengan rapi
  const pageViewports: any[] = [firstViewport];
  let totalHeight = firstViewport.height;
  let maxWidth = firstViewport.width;

  for (let pageNum = 2; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    pageViewports.push(viewport);
    totalHeight += viewport.height + 20; // 20px jeda antar halaman
    if (viewport.width > maxWidth) maxWidth = viewport.width;
  }

  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = Math.floor(maxWidth);
  combinedCanvas.height = Math.floor(totalHeight);

  const combinedCtx = combinedCanvas.getContext("2d", { alpha: false });
  if (!combinedCtx) throw new Error("Gagal menginisialisasi Canvas gabungan 2D.");

  combinedCtx.fillStyle = "#ffffff";
  combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

  let currentY = 0;
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = pageViewports[pageNum - 1];

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.floor(viewport.width);
    tempCanvas.height = Math.floor(viewport.height);
    const tempCtx = tempCanvas.getContext("2d", { alpha: false });
    if (tempCtx) {
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      await page.render({
        canvasContext: tempCtx,
        viewport,
      }).promise;

      const offsetX = Math.floor((maxWidth - viewport.width) / 2);
      combinedCtx.drawImage(tempCanvas, offsetX, currentY);
    }
    currentY += viewport.height + 20;
  }

  return new Promise((resolve, reject) => {
    combinedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal mengubah canvas dokumen menjadi file JPG."));
      },
      "image/jpeg",
      0.95
    );
  });
}

/**
 * Memicu pengunduhan file di browser
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}
