import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useMerchantStore } from '../store/merchantStore';

interface MerchantBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

export default function MerchantDiscoverScreen() {
  const navigation = useNavigation();
  const { myMerchants, joinMerchant } = useMerchantStore();
  const [brands, setBrands] = useState<MerchantBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const joinedIds = new Set(myMerchants.map((m) => m.merchantBrandId));

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await api.browseMerchants();
      setBrands(response.merchants || []);
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (brand: MerchantBrand) => {
    Alert.alert('Join Merchant', `Join ${brand.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Join',
        onPress: async () => {
          setJoining(brand.id);
          try {
            await joinMerchant(brand.id);
            Alert.alert('Welcome!', `You've joined ${brand.name}. Start earning rewards!`);
          } catch (error) {
            Alert.alert('Error', 'Failed to join merchant');
          } finally {
            setJoining(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Discover Merchants</Text>
      </View>

      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isJoined = joinedIds.has(item.id);
          return (
            <View style={styles.brandCard}>
              <View style={styles.brandIcon}>
                <Ionicons name="storefront" size={32} color="#6366f1" />
              </View>
              <View style={styles.brandInfo}>
                <Text style={styles.brandName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.brandDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              {isJoined ? (
                <View style={styles.joinedBadge}>
                  <Ionicons name="checkmark" size={16} color="#059669" />
                  <Text style={styles.joinedText}>Joined</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.joinButton, joining === item.id && styles.joinButtonDisabled]}
                  onPress={() => handleJoin(item)}
                  disabled={joining === item.id}
                >
                  <Text style={styles.joinButtonText}>
                    {joining === item.id ? 'Joining...' : 'Join'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No merchants available</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  list: { padding: 16, gap: 12 },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  brandIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  brandInfo: { flex: 1 },
  brandName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  brandDescription: { fontSize: 13, color: '#6b7280' },
  joinButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  joinButtonDisabled: { backgroundColor: '#a5b4fc' },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  joinedText: { color: '#059669', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
});
