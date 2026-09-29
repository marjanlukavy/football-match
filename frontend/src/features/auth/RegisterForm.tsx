import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PASSWORD_MIN } from '@futbol/shared/constants';
import { registerSchema } from '@futbol/shared/schemas';
import { useRegister } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormError } from './FormError';

interface RegisterFormProps {
  /** Код із посилання-запрошення. */
  inviteCode: string | undefined;
  onSuccess: () => void;
}

export function RegisterForm({ inviteCode, onSuccess }: RegisterFormProps) {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', login: '', password: '' },
  });

  const submit = handleSubmit((values) => registerUser.mutate({ ...values, inviteCode }, { onSuccess }));

  return (
    <form onSubmit={submit} noValidate className="stagger-children flex flex-col gap-4">
      <Field label="Ім'я та прізвище" error={errors.name?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            autoComplete="name"
            placeholder="Андрій Коваленко"
            autoFocus
            className="h-12"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy}
            {...register('name')}
          />
        )}
      </Field>
      <Field label="Логін" error={errors.login?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="andrii"
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
            autoComplete="new-password"
            placeholder={`Щонайменше ${PASSWORD_MIN} символів`}
            className="h-12 pr-12"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy}
            {...register('password')}
          />
        )}
      </Field>
      <FormError key={registerUser.submittedAt} error={registerUser.error} />
      <Button type="submit" variant="primary" size="lg" loading={registerUser.isPending} className="mt-2 w-full">
        Зареєструватись
      </Button>
    </form>
  );
}
