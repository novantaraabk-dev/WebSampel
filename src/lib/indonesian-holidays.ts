export interface IndonesianHoliday {
  date: string // YYYY-MM-DD
  name: string
  isCutiBersama?: boolean
}

export const INDONESIAN_HOLIDAYS_DATA: Record<number, IndonesianHoliday[]> = {
  2025: [
    { date: "2025-01-01", name: "Tahun Baru 2025 Masehi" },
    { date: "2025-01-27", name: "Isra Mikraj Nabi Muhammad SAW" },
    { date: "2025-01-28", name: "Cuti Bersama Tahun Baru Imlek 2576 Kongzili", isCutiBersama: true },
    { date: "2025-01-29", name: "Tahun Baru Imlek 2576 Kongzili" },
    { date: "2025-03-28", name: "Cuti Bersama Hari Suci Nyepi", isCutiBersama: true },
    { date: "2025-03-29", name: "Hari Suci Nyepi (Tahun Baru Saka 1947)" },
    { date: "2025-03-31", name: "Hari Raya Idul Fitri 1446 H" },
    { date: "2025-04-01", name: "Hari Raya Idul Fitri 1446 H" },
    { date: "2025-04-02", name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
    { date: "2025-04-03", name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
    { date: "2025-04-04", name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
    { date: "2025-04-07", name: "Cuti Bersama Idul Fitri 1446 H", isCutiBersama: true },
    { date: "2025-04-18", name: "Wafat Yesus Kristus" },
    { date: "2025-04-20", name: "Kebangkitan Yesus Kristus (Paskah)" },
    { date: "2025-05-01", name: "Hari Buruh Internasional" },
    { date: "2025-05-12", name: "Hari Raya Waisak 2569 BE" },
    { date: "2025-05-13", name: "Cuti Bersama Hari Raya Waisak", isCutiBersama: true },
    { date: "2025-05-29", name: "Kenaikan Yesus Kristus" },
    { date: "2025-05-30", name: "Cuti Bersama Kenaikan Yesus Kristus", isCutiBersama: true },
    { date: "2025-06-01", name: "Hari Lahir Pancasila" },
    { date: "2025-06-06", name: "Hari Raya Idul Adha 1446 H" },
    { date: "2025-06-09", name: "Cuti Bersama Hari Raya Idul Adha", isCutiBersama: true },
    { date: "2025-06-27", name: "Tahun Baru Islam 1447 H" },
    { date: "2025-08-17", name: "Hari Kemerdekaan Republik Indonesia ke-80" },
    { date: "2025-09-05", name: "Maulid Nabi Muhammad SAW" },
    { date: "2025-12-25", name: "Kelahiran Yesus Kristus (Hari Raya Natal)" },
    { date: "2025-12-26", name: "Cuti Bersama Hari Raya Natal", isCutiBersama: true }
  ],
  2026: [
    { date: "2026-01-01", name: "Tahun Baru 2026 Masehi" },
    { date: "2026-01-16", name: "Isra Mikraj Nabi Muhammad SAW" },
    { date: "2026-02-16", name: "Cuti Bersama Tahun Baru Imlek 2577 Kongzili", isCutiBersama: true },
    { date: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili" },
    { date: "2026-03-19", name: "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
    { date: "2026-03-20", name: "Hari Raya Idul Fitri 1447 H" },
    { date: "2026-03-21", name: "Hari Raya Idul Fitri 1447 H" },
    { date: "2026-03-23", name: "Cuti Bersama Idul Fitri 1447 H", isCutiBersama: true },
    { date: "2026-03-24", name: "Cuti Bersama Idul Fitri 1447 H", isCutiBersama: true },
    { date: "2026-04-03", name: "Wafat Yesus Kristus (Jumat Agung)" },
    { date: "2026-04-05", name: "Kebangkitan Yesus Kristus (Paskah)" },
    { date: "2026-05-01", name: "Hari Buruh Internasional" },
    { date: "2026-05-14", name: "Kenaikan Yesus Kristus" },
    { date: "2026-05-27", name: "Hari Raya Idul Adha 1447 H" },
    { date: "2026-05-31", name: "Hari Raya Waisak 2570 BE" },
    { date: "2026-06-01", name: "Hari Lahir Pancasila" },
    { date: "2026-06-16", name: "Tahun Baru Islam 1448 H" },
    { date: "2026-08-17", name: "Hari Kemerdekaan Republik Indonesia ke-81" },
    { date: "2026-08-25", name: "Maulid Nabi Muhammad SAW" },
    { date: "2026-12-25", name: "Hari Raya Natal" },
    { date: "2026-12-26", name: "Cuti Bersama Hari Raya Natal", isCutiBersama: true }
  ],
  2027: [
    { date: "2027-01-01", name: "Tahun Baru 2027 Masehi" },
    { date: "2027-01-06", name: "Isra Mikraj Nabi Muhammad SAW" },
    { date: "2027-02-06", name: "Tahun Baru Imlek 2578 Kongzili" },
    { date: "2027-03-09", name: "Hari Raya Idul Fitri 1448 H" },
    { date: "2027-03-10", name: "Hari Raya Idul Fitri 1448 H" },
    { date: "2027-03-26", name: "Wafat Yesus Kristus (Jumat Agung)" },
    { date: "2027-04-07", name: "Hari Suci Nyepi (Tahun Baru Saka 1949)" },
    { date: "2027-05-01", name: "Hari Buruh Internasional" },
    { date: "2027-05-06", name: "Kenaikan Yesus Kristus" },
    { date: "2027-05-16", name: "Hari Raya Idul Adha 1448 H" },
    { date: "2027-05-20", name: "Hari Raya Waisak 2571 BE" },
    { date: "2027-06-01", name: "Hari Lahir Pancasila" },
    { date: "2027-06-06", name: "Tahun Baru Islam 1449 H" },
    { date: "2027-08-15", name: "Maulid Nabi Muhammad SAW" },
    { date: "2027-08-17", name: "Hari Kemerdekaan Republik Indonesia ke-82" },
    { date: "2027-12-25", name: "Hari Raya Natal" }
  ]
}

/**
 * Mengambil daftar hari libur nasional Indonesia berdasarkan tahun.
 * Jika tahun tidak diberikan, default ke tahun saat ini.
 */
export function getIndonesianHolidays(year?: number | string): IndonesianHoliday[] {
  if (year === "all" || year === "semua") {
    return Object.values(INDONESIAN_HOLIDAYS_DATA).flat().sort((a, b) => a.date.localeCompare(b.date))
  }

  const targetYear = typeof year === "number" ? year : year ? parseInt(year, 10) : new Date().getFullYear()
  const found = INDONESIAN_HOLIDAYS_DATA[targetYear]
  if (found) return found

  // Jika tahun di luar rentang, cari tahun terdekat atau kembalikan data tahun 2026
  return INDONESIAN_HOLIDAYS_DATA[2026] || []
}

/**
 * Mencari nama hari libur nasional untuk tanggal tertentu (YYYY-MM-DD).
 */
export function getHolidayDescription(dateStr: string): string | null {
  for (const yearList of Object.values(INDONESIAN_HOLIDAYS_DATA)) {
    const item = yearList.find(h => h.date === dateStr)
    if (item) return item.name
  }
  return null
}
