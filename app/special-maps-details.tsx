import { Image } from 'expo-image';
import { View, Text, ScrollView, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase, getStorageUrl, BuildingRow } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function SpecialMapsDetailScreen() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const [zoomed, setZoomed] = useState(false);
  const [building, setBuilding] = useState<BuildingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('buildings')
      .select('*')
      .eq('name', location)
      .single()
      .then(({ data }) => {
        if (data) setBuilding(data);
        setLoading(false);
      });
  }, [location]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: location }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const imageUri = building?.map_path ? getStorageUrl(building.map_path) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: location }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <Pressable onPress={() => setZoomed(true)}>
            <Image source={{ uri: imageUri }} style={styles.mapImage} contentFit="contain" />
            <Text style={styles.tapHint}>Tap to zoom</Text>
          </Pressable>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Information</Text>
          <Text style={styles.infoText}>{building?.description ?? 'No information available'}</Text>
        </View>
      </ScrollView>

      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable style={styles.zoomOverlay} onPress={() => setZoomed(false)}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.zoomImage} contentFit="contain" />}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapImage: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomImage: {
    width: '100%',
    height: '80%',
  },
});
