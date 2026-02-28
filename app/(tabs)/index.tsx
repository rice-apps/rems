import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
  Keyboard,
  Image,
  Alert,
} from "react-native";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SemanticSearchEngine } from "../search/semanticSearch";
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  page: number;
  relevance: number;
  section: string;
  text: string;
  title?: string;
}

const CATEGORIES = [
  { label: "Difficulty Breathing", icon: "cloud" as const, query: "difficulty breathing dyspnea respiratory distress" },
  { label: "Altered Mental Status", icon: "alert-circle" as const, query: "altered mental status unconscious confusion" },
  { label: "Chest Pain", icon: "heart" as const, query: "chest pain cardiac ACS STEMI" },
  { label: "Intoxication", icon: "wine" as const, query: "intoxication overdose alcohol substance" },
  { label: "Fractures", icon: "bandage" as const, query: "fracture splint immobilization injury" },
];

export default function HomeScreen() {
  const { session } = useSession();
  const userMeta = session?.user?.user_metadata;
  const fullName: string = userMeta?.full_name || userMeta?.name || "";
  const firstName = fullName.split(" ")[0] || "there";
  const avatarUrl: string | undefined = userMeta?.avatar_url || userMeta?.picture;
  const initial = firstName.charAt(0).toUpperCase();

  const marginTopAnim = useRef(new Animated.Value(150)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEngineReady, setSearchEngineReady] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const searchEngineRef = useRef<SemanticSearchEngine | null>(null);
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Account modal state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [phone, setPhone] = useState(userMeta?.phone || "");
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { phone },
      });
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Saved", "Phone number updated.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save phone number.");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowAccountModal(false);
  };

  const titlePageData: { title: string; page_number: number; bookmark_id: string }[] =
    require("../../assets/dbindex/title_page.json");

  const sortedTitlePageData = [...titlePageData].sort((a, b) => a.page_number - b.page_number);

  const renderBookmark = ({ item }: { item: typeof sortedTitlePageData[0] }) => (
    <View>
      <Text style={styles.resultTitle}>{item.title}</Text>
      <Text>Page {item.page_number}</Text>
    </View>
  );

  useEffect(() => {
    Animated.timing(marginTopAnim, {
      toValue: isFocused ? (Platform.OS === "ios" ? 50 : 20) : 150,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    const initializeSearchEngine = async () => {
      try {
        searchEngineRef.current = new SemanticSearchEngine();
        await searchEngineRef.current.initialize();
        setSearchEngineReady(true);
        console.log("Semantic search engine initialized");
      } catch (error) {
        console.error("Failed to initialize search engine:", error);
      }
    };

    initializeSearchEngine();

    try {
      const bookmarkResults: SearchResult[] = titlePageData.map((item) => ({
        page: item.page_number,
        relevance: 1,
        section: item.title,
        text: "",
        title: item.title,
      }));
      setBookmarks(bookmarkResults);
      setSearchResults(bookmarkResults);
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }, []);

  const updateRecommendations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(bookmarks);
      return;
    }

    if (!searchEngineRef.current) {
      console.warn("Search engine not initialized yet");
      return;
    }

    setIsLoading(true);
    try {
      const semanticResults = await searchEngineRef.current.search(query, 15);

      const formattedResults: SearchResult[] = semanticResults.map(
        (result) => ({
          page: result.metadata.pageNumber || 1,
          relevance: result.score,
          section: result.metadata.title || result.text.substring(0, 100),
          text: result.text,
          title: result.metadata.title,
        })
      );

      setSearchResults(formattedResults);
      setRecommendations(formattedResults);
      setLastSearchQuery(searchQuery.trim());
      setShowResultsModal(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const jumpToPage = (pageNumber: number) => {
    router.replace({
      pathname: "/(tabs)/Search",
      params: {
        page: pageNumber.toString(),
        nonce: Date.now().toString(),
      },
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const isEmptySearch = !searchQuery.trim();

    if (isEmptySearch) {
      return (
        <TouchableOpacity
          style={styles.bookmarkCard}
          onPress={() => {
            setShowSearchModal(false);
            jumpToPage(item.page);
          }}
        >
          <Text style={styles.bookmarkTitle} numberOfLines={1}>
            {item.title || item.section}
          </Text>
          <Text style={styles.bookmarkPage}>Page {item.page} →</Text>
        </TouchableOpacity>
      );
    }

    const isHighRelevance = item.relevance > 0.7;
    const isMediumRelevance = item.relevance > 0.5;

    return (
      <View
        style={[
          styles.resultCard,
          isHighRelevance && styles.resultCardHighRelevance,
          isMediumRelevance && !isHighRelevance && styles.resultCardMediumRelevance,
        ]}
      >
        <View style={styles.resultTitleSection}>
          {item.title ? (
            <Text style={styles.resultTitle} numberOfLines={2}>
              {item.title}
            </Text>
          ) : (
            <Text style={styles.resultSection} numberOfLines={2}>
              {item.section}
            </Text>
          )}
        </View>

        <Text style={styles.resultPreview} numberOfLines={3}>
          {item.text}
        </Text>

        <TouchableOpacity
          style={styles.pageButton}
          onPress={() => {
            setShowSearchModal(false);
            jumpToPage(item.page);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.pageButtonText}>Page {item.page}</Text>
          <Text style={styles.pageButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleCategoryPress = (query: string) => {
    setSearchQuery(query);
    setShowSearchModal(true);
    updateRecommendations(query);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>REMS</Text>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAccountModal(true)} activeOpacity={0.7}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar Button */}
      <TouchableOpacity
        style={styles.searchBarButton}
        onPress={() => setShowSearchModal(true)}
      >
        <View style={styles.searchBarLogo}>
          <Text style={styles.searchBarLogoText}>R</Text>
        </View>
        <Text style={styles.searchBarPlaceholder}>Search medical guidelines...</Text>
      </TouchableOpacity>

      {/* Quick Search Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Quick Search</Text>
        <View style={styles.chipsList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={styles.chip}
              onPress={() => handleCategoryPress(cat.query)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={Colors.light.primary}
                style={styles.chipIcon}
              />
              <Text style={styles.chipLabel}>{cat.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.light.primary}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsFocused(false);
                  setShowSearchModal(false);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.searchInputWrapper}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search medical guidelines..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    updateRecommendations(text);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onSubmitEditing={() => setIsFocused(false)}
                  returnKeyType="search"
                  blurOnSubmit={true}
                  autoFocus={true}
                />
              </View>
            </View>

            {!searchEngineReady && (
              <View style={styles.initializingBanner}>
                <ActivityIndicator size="small" color="#1E40AF" />
                <Text style={styles.initializingText}>
                  Initializing search engine...
                </Text>
              </View>
            )}
          </View>

          {showResultsModal && (
            <View style={styles.modalContainer}>
              <View style={styles.resultsView}>
                {searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item, index) => `${item.page}-${index}`}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator={true}
                  />
                ) : (
                  <FlatList
                    data={sortedTitlePageData}
                    renderItem={renderBookmark}
                    keyExtractor={(item, index) => `bookmark-${item.bookmark_id}-${index}`}
                    contentContainerStyle={styles.resultsList}
                    showsVerticalScrollIndicator
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
        transparent={false}
      >
        <View style={styles.accountModal}>
          <View style={styles.accountHeader}>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.accountHeaderTitle}>Account</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.accountBody}>
            {/* Avatar + name */}
            <View style={styles.accountProfile}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.accountAvatar} />
              ) : (
                <View style={[styles.avatarFallback, styles.accountAvatar]}>
                  <Text style={[styles.avatarInitial, { fontSize: 28 }]}>{initial}</Text>
                </View>
              )}
              <Text style={styles.accountName}>{fullName || "User"}</Text>
              <Text style={styles.accountEmail}>{session?.user?.email || ""}</Text>
            </View>

            {/* Phone field */}
            <View style={styles.accountField}>
              <Text style={styles.accountFieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.accountInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.saveButton, savingPhone && { opacity: 0.6 }]}
                onPress={handleSavePhone}
                disabled={savingPhone}
              >
                <Text style={styles.saveButtonText}>
                  {savingPhone ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    paddingBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    color: Colors.light.primary,
  },
  greeting: {
    fontSize: 16,
    color: "#666",
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Search bar
  searchBarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ececec",
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 20,
  },
  searchBarLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchBarLogoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  searchBarPlaceholder: {
    color: "#777",
    fontSize: 16,
  },

  // Categories
  categoriesSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  chipsList: {
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chipIcon: {
    marginRight: 10,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.primary,
  },

  // Search modal
  searchHeader: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: "#1E40AF",
    fontWeight: "600",
  },
  initializingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  initializingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#856404",
  },

  // Results
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  resultsView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultCardHighRelevance: {
    borderColor: "#34C759",
    backgroundColor: "#f8fff9",
  },
  resultCardMediumRelevance: {
    borderColor: "#FF9500",
    backgroundColor: "#fffaf5",
  },
  resultTitleSection: {
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    lineHeight: 22,
  },
  resultSection: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    lineHeight: 21,
  },
  resultPreview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E40AF",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pageButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  pageButtonArrow: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  bookmarkCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bookmarkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  bookmarkPage: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },

  // Account modal
  accountModal: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  accountHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  accountBody: {
    padding: 24,
    alignItems: "center",
  },
  accountProfile: {
    alignItems: "center",
    marginBottom: 32,
  },
  accountAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  accountEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  accountField: {
    width: "100%",
    marginBottom: 32,
  },
  accountFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  accountInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
