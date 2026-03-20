import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Settings, User, Eye } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('admin_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('admin_mode', isAdmin.toString());
  }, [isAdmin]);

  const navItems = [
    { path: '/', label: '简介' },
    { path: '/projects', label: '项目' },
    { path: '/growth', label: '个人成长' },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-[99999] flex items-center justify-between px-8 md:px-12">
        <div className="flex items-center gap-4">
          <div className="font-serif text-sm text-gray-500 select-none">
            陈泓利的...
          </div>
        </div>
        <ul className="flex items-center gap-6 md:gap-10 h-full">
          {navItems.map((item, index) => {
            const colors = ['text-brand-orange', 'text-brand-red', 'text-brand-green'];
            const activeColor = colors[index % colors.length];
            
            return (
              <li key={item.path} className="h-full">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `h-full flex items-center justify-center min-w-[80px] font-serif transition-colors duration-150 ${
                      isActive
                        ? `text-2xl font-bold ${activeColor}`
                        : 'text-lg text-gray-500 hover:text-gray-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16 flex-1 flex flex-col min-h-screen">
        <Outlet context={{ isAdmin }} />
      </main>

      {/* Footer */}
      {location.pathname !== '/projects' && (
        <footer className={`absolute bottom-4 z-50 pointer-events-none leading-tight text-[8px] text-gray-400 ${
          location.pathname === '/'
            ? 'left-[calc(50%+64px)] -translate-x-1/2 text-center'
            : location.pathname === '/growth'
            ? 'left-[calc(50%+32px)] -translate-x-1/2 text-center'
            : 'left-0 right-0 text-center'
        }`}>
          <p>© 2026 陈泓利</p>
          <p>chl_work0726@163.com</p>
        </footer>
      )}
    </div>
  );
}
