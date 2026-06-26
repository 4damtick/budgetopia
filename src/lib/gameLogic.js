import {
  getProfile, getTransactions, getBuildings, getCategories,
  getTotalPoints, getCityLevel, getIslandData,
  saveProfile, saveTransactions, saveBuildings, saveCategories,
  addTotalPoints, spendPoints,
  setCityLevel, addTransaction, addBuilding, saveIslandData,
  getMonthlyRecaps, saveMonthlyRecaps, getSavingsTrackingStartedAt,
  setSavingsTrackingStartedAt, setTotalPoints, updateCategory,
} from './localStorage';

export const BUILDINGS = [
  { type: 'small_house', name: 'Small House', cost: 50, description: 'A cozy starter home' },
  { type: 'shop', name: 'Shop', cost: 100, description: 'A bustling local shop' },
  { type: 'windmill', name: 'Windmill', cost: 150, description: 'A landmark for your island' },
  { type: 'clock_tower', name: 'Clock Tower', cost: 300, description: 'The heart of the city' },
  { type: 'harbor', name: 'Harbor', cost: 250, description: 'A lively coastal port' },
  { type: 'hotel', name: 'Hotel', cost: 300, description: 'A grand hotel for visitors' },
  { type: 'bank', name: 'Bank', cost: 500, description: 'A prestigious financial center' },
  { type: 'town_hall', name: 'Town Hall', cost: 400, description: 'The civic heart of your island' },
];

export const POINT_MULTIPLIERS = {
  weekly: 1, monthly: 2,
};

const ISLAND_LAYOUT_VERSION = 'stardew-square-v3';
export const DECOR_CLEAR_COST = 30;
export const COASTAL_DECOR_CLEAR_COST = DECOR_CLEAR_COST;

const TILE_DECOR_TYPES = {
  coconut_trees: {
    label: 'coconut trees',
    terrain: 'sand',
    requiresCoast: true,
  },
  trees: {
    label: 'trees',
    terrain: 'grass',
    requiresCoast: false,
  },
};

const ISLAND_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
];

const DEFAULT_ISLAND_SIZE = 84;
const MAX_ISLAND_SIZE = 110;

function createSeededRandom(seedValue) {
  let seed = seedValue % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function hashSeed(seed) {
  return seed.split('').reduce((value, char) => ((value * 31) + char.charCodeAt(0)) % 2147483647, 7);
}

function tileKey(q, r) {
  return `${q},${r}`;
}

function gridDistance(q, r) {
  return Math.max(Math.abs(q), Math.abs(r));
}

function getNeighbors(q, r) {
  return ISLAND_DIRECTIONS.map(direction => ({ q: q + direction.q, r: r + direction.r }));
}

function shuffleArray(items, random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function chooseTerrain(distance, coastEdgeCount, random) {
  if (coastEdgeCount === 0) return 'grass';
  const coastBias = coastEdgeCount >= 2 ? 0.7 : 0.42;
  const outerRingBias = distance >= 5 ? 0.12 : 0;
  if (random() < Math.min(0.92, coastBias + outerRingBias)) return 'sand';
  return 'grass';
}

function normalizeIslandTiles(tiles) {
  return tiles.map(tile => ({
    q: Number(tile.q),
    r: Number(tile.r),
    terrain: tile.terrain === 'sand' ? 'sand' : 'grass',
  }));
}

function normalizeDecorType(type) {
  if (type === 'coco_tree_0' || type === 'coco_tree_1' || type === 'coconut_trees') return 'coconut_trees';
  if (type === 'trees') return 'trees';
  return null;
}

function normalizeDecorCount(type, count) {
  const legacyCount = type === 'coco_tree_1' ? 2 : 1;
  return clamp(Number(count) || legacyCount, 1, 3);
}

function normalizeTileDecor(decor) {
  if (!Array.isArray(decor)) return [];

  const seen = new Set();
  return decor.reduce((items, entry) => {
    const q = Number(entry?.q);
    const r = Number(entry?.r);
    const type = normalizeDecorType(entry?.type);
    const key = tileKey(q, r);

    if (!Number.isFinite(q) || !Number.isFinite(r) || !type || seen.has(key)) return items;
    seen.add(key);
    items.push({ q, r, type, count: normalizeDecorCount(entry?.type, entry?.count) });
    return items;
  }, []);
}

function buildTerrainMap(tiles) {
  return tiles.reduce((map, tile) => {
    map[tileKey(tile.q, tile.r)] = tile.terrain;
    return map;
  }, {});
}

function buildDecorMap(decor) {
  return decor.reduce((map, item) => {
    map[tileKey(item.q, item.r)] = item;
    return map;
  }, {});
}

function getDecorDefinition(type) {
  return TILE_DECOR_TYPES[normalizeDecorType(type)] || null;
}

function getDecorLabel(decor) {
  const definition = getDecorDefinition(decor?.type);
  return definition?.label || 'decor';
}

function isGrassTile(terrainMap, q, r) {
  return terrainMap[tileKey(q, r)] === 'grass';
}

function isValidDecorTile(terrainMap, decor) {
  const definition = getDecorDefinition(decor.type);
  if (!definition) return false;
  if (terrainMap[tileKey(decor.q, decor.r)] !== definition.terrain) return false;
  if (definition.requiresCoast) return isSandyCoastTile(terrainMap, decor.q, decor.r);
  return isGrassTile(terrainMap, decor.q, decor.r);
}

function sanitizeTileDecor(decor, tiles, occupiedKeys) {
  const terrainMap = buildTerrainMap(tiles);
  return normalizeTileDecor(decor).filter(item => {
    const key = tileKey(item.q, item.r);
    return isValidDecorTile(terrainMap, item) && !occupiedKeys.has(key);
  });
}

function getDecorCount(random) {
  let count = 1;
  if (random() < 0.42) count += 1;
  if (count < 3 && random() < 0.28) count += 1;
  return count;
}

function generateTileDecor(seed, tiles, occupiedKeys) {
  const random = createSeededRandom(hashSeed(`${seed}:tile-decor`));
  const terrainMap = buildTerrainMap(tiles);
  const decor = [];
  const decorKeys = new Set();
  const candidates = tiles
    .filter(tile => !occupiedKeys.has(tileKey(tile.q, tile.r)))
    .sort((left, right) => (left.r - right.r) || (left.q - right.q));

  candidates.forEach(tile => {
    const key = tileKey(tile.q, tile.r);
    const adjacentDecor = getNeighbors(tile.q, tile.r).some(neighbor => decorKeys.has(tileKey(neighbor.q, neighbor.r)));
    if (isSandyCoastTile(terrainMap, tile.q, tile.r)) {
      const edgeCount = getNeighbors(tile.q, tile.r).filter(neighbor => !terrainMap[tileKey(neighbor.q, neighbor.r)]).length;
      const spawnChance = adjacentDecor ? 0.12 : edgeCount >= 2 ? 0.34 : 0.24;
      if (random() > spawnChance) return;
      decor.push({ q: tile.q, r: tile.r, type: 'coconut_trees', count: getDecorCount(random) });
      decorKeys.add(key);
      return;
    }

    if (!isGrassTile(terrainMap, tile.q, tile.r)) return;

    const nearCoast = getNeighbors(tile.q, tile.r).some(neighbor => {
      const terrain = terrainMap[tileKey(neighbor.q, neighbor.r)];
      return !terrain || terrain === 'sand';
    });
    const spawnChance = adjacentDecor ? 0.08 : nearCoast ? 0.14 : 0.2;
    if (random() > spawnChance) return;

    decor.push({ q: tile.q, r: tile.r, type: 'trees', count: getDecorCount(random) });
    decorKeys.add(key);
  });

  return decor;
}

function getPlacedBuildingKeys() {
  return new Set(
    getBuildings()
      .filter(building => building.hexPosition)
      .map(building => tileKey(building.hexPosition.q, building.hexPosition.r))
  );
}

function isSandyCoastTile(terrainMap, q, r) {
  if (terrainMap[tileKey(q, r)] !== 'sand') return false;
  return getNeighbors(q, r).some(neighbor => !terrainMap[tileKey(neighbor.q, neighbor.r)]);
}

function generateIslandLayout(seed, requiredCoords = []) {
  const random = createSeededRandom(hashSeed(seed));
  const sizeFloor = Math.max(requiredCoords.length + 12, 56);
  const targetSize = Math.min(MAX_ISLAND_SIZE, Math.max(sizeFloor, DEFAULT_ISLAND_SIZE + Math.floor(random() * 25) - 12));
  const tileMap = new Map();
  const frontier = [];

  const addTile = (q, r) => {
    const key = tileKey(q, r);
    if (tileMap.has(key)) return false;
    tileMap.set(key, { q, r });
    frontier.push({ q, r });
    return true;
  };

  addTile(0, 0);
  requiredCoords.forEach(({ q, r }) => addTile(q, r));

  while (tileMap.size < targetSize) {
    const anchor = frontier[Math.floor(random() * frontier.length)] || { q: 0, r: 0 };
    const candidates = shuffleArray(getNeighbors(anchor.q, anchor.r), random)
      .filter(({ q, r }) => !tileMap.has(tileKey(q, r)));

    const nextTile = candidates.find(({ q, r }) => {
      const distance = gridDistance(q, r);
      const neighborCount = getNeighbors(q, r).filter(neighbor => tileMap.has(tileKey(neighbor.q, neighbor.r))).length;
      if (distance > 6 && random() < 0.72) return false;
      if (distance > 8) return false;
      if (neighborCount === 0) return false;
      return random() < Math.min(0.96, 0.22 + neighborCount * 0.1 + Math.max(0, (7 - distance) * 0.05));
    }) || candidates[0];

    if (nextTile) {
      addTile(nextTile.q, nextTile.r);
      continue;
    }

    if (frontier.length > 1) {
      frontier.splice(frontier.indexOf(anchor), 1);
      continue;
    }

    const fallback = { q: Math.round((random() - 0.5) * 10), r: Math.round((random() - 0.5) * 10) };
    addTile(fallback.q, fallback.r);
  }

  return Array.from(tileMap.values())
    .map(({ q, r }) => {
      const distance = gridDistance(q, r);
      const coastEdgeCount = getNeighbors(q, r).filter(neighbor => !tileMap.has(tileKey(neighbor.q, neighbor.r))).length;
      return { q, r, terrain: chooseTerrain(distance, coastEdgeCount, random) };
    })
    .sort((left, right) => (left.r - right.r) || (left.q - right.q));
}

export function getIsland() {
  const stored = getIslandData();
  const occupiedKeys = getPlacedBuildingKeys();

  if (stored?.tiles?.length) {
    const seed = stored.seed || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const tiles = normalizeIslandTiles(stored.tiles);
    const storedDecor = Array.isArray(stored.tileDecor) ? stored.tileDecor : stored.coastalDecor;
    const tileDecor = Array.isArray(storedDecor)
      ? sanitizeTileDecor(storedDecor, tiles, occupiedKeys)
      : generateTileDecor(seed, tiles, occupiedKeys);
    const nextIslandData = { version: ISLAND_LAYOUT_VERSION, seed, tiles, tileDecor };

    if (
      stored.version !== ISLAND_LAYOUT_VERSION
      || seed !== stored.seed
      || JSON.stringify(tiles) !== JSON.stringify(stored.tiles)
      || JSON.stringify(tileDecor) !== JSON.stringify(stored.tileDecor || stored.coastalDecor || [])
    ) {
      saveIslandData(nextIslandData);
    }

    return {
      seed,
      tiles,
      terrainMap: buildTerrainMap(tiles),
      tileDecor,
      decorMap: buildDecorMap(tileDecor),
    };
  }

  const requiredCoords = getBuildings()
    .filter(building => building.hexPosition)
    .map(building => building.hexPosition);
  const seed = stored?.seed || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const tiles = generateIslandLayout(seed, requiredCoords);
  const tileDecor = generateTileDecor(seed, tiles, occupiedKeys);
  saveIslandData({ version: ISLAND_LAYOUT_VERSION, seed, tiles, tileDecor });
  return {
    seed,
    tiles,
    terrainMap: buildTerrainMap(tiles),
    tileDecor,
    decorMap: buildDecorMap(tileDecor),
  };
}

export function getTileDecorAt(island, q, r) {
  return island?.decorMap?.[tileKey(q, r)] || null;
}

export function getCoastalDecorAt(island, q, r) {
  return getTileDecorAt(island, q, r);
}

export function getTileDecorLabel(decor) {
  return getDecorLabel(decor);
}

export function isRightCoastTile(island, q, r) {
  if (!island?.terrainMap?.[tileKey(q, r)]) return false;
  return !island.terrainMap[tileKey(q + 1, r)];
}

export function getBuildingPlacementIssue(buildingType, island, q, r) {
  if (getTileDecorAt(island, q, r)) return 'tile_decor';
  if (buildingType === 'harbor' && !isRightCoastTile(island, q, r)) return 'harbor_coast';
  return null;
}

export function canPlaceBuildingOnTile(buildingType, island, q, r) {
  return !getBuildingPlacementIssue(buildingType, island, q, r);
}

export function clearTileDecor(q, r) {
  const stored = getIslandData();
  if (!stored?.tiles?.length) return { success: false, reason: 'island_missing' };

  const seed = stored.seed || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const tiles = normalizeIslandTiles(stored.tiles);
  const occupiedKeys = getPlacedBuildingKeys();
  const storedDecor = Array.isArray(stored.tileDecor) ? stored.tileDecor : stored.coastalDecor;
  const tileDecor = Array.isArray(storedDecor)
    ? sanitizeTileDecor(storedDecor, tiles, occupiedKeys)
    : generateTileDecor(seed, tiles, occupiedKeys);
  const decorKey = tileKey(q, r);
  const decor = tileDecor.find(item => tileKey(item.q, item.r) === decorKey);

  if (!decor) return { success: false, reason: 'not_found' };
  if (getTotalPoints() < DECOR_CLEAR_COST) {
    return { success: false, reason: 'insufficient_points', cost: DECOR_CLEAR_COST, label: getDecorLabel(decor) };
  }

  const nextDecor = tileDecor.filter(item => tileKey(item.q, item.r) !== decorKey);
  const remaining = spendPoints(DECOR_CLEAR_COST);
  saveIslandData({ version: ISLAND_LAYOUT_VERSION, seed, tiles, tileDecor: nextDecor });
  setCityLevel(calculateCityLevel(remaining));

  return {
    success: true,
    cleared: decor,
    label: getDecorLabel(decor),
    cost: DECOR_CLEAR_COST,
    remaining,
    cityLevel: calculateCityLevel(remaining),
  };
}

export function clearCoastalDecor(q, r) {
  return clearTileDecor(q, r);
}

export function getBudgetPeriodDates(cadence) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  switch (cadence) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly':
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { start, end };
}

export function calculateBudgetLimit(profile) {
  const income = profile?.income || 0;
  const cadence = profile?.budgetCadence || 'monthly';
  switch (cadence) {
    case 'daily': return Math.round(income / 30);
    case 'weekly': return Math.round(income / 4.33);
    case 'monthly':
    default: return income;
  }
}

export function getPeriodExpenses(transactions, cadence) {
  const { start, end } = getBudgetPeriodDates(cadence);
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
}

export function getTotalPeriodSpending(transactions, cadence) {
  return getPeriodExpenses(transactions, cadence).reduce((sum, t) => sum + (t.amount || 0), 0);
}

export function getBudgetRemaining(profile, transactions) {
  const limit = calculateBudgetLimit(profile);
  const spent = getTotalPeriodSpending(transactions, profile?.budgetCadence || 'monthly');
  return limit - spent;
}

export function isOverBudget(profile, transactions) {
  return getBudgetRemaining(profile, transactions) < 0;
}

export function getWeather(profile, transactions) {
  return isOverBudget(profile, transactions) ? 'gloomy' : 'sunny';
}

export function getPointMultiplier(cadence) {
  return POINT_MULTIPLIERS[cadence] || 1;
}

export function earnExpensePoints() {
  return 1;
}

export function earnDisciplinePoints(profile) {
  return Math.round(50 * getPointMultiplier(profile?.budgetCadence || 'monthly'));
}

export function calculateCityLevel(totalPoints) {
  return Math.floor(totalPoints / 500) + 1;
}

export function getBuildingCost(buildingType, level) {
  const building = BUILDINGS.find(b => b.type === buildingType);
  if (!building) return 0;
  return building.cost * level;
}

export function getCityPointsSummary() {
  return {
    totalPoints: getTotalPoints(),
    cityLevel: getCityLevel(),
    buildingCount: getBuildings().filter(b => b.hexPosition).length,
  };
}

export function getCategoryBudgetStatus(categoryName, amount, transactions = getTransactions()) {
  const normalizedName = (categoryName || '').trim();
  if (!normalizedName) {
    return { allowed: false, reason: 'out_of_budget', message: 'Out of budget. Please allocate budget to this account.' };
  }

  const category = getCategories().find(c => c.name === normalizedName);
  if (!category || !(category.allocatedAmount > 0)) {
    return { allowed: false, reason: 'out_of_budget', message: 'Out of budget. Please allocate budget to this account.' };
  }

  const spent = transactions
    .filter(t => t.category === normalizedName)
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  if ((spent + amount) > category.allocatedAmount) {
    return { allowed: false, reason: 'out_of_budget', message: 'Out of budget. Please allocate budget to this account.' };
  }

  return {
    allowed: true,
    category,
    spent,
    remaining: category.allocatedAmount - spent,
  };
}

export function getBudgetCategoriesWithSummary() {
  const categories = getCategories();
  const transactions = getTransactions();
  const spending = getCategorySpending(transactions);
  const allocatedNames = new Set(categories.map(category => category.name));
  const uncategorizedTransactions = transactions.filter(transaction => !allocatedNames.has(transaction.category));
  const uncategorizedSpent = uncategorizedTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

  return {
    categories: categories.map(category => ({
      ...category,
      spent: spending[category.name] || 0,
    })),
    uncategorized: {
      id: '__uncategorized__',
      name: 'Uncategorized',
      allocatedAmount: 0,
      spent: uncategorizedSpent,
      transactions: uncategorizedTransactions,
    },
  };
}

export function logExpense(amount, category, date, note) {
  const profile = getProfile();
  const numericAmount = parseFloat(amount);
  const categoryStatus = getCategoryBudgetStatus(category, numericAmount);
  if (!categoryStatus.allowed) {
    return { success: false, reason: categoryStatus.reason, message: categoryStatus.message };
  }

  const txn = {
    amount: numericAmount,
    category: category.trim(),
    date: date || new Date().toISOString().split('T')[0],
    note: note || '',
  };
  addTransaction(txn);

  const pointsEarned = earnExpensePoints();
  addTotalPoints(pointsEarned);

  const totalPts = getTotalPoints();
  setCityLevel(calculateCityLevel(totalPts));
  return { success: true, pointsEarned, totalPoints: totalPts, cityLevel: calculateCityLevel(totalPts) };
}

export function logMoneyReceived(amount, category, date, note) {
  const numericAmount = parseFloat(amount);
  if (!numericAmount || numericAmount <= 0) {
    return { success: false, reason: 'invalid_amount', message: 'Enter a valid amount.' };
  }
  const normalizedName = (category || '').trim();
  if (!normalizedName || normalizedName === 'Uncategorized') {
    return { success: false, reason: 'no_category', message: 'Select a budget category for Money Received.' };
  }

  const categories = getCategories();
  const target = categories.find(c => c.name === normalizedName);
  if (!target) {
    return { success: false, reason: 'no_category', message: 'Select a budget category for Money Received.' };
  }

  const txn = {
    amount: -numericAmount,
    category: normalizedName,
    date: date || new Date().toISOString().split('T')[0],
    note: note || '',
    type: 'credit',
  };
  addTransaction(txn);

  return { success: true, moneyReceived: true, category: normalizedName, amount: numericAmount };
}

export function checkBudgetStatus() {
  const profile = getProfile();
  const transactions = getTransactions();
  return { isOver: isOverBudget(profile, transactions) };
}

export function purchaseBuilding(buildingType) {
  const totalPoints = getTotalPoints();
  const cost = getBuildingCost(buildingType, 1);
  if (totalPoints < cost) return { success: false, reason: 'insufficient_points' };

  const remaining = spendPoints(cost);
  const newBuilding = addBuilding({ buildingType, level: 1, hexPosition: null });

  setCityLevel(calculateCityLevel(remaining));
  return { success: true, building: newBuilding, remaining, cityLevel: calculateCityLevel(remaining) };
}

export function upgradeBuilding(buildingId) {
  const buildings = getBuildings();
  const index = buildings.findIndex(building => building.id === buildingId);
  if (index === -1) return { success: false, reason: 'not_found' };

  const building = buildings[index];
  const nextLevel = building.level + 1;
  if (nextLevel > 3) return { success: false, reason: 'max_level' };

  const totalPoints = getTotalPoints();
  const cost = getBuildingCost(building.buildingType, nextLevel);
  if (totalPoints < cost) return { success: false, reason: 'insufficient_points', cost };

  const remaining = spendPoints(cost);
  buildings[index] = { ...building, level: nextLevel };
  saveBuildings(buildings);
  setCityLevel(calculateCityLevel(remaining));

  return {
    success: true,
    building: buildings[index],
    cost,
    remaining,
    cityLevel: calculateCityLevel(remaining),
  };
}

export function placeBuilding(buildingId, hexQ, hexR) {
  const buildings = getBuildings();
  const idx = buildings.findIndex(b => b.id === buildingId);
  if (idx === -1) return null;
  // Remove any existing building at this hex
  const existingIdx = buildings.findIndex(b =>
    b.hexPosition?.q === hexQ && b.hexPosition?.r === hexR && b.id !== buildingId
  );
  if (existingIdx !== -1) {
    buildings[existingIdx].hexPosition = null;
  }
  buildings[idx].hexPosition = { q: hexQ, r: hexR };
  saveBuildings(buildings);
  return buildings[idx];
}

export function demolishBuilding(buildingId) {
  const buildings = getBuildings();
  const idx = buildings.findIndex(b => b.id === buildingId);
  if (idx === -1) return { success: false, reason: 'not_found' };

  const building = buildings[idx];
  const def = BUILDINGS.find(bd => bd.type === building.buildingType);
  const scrapCost = def ? Math.round(def.cost * building.level * 0.2) : 10;

  const totalPoints = getTotalPoints();
  if (totalPoints < scrapCost) return { success: false, reason: 'insufficient_points', cost: scrapCost };

  buildings.splice(idx, 1);
  saveBuildings(buildings);
  spendPoints(scrapCost);
  setCityLevel(calculateCityLevel(getTotalPoints()));
  return { success: true, cost: scrapCost, remaining: getTotalPoints() };
}

export function getCategorySpending(transactions) {
  const spending = {};
  transactions.forEach(t => {
    spending[t.category] = (spending[t.category] || 0) + (t.amount || 0);
  });
  return spending;
}

export function getCategoriesWithSpending() {
  return getBudgetCategoriesWithSummary().categories;
}

export function validateCategoriesTotal(categories, monthlyIncome) {
  const total = categories.reduce((sum, c) => sum + (parseFloat(c.allocatedAmount) || 0), 0);
  return Math.abs(total - monthlyIncome) < 0.01;
}

export function getTransactionsByCategory(categoryName) {
  return getTransactions().filter(t => t.category === categoryName);
}

export function triggerWeeklyRecap() {
  const profile = getProfile();
  const transactions = getTransactions();
  const cadence = profile?.budgetCadence || 'monthly';
  const multiplier = getPointMultiplier(cadence);
  const cadenceLabel = { weekly: 'Week', monthly: 'Month' }[cadence] || 'Period';

  const periodTxns = getPeriodExpenses(transactions, cadence);
  const totalSpent = periodTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const expenseCount = periodTxns.length;

  const byCategory = {};
  periodTxns.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0);
  });

  const limit = calculateBudgetLimit(profile);
  const isUnderBudget = totalSpent <= limit;
  const saved = Math.max(0, limit - totalSpent);
  const savedPercent = limit > 0 ? Math.min(100, Math.max(0, Math.round((saved / limit) * 100))) : 0;

  const rewardPoints = Math.round(10 * savedPercent * multiplier);
  const breakdown = [{
    reason: `Saved ${savedPercent}% of ${cadenceLabel} budget${multiplier > 1 ? ` (×${multiplier} ${cadenceLabel} bonus)` : ''}`,
    points: rewardPoints,
  }];

  if (rewardPoints > 0) {
    addTotalPoints(rewardPoints);
    setCityLevel(calculateCityLevel(getTotalPoints()));
  }

  const { start, end } = getBudgetPeriodDates(cadence);

  const shiftDays = cadence === 'daily' ? 1 : cadence === 'weekly' ? 7 : 31;
  const allTxns = getTransactions();
  const shifted = allTxns.map(t => {
    const d = new Date(t.date);
    if (d >= start && d <= end) {
      d.setDate(d.getDate() - shiftDays);
      return { ...t, date: d.toISOString().split('T')[0] };
    }
    return t;
  });
  saveTransactions(shifted);

  return {
    totalSpent,
    expenseCount,
    byCategory,
    isUnderBudget,
    saved,
    savedPercent,
    cadence,
    rewardPoints,
    breakdown,
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
  };
}

export function recordMonthlySavingsRecap(month, budgetedAmount, spentAmount) {
  const safeBudgetedAmount = Math.max(0, Number(budgetedAmount) || 0);
  const safeSpentAmount = Math.max(0, Number(spentAmount) || 0);
  const savedAmount = Math.max(0, safeBudgetedAmount - safeSpentAmount);
  const recaps = getMonthlyRecaps();
  const existingIndex = recaps.findIndex(recap => recap.month === month);
  const nextRecap = { month, budgetedAmount: safeBudgetedAmount, spentAmount: safeSpentAmount, savedAmount };

  if (existingIndex === -1) {
    recaps.push(nextRecap);
  } else {
    recaps[existingIndex] = nextRecap;
  }

  saveMonthlyRecaps(recaps.sort((left, right) => left.month.localeCompare(right.month)));
  if (!getSavingsTrackingStartedAt()) {
    setSavingsTrackingStartedAt(new Date().toISOString());
  }

  return nextRecap;
}

export function getTotalSavedAmount() {
  return getMonthlyRecaps().reduce((sum, recap) => sum + (recap.savedAmount || 0), 0);
}

export function getSavingsSummary() {
  return {
    totalSaved: getTotalSavedAmount(),
    recapsTracked: getMonthlyRecaps().length,
    trackingStartedAt: getSavingsTrackingStartedAt(),
  };
}

export function grantUnlimitedCityPoints() {
  const unlimitedPoints = 999999;
  setTotalPoints(unlimitedPoints);
  setCityLevel(calculateCityLevel(unlimitedPoints));
  return { totalPoints: unlimitedPoints, cityLevel: calculateCityLevel(unlimitedPoints) };
}
