'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { DataPersil } from '@/types/pertanahan';
import {
  MapPin,
  Search,
  Layers,
  Compass,
  Landmark,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// Dynamic import Leaflet components for SSR safety
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
) as any;
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
) as any;
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
) as any;
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
) as any;

function PetaPersilContent() {
  const db = useFirestore();
  const searchParams = useSearchParams();
  const targetLat = searchParams.get('lat');
  const targetLng = searchParams.get('lng');

  const [persilList, setPersilList] = useState<DataPersil[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [leafletInstance, setLeafletInstance] = useState<any>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    targetLat ? parseFloat(targetLat) : -7.5136,
    targetLng ? parseFloat(targetLng) : 108.8402,
  ]);
  const [mapZoom, setMapZoom] = useState(15);
  const [selectedPersil, setSelectedPersil] = useState<DataPersil | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLayer, setFilterLayer] = useState<'all' | 'darat' | 'sawah' | 'tkd'>('all');
  const [mapTileType, setMapTileType] = useState<'osm' | 'satellite'>('osm');

  // Load Leaflet assets
  useEffect(() => {
    setIsClient(true);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setLeafletInstance(L);
      });
    };
    document.head.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  // Fetch Persil from Firestore
  const fetchPersil = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'data_persil'), orderBy('nomorPersil', 'asc')));
      const list: DataPersil[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setPersilList(list);

      // If lat/lng passed in URL, select that persil
      if (targetLat && targetLng) {
        const found = list.find(
          (p) =>
            Math.abs((p.latitude || 0) - parseFloat(targetLat)) < 0.0001 &&
            Math.abs((p.longitude || 0) - parseFloat(targetLng)) < 0.0001
        );
        if (found) setSelectedPersil(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersil();
  }, [db]);

  // Filtered persil list
  const filteredPersil = useMemo(() => {
    return persilList.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = p.nomorPersil?.toLowerCase().includes(q);
        const matchC = p.nomorCDesa?.toLowerCase().includes(q);
        const matchNama = p.pemilikNama?.toLowerCase().includes(q);
        const matchDusun = p.dusun?.toLowerCase().includes(q);
        if (!matchNo && !matchC && !matchNama && !matchDusun) return false;
      }

      if (filterLayer === 'darat' && p.jenisTanah !== 'darat') return false;
      if (filterLayer === 'sawah' && p.jenisTanah !== 'sawah') return false;
      if (filterLayer === 'tkd' && p.kategoriTanah !== 'tkd_bengkok') return false;

      return true;
    });
  }, [persilList, searchQuery, filterLayer]);

  // Persil with valid coordinates
  const mappedPersil = useMemo(() => {
    return filteredPersil.filter((p) => p.latitude && p.longitude);
  }, [filteredPersil]);

  const handleFocusPersil = (p: DataPersil) => {
    if (p.latitude && p.longitude) {
      setMapCenter([p.latitude, p.longitude]);
      setMapZoom(18);
      setSelectedPersil(p);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="neu-convex p-6 rounded-[28px] border border-white/60 dark:border-white/10 shadow-[10px_10px_24px_rgba(165,155,140,0.35),-10px_-10px_24px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                Sistem Informasi Geografis (GIS)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Peta Bidang Desa
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-condensed tracking-tight">
              PETA BIDANG PERSIL DESA SAMPELDES
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Visualisasi pemetaan spasial objek bidang tanah (Persil Darat & Sawah) terintegrasi dengan data yuridis Buku C-Desa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/manajemen/pertanahan/persil">
              <Button
                variant="outline"
                className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider"
              >
                &larr; Data Persil
              </Button>
            </Link>
            <Link href="/manajemen/pertanahan/cdesa">
              <Button
                variant="outline"
                className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider"
              >
                Buku C-Desa &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter layer buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-300/60 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-condensed font-bold uppercase text-slate-500">Layer Tanah:</span>
            <Button
              size="sm"
              variant={filterLayer === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterLayer('all')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Semua ({persilList.length})
            </Button>
            <Button
              size="sm"
              variant={filterLayer === 'darat' ? 'default' : 'outline'}
              onClick={() => setFilterLayer('darat')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Darat / Pekarangan
            </Button>
            <Button
              size="sm"
              variant={filterLayer === 'sawah' ? 'default' : 'outline'}
              onClick={() => setFilterLayer('sawah')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Sawah / Pertanian
            </Button>
            <Button
              size="sm"
              variant={filterLayer === 'tkd' ? 'default' : 'outline'}
              onClick={() => setFilterLayer('tkd')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Tanah Kas Desa (TKD)
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-condensed font-bold uppercase text-slate-500">Peta Dasar:</span>
            <Button
              size="sm"
              variant={mapTileType === 'osm' ? 'default' : 'outline'}
              onClick={() => setMapTileType('osm')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Standar OSM
            </Button>
            <Button
              size="sm"
              variant={mapTileType === 'satellite' ? 'default' : 'outline'}
              onClick={() => setMapTileType('satellite')}
              className="h-8 text-xs font-condensed font-bold uppercase rounded-xl"
            >
              Citra Satelit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Map & Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[620px]">
        {/* Left Side Panel: Persil List */}
        <div className="lg:col-span-1 neu-convex p-4 rounded-[24px] border border-white/60 dark:border-white/10 shadow-[8px_8px_20px_rgba(165,155,140,0.3)] flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari Persil, Pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 neu-inset bg-white/50 dark:bg-black/20"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-condensed text-slate-500 font-bold px-1">
            <span>DAFTAR PERSIL ({filteredPersil.length})</span>
            <span>{mappedPersil.length} Berkoordinat</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
            {filteredPersil.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-condensed">
                Tidak ada bidang persil yang cocok.
              </div>
            ) : (
              filteredPersil.map((p) => {
                const hasCoord = !!(p.latitude && p.longitude);
                const isSelected = selectedPersil?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleFocusPersil(p)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 dark:bg-amber-950/50 shadow-sm'
                        : 'bg-white/40 dark:bg-black/20 border-white/60 hover:bg-white/80 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-condensed font-extrabold text-slate-800 dark:text-slate-100">
                        Persil {p.nomorPersil}
                      </span>
                      {hasCoord ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 text-[9px] py-0 px-1 font-mono">
                          GIS Terdata
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 text-slate-400">
                          Tanpa Koordinat
                        </Badge>
                      )}
                    </div>

                    <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                      {p.pemilikNama}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>Kelas {p.kelasTanah}</span>
                      <span>{Number(p.luasM2).toLocaleString('id-ID')} m²</span>
                    </div>

                    {hasCoord && (
                      <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1 font-condensed">
                        <MapPin className="h-3 w-3" />
                        Klik untuk fokus ke peta
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Interactive Leaflet Map */}
        <div className="lg:col-span-3 neu-convex rounded-[28px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[10px_10px_24px_rgba(165,155,140,0.35)] relative min-h-[500px]">
          {!isClient || !leafletInstance || loading ? (
            <div className="h-full w-full min-h-[550px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-600 mb-2" />
              <p className="font-condensed font-bold text-xs uppercase tracking-wider text-slate-600">
                Memuat Layer Peta GIS Desa Sampeldes...
              </p>
            </div>
          ) : (
            <div className="h-full w-full min-h-[550px]">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', minHeight: '550px', width: '100%' }}
                className="z-0"
              >
                {mapTileType === 'osm' ? (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    maxZoom={19}
                  />
                )}

                {/* Persil Markers */}
                {mappedPersil.map((p) => {
                  const pos: [number, number] = [p.latitude!, p.longitude!];
                  return (
                    <Marker key={p.id} position={pos}>
                      <Popup>
                        <div className="p-2 space-y-2 max-w-[260px] font-sans">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-condensed font-black text-sm text-slate-900">
                              PERSIL {p.nomorPersil}
                            </span>
                            {p.nomorCDesa && (
                              <Badge className="bg-amber-600 text-white font-mono text-[10px]">
                                C. {p.nomorCDesa}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-0.5 text-xs text-slate-700">
                            <div>
                              <span className="text-slate-500">Pemilik:</span>{' '}
                              <strong>{p.pemilikNama}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Kelas / Jenis:</span>{' '}
                              <strong>Kelas {p.kelasTanah}</strong> ({p.jenisTanah})
                            </div>
                            <div>
                              <span className="text-slate-500">Luas Tanah:</span>{' '}
                              <strong className="font-mono text-emerald-700">
                                {Number(p.luasM2).toLocaleString('id-ID')} m²
                              </strong>{' '}
                              ({(Number(p.luasM2) / 10000).toFixed(4)} Ha)
                            </div>
                            <div>
                              <span className="text-slate-500">Lokasi:</span>{' '}
                              {p.dusun} RT {p.rt}/RW {p.rw}
                            </div>
                          </div>

                          <div className="pt-1.5 border-t text-[11px] space-y-1">
                            <div className="text-[10px] text-slate-500">
                              Batas: U: {p.batasUtara || '-'} | S: {p.batasSelatan || '-'}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <Link
                                href={`/manajemen/pertanahan/persil`}
                                className="text-[11px] font-bold text-amber-700 hover:underline"
                              >
                                Detail Persil &rarr;
                              </Link>
                              {p.nomorCDesa && (
                                <Link
                                  href={`/manajemen/pertanahan/cdesa?nomorC=${p.nomorCDesa}`}
                                  className="text-[11px] font-bold text-sky-700 hover:underline"
                                >
                                  Buku C &rarr;
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PetaPersilPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-condensed">Memuat Peta Persil GIS...</div>}>
      <PetaPersilContent />
    </Suspense>
  );
}
