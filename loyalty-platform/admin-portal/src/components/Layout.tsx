import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Ticket,
  Receipt,
  BarChart3,
  Crown,
  Shield,
  Store,
  MapPin,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const admin = useAuthStore((s) => s.admin);
  const logout = useAuthStore((s) => s.logout);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const isMerchantAdmin = useAuthStore((s) => s.isMerchantAdmin);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Vouchers', href: '/vouchers', icon: Ticket },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const managementNav = [
    ...(isSuperAdmin() ? [{ name: 'Merchant Brands', href: '/merchant-brands', icon: Store }] : []),
    ...(isMerchantAdmin() ? [{ name: 'Outlets', href: '/outlets', icon: MapPin }] : []),
    ...(isMerchantAdmin() ? [{ name: 'Staff', href: '/staff', icon: UserCog }] : []),
  ];

  const settingsNav = [
    { name: 'Membership', href: '/settings/membership', icon: Crown },
    { name: 'Admin', href: '/settings/admin', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-indigo-600">Loyalty Admin</span>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-800 truncate">
            {admin?.firstName} {admin?.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
            {admin?.role?.replace(/_/g, ' ')}
          </span>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}

          {managementNav.length > 0 && (
            <div className="mt-4 mb-2">
              <p className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Management
              </p>
              {managementNav.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="px-3 pb-2 border-t pt-4">
          <p className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </p>
          {settingsNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="px-3 pb-4 border-t pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            Loyalty Platform Admin
          </h1>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
