import { Hono } from 'hono';
import {
  loginSchema,
  passwordChangeSchema,
  profilePatchSchema,
  registerSchema,
  registrationQuerySchema,
} from '@futbol/shared/schemas';
import type { RegistrationStatus } from '@futbol/shared/types';
import { deleteOtherSessions, deleteSession } from '../auth/sessions';
import { parse, parseBody, requireMe, type AppEnv } from '../http/context';
import { clearSessionCookie, startSession } from '../http/session';
import * as auth from '../services/auth';
import * as invites from '../services/invites';

export const authRoutes = new Hono<AppEnv>()
  // Сторінка реєстрації питає заздалегідь, щоб не показувати форму за мертвим посиланням.
  .get('/auth/registration', async (c) => {
    const { invite } = parse(registrationQuerySchema, c.req.query());
    return c.json<RegistrationStatus>({ open: await invites.isRegistrationOpen(c.var.db, invite) });
  })
  .post('/auth/register', async (c) => {
    const me = await auth.register(c.var.db, await parseBody(c, registerSchema));
    await startSession(c, me.id);
    return c.json(me, 201);
  })
  .post('/auth/login', async (c) => {
    const me = await auth.login(c.var.db, await parseBody(c, loginSchema));
    await startSession(c, me.id);
    return c.json(me);
  })
  .post('/auth/logout', async (c) => {
    const token = c.var.sessionToken;
    if (token) await deleteSession(c.var.db, token);
    clearSessionCookie(c);
    return c.body(null, 204);
  })
  // Без сесії — 200 і null: це не помилка, а «гість».
  .get('/me', (c) => c.json(c.var.me))
  .patch('/me', async (c) => {
    const me = await auth.updateProfile(c.var.db, requireMe(c), await parseBody(c, profilePatchSchema));
    return c.json(me);
  })
  .get('/invite', async (c) => c.json(await invites.getInvite(c.var.db, requireMe(c))))
  .post('/invite', async (c) => c.json(await invites.regenerateInvite(c.var.db, requireMe(c))))
  .put('/me/password', async (c) => {
    const me = requireMe(c);
    await auth.changePassword(c.var.db, me, await parseBody(c, passwordChangeSchema));
    await deleteOtherSessions(c.var.db, me.id, c.var.sessionToken!);
    return c.body(null, 204);
  });
