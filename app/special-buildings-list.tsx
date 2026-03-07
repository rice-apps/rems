import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const locations = [
  { id: '1', name: 'Baker Institute' },
  { id: '2', name: 'George R. Brown Tennis Center' },
  { id: '3', name: 'Ley Track & Holloway Field' },
  { id: '4', name: 'Rice Stadium' },
  { id: '5', name: 'Reckling Park' },
  { id: '6', name: 'Tudor Fieldhouse' },
];

export default function SpecialBuildingsListScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Special Buildings' }} />
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/special-maps-details',
                params: { location: item.name },
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="business" size={20} color={Colors.light.primary} />
            </View>
            <Text style={styles.locationName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    paddingRight: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
