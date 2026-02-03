import { useQuery } from '@tanstack/react-query';
import { Users, Star, Ticket, Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { getDashboardStats } from '../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(change)}% from last week
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats?.totalMembers || 0}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          title="New Today"
          value={stats?.newMembersToday || 0}
          icon={Users}
          color="bg-green-500"
        />
        <StatCard
          title="Active Vouchers"
          value={stats?.activeVouchers || 0}
          icon={Ticket}
          color="bg-orange-500"
        />
        <StatCard
          title="Today's Transactions"
          value={stats?.todayTransactions || 0}
          icon={Receipt}
          color="bg-blue-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Active Campaigns</h3>
          <div className="text-4xl font-bold text-indigo-600">
            {stats?.activeCampaigns || 0}
          </div>
          <p className="text-gray-500 mt-2">Running campaigns</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Total Points Issued</h3>
          <div className="flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            <span className="text-4xl font-bold text-gray-800">
              {(stats?.totalPointsIssued || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-500 mt-2">Lifetime points awarded</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 transition-colors">
            Create Campaign
          </button>
          <button className="bg-white border border-gray-200 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-50 transition-colors">
            Add Voucher
          </button>
          <button className="bg-white border border-gray-200 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-50 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
