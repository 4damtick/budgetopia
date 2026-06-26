import { Coins } from 'lucide-react';
import { getCityPointsSummary } from '@/lib/gameLogic';

export default function TopBar() {
  const city = getCityPointsSummary();

  return (
    <div className="px-3 pt-3 pb-1">
      <div className="flex items-center bg-[#1e2030]/80 backdrop-blur-md rounded-xl px-3 py-2 border border-white/5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Coins className="h-8 w-8 text-secondary" />
          <div>
            <p className="text-[0.5rem] uppercase tracking-[0.2em] text-gray-400">City Points</p>
            <p className="font-body text-white text-sm font-semibold">{city.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
