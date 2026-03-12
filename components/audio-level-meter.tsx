import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PRIMARY_COLOR = "#007AFF";
const POLL_INTERVAL_MS = 75;
const SILENCE_THRESHOLD_DB = -45;
const BAR_WIDTH = 5;
const BAR_GAP = 4;
const BAR_MAX_HEIGHT = 32;
const MIN_SCALE = 0.08;

const BAR_MULTIPLIERS = [0.55, 0.8, 1.0, 0.95, 0.7, 0.5];

const normalizeMetering = (dB: number): number => {
  if (dB < SILENCE_THRESHOLD_DB) return 0;
  return Math.min(
    1,
    (dB - SILENCE_THRESHOLD_DB) / Math.abs(SILENCE_THRESHOLD_DB),
  );
};

type BarProps = {
  height: SharedValue<number>;
};

const Bar = ({ height }: BarProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = Math.max(MIN_SCALE, height.value);
    return {
      transform: [
        { translateY: ((1 - scale) * BAR_MAX_HEIGHT) / 2 },
        { scaleY: scale },
      ],
    };
  });

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

type AudioLevelMeterProps = {
  isActive: boolean;
  recorder: { getStatus: () => { metering?: number } };
};

const AudioLevelMeter = ({ isActive, recorder }: AudioLevelMeterProps) => {
  const b0 = useSharedValue(0);
  const b1 = useSharedValue(0);
  const b2 = useSharedValue(0);
  const b3 = useSharedValue(0);
  const b4 = useSharedValue(0);
  const b5 = useSharedValue(0);
  const bars = useRef([b0, b1, b2, b3, b4, b5]).current;

  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  useEffect(() => {
    if (!isActive) {
      bars.forEach((b) => {
        b.value = withTiming(0, { duration: 200 });
      });
      return;
    }

    const interval = setInterval(() => {
      const status = recorderRef.current.getStatus();
      const dB = status.metering ?? -160;
      const level = normalizeMetering(dB);

      bars.forEach((b, i) => {
        const jitter = 0.85 + Math.random() * 0.3;
        const target = level * BAR_MULTIPLIERS[i] * jitter;
        b.value = withTiming(Math.min(1, target), {
          duration: POLL_INTERVAL_MS,
          easing: Easing.out(Easing.quad),
        });
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isActive, bars]);

  return (
    <View style={styles.container}>
      {bars.map((b, i) => (
        <Bar key={i} height={b} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: BAR_MAX_HEIGHT,
    gap: BAR_GAP,
    marginBottom: 12,
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_MAX_HEIGHT,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: BAR_WIDTH / 2,
  },
});

export default AudioLevelMeter;
