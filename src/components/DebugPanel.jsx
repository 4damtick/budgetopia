import { useState } from 'react';
import { Bug, Trash2, Zap, X, Crown } from 'lucide-react';
import { clearAll } from '@/lib/localStorage';

export default function DebugPanel({ onReset, onTestRecap, onUnlimitedPoints, userTier = 'free', onTogglePremium }) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    clearAll();
    setConfirmReset(false);
    setOpen(false);
    onReset?.();
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-28 left-4 z-50 w-10 h-10 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-600 transition-colors"
        title="Debug"
      >
        <Bug className="w-4 h-4 text-amber-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setConfirmReset(false); }} />
          <div className="relative bg-card border-t-4 border-amber-500 w-full max-w-sm rounded-t-xl sm:rounded-xl p-5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-amber-400" />
                <h2 className="font-display text-xs text-foreground">Debug Panel</h2>
              </div>
              <button onClick={() => { setOpen(false); setConfirmReset(false); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReset}
                className={`w-full p-3 rounded-sm border-2 flex items-center justify-between transition-colors ${
                  confirmReset ? 'border-red-500 bg-red-500/10' : 'border-border bg-muted hover:border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className={`w-4 h-4 ${confirmReset ? 'text-red-400' : 'text-muted-foreground'}`} />
                  <span className={`font-display text-[0.6rem] ${confirmReset ? 'text-red-400' : 'text-foreground'}`}>
                    {confirmReset ? 'Confirm Reset?' : 'Reset All Data'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => { onTestRecap?.(); setOpen(false); }}
                className="w-full p-3 rounded-sm border-2 border-border bg-muted hover:border-amber-500/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-display text-[0.6rem] text-foreground">Trigger Weekly Recap</span>
                </div>
              </button>

              <button
                onClick={() => { onUnlimitedPoints?.(); setOpen(false); }}
                className="w-full p-3 rounded-sm border-2 border-border bg-muted hover:border-primary/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-display text-[0.6rem] text-foreground">Unlimited City Points</span>
                </div>
              </button>

              <button
                onClick={() => { onTogglePremium?.(); }}
                className={`w-full p-3 rounded-sm border-2 transition-colors flex items-center justify-between ${
                  userTier === 'premium'
                    ? 'border-amber-500/50 bg-amber-500/10 hover:border-amber-500/70'
                    : 'border-border bg-muted hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className={`w-4 h-4 ${userTier === 'premium' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  <span className="font-display text-[0.6rem] text-foreground">
                    {userTier === 'premium' ? 'Switch to Free Plan' : 'Upgrade to Premium'}
                  </span>
                </div>
                <span className={`font-heading text-[0.45rem] uppercase ${userTier === 'premium' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {userTier === 'premium' ? 'Premium' : 'Free'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
