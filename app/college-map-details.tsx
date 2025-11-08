import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';

export default function CollegeDetailScreen() {
  const { college } = useLocalSearchParams<{ college: string }>();
  const GeneralMapInfo = () => (
  <ThemedText style={styles.footnoteText}>
    Room numbers are denoted by white text inside black boxes.{'\n'}
    Stairwells are marked by the <Image source={require('@/assets/images/stairwell.jpg')} style={styles.stairwellIcon} /> icon.{'\n'}
    Elevators and construction hazards are shown above the map image.{'\n'}
    Miscellaneous notes are shown below the map image.{'\n'}
    MH stands for Magister's House.
  </ThemedText>
);

  // Map college names to their images and footnotes
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
      footnote: 'Buildings: 2\nElevators: 1\nParking for New Hanszen is tricky because it’s in the middle of nowhere but inner loop is typically best',
    },
    'Jones College': {
      image: require('@/assets/images/maps/jones-map.jpg'),
      footnote: 'Buildings: 3 (connected)\nElevators: 2\nJones Commons is on the first floor of the central building',
    },
    'Lovett College': {
      image: require('@/assets/images/maps/lovett-map.jpg'),
      footnote: 'Buildings: 2\nElevators: 1\nThe primary “toaster” building has 6 floors, but only the first 5 are accessible by elevator\nThe Lovett basement is accessible by elevator and is under the “toaster” building\nThe Lovett elevator is not large enough to fit a stretcher, but can fit a stair chair',
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
  const image = collegeData[college].image;
  const [zoomed, setZoomed] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: college }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* {data?.image && (
          <Image
            source={data.image}
            style={styles.mapImage}
            contentFit="contain"
          />
        )} */}
        {image && (
          <Pressable onPress={() => setZoomed(true)}>
            <Image
              source={image}
              style={styles.mapImage}
              contentFit="contain"
            />
          </Pressable>
        )}
        
        <ThemedView>
          <ThemedText style={styles.footnoteTitle}>Relevant Information</ThemedText>
          <ThemedText style={styles.footnoteText}>{data?.footnote}</ThemedText>
          
        </ThemedView>
        <ThemedText style={styles.generalInfoTitle}>General Map Information</ThemedText>
        <ThemedText style={styles.footnoteText}>
          Room numbers are denoted by white text inside black boxes.{'\n'}
          Stairwells are marked by the <Image source={require('@/assets/images/stairwell.jpg')} style={styles.stairwellIcon} /> icon.{'\n'}
          Elevators and construction hazards are shown above the map image.{'\n'}
          Miscellaneous notes are shown below the map image.{'\n'}
          MH stands for Magister's House.
        </ThemedText>
      </ScrollView>
      {/* Fullscreen zoom modal */}
      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable style={styles.zoomOverlay} onPress={() => setZoomed(false)}>
          {image && (
            <Image source={image} style={styles.zoomImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  mapImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  footnoteContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  footnoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  footnoteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  generalInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  stairwellIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  zoomImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
});