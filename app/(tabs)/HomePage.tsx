import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    ScrollView,
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
    const listValues = [
        { label: 'Airway & breathing', icon: '🫁', color: '#FF6B6B' },
        { label: 'Cardiac', icon: '❤️', color: '#4ECDC4' },
        { label: 'Medical (seizure, hypoglycemia)', icon: '⚕️', color: '#95E1D3' },
        { label: 'Trauma', icon: '🩹', color: '#FFE66D' }
    ];

    const panelWidth = Math.min(360, Math.round(Dimensions.get('window').width * 0.78));
    const translateX = useRef(new Animated.Value(-panelWidth)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const listItems = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F', 'Option G', 'Option H', 'Option I', 'Option J', 'Option K', 'Option L', 'Option M', 'Option N', 'Option O', 'Option P'];

    // animation values for each dropdown item
    const itemTranslate = useRef(listItems.map(() => new Animated.Value(40))).current;
    const itemOpacity = useRef(listItems.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: sidebarOpen ? 0 : -panelWidth,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [sidebarOpen, panelWidth, translateX]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: listOpen ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [listOpen, fadeAnim]);

    const handleSideBarPress = () => setSidebarOpen(true);

    const handleListOpen = () => {
        Animated.timing(translateY, {
            toValue: listOpen ? 0 : -100,
            duration: 300,
            useNativeDriver: true
        }).start();
        setListOpen(!listOpen);
    };

    const handleSelectListValue = (v: string) => {
        setSelectedListValue(v);
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start();
        setListOpen(false);
    };

    React.useEffect(() => {
        if (listOpen) {
            itemTranslate.forEach((t) => t.setValue(40));
            itemOpacity.forEach((o) => o.setValue(0));

            const anims = itemTranslate.map((t, i) =>
                Animated.parallel([
                    Animated.timing(t, { toValue: 0, duration: 320, useNativeDriver: true }),
                    Animated.timing(itemOpacity[i], { toValue: 1, duration: 300, useNativeDriver: true }),
                ])
            );

            Animated.stagger(20, anims).start();
        } else {
            const anims = itemTranslate.map((t, i) =>
                Animated.parallel([
                    Animated.timing(t, { toValue: 40, duration: 180, useNativeDriver: true }),
                    Animated.timing(itemOpacity[i], { toValue: 0, duration: 180, useNativeDriver: true }),
                ])
            );
            Animated.stagger(20, anims.reverse()).start();
        }
    }, [listOpen, itemTranslate, itemOpacity]);

    // Enhanced REMS logo component
    const REMSLogo = () => (
        <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
                <ThemedText style={styles.logoText}>R</ThemedText>
            </View>
            <ThemedText style={styles.logoTitle}>REMS</ThemedText>
        </View>
    );

    // Enhanced search icon
    const SearchIcon = () => (
        <View style={[styles.searchLogo, { backgroundColor: Colors[theme].tint }]}>
            <ThemedText style={styles.searchLogoText}>🔍</ThemedText>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            {/* Header with gradient background */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.headerContainer}>
                    <View style={styles.topRow}>
                        <Pressable onPress={handleSideBarPress} style={styles.menuButton}>
                            <Image source={leftBar} style={[styles.menuIcon, { tintColor: Colors[theme].icon }]} />
                        </Pressable>
                        <Pressable onPress={() => Alert.alert('Log in')} style={styles.loginButton}>
                            <ThemedText type="defaultSemiBold" style={styles.loginText}>Log in</ThemedText>
                        </Pressable>
                    </View>

                    <View style={styles.titleRow}>
                        <REMSLogo />
                        <ThemedText style={styles.subtitle}>Emergency Medical Services</ThemedText>
                    </View>
                </View>
            </Animated.View>

            {/* Search bar with enhanced styling */}
            <Animated.View
                style={[
                    styles.searchContainerAbsolute,
                    { transform: [{ translateY }] }
                ]}
            >
                <Pressable onPress={handleListOpen} style={[styles.searchContainer, isIOS ? styles.searchContainerIOS : styles.searchContainerAndroid]}>
                    <SearchIcon />
                    <ThemedText style={styles.searchText}>
                        {selectedListValue ?? 'Search procedures, protocols...'}
                    </ThemedText>
                    <View style={styles.searchIconRight}>
                        <ThemedText style={styles.searchArrow}>{listOpen ? '✕' : '⌃'}</ThemedText>
                    </View>
                </Pressable>
            </Animated.View>

            {/* Enhanced card with better visual design */}
            {!listOpen && (
                <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim }]}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View>
                                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Quick Access</ThemedText>
                                <ThemedText style={styles.cardSubtitle}>Common emergency procedures</ThemedText>
                            </View>
                            <Pressable style={styles.seeMoreButton}>
                                <ThemedText type="link" style={styles.seeMoreText}>See all →</ThemedText>
                            </Pressable>
                        </View>

                        <View style={styles.cardContent}>
                            {listValues.map((item, index) => (
                                <Pressable 
                                    key={item.label} 
                                    style={[
                                        styles.cardRow,
                                        index === listValues.length - 1 && styles.cardRowLast
                                    ]}
                                    onPress={() => handleSelectListValue(item.label)}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                        <ThemedText style={styles.iconEmoji}>{item.icon}</ThemedText>
                                    </View>
                                    <View style={styles.cardTextContainer}>
                                        <ThemedText style={styles.cardLabel}>{item.label}</ThemedText>
                                        <ThemedText style={styles.cardDescription}>Quick reference guide</ThemedText>
                                    </View>
                                    <ThemedText style={styles.cardArrow}>›</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Additional info card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoIconContainer}>
                            <ThemedText style={styles.infoIcon}>💡</ThemedText>
                        </View>
                        <View style={styles.infoTextContainer}>
                            <ThemedText style={styles.infoTitle}>Pro Tip</ThemedText>
                            <ThemedText style={styles.infoText}>
                                Use the search bar to quickly find any protocol or procedure
                            </ThemedText>
                        </View>
                    </View>
                </Animated.View>
            )}

            {/* Dropdown with improved styling */}
            {listOpen && (
                <View style={[styles.fullscreenDropdown, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }]}>
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.dropdownHeader}>
                            <ThemedText style={styles.dropdownHeaderText}>Search Results</ThemedText>
                        </View>
                        {listItems.slice(0, 14).map((v, index, array) => (
                            <Animated.View
                                key={v}
                                style={{
                                    transform: [{ translateY: itemTranslate[index] }],
                                    opacity: itemOpacity[index],
                                }}
                            >
                                <Pressable 
                                    style={styles.dropdownItem} 
                                    onPress={() => handleSelectListValue(v)}
                                >
                                    <View style={styles.dropdownIconContainer}>
                                        <ThemedText style={styles.dropdownIcon}>📄</ThemedText>
                                    </View>
                                    <ThemedText style={styles.dropdownText}>{v}</ThemedText>
                                    <ThemedText style={styles.dropdownArrow}>›</ThemedText>
                                </Pressable>
                                {index < array.length - 1 && <View style={styles.separator} />}
                            </Animated.View>
                        ))}
                        <View style={{ height: 60 }} />
                    </ScrollView>
                </View>
            )}

            {/* Sidebar overlay/backdrop */}
            {sidebarOpen && (
                <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
            )}

            {/* Enhanced Sidebar */}
            <Animated.View 
                pointerEvents={sidebarOpen ? 'auto' : 'none'} 
                style={[
                    styles.sidebar, 
                    { 
                        width: panelWidth, 
                        transform: [{ translateX }],
                        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
                    }
                ]}
            >
                <View style={styles.sidebarContent}>
                    <View style={styles.sidebarHeader}>
                        <REMSLogo />
                        <Pressable onPress={() => setSidebarOpen(false)} style={styles.closeButton}>
                            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                        </Pressable>
                    </View>
                    
                    <View style={styles.sidebarMenu}>
                        <Pressable style={styles.sidebarMenuItem}>
                            <ThemedText style={styles.sidebarMenuIcon}>🏠</ThemedText>
                            <ThemedText style={styles.sidebarMenuText}>Home</ThemedText>
                        </Pressable>
                        <Pressable style={styles.sidebarMenuItem}>
                            <ThemedText style={styles.sidebarMenuIcon}>🔍</ThemedText>
                            <ThemedText style={styles.sidebarMenuText}>Explore</ThemedText>
                        </Pressable>
                        <Pressable style={styles.sidebarMenuItem}>
                            <ThemedText style={styles.sidebarMenuIcon}>🗺️</ThemedText>
                            <ThemedText style={styles.sidebarMenuText}>Maps</ThemedText>
                        </Pressable>
                        <Pressable style={styles.sidebarMenuItem}>
                            <ThemedText style={styles.sidebarMenuIcon}>⭐</ThemedText>
                            <ThemedText style={styles.sidebarMenuText}>Favorites</ThemedText>
                        </Pressable>
                        <Pressable style={styles.sidebarMenuItem}>
                            <ThemedText style={styles.sidebarMenuIcon}>⚙️</ThemedText>
                            <ThemedText style={styles.sidebarMenuText}>Settings</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingTop: 42, 
        paddingHorizontal: 20
    },
    headerContainer: {
        marginBottom: 20,
    },
    topRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
    },
    menuButton: { 
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    menuIcon: { 
        width: 22, 
        height: 22, 
        resizeMode: 'contain' 
    },
    loginButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#0a7ea4',
    },
    loginText: {
        color: '#ffffff',
        fontSize: 14,
    },
    titleRow: { 
        alignItems: 'center', 
        marginBottom: 18 
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0a7ea4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
    },
    logoTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: '#0a7ea4',
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        height: 60,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchContainerAbsolute: {
        position: 'absolute',
        backgroundColor: "transparent",
        top: 190,
        left: 20,
        right: 20,
        zIndex: 100,
        marginBottom: 0,
    },
    searchContainerIOS: { 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 12, 
        shadowOffset: { width: 0, height: 4 } 
    },
    searchContainerAndroid: {
        elevation: 4,
    },
    searchLogo: { 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12,
        backgroundColor: '#0a7ea4',
    },
    searchLogoText: { 
        fontSize: 20,
    },
    searchText: { 
        flex: 1,
        color: '#999', 
        fontSize: 15 
    },
    searchIconRight: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchArrow: {
        fontSize: 16,
        color: '#666',
    },
    cardWrapper: {
        marginTop: 100,
    },
    card: { 
        backgroundColor: '#ffffff', 
        borderRadius: 20, 
        padding: 20,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 20 
    },
    cardTitle: {
        fontSize: 20,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#888',
    },
    seeMoreButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
    },
    seeMoreText: {
        fontSize: 13,
    },
    cardContent: { 
        paddingVertical: 4 
    },
    cardRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    cardRowLast: {
        borderBottomWidth: 0,
    },
    iconBox: { 
        width: 52, 
        height: 52, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 14 
    },
    iconEmoji: {
        fontSize: 24,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardLabel: { 
        fontSize: 16, 
        color: '#333',
        marginBottom: 2,
        fontWeight: '500',
    },
    cardDescription: {
        fontSize: 12,
        color: '#999',
    },
    cardArrow: {
        fontSize: 24,
        color: '#ccc',
        marginLeft: 8,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#f0f9ff',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoIcon: {
        fontSize: 20,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0369a1',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 13,
        color: '#0c4a6e',
        lineHeight: 18,
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginHorizontal: 12,
    },
    fullscreenDropdown: { 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: 156, 
        bottom: 0, 
        zIndex: 200, 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownScroll: { 
        flexGrow: 1, 
        padding: 0 
    },
    dropdownHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownHeaderText: {
        fontSize: 18,
        fontWeight: '600',
    },
    dropdownItem: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16, 
        paddingHorizontal: 20 
    },
    dropdownIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dropdownIcon: {
        fontSize: 18,
    },
    dropdownText: { 
        flex: 1,
        fontSize: 16, 
        color: '#333' 
    },
    dropdownArrow: {
        fontSize: 20,
        color: '#ccc',
    },
    backdrop: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    sidebar: { 
        position: 'absolute', 
        top: 0, 
        bottom: 0, 
        left: 0, 
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    sidebarContent: { 
        flex: 1, 
        paddingTop: 60, 
        paddingHorizontal: 20 
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#666',
    },
    sidebarMenu: {
        gap: 8,
    },
    sidebarMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f9f9f9',
    },
    sidebarMenuIcon: {
        fontSize: 20,
        marginRight: 14,
    },
    sidebarMenuText: {
        fontSize: 16,
        fontWeight: '500',
    },
});