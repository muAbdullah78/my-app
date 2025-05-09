import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { TextInput as TextInputType } from 'react-native-paper/lib/typescript/components/TextInput';
import {
  Text,
  Card,
  Button,
  TextInput,
  List,
  Switch,
  ActivityIndicator,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
};

type Shop = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  is_active: boolean;
  opening_hours: {
    [key: string]: { open: string; close: string };
  };
  services: Service[];
};

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function ShopManagement() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingHours, setEditingHours] = useState(false);
  const [newHours, setNewHours] = useState<Shop['opening_hours']>({});

  // Service form state
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  useEffect(() => {
    fetchShopDetails();
  }, []);

  const fetchShopDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          services (*)
        `)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      setShop(data);
      setNewHours(data.opening_hours);
    } catch (err) {
      setError('Failed to fetch shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShopStatus = async (isActive: boolean) => {
    if (!shop) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: isActive })
        .eq('id', shop.id);

      if (error) throw error;

      setShop({ ...shop, is_active: isActive });
    } catch (err) {
      setError('Failed to update shop status');
    }
  };

  const handleUpdateServiceStatus = async (serviceId: string, isActive: boolean) => {
    if (!shop) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

      if (error) throw error;

      setShop({
        ...shop,
        services: shop.services.map((service) =>
          service.id === serviceId
            ? { ...service, is_active: isActive }
            : service
        ),
      });
    } catch (err) {
      setError('Failed to update service status');
    }
  };

  const handleSaveHours = async () => {
    if (!shop) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('shops')
        .update({ opening_hours: newHours })
        .eq('id', shop.id);

      if (error) throw error;

      setShop({ ...shop, opening_hours: newHours });
      setEditingHours(false);
    } catch (err) {
      setError('Failed to update opening hours');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!shop) return;

    try {
      setSaving(true);
      const serviceData = {
        name: serviceName,
        description: serviceDescription,
        price: parseFloat(servicePrice),
        duration: parseInt(serviceDuration),
        is_active: true,
        shop_id: shop.id,
      };

      if (selectedService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', selectedService.id);

        if (error) throw error;

        setShop({
          ...shop,
          services: shop.services.map((service) =>
            service.id === selectedService.id
              ? { ...service, ...serviceData }
              : service
          ),
        });
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single();

        if (error) throw error;

        setShop({
          ...shop,
          services: [...shop.services, data],
        });
      }

      setShowServiceDialog(false);
      resetServiceForm();
    } catch (err) {
      setError('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const resetServiceForm = () => {
    setSelectedService(null);
    setServiceName('');
    setServiceDescription('');
    setServicePrice('');
    setServiceDuration('');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Shop not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Shop Status</Text>
            <Switch
              value={shop.is_active}
              onValueChange={handleUpdateShopStatus}
            />
          </View>
          <Text variant="bodyMedium" style={styles.statusText}>
            {shop.is_active
              ? 'Your shop is currently open for business'
              : 'Your shop is currently closed'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Opening Hours</Text>
            <Button
              mode="text"
              onPress={() => setEditingHours(!editingHours)}
            >
              {editingHours ? 'Cancel' : 'Edit'}
            </Button>
          </View>

          {editingHours ? (
            <>
              {DAYS.map((day) => (
                <View key={day} style={styles.hoursRow}>
                  <Text variant="bodyMedium" style={styles.day}>
                    {day}
                  </Text>
                  <View style={styles.timeInputs}>
                    <TextInput
                      label="Open"
                      value={newHours[day]?.open || ''}
                      onChangeText={(text: string) =>
                        setNewHours({
                          ...newHours,
                          [day]: { ...newHours[day], open: text },
                        })
                      }
                      style={styles.timeInput}
                    />
                    <TextInput
                      label="Close"
                      value={newHours[day]?.close || ''}
                      onChangeText={(text: string) =>
                        setNewHours({
                          ...newHours,
                          [day]: { ...newHours[day], close: text },
                        })
                      }
                      style={styles.timeInput}
                    />
                  </View>
                </View>
              ))}
              <Button
                mode="contained"
                onPress={handleSaveHours}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              >
                Save Hours
              </Button>
            </>
          ) : (
            Object.entries(shop.opening_hours).map(([day, hours]) => (
              <View key={day} style={styles.hoursRow}>
                <Text variant="bodyMedium" style={styles.day}>
                  {day}
                </Text>
                <Text variant="bodyMedium">
                  {hours.open} - {hours.close}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Services</Text>
            <Button
              mode="contained"
              onPress={() => {
                resetServiceForm();
                setShowServiceDialog(true);
              }}
            >
              Add Service
            </Button>
          </View>

          {shop.services.map((service) => (
            <List.Item
              key={service.id}
              title={service.name}
              description={service.description}
              right={() => (
                <View style={styles.serviceActions}>
                  <Text variant="bodyMedium">
                    ${service.price.toFixed(2)} • {service.duration} mins
                  </Text>
                  <Switch
                    value={service.is_active}
                    onValueChange={(value: boolean) =>
                      handleUpdateServiceStatus(service.id, value)
                    }
                  />
                  <IconButton
                    icon="pencil"
                    onPress={() => {
                      setSelectedService(service);
                      setServiceName(service.name);
                      setServiceDescription(service.description);
                      setServicePrice(service.price.toString());
                      setServiceDuration(service.duration.toString());
                      setShowServiceDialog(true);
                    }}
                  />
                </View>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={showServiceDialog}
          onDismiss={() => {
            setShowServiceDialog(false);
            resetServiceForm();
          }}
        >
          <Dialog.Title>
            {selectedService ? 'Edit Service' : 'Add Service'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Service Name"
              value={serviceName}
              onChangeText={setServiceName}
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={serviceDescription}
              onChangeText={setServiceDescription}
              multiline
              style={styles.input}
            />
            <TextInput
              label="Price"
              value={servicePrice}
              onChangeText={setServicePrice}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              label="Duration (minutes)"
              value={serviceDuration}
              onChangeText={setServiceDuration}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowServiceDialog(false);
                resetServiceForm();
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveService}
              loading={saving}
              disabled={saving}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    marginTop: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  day: {
    fontWeight: 'bold',
    width: 100,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    width: 100,
  },
  saveButton: {
    marginTop: 16,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 