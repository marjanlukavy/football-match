import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { useLogout, useMe } from '@/api/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { SkillMeter } from '@/components/ui/SkillMeter';
import { PageLoader } from '@/components/ui/States';
import { PasswordForm } from '@/features/profile/PasswordForm';
import { ProfileForm } from '@/features/profile/ProfileForm';

export default function ProfilePage() {
  const { data: me } = useMe();
  const logout = useLogout();

  if (!me) return <PageLoader />;

  return (
    <div className="flex max-w-3xl animate-fade-up flex-col gap-6">
      <header className="flex items-center gap-4">
        <Avatar player={me} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight text-ink sm:text-4xl">{me.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/60">
            <span>@{me.login}</span>
            <Badge tone={me.role === 'admin' ? 'dark' : 'neutral'}>{me.role === 'admin' ? 'Організатор' : 'Гравець'}</Badge>
            <SkillMeter value={me.skill} showLabel />
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <CardHeader title="Мої дані" icon={<UserRound className="size-[18px]" />} />
          <ProfileForm me={me} />
        </Card>
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <CardHeader title="Пароль" icon={<KeyRound className="size-[18px]" />} />
          <PasswordForm />
        </Card>
      </div>

      <Button
        variant="danger"
        size="lg"
        icon={<LogOut className="size-4" />}
        loading={logout.isPending}
        onClick={() => logout.mutate()}
        className="self-start"
      >
        Вийти
      </Button>
    </div>
  );
}
