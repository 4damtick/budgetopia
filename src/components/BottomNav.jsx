import { Map, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const current = location.pathname;

  const items = [
    { path: '/', icon: Map, label: 'Map' },
    { path: '/budget', icon: Wallet, label: 'Budget' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-0 bg-[#2a2c35] rounded-2xl px-2 py-1.5 shadow-xl shadow-black/40">
        {items.map((item, idx) => {
          const isActive = current === item.path;
          return (
            <Link key={idx} to={item.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'bg-[#3d404d]' : ''}`}>
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={1.5} />
              <span className={`font-body text-[0.65rem] ${isActive ? 'text-white' : 'text-gray-400'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
