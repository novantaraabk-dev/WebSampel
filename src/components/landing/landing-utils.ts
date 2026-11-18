import { Timestamp } from 'firebase/firestore';

export function formatDisplayDate(value: unknown) {
  if (!value) return '—';

  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '—';

    // Jika sudah merupakan string tanggal Indonesia (memiliki nama bulan Indonesia)
    const hasIndoMonth = /jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nop|nov|des/i.test(trimmed);
    if (hasIndoMonth) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    return trimmed;
  }

  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return '—';
}
