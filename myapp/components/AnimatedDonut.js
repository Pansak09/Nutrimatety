import React, { useRef, useEffect } from "react";
import { View, Animated, Text } from "react-native";
import Svg, { G, Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DonutChart({ data, radius = 80, strokeWidth = 30 }) {
  const circumference = 2 * Math.PI * radius;
  const size = radius * 2 + strokeWidth * 2;
  const total = data.reduce((s, x) => s + x.value, 0) || 1; // กัน total=0

  let cumulativePercent = 0;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation="-90" originX={size / 2} originY={size / 2}>
          {data.map((item, index) => {
            if (item.value <= 0) return null; // ❌ ข้าม slice ที่ไม่มีค่า

            const percentage = item.value / total;
            const strokeDasharray = circumference * percentage;

            const animatedValue = useRef(new Animated.Value(0)).current;

            useEffect(() => {
              Animated.timing(animatedValue, {
                toValue: strokeDasharray,
                duration: 800,
                useNativeDriver: false,
              }).start();
            }, [strokeDasharray]);

            const strokeDashoffset = animatedValue.interpolate({
              inputRange: [0, strokeDasharray],
              outputRange: [circumference, circumference - strokeDasharray],
            });

            const startAngle = cumulativePercent * 2 * Math.PI;
            const sliceAngle = percentage * 2 * Math.PI;
            cumulativePercent += percentage;

            // ✅ คำนวณตำแหน่ง % ให้อยู่ตรงกลาง slice
            const midAngle = startAngle + sliceAngle / 2;
            const labelX = size / 2 + (radius + strokeWidth / 3) * Math.cos(midAngle);
            const labelY = size / 2 + (radius + strokeWidth / 3) * Math.sin(midAngle);

            return (
              <React.Fragment key={index}>
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  fill="transparent"
                />
                <Text
                  style={{
                    position: "absolute",
                    left: labelX - 12,
                    top: labelY - 12,
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {`${Math.round(percentage * 100)}%`}
                </Text>
              </React.Fragment>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
