import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Link2, RefreshCw } from 'lucide-react';
import { useInvite, useRegenerateInvite } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmModal } from '@/features/games/ConfirmModal';

/** Посилання-запрошення в компанію (лише для організатора). */
export function InviteCard() {
  const { data: invite } = useInvite();
  const regenerate = useRegenerateInvite();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const link = invite ? `${window.location.origin}/register?invite=${encodeURIComponent(invite.code)}` : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Посилання скопійовано — киньте його в чат компанії');
    } catch {
      toast.error('Не вдалося скопіювати — виділіть посилання вручну');
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <CardHeader
        title="Запросити в компанію"
        subtitle="Зареєструватись можна лише за цим посиланням"
        icon={<Link2 className="size-[18px]" />}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 truncate rounded-2xl border border-line bg-white px-4 py-3 font-mono text-xs text-ink/80 select-all">
          {link || 'Завантаження…'}
        </p>
        <div className="flex gap-2">
          <Button variant="primary" size="lg" icon={<Copy className="size-4" />} disabled={!invite} onClick={copy}>
            Скопіювати
          </Button>
          <Button
            variant="ghost"
            size="lg"
            icon={<RefreshCw className="size-4" />}
            disabled={!invite}
            onClick={() => setConfirmOpen(true)}
          >
            Нове
          </Button>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => regenerate.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
        title="Створити нове посилання?"
        description="Старе посилання перестане працювати. Ті, хто вже зареєструвався, нічого не помітять."
        confirmLabel="Створити нове"
        loading={regenerate.isPending}
      />
    </Card>
  );
}
