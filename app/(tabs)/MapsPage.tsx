import { TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MapsPage() {
  const building_categories = [
    { id: '1', name: 'Special Buildings', route: '/special-buildings-list' },
    { id: '2', name: 'Residential Colleges', route: '/college-list' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>Building Maps</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {building_categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => router.push(category.route as any)}
          >
            <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            <IconSymbol size={20} name="chevron.right" color="#999" />
          </TouchableOpacity>
        ))}
      </ThemedView>
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
    paddingTop: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryName: {
    fontSize: 17,
  },
});