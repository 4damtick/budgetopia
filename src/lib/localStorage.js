const KEYS = {
  PROFILE: 'budgetopia_profile',
  TRANSACTIONS: 'budgetopia_transactions',
  BUILDINGS: 'budgetopia_buildings',
  CATEGORIES: 'budgetopia_categories',
  ONBOARDED: 'budgetopia_onboarded',
  TOTAL_POINTS: 'budgetopia_total_points',
  RECOVERY_MISSION: 'budgetopia_recovery_mission',
  ISLAND: 'budgetopia_island',
  MONTHLY_RECAPS: 'budgetopia_monthly_recaps',
  SAVINGS_TRACKING_STARTED_AT: 'budgetopia_savings_tracking_started_at',
  USER_TIER: 'budgetopia_user_tier',
};

const SUPPORTED_BUILDING_TYPES = new Set([
  'small_house',
  'shop',
  'windmill',
  'clock_tower',
  'harbor',
  'hotel',
  'bank',
  'town_hall',
]);

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function normalizeCategory(category) {
  return {
    ...category,
    id: category.id || createId(),
    allocatedAmount: Number(category.allocatedAmount) || 0,
  };
}

function normalizeBuilding(building) {
  if (!building || !SUPPORTED_BUILDING_TYPES.has(building.buildingType)) return null;

  const hexPosition = building.hexPosition
    ? {
      q: Number(building.hexPosition.q),
      r: Number(building.hexPosition.r),
    }
    : null;

  return {
    ...building,
    id: building.id || createId(),
    level: Math.min(3, Math.max(1, Number(building.level) || 1)),
    hexPosition: hexPosition && Number.isFinite(hexPosition.q) && Number.isFinite(hexPosition.r)
      ? hexPosition
      : null,
  };
}

export function getProfile() {
  const raw = localStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export function getTransactions() {
  const raw = localStorage.getItem(KEYS.TRANSACTIONS);
  return raw ? JSON.parse(raw) : [];
}

export function saveTransactions(transactions) {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function addTransaction(transaction) {
  const txns = getTransactions();
  txns.unshift({ ...transaction, id: createId() });
  saveTransactions(txns);
  return txns;
}

export function getBuildings() {
  const raw = localStorage.getItem(KEYS.BUILDINGS);
  const buildings = raw ? JSON.parse(raw) : [];
  const normalized = buildings.map(normalizeBuilding).filter(Boolean);
  if (JSON.stringify(buildings) !== JSON.stringify(normalized)) {
    saveBuildings(normalized);
  }
  return normalized;
}

export function saveBuildings(buildings) {
  localStorage.setItem(KEYS.BUILDINGS, JSON.stringify(buildings.map(normalizeBuilding).filter(Boolean)));
}

export function addBuilding(building) {
  const buildings = getBuildings();
  const newBuilding = { ...building, id: createId() };
  buildings.push(newBuilding);
  saveBuildings(buildings);
  return newBuilding;
}

export function getCategories() {
  const raw = localStorage.getItem(KEYS.CATEGORIES);
  const categories = raw ? JSON.parse(raw) : [];
  const normalized = categories.map(normalizeCategory);
  if (JSON.stringify(categories) !== JSON.stringify(normalized)) {
    saveCategories(normalized);
  }
  return normalized;
}

export function saveCategories(categories) {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories.map(normalizeCategory)));
}

export function addCategory(category) {
  const cats = getCategories();
  const newCat = normalizeCategory(category);
  cats.push(newCat);
  saveCategories(cats);
  return newCat;
}

export function updateCategory(categoryId, data) {
  const cats = getCategories();
  const idx = cats.findIndex(c => c.id === categoryId);
  if (idx === -1) return null;
  cats[idx] = { ...cats[idx], ...data };
  saveCategories(cats);
  return cats[idx];
}

export function deleteCategory(categoryId) {
  const cats = getCategories().filter(c => c.id !== categoryId);
  saveCategories(cats);
  return cats;
}

export function updateTransaction(transactionId, data) {
  const txns = getTransactions();
  const idx = txns.findIndex(t => t.id === transactionId);
  if (idx === -1) return null;
  txns[idx] = { ...txns[idx], ...data };
  saveTransactions(txns);
  return txns[idx];
}

export function deleteTransaction(transactionId) {
  const txns = getTransactions().filter(t => t.id !== transactionId);
  saveTransactions(txns);
  return txns;
}

export function deleteTransactionsByCategory(categoryName) {
  const txns = getTransactions().filter(t => t.category !== categoryName);
  saveTransactions(txns);
  return txns;
}

export function getTotalCategoriesBudget() {
  return getCategories().reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);
}

export function isOnboarded() {
  return localStorage.getItem(KEYS.ONBOARDED) === 'true';
}

export function setOnboarded() {
  localStorage.setItem(KEYS.ONBOARDED, 'true');
}

export function getTotalPoints() {
  return parseInt(localStorage.getItem(KEYS.TOTAL_POINTS) || '0', 10);
}

export function addTotalPoints(points) {
  const current = getTotalPoints();
  localStorage.setItem(KEYS.TOTAL_POINTS, String(current + points));
}

export function setTotalPoints(points) {
  localStorage.setItem(KEYS.TOTAL_POINTS, String(Math.max(0, Math.round(points || 0))));
}

export function spendPoints(points) {
  const current = getTotalPoints();
  const newTotal = Math.max(0, current - points);
  localStorage.setItem(KEYS.TOTAL_POINTS, String(newTotal));
  return newTotal;
}

export function getRecoveryMission() {
  const raw = localStorage.getItem(KEYS.RECOVERY_MISSION);
  return raw ? JSON.parse(raw) : null;
}

export function getIslandData() {
  const raw = localStorage.getItem(KEYS.ISLAND);
  return raw ? JSON.parse(raw) : null;
}

export function saveIslandData(island) {
  localStorage.setItem(KEYS.ISLAND, JSON.stringify(island));
}

export function getMonthlyRecaps() {
  const raw = localStorage.getItem(KEYS.MONTHLY_RECAPS);
  return raw ? JSON.parse(raw) : [];
}

export function saveMonthlyRecaps(recaps) {
  localStorage.setItem(KEYS.MONTHLY_RECAPS, JSON.stringify(recaps));
}

export function getSavingsTrackingStartedAt() {
  return localStorage.getItem(KEYS.SAVINGS_TRACKING_STARTED_AT);
}

export function setSavingsTrackingStartedAt(date) {
  localStorage.setItem(KEYS.SAVINGS_TRACKING_STARTED_AT, date);
}

export function saveRecoveryMission(mission) {
  localStorage.setItem(KEYS.RECOVERY_MISSION, JSON.stringify(mission));
}

export function clearRecoveryMission() {
  localStorage.removeItem(KEYS.RECOVERY_MISSION);
}

export function getCityLevel() {
  return parseInt(localStorage.getItem('budgetopia_city_level') || '1', 10);
}

export function setCityLevel(level) {
  localStorage.setItem('budgetopia_city_level', String(level));
}

export function getUserTier() {
  return localStorage.getItem(KEYS.USER_TIER) || 'free';
}

export function setUserTier(tier) {
  localStorage.setItem(KEYS.USER_TIER, tier);
}

export function clearAll() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('budgetopia_city_level');
}
