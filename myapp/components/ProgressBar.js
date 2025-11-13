// components/ProgressBar.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProgressBar({ step }) {
  const widths = ['25%', '50%', '75%', '100%'];
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: widths[step - 1] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginVertical: 20,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});
