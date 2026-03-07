import { Image } from 'expo-image';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLLEGE_IMAGES: Record<string, any> = {
  'Baker College': require('@/assets/images/baker-college.png'),
  'Brown College': require('@/assets/images/brown-college.png'),
  'Duncan College': require('@/assets/images/duncan-college.png'),
  'Hanszen College': require('@/assets/images/hanszen-college.png'),
  'Jones College': require('@/assets/images/jones-college.png'),
  'Lovett College': require('@/assets/images/lovett-college.png'),
  'Martel College': require('@/assets/images/martel-college.png'),
  'McMurtry College': require('@/assets/images/murt-college.png'),
  'Sid Richardson College': require('@/assets/images/sid-college.png'),
  'Wiess College': require('@/assets/images/wiess-college.png'),
  'Will Rice College': require('@/assets/images/wrc-college.png'),
};

const colleges = [
  { id: '7', name: 'Baker College' },
  { id: '8', name: 'Brown College' },
  { id: '9', name: 'Duncan College' },
  { id: '10', name: 'Hanszen College' },
  { id: '11', name: 'Jones College' },
  { id: '12', name: 'Lovett College' },
  { id: '13', name: 'Martel College' },
  { id: '14', name: 'McMurtry College' },
  { id: '15', name: 'Sid Richardson College' },
  { id: '16', name: 'Wiess College' },
  { id: '17', name: 'Will Rice College' },
];

export default function CollegeListScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Residential Colleges' }} />
      <FlatList
        data={colleges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/college-map-details',
                params: { college: item.name },
              })
            }
            activeOpacity={0.7}
          >
            <Image source={COLLEGE_IMAGES[item.name]} style={styles.collegeImage} />
            <Text style={styles.collegeName}>{item.name}</Text>
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
  collegeImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 14,
  },
  collegeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
