import { X, Coins, Trash2, MapPin, ArrowUpCircle } from 'lucide-react';
import {
  BUILDINGS,
  DECOR_CLEAR_COST,
  getBuildingCost,
  getBuildingPlacementIssue,
  getTileDecorLabel,
} from '@/lib/gameLogic';
import BuildingSprite from './BuildingSprite';

export default function HexInteractionModal({
  isOpen,
  onClose,
  hexQ,
  hexR,
  building,
  tileDecor,
  island,
  totalPoints,
  onBuild,
  onClearDecor,
  onDemolish,
  onUpgrade,
}) {
  if (!isOpen) return null;

  const occupied = !!building;
  const buildingDef = occupied ? BUILDINGS.find(item => item.type === building.buildingType) : null;
  const nextLevel = occupied ? building.level + 1 : 1;
  const upgradeCost = occupied ? getBuildingCost(building.buildingType, nextLevel) : 0;
  const canUpgrade = occupied && nextLevel <= 3 && totalPoints >= upgradeCost;
  const decorLabel = getTileDecorLabel(tileDecor);
  const canClearDecor = !!tileDecor && totalPoints >= DECOR_CLEAR_COST;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl border-t-4 border-primary bg-card p-6 animate-in slide-in-from-bottom sm:rounded-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display text-xs text-foreground">
              Tile ({hexQ}, {hexR})
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {occupied ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-sm bg-muted p-4">
              <BuildingSprite type={building.buildingType} level={building.level} size={48} />
              <div>
                <p className="font-display text-[0.65rem] text-foreground">{buildingDef?.name || building.buildingType}</p>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">Level {building.level}</p>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">
                  {nextLevel <= 3 ? (
                    <span className="inline-flex items-center gap-1">
                      Upgrade cost: {upgradeCost} <Coins className="h-3.5 w-3.5 text-secondary" />
                    </span>
                  ) : 'MAX level'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[0.55rem] font-heading uppercase tracking-wider text-muted-foreground">Actions</p>

              <button
                onClick={() => {
                  const result = onUpgrade?.(building.id);
                  if (result?.success || result?.reason) return;
                }}
                disabled={!canUpgrade}
                className={`flex w-full items-center justify-between rounded-sm border-2 p-3 transition-colors ${
                  canUpgrade
                    ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
                    : 'cursor-not-allowed border-border bg-muted/50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-primary" />
                  <span className="font-display text-[0.6rem] text-foreground">Upgrade</span>
                </div>
                <span className="font-body text-xs text-muted-foreground">
                  {nextLevel <= 3 ? `To Lv ${nextLevel}` : 'MAX'}
                </span>
              </button>

              <button
                onClick={() => { onDemolish(building.id); onClose(); }}
                className="flex w-full items-center justify-between rounded-sm border-2 border-red-500/30 bg-red-500/5 p-3 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span className="font-display text-[0.6rem] text-red-400">Demolish</span>
                </div>
                <span className="inline-flex items-center gap-1 font-body text-xs text-red-400">
                  Cost: {buildingDef ? Math.round(buildingDef.cost * building.level * 0.2) : 10} <Coins className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-body text-xs text-muted-foreground">Choose a building to construct on this tile:</p>
            <div className="flex items-center gap-1.5 rounded-sm bg-secondary/20 px-3 py-1.5">
              <span className="inline-flex items-center gap-1 font-display text-[0.6rem] text-secondary-foreground">
                <Coins className="h-3.5 w-3.5 text-secondary" /> {totalPoints} available
              </span>
            </div>

            {tileDecor && (
              <div className="space-y-3 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3">
                <div>
                  <p className="font-display text-[0.6rem] text-foreground">{decorLabel.charAt(0).toUpperCase() + decorLabel.slice(1)} on this tile</p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    Clear the {decorLabel} first before placing any building here.
                  </p>
                </div>
                <button
                  onClick={() => canClearDecor && onClearDecor?.(hexQ, hexR)}
                  disabled={!canClearDecor}
                  className={`flex w-full items-center justify-between rounded-sm border-2 p-3 transition-colors ${
                    canClearDecor
                      ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10'
                      : 'cursor-not-allowed border-border bg-muted/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-amber-300" />
                    <span className="font-display text-[0.6rem] text-foreground">Clear {decorLabel}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground">
                    <Coins className="h-3.5 w-3.5 text-secondary" /> {DECOR_CLEAR_COST}
                  </span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {BUILDINGS.map(item => {
                const cost = getBuildingCost(item.type, 1);
                const canAfford = totalPoints >= cost;
                const placementIssue = getBuildingPlacementIssue(item.type, island, hexQ, hexR);
                const canPlaceHere = !placementIssue;
                const canBuildHere = canAfford && canPlaceHere;
                const tileMessage = placementIssue === 'tile_decor'
                  ? `Clear ${decorLabel} first`
                  : placementIssue === 'harbor_coast'
                    ? 'Right coast tiles only'
                    : item.description;

                return (
                  <button key={item.type} onClick={() => canBuildHere && onBuild(item.type, hexQ, hexR)} disabled={!canBuildHere}
                    className={`rounded-sm border-2 p-3 text-left transition-all ${
                      canBuildHere ? 'border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-[0.98]'
                        : 'cursor-not-allowed border-border/50 bg-muted/50 opacity-50'
                    }`}>
                    <div className="mb-2 flex items-center gap-2">
                      <BuildingSprite type={item.type} level={1} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[0.5rem] text-foreground">{item.name}</p>
                        <p className="truncate text-[0.45rem] text-muted-foreground">{tileMessage}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[0.45rem] text-muted-foreground">Lv 1</span>
                      <div className="flex items-center gap-1">
                        <Coins className={`w-3 h-3 ${canAfford ? 'text-secondary' : 'text-muted-foreground'}`} />
                        <span className={`font-body text-xs font-bold ${canAfford ? 'text-foreground' : 'text-muted-foreground'}`}>{cost}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
