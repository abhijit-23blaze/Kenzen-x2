import { GEMINI_API_KEY } from '@/constants/ApiKeys';
import { auth, db } from '@/firebase';
import { GoogleGenerativeAI, SchemaType, Tool } from '@google/generative-ai';
import { addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const getSchedule = async () => {
    console.log("Getting schedule from firestore");
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return {error: "User not logged in"};
    };

    const eventsCollectionRef = collection(db, 'users', userId, 'events');
    const querySnapshot = await getDocs(eventsCollectionRef);
    
    if(querySnapshot.empty) {
        return {events: []}
    }

    const events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            start: data.start.toDate().toISOString(),
            end: data.end.toDate().toISOString(),
        };
    });
    return {events};
}

const scheduleEvent = async ({title, description, startTime, endTime}: {title: string, description: string, startTime: string, endTime: string}) => {
    console.log("Scheduling event in firestore", {title, description, startTime, endTime});
    const userId = auth.currentUser?.uid;
    if (!userId) {
        return {error: "User not logged in"};
    };

    const eventsCollectionRef = collection(db, 'users', userId, 'events');
    await addDoc(eventsCollectionRef, {
        title,
        description: description || '',
        start: Timestamp.fromDate(new Date(startTime)),
        end: Timestamp.fromDate(new Date(endTime)),
        color: '#841584' // Default color
    });

    return {success: true};
}

const tools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: "getSchedule",
          description: "Get the user's schedule for the upcoming days.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {},
          }
        },
        {
            name: "scheduleEvent",
            description: "Schedule a new event in the user's calendar.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    title: {
                        type: SchemaType.STRING,
                        description: "The title of the event."
                    },
                    description: {
                        type: SchemaType.STRING,
                        description: "A brief description of the event."
                    },
                    startTime: {
                        type: SchemaType.STRING,
                        description: "The start time of the event in ISO 8601 format."
                    },
                    endTime: {
                        type: SchemaType.STRING,
                        description: "The end time of the event in ISO 8601 format."
                    }
                },
                required: ["title", "startTime", "endTime"]
            }
        }
      ]
    }
];

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest",
});


export default function AIScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! How can I help you schedule your day?', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim().length === 0) return;

    const userMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const chat = model.startChat({tools});
      const result = await chat.sendMessage(currentInput);
      const response = result.response;
      
      const functionCalls = response.functionCalls();
      if(functionCalls && functionCalls.length > 0) {
        for(const fnCall of functionCalls) {
            const fnName = fnCall.name;
            const fnArgs = fnCall.args;
            let apiResponse;

            if (fnName === 'getSchedule') {
                apiResponse = await getSchedule();
            } else if (fnName === 'scheduleEvent') {
                apiResponse = await scheduleEvent(fnArgs as any);
            } else {
                continue; // Or handle unknown function
            }
            
            const fnResponseResult = await chat.sendMessage([
                {
                    functionResponse: {
                        name: fnName,
                        response: apiResponse,
                    }
                }
            ]);
            
            const {response: finalResponse} = fnResponseResult;
            const text = finalResponse.text();
            const aiMessage = { id: Date.now().toString() + '-ai', text, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        }
      } else {
        const text = response.text();
        const aiMessage = { id: Date.now().toString() + '-ai', text, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = { id: Date.now().toString() + '-error', text: 'Sorry, I encountered an error.', sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView style={styles.messagesContainer}>
          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.sender === 'user' ? styles.userMessage : styles.aiMessage]}>
              <Text style={styles.messageText}>{msg.text}</Text>
            </View>
          ))}
           {loading && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me to schedule something..."
            placeholderTextColor="#888"
            editable={!loading}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#121212',
    },
    container: {
        flex: 1,
        padding: 10,
    },
    messagesContainer: {
        flex: 1,
    },
    messageBubble: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 10,
        maxWidth: '80%',
    },
    userMessage: {
        backgroundColor: '#841584',
        alignSelf: 'flex-end',
    },
    aiMessage: {
        backgroundColor: '#282828',
        alignSelf: 'flex-start',
    },
    messageText: {
        color: 'white',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#282828',
    },
    input: {
        flex: 1,
        backgroundColor: '#282828',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: 'white',
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#841584',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
}); 