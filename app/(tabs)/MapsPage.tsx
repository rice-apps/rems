import { View, Text, TouchableOpacity, StyleSheet, Platform, SectionList } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRef } from 'react';

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

const sections = [
  {
    title: 'Residential Colleges',
    data: [
      'Baker College', 'Brown College', 'Duncan College', 'Hanszen College',
      'Jones College', 'Lovett College', 'Martel College', 'McMurtry College',
      'Sid Richardson College', 'Wiess College', 'Will Rice College',
    ],
    type: 'college' as const,
  },
  {
    title: 'Special Buildings',
    data: [
      'Baker Institute', 'George R. Brown Tennis Center',
      'Ley Track & Holloway Field', 'Rice Stadium',
      'Reckling Park', 'Tudor Fieldhouse',
    ],
    type: 'special' as const,
  },
];

export default function MapsPage() {
  const listRef = useRef<SectionList>(null);

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

  return (
    <View style={styles.container}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item}
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
            onPress={() => handlePress(item, section.type)}
            activeOpacity={0.7}
          >
            {section.type === 'college' ? (
              <Image source={COLLEGE_IMAGES[item]} style={styles.collegeImage} />
            ) : (
              <View style={styles.iconBox}>
                <Ionicons name="business" size={20} color={Colors.light.primary} />
              </View>
            )}
            <Text style={styles.cardName}>{item}</Text>
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
