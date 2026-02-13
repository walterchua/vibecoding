import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMerchantStore } from '../store/merchantStore';
import { RootStackParamList } from '../../App';

export default function MerchantListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { myMerchants, currentMerchantBrandId, setCurrentMerchant, loadMyMerchants, isLoading } = useMerchantStore();

  useEffect(() => {
    loadMyMerchants();
  }, []);

  const onRefresh = useCallback(async () => {
    await loadMyMerchants();
  }, []);

  const handleSelectMerchant = async (merchantBrandId: string) => {
    await setCurrentMerchant(merchantBrandId);
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Merchants</Text>
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => navigation.navigate('MerchantDiscover')}
        >
          <Ionicons name="search" size={20} color="#6366f1" />
          <Text style={styles.discoverText}>Discover</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={myMerchants}
        keyExtractor={(item) => item.merchantBrandId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.merchantCard,
              currentMerchantBrandId === item.merchantBrandId && styles.merchantCardActive,
            ]}
            onPress={() => handleSelectMerchant(item.merchantBrandId)}
          >
            <View style={styles.merchantIcon}>
              <Ionicons name="storefront" size={28} color="#6366f1" />
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{item.brand?.name || 'Unknown'}</Text>
              <View style={styles.merchantStats}>
                <Text style={styles.merchantPoints}>
                  {item.availablePoints?.toLocaleString() || 0} pts
                </Text>
              </View>
            </View>
            {currentMerchantBrandId === item.merchantBrandId && (
              <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
            )}
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No merchants yet</Text>
            <Text style={styles.emptyText}>Discover and join merchants to earn rewards</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('MerchantDiscover')}
            >
              <Text style={styles.emptyButtonText}>Discover Merchants</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  discoverText: { color: '#6366f1', fontWeight: '600', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  merchantCardActive: { borderWidth: 2, borderColor: '#6366f1' },
  merchantIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  merchantStats: { flexDirection: 'row', gap: 12 },
  merchantPoints: { fontSize: 14, color: '#6366f1', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 20 },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
