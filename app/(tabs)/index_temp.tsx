import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const isIOS = Platform.OS === "ios";

export default function HomePage() {
  const theme = (useColorScheme() ?? "light") as "light" | "dark";

  const leftBar = require("@/assets/images/LeftBar.png");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [selectedListValue, setSelectedListValue] = useState<string | null>(
    null
  );

  // Values to show in dropdown
  const listValues = [
    "Airway & breathing",
    "Cardiac",
    "Medical (seizure, hypoglycemia)",
    "Trauma",
  ];

  const panelWidth = Math.min(
    360,
    Math.round(Dimensions.get("window").width * 0.78)
  );
  const translateX = useRef(new Animated.Value(-panelWidth)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const listItems = [
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "Option F",
    "Option G",
    "Option H",
    "Option I",
    "Option J",
    "Option K",
    "Option L",
    "Option M",
    "Option N",
    "Option O",
    "Option P",
  ];

  // animation values for each dropdown item (initialized after listItems is defined)
  const itemTranslate = useRef(
    listItems.map(() => new Animated.Value(40))
  ).current;
  const itemOpacity = useRef(
    listItems.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: sidebarOpen ? 0 : -panelWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, panelWidth, translateX]);

  const handleSideBarPress = () => setSidebarOpen(true);

  const handleListOpen = () => {
    Animated.timing(translateY, {
      toValue: listOpen ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setListOpen(!listOpen);
  };

  const handleSelectListValue = (v: string) => {
    setSelectedListValue(v);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setListOpen(false);
  };

  React.useEffect(() => {
    if (listOpen) {
      itemTranslate.forEach((t) => t.setValue(40));
      itemOpacity.forEach((o) => o.setValue(0));

      const anims = itemTranslate.map((t, i) =>
        Animated.parallel([
          Animated.timing(t, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(itemOpacity[i], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.stagger(20, anims).start();
    } else {
      const anims = itemTranslate.map((t, i) =>
        Animated.parallel([
          Animated.timing(t, {
            toValue: 40,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(itemOpacity[i], {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ])
      );
      Animated.stagger(20, anims.reverse()).start();
    }
  }, [listOpen, itemTranslate, itemOpacity]);

  // small square icon used at left of search
  const SearchLogo = () => (
    <View style={[styles.searchLogo, { backgroundColor: Colors[theme].tint }]}>
      <ThemedText style={styles.searchLogoText}>R</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Hide these when listOpen */}
      {!listOpen && (
        <>
          <View style={styles.topRow}>
            <Pressable onPress={handleSideBarPress} style={styles.menuButton}>
              <Image
                source={leftBar}
                style={[styles.menuIcon, { tintColor: Colors[theme].icon }]}
              />
            </Pressable>
            <Pressable onPress={() => Alert.alert("Log in")}>
              <ThemedText type="defaultSemiBold">Log in</ThemedText>
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title}>
              REMS
            </ThemedText>
          </View>
        </>
      )}

      {/* Search bar - positioned absolutely when listOpen */}
      <Animated.View
        style={[
          styles.searchContainerAbsolute,
          { transform: [{ translateY }] },
        ]}
      >
        <Pressable
          onPress={handleListOpen}
          style={[
            styles.searchContainer,
            isIOS ? styles.searchContainerIOS : null,
          ]}
        >
          <SearchLogo />
          <ThemedText style={styles.searchText}>
            {selectedListValue ?? "Type anything to search"}
          </ThemedText>
        </Pressable>
      </Animated.View>

      {/* Hide card when listOpen */}
      {!listOpen && (
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
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: Colors[theme].tint },
                  ]}
                >
                  <View style={styles.iconInner} />
                </View>
                <ThemedText style={styles.cardLabel}>{label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Dropdown under search — full screen when open so items can extend/scroll to bottom */}
      {listOpen && (
        <View
          style={[
            styles.fullscreenDropdown,
            { backgroundColor: "transparent" },
          ]}
        >
          <View style={styles.dropdownScroll}>
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
                  <ThemedText style={styles.dropdownText}>{v}</ThemedText>
                </Pressable>
                {index < array.length - 1 && <View style={styles.separator} />}
              </Animated.View>
            ))}
            <View style={{ height: 40 }} />
          </View>
        </View>
      )}

      {/* Sidebar overlay/backdrop */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={[
          styles.sidebar,
          { width: panelWidth, transform: [{ translateX }] },
        ]}
      >
        <View style={styles.sidebarContent}>
          <ThemedText type="title">Menu</ThemedText>
        </View>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 42, paddingHorizontal: 20 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  menuButton: { padding: 8 },
  menuIcon: { width: 22, height: 22, resizeMode: "contain" },
  titleRow: { alignItems: "center", marginBottom: 18 },
  title: {
    paddingTop: 20,
    fontSize: 48,
    letterSpacing: 2,
    color: Colors.light.tint,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ececec",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchContainerAbsolute: {
    position: "absolute",
    backgroundColor: "transparent",
    top: 170,
    left: 20,
    right: 20,
    zIndex: 100,
    // remove bottom margin so dropdown can sit flush under the search bar
    marginBottom: 0,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  dropdownText: { fontSize: 20, color: "#333" },
  searchContainerIOS: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  searchLogo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchLogoText: { color: "white", fontWeight: "700" },
  searchInner: { flex: 1 },
  searchText: { color: "#777", fontSize: 16 },
  card: {
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    padding: 14,
    marginTop: 80,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardContent: { paddingVertical: 6 },
  cardRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconInner: {
    width: 22,
    height: 22,
    backgroundColor: "white",
    borderRadius: 4,
  },
  cardLabel: { fontSize: 16, color: "#333" },
  dropdown: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 120,
    borderRadius: 10,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: { paddingVertical: 13, paddingHorizontal: 8 },
  fullscreenDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 136,
    bottom: 0,
    zIndex: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  dropdownScroll: { flexGrow: 1, padding: 0 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "white",
    zIndex: 1000,
  },
  sidebarContent: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  sidebarListItem: { paddingVertical: 12 },
});



//   [
//     "node_3",
//     {
//       "id": "node_3",
//       "text": "_____________________________________",
//       "source": "clinical-guidelines.html",
//       "nodeIndex": 3,
//       "xpath": "/html/body/p[5]",
//       "tagName": "p",
//       "bookmark": null
//     }
//   ],