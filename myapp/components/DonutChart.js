// DonutChart.js
import React, { useRef, useEffect } from "react";
import { View, Animated, Text } from "react-native";
import Svg, { G, Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DonutChart({
  value = 0,
  goal = 100,
  color = "#4CAF50",
  radius = 70,
  strokeWidth = 20,
  label = "",
}) {
  const percentage = goal === 0 ? 0 : value / goal;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage * circumference,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const size = radius * 2 + strokeWidth * 2;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation="-90" originX={size / 2} originY={size / 2}>
          {/* พื้นหลัง */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ddd"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* วงโหลด */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={animatedValue.interpolate({
              inputRange: [0, circumference],
              outputRange: [circumference, 0],
            })}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Label กลางวง */}
      <View
        style={{
          position: "absolute",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "800" }}>
          {Math.round(value)} g
        </Text>
        <Text style={{ fontSize: 15, color: "#777", marginTop: -4 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
