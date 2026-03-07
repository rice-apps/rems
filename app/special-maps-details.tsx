import { Image } from 'expo-image';
import { View, Text, ScrollView, StyleSheet, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState } from 'react';

export default function SpecialMapsDetailScreen() {
  const { location } = useLocalSearchParams<{ location: string }>();
  const [zoomed, setZoomed] = useState(false);

  const IMAGE_MAP: Record<string, any> = {
    'Baker Institute': require('@/assets/images/maps/Baker-Institute.jpg'),
    'George R. Brown Tennis Center': require('@/assets/images/maps/George-R-Brown-Tennis-Center.jpg'),
    'Ley Track & Holloway Field': require('@/assets/images/maps/Ley-Track-and-Holloway-Field.jpg'),
    'Rice Stadium': require('@/assets/images/maps/Rice-Stadium.jpg'),
    'Reckling Park': require('@/assets/images/maps/Reckling-Park.jpg'),
    'Tudor Fieldhouse': require('@/assets/images/maps/Tudor-Fieldhouse.jpg'),
  };

  const DESCRIPTION_MAP: Record<string, string> = {
    'Baker Institute':
      'AED is located on the first floor of the North Lobby in the northeast corner next to the wheelchair-accessible door.\n\nSE Staff location may vary based on the type of event. Contact the Event Coordinator for specific locations.',
    'George R. Brown Tennis Center':
      'AED is located near the rightmost exit of the building.\n\nAmbulance access through entrances 17 or 18.\nFor entrance 17, use the ramp on the right to get to the tennis courts.\nFor entrance 18, use the side gates at the end of the tennis center.\n\nPrivate room available inside the building.',
    'Ley Track & Holloway Field':
      'An AED is present but not maintained by REMS.\n\nDuring events, an ambulance should be on standby inside Entrance 5 for pole vault.\nEMS should guide the ambulance crew to the closest entrance.\n\nPrivate room: Meeting Room 1, leftmost end of the track building.\nCode: 2431',
    'Rice Stadium':
      'AED is on the lower concourse, underneath the R Room (South end zone), next to the Women\'s Restroom.\n\nSE staff standby locations vary by event; refer to event plans.',
    'Reckling Park':
      'No AED present.\n\nPrivate room: "Business Center 141" across from the concession stand.\n\nIf 80F or higher anticipated: (1) check out Reckling Key from KeyTrax, (2) bring a COT chair to room 141, (3) return all items to RUPD post-game.\n\nThree elevators: concourse level, grandstand level, luxury boxes/press box.\nAll-gender restroom behind SE staff standby location.',
    'Tudor Fieldhouse':
      'AED is in the Main Lobby.\n\nPrivate room: "Storeroom" (Room 1101) on the 1st floor.\n\nFor most athletic events, standby location is by the left entrance of Autry Court.',
  };

  const image = IMAGE_MAP[location];
  const description = DESCRIPTION_MAP[location];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: location }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {image && (
          <Pressable onPress={() => setZoomed(true)}>
            <Image source={image} style={styles.mapImage} contentFit="contain" />
            <Text style={styles.tapHint}>Tap to zoom</Text>
          </Pressable>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Information</Text>
          <Text style={styles.infoText}>{description || 'No information available'}</Text>
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
