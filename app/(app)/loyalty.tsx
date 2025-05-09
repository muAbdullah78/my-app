import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ViewProps } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Button,
  Portal,
  Dialog,
  List,
  ProgressBar,
  Divider,
  IconButton,
  ListIconProps,
  CardContentProps,
  CardActionsProps,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type PointsTransaction = {
  id: string;
  points: number;
  type: 'earn' | 'redeem';
  description: string;
  created_at: string;
  order_id?: string;
  order?: {
    id: string;
    total_amount: number;
    shop: {
      name: string;
    };
  };
};

type Reward = {
  id: string;
  name: string;
  description: string;
  points_required: number;
  discount_percentage: number;
  is_active: boolean;
  expiry_date?: string;
  usage_limit?: number;
  times_used: number;
};

type LoyaltyTier = {
  id: string;
  name: string;
  points_required: number;
  benefits: string[];
  current_tier: boolean;
  next_tier?: {
    name: string;
    points_required: number;
    points_needed: number;
  };
};

type PointsCalculator = {
  orderAmount: number;
  pointsEarned: number;
};

type TierComparison = {
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  benefits: {
    current: string[];
    next: string[];
  };
};

export default function Loyalty() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tier, setTier] = useState<LoyaltyTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [pointsCalculator, setPointsCalculator] = useState<PointsCalculator>({
    orderAmount: 0,
    pointsEarned: 0,
  });
  const [showTierComparison, setShowTierComparison] = useState(false);
  const [recommendedRewards, setRecommendedRewards] = useState<Reward[]>([]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [user]);

  const fetchLoyaltyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Fetch user's points and tier
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          loyalty_points,
          loyalty_tier:tiers (
            id,
            name,
            points_required,
            benefits
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setPoints(profileData.loyalty_points);

      // Fetch next tier
      const { data: nextTierData, error: nextTierError } = await supabase
        .from('tiers')
        .select('*')
        .gt('points_required', profileData.loyalty_tier.points_required)
        .order('points_required', { ascending: true })
        .limit(1)
        .single();

      if (!nextTierError && nextTierData) {
        setTier({
          ...profileData.loyalty_tier,
          current_tier: true,
          next_tier: {
            name: nextTierData.name,
            points_required: nextTierData.points_required,
            points_needed: nextTierData.points_required - profileData.loyalty_points,
          },
        });
      } else {
        setTier({
          ...profileData.loyalty_tier,
          current_tier: true,
        });
      }

      // Fetch points transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          order:orders (
            id,
            total_amount,
            shop:shops (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData);

      // Fetch available rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData);
    } catch (err) {
      setError('Failed to fetch loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!user || !selectedReward) return;

    try {
      setLoading(true);
      setError('');

      if (points < selectedReward.points_required) {
        setError('Not enough points to redeem this reward');
        return;
      }

      if (
        selectedReward.usage_limit &&
        selectedReward.times_used >= selectedReward.usage_limit
      ) {
        setError('This reward has reached its usage limit');
        return;
      }

      if (
        selectedReward.expiry_date &&
        new Date(selectedReward.expiry_date) < new Date()
      ) {
        setError('This reward has expired');
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: user.id,
          points: -selectedReward.points_required,
          type: 'redeem',
          description: `Redeemed ${selectedReward.name}`,
        });

      if (transactionError) throw transactionError;

      // Update user's points
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          loyalty_points: points - selectedReward.points_required,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update reward usage count
      const { error: rewardError } = await supabase
        .from('loyalty_rewards')
        .update({
          times_used: selectedReward.times_used + 1,
        })
        .eq('id', selectedReward.id);

      if (rewardError) throw rewardError;

      setShowRedeemDialog(false);
      fetchLoyaltyData();
    } catch (err) {
      setError('Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (amount: number) => {
    const points = Math.floor(amount * 0.1); // 10% of order amount as points
    setPointsCalculator({
      orderAmount: amount,
      pointsEarned: points,
    });
  };

  const getRecommendedRewards = () => {
    if (!rewards.length) return [];
    
    return rewards
      .filter(reward => 
        reward.points_required <= points && 
        (!reward.usage_limit || reward.times_used < reward.usage_limit) &&
        (!reward.expiry_date || new Date(reward.expiry_date) > new Date())
      )
      .sort((a, b) => a.points_required - b.points_required)
      .slice(0, 3);
  };

  useEffect(() => {
    setRecommendedRewards(getRecommendedRewards());
  }, [points, rewards]);

  const renderTransaction = (transaction: PointsTransaction) => (
    <List.Item
      key={transaction.id}
      title={transaction.description}
      description={
        transaction.order
          ? `${transaction.order.shop.name} - $${transaction.order.total_amount}`
          : new Date(transaction.created_at).toLocaleDateString()
      }
      left={({ color, style }: { color?: string; style?: any }) => (
        <List.Icon
          color={color}
          style={style}
          icon={transaction.type === 'earn' ? 'plus-circle' : 'minus-circle'}
          color={transaction.type === 'earn' ? '#4CAF50' : '#F44336'}
        />
      )}
      right={() => (
        <Text
          style={{
            color: transaction.type === 'earn' ? '#4CAF50' : '#F44336',
            fontWeight: 'bold',
          }}
        >
          {transaction.type === 'earn' ? '+' : '-'}
          {Math.abs(transaction.points)} pts
        </Text>
      )}
    />
  );

  const renderReward = (reward: Reward) => (
    <Card key={reward.id} style={styles.rewardCard}>
      <Card.Content>
        <View style={styles.rewardHeader}>
          <View>
            <Text variant="titleMedium">{reward.name}</Text>
            <Text variant="bodySmall" style={styles.rewardDescription}>
              {reward.description}
            </Text>
          </View>
          <IconButton
            icon="information"
            size={20}
            onPress={() => {
              setSelectedReward(reward);
              setShowRewardDetails(true);
            }}
          />
        </View>
        <View style={styles.rewardDetails}>
          <Text variant="bodyMedium">
            {reward.points_required} points
          </Text>
          {reward.expiry_date && (
            <Text variant="bodySmall" style={styles.expiryDate}>
              Expires: {new Date(reward.expiry_date).toLocaleDateString()}
            </Text>
          )}
          {reward.usage_limit && (
            <Text variant="bodySmall">
              Uses: {reward.times_used}/{reward.usage_limit}
            </Text>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => {
            setSelectedReward(reward);
            setShowRedeemDialog(true);
          }}
          disabled={points < reward.points_required}
        >
          Redeem
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderPointsCalculator = () => (
    <Card style={styles.calculatorCard}>
      <Card.Content>
        <Text variant="titleMedium">Points Calculator</Text>
        <Text variant="bodySmall" style={styles.calculatorDescription}>
          Calculate how many points you'll earn from your order
        </Text>
        <View style={styles.calculatorInput}>
          <Text variant="bodyMedium">Order Amount ($)</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={pointsCalculator.orderAmount.toString()}
            onChangeText={(text) => calculatePoints(Number(text) || 0)}
            style={styles.input}
          />
        </View>
        <View style={styles.calculatorResult}>
          <Text variant="titleMedium">
            You'll earn {pointsCalculator.pointsEarned} points
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTierComparison = () => (
    <Card style={styles.tierComparisonCard}>
      <Card.Content>
        <Text variant="titleMedium">Tier Benefits</Text>
        <View style={styles.tierComparison}>
          <View style={styles.tierColumn}>
            <Text variant="titleSmall">{tier?.name}</Text>
            <List.Section>
              {tier?.benefits.map((benefit, index) => (
                <List.Item
                  key={index}
                  title={benefit}
                  left={props => <List.Icon {...props} icon="check" />}
                />
              ))}
            </List.Section>
          </View>
          {tier?.next_tier && (
            <View style={styles.tierColumn}>
              <Text variant="titleSmall">{tier.next_tier.name}</Text>
              <List.Section>
                {tier.next_tier.benefits?.map((benefit, index) => (
                  <List.Item
                    key={index}
                    title={benefit}
                    left={props => <List.Icon {...props} icon="star" />}
                  />
                ))}
              </List.Section>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecommendedRewards = () => (
    <Card style={styles.recommendedCard}>
      <Card.Content>
        <Text variant="titleMedium">Recommended for You</Text>
        <View style={styles.recommendedList}>
          {recommendedRewards.map(reward => (
            <Card key={reward.id} style={styles.recommendedRewardCard}>
              <Card.Content>
                <Text variant="titleSmall">{reward.name}</Text>
                <Text variant="bodySmall">{reward.description}</Text>
                <Text variant="bodyMedium" style={styles.pointsText}>
                  {reward.points_required} points
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedReward(reward);
                    setShowRedeemDialog(true);
                  }}
                >
                  Redeem
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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
      <Card style={styles.pointsCard}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.pointsValue}>
            {points}
          </Text>
          <Text variant="titleMedium">Loyalty Points</Text>
          {tier && (
            <>
              <Text variant="titleMedium" style={styles.tierName}>
                {tier.name}
              </Text>
              {tier.next_tier && (
                <View style={styles.tierProgress}>
                  <Text variant="bodySmall">
                    {tier.next_tier.points_needed} points to {tier.next_tier.name}
                  </Text>
                  <ProgressBar
                    progress={
                      points / (tier.next_tier.points_required - tier.points_required)
                    }
                    style={styles.progressBar}
                  />
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {renderPointsCalculator()}
      {renderTierComparison()}
      {renderRecommendedRewards()}

      <Card style={styles.rewardsCard}>
        <Card.Content>
          <Text variant="titleMedium">Available Rewards</Text>
          <View style={styles.rewardsList}>
            {rewards.map(renderReward)}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.historyCard}>
        <Card.Content>
          <Text variant="titleMedium">Points History</Text>
          <List.Section>
            {transactions.map(renderTransaction)}
          </List.Section>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={showRedeemDialog}
          onDismiss={() => setShowRedeemDialog(false)}
        >
          <Dialog.Title>Redeem Reward</Dialog.Title>
          <Dialog.Content>
            {selectedReward && (
              <>
                <Text variant="bodyMedium">
                  Are you sure you want to redeem {selectedReward.name} for{' '}
                  {selectedReward.points_required} points?
                </Text>
                <Text variant="bodyMedium" style={styles.dialogDescription}>
                  You will receive {selectedReward.discount_percentage}% off your
                  next order.
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRedeemDialog(false)}>Cancel</Button>
            <Button onPress={handleRedeemReward}>Redeem</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showRewardDetails}
          onDismiss={() => setShowRewardDetails(false)}
        >
          <Dialog.Title>Reward Details</Dialog.Title>
          <Dialog.Content>
            {selectedReward && (
              <>
                <Text variant="titleMedium">{selectedReward.name}</Text>
                <Text variant="bodyMedium" style={styles.dialogDescription}>
                  {selectedReward.description}
                </Text>
                <Divider style={styles.divider} />
                <List.Item
                  title="Points Required"
                  description={selectedReward.points_required.toString()}
                  left={props => <List.Icon {...props} icon="star" />}
                />
                <List.Item
                  title="Discount"
                  description={`${selectedReward.discount_percentage}% off`}
                  left={props => <List.Icon {...props} icon="percent" />}
                />
                {selectedReward.usage_limit && (
                  <List.Item
                    title="Usage Limit"
                    description={`${selectedReward.times_used}/${selectedReward.usage_limit} times used`}
                    left={props => <List.Icon {...props} icon="counter" />}
                  />
                )}
                {selectedReward.expiry_date && (
                  <List.Item
                    title="Expiry Date"
                    description={new Date(selectedReward.expiry_date).toLocaleDateString()}
                    left={props => <List.Icon {...props} icon="calendar" />}
                  />
                )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRewardDetails(false)}>Close</Button>
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
  pointsCard: {
    margin: 16,
    backgroundColor: '#007AFF',
  },
  pointsValue: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  tierName: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  tierProgress: {
    marginTop: 8,
  },
  progressBar: {
    marginTop: 4,
    height: 8,
    borderRadius: 4,
  },
  tierCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    margin: 16,
    marginBottom: 8,
  },
  rewardCard: {
    margin: 16,
    marginTop: 0,
    opacity: 0.7,
  },
  availableReward: {
    opacity: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardDescription: {
    marginVertical: 8,
  },
  rewardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  expiryDate: {
    color: '#666',
    marginTop: 8,
  },
  points: {
    fontWeight: 'bold',
  },
  dialogDescription: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  calculatorCard: {
    marginBottom: 16,
  },
  calculatorDescription: {
    marginBottom: 8,
  },
  calculatorInput: {
    marginVertical: 8,
  },
  input: {
    marginTop: 4,
  },
  calculatorResult: {
    marginTop: 8,
    alignItems: 'center',
  },
  tierComparisonCard: {
    marginBottom: 16,
  },
  tierComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tierColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  recommendedCard: {
    marginBottom: 16,
  },
  recommendedList: {
    marginTop: 8,
  },
  recommendedRewardCard: {
    marginBottom: 8,
  },
  pointsText: {
    marginTop: 4,
    color: '#4CAF50',
  },
  rewardsCard: {
    marginBottom: 16,
  },
  rewardsList: {
    marginTop: 8,
  },
  historyCard: {
    marginBottom: 16,
  },
}); 