import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  List,
  Switch,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  default_address?: string;
  notifications_enabled: boolean;
  dark_mode: boolean;
};

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setNewName(data.full_name);
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      setError('');

      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: newName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: newName });
      setEditingName(false);
    } catch (err) {
      setError('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user || !profile) return;

    try {
      const newValue = !profile.notifications_enabled;
      const { error } = await supabase
        .from('user_profiles')
        .update({ notifications_enabled: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, notifications_enabled: newValue });
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  const handleToggleDarkMode = async () => {
    if (!user || !profile) return;

    try {
      const newValue = !profile.dark_mode;
      const { error } = await supabase
        .from('user_profiles')
        .update({ dark_mode: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, dark_mode: newValue });
    } catch (err) {
      setError('Failed to update theme settings');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (err) {
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Profile not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={profile.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          />
          {editingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={styles.nameInput}
              />
              <View style={styles.nameEditButtons}>
                <Button
                  onPress={() => {
                    setEditingName(false);
                    setNewName(profile.full_name);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdateName}
                  loading={saving}
                  disabled={saving}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text variant="headlineMedium">{profile.full_name}</Text>
              <Button
                mode="text"
                onPress={() => setEditingName(true)}
                style={styles.editButton}
              >
                Edit
              </Button>
            </View>
          )}
          <Text variant="bodyMedium">{profile.phone}</Text>
          {profile.email && (
            <Text variant="bodyMedium">{profile.email}</Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <List.Section>
            <List.Subheader>Settings</List.Subheader>
            <List.Item
              title="Notifications"
              description="Receive order updates and promotions"
              left={(props) => (
                <List.Icon {...props} icon="bell-outline" />
              )}
              right={() => (
                <Switch
                  value={profile.notifications_enabled}
                  onValueChange={handleToggleNotifications}
                />
              )}
            />
            <List.Item
              title="Dark Mode"
              description="Toggle dark theme"
              left={(props) => (
                <List.Icon {...props} icon="theme-light-dark" />
              )}
              right={() => (
                <Switch
                  value={profile.dark_mode}
                  onValueChange={handleToggleDarkMode}
                />
              )}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <List.Section>
            <List.Subheader>Account</List.Subheader>
            <List.Item
              title="Saved Addresses"
              description="Manage your delivery addresses"
              left={(props) => (
                <List.Icon {...props} icon="map-marker-outline" />
              )}
              onPress={() => router.push('/addresses')}
            />
            <List.Item
              title="Payment Methods"
              description="Manage your payment options"
              left={(props) => (
                <List.Icon {...props} icon="credit-card-outline" />
              )}
              onPress={() => router.push('/payment-methods')}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowSignOutDialog(true)}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showSignOutDialog}
          onDismiss={() => setShowSignOutDialog(false)}
        >
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to sign out?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSignOutDialog(false)}>Cancel</Button>
            <Button onPress={handleSignOut}>Sign Out</Button>
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  nameEditContainer: {
    width: '100%',
    marginVertical: 16,
  },
  nameInput: {
    marginBottom: 8,
  },
  nameEditButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    marginTop: 8,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  signOutButton: {
    borderColor: '#FF0000',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 