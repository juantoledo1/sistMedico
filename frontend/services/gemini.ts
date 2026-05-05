
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export class GeminiService {
  private static instance: GeminiService;
  private constructor() {}

  static getInstance(): GeminiService {
    if (!this.instance) this.instance = new GeminiService();
    return this.instance;
  }

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getFinancialInsight(transactions: Transaction[]): Promise<string> {
    const ai = this.getAI();
    const summary = transactions.map(t => `${t.date}: ${t.amount} ARS at ${t.institution}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As a financial advisor for doctors, analyze this income history and provide a 2-sentence professional insight in Spanish.
      Data:
      ${summary}`,
      config: {
        systemInstruction: "You are an expert medical financial analyst. Be concise, professional, and encouraging. Focus on trends and status."
      }
    });

    return response.text || "No se pudo generar el análisis financiero.";
  }
}
