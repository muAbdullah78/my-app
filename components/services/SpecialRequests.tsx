import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, Chip, Portal, Dialog, List, IconButton, Menu } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type SpecialRequest = {
  type: string;
  description: string;
  additionalCost?: number;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'approved' | 'rejected';
};

type SpecialRequestsProps = {
  onRequestsAdded: (requests: SpecialRequest[]) => void;
  serviceId?: string;
};

const REQUEST_TYPES = [
  'Stain Treatment',
  'Fabric Care',
  'Special Handling',
  'Custom Instructions',
  'Other',
];

const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low', color: colors.success },
  { label: 'Medium', value: 'medium', color: colors.warning },
  { label: 'High', value: 'high', color: colors.error },
];

export default function SpecialRequests({ onRequestsAdded, serviceId }: SpecialRequestsProps) {
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [additionalCost, setAdditionalCost] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceId) {
      fetchServiceRequests();
    }
  }, [serviceId]);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('special_requests')
        .select('*')
        .eq('service_id', serviceId);

      if (error) throw error;

      if (data) {
        const formattedRequests = data.map((req: any) => ({
          type: req.request_type,
          description: req.description,
          additionalCost: req.additional_cost,
          priority: req.priority,
          status: req.status,
        }));
        setRequests(formattedRequests);
        onRequestsAdded(formattedRequests);
      }
    } catch (err) {
      setError('Failed to fetch special requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequest = () => {
    if (!selectedType || !description) return;

    const newRequest: SpecialRequest = {
      type: selectedType,
      description,
      additionalCost: additionalCost ? Number(additionalCost) : undefined,
      priority,
      status: 'pending',
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);
    onRequestsAdded(updatedRequests);

    // Reset form
    setSelectedType('');
    setDescription('');
    setAdditionalCost('');
    setPriority('medium');
    setShowAddDialog(false);
  };

  const handleRemoveRequest = (index: number) => {
    const updatedRequests = requests.filter((_, i) => i !== index);
    setRequests(updatedRequests);
    onRequestsAdded(updatedRequests);
  };

  const handleUpdatePriority = (index: number, newPriority: 'low' | 'medium' | 'high') => {
    const updatedRequests = requests.map((req, i) =>
      i === index ? { ...req, priority: newPriority } : req
    );
    setRequests(updatedRequests);
    onRequestsAdded(updatedRequests);
    setMenuVisible(false);
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority)?.color || colors.text;
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading special requests...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Special Requests
        </Text>

        <ScrollView style={styles.requestsList}>
          {requests.map((request, index) => (
            <Card key={index} style={styles.requestCard}>
              <Card.Content>
                <View style={styles.requestHeader}>
                  <View style={styles.requestTitle}>
                    <Text variant="titleSmall">{request.type}</Text>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getPriorityColor(request.priority || 'medium') }}
                      style={styles.priorityChip}
                    >
                      {request.priority?.toUpperCase() || 'MEDIUM'}
                    </Chip>
                  </View>
                  <View style={styles.requestActions}>
                    <Menu
                      visible={menuVisible && selectedRequest === index}
                      onDismiss={() => setMenuVisible(false)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => {
                            setSelectedRequest(index);
                            setMenuVisible(true);
                          }}
                        />
                      }
                    >
                      {PRIORITY_LEVELS.map((level) => (
                        <Menu.Item
                          key={level.value}
                          onPress={() => handleUpdatePriority(index, level.value as 'low' | 'medium' | 'high')}
                          title={level.label}
                          leadingIcon="flag"
                          titleStyle={{ color: level.color }}
                        />
                      ))}
                      <Menu.Item
                        onPress={() => handleRemoveRequest(index)}
                        title="Remove"
                        leadingIcon="delete"
                        titleStyle={{ color: colors.error }}
                      />
                    </Menu>
                  </View>
                </View>
                <Text variant="bodyMedium" style={styles.description}>
                  {request.description}
                </Text>
                {request.additionalCost && (
                  <Text variant="bodySmall" style={styles.cost}>
                    Additional Cost: ${request.additionalCost.toFixed(2)}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <Button
          mode="outlined"
          onPress={() => setShowAddDialog(true)}
          style={styles.addButton}
          icon="plus"
        >
          Add Special Request
        </Button>

        <Portal>
          <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
            <Dialog.Title>Add Special Request</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.dialogLabel}>
                Request Type
              </Text>
              <View style={styles.chipContainer}>
                {REQUEST_TYPES.map((type) => (
                  <Chip
                    key={type}
                    selected={selectedType === type}
                    onPress={() => setSelectedType(type)}
                    style={styles.chip}
                  >
                    {type}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Additional Cost (Optional)"
                value={additionalCost}
                onChangeText={setAdditionalCost}
                keyboardType="numeric"
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
              <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onPress={handleAddRequest}>Add</Button>
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
  title: {
    marginBottom: 16,
  },
  requestsList: {
    maxHeight: 300,
  },
  requestCard: {
    marginBottom: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    marginBottom: 4,
  },
  cost: {
    color: colors.primary,
  },
  addButton: {
    marginTop: 16,
  },
  dialogLabel: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
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