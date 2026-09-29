import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@futbol/shared/schemas';
import { useLogin } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormError } from './FormError';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { login: '', password: '' } });

  const submit = handleSubmit((values) => login.mutate(values, { onSuccess }));

  return (
    <form onSubmit={submit} noValidate className="stagger-children flex flex-col gap-4">
      <Field label="Логін" error={errors.login?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            className="h-12"
            aria-invalid={Boolean(errors.login)}
            aria-describedby={describedBy}
            {...register('login')}
          />
        )}
      </Field>
      <Field label="Пароль" error={errors.password?.message}>
        {(id, describedBy) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            className="h-12 pr-12"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy}
            {...register('password')}
          />
        )}
      </Field>
      <FormError key={login.submittedAt} error={login.error} />
      <Button type="submit" variant="primary" size="lg" loading={login.isPending} className="mt-2 w-full">
        Увійти
      </Button>
    </form>
  );
}
