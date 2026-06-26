import { useState } from 'react';
import { X, Coins, ArrowUp } from 'lucide-react';
import { BUILDINGS, getBuildingCost } from '@/lib/gameLogic';
import BuildingSprite from './BuildingSprite';

export default function BuildShopModal({ isOpen, onClose, onBuy, totalPoints, buildings }) {
  const [placingBuilding, setPlacingBuilding] = useState(null);

  if (!isOpen) return null;

  const buildingCounts = {};
  buildings.forEach(b => {
    buildingCounts[b.buildingType] = (buildingCounts[b.buildingType] || 0) + 1;
  });

  const handleBuy = (buildingType) => {
    const currentLevel = (buildingCounts[buildingType] || 0) + 1;
    if (currentLevel > 3) return;
    const cost = getBuildingCost(buildingType, currentLevel);
    if (totalPoints < cost) return;

    const result = onBuy(buildingType);
    if (result?.success) {
      setPlacingBuilding(result.building);
    }
  };

  const handleClose = () => {
    setPlacingBuilding(null);
    onClose();
  };

  const getNextLevel = (type) => (buildingCounts[type] || 0) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card border-t-4 border-secondary w-full max-w-md rounded-t-xl sm:rounded-xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs text-foreground">Build Shop</h2>
            <div className="flex items-center gap-1 bg-secondary/20 px-2 py-0.5 rounded-sm border border-secondary/30">
              <Coins className="w-3 h-3 text-secondary" />
              <span className="font-display text-[0.5rem] text-secondary-foreground">{totalPoints}</span>
            </div>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {placingBuilding && (
          <div className="mb-4 p-3 bg-primary/10 border-2 border-primary rounded-sm">
            <p className="text-[0.55rem] font-heading text-primary text-center">
              🏗️ Tap a green hex on the City view to place your building!
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {BUILDINGS.map((b) => {
            const nextLevel = getNextLevel(b.type);
            const maxed = nextLevel > 3;
            const cost = getBuildingCost(b.type, nextLevel);
            const canAfford = totalPoints >= cost && !maxed;

            return (
              <button
                key={b.type}
                onClick={() => handleBuy(b.type)}
                disabled={!canAfford}
                className={`p-3 rounded-sm border-2 text-left transition-all ${
                  canAfford
                    ? 'border-border bg-card hover:border-primary hover:bg-primary/5'
                    : 'border-border/50 bg-muted/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BuildingSprite type={b.type} level={nextLevel} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[0.55rem] text-foreground truncate">{b.name}</p>
                    <p className="text-[0.5rem] text-muted-foreground">{b.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-display text-[0.5rem] text-muted-foreground">
                      Lv {!maxed ? nextLevel : 'MAX'}
                    </span>
                    {nextLevel > 1 && (
                      <ArrowUp className="w-2.5 h-2.5 text-secondary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className={`w-3 h-3 ${canAfford ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <span className={`font-body font-bold text-xs ${canAfford ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cost}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}