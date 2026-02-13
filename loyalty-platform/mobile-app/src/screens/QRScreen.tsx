import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useMerchantStore } from '../store/merchantStore';

interface MemberVoucher {
  id: string;
  voucher: {
    name: string;
    type: string;
    value: number;
  };
  status: string;
}

type QRType = 'membership' | 'points' | 'voucher';

export default function QRScreen() {
  const { member } = useAuthStore();
  const { currentMerchantBrandId } = useMerchantStore();
  const [qrType, setQRType] = useState<QRType>('membership');
  const [qrData, setQRData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pointsAmount, setPointsAmount] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<MemberVoucher | null>(null);
  const [myVouchers, setMyVouchers] = useState<MemberVoucher[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    loadMyVouchers();
  }, []);

  useEffect(() => {
    if (qrType === 'membership') {
      generateMembershipQR();
    } else {
      setQRData(null);
    }
  }, [qrType]);

  useEffect(() => {
    if (expiresAt) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) {
          setQRData(null);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresAt]);

  const loadMyVouchers = async () => {
    try {
      const response = await api.getMemberVouchers('active');
      setMyVouchers(response.vouchers || []);
    } catch (error) {
      console.error('Failed to load vouchers:', error);
    }
  };

  const generateMembershipQR = async () => {
    setIsLoading(true);
    try {
      const response = await api.generateMembershipQR(currentMerchantBrandId || undefined);
      setQRData(response.qrCode.token);
      setExpiresAt(new Date(response.qrCode.expiresAt));
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePointsQR = async () => {
    const points = parseInt(pointsAmount);
    if (!points || points <= 0) {
      Alert.alert('Error', 'Please enter a valid points amount');
      return;
    }
    if (points > (member?.points?.available || 0)) {
      Alert.alert('Error', 'Insufficient points');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.generatePointsQR(points, currentMerchantBrandId || undefined);
      setQRData(response.qrCode.token);
      setExpiresAt(new Date(response.qrCode.expiresAt));
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoucherQR = async () => {
    if (!selectedVoucher) {
      setShowVoucherModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.generateVoucherQR(selectedVoucher.id, currentMerchantBrandId || undefined);
      setQRData(response.qrCode.token);
      setExpiresAt(new Date(response.qrCode.expiresAt));
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>QR Code</Text>
          <Text style={styles.subtitle}>
            Show this QR code to earn or redeem at participating stores
          </Text>
        </View>

        {/* QR Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, qrType === 'membership' && styles.typeButtonActive]}
            onPress={() => setQRType('membership')}
          >
            <Ionicons
              name="card"
              size={20}
              color={qrType === 'membership' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.typeText, qrType === 'membership' && styles.typeTextActive]}>
              Membership
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, qrType === 'points' && styles.typeButtonActive]}
            onPress={() => setQRType('points')}
          >
            <Ionicons
              name="star"
              size={20}
              color={qrType === 'points' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.typeText, qrType === 'points' && styles.typeTextActive]}>
              Points
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, qrType === 'voucher' && styles.typeButtonActive]}
            onPress={() => setQRType('voucher')}
          >
            <Ionicons
              name="ticket"
              size={20}
              color={qrType === 'voucher' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.typeText, qrType === 'voucher' && styles.typeTextActive]}>
              Voucher
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR Display */}
        <View style={styles.qrContainer}>
          {qrData ? (
            <>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrData}
                  size={220}
                  backgroundColor="#fff"
                  color="#1f2937"
                />
              </View>
              {countdown > 0 && (
                <View style={styles.countdownContainer}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.countdownText}>
                    Expires in {formatCountdown()}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="qr-code-outline" size={80} color="#d1d5db" />
              <Text style={styles.placeholderText}>
                {qrType === 'membership'
                  ? 'Loading...'
                  : qrType === 'points'
                  ? 'Enter points amount to generate'
                  : 'Select a voucher to generate'}
              </Text>
            </View>
          )}
        </View>

        {/* Input Section */}
        {qrType === 'points' && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Points to Redeem (Available: {member?.points?.available?.toLocaleString() || 0})
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter points"
              keyboardType="number-pad"
              value={pointsAmount}
              onChangeText={setPointsAmount}
            />
            <TouchableOpacity
              style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
              onPress={generatePointsQR}
              disabled={isLoading}
            >
              <Text style={styles.generateButtonText}>
                {isLoading ? 'Generating...' : 'Generate QR'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {qrType === 'voucher' && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Voucher</Text>
            <TouchableOpacity
              style={styles.voucherSelector}
              onPress={() => setShowVoucherModal(true)}
            >
              <Text style={selectedVoucher ? styles.voucherSelectorText : styles.voucherSelectorPlaceholder}>
                {selectedVoucher ? selectedVoucher.voucher.name : 'Choose a voucher'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.generateButton, (isLoading || !selectedVoucher) && styles.generateButtonDisabled]}
              onPress={generateVoucherQR}
              disabled={isLoading || !selectedVoucher}
            >
              <Text style={styles.generateButtonText}>
                {isLoading ? 'Generating...' : 'Generate QR'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Refresh Button for Membership QR */}
        {qrType === 'membership' && qrData && (
          <TouchableOpacity style={styles.refreshButton} onPress={generateMembershipQR}>
            <Ionicons name="refresh" size={20} color="#6366f1" />
            <Text style={styles.refreshButtonText}>Refresh QR Code</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Voucher</Text>
              <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {myVouchers.length > 0 ? (
                myVouchers.map((voucher) => (
                  <TouchableOpacity
                    key={voucher.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedVoucher(voucher);
                      setShowVoucherModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{voucher.voucher.name}</Text>
                    <Text style={styles.modalItemValue}>
                      {voucher.voucher.type === 'percentage'
                        ? `${voucher.voucher.value}% OFF`
                        : `$${voucher.voucher.value} OFF`}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.modalEmpty}>No vouchers available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeTextActive: {
    color: '#fff',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  countdownText: {
    fontSize: 14,
    color: '#6b7280',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 268,
    width: 268,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  inputSection: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  voucherSelector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  voucherSelectorText: {
    fontSize: 16,
    color: '#1f2937',
  },
  voucherSelectorPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  refreshButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalItemValue: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  modalEmpty: {
    padding: 32,
    textAlign: 'center',
    color: '#9ca3af',
  },
});
