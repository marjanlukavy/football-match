import type { Context } from 'hono';
import { z } from 'zod';
import { ApiError } from '@futbol/shared/errors';
import type { Me } from '@futbol/shared/types';
import type { Db } from '../db/client';

// Стандартні повідомлення zod — українською (свої тексти задані прямо в схемах).
z.config(z.locales.uk());

export interface AppEnv {
  Variables: {
    db: Db;
    secureCookies: boolean;
    me: Me | null;
    sessionToken: string | null;
  };
}

export type AppContext = Context<AppEnv>;

export function requireMe(c: AppContext): Me {
  const me = c.get('me');
  if (!me) throw new ApiError('UNAUTHORIZED', 'Увійдіть, щоб продовжити');
  return me;
}

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiError('VALIDATION', result.error.issues[0]?.message ?? 'Некоректні дані');
  return result.data;
}

export async function parseBody<S extends z.ZodType>(c: AppContext, schema: S): Promise<z.output<S>> {
  const data: unknown = await c.req.json().catch(() => undefined);
  return parse(schema, data);
}
