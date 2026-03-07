import { Image } from 'expo-image';
import { View, Text, ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';

export default function CollegeDetailScreen() {
  const { college } = useLocalSearchParams<{ college: string }>();
  const [zoomed, setZoomed] = useState(false);

  const collegeData: Record<string, { image: any; footnote: string }> = {
    'Baker College': {
      image: require('@/assets/images/maps/baker-map.jpg'),
      footnote: 'Buildings: 4\nElevators: 1\nNew Baker is the only building with an elevator',
    },
    'Brown College': {
      image: require('@/assets/images/maps/brown-map.jpg'),
      footnote: 'Buildings: 2 (connected)\nElevators: 2',
    },
    'Duncan College': {
      image: require('@/assets/images/maps/duncan-map.jpg'),
      footnote: 'Buildings: 1\nElevators: 1',
    },
    'Hanszen College': {
      image: require('@/assets/images/maps/hanszen-map.jpg'),
      footnote: "Buildings: 2\nElevators: 1\nParking for New Hanszen is tricky because it\u2019s in the middle of nowhere but inner loop is typically best",
    },
    'Jones College': {
      image: require('@/assets/images/maps/jones-map.jpg'),
      footnote: 'Buildings: 3 (connected)\nElevators: 2\nJones Commons is on the first floor of the central building',
    },
    'Lovett College': {
      image: require('@/assets/images/maps/lovett-map.jpg'),
      footnote: 'Buildings: 2\nElevators: 1\nThe primary "toaster" building has 6 floors, but only the first 5 are accessible by elevator\nThe Lovett basement is accessible by elevator and is under the "toaster" building\nThe Lovett elevator is not large enough to fit a stretcher, but can fit a stair chair',
    },
    'Martel College': {
      image: require('@/assets/images/maps/martel-map.jpg'),
      footnote: 'Buildings: 1\nElevators: 2\nMartel basement is accessible by elevator',
    },
    'McMurtry College': {
      image: require('@/assets/images/maps/mcmurtry-map.jpg'),
      footnote: 'Buildings: 1\nElevators: 1',
    },
    'Sid Richardson College': {
      image: require('@/assets/images/maps/new-sid-map.jpg'),
      footnote: 'Buildings: 1\nElevators: 2 (side by side)\nFloors 3-5 include an additional set of rooms (x26-44) that branch off from the main building\nThe New Sid storage room is located on the fourth floor (412)',
    },
    'Wiess College': {
      image: require('@/assets/images/maps/wiess-map.jpg'),
      footnote: 'Buildings: 1\nElevators: 1\nThe Hanszen/Wiess Commons complex has an elevator, but it does not connect to residential rooms',
    },
    'Will Rice College': {
      image: require('@/assets/images/maps/will-rice-map.jpg'),
      footnote: 'Buildings: 2\nElevators: 1\nNew Will Rice has one elevator near the college commons, but Old Will Rice does not have an elevator.',
    },
  };

  const data = collegeData[college];
  const image = data?.image;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: college }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {image && (
          <Pressable onPress={() => setZoomed(true)}>
            <Image source={image} style={styles.mapImage} contentFit="contain" />
            <Text style={styles.tapHint}>Tap to zoom</Text>
          </Pressable>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Details</Text>
          <Text style={styles.infoText}>{data?.footnote}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Map Legend</Text>
          <Text style={styles.infoText}>
            Room numbers are denoted by white text inside black boxes.{'\n'}
            Stairwells are marked by the stairwell icon.{'\n'}
            Elevators and construction hazards are shown above the map image.{'\n'}
            MH stands for Magister's House.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable style={styles.zoomOverlay} onPress={() => setZoomed(false)}>
          {image && <Image source={image} style={styles.zoomImage} contentFit="contain" />}
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
