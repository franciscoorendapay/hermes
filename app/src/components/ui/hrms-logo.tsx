import { Hexagon, Users } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function HRMSLogo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
        <Hexagon className="w-8 h-8 absolute rotate-90 text-primary/20 fill-primary/10" strokeWidth={1.5} />
        <Users className="w-4 h-4 z-10" />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight text-foreground">
            HRMS
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Navigator
          </span>
        </div>
      )}
    </div>
  );
}
