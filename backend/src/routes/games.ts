import { Hono } from 'hono';
import {
  attendanceSchema,
  dutyKindSchema,
  dutySchema,
  gameInputSchema,
  gamesQuerySchema,
  teamsDrawInputSchema,
} from '@futbol/shared/schemas';
import { parse, parseBody, requireMe, type AppEnv } from '../http/context';
import * as games from '../services/games';

export const gameRoutes = new Hono<AppEnv>()
  .get('/games', async (c) => {
    requireMe(c);
    const query = parse(gamesQuerySchema, c.req.query());
    return c.json(await games.listGames(c.var.db, query));
  })
  .get('/games/:id', async (c) => {
    requireMe(c);
    return c.json(await games.getGame(c.var.db, c.req.param('id')));
  })
  .post('/games', async (c) => {
    const input = await parseBody(c, gameInputSchema);
    return c.json(await games.createGame(c.var.db, requireMe(c), input), 201);
  })
  .put('/games/:id', async (c) => {
    const input = await parseBody(c, gameInputSchema);
    return c.json(await games.updateGame(c.var.db, requireMe(c), c.req.param('id'), input));
  })
  .delete('/games/:id', async (c) => {
    await games.deleteGame(c.var.db, requireMe(c), c.req.param('id'));
    return c.body(null, 204);
  })
  .put('/games/:id/attendance', async (c) => {
    const { status } = await parseBody(c, attendanceSchema);
    return c.json(await games.setAttendance(c.var.db, requireMe(c), c.req.param('id'), status));
  })
  .delete('/games/:id/attendance', async (c) =>
    c.json(await games.cancelAttendance(c.var.db, requireMe(c), c.req.param('id'))),
  )
  .put('/games/:id/duties/:kind', async (c) => {
    const kind = parse(dutyKindSchema, c.req.param('kind'));
    const { playerId } = await parseBody(c, dutySchema);
    return c.json(await games.setDuty(c.var.db, requireMe(c), c.req.param('id'), kind, playerId));
  })
  .put('/games/:id/teams', async (c) => {
    const draw = await parseBody(c, teamsDrawInputSchema);
    return c.json(await games.saveTeams(c.var.db, requireMe(c), c.req.param('id'), draw));
  })
  .delete('/games/:id/teams', async (c) =>
    c.json(await games.clearTeams(c.var.db, requireMe(c), c.req.param('id'))),
  );
