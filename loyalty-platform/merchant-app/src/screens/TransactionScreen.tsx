import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { RootStackParamList } from '../../App';

type TransactionRouteProp = RouteProp<RootStackParamList, 'Transaction'>;

export default function TransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute<TransactionRouteProp>();
  const { memberId, memberName, memberPhone, memberPoints, memberTier } = route.params;

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'cash' },
    { id: 'card', label: 'Card', icon: 'card' },
    { id: 'ewallet', label: 'E-Wallet', icon: 'phone-portrait' },
  ];

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.createTransaction({
        memberId,
        memberPhone,
        amount: numAmount,
        paymentMethod,
      });

      Alert.alert(
        'Transaction Complete',
        `Amount: $${numAmount.toFixed(2)}\nPoints Earned: ${result.pointsEarned || 0}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [10, 20, 50, 100];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView>
          {/* Member Info */}
          <View style={styles.memberCard}>
            <View style={styles.memberIcon}>
              <Ionicons name="person" size={32} color="#059669" />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{memberName}</Text>
              <Text style={styles.memberPhone}>{memberPhone}</Text>
              {(memberPoints !== undefined || memberTier) && (
                <View style={styles.memberMeta}>
                  {memberTier && (
                    <View style={styles.tierBadge}>
                      <Text style={styles.tierText}>{memberTier}</Text>
                    </View>
                  )}
                  {memberPoints !== undefined && (
                    <Text style={styles.memberPointsText}>
                      {memberPoints.toLocaleString()} pts
                    </Text>
                  )}
                </View>
              )}
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text style={styles.quickAmountText}>${quickAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    paymentMethod === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={paymentMethod === method.id ? '#059669' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method.id && styles.paymentMethodTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Points Preview */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <View style={styles.pointsPreview}>
              <Ionicons name="star" size={20} color="#7c3aed" />
              <Text style={styles.pointsPreviewText}>
                Member will earn ~{Math.floor(parseFloat(amount))} points
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Processing...' : 'Complete Transaction'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  memberIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  memberPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  tierBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  memberPointsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    minWidth: 100,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  paymentMethodSelected: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  paymentMethodTextSelected: {
    color: '#059669',
  },
  pointsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  pointsPreviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7c3aed',
  },
  submitButton: {
    backgroundColor: '#059669',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6ee7b7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
