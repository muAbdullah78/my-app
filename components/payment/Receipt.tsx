import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Payment } from '@/lib/payment';

type ReceiptProps = {
  payment: Payment;
  onClose: () => void;
};

export default function Receipt({ payment, onClose }: ReceiptProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Order Receipt\nAmount: $${payment.amount}\nDate: ${new Date(payment.created_at).toLocaleDateString()}\nStatus: ${payment.status}\nPayment Method: Cash on Delivery`,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Receipt</Text>
        <Text style={styles.date}>
          {new Date(payment.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>${payment.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[
              styles.detailValue,
              { color: payment.status === 'succeeded' ? '#4CAF50' : '#FFA500' }
            ]}>
              {payment.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>Cash on Delivery</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{payment.order_id}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color="#007AFF" />
          <Text style={styles.shareText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 