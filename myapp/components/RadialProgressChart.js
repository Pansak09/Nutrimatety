// components/RadialProgressChart.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RadialProgressChart({
  value = 0,
  goal = 100,
  color = "#4A90E2",
  overColor = "#FF3B30",
  label,
}) {
  const screenWidth = Dimensions.get("window").width;

  const radius = screenWidth * 0.10;
  const strokeWidth = screenWidth * 0.035;
  const circumference = 2 * Math.PI * radius;
  const size = radius * 2 + strokeWidth * 2;

  const baseAnim = useRef(new Animated.Value(0)).current;
  const overAnim = useRef(new Animated.Value(0)).current;

  const safeGoal = goal > 0 ? goal : 1;
  const percent = value / safeGoal;

  const normalProgress = Math.min(percent, 1);
  const overProgress = percent > 1 ? percent - 1 : 0;

  useEffect(() => {
    baseAnim.setValue(0);
    overAnim.setValue(0);

    Animated.timing(baseAnim, {
      toValue: normalProgress * circumference,
      duration: 700,
      useNativeDriver: false,
    }).start();

    if (overProgress > 0) {
      Animated.timing(overAnim, {
        toValue: Math.min(overProgress, 1) * circumference,
        duration: 700,
        useNativeDriver: false,
      }).start();
    }
  }, [value, goal]);

  return (
    <View style={styles.item}>
      <Svg width={size} height={size}>
        {/* Background */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EAEAEA"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* วงปกติ */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={baseAnim.interpolate({
            inputRange: [0, circumference],
            outputRange: [circumference, 0],
          })}
          strokeLinecap="round"
          fill="transparent"
        />

        {/* วงเกิน (วาดทับ) */}
        {overProgress > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={overColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={overAnim.interpolate({
              inputRange: [0, circumference],
              outputRange: [circumference, 0],
            })}
            strokeLinecap="round"
            fill="transparent"
          />
        )}
      </Svg>

      <Text style={styles.value}>
        {Math.round(value)} / {Math.round(goal)}
      </Text>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: "center" },
  value: {
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 6,
  },
  label: {
    color: "#333",
    fontSize: 13,
    marginTop: 4,
  },
});
