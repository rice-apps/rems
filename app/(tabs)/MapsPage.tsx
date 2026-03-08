import { View, Text, TouchableOpacity, StyleSheet, Platform, SectionList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRef, useEffect, useState } from 'react';
import { supabase, getStorageUrl, BuildingRow } from '@/lib/supabase';

export default function MapsPage() {
  const listRef = useRef<SectionList>(null);
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('buildings')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setBuildings(data);
        setLoading(false);
      });
  }, []);

  const colleges = buildings.filter((b) => b.type === 'college');
  const specials = buildings.filter((b) => b.type === 'special');

  const sections = [
    { title: 'Residential Colleges', data: colleges, type: 'college' as const },
    { title: 'Special Buildings', data: specials, type: 'special' as const },
  ];

  const scrollToSection = (index: number) => {
    listRef.current?.scrollToLocation({
      sectionIndex: index,
      itemIndex: 0,
      animated: true,
    });
  };

  const handlePress = (name: string, type: 'college' | 'special') => {
    if (type === 'college') {
      router.push({ pathname: '/college-map-details', params: { college: name } });
    } else {
      router.push({ pathname: '/special-maps-details', params: { location: name } });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.headerBrand}>REMS</Text>
              <Text style={styles.headerSubtitle}>Building Maps</Text>
            </View>
            <View style={styles.jumpRow}>
              <TouchableOpacity
                style={styles.jumpChip}
                onPress={() => scrollToSection(0)}
                activeOpacity={0.7}
              >
                <Ionicons name="home" size={16} color={Colors.light.primary} />
                <Text style={styles.jumpChipText}>Colleges</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.jumpChip}
                onPress={() => scrollToSection(1)}
                activeOpacity={0.7}
              >
                <Ionicons name="business" size={16} color={Colors.light.primary} />
                <Text style={styles.jumpChipText}>Special Buildings</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item.name, section.type)}
            activeOpacity={0.7}
          >
            {section.type === 'college' && item.thumbnail_path ? (
              <Image source={{ uri: getStorageUrl(item.thumbnail_path) }} style={styles.collegeImage} />
            ) : (
              <View style={styles.iconBox}>
                <Ionicons name="business" size={20} color={Colors.light.primary} />
              </View>
            )}
            <Text style={styles.cardName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: 20,
  },
  headerBrand: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  jumpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  jumpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  jumpChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
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
    marginBottom: 8,
  },
  collegeImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});
