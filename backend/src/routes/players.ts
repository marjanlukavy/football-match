import { Hono } from 'hono';
import { playerPatchSchema } from '@futbol/shared/schemas';
import { parseBody, requireMe, type AppEnv } from '../http/context';
import * as players from '../services/players';

export const playerRoutes = new Hono<AppEnv>()
  .get('/players', async (c) => {
    requireMe(c);
    return c.json(await players.listPlayers(c.var.db));
  })
  .patch('/players/:id', async (c) => {
    const patch = await parseBody(c, playerPatchSchema);
    return c.json(await players.updatePlayer(c.var.db, requireMe(c), c.req.param('id'), patch));
  });
