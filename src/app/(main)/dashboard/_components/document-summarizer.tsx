'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { summarizeVillageDocument } from '@/lib/gemini-client';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DocumentSummarizer() {
  const [documentText, setDocumentText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!documentText.trim()) {
      toast({
        title: "Input Kosong",
        description: "Silakan masukkan teks dokumen untuk diringkas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary('');

    try {
      const result = await summarizeVillageDocument({ documentContent: documentText });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing document:', error);
      toast({
        title: "Gagal Meringkas",
        description: "Terjadi kesalahan saat meringkas dokumen. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-[1.4rem] border border-stone-200/90 shadow-xs bg-white overflow-hidden">
      <CardHeader>
        <CardTitle className="font-condensed font-bold uppercase text-slate-900 tracking-tight">Ringkas Dokumen</CardTitle>
        <CardDescription className="text-slate-500 text-xs sm:text-sm">
          Gunakan AI untuk meringkas laporan atau surat resmi menjadi poin-poin penting yang mudah dibaca.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Salin dan tempel konten laporan atau surat di sini..."
          rows={8}
          className="rounded-xl border-stone-200 bg-stone-50/80 focus:ring-teal-500 text-xs sm:text-sm p-3"
          value={documentText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDocumentText(e.target.value)}
          disabled={isLoading}
        />
        <Button 
          onClick={handleSummarize} 
          disabled={isLoading}
          className="bg-[#070b10] hover:bg-[#0c141d] text-teal-400 font-bold uppercase text-xs tracking-wider rounded-full shadow-xs px-6 h-11"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-400" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4 text-teal-400" />
          )}
          Ringkas dengan AI
        </Button>
        {summary && (
          <div className="mt-4 p-5 border border-teal-500/40 rounded-2xl bg-teal-500/10 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">Hasil Ringkasan:</h3>
            <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
