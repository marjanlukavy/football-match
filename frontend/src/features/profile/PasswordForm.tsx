import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordChangeSchema } from '@futbol/shared/schemas';
import { useChangePassword } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormError } from '@/features/auth/FormError';

const EMPTY = { currentPassword: '', newPassword: '' };

export function PasswordForm() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordChangeSchema), defaultValues: EMPTY });

  const submit = handleSubmit((values) => change.mutate(values, { onSuccess: () => reset(EMPTY) }));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Поточний пароль" error={errors.currentPassword?.message}>
        {(id, describedBy) => (
          <PasswordInput
            id={id}
            autoComplete="current-password"
            className="h-12 pr-12"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={describedBy}
            {...register('currentPassword')}
          />
        )}
      </Field>
      <Field label="Новий пароль" error={errors.newPassword?.message}>
        {(id, describedBy) => (
          <PasswordInput
            id={id}
            autoComplete="new-password"
            className="h-12 pr-12"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={describedBy}
            {...register('newPassword')}
          />
        )}
      </Field>
      <FormError key={change.submittedAt} error={change.error} />
      <Button type="submit" variant="primary" size="lg" loading={change.isPending} className="self-start">
        Змінити пароль
      </Button>
    </form>
  );
}
