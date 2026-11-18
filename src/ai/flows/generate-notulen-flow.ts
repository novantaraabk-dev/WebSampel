/**
 * @fileOverview Asisten AI untuk membantu menyusun draf notulen kegiatan desa.
 */

import { generateNotulenWithAI, type GenerateNotulenInput, type GenerateNotulenOutput } from '@/lib/gemini-client';

export type { GenerateNotulenInput, GenerateNotulenOutput };

export async function generateNotulen(input: GenerateNotulenInput): Promise<GenerateNotulenOutput> {
  return generateNotulenWithAI(input);
}
