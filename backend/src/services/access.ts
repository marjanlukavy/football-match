import { ApiError } from '@futbol/shared/errors';
import type { Player } from '@futbol/shared/types';

export function requireAdmin(me: Player) {
  if (me.role !== 'admin') throw new ApiError('FORBIDDEN', 'Це може зробити лише організатор');
}
