import React from 'react';
import { StyleSheet, View } from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestEmojiScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <EmojiSelector
                    onEmojiSelected={() => {}}
                    showSearchBar={false}
                    columns={8}
                />
            </View>
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
        padding: 20,
    },
}); 