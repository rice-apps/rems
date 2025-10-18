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
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomePage() {
    const theme = (useColorScheme() ?? 'light') as 'light' | 'dark';

    const leftBar = require('@/assets/images/LeftBar.png');
    const downArrow = require('@/assets/images/DownArrow.png');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [listOpen, setListOpen] = useState(false);
    const [selectedListValue, setSelectedListValue] = useState<string | null>(null);

    // The list values the user asked to show
    const listValues = ['Option A', 'Option B', 'Option C', 'Option D'];

    const panelWidth = Math.min(320, Math.round(Dimensions.get('window').width * 0.8));
    const translateX = useRef(new Animated.Value(-panelWidth)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: sidebarOpen ? 0 : -panelWidth,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [sidebarOpen, panelWidth, translateX]);

    const handleSideBarPress = () => setSidebarOpen(true);

    // Toggle the dropdown list
    const handleListOopen = () => setListOpen((v) => !v);

    const handleSelectListValue = (v: string) => {
        setSelectedListValue(v);
        setListOpen(false);
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.topRow}>
                <Pressable style={styles.menuButton} onPress={handleSideBarPress}>
                    <Image source={leftBar} style={[styles.menuIcon, { tintColor: Colors[theme].icon }]} />
                </Pressable>
                <Pressable onPress={() => Alert.alert('Log in')}>
                    <ThemedText type="defaultSemiBold">Log in</ThemedText>
                </Pressable>
            </View>

            <View style={styles.avatarPlaceholder} />

            <View style={styles.searchContainer}>
                <Pressable style={styles.searchInner}>
                    <ThemedText style={styles.searchText}>{selectedListValue ?? 'Type anything to search'}</ThemedText>
                </Pressable>
            </View>

            {/* Dropdown list shown when listOpen is true */}


            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold">Recommended search</ThemedText>
                    <Pressable>
                        <ThemedText type="link">See more</ThemedText>
                    </Pressable>
                </View>

                <View style={styles.cardContent}>
                    {['Airway & breathing', 'Cardiac', 'Medical (seizure, hypoglycemia)', 'Trauma'].map((label) => (
                        <View key={label} style={styles.itemRow}>
                            <View style={styles.itemIcon} />
                            <ThemedText>{label}</ThemedText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Sidebar overlay/backdrop */}
            {sidebarOpen && <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>}

            <Animated.View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={[styles.sidebar, { width: panelWidth, transform: [{ translateX }] }]}>
                <View style={styles.sidebarContent}>
                    <View style={styles.row}>
                        <ThemedText type="title">Menu</ThemedText>
                        <Pressable onPress={handleListOopen} style={styles.searchInner}>
                            <Image source={downArrow} style={[styles.menuIcon, { 
                                tintColor: Colors[theme].icon,
                                transform: [{ rotate: listOpen ? '180deg' : '0deg' }]
                                 }]} />
                        </Pressable>
                    </View>
                    {listOpen && (
                        <View style={[styles.dropdown, { backgroundColor: Colors[theme].background }]}>
                            {listValues.map((v) => (
                                <Pressable key={v} style={styles.dropdownItem} onPress={() => handleSelectListValue(v)}>
                                    <ThemedText>{v}</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </Animated.View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 16,
        backgroundColor: 'white',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    row: {
        flexDirection: 'row',
    },
    menuButton: { padding: 8 },
    menuIcon: { width: 20, height: 20, resizeMode: 'contain' },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#e6e6e6', alignSelf: 'center', marginBottom: 18 },
    searchContainer: { height: 56, borderRadius: 28, backgroundColor: '#efefef', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 8 },
    searchInner: { paddingVertical: 10, paddingLeft: 12 },
    searchText: { color: '#9b9b9b', fontSize: 18 },
    dropdown: { borderRadius: 10, marginHorizontal: 0, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 12, elevation: 2 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 8 },
    card: { backgroundColor: '#f6f6f6', borderRadius: 18, padding: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 6 },
    cardContent: { padding: 6 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    itemIcon: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#dcdcdc' },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
    sidebar: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8, zIndex: 1000 },
    sidebarContent: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
    sidebarListItem: { paddingVertical: 12 },
});
