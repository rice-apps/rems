import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Image,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Alert,
    Platform,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const isIOS = Platform.OS === 'ios';

export default function HomePage() {
    const theme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const leftBar = require('@/assets/images/LeftBar.png');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [selectedListValue, setSelectedListValue] = useState<string | null>(null);

    // Values to show in dropdown
    const listValues = ['Airway & breathing', 'Cardiac', 'Medical (seizure, hypoglycemia)', 'Trauma'];

    const panelWidth = Math.min(360, Math.round(Dimensions.get('window').width * 0.78));
    const translateX = useRef(new Animated.Value(-panelWidth)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: sidebarOpen ? 0 : -panelWidth,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [sidebarOpen, panelWidth, translateX]);

    const handleSideBarPress = () => setSidebarOpen(true);
    const handleListOopen = () => setListOpen((v) => !v);
    const handleSelectListValue = (v: string) => {
        setSelectedListValue(v);
        setListOpen(false);
    };

    // small square icon used at left of search
    const SearchLogo = () => (
        <View style={[styles.searchLogo, { backgroundColor: Colors[theme].tint }]}> 
            <ThemedText style={styles.searchLogoText}>R</ThemedText>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.topRow}>
                <Pressable onPress={handleSideBarPress} style={styles.menuButton}>
                    <Image source={leftBar} style={[styles.menuIcon, { tintColor: Colors[theme].icon }]} />
                </Pressable>
                <Pressable onPress={() => Alert.alert('Log in')}>
                    <ThemedText type="defaultSemiBold">Log in</ThemedText>
                </Pressable>
            </View>

            <View style={styles.titleRow}>
                <ThemedText type="title" style={styles.title}>REMS</ThemedText>
            </View>

            <Pressable onPress={handleListOopen} style={[styles.searchContainer, isIOS ? styles.searchContainerIOS : null]}>
                <SearchLogo />
                <ThemedText style={styles.searchText}>{selectedListValue ?? 'Type anything to search'}</ThemedText>
            </Pressable>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold">Recommended search</ThemedText>
                    <Pressable>
                        <ThemedText type="link">See more</ThemedText>
                    </Pressable>
                </View>

                <View style={styles.cardContent}>
                    {listValues.map((label) => (
                        <View key={label} style={styles.cardRow}>
                            <View style={[styles.iconBox, { backgroundColor: Colors[theme].tint }]}> 
                                <View style={styles.iconInner} />
                            </View>
                            <ThemedText style={styles.cardLabel}>{label}</ThemedText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Dropdown under search (overlay-style) */}
            {listOpen && (
                <View style={[styles.dropdown, { backgroundColor: Colors[theme].background }]}> 
                    {['Option A', 'Option B', 'Option C'].map((v) => (
                        <Pressable key={v} style={styles.dropdownItem} onPress={() => handleSelectListValue(v)}>
                            <ThemedText>{v}</ThemedText>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Sidebar overlay/backdrop */}
            {sidebarOpen && (
                <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}

            <Animated.View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={[styles.sidebar, { width: panelWidth, transform: [{ translateX }] }]}>
                <View style={styles.sidebarContent}>
                    <ThemedText type="title">Menu</ThemedText>
                </View>
            </Animated.View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 42, paddingHorizontal: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    menuButton: { padding: 8 },
    menuIcon: { width: 22, height: 22, resizeMode: 'contain' },
    titleRow: { alignItems: 'center', marginBottom: 18 },
    title: { paddingTop: 20, fontSize: 48, letterSpacing: 2, color: Colors.light.tint, fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ececec',
        borderRadius: 28,
        height: 56,
        paddingHorizontal: 14,
        marginBottom: 14,
    },
    searchContainerIOS: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    searchLogo: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    searchLogoText: { color: 'white', fontWeight: '700' },
    searchInner: { flex: 1 },
    searchText: { color: '#777', fontSize: 16 },
    card: { backgroundColor: '#f3f3f3', borderRadius: 18, padding: 14, marginTop: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardContent: { paddingVertical: 6 },
    cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    iconBox: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    iconInner: { width: 22, height: 22, backgroundColor: 'white', borderRadius: 4 },
    cardLabel: { fontSize: 16, color: '#333' },
    dropdown: { position: 'absolute', left: 20, right: 20, top: 170, borderRadius: 10, padding: 8, elevation: 4 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 8 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
    sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'white', zIndex: 1000 },
    sidebarContent: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
    sidebarListItem: { paddingVertical: 12 },
});

