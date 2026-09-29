import { httpApi } from './httpApi';
import type { Api } from './types';

export const api: Api = httpApi;

export type { Api, GamesQuery } from './types';
export { ApiError, getErrorMessage, isUnauthorized } from './errors';
