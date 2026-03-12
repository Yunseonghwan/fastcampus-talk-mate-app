import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type MicSectionProps = {
  isRecording?: boolean;
  label?: string;
  description?: string;
};

const MicSection = ({
  isRecording = false,
  label = '대화시작하기',
  description = '아래 버튼을 눌러서 AI와 대화를 시작해 보세요',
}: MicSectionProps) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isRecording, pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.micOuterCircle,
          isRecording && styles.micOuterCircleRecording,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View
          style={[
            styles.micInnerCircle,
            isRecording && styles.micInnerCircleRecording,
          ]}
        >
          <MaterialIcons name="mic" size={48} color="#fff" />
        </View>
      </Animated.View>
      <Text style={styles.mainText}>{label}</Text>
      <Text style={styles.subText}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  micOuterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  micOuterCircleRecording: {
    backgroundColor: '#FF3B30',
  },
  micInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micInnerCircleRecording: {
    backgroundColor: '#FF6B6B',
  },
  mainText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MicSection;
