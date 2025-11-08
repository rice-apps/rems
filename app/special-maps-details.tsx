//

import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';

export default function SpecialMapsDetailScreen() {
    const { location } = useLocalSearchParams<{ location: string }>();
    const [zoomed, setZoomed] = useState(false);

    // Image map
    // Static image map (must use static require so Metro can bundle assets)
    const IMAGE_MAP: Record<string, any> = {
        // Baker_Institute.jpg on disk is corrupted (invalid header). Use a safe fallback so Metro can bundle.
        'Baker Institute': require('@/assets/images/maps/Baker Institute.jpg'),
        'George R. Brown Tennis Center': require('@/assets/images/maps/George R. Brown Tennis Center.jpg'),
        'Ley Track & Holloway Field': require('@/assets/images/maps/Ley Track & Holloway Field.jpg'),
        'Rice Stadium': require('@/assets/images/maps/Rice Stadium.jpg'),
        'Reckling Park': require('@/assets/images/maps/Reckling Park.jpg'),
        'Tudor Fieldhouse': require('@/assets/images/maps/Tudor Fieldhouse.jpg'),
    };


    // Descriptions / notes for each location (rendered when dropdown is open)
    const DESCRIPTION_MAP: Record<string, string> = {
        'Baker Institute':
            `Additional Notes:
    Baker Institute AED is located on the first floor of the North Lobby in the northeast corner next to the wheelchair-accessible door.
    SE Staff location may vary based on the type of event that is hosted by the Baker Institute.\nContact the Event Coordinator for specific locations.`,

        'George R. Brown Tennis Center':
            `Additional Notes:
    George R. Brown Tennis Center AED is located near the rightmost exit of the building.
    In the case an ambulance is needed, they can arrive through entrances 17 or 18.
    For entrance 17, the stretcher can enter through the entrance and use the ramp on the right to get to the tennis courts.
    For entrance 18, the stretcher can enter through the side gates (circled in red) located at the end of the tennis center next to Entrance 18 Dr.
    If a private room is needed, SE staff can go inside the George R. Brown Tennis Center building.`,

        'Ley Track & Holloway Field':
            `Additional Notes:
    An AED is present at the Ley Track & Holloway Field, however it is not maintained by REMS.
    During the event, an ambulance should be on standby inside Entrance 5 for pole vault.
    Ambulance Response: EMS should guide the ambulance crew whether it would be closer to enter from the Main Street, Tudor Fieldhouse/Lot 6, etc.
    If a private room is needed, SE staff can utilize Meeting Room 1, which is located on the leftmost end of the tack building.
    Code: 2431`,

        'Rice Stadium':
            `Additional Notes:
    Rice Stadium AED is located on the lower concourse, underneath the R Room (the South end zone), next to the Women’s Restroom.
    SE staff standby locations will vary depending on the event; refer to the event plans for specific locations.`,

        'Reckling Park':
            `Additional Notes:
    No AED is present at Reckling Park.
    If a private room is needed, concourse room “Business Center 141” can be used, located right across the concession stand.
    New Protocol: If it’s anticipated to be 80F or higher during any time of the game, SE staff need to (1) check out the Reckling Key from KeyTrax to be able to access room 141 and (2) bring a COT chair to store in room 141 during the game. (3) All items should be returned to RUPD post-game.
    Reckling Park has three elevators: accessible elevator to concourse level, accessible elevator to grandstand level, and accessible elevator to luxury boxes and press box.
    Reckling Park has multiple restrooms throughout the concourse, with an additional all-gender restroom right behind the SE staff standby location.`,

        'Tudor Fieldhouse':
            `Additional Notes:
    Tudor Fieldhouse AED is located in the Main Lobby.
    If a private room is needed, SE Staff can utilize the “Storeroom” (Room 1101) located on the 1st floor.
    SE staff standby location may vary based on the event, but for most athletic events (e.g., basketball and volleyball games), the standby location is by the left entrance of Autry Court.`,
    };
    const image = IMAGE_MAP[location];
    const description = DESCRIPTION_MAP[location];


    return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: location }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <ThemedText style={styles.footnoteTitle}>Information</ThemedText>
          <ThemedText style={styles.footnoteText}>
            {description || 'No information available'}
          </ThemedText>
        </ThemedView>
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
  // Copied from college-map-details.tsx
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
