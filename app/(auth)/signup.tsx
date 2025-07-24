import { auth, db } from '@/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ImageBackground, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const signupImage = require('@/assets/images/bg4.jpg');

const branchOptions = ['CSE', 'ECE', 'AIDS'];

export default function SignupScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [branch, setBranch] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [section, setSection] = useState('');
    const [bio, setBio] = useState('');
    const [emailError, setEmailError] = useState('');
    const [sectionError, setSectionError] = useState('');
    const [rollNoError, setRollNoError] = useState('');
    const [isBranchModalVisible, setBranchModalVisible] = useState(false);

    const handleSignUp = async () => {
        if (!name || !password || !branch || !rollNo || !section || !bio) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        const emailRegex = /^[a-z]+\.[a-z]\d{2}@iiits\.in$/i;
        if (!emailRegex.test(email)) {
            setEmailError('Please use valid college email address');
            return;
        }
        
        const yearFromEmail = 2000 + parseInt(email.substring(email.length - 11, email.length - 8), 10);
        const rollNoRegex = new RegExp(`^S${yearFromEmail}\\d{7}$`);

        if (!rollNoRegex.test(rollNo)) {
            setRollNoError(`Invalid Roll No. format. Expected: S${yearFromEmail}XXXXXXX`);
            return;
        }

        const sectionNumber = parseInt(section, 10);
        if (isNaN(sectionNumber) || sectionNumber <= 0 || sectionNumber > 10) {
            setSectionError('Please enter a valid section number (1-10).');
            return;
        }

        const yearStr = email.substring(email.length - 10, email.length - 8);
        const year = parseInt(yearStr, 10);

        if (year > 25) {
            setEmailError('Invalid admission year. Year cannot be greater than 25.');
            return;
        }

        let yearOfStudy;
        if (year < 21) {
            yearOfStudy = 5; // Alumni
        } else {
            const currentFullYear = new Date().getFullYear();
            yearOfStudy = currentFullYear - (2000 + year) + 1;
            if (yearOfStudy <= 0) {
                yearOfStudy = 1; // Incoming student
            } else if (yearOfStudy > 4) {
                yearOfStudy = 5; // Graduated
            }
        }
        
        setEmailError('');
        setSectionError('');
        setRollNoError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name,
                email: user.email,
                branch,
                rollNo,
                section,
                yearOfStudy,
                bio,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Sign Up Error', 'The account is already created by someone, if not you, please whatsapp @ 8087864385 thanks');
            } else {
                Alert.alert('Sign Up Error', error.message);
            }
        }
    };

    return (
        <ImageBackground source={signupImage} style={styles.background}>
            <View style={styles.container}>
                <Text style={styles.title}>Create Account</Text>
                <View style={styles.inputContainer}>
                    
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="account-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    
                    <View style={[styles.inputWrapper, emailError ? styles.inputError : {}]}>
                        <MaterialCommunityIcons name="email-outline" size={22} color={emailError ? '#E57373' : "rgba(255, 255, 255, 0.7)"} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) setEmailError('');
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>
                <View style={styles.inputContainer}>
                    
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="lock-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={() => setBranchModalVisible(true)}>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="source-branch" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                            <Text style={[styles.input, { color: branch ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }]}>
                                {branch || 'Select your branch'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                    
                    <View style={[styles.inputWrapper, rollNoError ? styles.inputError : {}]}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={22} color={rollNoError ? '#E57373' : "rgba(255, 255, 255, 0.7)"} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your roll no."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={rollNo}
                            onChangeText={(text) => {
                                setRollNo(text);
                                if (rollNoError) setRollNoError('');
                            }}
                            autoCapitalize="characters"
                        />
                    </View>
                    {rollNoError ? <Text style={styles.errorText}>{rollNoError}</Text> : null}
                </View>
                <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper, sectionError ? styles.inputError : {}]}>
                        <MaterialCommunityIcons name="google-classroom" size={22} color={sectionError ? '#E57373' : "rgba(255, 255, 255, 0.7)"} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your section"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={section}
                            onChangeText={(text) => {
                                setSection(text);
                                if (sectionError) setSectionError('');
                            }}
                            keyboardType="number-pad"
                        />
                    </View>
                    {sectionError ? <Text style={styles.errorText}>{sectionError}</Text> : null}
                </View>
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="leaf" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Write your bio"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <LinearGradient
                        colors={['#D81B60', '#8E24AA']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>Sign up</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text style={[styles.footerText, styles.link]}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isBranchModalVisible}
                onRequestClose={() => setBranchModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setBranchModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Branch</Text>
                            {branchOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.modalOption,
                                        index === branchOptions.length - 1 && styles.lastModalOption,
                                    ]}
                                    onPress={() => {
                                        setBranch(option);
                                        setBranchModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        branch === option && styles.modalOptionTextSelected,
                                    ]}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 40,
        letterSpacing: 1,
    },
    inputContainer: {
        width: '90%',
        marginBottom: 15,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputError: {
        borderBottomColor: '#E57373',
    },
    errorText: {
        color: '#E57373',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        color: '#FFFFFF',
        paddingVertical: 12,
        fontSize: 16,
    },
    bioInput: {
        height: 45,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    button: {
        width: '90%',
        borderRadius: 8,
        marginTop: 30,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 18,
        alignItems: 'center',
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    link: {
        color: '#FFFFFF',
        fontWeight: 'bold',
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
}); 