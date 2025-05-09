import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, Portal, Dialog, Chip } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  currentBookings: number;
  maxCapacity: number;
};

type ServiceSchedule = {
  id: string;
  dayOfWeek: number;
  timeSlots: TimeSlot[];
};

type ServiceSchedulerProps = {
  shopId: string;
  serviceId: string;
  onScheduleSelected: (schedule: { day: number; timeSlot: TimeSlot }) => void;
};

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function ServiceScheduler({
  shopId,
  serviceId,
  onScheduleSelected,
}: ServiceSchedulerProps) {
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [shopId, serviceId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('service_schedules')
        .select('*')
        .eq('shop_id', shopId)
        .eq('service_id', serviceId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      // Group schedules by day
      const groupedSchedules = data.reduce((acc: ServiceSchedule[], schedule) => {
        const existingDay = acc.find((s) => s.dayOfWeek === schedule.day_of_week);
        if (existingDay) {
          existingDay.timeSlots.push({
            id: schedule.id,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            isAvailable: schedule.current_bookings < schedule.max_capacity,
            currentBookings: schedule.current_bookings,
            maxCapacity: schedule.max_capacity,
          });
        } else {
          acc.push({
            id: schedule.id,
            dayOfWeek: schedule.day_of_week,
            timeSlots: [{
              id: schedule.id,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              isAvailable: schedule.current_bookings < schedule.max_capacity,
              currentBookings: schedule.current_bookings,
              maxCapacity: schedule.max_capacity,
            }],
          });
        }
        return acc;
      }, []);

      setSchedules(groupedSchedules);
    } catch (err) {
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowTimeSlotDialog(true);
  };

  const handleConfirmBooking = () => {
    if (selectedDay !== null && selectedTimeSlot) {
      onScheduleSelected({
        day: selectedDay,
        timeSlot: selectedTimeSlot,
      });
      setShowTimeSlotDialog(false);
      setSelectedTimeSlot(null);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>Loading schedules...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.error}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Select Service Time
        </Text>

        <ScrollView horizontal style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day, index) => (
            <Chip
              key={day}
              selected={selectedDay === index}
              onPress={() => handleDaySelect(index)}
              style={styles.dayChip}
            >
              {day}
            </Chip>
          ))}
        </ScrollView>

        {selectedDay !== null && (
          <ScrollView style={styles.timeSlotsContainer}>
            {schedules
              .find((s) => s.dayOfWeek === selectedDay)
              ?.timeSlots.map((slot) => (
                <List.Item
                  key={slot.id}
                  title={`${slot.startTime} - ${slot.endTime}`}
                  description={`${slot.currentBookings}/${slot.maxCapacity} booked`}
                  right={() => (
                    <Button
                      mode="contained"
                      onPress={() => handleTimeSlotSelect(slot)}
                      disabled={!slot.isAvailable}
                    >
                      Select
                    </Button>
                  )}
                />
              ))}
          </ScrollView>
        )}

        <Portal>
          <Dialog visible={showTimeSlotDialog} onDismiss={() => setShowTimeSlotDialog(false)}>
            <Dialog.Title>Confirm Booking</Dialog.Title>
            <Dialog.Content>
              <Text>
                Selected time: {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
              </Text>
              <Text>
                Day: {selectedDay !== null ? DAYS_OF_WEEK[selectedDay] : ''}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowTimeSlotDialog(false)}>Cancel</Button>
              <Button onPress={handleConfirmBooking}>Confirm</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  daysContainer: {
    marginBottom: 16,
  },
  dayChip: {
    marginRight: 8,
  },
  timeSlotsContainer: {
    maxHeight: 300,
  },
  error: {
    color: colors.error,
  },
}); 