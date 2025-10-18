import { TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';

export default function CalculatorScreen() {
    const [drugAdministered, setDrugAdministered] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
    const [routeOfAdministration, setRouteOfAdministration] = useState('');

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedView style={styles.dosageCard}>
                    <ThemedText style={styles.title}>Dosage Calculator</ThemedText>
                    <ThemedText style={styles.dosageText}>Dosage: </ThemedText>
                </ThemedView>
                <ThemedText style={styles.label}>Drug Administered</ThemedText>
                <TextInput
                    style={styles.input}
                    value = {drugAdministered}
                    onChangeText = {setDrugAdministered}
                    placeholder = ""
                />

                <ThemedText style={styles.label}>Age</ThemedText>
                <TextInput
                    style={styles.input}
                    value = {age}
                    onChangeText = {setAge}
                    placeholder = ""
                />

                <ThemedText style={styles.label}>Weight</ThemedText>
                <ThemedView style={styles.weightContainer}>
                    <TextInput
                        style={[styles.input, styles.weightInput]}
                        value = {weight}
                        onChangeText = {setWeight}
                        keyboardType = "numeric"
                        placeholder = ""
                    />
                    
                    <ThemedView
                    // lb to kg toggle
                    />
                </ThemedView>

                <ThemedText style={styles.label}>Route of Administration</ThemedText>
                <TextInput
                    style={styles.input}
                    value = {routeOfAdministration}
                    onChangeText = {setRouteOfAdministration}
                    placeholder = ""
                />

                <ThemedText style={styles.label}>Safety Information:</ThemedText>
                <ThemedText style={styles.safetyText}>
                    Example safety information
                </ThemedText>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 80,
        gap: 15,
    },
    dosageCard: {
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
    },
    dosageText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    weightContainer: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    weightInput: {
        flex: 1,
    },
    unitToggle: {
        flexDirection: 'row',
        gap: 5,
    },
    unitButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    unitButtonActive: {
        backgroundColor: '#007AFF',
    },
    safetyText: {
        fontSize: 14,
        color: '#000000ff',
        lineHeight: 20,
    }
})
