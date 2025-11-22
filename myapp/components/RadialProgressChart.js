// components/RadialProgressChart.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RadialProgressChart({
  value,
  goal,
  color,
  label,
  hideValue = false,
  hideLabel = false,
  labelStyle = {}
}) {
  const screenWidth = Dimensions.get("window").width;

  // ⭐ ความหนาของกราฟ
  const radius = screenWidth * 0.10;
  const strokeWidth = screenWidth * 0.04;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  const size = radius * 2 + strokeWidth * 2;
  const progress = Math.min(value / goal, 1);

  /* ===================== Animation ===================== */
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

        {/* วงกลมพื้นหลัง */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#eee"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* วงกลม progress */}
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

      {/* ⭐ แสดงค่าแบบ X / Y */}
      {!hideValue && (
        <Text style={[styles.value, { color }]}>
          {displayValue} / {goal} g
        </Text>
      )}

      {/* Label */}
      {!hideLabel && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: "center",
  },
  value: {
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 6,
    textAlign: "center",
  },
  label: {
    color: "#333",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
});
