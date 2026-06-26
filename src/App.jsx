import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState, useCallback, useEffect, useMemo } from 'react';
import ScrollToTop from './components/ScrollToTop';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import OnboardingModal from './components/OnboardingModal';
import LogExpenseModal from './components/LogExpenseModal';
import HexInteractionModal from './components/HexInteractionModal';
import PointsAnimation from './components/PointsAnimation';
import useGameState from './lib/useGameState';
import { toast } from '@/components/ui/use-toast';
import {
  clearTileDecor, getBuildingPlacementIssue, getTileDecorAt, getTileDecorLabel, getIsland, logExpense, logMoneyReceived, purchaseBuilding,
  placeBuilding, demolishBuilding, checkBudgetStatus, triggerWeeklyRecap, upgradeBuilding, recordMonthlySavingsRecap,
  getBudgetPeriodDates, calculateBudgetLimit, getPeriodExpenses, grantUnlimitedCityPoints,
} from './lib/gameLogic';
import { saveCategories, getUserTier, setUserTier } from './lib/localStorage';
import Home from './pages/Home';
import Budget from './pages/Budget';
import Profile from './pages/Profile';
import DebugPanel from './components/DebugPanel';
import RecapModal from './components/RecapModal';

function BudgetopiaApp() {
  const { profile, transactions, buildings, totalPoints, onboarded,
    updateProfile, completeOnboarding, refresh } = useGameState();
  const island = useMemo(() => getIsland(), [buildings]);

  const [logOpen, setLogOpen] = useState(false);
  const [pointsAnim, setPointsAnim] = useState(null);
  const [hexModal, setHexModal] = useState(null);
  const [recapResult, setRecapResult] = useState(null);
  const [userTier, setUserTierState] = useState(getUserTier);
  useEffect(() => {
    if (onboarded && profile) { checkBudgetStatus(); refresh(); }
  }, []);

  useEffect(() => {
    if (!onboarded || !profile) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { start, end } = getBudgetPeriodDates('monthly');
    const monthTransactions = getPeriodExpenses(transactions, 'monthly').filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
    const spentAmount = monthTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    recordMonthlySavingsRecap(currentMonth, calculateBudgetLimit(profile), spentAmount);
  }, [onboarded, profile, transactions]);

  const handleOnboardingComplete = useCallback((data) => {
    updateProfile({ income: data.income, budgetCadence: data.budgetCadence });
    saveCategories(data.categories);
    completeOnboarding();
    refresh();
  }, [updateProfile, completeOnboarding, refresh]);

  const handleLogExpense = useCallback(async (amount, category, date, note) => {
    const result = logExpense(amount, category, date, note);
    if (!result.success) return result;
    setPointsAnim(result.pointsEarned);
    refresh();
    return result;
  }, [refresh]);

  const handleMoneyReceived = useCallback(async (amount, category, date, note) => {
    const result = logMoneyReceived(amount, category, date, note);
    if (!result.success) return result;
    refresh();
    return result;
  }, [refresh]);

  const handleHexClick = useCallback((q, r, occupied) => {
    const building = buildings.find(b =>
      b.hexPosition?.q === q && b.hexPosition?.r === r
    );
    setHexModal({ q, r, building: building || null });
  }, [buildings]);

  const handleBuildOnHex = useCallback((buildingType, hexQ, hexR) => {
    const placementIssue = getBuildingPlacementIssue(buildingType, island, hexQ, hexR);
    if (placementIssue) {
      const decorLabel = getTileDecorLabel(getTileDecorAt(island, hexQ, hexR));
      toast({
        title: 'Invalid build tile',
        description: placementIssue === 'tile_decor'
          ? `Clear the ${decorLabel} on this tile before building here.`
          : 'Harbor can only be placed on right coast tiles.',
        variant: 'destructive',
      });
      return { success: false, reason: 'invalid_tile' };
    }

    const result = purchaseBuilding(buildingType);
    if (result.success) {
      placeBuilding(result.building.id, hexQ, hexR);
      setHexModal(null);
      refresh();
    }
    return result;
  }, [island, refresh]);

  const handleClearTileDecor = useCallback((hexQ, hexR) => {
    const result = clearTileDecor(hexQ, hexR);
    if (!result.success) {
      toast({
        title: `Unable to clear ${result.label || 'decor'}`,
        description: result.reason === 'insufficient_points'
          ? `You need ${result.cost} city points to clear this tile.`
          : `That tile has no ${result.label || 'decor'} to clear.`,
        variant: 'destructive',
      });
      return result;
    }

    refresh();
    return result;
  }, [refresh]);

  const handleDemolish = useCallback((buildingId) => {
    const result = demolishBuilding(buildingId);
    if (result.success) {
      setHexModal(null);
      refresh();
    }
  }, [refresh]);

  const handleUpgradeBuilding = useCallback((buildingId) => {
    const result = upgradeBuilding(buildingId);
    if (result.success) {
      setHexModal(current => current ? { ...current, building: result.building } : current);
      refresh();
    }
    return result;
  }, [refresh]);

  const handlePointsAnimComplete = useCallback(() => setPointsAnim(null), []);

  const handleReset = useCallback(() => {
    window.location.reload();
  }, []);

  const handleTestRecap = useCallback(() => {
    const result = triggerWeeklyRecap();
    setRecapResult(result);
    refresh();
  }, [refresh]);

  const handleUnlimitedPoints = useCallback(() => {
    grantUnlimitedCityPoints();
    refresh();
  }, [refresh]);

  const handleTogglePremium = useCallback(() => {
    const next = getUserTier() === 'premium' ? 'free' : 'premium';
    setUserTier(next);
    setUserTierState(next);
  }, []);

  if (!onboarded) {
    return <OnboardingModal isOpen={true} onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home profile={profile} transactions={transactions} buildings={buildings}
          island={island}
          onHexClick={handleHexClick}
          onLogClick={() => setLogOpen(true)} />} />
        <Route path="/budget" element={<Budget profile={profile} transactions={transactions} refresh={refresh} userTier={userTier} />} />
        <Route path="/profile" element={<Profile profile={profile} transactions={transactions} onProfileChange={updateProfile} />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <LogExpenseModal isOpen={logOpen} onClose={() => setLogOpen(false)}
        onSave={handleLogExpense} onMoneyReceived={handleMoneyReceived} onCategoriesChange={refresh} />
      <HexInteractionModal isOpen={!!hexModal} onClose={() => setHexModal(null)}
        hexQ={hexModal?.q ?? 0} hexR={hexModal?.r ?? 0}
        building={hexModal?.building ?? null}
        tileDecor={hexModal ? getTileDecorAt(island, hexModal.q, hexModal.r) : null}
        island={island}
        totalPoints={totalPoints}
        onBuild={handleBuildOnHex}
        onClearDecor={handleClearTileDecor}
        onDemolish={handleDemolish}
        onUpgrade={handleUpgradeBuilding} />
      {pointsAnim && <PointsAnimation points={pointsAnim} onComplete={handlePointsAnimComplete} />}
      <DebugPanel onReset={handleReset} onTestRecap={handleTestRecap} onUnlimitedPoints={handleUnlimitedPoints} userTier={userTier} onTogglePremium={handleTogglePremium} />
      {recapResult && <RecapModal result={recapResult} onClose={() => setRecapResult(null)} />}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <BudgetopiaApp />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
