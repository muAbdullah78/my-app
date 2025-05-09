import { supabase } from './supabase';

export type PaymentMethodType = 'cash_on_delivery';

export type PaymentMethod = {
  id?: string;
  type: PaymentMethodType;
  provider: string;
  is_default?: boolean;
  metadata?: any;
  created_at?: string;
};

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type PaymentRecord = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  receipt_url?: string;
  user_id?: string;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  created_at: string;
  receipt_url?: string;
};

export type Refund = {
  id: string;
  payment_id: string;
  amount: number;
  reason: string | null;
  status: 'pending' | 'succeeded' | 'failed';
  provider_refund_id: string | null;
  metadata: any;
  created_at: string;
};

const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 99999999;
};

const validateCurrency = (currency: string): boolean => {
  const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'] as const;
  return validCurrencies.some(c => c === currency.toLowerCase());
};

// Process cash on delivery payment
export const processCashOnDelivery = async (
  orderId: string,
  amount: number,
  currency: string = 'usd'
): Promise<Payment> => {
  if (!validatePaymentAmount(amount)) {
    throw new Error('Invalid payment amount');
  }
  if (!validateCurrency(currency)) {
    throw new Error('Invalid currency');
  }
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        currency,
        status: 'pending',
        payment_method: {
          type: 'cash_on_delivery',
          provider: 'internal',
          is_default: false,
          metadata: { payment_type: 'cash_on_delivery' }
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update order status
    await supabase
      .from('orders')
      .update({ payment_status: 'pending' })
      .eq('id', orderId);

    return data as Payment;
  } catch (error) {
    console.error('Failed to process cash on delivery payment:', error);
    throw new Error('Failed to process cash on delivery payment');
  }
};

export const savePaymentRecord = async (paymentData: Omit<PaymentRecord, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          ...paymentData,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save payment record:', error);
    throw new Error('Failed to save payment record');
  }
};

export const getPaymentHistory = async (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`*, order:orders(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    throw new Error('Failed to fetch payment history');
  }
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

export const getPaymentByOrderId = async (orderId: string): Promise<Payment | null> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) throw error;
    return data as Payment;
  } catch (error) {
    console.error('Failed to get payment:', error);
    return null;
  }
}; 