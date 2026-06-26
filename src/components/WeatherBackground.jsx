import { Cloud, CloudRain, Sun } from 'lucide-react';

export default function WeatherBackground({ weather }) {
  const isSunny = weather === 'sunny';

  return (
    <div
      className={`absolute inset-0 transition-all duration-1000 overflow-hidden pointer-events-none ${
        isSunny
          ? 'bg-gradient-to-b from-amber-900/30 via-amber-800/10 to-transparent'
          : 'bg-gradient-to-b from-slate-700/50 via-slate-600/20 to-slate-500/5'
      }`}
      style={{ zIndex: 0 }}
    >
      <div className="relative h-full w-full">
        {isSunny ? (
          <>
            <Sun className="absolute top-4 right-8 w-10 h-10 text-yellow-400/80 drop-shadow-lg" />
            <div className="absolute top-8 right-20 w-3 h-3 bg-yellow-300/50 rounded-none blur-sm" />
            <div className="absolute top-12 right-14 w-2 h-2 bg-yellow-200/40 rounded-none blur-sm" />
          </>
        ) : (
          <>
            <CloudRain className="absolute top-4 right-6 w-10 h-10 text-slate-400/60 drop-shadow-lg" />
            <Cloud className="absolute top-2 right-16 w-8 h-8 text-slate-500/40 drop-shadow" />
            <Cloud className="absolute top-8 right-20 w-7 h-7 text-slate-400/30 drop-shadow" />
            <div className="absolute top-16 right-10 w-1 h-3 bg-slate-400/40 rounded-none animate-bounce" style={{ animationDuration: '0.8s' }} />
            <div className="absolute top-20 right-20 w-1 h-2 bg-slate-400/30 rounded-none animate-bounce" style={{ animationDuration: '1.1s', animationDelay: '0.2s' }} />
          </>
        )}
      </div>
    </div>
  );
}
