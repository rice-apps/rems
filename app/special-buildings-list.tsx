import { TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MapsPage() {
  const special_locations = [
    { id: '1', name: 'Baker Institute'},
    { id: '2', name: 'George R. Brown Tennis Center'},
    { id: '3', name: 'Ley Track & Holloway Field'},
    { id: '4', name: 'Rice Stadium'},
    { id: '5', name: 'Reckling Park'},
    { id: '6', name: 'Tudor Fieldhouse'},
  ];
  const colleges = [
    { id: '7', name: 'Baker College'},
    { id: '8', name: 'Brown College'},
    { id: '9', name: 'Duncan College'},
    { id: '10', name: 'Hanszen College'},
    { id: '11', name: 'Jones College'},
    { id: '12', name: 'Lovett College'},
    { id: '13', name: 'Martel College'},
    { id: '14', name: 'McMurtry College'},
    { id: '15', name: 'Sid Richardson College'},
    { id: '16', name: 'Wiess College'},
    { id: '17', name: 'Will Rice College'},
  ];

  const locations = [...special_locations, ...colleges];

  const handleLocationPress = (item: { id: string; name: string }) => {
    if (parseInt(item.id) <= 6) {
        router.push({
            pathname: '/special-maps-details',
            params: { location: item.name }
        });
    } else {
        router.push({
            pathname: '/college-map-details',
            params: { college: item.name }
        });
    }
    
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Special Building Maps</ThemedText>
      </ThemedView>

      <FlatList
        data={special_locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.locationItem}
            onPress={() => handleLocationPress(item)}
          >
            <ThemedText style={styles.locationName}>{item.name}</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#999" />
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingTop: 10,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationName: {
    fontSize: 17,
  },
});