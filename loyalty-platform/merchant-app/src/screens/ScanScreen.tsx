import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { RootStackParamList } from '../../App';

interface ScanResult {
  valid: boolean;
  type: 'membership' | 'voucher' | 'points';
  memberId: string;
  memberName: string;
  points?: number;
  voucher?: {
    id: string;
    name: string;
    type: string;
    value: number;
  };
  qrCodeId: string;
}

export default function ScanScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isFocused = useIsFocused();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      const result: ScanResult = await api.scanQR(data);

      if (!result.valid) {
        Alert.alert('Error', 'Invalid QR code');
        setScanned(false);
        return;
      }

      if (result.type === 'membership') {
        // Navigate to transaction screen for member
        navigation.navigate('Transaction', {
          memberId: result.memberId,
          memberName: result.memberName,
          memberPhone: '', // Phone not available from QR
        });
      } else if (result.type === 'voucher' && result.voucher) {
        // Show voucher redemption confirmation
        Alert.alert(
          'Voucher Detected',
          `Member: ${result.memberName}\nVoucher: ${result.voucher.name}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanned(false),
            },
            {
              text: 'Redeem',
              onPress: () => handleRedeemVoucher(data),
            },
          ]
        );
      } else if (result.type === 'points' && result.points) {
        // Show points redemption confirmation
        Alert.alert(
          'Points Redemption',
          `Member: ${result.memberName}\nPoints: ${result.points}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setScanned(false),
            },
            {
              text: 'Redeem',
              onPress: () => handleRedeemPoints(data),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid or expired QR code');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemVoucher = async (token: string) => {
    try {
      setIsProcessing(true);
      await api.consumeQR(token);
      Alert.alert('Success', 'Voucher redeemed successfully!', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to redeem voucher');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemPoints = async (token: string) => {
    try {
      setIsProcessing(true);
      await api.consumeQR(token);
      Alert.alert('Success', 'Points redeemed successfully!', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to redeem points');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#6b7280" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan member and voucher QR codes
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused ? (
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan QR Code</Text>
            <Text style={styles.subText}>
              Point camera at member or voucher QR code
            </Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}

          {scanned && !isProcessing && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
      ) : (
        <View style={styles.camera} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#059669',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
