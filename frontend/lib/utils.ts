import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number, 
  compact: boolean = false,
  locale: string = 'es-AR'
): string {
  // Always use full format with dots for thousands (Argentine pesos)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatCurrencyFull(amount: number, locale: string = 'es-AR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}