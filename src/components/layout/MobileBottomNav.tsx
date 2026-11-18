import { NavLink } from 'react-router-dom';
import { ClipboardList, Grid2X2, Home, Settings, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';

const HUMAN_AVATAR_PATH = '/src/assets/images/profile_avatar_human_1794978644721.jpg';

export function MobileBottomNav() {
  const { user } = useAuth();
  const { cartCount } = useStore();
  const profileImage = user?.photoURL || HUMAN_AVATAR_PATH;

  const iconTabs = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/categories', label: 'Categories', icon: Grid2X2, end: false },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount, end: false },
    { to: '/orders', label: 'Orders', icon: ClipboardList, end: false },
    { to: '/settings', label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200"
    >
      <div className="grid grid-cols-6 h-14 items-center">
        {iconTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              aria-label={tab.label}
              title={tab.label}
              className={({ isActive }) =>
                `relative flex items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive ? 'text-[#F85606]' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <div className="relative flex flex-col items-center justify-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#FFF5F0]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
                  </div>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="absolute top-0 right-0 min-w-[16px] h-[16px] px-1 rounded-full bg-[#F85606] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                  <span className="sr-only">{tab.label}</span>
                </div>
              )}
            </NavLink>
          );
        })}

        {/* My Profile tab rendered with human portrait image and zero text */}
        <NavLink
          to="/account"
          aria-label="My Profile"
          title="My Profile"
          className="relative flex items-center justify-center h-full min-h-[44px]"
        >
          {({ isActive }) => (
            <div className="flex items-center justify-center">
              <div
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                  isActive
                    ? 'border-[#F85606] ring-2 ring-[#F85606]/25 scale-105'
                    : 'border-slate-200'
                }`}
              >
                <img
                  src={profileImage}
                  alt="My Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="sr-only">My Profile</span>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
