import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RecoveryMissionBanner({ mission }) {
  if (!mission) return null;

  const { count, required, maxAmount } = mission;
  const progress = Math.min(count / required, 1);
  const completed = count >= required;

  return (
    <div className={`p-3 rounded-sm border transition-all ${
      completed ? 'border-primary/50 bg-primary/10' : 'border-amber-500/30 bg-amber-500/10'
    }`}>
      <div className="flex items-start gap-2 mb-2">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-body text-xs text-foreground leading-relaxed">
            {completed
              ? 'Mission Complete! Weather cleared! ☀️'
              : `Recovery Mission: Log ${required} expenses under €${maxAmount} to clear the weather!`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 bg-muted rounded-none border border-border overflow-hidden">
          <div className="h-full transition-all duration-500 rounded-none"
            style={{ width: `${progress * 100}%`, backgroundColor: completed ? '#00bf63' : '#f59e0b' }} />
        </div>
        <span className="font-body text-xs text-muted-foreground whitespace-nowrap">{count}/{required}</span>
      </div>
    </div>
  );
}