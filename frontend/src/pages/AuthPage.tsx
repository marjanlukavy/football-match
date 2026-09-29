import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams, type Location } from 'react-router-dom';
import { MailQuestion } from 'lucide-react';
import { useMe, useRegistrationStatus } from '@/api/hooks';
import { Logo } from '@/components/layout/Logo';
import { AutoHeight } from '@/components/ui/AutoHeight';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState, PageLoader } from '@/components/ui/States';
import { LoginForm } from '@/features/auth/LoginForm';
import { RegisterForm } from '@/features/auth/RegisterForm';

type Mode = 'login' | 'register';

const MODES = [
  { value: 'login', label: 'Вхід' },
  { value: 'register', label: 'Реєстрація' },
] as const;

/**
 * /login і /register — окремі адреси. Реєстрація працює лише за посиланням-запрошенням
 * (/register?invite=…), яке організатор бере на сторінці «Гравці».
 */
export default function AuthPage({ mode }: { mode: Mode }) {
  const { data: me, isPending } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const inviteCode = params.get('invite') ?? undefined;
  const registration = useRegistrationStatus(inviteCode, mode === 'register');

  // Вміст виїжджає з боку обраної вкладки; на першій появі — без зсуву (там своя анімація).
  const [shown, setShown] = useState({ mode, switched: false });
  if (shown.mode !== mode) setShown({ mode, switched: true });
  const slide = shown.switched ? (mode === 'register' ? 'animate-slide-from-right' : 'animate-slide-from-left') : '';

  // Куди повернутись після входу — туди, куди людина йшла до редиректу на /login.
  const from = (location.state as { from?: Location } | null)?.from;
  const target = from ? `${from.pathname}${from.search}` : '/';

  if (me) return <Navigate to={target} replace />;

  const done = () => navigate(target, { replace: true });
  // Перемикання вкладок зберігає ?invite, щоб можна було повернутись до реєстрації.
  const switchMode = (next: Mode) =>
    navigate({ pathname: `/${next}`, search: location.search }, { state: location.state, replace: true });

  const renderRegister = () => {
    if (registration.isPending) return <PageLoader />;
    if (!registration.data?.open) {
      return (
        <EmptyState
          className="py-4"
          icon={<MailQuestion className="size-6" />}
          title={inviteCode ? 'Посилання вже не діє' : 'Реєстрація за запрошенням'}
          description="Попросіть в організатора посилання для реєстрації."
          action={
            <Link to="/login" className="text-sm font-semibold text-accent hover:underline">
              У мене вже є акаунт
            </Link>
          }
        />
      );
    }
    return <RegisterForm inviteCode={inviteCode} onSuccess={done} />;
  };

  return (
    <div className="h-full p-2 sm:p-3">
      <main className="canvas-gradient scrollbar-thin flex h-full overflow-y-auto rounded-card">
        <div className="m-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-10">
          <div className="animate-rise rounded-card bg-rail px-5 py-3">
            <Logo rollKey={mode} />
          </div>
          <Card className="w-full animate-rise p-6 [animation-delay:90ms] sm:p-8">
            {isPending ? (
              <PageLoader />
            ) : (
              <>
                <div className="mb-6 flex justify-center">
                  <SegmentedControl ariaLabel="Вхід або реєстрація" value={mode} options={MODES} onChange={switchMode} />
                </div>
                <AutoHeight>
                  <div key={mode} className={slide}>
                    {mode === 'login' ? <LoginForm onSuccess={done} /> : renderRegister()}
                  </div>
                </AutoHeight>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
