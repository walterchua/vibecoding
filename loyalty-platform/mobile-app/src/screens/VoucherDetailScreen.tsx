import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { api } from '../services/api';

type Props = {
  route: RouteProp<RootStackParamList, 'VoucherDetail'>;
};

interface VoucherDetail {
  id: string;
  voucherId: string;
  voucher: {
    id: string;
    name: string;
    description?: string;
    type: string;
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    termsConditions?: string;
    validUntil: string;
  };
  status: string;
  expiresAt: string;
  usedAt?: string;
  usedAtLocation?: string;
}

export default function VoucherDetailScreen({ route }: Props) {
  const navigation = useNavigation();
  const { voucherId } = route.params;
  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    loadVoucher();
  }, []);

  const loadVoucher = async () => {
    try {
      const response = await api.getMemberVoucherById(voucherId);
      setVoucher(response.memberVoucher);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voucher details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!voucher) return;

    setIsGeneratingQR(true);
    try {
      const response = await api.generateVoucherQR(voucher.id);
      // Navigate to QR screen or show QR modal
      Alert.alert('QR Generated', 'Show this QR code at the store to redeem your voucher.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const formatValue = () => {
    if (!voucher) return '';
    if (voucher.voucher.type === 'percentage') return `${voucher.voucher.value}% OFF`;
    if (voucher.voucher.type === 'fixed') return `$${voucher.voucher.value} OFF`;
    return 'FREE ITEM';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!voucher) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Voucher not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = new Date(voucher.expiresAt) < new Date();
  const isUsed = voucher.status === 'used';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Value Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerValue}>{formatValue()}</Text>
          <View
            style={[
              styles.statusBadge,
              isUsed
                ? styles.statusUsed
                : isExpired
                ? styles.statusExpired
                : styles.statusActive,
            ]}
          >
            <Text style={styles.statusText}>
              {isUsed ? 'USED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.voucherName}>{voucher.voucher.name}</Text>
          {voucher.voucher.description && (
            <Text style={styles.voucherDescription}>
              {voucher.voucher.description}
            </Text>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <View>
                <Text style={styles.infoLabel}>Valid Until</Text>
                <Text style={styles.infoValue}>
                  {new Date(voucher.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {voucher.voucher.minPurchase && (
              <View style={styles.infoItem}>
                <Ionicons name="cart-outline" size={20} color="#6b7280" />
                <View>
                  <Text style={styles.infoLabel}>Minimum Purchase</Text>
                  <Text style={styles.infoValue}>
                    ${voucher.voucher.minPurchase}
                  </Text>
                </View>
              </View>
            )}

            {voucher.voucher.maxDiscount && (
              <View style={styles.infoItem}>
                <Ionicons name="trending-down-outline" size={20} color="#6b7280" />
                <View>
                  <Text style={styles.infoLabel}>Maximum Discount</Text>
                  <Text style={styles.infoValue}>
                    ${voucher.voucher.maxDiscount}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {isUsed && voucher.usedAt && (
            <View style={styles.usedInfo}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View>
                <Text style={styles.usedLabel}>Redeemed on</Text>
                <Text style={styles.usedValue}>
                  {new Date(voucher.usedAt).toLocaleDateString()} at{' '}
                  {voucher.usedAtLocation || 'Unknown location'}
                </Text>
              </View>
            </View>
          )}

          {voucher.voucher.termsConditions && (
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Terms & Conditions</Text>
              <Text style={styles.termsText}>
                {voucher.voucher.termsConditions}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      {voucher.status === 'active' && !isExpired && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.redeemButton, isGeneratingQR && styles.redeemButtonDisabled]}
            onPress={handleGenerateQR}
            disabled={isGeneratingQR}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.redeemButtonText}>
              {isGeneratingQR ? 'Generating...' : 'Generate QR to Redeem'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  banner: {
    backgroundColor: '#6366f1',
    padding: 32,
    alignItems: 'center',
  },
  bannerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusUsed: {
    backgroundColor: '#fef2f2',
  },
  statusExpired: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  details: {
    backgroundColor: '#fff',
    padding: 24,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  voucherName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  voucherDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  usedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  usedLabel: {
    fontSize: 12,
    color: '#065f46',
  },
  usedValue: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  termsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 24,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  redeemButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
