import { NavLink } from 'react-router-dom';

const mobileNavItems = [
  { path: '/', icon: 'ri-home-4-line', label: 'Home' },
  { path: '/ai-assistant', icon: 'ri-robot-2-line', label: 'AI' },
  { path: '/wallet', icon: 'ri-wallet-3-line', label: 'Wallet' },
  { path: '/prompts', icon: 'ri-file-text-line', label: 'Prompts' },
  { path: '/settings', icon: 'ri-settings-3-line', label: 'Settings' },
];

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-puma-surface border-t border-puma-border/30">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer min-w-[56px] ${
                isActive ? 'text-puma-accent' : 'text-puma-muted'
              }`
            }
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <i className={`${item.icon} text-xl`}></i>
            </div>
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}