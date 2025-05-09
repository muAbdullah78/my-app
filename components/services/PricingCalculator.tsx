import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Switch, Button, Divider, List, IconButton } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

type Service = {
  id: string;
  name: string;
  base_price: number;
  min_processing_time: string;
  max_processing_time: string;
  is_express_available: boolean;
  express_surcharge: number;
  bulk_discount_threshold: number;
  bulk_discount_percentage: number;
  category_id: string;
};

type PricingRule = {
  min_quantity: number;
  max_quantity: number;
  price_multiplier: number;
  is_express: boolean;
};

type PricingCalculatorProps = {
  serviceId: string;
  onPriceCalculated: (price: number, details: PriceDetails) => void;
};

type PriceDetails = {
  basePrice: number;
  quantity: number;
  expressSurcharge: number;
  bulkDiscount: number;
  specialRequestsCost: number;
  totalPrice: number;
};

export default function PricingCalculator({ serviceId, onPriceCalculated }: PricingCalculatorProps) {
  const [service, setService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isExpress, setIsExpress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceDetails, setPriceDetails] = useState<PriceDetails>({
    basePrice: 0,
    quantity: 1,
    expressSurcharge: 0,
    bulkDiscount: 0,
    specialRequestsCost: 0,
    totalPrice: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(name)
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      setService(data);
      calculatePrice(data, Number(quantity), isExpress);
    } catch (err) {
      setError('Failed to fetch service details');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (serviceData: Service, qty: number, express: boolean) => {
    if (!serviceData) return;

    const basePrice = serviceData.base_price * qty;
    let expressSurcharge = 0;
    let bulkDiscount = 0;

    // Apply bulk discount if applicable
    if (
      serviceData.bulk_discount_threshold &&
      serviceData.bulk_discount_percentage &&
      qty >= serviceData.bulk_discount_threshold
    ) {
      bulkDiscount = (basePrice * serviceData.bulk_discount_percentage) / 100;
    }

    // Apply express surcharge if selected
    if (express && serviceData.is_express_available) {
      expressSurcharge = serviceData.express_surcharge;
    }

    const totalPrice = basePrice + expressSurcharge - bulkDiscount;

    const details: PriceDetails = {
      basePrice: serviceData.base_price,
      quantity: qty,
      expressSurcharge,
      bulkDiscount,
      specialRequestsCost: 0, // This will be updated when special requests are added
      totalPrice,
    };

    setPriceDetails(details);
    onPriceCalculated(totalPrice, details);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    if (service) {
      calculatePrice(service, Number(value), isExpress);
    }
  };

  const handleExpressChange = (value: boolean) => {
    setIsExpress(value);
    if (service) {
      calculatePrice(service, Number(quantity), value);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading pricing details...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error || !service) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.error}>{error || 'Service not found'}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Price Calculator
          </Text>
          <IconButton
            icon={showDetails ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowDetails(!showDetails)}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Quantity"
            value={quantity}
            onChangeText={handleQuantityChange}
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="items" />}
          />
        </View>

        {service.is_express_available && (
          <View style={styles.expressContainer}>
            <View>
              <Text>Express Service</Text>
              <Text variant="bodySmall" style={styles.expressNote}>
                Get your items faster with express service
              </Text>
            </View>
            <Switch
              value={isExpress}
              onValueChange={handleExpressChange}
              color={colors.primary}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            label="Special Instructions"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.priceContainer}>
          <Text variant="titleMedium">Estimated Price</Text>
          <Text variant="headlineSmall" style={styles.price}>
            ${priceDetails.totalPrice.toFixed(2)}
          </Text>
        </View>

        {showDetails && (
          <View style={styles.detailsContainer}>
            <List.Item
              title="Base Price"
              description={`$${priceDetails.basePrice.toFixed(2)} × ${priceDetails.quantity}`}
              right={() => <Text>${(priceDetails.basePrice * priceDetails.quantity).toFixed(2)}</Text>}
            />
            {priceDetails.expressSurcharge > 0 && (
              <List.Item
                title="Express Surcharge"
                right={() => <Text>+${priceDetails.expressSurcharge.toFixed(2)}</Text>}
              />
            )}
            {priceDetails.bulkDiscount > 0 && (
              <List.Item
                title="Bulk Discount"
                right={() => <Text style={styles.discount}>-${priceDetails.bulkDiscount.toFixed(2)}</Text>}
              />
            )}
          </View>
        )}

        {service.bulk_discount_threshold && (
          <Text style={styles.discountNote}>
            * {service.bulk_discount_percentage}% discount applied for orders of{' '}
            {service.bulk_discount_threshold} or more items
          </Text>
        )}

        <View style={styles.processingTime}>
          <Text variant="bodySmall">
            Processing Time: {service.min_processing_time} - {service.max_processing_time}
          </Text>
        </View>
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
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  expressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  expressNote: {
    color: colors.textLight,
  },
  divider: {
    marginVertical: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
  },
  discount: {
    color: colors.success,
  },
  discountNote: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  error: {
    color: colors.error,
  },
  processingTime: {
    marginTop: 16,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
}); 