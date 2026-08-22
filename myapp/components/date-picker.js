// components/date-picker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

// แปลงวันที่ให้แสดงผลสวยงามแบบภาษาไทย (เช่น 1 ม.ค. 2543)
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function DatePicker({ label, value, onChange, placeholder = 'เลือกวันที่' }) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Trigger Button ดีไซน์ Shadcn UI */}
      <TouchableOpacity 
        style={[styles.trigger, value && styles.triggerActive]} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="calendar-outline" 
          size={18} 
          color={value ? "#0F172A" : "#94A3B8"} 
        />
        <Text style={[styles.triggerText, !value && styles.placeholderText]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
      </TouchableOpacity>

      {/* Card Popover / Modal เลือกวันที่ */}
      <Modal transparent animationType="fade" visible={show} onRequestClose={() => setShow(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShow(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกวันที่</Text>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                themeVariant="light"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setTempDate(selectedDate);
                  if (Platform.OS === 'android') {
                    setShow(false);
                    if (selectedDate) onChange(selectedDate);
                  }
                }}
              />
            </View>

            {Platform.OS === 'ios' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShow(false)}>
                  <Text style={styles.cancelText}>ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmText}>ตกลง</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '600', color: '#1B5E20', fontSize: 14 },
  
  // Shadcn Trigger Design
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0', // slate-200
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  triggerActive: {
    borderColor: '#1B7F5A',
  },
  triggerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0F172A', // slate-900
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94A3B8', // slate-400
    fontWeight: '400',
  },

  // Modal / Popover Styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#1B7F5A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});