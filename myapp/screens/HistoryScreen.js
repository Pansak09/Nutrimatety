import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ประวัติ (History)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center' },
  text: { fontSize:20 }
});
