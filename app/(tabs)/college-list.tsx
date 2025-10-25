import { TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CollegesScreen() {
  const colleges = [
    { id: '1', name: 'Baker College' },
    { id: '2', name: 'Brown College' },
    { id: '3', name: 'Duncan College' },
    { id: '4', name: 'Hanszen College' },
    { id: '5', name: 'Jones College' },
    { id: '6', name: 'Lovett College' },
    { id: '7', name: 'Martel College' },
    { id: '8', name: 'McMurtry College' },
    { id: '9', name: 'Sid Richardson College' },
    { id: '10', name: 'Wiess College' },
    { id: '11', name: 'Will Rice College' },
  ];

  const handleCollegePress = (collegeName: string) => {
    router.push({
      pathname: '/college-map-details',
      params: { college: collegeName }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Residential Colleges</ThemedText>
        
        <ThemedText style={styles.aboutTitle}>About</ThemedText>
        <ThemedText style={styles.aboutText}>
          Room numbers are denoted by white text inside black boxes.{'\n'}
          {/* {'\n'} */}
          Stairwells are marked by the <Image source={require('@/assets/images/stairwell.jpg')} style={styles.stairwellIcon} /> icon.{'\n'}
          {/* {'\n'} */}
          Elevators and construction hazards are shown above the map image.{'\n'}
          {/* {'\n'} */}
          Miscellaneous notes are shown below the map image.{'\n'}
          {/* {'\n'} */}
          MH stands for Magister's House.
        </ThemedText>
      </ThemedView>

      <FlatList
        data={colleges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.collegeItem}
            onPress={() => handleCollegePress(item.name)}
          >
            <ThemedText style={styles.collegeName}>{item.name}</ThemedText>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingTop: 20,
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
  stairwellIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  collegeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  collegeName: {
    fontSize: 17,
  },
});