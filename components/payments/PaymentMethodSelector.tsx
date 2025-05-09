import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, List, RadioButton, Button, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type PaymentMethod = {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash_on_delivery';
  last_four?: string;
  brand?: string;
  is_default: boolean;
};

type PaymentMethodSelectorProps = {
  userId: string;
  onSelect: (methodId: string) => void;
  selectedMethodId?: string;
};

export default function PaymentMethodSelector({
  userId,
  onSelect,
  selectedMethodId,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;

      if (data) {
        setMethods(data);
        // Select default method if none is selected
        if (!selectedMethodId && data.length > 0) {
          const defaultMethod = data.find(m => m.is_default) || data[0];
          onSelect(defaultMethod.id);
        }
      }
    } catch (err) {
      setError('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return 'credit-card';
      case 'bank_transfer':
        return 'bank';
      case 'cash_on_delivery':
        return 'cash';
      default:
        return 'credit-card';
    }
  };

  const getMethodTitle = (method: PaymentMethod) => {
    switch (method.type) {
      case 'credit_card':
      case 'debit_card':
        return `${method.brand} •••• ${method.last_four}`;
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      default:
        return method.type;
    }
  };

  const handleAddMethod = () => {
    setShowAddDialog(true);
  };

  const handleAddCreditCard = async () => {
    // TODO: Implement Stripe payment method addition
    setShowAddDialog(false);
  };

  const handleAddBankAccount = async () => {
    // TODO: Implement bank account addition
    setShowAddDialog(false);
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading payment methods...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.error}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Select Payment Method
          </Text>

          {methods.length === 0 ? (
            <Text style={styles.emptyText}>No payment methods found</Text>
          ) : (
            <RadioButton.Group
              onValueChange={value => onSelect(value)}
              value={selectedMethodId || ''}
            >
              {methods.map(method => (
                <List.Item
                  key={method.id}
                  title={getMethodTitle(method)}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={getMethodIcon(method.type)}
                    />
                  )}
                  right={props => (
                    <RadioButton
                      {...props}
                      value={method.id}
                      color={colors.primary}
                    />
                  )}
                  style={styles.methodItem}
                />
              ))}
            </RadioButton.Group>
          )}

          <Button
            mode="outlined"
            onPress={handleAddMethod}
            style={styles.addButton}
            icon="plus"
          >
            Add Payment Method
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add Payment Method</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Credit/Debit Card"
              description="Add a new card"
              left={props => <List.Icon {...props} icon="credit-card" />}
              onPress={handleAddCreditCard}
            />
            <List.Item
              title="Bank Account"
              description="Add a bank account"
              left={props => <List.Icon {...props} icon="bank" />}
              onPress={handleAddBankAccount}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    marginVertical: 16,
  },
  methodItem: {
    paddingVertical: 8,
  },
  addButton: {
    marginTop: 16,
  },
}); 