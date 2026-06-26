import { useState } from 'react';
import { Star, Plus, X, Check } from 'lucide-react';

const CADENCES = [
  { value: 'monthly', label: 'Monthly', multiplier: '2x', desc: 'Points' },
  { value: 'weekly', label: 'Weekly', multiplier: '1x', desc: 'Points' },
];

export default function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [cadence, setCadence] = useState('monthly');
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [catError, setCatError] = useState('');

  if (!isOpen) return null;

  const monthlyIncome = parseFloat(income) || 0;
  const totalAllocated = categories.reduce((s, c) => s + (parseFloat(c.allocatedAmount) || 0), 0);
  const remaining = monthlyIncome - totalAllocated;

  const handleAddCategory = () => {
    const name = newCatName.trim();
    const amount = parseFloat(newCatAmount);
    if (!name) { setCatError('Enter a category name.'); return; }
    if (!amount || amount <= 0) { setCatError('Enter a valid amount.'); return; }
    if (totalAllocated + amount > monthlyIncome) { setCatError(`Total exceeds €${monthlyIncome}. Remaining: €${remaining.toFixed(0)}`); return; }
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) { setCatError('Category already exists.'); return; }
    setCategories([...categories, { name, allocatedAmount: amount }]);
    setNewCatName('');
    setNewCatAmount('');
    setCatError('');
  };

  const handleRemoveCategory = (idx) => {
    setCategories(categories.filter((_, i) => i !== idx));
    setCatError('');
  };

  const handleNext = () => {
    if (step === 1 && (!income || parseFloat(income) <= 0)) return;
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      onComplete({ income: monthlyIncome, budgetCadence: cadence, categories });
    }
    if (step < 3) setStep(step + 1);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-card border-4 border-primary rounded-sm w-full max-w-sm p-6 animate-in zoom-in fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-3 h-3 rounded-none border-2 transition-colors ${i <= step ? 'bg-primary border-primary' : 'bg-muted border-border'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="text-center space-y-5">
            <Star className="w-12 h-12 text-secondary mx-auto" />
            <div>
              <h1 className="font-display text-sm text-foreground mb-2">Welcome to Budgetopia!</h1>
              <p className="font-body text-sm text-muted-foreground">Build your city by managing your money.</p>
            </div>
            <div>
              <label className="block text-[0.6rem] font-heading text-muted-foreground mb-1.5 uppercase text-left">Monthly Income (€)</label>
              <input type="number" step="1" min="1" value={income} onChange={e => setIncome(e.target.value)}
                className="w-full px-4 py-3 bg-muted border-2 border-border rounded-sm font-body text-lg text-foreground focus:outline-none focus:border-primary" placeholder="0" autoFocus />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-5">
            <h2 className="font-display text-xs text-foreground">Budget Cadence</h2>
            <p className="font-body text-xs text-muted-foreground">Longer cadences earn more CityPoints!</p>
            <div className="space-y-2">
              {CADENCES.map(c => (
                <button key={c.value} onClick={() => setCadence(c.value)}
                  className={`w-full p-3 border-2 rounded-sm flex items-center justify-between transition-all ${cadence === c.value ? 'border-primary bg-primary/10' : 'border-border bg-muted hover:border-muted-foreground'}`}>
                  <span className="font-display text-[0.6rem] text-foreground">{c.label}</span>
                  <span className={`font-display text-[0.55rem] px-2 py-0.5 rounded-sm ${cadence === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary/20 text-secondary-foreground'}`}>{c.multiplier} {c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <h2 className="font-display text-xs text-foreground">Budget Categories</h2>
            <p className="font-body text-xs text-muted-foreground">Set up budget categories for your €{monthlyIncome} income. Any leftover goes to Uncategorized.</p>

            <div className="bg-muted rounded-sm p-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.55rem] font-heading text-muted-foreground">Allocated</span>
                <span className={`font-body font-bold text-sm ${remaining === 0 ? 'text-primary' : remaining < 0 ? 'text-red-500' : 'text-secondary'}`}>
                  €{totalAllocated.toFixed(0)} / €{monthlyIncome.toFixed(0)}
                </span>
              </div>
              <div className="h-2 bg-border rounded-none overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.min((totalAllocated / monthlyIncome) * 100, 100)}%` }} />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-1.5">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted border border-border rounded-sm px-3 py-2">
                    <span className="font-body text-sm text-foreground">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-body font-bold text-xs text-foreground">€{parseFloat(cat.allocatedAmount).toFixed(0)}</span>
                      <button onClick={() => handleRemoveCategory(i)} className="text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder="Category name" className="flex-1 px-3 py-2.5 bg-muted border-2 border-border rounded-sm font-body text-sm text-foreground focus:outline-none focus:border-primary" />
              <input type="number" step="1" min="1" value={newCatAmount} onChange={e => setNewCatAmount(e.target.value)}
                placeholder="€" className="w-20 px-3 py-2.5 bg-muted border-2 border-border rounded-sm font-body text-sm text-foreground focus:outline-none focus:border-primary" />
              <button onClick={handleAddCategory} className="px-3 py-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {catError && <p className="text-[0.55rem] font-heading text-red-500">{catError}</p>}

            {remaining === 0 && categories.length > 0 && (
              <div className="flex items-center justify-center gap-1 text-primary">
                <Check className="w-4 h-4" />
                <span className="text-[0.55rem] font-heading">Budget balanced!</span>
              </div>
            )}
          </div>
        )}

        <button onClick={handleNext}
          className="w-full mt-6 py-3.5 bg-primary text-primary-foreground font-display text-xs rounded-sm border-b-4 border-primary/70 hover:border-b-2 hover:mt-[1.625rem] active:border-b-0 active:mt-[1.75rem] transition-all">
          {step < 3 ? 'Next' : 'Start Building!'}
        </button>
      </div>
    </div>
  );
}