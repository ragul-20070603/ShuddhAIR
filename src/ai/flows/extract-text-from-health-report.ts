'use server';
/**
 * @fileOverview An AI agent that extracts text from a health report image or PDF.
 *
 * - extractTextFromHealthReport - A function that handles the text extraction process.
 * - ExtractTextFromHealthReportInput - The input type for the function.
 * - ExtractTextFromHealthReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromHealthReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A health report file (image or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTextFromHealthReportInput = z.infer<typeof ExtractTextFromHealthReportInputSchema>;

const ExtractTextFromHealthReportOutputSchema = z.object({
  extractedText: z.string().describe('The full text extracted from the health report.'),
});
export type ExtractTextFromHealthReportOutput = z.infer<typeof ExtractTextFromHealthReportOutputSchema>;

export async function extractTextFromHealthReport(
  input: ExtractTextFromHealthReportInput
): Promise<ExtractTextFromHealthReportOutput> {
  return extractTextFromHealthReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextFromHealthReportPrompt',
  input: {schema: ExtractTextFromHealthReportInputSchema},
  output: {schema: ExtractTextFromHealthReportOutputSchema},
  prompt: `You are an expert OCR (Optical Character Recognition) tool specialized in medical documents.

  Extract all the text from the following document. Maintain the structure and formatting as much as possible.

  Document: {{media url=reportDataUri}}`,
});

const extractTextFromHealthReportFlow = ai.defineFlow(
  {
    name: 'extractTextFromHealthReportFlow',
    inputSchema: ExtractTextFromHealthReportInputSchema,
    outputSchema: ExtractTextFromHealthReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
