import { Sparkles } from 'lucide-react';

const AppLogo = () => {
  return (
    <div className="flex items-center gap-2" aria-label="DataFill Logo">
      <Sparkles className="h-7 w-7 text-primary" />
      <span className="text-2xl font-semibold tracking-tight text-foreground">
        DataFill
      </span>
    </div>
  );
};

export default AppLogo;
