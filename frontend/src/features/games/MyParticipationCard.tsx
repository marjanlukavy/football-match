import { UserCheck } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { getRegistration, isRegistrationOpen } from '@futbol/shared/game';
import type { Game, PlayerId } from '@futbol/shared/types';
import { AttendanceControls } from './AttendanceControls';

function statusText(game: Game, meId: PlayerId | undefined): string {
  const status = getRegistration(game, meId)?.status;
  if (!isRegistrationOpen(game)) return status ? 'Ви були в списку на цю гру' : 'Ви не записувались на цю гру';
  if (status === 'confirmed') return 'Ви в складі — до зустрічі на полі';
  if (status === 'maybe') return 'Ви під питанням. Підтвердьте, щойно знатимете напевно';
  return 'Ви ще не записались';
}

export function MyParticipationCard({ game, meId }: { game: Game; meId: PlayerId | undefined }) {
  return (
    <Card className="p-5">
      <CardHeader icon={<UserCheck className="size-4" />} title="Моя участь" subtitle={statusText(game, meId)} />
      <AttendanceControls game={game} meId={meId} size="sm" className="mt-4" />
    </Card>
  );
}
