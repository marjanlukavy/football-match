import { ApiError } from '@futbol/shared/errors';

export { ApiError };
export type { ApiErrorCode } from '@futbol/shared/errors';

/** Запит не дійшов до сервера (немає мережі, сервер лежить). */
export class NetworkError extends Error {
  constructor() {
    super('Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз');
    this.name = 'NetworkError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return 'Щось пішло не так. Спробуйте ще раз.';
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'UNAUTHORIZED';
}
