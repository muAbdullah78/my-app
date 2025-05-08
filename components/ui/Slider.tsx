import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
}

export default function Slider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
}: SliderProps) {
  const sliderWidth = useSharedValue(0);
  const position = useSharedValue(
    ((value - minimumValue) / (maximumValue - minimumValue)) * 100
  );
  
  const updateValue = (pos: number) => {
    const percentage = Math.max(0, Math.min(100, pos));
    let newValue = minimumValue + (percentage / 100) * (maximumValue - minimumValue);
    
    // Apply step if provided
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }
    
    // Ensure the value is within bounds
    newValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
    
    onValueChange(newValue);
  };
  
  const gesture = Gesture.Pan()
    .onStart(() => {
      // Initialize with current position
    })
    .onUpdate(e => {
      if (sliderWidth.value > 0) {
        const newPosition = (e.x / sliderWidth.value) * 100;
        position.value = Math.max(0, Math.min(100, newPosition));
        runOnJS(updateValue)(position.value);
      }
    });
  
  const trackAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${position.value}%`,
    };
  });
  
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      left: `${position.value}%`,
      transform: [{ translateX: -12 }],
    };
  });
  
  const onLayout = (event: any) => {
    sliderWidth.value = event.nativeEvent.layout.width;
    // Initial position
    position.value = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  };
  
  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.sliderContainer} onLayout={onLayout}>
          <View style={styles.track} />
          <Animated.View style={[styles.filledTrack, trackAnimatedStyle]} />
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  filledTrack: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 18,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    position: 'absolute',
    top: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});