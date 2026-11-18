/**
 * Cloudinary upload utility.
 *
 * Primary Strategy: Uses the Next.js internal `/api/upload-cloudinary` server endpoint.
 * This completely prevents browser CORS issues, ad-blocker interferences, and network blocking.
 *
 * Fallback Strategy: Client-side unsigned upload using the configured upload preset.
 */

export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'desa_digital_preset'
): Promise<string> {
  // 1. Try server-side API route first (most reliable, immune to CORS and ad-blockers)
  try {
    const serverFormData = new FormData();
    serverFormData.append('file', file);
    serverFormData.append('folder', folder);

    const apiRes = await fetch('/api/upload-cloudinary', {
      method: 'POST',
      body: serverFormData,
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      if (apiData.secure_url) {
        return apiData.secure_url as string;
      }
    }
  } catch (serverErr) {
    console.warn('Server upload route failed, attempting direct Cloudinary upload fallback...', serverErr);
  }

  // 2. Fallback: Direct unsigned client upload to Cloudinary
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dy9dw8jyu';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'desa_digital_preset';

  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME tidak diset di .env atau .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error?.message || 'Gagal mengunggah foto ke Cloudinary.'
    );
  }

  return data.secure_url as string;
}
