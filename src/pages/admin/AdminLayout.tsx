import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  Coins,
  CreditCard,
  DatabaseBackup,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Palette,
  Percent,
  PlusCircle,
  Settings,
  Shield,
  Tag,
  Truck,
  UserCog,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/dashboard/products', icon: Package },
  { label: 'Add Product', to: '/admin/dashboard/products/new', icon: PlusCircle },
  { label: 'Categories', to: '/admin/dashboard/categories', icon: FolderTree },
  { label: 'Subcategories', to: '/admin/dashboard/subcategories', icon: Layers },
  { label: 'Orders', to: '/admin/dashboard/orders', icon: ClipboardList },
  { label: 'Customers', to: '/admin/dashboard/customers', icon: Users },
  { label: 'Banners', to: '/admin/dashboard/banners', icon: ImageIcon },
  { label: 'Flash Sales', to: '/admin/dashboard/flash-sales', icon: Zap },
  { label: 'Coupons', to: '/admin/dashboard/coupons', icon: Tag },
  { label: 'Discounts', to: '/admin/dashboard/discounts', icon: Percent },
  { label: 'Payments', to: '/admin/dashboard/payments', icon: CreditCard },
  { label: 'Shipping Settings', to: '/admin/dashboard/shipping', icon: Truck },
  { label: 'Reviews', to: '/admin/dashboard/reviews', icon: MessageSquare },
  { label: 'Homepage Management', to: '/admin/dashboard/homepage', icon: LayoutTemplate },
  { label: 'Coins & Games Studio', to: '/admin/dashboard/coins-games', icon: Coins },
  { label: 'Website Settings', to: '/admin/dashboard/settings', icon: Settings },
  { label: 'Quick Studio (Profile/Banner/Theme)', to: '/admin/dashboard/quick-studio', icon: Palette },
  { label: 'Logo Management', to: '/admin/dashboard/logo', icon: ImageIcon },
  { label: 'Admin Profile', to: '/admin/dashboard/profile', icon: UserCog },
  { label: 'Admin Users & Roles', to: '/admin/dashboard/users', icon: Shield },
  { label: 'Reports & Analytics', to: '/admin/dashboard/reports', icon: BarChart3 },
  { label: 'Backup & Data', to: '/admin/dashboard/backup', icon: DatabaseBackup },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { adminUser, logout } = useAuth();
  const { websiteSettings } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#F85606] text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}

      <div className="pt-3 mt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center justify-between border-b border-slate-800">
          <Link to="/admin/dashboard" className="font-display text-lg font-extrabold tracking-tight">
            <span className="text-[#F85606]">AS</span> World Admin
          </Link>
        </div>
        {renderNav()}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col h-full z-10">
            <div className="px-5 h-16 flex items-center justify-between border-b border-slate-800">
              <span className="font-display text-lg font-extrabold">
                <span className="text-[#F85606]">AS</span> World Admin
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close sidebar"
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNav(() => setDrawerOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {websiteSettings.websiteName || 'AS World'} Control Panel
              </p>
              <p className="text-xs text-slate-500">
                {adminUser?.name} · {adminUser?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-[#F85606] rounded-lg text-xs font-semibold text-slate-700 hover:text-[#F85606] transition-colors whitespace-nowrap"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
