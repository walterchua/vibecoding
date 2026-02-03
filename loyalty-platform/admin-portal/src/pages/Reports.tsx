import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getRevenueReport, getMemberReport } from '../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: () => getRevenueReport(),
  });

  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['member-report'],
    queryFn: getMemberReport,
  });

  const revenueChartData = (revenueData?.report || []).map((item: { date: string; totalRevenue: number; totalPoints: number; transactionCount: number }) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Number(item.totalRevenue) || 0,
    points: Number(item.totalPoints) || 0,
    transactions: Number(item.transactionCount) || 0,
  }));

  const tierData = (memberData?.tierDistribution || []).map((item: { 'tier.name': string; count: number }) => ({
    name: item['tier.name'] || 'Unknown',
    value: Number(item.count) || 0,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports & Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Revenue (Last 30 Days)</h3>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Points Issued Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Points Issued (Last 30 Days)</h3>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="points" stroke="#10b981" strokeWidth={2} dot={false} name="Points" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tier Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Member Tier Distribution</h3>
          {memberLoading ? (
            <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie data={tierData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {tierData.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-40">
                {tierData.map((item: { name: string; value: number }, index: number) => (
                  <div key={item.name} className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transactions Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Transaction Volume</h3>
          {revenueLoading ? (
            <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="#f59e0b" strokeWidth={2} dot={false} name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
