import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Pastikan kredensial diambil murni dari Environment Variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

// Daftar tipe berkas yang diizinkan (MIME Whitelist)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export async function POST(req: NextRequest) {
  try {
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Konfigurasi server Cloudinary belum lengkap.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string) || 'desa_digital_preset';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // 1. Validasi Ukuran Berkas
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran berkas melebihi batas maksimum (10 MB).' },
        { status: 400 }
      );
    }

    // 2. Validasi Tipe Berkas (MIME Whitelist)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe berkas (${file.type}) tidak diizinkan. Hanya gambar dan PDF yang diperbolehkan.` },
        { status: 400 }
      );
    }

    // 3. Sanitasi Nama Folder (Cegah path injection)
    const folder = rawFolder.replace(/[^a-zA-Z0-9_\-\/]/g, '').slice(0, 50);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload gagal'));
          } else {
            resolve(result as { secure_url: string });
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      secure_url: uploadResult.secure_url,
      success: true,
    });
  } catch (error: any) {
    console.error('API Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengunggah berkas ke Cloudinary.' },
      { status: 500 }
    );
  }
}

