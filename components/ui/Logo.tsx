import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface LogoProps {
  size?: number;
  lightMode?: boolean;
}

export default function Logo({ size = 40, lightMode = false }: LogoProps) {
  const fontSize = size * 0.5;
  const borderRadius = size * 0.25;
  const wrapperSize = size * 0.7;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: lightMode ? colors.white : colors.primary,
          },
        ]}
      >
        <View
          style={[
            styles.innerWrapper,
            {
              width: wrapperSize,
              height: wrapperSize,
              borderRadius: wrapperSize / 2,
              backgroundColor: lightMode ? colors.primary : colors.white,
            },
          ]}
        >
          <Text
            style={[
              styles.logoText,
              {
                fontSize,
                color: lightMode ? colors.white : colors.primary,
              },
            ]}
          >
            UC
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  innerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Poppins-Bold',
  },
});