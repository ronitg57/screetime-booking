'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending alternative time slots or nearby screens
 *  to maximize coverage and reduce redundancy during high demand.
 *
 * - recommendTimeSlots - A function that takes screen selection, date, and time period as input and recommends alternative options.
 * - RecommendTimeSlotsInput - The input type for the recommendTimeSlots function.
 * - RecommendTimeSlotsOutput - The return type for the recommendTimeSlots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendTimeSlotsInputSchema = z.object({
  selectedScreen: z.string().describe('The ID of the screen selected by the user.'),
  selectedDate: z.string().describe('The date selected by the user (YYYY-MM-DD).'),
  selectedTimePeriod: z.string().describe('The time period selected by the user (e.g., 4th period class).'),
  nearbyScreens: z.array(z.string()).describe('List of nearby screen IDs.'),
  demandLevel: z.enum(['low', 'medium', 'high']).describe('Current demand level for screen bookings.'),
});
export type RecommendTimeSlotsInput = z.infer<typeof RecommendTimeSlotsInputSchema>;

const RecommendTimeSlotsOutputSchema = z.object({
  alternativeTimeSlots: z.array(z.string()).describe('Recommended alternative time slots (e.g., 5th period class, 7th period class).'),
  nearbyScreenRecommendations: z.array(z.string()).describe('Recommended nearby screen IDs.'),
  reasoning: z.string().describe('Explanation for the recommendations.'),
});
export type RecommendTimeSlotsOutput = z.infer<typeof RecommendTimeSlotsOutputSchema>;

export async function recommendTimeSlots(input: RecommendTimeSlotsInput): Promise<RecommendTimeSlotsOutput> {
  return recommendTimeSlotsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTimeSlotsPrompt',
  input: {schema: RecommendTimeSlotsInputSchema},
  output: {schema: RecommendTimeSlotsOutputSchema},
  prompt: `You are an AI assistant designed to recommend alternative time slots or nearby screens when the demand for the selected screen and time is high.

  The user has selected Screen: {{{selectedScreen}}}, Date: {{{selectedDate}}}, Time Period: {{{selectedTimePeriod}}}.
  Current demand level is: {{{demandLevel}}}.
  Nearby screens are: {{#each nearbyScreens}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

  Based on this information, provide recommendations for alternative time slots and/or nearby screens to maximize coverage and reduce potential redundancy.

  Reason your decision step-by-step, then provide the recommendations in the following JSON format:
  {
    "alternativeTimeSlots": ["List of alternative time slots"],
    "nearbyScreenRecommendations": ["List of nearby screen IDs"],
    "reasoning": "Explanation of why these recommendations are being made."
  }
  `,
});

const recommendTimeSlotsFlow = ai.defineFlow(
  {
    name: 'recommendTimeSlotsFlow',
    inputSchema: RecommendTimeSlotsInputSchema,
    outputSchema: RecommendTimeSlotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
