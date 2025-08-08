import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DUMMY DATA ---
// Spanning a few days for week view demonstration
const today = new Date();
const dummyEvents = [
  // Today's events
  { title: 'CS 101', description: "Introduction to computer science concepts. Focusing on algorithms and data structures.", start: new Date(today.setHours(10, 0, 0, 0)), end: new Date(today.setHours(11, 0, 0, 0)), color: '#841584' },
  { title: 'MATH 203', description: "Advanced calculus. We will cover multi-variable calculus and vector analysis.", start: new Date(today.setHours(11, 0, 0, 0)), end: new Date(today.setHours(12, 0, 0, 0)), color: '#a34ca3' },
  // Yesterday's events
  { title: 'PHYS 102', description: "Physics II: Electromagnetism. Lab session in the afternoon.", start: addDays(new Date().setHours(13, 0, 0, 0), -1), end: addDays(new Date().setHours(14, 0, 0, 0),-1), color: '#841584' },
  // Tomorrow's events
  { title: 'PROJECT WORK', description: "Team meeting for the final year project. All members must attend.", start: addDays(new Date().setHours(9, 0, 0, 0), 1), end: addDays(new Date().setHours(12, 0, 0, 0),1), color: '#5a9' },
];

interface Event {
    id: string;
    title: string;
    description: string;
    start: Date;
    end: Date;
    color: string;
    name?: string; // For new events
    location?: string;
    thumbnail?: string;
    emoji?: string;
    eventType?: string;
    recurring?: string;
    duration?: number;
}

const HOUR_HEIGHT = 60;
type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

// --- DAY VIEW COMPONENT ---
const DayView = ({ eventsForDay }: { eventsForDay: Event[] }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');

  const getEventPosition = (start: Date) => (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT;
  const getEventHeight = (start: Date, end: Date) => (end.getTime() - start.getTime()) / (1000 * 60 * 60) * HOUR_HEIGHT;

  const openModal = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  }

  return (
    <ScrollView>
      <View style={styles.timelineContainer}>
        <View style={styles.hoursContainer}>
          {hours.map((hour) => (
            <View key={hour} style={styles.hour}>
              <Text style={styles.hourText}>{hour}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
        </View>
        <View style={styles.eventsContainer}>
          {eventsForDay.map(event => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.event,
                {
                  top: getEventPosition(event.start),
                  height: getEventHeight(event.start, event.end),
                  backgroundColor: event.color,
                },
              ]}
              onPress={() => openModal(event)}
            >
              <Text style={styles.eventTitle}>{event.title || event.name}</Text>
              <Text style={styles.eventTime}>{`${format(event.start, 'hh:mm a')} - ${format(event.end, 'hh:mm a')}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEvent?.title || selectedEvent?.name}</Text>
            <Text style={styles.modalTime}>{selectedEvent ? `${format(selectedEvent.start, 'EEEE, MMMM d')} • ${format(selectedEvent.start, 'hh:mm a')} - ${format(selectedEvent.end, 'hh:mm a')}`: ''}</Text>
            <Text style={styles.modalDescription}>{selectedEvent?.description}</Text>
            {selectedEvent?.location && (
              <Text style={styles.modalLocation}>📍 {selectedEvent.location}</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

// --- WEEK VIEW COMPONENT ---
const WeekView = ({ allEvents }: { allEvents: Event[] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsForSelectedDay = allEvents.filter(event => isSameDay(event.start, selectedDate));

  return (
    <View style={{flex: 1}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
        {weekDays.map(day => (
          <TouchableOpacity key={day.toString()} onPress={() => setSelectedDate(day)} style={[styles.dayButton, isSameDay(day, selectedDate) && styles.dayButtonActive]}>
            <Text style={styles.dayText}>{format(day, 'EEE')}</Text>
            <Text style={styles.dateText}>{format(day, 'd')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <DayView eventsForDay={eventsForSelectedDay} />
    </View>
  );
}

// --- MAIN HOME SCREEN ---
export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const populateDummyData = async (userId: string) => {
    const eventsCollectionRef = collection(db, 'users', userId, 'upcoming');
    for (const event of dummyEvents) {
      await addDoc(eventsCollectionRef, {
        ...event,
        start: Timestamp.fromDate(event.start),
        end: Timestamp.fromDate(event.end)
      });
    }
  };

  const fetchEvents = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    };

    try {
      const eventsCollectionRef = collection(db, 'users', userId, 'upcoming');
      const querySnapshot = await getDocs(eventsCollectionRef);

      if(querySnapshot.empty) {
        await populateDummyData(userId);
        const newQuerySnapshot = await getDocs(eventsCollectionRef);
        const fetchedEvents = newQuerySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                start: data.startDate ? data.startDate.toDate() : data.start.toDate(),
                end: data.endDate ? data.endDate.toDate() : data.end.toDate(),
                title: data.name || data.title,
                color: data.color || '#841584',
            } as unknown as Event;
        });
        setEvents(fetchedEvents);
      } else {
        const fetchedEvents = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                start: data.startDate ? data.startDate.toDate() : data.start.toDate(),
                end: data.endDate ? data.endDate.toDate() : data.end.toDate(),
                title: data.name || data.title,
                color: data.color || '#841584',
            } as unknown as Event;
        });
        setEvents(fetchedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleLogout = async () => {
    await logout();
  };

  const todaysEvents = events.filter(event => isSameDay(event.start, new Date()));

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.placeholder}><Text style={styles.logoutText}>Loading schedule...</Text></View></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerDate}>{format(new Date(), 'MMMM d, yyyy')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color="#B3B3B3" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewModeContainer}>
        {(['Day', 'Week', 'Month', 'Year'] as ViewMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={styles.viewModeButtonText}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'Day' && <DayView eventsForDay={todaysEvents} />}
      {viewMode === 'Week' && <WeekView allEvents={events} />}
      {/* Placeholder for other views */}
      {viewMode === 'Month' && <View style={styles.placeholder}><Text style={styles.logoutText}>Month View Coming Soon</Text></View>}
      {viewMode === 'Year' && <View style={styles.placeholder}><Text style={styles.logoutText}>Year View Coming Soon</Text></View>}
    
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/createEvent')}>
        <LinearGradient
            colors={['#D81B60', '#8E24AA']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#282828' 
  },
  headerDate: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
  },
  logoutText: { color: '#B3B3B3', fontSize: 16 },
  viewModeContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#181818', paddingVertical: 10 },
  viewModeButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  viewModeButtonActive: { backgroundColor: '#841584' },
  viewModeButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  timelineContainer: { flexDirection: 'row', paddingTop: 10 },
  hoursContainer: { paddingTop: 10, paddingLeft: 10 },
  hour: { height: HOUR_HEIGHT, justifyContent: 'flex-start' },
  hourText: { color: '#B3B3B3', fontSize: 12 },
  hourLine: { position: 'absolute', left: 50, top: 7, borderTopWidth: 1, borderColor: '#282828', width: '1000%' },
  eventsContainer: { position: 'absolute', left: 60, right: 0, top: 10 },
  event: { position: 'absolute', left: 10, right: 10, borderRadius: 5, padding: 10, justifyContent: 'center' },
  eventTitle: { color: '#FFFFFF', fontWeight: 'bold' },
  eventTime: { color: '#FFFFFF', fontSize: 12 },
  weekSelector: { flexGrow: 0, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#282828' },
  dayButton: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, marginHorizontal: 5},
  dayButtonActive: { backgroundColor: '#282828' },
  dayText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  dateText: { color: 'white', fontSize: 14 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalTime: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalLocation: {
    fontSize: 14,
    color: '#B3B3B3',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#841584',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    right: 30,
    bottom: 30,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
