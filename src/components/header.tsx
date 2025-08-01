import { Logo } from '@/components/icons/logo';
import { Clock } from '@/components/clock';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  return (
    <header className="py-2 px-4 md:px-6 border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold font-headline text-foreground">
            ShuddhAI
          </h1>
        </div>
        <div className="flex-1 flex justify-center px-4">
            <Clock />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
