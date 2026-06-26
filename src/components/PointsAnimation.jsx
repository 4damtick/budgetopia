import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';

export default function PointsAnimation({ points, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div className="animate-in zoom-in fade-in duration-300">
        <div className="bg-card border-4 border-secondary rounded-sm px-6 py-4 shadow-2xl animate-bounce text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="w-6 h-6 text-secondary animate-spin" style={{ animationDuration: '1s' }} />
            <span className="font-display text-lg text-secondary">+{points}</span>
          </div>
          <p className="font-display text-[0.45rem] text-muted-foreground">City Points!</p>
        </div>
      </div>
    </div>
  );
}