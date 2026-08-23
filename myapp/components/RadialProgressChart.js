// components/RadialProgressChart.js
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// เฉดสีให้เข้าชุดกับธีมสุขภาพของ HomeScreen
// (พื้นหลังวงแหวนเป็นเขียวอ่อนแทนเทา ให้ความรู้สึก "สด สะอาด")
const TRACK_COLOR = "#E3EEE7";
const OVER_COLOR = "#FF6B5E";
const VALUE_TEXT_COLOR = "#0F2E27";
const LABEL_TEXT_COLOR = "#5B7369";
const GOAL_TEXT_COLOR = "#A2B3AC";

export default function RadialProgressChart({
  value = 0,
  goal = 100,
  color = "#1B8A5A",
  overColor = OVER_COLOR,
  label,
  size: sizeProp,
  hideValue = false,
  hideLabel = false,
}) {
  const screenWidth = Dimensions.get("window").width;

  // ถ้ามีการส่ง size เข้ามา (เช่นวงใหญ่ในการ์ดพลังงาน) ให้ scale ตามนั้น
  // ไม่งั้น fallback เป็นสัดส่วนของความกว้างจอเหมือนเดิม
  const radius = sizeProp ? sizeProp / 2.6 : screenWidth * 0.1;
  const strokeWidth = sizeProp ? sizeProp * 0.09 : screenWidth * 0.035;
  const circumference = 2 * Math.PI * radius;
  const size = radius * 2 + strokeWidth * 2;

  const baseAnim = useRef(new Animated.Value(0)).current;
  const overAnim = useRef(new Animated.Value(0)).current;

  const safeGoal = goal > 0 ? goal : 1;
  const percent = value / safeGoal;

  const normalProgress = Math.min(percent, 1);
  const overProgress = percent > 1 ? percent - 1 : 0;
  const isOverGoal = overProgress > 0;

  const gradId = useRef(
    `rpc-grad-${Math.random().toString(36).slice(2)}`
  ).current;

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
        <Defs>
          {/* ไล่เฉดอ่อนของสีหลักให้วงแหวนดูมีมิติแบบธรรมชาติ ไม่แบนราบ */}
          <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* วงปกติ */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={baseAnim.interpolate({
            inputRange: [0, circumference],
            outputRange: [circumference, 0],
          })}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />

        {/* วงเกิน (วาดทับ) */}
        {isOverGoal && (
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
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>

      {!hideValue && (
        <Text style={[styles.value, isOverGoal && { color: overColor }]}>
          {Math.round(value)}
          <Text style={styles.valueGoal}> / {Math.round(goal)}</Text>
        </Text>
      )}

      {!hideLabel && label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: "center", justifyContent: "center" },
  value: {
    fontWeight: "800",
    fontSize: 15,
    marginTop: 6,
    color: VALUE_TEXT_COLOR,
  },
  valueGoal: {
    fontWeight: "500",
    fontSize: 13,
    color: GOAL_TEXT_COLOR,
  },
  label: {
    color: LABEL_TEXT_COLOR,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
});