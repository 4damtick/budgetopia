import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  const isMapRoute = location.pathname === '/';

  if (isMapRoute) {
    return (
      <div className="h-screen overflow-hidden bg-[#11131d]">
        <div className="relative h-screen w-full overflow-hidden bg-[#1a1b26]">
          <main className="relative h-full overflow-hidden">
            {children || <Outlet />}
          </main>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
            <div className="pointer-events-auto">
              <TopBar />
            </div>
          </div>
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11131d] px-0 md:flex md:items-center md:justify-center md:p-6">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#1a1b26] md:min-h-[812px] md:max-w-md md:rounded-[2rem] md:border md:border-white/10 md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <TopBar />
        <main className="relative flex-1 pb-24">
          {children || <Outlet />}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
