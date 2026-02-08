import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Ticket,
  Receipt,
  BarChart3,
  Crown,
  Shield,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Vouchers', href: '/vouchers', icon: Ticket },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

const settingsNav = [
  { name: 'Membership', href: '/settings/membership', icon: Crown },
  { name: 'Admin', href: '/settings/admin', icon: Shield },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col">
        <div className="flex h-16 items-center px-6 border-b">
          <span className="text-xl font-bold text-indigo-600">Loyalty Admin</span>
        </div>
        <nav className="mt-6 px-3 flex-1">
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
        </nav>
        <div className="px-3 pb-4 border-t pt-4">
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
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <header className="h-16 bg-white shadow-sm flex items-center px-6">
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
