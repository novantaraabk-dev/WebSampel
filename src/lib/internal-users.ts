/**
 * @fileOverview Daftar pemetaan akun internal untuk Portal Absensi.
 * Hanya menyertakan metadata admin sistem utama. Kredensial password dikelola langsung via Firebase Authentication.
 */

export const INTERNAL_USERS = [
  {
    username: "adminsampeldes",
    email: "adminsampeldes@sampeldes.id",
    role: "admin_absensi",
    nama: "ADMINISTRATOR ABSENSI SAMPELDES"
  },
  {
    username: "admin",
    email: "admin@sampeldes.id",
    role: "admin_absensi",
    nama: "ADMINISTRATOR ABSENSI"
  }
];
