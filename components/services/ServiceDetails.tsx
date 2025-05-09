import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, List, Divider, IconButton, Menu, Portal, Dialog, Chip } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import SpecialRequests from './SpecialRequests';
import BulkOrderHandler from './BulkOrderHandler';

type ServiceDetailsProps = {
  serviceId?: string;
  onServiceUpdated: (details: any) => void;
};

const SERVICE_TYPES = [
  'Wash & Fold',
  'Dry Cleaning',
  'Ironing',
  'Stain Removal',
  'Bulk Order',
  'Special Care',
];

const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low', color: colors.success },
  { label: 'Medium', value: 'medium', color: colors.warning },
  { label: 'High', value: 'high', color: colors.error },
];

export default function ServiceDetails({ serviceId, onServiceUpdated }: ServiceDetailsProps) {
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [specialRequests, setSpecialRequests] = useState<any[]>([]);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          special_requests (*),
          bulk_orders (*)
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      if (data) {
        setServiceType(data.service_type);
        setDescription(data.description);
        setPriority(data.priority);
        setSpecialRequests(data.special_requests || []);
        setBulkItems(data.bulk_orders || []);
        setTotalPrice(data.total_price || 0);
      }
    } catch (err) {
      setError('Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialRequestsAdded = (requests: any[]) => {
    setSpecialRequests(requests);
    updateServiceDetails();
  };

  const handleBulkOrderCreated = (items: any[], price: number) => {
    setBulkItems(items);
    setTotalPrice(price);
    updateServiceDetails();
  };

  const updateServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const serviceData = {
        service_type: serviceType,
        description,
        priority,
        total_price: totalPrice,
        updated_at: new Date().toISOString(),
      };

      if (serviceId) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', serviceId);

        if (error) throw error;
      }

      onServiceUpdated({
        ...serviceData,
        special_requests: specialRequests,
        bulk_orders: bulkItems,
      });
    } catch (err) {
      setError('Failed to update service details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleSave = () => {
    updateServiceDetails();
    setShowEditDialog(false);
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading service details...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Service Details
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                handleEdit();
                setMenuVisible(false);
              }}
              title="Edit Details"
              leadingIcon="pencil"
            />
          </Menu>
        </View>

        <List.Item
          title="Service Type"
          description={serviceType}
          left={props => <List.Icon {...props} icon="washing-machine" />}
        />
        <List.Item
          title="Description"
          description={description}
          left={props => <List.Icon {...props} icon="text" />}
        />
        <List.Item
          title="Priority"
          description={
            <Chip
              mode="outlined"
              textStyle={{ color: PRIORITY_LEVELS.find(p => p.value === priority)?.color }}
            >
              {priority.toUpperCase()}
            </Chip>
          }
          left={props => <List.Icon {...props} icon="flag" />}
        />
        <List.Item
          title="Total Price"
          description={`$${totalPrice.toFixed(2)}`}
          left={props => <List.Icon {...props} icon="currency-usd" />}
        />

        <Divider style={styles.divider} />

        <SpecialRequests
          onRequestsAdded={handleSpecialRequestsAdded}
          serviceId={serviceId}
        />

        <Divider style={styles.divider} />

        <BulkOrderHandler
          onBulkOrderCreated={handleBulkOrderCreated}
          serviceId={serviceId}
        />

        <Portal>
          <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
            <Dialog.Title>Edit Service Details</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Service Type"
                value={serviceType}
                onChangeText={setServiceType}
                style={styles.input}
              />
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <Text variant="bodyMedium" style={styles.dialogLabel}>
                Priority Level
              </Text>
              <View style={styles.priorityContainer}>
                {PRIORITY_LEVELS.map((level) => (
                  <Chip
                    key={level.value}
                    selected={priority === level.value}
                    onPress={() => setPriority(level.value as 'low' | 'medium' | 'high')}
                    style={[styles.priorityChip, { borderColor: level.color }]}
                    textStyle={{ color: level.color }}
                  >
                    {level.label}
                  </Chip>
                ))}
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onPress={handleSave}>Save</Button>
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
  divider: {
    marginVertical: 16,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  dialogLabel: {
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  priorityChip: {
    borderWidth: 1,
  },
}); 