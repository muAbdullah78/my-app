import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Search, Filter, ArrowLeft } from 'lucide-react-native';
import { getPaymentHistory, PaymentRecord } from '@/lib/payment';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Receipt from '@/components/payment/Receipt';

type FilterType = 'all' | 'succeeded' | 'failed' | 'refunded';

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, selectedFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const history = await getPaymentHistory(user.id);
      setPayments(history);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.id.toLowerCase().includes(query) ||
        payment.payment_method.toLowerCase().includes(query) ||
        payment.amount.toString().includes(query)
      );
    }

    setFilteredPayments(filtered);
  };

  const renderPaymentItem = ({ item }: { item: PaymentRecord }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => setSelectedPayment(item)}
    >
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentAmount}>
          ${item.amount.toFixed(2)}
        </Text>
        <Text style={[
          styles.paymentStatus,
          { color: item.status === 'succeeded' ? colors.success : colors.error }
        ]}>
          {item.status}
        </Text>
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.paymentMethod}>
          {item.payment_method}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filters}>
      {(['all', 'succeeded', 'failed', 'refunded'] as FilterType[]).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            selectedFilter === filter && styles.selectedFilter
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === filter && styles.selectedFilterText
          ]}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>Loading payment history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          text="Try Again"
          onPress={fetchPayments}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color={colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Search payments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textLight}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {renderFilters()}

      {filteredPayments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payments found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedPayment && (
        <Receipt
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRight: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
  },
  selectedFilterText: {
    color: colors.white,
  },
  list: {
    padding: 16,
  },
  paymentItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.text,
  },
  paymentStatus: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
  },
  paymentMethod: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.textLight,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
}); 