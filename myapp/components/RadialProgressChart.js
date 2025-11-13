// components/RadialProgressChart.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RadialProgressChart({ value, goal, color, label }) {
  const screenWidth = Dimensions.get("window").width;

  const radius = screenWidth * 0.10;     // ลดจาก 0.12 → 0.10
  const strokeWidth = screenWidth * 0.025;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  const size = radius * 2 + strokeWidth * 2;
  const progress = Math.min(value / goal, 1);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress * circumference,
      duration: 700,
      useNativeDriver: false,
    }).start();

    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.round((value / circumference) * goal));
    });
    return () => animatedValue.removeListener(id);
  }, [progress, goal]);

  return (
    <View style={styles.item}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#eee"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedValue.interpolate({
            inputRange: [0, circumference],
            outputRange: [circumference, 0],
          })}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>

      <Text style={[styles.value, { color }]}>{displayValue} g</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
  },
  value: {
    fontWeight: "bold",
    fontSize: 15,   // ลดลงนิดนึง
    marginTop: 6,
  },
  label: {
    color: "#333",
    fontSize: 13,
    marginTop: 4,
  },
});
