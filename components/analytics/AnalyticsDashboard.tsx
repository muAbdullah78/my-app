import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

type AnalyticsDashboardProps = {
  shopId: string;
};

type ShopAnalytics = {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  average_order_value: number;
  total_products_sold: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
  }[];
};

export default function AnalyticsDashboard({ shopId }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData | null>(null);
  const [ordersData, setOrdersData] = useState<ChartData | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [shopId, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch current analytics
      const { data: currentData, error: currentError } = await supabase
        .from('shop_analytics')
        .select('*')
        .eq('shop_id', shopId)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (currentError) throw currentError;

      setAnalytics(currentData);

      // Fetch historical data for charts
      const daysToFetch = timeframe === 'day' ? 7 : timeframe === 'week' ? 4 : 12;
      const { data: historicalData, error: historicalError } = await supabase
        .from('shop_analytics')
        .select('*')
        .eq('shop_id', shopId)
        .order('date', { ascending: false })
        .limit(daysToFetch);

      if (historicalError) throw historicalError;

      // Transform data for charts
      const labels = historicalData.map(d => {
        const date = new Date(d.date);
        return timeframe === 'day'
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : timeframe === 'week'
          ? `Week ${Math.ceil(date.getDate() / 7)}`
          : date.toLocaleDateString('en-US', { month: 'short' });
      }).reverse();

      const revenueValues = historicalData.map(d => d.total_revenue).reverse();
      const orderValues = historicalData.map(d => d.total_orders).reverse();

      setRevenueData({
        labels,
        datasets: [
          {
            data: revenueValues,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          },
        ],
      });

      setOrdersData({
        labels,
        datasets: [
          {
            data: orderValues,
            color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
          },
        ],
      });

      // Fetch top products
      const { data: productsData, error: productsError } = await supabase
        .from('product_analytics')
        .select(`
          product_id,
          products (name),
          revenue,
          purchase_count
        `)
        .eq('shop_id', shopId)
        .eq('date', new Date().toISOString().split('T')[0])
        .order('revenue', { ascending: false })
        .limit(5);

      if (productsError) throw productsError;

      setTopProducts(productsData);

      // Fetch customer stats
      const { data: customersData, error: customersError } = await supabase
        .from('customer_analytics')
        .select('*')
        .eq('shop_id', shopId)
        .order('total_spent', { ascending: false })
        .limit(1);

      if (customersError) throw customersError;

      setCustomerStats({
        totalCustomers: currentData.total_customers,
        averageOrderValue: currentData.average_order_value,
        topCustomerSpent: customersData[0]?.total_spent || 0,
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timeframeButtons}>
        <Button
          mode={timeframe === 'day' ? 'contained' : 'outlined'}
          onPress={() => setTimeframe('day')}
        >
          Daily
        </Button>
        <Button
          mode={timeframe === 'week' ? 'contained' : 'outlined'}
          onPress={() => setTimeframe('week')}
        >
          Weekly
        </Button>
        <Button
          mode={timeframe === 'month' ? 'contained' : 'outlined'}
          onPress={() => setTimeframe('month')}
        >
          Monthly
        </Button>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="cash-register"
              size={24}
              color={colors.primary}
            />
            <Text variant="titleLarge">${analytics?.total_revenue.toFixed(2)}</Text>
            <Text variant="bodySmall">Total Revenue</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="shopping"
              size={24}
              color={colors.primary}
            />
            <Text variant="titleLarge">{analytics?.total_orders}</Text>
            <Text variant="bodySmall">Total Orders</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color={colors.primary}
            />
            <Text variant="titleLarge">{analytics?.total_customers}</Text>
            <Text variant="bodySmall">Total Customers</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <MaterialCommunityIcons
              name="chart-areaspline"
              size={24}
              color={colors.primary}
            />
            <Text variant="titleLarge">
              ${analytics?.average_order_value.toFixed(2)}
            </Text>
            <Text variant="bodySmall">Avg. Order Value</Text>
          </Card.Content>
        </Card>
      </View>

      {revenueData && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Revenue Trend
            </Text>
            <LineChart
              data={revenueData}
              width={Dimensions.get('window').width - 48}
              height={220}
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {ordersData && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.chartTitle}>
              Orders Trend
            </Text>
            <BarChart
              data={ordersData}
              width={Dimensions.get('window').width - 48}
              height={220}
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      <Card style={styles.productsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Top Products
          </Text>
          {topProducts.map((product, index) => (
            <View key={product.product_id} style={styles.productRow}>
              <Text style={styles.productRank}>#{index + 1}</Text>
              <View style={styles.productInfo}>
                <Text variant="bodyMedium">{product.products.name}</Text>
                <Text variant="bodySmall" style={styles.productStats}>
                  ${product.revenue.toFixed(2)} • {product.purchase_count} sold
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.customersCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Customer Insights
          </Text>
          <View style={styles.customerStats}>
            <View style={styles.customerStat}>
              <Text variant="titleLarge">{customerStats?.totalCustomers}</Text>
              <Text variant="bodySmall">Total Customers</Text>
            </View>
            <View style={styles.customerStat}>
              <Text variant="titleLarge">
                ${customerStats?.averageOrderValue.toFixed(2)}
              </Text>
              <Text variant="bodySmall">Avg. Order Value</Text>
            </View>
            <View style={styles.customerStat}>
              <Text variant="titleLarge">
                ${customerStats?.topCustomerSpent.toFixed(2)}
              </Text>
              <Text variant="bodySmall">Top Customer Spent</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  timeframeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    margin: 4,
  },
  chartCard: {
    margin: 16,
  },
  chartTitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  productsCard: {
    margin: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productRank: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productInfo: {
    flex: 1,
  },
  productStats: {
    color: colors.textLight,
    marginTop: 4,
  },
  customersCard: {
    margin: 16,
    marginBottom: 32,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerStat: {
    alignItems: 'center',
  },
}); 