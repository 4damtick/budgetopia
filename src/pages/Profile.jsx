import { useState } from 'react';
import { TrendingDown, TrendingUp, Target, BarChart3, Calendar, MessageSquare, Pencil, PiggyBank, Check } from 'lucide-react';
import { getCategoriesWithSpending, getTotalPeriodSpending, calculateBudgetLimit, getSavingsSummary } from '@/lib/gameLogic';

const WEEKLY_DIVISOR = 4;

export default function Profile({ profile, transactions, onProfileChange }) {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(String(profile?.income || ''));
  const [overviewCadence, setOverviewCadence] = useState(profile?.budgetCadence || 'monthly');

  const categories = getCategoriesWithSpending();
  const cadence = profile?.budgetCadence || 'monthly';
  const cadenceLabel = { weekly: 'Week', monthly: 'Month' }[cadence] || 'Month';
  const limit = calculateBudgetLimit(profile);
  const spent = getTotalPeriodSpending(transactions, cadence);
  const remaining = limit - spent;
  const totalExpenses = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const avgExpense = transactions.length > 0 ? totalExpenses / transactions.length : 0;
  const savings = getSavingsSummary();

  const overviewDivisor = overviewCadence === 'weekly' ? WEEKLY_DIVISOR : 1;
  const overviewLabel = overviewCadence === 'weekly' ? 'Weekly' : 'Monthly';
  const totalAllocated = categories.reduce((sum, category) => sum + (category.allocatedAmount || 0), 0);
  const budgetedForPeriod = totalAllocated / overviewDivisor;
  const spentForPeriod = getTotalPeriodSpending(transactions, overviewCadence);
  const overviewPercentage = budgetedForPeriod > 0 ? (spentForPeriod / budgetedForPeriod) * 100 : 0;
  const isOver = overviewPercentage > 100;

  const handleSaveIncome = () => {
    const nextIncome = parseFloat(incomeDraft);
    if (!nextIncome || nextIncome <= 0) return;
    onProfileChange?.({ income: nextIncome });
    setEditingIncome(false);
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <h1 className="font-display text-xs text-foreground">Profile</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-sm border-2 border-border bg-card p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">Income</span>
            </div>
            {!editingIncome ? (
              <button onClick={() => { setIncomeDraft(String(profile?.income || '')); setEditingIncome(true); }} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleSaveIncome} className="text-primary hover:text-primary/80">
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingIncome ? (
            <input type="number" min="1" step="1" value={incomeDraft} onChange={event => setIncomeDraft(event.target.value)}
              className="w-full rounded-sm border-2 border-border bg-muted px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
          ) : (
            <p className="font-body text-lg font-bold text-foreground">€{profile?.income?.toLocaleString() || 0}</p>
          )}
        </div>

        <div className="rounded-sm border-2 border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">Spent</span>
          </div>
          <p className="font-body text-lg font-bold text-foreground">€{totalExpenses.toFixed(0)}</p>
        </div>

        <div className="rounded-sm border-2 border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-secondary" />
            <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">Budget ({cadenceLabel})</span>
          </div>
          <p className={`font-body text-lg font-bold ${remaining < 0 ? 'text-red-500' : 'text-primary'}`}>
            €{remaining.toFixed(0)}
          </p>
        </div>

        <div className="rounded-sm border-2 border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">Avg</span>
          </div>
          <p className="font-body text-lg font-bold text-foreground">€{avgExpense.toFixed(0)}</p>
        </div>
      </div>

      <div className="rounded-sm border-2 border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-primary" />
          <span className="text-[0.55rem] font-heading tracking-wider text-muted-foreground">Total Saved Since Tracking Started</span>
        </div>
        <p className="font-body text-2xl font-bold text-primary">€{savings.totalSaved.toFixed(0)}</p>
        <p className="mt-1 text-[0.55rem] text-muted-foreground">
          {savings.recapsTracked > 0
            ? `${savings.recapsTracked} month${savings.recapsTracked === 1 ? '' : 's'} tracked`
            : 'Tracking starts from this version onward.'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.55rem] font-heading uppercase tracking-wider text-muted-foreground">Budget Overview</p>
          <div className="flex overflow-hidden rounded-sm border-2 border-border bg-muted">
            <button type="button" onClick={() => setOverviewCadence('monthly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                overviewCadence === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Month</button>
            <button type="button" onClick={() => setOverviewCadence('weekly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                overviewCadence === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Week</button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="py-4 text-center text-[0.6rem] text-muted-foreground">No categories set up yet.</p>
        ) : (
          <div className="rounded-sm border-2 border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">{overviewLabel} Spending</span>
              <span className={`font-body text-sm font-bold ${isOver ? 'text-red-500' : 'text-primary'}`}>
                {overviewPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-none border border-border bg-muted">
              <div className="h-full rounded-none transition-all"
                style={{ width: `${Math.min(overviewPercentage, 100)}%`, backgroundColor: isOver ? '#ef4444' : '#00bf63' }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[0.55rem] text-muted-foreground">€{spentForPeriod.toFixed(0)} spent</span>
              <span className="text-[0.55rem] text-muted-foreground">€{budgetedForPeriod.toFixed(0)} budgeted</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <p className="text-[0.55rem] font-heading uppercase tracking-wider text-muted-foreground">Recent Transactions</p>
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-[0.6rem] text-muted-foreground">No expenses logged yet.</p>
        ) : (
          <div className="max-h-60 space-y-1.5 overflow-y-auto">
            {transactions.slice(0, 20).map(transaction => (
              <div key={transaction.id} className="rounded-sm bg-muted px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-[0.55rem] text-foreground">{transaction.category}</p>
                  <span className={`font-heading text-[0.55rem] ${transaction.type === 'credit' ? 'text-primary' : 'text-red-500'}`}>
                    €{Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[0.5rem] text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {transaction.date}
                  </span>
                  {transaction.note && (
                    <span className="flex items-center gap-1 truncate text-[0.5rem] text-muted-foreground">
                      <MessageSquare className="w-3 h-3 shrink-0" /> {transaction.note}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
