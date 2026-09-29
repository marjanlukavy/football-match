import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/States';

export default function NotFoundPage() {
  return (
    <EmptyState
      className="min-h-[60vh] justify-center"
      icon={<Compass className="size-6" />}
      title="Сторінку не знайдено"
      description="Схоже, м'яч вилетів за межі поля."
      action={
        <Link to="/" className="text-sm font-semibold text-accent hover:underline">
          До календаря
        </Link>
      }
    />
  );
}
