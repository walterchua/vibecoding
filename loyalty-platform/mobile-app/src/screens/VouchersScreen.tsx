import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useMerchantStore } from '../store/merchantStore';

interface Voucher {
  id: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  pointsCost: number;
  validUntil: string;
}

interface MemberVoucher {
  id: string;
  voucherId: string;
  voucher: Voucher;
  status: string;
  expiresAt: string;
}

type TabType = 'available' | 'myVouchers';

export default function VouchersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { member, refreshProfile } = useAuthStore();
  const { currentMerchantBrandId } = useMerchantStore();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [myVouchers, setMyVouchers] = useState<MemberVoucher[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadVouchers = async () => {
    try {
      const brandId = currentMerchantBrandId || undefined;
      const [available, mine] = await Promise.all([
        api.getAvailableVouchers(brandId),
        api.getMemberVouchers('active', brandId),
      ]);
      setAvailableVouchers(available.vouchers || []);
      setMyVouchers(mine.vouchers || []);
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVouchers();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [currentMerchantBrandId]);

  const handleClaimVoucher = async (voucher: Voucher) => {
    if (!member || member.points.available < voucher.pointsCost) {
      Alert.alert('Insufficient Points', 'You do not have enough points to claim this voucher.');
      return;
    }

    Alert.alert(
      'Claim Voucher',
      `Claim "${voucher.name}" for ${voucher.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setClaiming(voucher.id);
            try {
              await api.claimVoucher(voucher.id, currentMerchantBrandId || undefined);
              await Promise.all([loadVouchers(), refreshProfile()]);
              Alert.alert('Success', 'Voucher claimed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to claim voucher');
            } finally {
              setClaiming(null);
            }
          },
        },
      ]
    );
  };

  const formatValue = (voucher: Voucher) => {
    if (voucher.type === 'percentage') return `${voucher.value}% OFF`;
    if (voucher.type === 'fixed') return `$${voucher.value} OFF`;
    return 'FREE';
  };

  const renderAvailableVoucher = ({ item }: { item: Voucher }) => (
    <TouchableOpacity
      style={styles.voucherCard}
      onPress={() => navigation.navigate('VoucherDetail', { voucherId: item.id })}
    >
      <View style={styles.voucherBadge}>
        <Text style={styles.voucherBadgeText}>{formatValue(item)}</Text>
      </View>
      <View style={styles.voucherInfo}>
        <Text style={styles.voucherName}>{item.name}</Text>
        <Text style={styles.voucherDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
        <View style={styles.voucherMeta}>
          <Text style={styles.voucherPoints}>
            <Ionicons name="star" size={14} color="#f59e0b" /> {item.pointsCost} pts
          </Text>
          <Text style={styles.voucherExpiry}>
            Valid until {new Date(item.validUntil).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.claimButton,
          claiming === item.id && styles.claimButtonDisabled,
        ]}
        onPress={() => handleClaimVoucher(item)}
        disabled={claiming === item.id}
      >
        <Text style={styles.claimButtonText}>
          {claiming === item.id ? 'Claiming...' : 'Claim'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMyVoucher = ({ item }: { item: MemberVoucher }) => (
    <TouchableOpacity
      style={styles.voucherCard}
      onPress={() => navigation.navigate('VoucherDetail', { voucherId: item.id })}
    >
      <View style={styles.voucherBadge}>
        <Text style={styles.voucherBadgeText}>{formatValue(item.voucher)}</Text>
      </View>
      <View style={styles.voucherInfo}>
        <Text style={styles.voucherName}>{item.voucher.name}</Text>
        <Text style={styles.voucherDescription} numberOfLines={2}>
          {item.voucher.description || 'No description'}
        </Text>
        <View style={styles.voucherMeta}>
          <View style={[styles.statusBadge, styles[`status_${item.status}` as keyof typeof styles] || {}]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.voucherExpiry}>
            Expires {new Date(item.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vouchers</Text>
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.pointsText}>
            {member?.points?.available?.toLocaleString() || 0}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myVouchers' && styles.tabActive]}
          onPress={() => setActiveTab('myVouchers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'myVouchers' && styles.tabTextActive,
            ]}
          >
            My Vouchers ({myVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'available' ? availableVouchers : myVouchers}
        renderItem={activeTab === 'available' ? renderAvailableVoucher : renderMyVoucher}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No vouchers</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'available'
                ? 'Check back later for new vouchers'
                : 'Claim vouchers to see them here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pointsText: {
    fontWeight: '600',
    color: '#92400e',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  voucherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  voucherBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  voucherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voucherPoints: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  voucherExpiry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  claimButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  status_active: {
    backgroundColor: '#d1fae5',
  },
  status_used: {
    backgroundColor: '#fee2e2',
  },
  status_expired: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
