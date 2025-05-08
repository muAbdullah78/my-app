import { View, StyleSheet } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface TabBarIconProps {
  icon: LucideIcon;
  color: string;
  focused: boolean;
}

export default function TabBarIcon({ icon: Icon, color, focused }: TabBarIconProps) {
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(focused ? 1.1 : 1, { duration: 200 }) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyles]}>
      <Icon size={focused ? 24 : 22} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});