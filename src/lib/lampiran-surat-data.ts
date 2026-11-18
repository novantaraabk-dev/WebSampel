/**
 * LAMPIRAN SURAT DATA & ENGINE (Modular Barrel Entrypoint)
 *
 * Berkas ini berfungsi sebagai fasad re-export utama agar seluruh modul
 * pemanggil (admin, cetak, preview) tetap bekerja mulus tanpa perubahan import path.
 *
 * Seluruh kode telah direfaktor dan dipecah modular ke dalam direktori:
 * `src/lib/lampiran/`
 *   ├── types.ts                      # Definisi tipe LampiranSuratItem, config kotak & margin
 *   ├── master-data.ts                # Metadata 52 lampiran resmi (MASTER_LAMPIRAN_SURAT)
 *   ├── form-isian.ts                 # Form isian & kode isian lampiran
 *   ├── templates/                    # Modul HTML per jenis lampiran (F-1.01 s/d F-2.12)
 *   └── engine.ts                     # Engine alias, pencarian, dan render lampiran cetak
 */

export * from './lampiran/types';
export * from './lampiran/master-data';
export * from './lampiran/form-isian';
export * from './lampiran/templates';
export * from './lampiran/engine';
