import { Image } from 'expo-image';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase, getStorageUrl, BuildingRow } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function CollegeListScreen() {
  const [colleges, setColleges] = useState<BuildingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('buildings')
      .select('*')
      .eq('type', 'college')
      .order('sort_order')
      .then(({ data }) => {
        if (data) setColleges(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Residential Colleges' }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Residential Colleges' }} />
      <FlatList
        data={colleges}
        keyExtractor={(item) => String(item.id)}
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
            {item.thumbnail_path ? (
              <Image source={{ uri: getStorageUrl(item.thumbnail_path) }} style={styles.collegeImage} />
            ) : (
              <View style={styles.collegeImage} />
            )}
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
