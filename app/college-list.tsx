import { Image } from 'expo-image';
import { TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

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

export default function MapsPage() {
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

  const handleLocationPress = (item: { id: string; name: string }) => {
      router.push({
          pathname: '/college-map-details',
          params: { college: item.name }
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>College Maps</ThemedText>
      </ThemedView>

      <FlatList
        data={colleges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.collegeItem}
            onPress={() => handleLocationPress(item)}
          >
            <Image
              source={COLLEGE_IMAGES[item.name]}
              style={styles.collegeImage}
            />
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
  collegeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',  // or use ThemedView background
  },
  collegeImage: {
    width: 50,
    height: 50,
    marginRight: 16,
    resizeMode: 'contain',
  },
  collegeName: {
    flex: 1,
    fontSize: 17,
  },
});