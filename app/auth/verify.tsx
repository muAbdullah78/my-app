import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { verifyCode } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCounter, setResendCounter] = useState(30);
  
  const inputRefs = useRef<(TouchableOpacity | null)[]>([]);
  
  useEffect(() => {
    if (resendCounter > 0) {
      const timer = setTimeout(() => setResendCounter(resendCounter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCounter]);
  
  const handleCodeInput = (text: string, index: number) => {
    // Create a new array with the updated value
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    
    // Auto-focus next input if value is entered
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleBackspace = (index: number) => {
    // If current input is empty, focus previous input
    if (!code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    } else {
      // Clear current input
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }
  };
  
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setErrorMessage('Please enter the 4-digit code');
      return;
    }
    
    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      await verifyCode(fullCode);
      router.push('/auth/role-selection');
    } catch (error) {
      setErrorMessage('Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendCode = () => {
    // Reset code fields
    setCode(['', '', '', '']);
    setErrorMessage('');
    
    // Start resend timer
    setResendCounter(30);
    
    // Resend code logic (mock for now)
    // auth.resendVerificationCode()
  };
  
  return (
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
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          We've sent a 4-digit code to your phone number
        </Text>
      </View>
      
      <Animated.View 
        entering={FadeInDown.duration(500).springify()} 
        style={styles.codeContainer}
      >
        {code.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.codeInput,
              digit && styles.codeInputFilled,
              errorMessage && !digit && styles.codeInputError
            ]}
            activeOpacity={0.7}
            onPress={() => inputRefs.current[index]?.focus()}
            ref={ref => { inputRefs.current[index] = ref; }}
          >
            <Text style={styles.codeDigit}>{digit}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
      
      {errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : (
        <Text style={styles.helper}>Enter the 4-digit code sent to your phone</Text>
      )}
      
      <Button 
        text={isVerifying ? "Verifying..." : "Verify"}
        onPress={handleVerifyCode} 
        style={styles.button}
        disabled={isVerifying || code.some(digit => !digit)}
      />
      
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        {resendCounter > 0 ? (
          <Text style={styles.countdownText}>Resend in {resendCounter}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendButton}>Resend</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.textLight,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  codeInputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  codeDigit: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.primary,
  },
  helper: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 32,
  },
  errorMessage: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.error,
    marginBottom: 32,
  },
  button: {
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
  },
  resendButton: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  countdownText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.textLight,
  },
});