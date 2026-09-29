/**
 * Українська множина: plural(5, ['гравець', 'гравці', 'гравців']) → «гравців».
 */
export function plural(n: number, forms: readonly [one: string, few: string, many: string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const PLAYER_FORMS = ['гравець', 'гравці', 'гравців'] as const;
export const SPOT_FORMS = ['місце', 'місця', 'місць'] as const;
export const GAME_FORMS = ['гра', 'гри', 'ігор'] as const;
