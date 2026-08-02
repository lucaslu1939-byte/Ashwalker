import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
};

export function ProgressRing({ size = 92, strokeWidth = 7, progress }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.rotated}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: {
    transform: [{ rotate: "-90deg" }],
  },
});
