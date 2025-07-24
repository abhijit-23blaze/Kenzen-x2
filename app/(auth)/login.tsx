import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const loginImage = require('@/assets/images/bg4.jpg');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            login(userCredential.user);
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential') {
                Alert.alert('Login Error', 'Invalid email or password. Please try again.');
            } else {
                Alert.alert('Login Error', error.message);
            }
        }
    };

    return (
        <ImageBackground source={loginImage} style={styles.background}>
            <View style={styles.container}>
                <Text style={styles.title}>Kenzen</Text>
                <Text style={styles.subtitle}>Your College Companion</Text>
                <View style={styles.inputContainer}>
                    
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="email-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="lock-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <LinearGradient
                        colors={['#D81B60', '#8E24AA']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                        <Text style={[styles.footerText, styles.link]}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        fontSize: 52,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 60,
    },
    inputContainer: {
        width: '90%',
        marginBottom: 20,
    },
    label: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
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
}); 