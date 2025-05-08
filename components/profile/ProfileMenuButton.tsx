import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { ChevronRight } from 'lucide-react-native';
import { Video as LucideIcon } from 'lucide-react-native';

interface ProfileMenuButtonProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBorder?: boolean;
}

export default function ProfileMenuButton({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showBorder = true,
}: ProfileMenuButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        showBorder && styles.withBorder
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <Icon size={20} color={colors.text} />
      </View>
      <View style={styles.middleSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.rightSection}>
        <ChevronRight size={18} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    marginRight: 16,
  },
  middleSection: {
    flex: 1,
  },
  rightSection: {
    
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
});