import { useMemo } from 'react';
import { PlusCircle } from 'lucide-react';
import HexGrid from '@/components/HexGrid';
import WeatherBackground from '@/components/WeatherBackground';
import { getWeather } from '@/lib/gameLogic';

export default function Home({
  profile, transactions, buildings, island, onHexClick, onLogClick,
}) {
  const weather = useMemo(() => (profile ? getWeather(profile, transactions) : 'sunny'), [profile, transactions]);

  return (
    <div className="relative h-full overflow-hidden">
      <WeatherBackground weather={weather} />
      <div className="absolute inset-0 z-10">
        <HexGrid island={island} buildings={buildings} onHexClick={onHexClick} weather={weather} />
      </div>
      <button onClick={onLogClick}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 transition-transform hover:scale-110 active:scale-95">
        <PlusCircle className="w-6 h-6 text-primary-foreground" />
      </button>
    </div>
  );
}
