'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, Search, Loader2, MapPin, Edit2, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  RegionItem,
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
  findPostalCode,
} from '@/lib/indonesian-regions';

interface SearchableRegionSelectProps {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  items: RegionItem[];
  value: string;
  onSelect: (item: RegionItem) => void;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  emptyText?: string;
}

function SearchableRegionSelect({
  label,
  placeholder,
  searchPlaceholder,
  items,
  value,
  onSelect,
  disabled = false,
  isLoading = false,
  required = false,
  emptyText = 'Data wilayah tidak ditemukan.',
}: SearchableRegionSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (it) => it.name.toLowerCase().includes(q) || it.rawName.toLowerCase().includes(q),
    );
  }, [items, search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [open]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {isLoading && (
          <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
            <Loader2 className="h-3 w-3 animate-spin" /> Memuat...
          </span>
        )}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || isLoading}
            className={cn(
              'w-full h-12 px-3.5 rounded-xl border border-input bg-white text-left text-sm flex items-center justify-between transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20',
              disabled && 'bg-slate-50 cursor-not-allowed opacity-60',
              !value && 'text-slate-400',
              value && 'text-slate-900 font-semibold',
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400 ml-2" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[calc(100vw-3rem)] sm:w-[360px] p-2.5 rounded-2xl shadow-xl border-slate-200 z-50 bg-white"
          align="start"
        >
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-lg text-xs"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Sedang memuat wilayah...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">{emptyText}</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = value.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors font-medium',
                      isSelected
                        ? 'bg-primary text-white font-bold'
                        : 'hover:bg-slate-100 text-slate-700',
                    )}
                  >
                    <span>{item.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export interface IndonesianRegionPickerProps {
  provinsiValue: string;
  kabupatenValue: string;
  kecamatanValue: string;
  desaValue: string;
  onChange: (values: {
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
  }) => void;
  onPostalCodeFound?: (postalCode: string) => void;
  disabled?: boolean;
}

export function IndonesianRegionPicker({
  provinsiValue,
  kabupatenValue,
  kecamatanValue,
  desaValue,
  onChange,
  onPostalCodeFound,
  disabled = false,
}: IndonesianRegionPickerProps) {
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [selectedProvId, setSelectedProvId] = useState<string>('');
  const [selectedRegId, setSelectedRegId] = useState<string>('');
  const [selectedDisId, setSelectedDisId] = useState<string>('');

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDis, setLoadingDis] = useState(false);
  const [loadingVil, setLoadingVil] = useState(false);

  const [isManualMode, setIsManualMode] = useState(false);

  // 1. Muat seluruh Provinsi saat mount
  useEffect(() => {
    let active = true;
    setLoadingProv(true);
    getProvinces()
      .then((data) => {
        if (active) {
          setProvinces(data);
          // Coba cocokkan id provinsi jika provinsiValue sudah ada
          if (provinsiValue) {
            const found = data.find(
              (p) => p.name.toLowerCase() === provinsiValue.toLowerCase() || p.rawName.toLowerCase() === provinsiValue.toLowerCase(),
            );
            if (found) {
              setSelectedProvId(found.id);
            }
          }
        }
      })
      .finally(() => {
        if (active) setLoadingProv(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Ketika selectedProvId berubah, muat kabupaten
  useEffect(() => {
    if (!selectedProvId) {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      return;
    }

    let active = true;
    setLoadingReg(true);
    getRegencies(selectedProvId)
      .then((data) => {
        if (active) {
          setRegencies(data);
          if (kabupatenValue) {
            const cleanKab = kabupatenValue.toLowerCase().replace(/^(kabupaten|kota)\s+/i, '').trim();
            const found = data.find((r) => {
              const rClean = r.name.toLowerCase().replace(/^(kabupaten|kota)\s+/i, '').trim();
              return r.name.toLowerCase() === kabupatenValue.toLowerCase() || rClean === cleanKab;
            });
            if (found) {
              setSelectedRegId(found.id);
            }
          }
        }
      })
      .finally(() => {
        if (active) setLoadingReg(false);
      });

    return () => {
      active = false;
    };
  }, [selectedProvId]);

  // 3. Ketika selectedRegId berubah, muat kecamatan
  useEffect(() => {
    if (!selectedRegId) {
      setDistricts([]);
      setVillages([]);
      return;
    }

    let active = true;
    setLoadingDis(true);
    getDistricts(selectedRegId)
      .then((data) => {
        if (active) {
          setDistricts(data);
          if (kecamatanValue) {
            const cleanKec = kecamatanValue.toLowerCase().replace(/^kecamatan\s+/i, '').trim();
            const found = data.find((d) => {
              const dClean = d.name.toLowerCase().replace(/^kecamatan\s+/i, '').trim();
              return d.name.toLowerCase() === kecamatanValue.toLowerCase() || dClean === cleanKec;
            });
            if (found) {
              setSelectedDisId(found.id);
            }
          }
        }
      })
      .finally(() => {
        if (active) setLoadingDis(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRegId]);

  // 4. Ketika selectedDisId berubah, muat desa
  useEffect(() => {
    if (!selectedDisId) {
      setVillages([]);
      return;
    }

    let active = true;
    setLoadingVil(true);
    getVillages(selectedDisId)
      .then((data) => {
        if (active) {
          setVillages(data);
        }
      })
      .finally(() => {
        if (active) setLoadingVil(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDisId]);

  const handleSelectProvince = (item: RegionItem) => {
    setSelectedProvId(item.id);
    setSelectedRegId('');
    setSelectedDisId('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    onChange({
      provinsi: item.name,
      kabupaten: '',
      kecamatan: '',
      desa: '',
    });
  };

  const handleSelectRegency = (item: RegionItem) => {
    setSelectedRegId(item.id);
    setSelectedDisId('');
    setDistricts([]);
    setVillages([]);

    onChange({
      provinsi: provinsiValue,
      kabupaten: item.name,
      kecamatan: '',
      desa: '',
    });
  };

  const handleSelectDistrict = (item: RegionItem) => {
    setSelectedDisId(item.id);
    setVillages([]);

    onChange({
      provinsi: provinsiValue,
      kabupaten: kabupatenValue,
      kecamatan: item.name,
      desa: '',
    });

    if (onPostalCodeFound) {
      findPostalCode({
        kecamatan: item.name,
        kabupaten: kabupatenValue,
        provinsi: provinsiValue,
      }).then((code) => {
        if (code) onPostalCodeFound(code);
      });
    }
  };

  const handleSelectVillage = (item: RegionItem) => {
    onChange({
      provinsi: provinsiValue,
      kabupaten: kabupatenValue,
      kecamatan: kecamatanValue,
      desa: item.name,
    });

    if (onPostalCodeFound) {
      findPostalCode({
        desa: item.name,
        kecamatan: kecamatanValue,
        kabupaten: kabupatenValue,
        provinsi: provinsiValue,
      }).then((code) => {
        if (code) onPostalCodeFound(code);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Wilayah Administratif Tujuan (Se-Indonesia)</span>
        </div>
        <button
          type="button"
          onClick={() => setIsManualMode(!isManualMode)}
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
        >
          {isManualMode ? (
            <>
              <RotateCcw className="h-3 w-3" /> Pilih dari Database
            </>
          ) : (
            <>
              <Edit2 className="h-3 w-3" /> Input Manual
            </>
          )}
        </button>
      </div>

      {isManualMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Provinsi Tujuan *</label>
            <Input
              value={provinsiValue}
              onChange={(e) =>
                onChange({
                  provinsi: e.target.value,
                  kabupaten: kabupatenValue,
                  kecamatan: kecamatanValue,
                  desa: desaValue,
                })
              }
              placeholder="Contoh: Jawa Tengah"
              disabled={disabled}
              className="h-12 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Kabupaten / Kota Tujuan *</label>
            <Input
              value={kabupatenValue}
              onChange={(e) =>
                onChange({
                  provinsi: provinsiValue,
                  kabupaten: e.target.value,
                  kecamatan: kecamatanValue,
                  desa: desaValue,
                })
              }
              placeholder="Contoh: Kabupaten Cilacap"
              disabled={disabled}
              className="h-12 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Kecamatan Tujuan *</label>
            <Input
              value={kecamatanValue}
              onChange={(e) =>
                onChange({
                  provinsi: provinsiValue,
                  kabupaten: kabupatenValue,
                  kecamatan: e.target.value,
                  desa: desaValue,
                })
              }
              placeholder="Contoh: Gandrungmangu"
              disabled={disabled}
              className="h-12 rounded-xl bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Desa / Kelurahan Tujuan *</label>
            <Input
              value={desaValue}
              onChange={(e) =>
                onChange({
                  provinsi: provinsiValue,
                  kabupaten: kabupatenValue,
                  kecamatan: kecamatanValue,
                  desa: e.target.value,
                })
              }
              placeholder="Contoh: Sampeldes"
              disabled={disabled}
              className="h-12 rounded-xl bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Provinsi */}
          <SearchableRegionSelect
            label="1. Provinsi Tujuan"
            placeholder="-- Pilih Provinsi --"
            searchPlaceholder="Ketik nama provinsi..."
            items={provinces}
            value={provinsiValue}
            onSelect={handleSelectProvince}
            disabled={disabled}
            isLoading={loadingProv}
            required
            emptyText="Provinsi tidak ditemukan"
          />

          {/* 2. Kabupaten / Kota */}
          <SearchableRegionSelect
            label="2. Kabupaten / Kota Tujuan"
            placeholder={!provinsiValue ? 'Pilih provinsi terlebih dahulu' : '-- Pilih Kab/Kota --'}
            searchPlaceholder="Ketik nama kabupaten/kota..."
            items={regencies}
            value={kabupatenValue}
            onSelect={handleSelectRegency}
            disabled={disabled || !provinsiValue}
            isLoading={loadingReg}
            required
            emptyText={!provinsiValue ? 'Pilih provinsi terlebih dahulu' : 'Kabupaten/Kota tidak ditemukan'}
          />

          {/* 3. Kecamatan */}
          <SearchableRegionSelect
            label="3. Kecamatan Tujuan"
            placeholder={!kabupatenValue ? 'Pilih kab/kota terlebih dahulu' : '-- Pilih Kecamatan --'}
            searchPlaceholder="Ketik nama kecamatan..."
            items={districts}
            value={kecamatanValue}
            onSelect={handleSelectDistrict}
            disabled={disabled || !kabupatenValue}
            isLoading={loadingDis}
            required
            emptyText={!kabupatenValue ? 'Pilih kab/kota terlebih dahulu' : 'Kecamatan tidak ditemukan'}
          />

          {/* 4. Desa / Kelurahan */}
          <SearchableRegionSelect
            label="4. Desa / Kelurahan Tujuan"
            placeholder={!kecamatanValue ? 'Pilih kecamatan terlebih dahulu' : '-- Pilih Desa/Kelurahan --'}
            searchPlaceholder="Ketik nama desa/kelurahan..."
            items={villages}
            value={desaValue}
            onSelect={handleSelectVillage}
            disabled={disabled || !kecamatanValue}
            isLoading={loadingVil}
            required
            emptyText={!kecamatanValue ? 'Pilih kecamatan terlebih dahulu' : 'Desa/Kelurahan tidak ditemukan'}
          />
        </div>
      )}
    </div>
  );
}

