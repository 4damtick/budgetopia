import { useState, useMemo } from 'react';
import { Plus, Trash2, Coins, TrendingUp, Save, ArrowLeft, Calendar, MessageSquare, Pencil, Lock, Crown } from 'lucide-react';

const FREE_CATEGORY_LIMIT = 2;
import { addCategory, deleteCategory, getCategories, updateCategory, updateTransaction, deleteTransaction, deleteTransactionsByCategory } from '@/lib/localStorage';
import { getBudgetCategoriesWithSummary, getTransactionsByCategory, getPeriodExpenses } from '@/lib/gameLogic';

const WEEKLY_DIVISOR = 4;

export default function Budget({ profile, transactions, refresh, userTier = 'free' }) {
  const [categories, setCategories] = useState(getCategories());
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewCadence, setViewCadence] = useState(profile?.budgetCadence || 'monthly');
  const [editTxnId, setEditTxnId] = useState(null);
  const [editTxnAmount, setEditTxnAmount] = useState('');
  const [editTxnDate, setEditTxnDate] = useState('');
  const [editTxnNote, setEditTxnNote] = useState('');
  const [editTxnIsCredit, setEditTxnIsCredit] = useState(false);

  const monthlyIncome = profile?.income || 0;
  const { categories: categoriesWithSpending, uncategorized } = getBudgetCategoriesWithSummary();

  const periodSpending = useMemo(() => {
    const map = {};
    getPeriodExpenses(transactions, viewCadence).forEach(t => {
      map[t.category] = (map[t.category] || 0) + (t.amount || 0);
    });
    return map;
  }, [transactions, viewCadence]);

  const cadenceDivisor = viewCadence === 'weekly' ? WEEKLY_DIVISOR : 1;
  const cadenceLabel = viewCadence === 'weekly' ? 'Weekly' : 'Monthly';
  const totalAllocated = categories.reduce((sum, category) => sum + (category.allocatedAmount || 0), 0);
  const remaining = monthlyIncome - totalAllocated;

  const syncCategories = () => {
    setCategories(getCategories());
    refresh();
  };

  const isPremium = userTier === 'premium';
  const atFreeLimit = !isPremium && categories.length >= FREE_CATEGORY_LIMIT;

  const handleAdd = () => {
    if (atFreeLimit) {
      setError('Free plan limited to 2 categories. Upgrade to Premium.');
      return;
    }

    if (!newName.trim()) {
      setError('Enter a name.');
      return;
    }

    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    if (totalAllocated + amount > monthlyIncome) {
      setError(`Exceeds €${monthlyIncome} budget.`);
      return;
    }

    addCategory({ name: newName.trim(), allocatedAmount: amount });
    setNewName('');
    setNewAmount('');
    setError('');
    syncCategories();
  };

  const handleDelete = (id) => {
    const cat = categories.find(c => c.id === id);
    if (cat) deleteTransactionsByCategory(cat.name);
    deleteCategory(id);
    syncCategories();
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setEditName(category.name);
    setEditAmount(String(category.allocatedAmount));
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) return;

    const othersTotal = categories
      .filter(category => category.id !== editId)
      .reduce((sum, category) => sum + (category.allocatedAmount || 0), 0);

    if (othersTotal + amount > monthlyIncome) {
      setError(`Exceeds €${monthlyIncome} budget.`);
      return;
    }

    updateCategory(editId, { name: editName.trim(), allocatedAmount: amount });
    setEditId(null);
    setError('');
    syncCategories();
  };

  const handleEditTxn = (txn) => {
    setEditTxnId(txn.id);
    setEditTxnAmount(String(Math.abs(txn.amount)));
    setEditTxnDate(txn.date);
    setEditTxnNote(txn.note || '');
    setEditTxnIsCredit(txn.type === 'credit');
  };

  const handleSaveTxn = () => {
    const amt = parseFloat(editTxnAmount);
    if (!amt || amt <= 0) return;
    updateTransaction(editTxnId, {
      amount: editTxnIsCredit ? -amt : amt,
      date: editTxnDate,
      note: editTxnNote,
    });
    setEditTxnId(null);
    syncCategories();
  };

  const handleDeleteTxn = (txnId) => {
    deleteTransaction(txnId);
    syncCategories();
  };

  if (selectedCategory) {
    const isUncategorized = selectedCategory === uncategorized.id;
    const categoryTransactions = isUncategorized
      ? uncategorized.transactions
      : getTransactionsByCategory(selectedCategory);
    const category = categoriesWithSpending.find(item => item.name === selectedCategory);
    const categorySpent = isUncategorized
      ? (periodSpending[''] || 0)
      : (periodSpending[selectedCategory] || 0);
    const categoryBudget = (category?.allocatedAmount || 0) / cadenceDivisor;
    const title = isUncategorized ? 'Uncategorized' : selectedCategory;

    return (
      <div className="space-y-4 px-4 py-4">
        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-body text-sm">Back</span>
        </button>
        <div className="flex justify-center">
          <div className="flex overflow-hidden rounded-sm border-2 border-border bg-muted">
            <button type="button" onClick={() => setViewCadence('monthly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                viewCadence === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Month</button>
            <button type="button" onClick={() => setViewCadence('weekly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                viewCadence === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Week</button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-display text-xs text-foreground">{title}</h1>
          {isUncategorized ? (
            <p className="mt-1 font-body text-sm text-muted-foreground">No budget set</p>
          ) : (
            <div className="mt-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-body text-sm text-muted-foreground">Budget: €{categoryBudget.toFixed(2)}</span>
                <span className="font-body text-sm text-muted-foreground">|</span>
                <span className={`font-body text-sm font-bold ${categorySpent > categoryBudget ? 'text-red-500' : 'text-primary'}`}>
                  Spent: €{categorySpent.toFixed(0)}
                </span>
              </div>
              <div className="mx-auto mt-2 h-2.5 max-w-xs overflow-hidden rounded-none border border-border bg-muted">
                <div className="h-full rounded-none transition-all"
                  style={{
                    width: `${categoryBudget > 0 ? Math.min((categorySpent / categoryBudget) * 100, 100) : 0}%`,
                    backgroundColor: categorySpent > categoryBudget ? '#ef4444' : '#00bf63',
                  }} />
              </div>
            </div>
          )}
        </div>

        <div className="max-h-96 space-y-1.5 overflow-y-auto">
          {categoryTransactions.length === 0 ? (
            <p className="py-4 text-center text-[0.6rem] text-muted-foreground">No transactions yet.</p>
          ) : (
            categoryTransactions.map(transaction => {
              const isCredit = transaction.type === 'credit';
              if (editTxnId === transaction.id) {
                return (
                  <div key={transaction.id} className="space-y-2 rounded-sm bg-muted px-3 py-2.5">
                    <div className="flex gap-2">
                      <input type="number" step="0.01" min="0.01" value={editTxnAmount}
                        onChange={e => setEditTxnAmount(e.target.value)}
                        className="w-24 rounded-sm border-2 border-border bg-card px-2 py-1 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                      <input type="date" value={editTxnDate}
                        onChange={e => setEditTxnDate(e.target.value)}
                        className="flex-1 rounded-sm border-2 border-border bg-card px-2 py-1 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                    </div>
                    <input type="text" value={editTxnNote}
                      onChange={e => setEditTxnNote(e.target.value)}
                      placeholder="Note (optional)"
                      className="w-full rounded-sm border-2 border-border bg-card px-2 py-1 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveTxn}
                        className="flex-1 rounded-sm bg-primary py-1.5 font-display text-[0.55rem] text-primary-foreground">Save</button>
                      <button onClick={() => setEditTxnId(null)}
                        className="rounded-sm border-2 border-border px-3 py-1.5 font-display text-[0.55rem] text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={transaction.id} className="flex items-start justify-between rounded-sm bg-muted px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-heading text-xs ${isCredit ? 'text-primary' : 'text-red-500'}`}>
                        €{Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      {transaction.note && (
                        <span className="flex items-center gap-1 truncate text-[0.55rem] text-muted-foreground">
                          <MessageSquare className="w-3 h-3 shrink-0" /> {transaction.note}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[0.5rem] text-muted-foreground">{transaction.date}</p>
                      {isCredit && <span className="text-[0.45rem] font-heading uppercase text-primary ml-1">received</span>}
                    </div>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <button onClick={() => handleEditTxn(transaction)} className="p-1 text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDeleteTxn(transaction.id)} className="p-1 text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xs text-foreground">Budget</h1>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Coins className="w-4 h-4" />
          <span className="font-body text-sm">
            {remaining >= 0 ? (
              <span className="text-secondary">€{remaining.toFixed(0)} left</span>
            ) : (
              <span className="text-red-500">€{Math.abs(remaining).toFixed(0)} over</span>
            )}
          </span>
        </div>
      </div>

      <div className="rounded-sm bg-muted p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[0.5rem] font-heading uppercase text-muted-foreground">Monthly Budget</span>
          <span className="font-body text-sm font-bold text-foreground">€{monthlyIncome}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-none bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${monthlyIncome > 0 ? Math.min((totalAllocated / monthlyIncome) * 100, 100) : 0}%` }} />
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[0.5rem] text-muted-foreground">€{totalAllocated.toFixed(0)} allocated</span>
          <span className="text-[0.5rem] text-muted-foreground">€{remaining.toFixed(0)} remaining</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[0.55rem] font-heading uppercase tracking-wider text-muted-foreground">Categories</p>
          <div className="flex overflow-hidden rounded-sm border-2 border-border bg-muted">
            <button type="button" onClick={() => setViewCadence('monthly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                viewCadence === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Month</button>
            <button type="button" onClick={() => setViewCadence('weekly')}
              className={`px-2 py-1 text-[0.5rem] font-heading uppercase transition-colors ${
                viewCadence === 'weekly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>Week</button>
          </div>
        </div>

        {categoriesWithSpending.map(category => {
          const spent = periodSpending[category.name] || 0;
          const displayBudget = (category.allocatedAmount || 0) / cadenceDivisor;
          const percentage = displayBudget > 0 ? (spent / displayBudget) * 100 : 0;

          return (
            <div key={category.id} className="overflow-hidden rounded-sm border border-border bg-card">
              {editId === category.id ? (
                <div className="flex items-center gap-2 p-3">
                  <input value={editName} onChange={event => setEditName(event.target.value)}
                    className="flex-1 rounded-sm border-2 border-border bg-muted px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                  <input type="number" value={editAmount} onChange={event => setEditAmount(event.target.value)}
                    className="w-20 rounded-sm border-2 border-border bg-muted px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                  <button onClick={handleSaveEdit} className="rounded-sm bg-primary p-2 text-primary-foreground"><Save className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setSelectedCategory(category.name)} className="w-full p-3 text-left transition-colors hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-heading text-xs text-foreground">{category.name}</p>
                        <p className="font-heading text-[0.5rem] text-muted-foreground">€{displayBudget.toFixed(2)} {cadenceLabel.toLowerCase()} budget</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-heading text-xs ${spent > displayBudget ? 'text-red-500' : 'text-primary'}`}>
                        €{spent.toFixed(0)}
                      </span>
                      <div className="flex items-center gap-0.5" onClick={event => { event.stopPropagation(); handleEdit(category); }}>
                        <span className="p-1 text-muted-foreground hover:text-foreground">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </span>
                      </div>
                      <span className="p-1 text-muted-foreground hover:text-red-500" onClick={event => { event.stopPropagation(); handleDelete(category.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  {displayBudget > 0 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-none border border-border bg-muted">
                      <div className="h-full rounded-none transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage > 100 ? '#ef4444' : '#00bf63' }} />
                    </div>
                  )}
                </button>
              )}
            </div>
          );
        })}

        {categoriesWithSpending.length === 0 && uncategorized.spent === 0 && (
          <div className="py-10 text-center">
            <p className="font-display text-[0.6rem] text-muted-foreground">No categories yet</p>
            <p className="mt-1 text-[0.55rem] text-muted-foreground">Add budget categories below.</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[0.55rem] font-heading uppercase tracking-wider text-muted-foreground">Add Category</p>
          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/20 px-2 py-0.5">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="font-heading text-[0.45rem] text-amber-400 uppercase">Premium</span>
            </span>
          )}
        </div>

        {atFreeLimit ? (
          <div className="rounded-sm border-2 border-amber-500/40 bg-amber-500/10 p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <p className="font-display text-[0.6rem] text-foreground">Free Plan Limit Reached</p>
            </div>
            <p className="font-body text-[0.55rem] text-muted-foreground">
              Free plan allows {FREE_CATEGORY_LIMIT} categories. Upgrade to Premium for unlimited.
            </p>
            <p className="font-heading text-[0.5rem] text-amber-400 uppercase">Upgrade to Premium for $4.99</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={event => setNewName(event.target.value)}
                placeholder="Name" className="flex-1 rounded-sm border-2 border-border bg-muted px-3 py-2.5 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
              <input type="number" step="1" value={newAmount} onChange={event => setNewAmount(event.target.value)}
                placeholder="€" className="w-20 rounded-sm border-2 border-border bg-muted px-3 py-2.5 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
              <button onClick={handleAdd} className="rounded-sm bg-primary px-3 py-2.5 text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {!isPremium && (
              <p className="text-[0.5rem] text-muted-foreground">
                Free plan: {categories.length}/{FREE_CATEGORY_LIMIT} categories used
              </p>
            )}
          </>
        )}
        {error && <p className="text-[0.55rem] font-heading text-red-500">{error}</p>}
      </div>
    </div>
  );
}
