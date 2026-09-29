import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/** scrypt з вбудованого crypto: без нативних залежностей, стійкий до перебору на GPU. */
const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Формат: scrypt$N$r$p$сіль$хеш (base64). Параметри зберігаються, щоб їх можна було змінити згодом. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Хеш-заглушка: коли логіна не існує, все одно рахуємо scrypt,
 * щоб за часом відповіді не можна було перевірити, чи є такий користувач.
 */
export const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));
