import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../services/api';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  externalId: string;
  posId: string;
  locationName?: string;
  total: number;
  pointsEarned: number;
  status: string;
  transactionDate: string;
  member?: { phone: string; firstName?: string; lastName?: string };
}

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, status],
    queryFn: () => getTransactions({ page, limit: 20, status: status || undefined }),
  });

  const transactions: Transaction[] = data?.transactions || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  const getStatusColor = (s: string) => {
    if (s === 'processed') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2">
          <option value="">All Status</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{tx.externalId}</div><div className="text-xs text-gray-500">POS: {tx.posId}</div></td>
                  <td className="px-6 py-4"><div className="text-sm">{tx.member?.firstName ? `${tx.member.firstName} ${tx.member.lastName || ''}` : tx.member?.phone || 'N/A'}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tx.locationName || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium">${Number(tx.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-indigo-600 font-medium">+{tx.pointsEarned}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>{tx.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(tx.transactionDate), 'MMM d, yyyy HH:mm')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
