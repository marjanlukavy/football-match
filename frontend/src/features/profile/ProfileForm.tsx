import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profilePatchSchema } from '@futbol/shared/schemas';
import type { Me } from '@futbol/shared/types';
import { useUpdateProfile } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

export function ProfileForm({ me }: { me: Me }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profilePatchSchema), defaultValues: { name: me.name } });

  const submit = handleSubmit((values) => update.mutate(values, { onSuccess: (saved) => reset({ name: saved.name }) }));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Ім'я та прізвище" error={errors.name?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            autoComplete="name"
            className="h-12"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy}
            {...register('name')}
          />
        )}
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={!isDirty} loading={update.isPending} className="self-start">
        Зберегти
      </Button>
    </form>
  );
}
