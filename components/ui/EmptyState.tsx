import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[icon as keyof typeof Icons] as React.ComponentType<{ size: number, color: string }>;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {IconComponent && <IconComponent size={40} color={colors.textLight} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    maxWidth: 250,
  },
});