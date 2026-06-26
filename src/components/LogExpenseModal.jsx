import { useState } from 'react';
import { X, Plus, MessageSquare, DollarSign } from 'lucide-react';
import { getCategories, addCategory } from '@/lib/localStorage';
import { getBudgetCategoriesWithSummary } from '@/lib/gameLogic';

export default function LogExpenseModal({ isOpen, onClose, onSave, onMoneyReceived, onCategoriesChange }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [error, setError] = useState('');
  const [moneyReceived, setMoneyReceived] = useState(false);

  const categories = getCategories();
  const { uncategorized } = getBudgetCategoriesWithSummary();
  const showUncategorized = uncategorized.spent > 0;

  if (!isOpen) return null;

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setNote('');
    setNewCatName('');
    setNewCatAmount('');
    setError('');
    setShowNewCat(false);
    setMoneyReceived(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!category) {
      setError('Select a budget category.');
      return;
    }

    if (moneyReceived && category === 'Uncategorized') {
      setError('Select a budget category for Money Received.');
      return;
    }

    setSaving(true);
    const result = moneyReceived
      ? await onMoneyReceived?.(parseFloat(amount), category, date, note.trim())
      : await onSave(parseFloat(amount), category, date, note.trim());
    setSaving(false);

    if (!result?.success) {
      setError(result?.message || (moneyReceived ? 'Money not saved.' : 'Expense not saved.'));
      return;
    }

    resetForm();
    onClose();
  };

  const handleAddCategory = () => {
    const allocatedAmount = parseFloat(newCatAmount);
    if (!newCatName.trim()) {
      setError('Enter a category name.');
      return;
    }
    if (!allocatedAmount || allocatedAmount <= 0) {
      setError('Enter a budget amount.');
      return;
    }

    const addedCategory = addCategory({ name: newCatName.trim(), allocatedAmount });
    setCategory(addedCategory.name);
    setNewCatName('');
    setNewCatAmount('');
    setError('');
    setShowNewCat(false);
    onCategoriesChange?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { resetForm(); onClose(); }} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl border-t-4 border-primary bg-card p-6 animate-in slide-in-from-bottom sm:rounded-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xs text-foreground">Log Expense</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.6rem] font-heading uppercase text-muted-foreground">Amount (€)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={event => setAmount(event.target.value)}
              className="w-full rounded-sm border-2 border-border bg-muted px-4 py-3 font-body text-lg text-foreground focus:border-primary focus:outline-none"
              placeholder="0.00" autoFocus required />
          </div>

          {moneyReceived && (
            <p className="-mt-1 text-[0.5rem] font-heading text-foreground">
              Money Received offsets spending in selected category.
            </p>
          )}

          <button type="button" onClick={() => { setMoneyReceived(value => !value); setError(''); }}
            className={`-mt-1 flex w-full items-center gap-2 rounded-sm border-2 px-3 py-2 transition-all ${
              moneyReceived
                ? 'border-secondary bg-secondary/10 text-foreground'
                : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
            }`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${
              moneyReceived ? 'border-secondary bg-secondary' : 'border-border bg-card'
            }`}>
              {moneyReceived && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-heading text-[0.6rem] uppercase tracking-wide">Money Received</span>
          </button>

          <div>
            <label className="mb-1.5 block text-[0.6rem] font-heading uppercase text-muted-foreground">Category</label>
            {categories.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {showUncategorized && !moneyReceived && (
                  <button type="button" onClick={() => { setCategory(''); setShowNewCat(false); }}
                    className={`truncate rounded-sm border-2 px-2 py-2.5 text-[0.55rem] font-heading transition-all ${
                      category === '' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                    }`}>Uncategorized</button>
                )}
                {categories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => { setCategory(cat.name); setShowNewCat(false); setError(''); }}
                    className={`truncate rounded-sm border-2 px-2 py-2.5 text-[0.55rem] font-heading transition-all ${
                      category === cat.name ? (moneyReceived ? 'border-secondary bg-secondary/10 text-foreground' : 'border-primary bg-primary/10 text-primary') : 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                    }`}>{cat.name}</button>
                ))}
              </div>
            )}

            {!showNewCat ? (
              <button type="button" onClick={() => setShowNewCat(true)}
                className="flex w-full items-center justify-center gap-1 rounded-sm border-2 border-dashed border-border py-2 text-[0.55rem] font-heading text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Plus className="w-3.5 h-3.5" /> New Category
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={newCatName} onChange={event => setNewCatName(event.target.value)}
                    placeholder="Category name" className="flex-1 rounded-sm border-2 border-border bg-muted px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                  <input type="number" step="1" min="1" value={newCatAmount} onChange={event => setNewCatAmount(event.target.value)}
                    placeholder="Budget €" className="w-28 rounded-sm border-2 border-border bg-muted px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
                </div>
                <button type="button" onClick={handleAddCategory}
                  className="w-full rounded-sm bg-primary px-3 py-2 font-display text-[0.55rem] text-primary-foreground">Add Category</button>
              </div>
            )}
          </div>

          {error && <p className="text-[0.55rem] font-heading text-red-500">{error}</p>}

          <div>
            <label className="mb-1.5 block text-[0.6rem] font-heading uppercase text-muted-foreground">Date</label>
            <input type="date" value={date} onChange={event => setDate(event.target.value)}
              className="w-full rounded-sm border-2 border-border bg-muted px-4 py-3 font-body text-foreground focus:border-primary focus:outline-none" required />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-heading uppercase text-muted-foreground">
              <MessageSquare className="w-3 h-3" /> Note (optional)
            </label>
            <textarea value={note} onChange={event => setNote(event.target.value)}
              rows={2} placeholder="What was it for?"
              className="w-full resize-none rounded-sm border-2 border-border bg-muted px-4 py-3 font-body text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>

<button type="submit" disabled={saving}
            className={`w-full rounded-sm border-b-4 py-3.5 font-display text-xs text-primary-foreground transition-all hover:border-b-2 active:border-b-0 disabled:opacity-50 ${
              moneyReceived ? 'border-secondary/70 bg-secondary' : 'border-primary/70 bg-primary'
            }`}>
            {saving ? 'Saving...' : moneyReceived ? 'Add Money Received' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
