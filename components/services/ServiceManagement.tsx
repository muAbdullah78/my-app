import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, SegmentedButtons } from 'react-native-paper';
import { colors } from '@/constants/colors';
import PricingCalculator from './PricingCalculator';
import SpecialRequests from './SpecialRequests';
import BulkOrderHandler from './BulkOrderHandler';
import ServiceScheduler from './ServiceScheduler';

type ServiceManagementProps = {
  shopId: string;
  serviceId: string;
  onOrderCreated: (orderData: any) => void;
};

type OrderData = {
  price: number;
  specialRequests: any[];
  bulkItems: any[];
  schedule: {
    day: number;
    timeSlot: any;
  } | null;
};

export default function ServiceManagement({
  shopId,
  serviceId,
  onOrderCreated,
}: ServiceManagementProps) {
  const [activeTab, setActiveTab] = useState('pricing');
  const [orderData, setOrderData] = useState<OrderData>({
    price: 0,
    specialRequests: [],
    bulkItems: [],
    schedule: null,
  });

  const handlePriceCalculated = (price: number) => {
    setOrderData((prev) => ({ ...prev, price }));
  };

  const handleSpecialRequestsAdded = (requests: any[]) => {
    setOrderData((prev) => ({ ...prev, specialRequests: requests }));
  };

  const handleBulkOrderCreated = (items: any[], totalPrice: number) => {
    setOrderData((prev) => ({
      ...prev,
      bulkItems: items,
      price: totalPrice,
    }));
  };

  const handleScheduleSelected = (schedule: { day: number; timeSlot: any }) => {
    setOrderData((prev) => ({ ...prev, schedule }));
  };

  const handleCreateOrder = () => {
    onOrderCreated(orderData);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pricing':
        return (
          <PricingCalculator
            serviceId={serviceId}
            onPriceCalculated={handlePriceCalculated}
          />
        );
      case 'special':
        return <SpecialRequests onRequestsAdded={handleSpecialRequestsAdded} />;
      case 'bulk':
        return <BulkOrderHandler onBulkOrderCreated={handleBulkOrderCreated} />;
      case 'schedule':
        return (
          <ServiceScheduler
            shopId={shopId}
            serviceId={serviceId}
            onScheduleSelected={handleScheduleSelected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          Service Management
        </Text>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'pricing', label: 'Pricing' },
            { value: 'special', label: 'Special Requests' },
            { value: 'bulk', label: 'Bulk Order' },
            { value: 'schedule', label: 'Schedule' },
          ]}
          style={styles.segmentedButtons}
        />

        <ScrollView style={styles.content}>
          {renderActiveTab()}
        </ScrollView>

        <View style={styles.summary}>
          <Text variant="titleMedium">Order Summary</Text>
          <Text>Total Price: ${orderData.price.toFixed(2)}</Text>
          {orderData.specialRequests.length > 0 && (
            <Text>Special Requests: {orderData.specialRequests.length}</Text>
          )}
          {orderData.bulkItems.length > 0 && (
            <Text>Bulk Items: {orderData.bulkItems.length}</Text>
          )}
          {orderData.schedule && (
            <Text>
              Scheduled: {orderData.schedule.timeSlot.startTime} -{' '}
              {orderData.schedule.timeSlot.endTime}
            </Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleCreateOrder}
          style={styles.createButton}
          disabled={orderData.price === 0}
        >
          Create Order
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  content: {
    maxHeight: 500,
  },
  summary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  createButton: {
    marginTop: 16,
  },
}); 