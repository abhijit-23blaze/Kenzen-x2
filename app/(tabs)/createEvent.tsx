import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateEventScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [recurring, setRecurring] = useState('one-time');
    const [duration, setDuration] = useState(60); // Default duration: 60 minutes
    const [isRecurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
    const [isDurationModalVisible, setDurationModalVisible] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [emoji, setEmoji] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [pickerMode, setPickerMode] = useState<'thumbnail' | 'emoji'>('thumbnail');
    const [isEmojiModalVisible, setEmojiModalVisible] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setThumbnail(result.assets[0].uri);
        }
    };

    const handleCreateEvent = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to create an event.');
            return;
        }

        if (!name || !description) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setUploading(true);
        let thumbnailUrl = '';
        let eventEmoji = '';

        if (pickerMode === 'thumbnail' && thumbnail) {
            const response = await fetch(thumbnail);
            const blob = await response.blob();
            const storageRef = ref(storage, `event_thumbnails/${user.uid}/${Date.now()}`);
            await uploadBytes(storageRef, blob);
            thumbnailUrl = await getDownloadURL(storageRef);
        } else if (pickerMode === 'emoji' && emoji) {
            eventEmoji = emoji;
        }

        const startDate = date;
        const endDate = new Date(startDate.getTime() + duration * 60000);

        try {
            const eventsCollectionRef = collection(db, 'users', user.uid, 'upcoming');
            await addDoc(eventsCollectionRef, {
                eventType: 'personal',
                name,
                description,
                location,
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                duration,
                recurring,
                creator: user.uid,
                thumbnail: thumbnailUrl,
                emoji: eventEmoji,
            });
            router.back();
        } catch (error: any) {
            console.error("Firebase Error:", error);
            Alert.alert('Error Creating Event', `An unexpected error occurred: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setFullYear(selectedDate.getFullYear());
            newDate.setMonth(selectedDate.getMonth());
            newDate.setDate(selectedDate.getDate());
            setDate(newDate);
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            setDate(newDate);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Event</Text>
                <View style={styles.headerIcon} />
            </View> */}
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.pickerModeContainer}>
                    <TouchableOpacity
                        style={[styles.pickerModeButton, pickerMode === 'thumbnail' && styles.pickerModeButtonActive]}
                        onPress={() => setPickerMode('thumbnail')}
                    >
                        <Text style={styles.pickerModeText}>Thumbnail</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pickerModeButton, pickerMode === 'emoji' && styles.pickerModeButtonActive]}
                        onPress={() => setPickerMode('emoji')}
                    >
                        <Text style={styles.pickerModeText}>Emoji</Text>
                    </TouchableOpacity>
                </View>

                {pickerMode === 'thumbnail' ? (
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {thumbnail ? (
                            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
                        ) : (
                            <View style={styles.imagePickerPlaceholder}>
                                <MaterialCommunityIcons name="camera-plus-outline" size={40} color="rgba(255, 255, 255, 0.5)" />
                                <Text style={styles.imagePickerText}>Add Thumbnail</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.imagePicker} onPress={() => setEmojiModalVisible(true)}>
                        <View style={styles.imagePickerPlaceholder}>
                            {emoji ? (
                                <Text style={styles.emojiText}>{emoji}</Text>
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="emoticon-happy-outline" size={40} color="rgba(255, 255, 255, 0.5)" />
                                    <Text style={styles.imagePickerText}>Select Emoji</Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="format-title" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Event Name"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="text" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Description"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Location (optional)"
                        placeholderTextColor="rgba(255, 255, 255, 0.7)"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>

                <View style={styles.dateTimePickerContainer}>
                    <TouchableOpacity style={styles.dateTimePickerButton} onPress={() => setShowDatePicker(true)}>
                        <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" style={styles.pickerIcon} />
                        <Text style={{ color: '#FFFFFF' }}>{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dateTimePickerButton} onPress={() => setShowTimePicker(true)}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" style={styles.pickerIcon} />
                        <Text style={{ color: '#FFFFFF' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}

                <TouchableOpacity style={styles.inputWrapper} onPress={() => setDurationModalVisible(true)}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <Text style={styles.inputText}>
                        {duration} minutes
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.inputWrapper} onPress={() => setRecurrenceModalVisible(true)}>
                    <MaterialCommunityIcons name="repeat" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                    <Text style={styles.inputText}>
                        {recurring}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                    <LinearGradient
                        colors={['#D81B60', '#8E24AA']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.createButtonText}>Create Event</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
            
            <Modal
                animationType="slide"
                transparent={true}
                visible={isRecurrenceModalVisible}
                onRequestClose={() => setRecurrenceModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setRecurrenceModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Recurrence</Text>
                            {['one-time', 'daily', 'weekly'].map((option, index) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.modalOption,
                                        index === 2 && styles.lastModalOption,
                                    ]}
                                    onPress={() => {
                                        setRecurring(option);
                                        setRecurrenceModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        recurring === option && styles.modalOptionTextSelected,
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isDurationModalVisible}
                onRequestClose={() => setDurationModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setDurationModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Duration</Text>
                            {[30, 60, 90, 120, 180].map((d, index) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[
                                        styles.modalOption,
                                        index === 4 && styles.lastModalOption,
                                    ]}
                                    onPress={() => {
                                        setDuration(d);
                                        setDurationModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        duration === d && styles.modalOptionTextSelected,
                                    ]}>
                                        {d} minutes
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isEmojiModalVisible}
                onRequestClose={() => setEmojiModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setEmojiModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.emojiModalContent}>
                            <View style={{ flex: 1 }}>
                                <EmojiSelector
                                    onEmojiSelected={selectedEmoji => {
                                        setEmoji(selectedEmoji);
                                        setEmojiModalVisible(false);
                                    }}
                                    showSearchBar={false}
                                    columns={8}
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#121212' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#282828',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerIcon: {
        width: 24,
    },
    container: {
        padding: 20,
    },
    pickerModeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    pickerModeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        marginHorizontal: 10,
    },
    pickerModeButtonActive: {
        backgroundColor: '#D81B60',
    },
    pickerModeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    imagePicker: {
        width: '100%',
        height: 180,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePickerPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 8,
    },
    emojiText: {
        fontSize: 80,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        paddingVertical: 15,
        fontSize: 16,
    },
    inputText: {
        color: '#FFFFFF',
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        borderRadius: 8,
        marginTop: 20,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 18,
        alignItems: 'center',
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateTimePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dateTimePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 8,
        width: '48%',
    },
    pickerIcon: {
        marginRight: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#282828',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    modalOption: {
        width: '90%',
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    lastModalOption: {
        borderBottomWidth: 0,
    },
    modalOptionText: {
        color: '#FFFFFF',
        fontSize: 18,
    },
    modalOptionTextSelected: {
        color: '#D81B60',
        fontWeight: 'bold',
    },
    emojiModalContent: {
        height: '50%',
        backgroundColor: '#282828',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        paddingBottom: 20,
    }
}); 