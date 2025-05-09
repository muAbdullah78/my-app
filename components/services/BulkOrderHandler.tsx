import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, List, Divider, IconButton, Menu, Portal, Dialog } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type BulkItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  notes?: string;
};

type BulkOrderHandlerProps = {
  onBulkOrderCreated: (items: BulkItem[], totalPrice: number) => void;
  serviceId?: string;
};

const ITEM_CATEGORIES = [
  'Shirts',
  'Pants',
  'Dresses',
  'Suits',
  'Bedding',
  'Curtains',
  'Other',
];

export default function BulkOrderHandler({ onBulkOrderCreated, serviceId }: BulkOrderHandlerProps) {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchBulkOrderItems();
    }
  }, [serviceId]);

  const fetchBulkOrderItems = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('bulk_orders')
        .select('*')
        .eq('service_id', serviceId);

      if (error) throw error;

      if (data) {
        const formattedItems = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          category: item.category,
          notes: item.notes,
        }));
        setItems(formattedItems);
      }
    } catch (err) {
      setError('Failed to fetch bulk order items');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateDiscountedTotal = () => {
    const total = calculateTotal();
    const discountAmount = discount ? (total * Number(discount)) / 100 : 0;
    return total - discountAmount;
  };

  const handleAddItem = () => {
    if (!itemName || !quantity || !unitPrice) return;

    const newItem: BulkItem = {
      id: Date.now().toString(),
      name: itemName,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      totalPrice: Number(quantity) * Number(unitPrice),
      category,
      notes,
    };

    setItems([...items, newItem]);
    resetForm();
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleEditItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setItemName(item.name);
      setQuantity(item.quantity.toString());
      setUnitPrice(item.unitPrice.toString());
      setCategory(item.category || '');
      setNotes(item.notes || '');
      setShowAddDialog(true);
      handleRemoveItem(id);
    }
  };

  const resetForm = () => {
    setItemName('');
    setQuantity('');
    setUnitPrice('');
    setCategory('');
    setNotes('');
    setShowAddDialog(false);
  };

  const handleCreateOrder = () => {
    onBulkOrderCreated(items, calculateDiscountedTotal());
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading bulk order items...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Bulk Order
          </Text>
          <IconButton
            icon={showSummary ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowSummary(!showSummary)}
          />
        </View>

        {showSummary && (
          <View style={styles.summaryContainer}>
            <Text variant="titleSmall">Order Summary</Text>
            <List.Item
              title="Total Items"
              right={() => <Text>{items.length}</Text>}
            />
            <List.Item
              title="Subtotal"
              right={() => <Text>${calculateTotal().toFixed(2)}</Text>}
            />
            {discount && (
              <List.Item
                title={`Discount (${discount}%)`}
                right={() => (
                  <Text style={styles.discount}>
                    -${(calculateTotal() * Number(discount) / 100).toFixed(2)}
                  </Text>
                )}
              />
            )}
            <List.Item
              title="Total"
              right={() => (
                <Text style={styles.total}>
                  ${calculateDiscountedTotal().toFixed(2)}
                </Text>
              )}
            />
          </View>
        )}

        <ScrollView style={styles.itemsList}>
          {items.map((item) => (
            <List.Item
              key={item.id}
              title={item.name}
              description={
                <View>
                  <Text>Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}</Text>
                  {item.category && <Text>Category: {item.category}</Text>}
                  {item.notes && <Text>Notes: {item.notes}</Text>}
                </View>
              }
              right={() => (
                <View style={styles.itemRight}>
                  <Text style={styles.itemTotal}>
                    ${item.totalPrice.toFixed(2)}
                  </Text>
                  <Menu
                    visible={menuVisible && selectedItem === item.id}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => {
                          setSelectedItem(item.id);
                          setMenuVisible(true);
                        }}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        handleEditItem(item.id);
                        setMenuVisible(false);
                      }}
                      title="Edit"
                      leadingIcon="pencil"
                    />
                    <Menu.Item
                      onPress={() => {
                        handleRemoveItem(item.id);
                        setMenuVisible(false);
                      }}
                      title="Remove"
                      leadingIcon="delete"
                      titleStyle={{ color: colors.error }}
                    />
                  </Menu>
                </View>
              )}
            />
          ))}
        </ScrollView>

        <Button
          mode="outlined"
          onPress={() => setShowAddDialog(true)}
          style={styles.addButton}
          icon="plus"
        >
          Add Item
        </Button>

        <TextInput
          label="Bulk Discount (%)"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
          style={[styles.input, styles.discountInput]}
        />

        <Button
          mode="contained"
          onPress={handleCreateOrder}
          style={styles.createButton}
          disabled={items.length === 0}
        >
          Create Bulk Order
        </Button>

        <Portal>
          <Dialog visible={showAddDialog} onDismiss={resetForm}>
            <Dialog.Title>Add Item</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Item Name"
                value={itemName}
                onChangeText={setItemName}
                style={styles.input}
              />
              <View style={styles.row}>
                <TextInput
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Unit Price"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              <TextInput
                label="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />
              <TextInput
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={resetForm}>Cancel</Button>
              <Button onPress={handleAddItem}>Add</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  addButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  itemsList: {
    maxHeight: 300,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  discountInput: {
    marginTop: 16,
    marginBottom: 16,
  },
  discount: {
    color: colors.success,
  },
  total: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  createButton: {
    marginTop: 16,
  },
}); 