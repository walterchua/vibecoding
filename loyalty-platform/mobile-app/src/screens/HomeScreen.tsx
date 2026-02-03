import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

interface PointsTransaction {
  id: string;
  type: string;
  points: number;
  description?: string;
  createdAt: string;
}

export default function HomeScreen() {
  const { member, refreshProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [tierProgress, setTierProgress] = useState<{
    progress: number;
    pointsToNextTier: number;
    nextTier?: { name: string };
  } | null>(null);

  const loadData = async () => {
    try {
      const [historyRes, tierRes] = await Promise.all([
        api.getPointsHistory(1, 5),
        api.getTierProgress(),
      ]);
      setTransactions(historyRes.transactions);
      setTierProgress(tierRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadData()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const renderTransaction = ({ item }: { item: PointsTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.type === 'earn' ? 'add-circle' : 'remove-circle'}
          size={24}
          color={item.type === 'earn' ? '#10b981' : '#ef4444'}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>
          {item.description || item.type}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionPoints,
          { color: item.type === 'earn' ? '#10b981' : '#ef4444' },
        ]}
      >
        {item.type === 'earn' ? '+' : ''}{item.points}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {member?.firstName || 'Member'}!
          </Text>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: member?.tier?.color || '#CD7F32' }]}>
              {member?.tier?.name || 'Bronze'}
            </Text>
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Available Points</Text>
          <Text style={styles.pointsValue}>
            {member?.points?.available?.toLocaleString() || 0}
          </Text>
          <View style={styles.pointsDetails}>
            <View style={styles.pointsDetailItem}>
              <Text style={styles.pointsDetailLabel}>Lifetime</Text>
              <Text style={styles.pointsDetailValue}>
                {member?.points?.lifetime?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Tier Progress */}
        {tierProgress?.nextTier && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progress to {tierProgress.nextTier.name}</Text>
              <Text style={styles.progressPoints}>
                {tierProgress.pointsToNextTier} pts to go
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${tierProgress.progress}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="qr-code" size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionText}>Scan & Earn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="ticket" size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionText}>My Vouchers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="gift" size={24} color="#6366f1" />
            </View>
            <Text style={styles.actionText}>Redeem</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {transactions.length > 0 ? (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tierBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tierText: {
    fontWeight: '600',
    fontSize: 14,
  },
  pointsCard: {
    backgroundColor: '#6366f1',
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 24,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pointsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsDetailItem: {},
  pointsDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  pointsDetailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPoints: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    color: '#9ca3af',
  },
});
