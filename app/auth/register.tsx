import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import TextField from '@/components/ui/TextField';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import Logo from '@/components/ui/Logo';
import { signUp } from '@/lib/supabase';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleRegister = async () => {
    setError('');
    
    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Invalid email format');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await signUp(email, password, 'customer');
      
      if (error) throw error;
      
      // Navigate to role selection or directly to main app
      router.replace('/auth/role-selection');
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar style="dark" />
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Logo size={56} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join UsConnect to access laundry services
          </Text>
        </View>
        
        <View style={styles.form}>
          <TextField
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          
          <TextField
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          
          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextField
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={error}
          />
          
          <Button 
            text={loading ? "Creating Account..." : "Create Account"} 
            onPress={handleRegister} 
            style={styles.button}
            disabled={loading}
          />
          
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => router.push('/auth/login')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
  },
  termsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: 'Poppins-Medium',
    color: colors.primary,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.text,
  },
  footerLink: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.primary,
  },
});