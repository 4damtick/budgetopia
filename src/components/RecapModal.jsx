import { X, CheckCircle2, TrendingDown, Coins } from 'lucide-react';

export default function RecapModal({ result, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border-t-4 border-secondary w-full max-w-sm rounded-t-xl sm:rounded-xl p-6 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xs text-foreground">Weekly Recap</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-[0.5rem] text-muted-foreground mb-4">
          {result.weekStart} → {result.weekEnd}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted rounded-sm p-3 text-center">
            <p className="font-body text-xs text-muted-foreground">Spent</p>
            <p className="font-body font-bold text-lg text-red-500">€{result.totalSpent.toFixed(0)}</p>
          </div>
          <div className="bg-muted rounded-sm p-3 text-center">
            <p className="font-body text-xs text-muted-foreground">Saved</p>
            <p className="font-body font-bold text-lg text-primary">€{result.saved.toFixed(0)}</p>
          </div>
          <div className="bg-muted rounded-sm p-3 text-center">
            <p className="font-body text-xs text-muted-foreground">Entries</p>
            <p className="font-body font-bold text-lg text-foreground">{result.expenseCount}</p>
          </div>
          <div className="bg-muted rounded-sm p-3 text-center">
            <p className="font-body text-xs text-muted-foreground">Budget</p>
            {result.isUnderBudget ? (
              <CheckCircle2 className="w-6 h-6 text-primary mx-auto mt-1" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500 mx-auto mt-1" />
            )}
          </div>
        </div>

        {Object.keys(result.byCategory).length > 0 && (
          <div className="mb-4">
            <p className="text-[0.55rem] font-heading text-muted-foreground uppercase tracking-wider mb-2">By Category</p>
            <div className="space-y-1">
              {Object.entries(result.byCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{cat}</span>
                  <span className="text-foreground font-bold">€{amt.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.breakdown.length > 0 && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-secondary" />
              <span className="font-display text-[0.6rem] text-secondary-foreground">+{result.rewardPoints} Reward Points!</span>
            </div>
            <div className="space-y-1">
              {result.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.reason}</span>
                  <span className="font-bold text-secondary-foreground">+{b.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.expenseCount === 0 && (
          <p className="text-center text-[0.6rem] text-muted-foreground py-2">No expenses logged this week. Log expenses to earn rewards!</p>
        )}

        <button onClick={onClose}
          className="w-full mt-4 py-3 bg-primary text-primary-foreground font-display text-xs rounded-sm border-b-4 border-primary/70 hover:border-b-2 active:border-b-0 transition-all">
          Done
        </button>
      </div>
    </div>
  );
}