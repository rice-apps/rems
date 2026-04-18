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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEngineReady, setSearchEngineReady] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const searchEngineRef = useRef<SemanticSearchEngine | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [phone, setPhone] = useState(userMeta?.phone || "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [userClearances, setUserClearances] = useState<string[]>([]);

  const hasQuery = searchQuery.trim().length > 0;

  useEffect(() => {
    const fetchClearance = async () => {
      const email = session?.user?.email;
      if (!email) return;
      try {
        const { data } = await supabase
          .from("contacts")
          .select("clearances")
          .ilike("email", email.toLowerCase())
          .single();
        if (data?.clearances?.length) {
          setUserClearances(data.clearances);
        }
      } catch {}
    };
    fetchClearance();
  }, [session]);

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
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSearchModal = () => {
    Keyboard.dismiss();
    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults(bookmarks);
  };

  const openSearchModal = () => {
    setShowSearchModal(true);
  };

  const jumpToPage = (pageNumber: number) => {
    closeSearchModal();
    router.replace({
      pathname: "/(tabs)/Search",
      params: {
        page: pageNumber.toString(),
        nonce: Date.now().toString(),
      },
    });
  };

  const handleCategoryPress = (query: string) => {
    setSearchQuery(query);
    setShowSearchModal(true);
    updateRecommendations(query);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    if (!hasQuery) {
      return (
        <TouchableOpacity
          style={styles.bookmarkCard}
          onPress={() => jumpToPage(item.page)}
          activeOpacity={0.7}
        >
          <Text style={styles.bookmarkTitle} numberOfLines={1}>
            {item.title || item.section}
          </Text>
          <Text style={styles.bookmarkPage}>Page {item.page} →</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => jumpToPage(item.page)}
        activeOpacity={0.7}
      >
        <View style={styles.resultCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle} numberOfLines={2}>
              {item.title || item.section}
            </Text>
            <Text style={styles.resultPreview} numberOfLines={2}>
              {item.text}
            </Text>
          </View>
          <View style={styles.resultPageBadge}>
            <Text style={styles.resultPageBadgeText}>p.{item.page}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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

      {/* Search Bar Button (opens modal) */}
      <TouchableOpacity
        style={styles.searchBarButton}
        onPress={openSearchModal}
        activeOpacity={0.8}
      >
        <View style={styles.searchBarLogo}>
          <Text style={styles.searchBarLogoText}>R</Text>
        </View>
        <Text style={styles.searchBarPlaceholder}>Search medical guidelines...</Text>
      </TouchableOpacity>

      {/* Quick Search Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionLabel}>Quick Search</Text>
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
        onRequestClose={closeSearchModal}
        transparent={false}
        onShow={() => {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              onPress={closeSearchModal}
              style={styles.searchBackButton}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search medical guidelines..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  updateRecommendations(text);
                }}
                returnKeyType="search"
                blurOnSubmit
              />
              {hasQuery && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults(bookmarks);
                    searchInputRef.current?.focus();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={Colors.light.primary}
                  style={{ marginLeft: 8 }}
                />
              )}
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

          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>
              {hasQuery ? `Results for "${searchQuery.trim()}"` : "Browse Guidelines"}
            </Text>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => `${item.page}-${index}`}
                contentContainerStyle={styles.resultsList}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator
              />
            ) : (
              <View style={styles.emptyResults}>
                <Text style={styles.emptyResultsText}>
                  {hasQuery ? "No matches found." : "No guidelines available."}
                </Text>
              </View>
            )}
          </View>
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
              {userClearances.length > 0 && (
                <View style={styles.clearanceRow}>
                  {userClearances.map((c) => (
                    <View key={c} style={styles.clearanceBadge}>
                      <Text style={styles.clearanceBadgeText}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

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

  categoriesSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
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

  searchModal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBackButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    width: 40,
    height: 40,
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },

  initializingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  initializingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#856404",
  },

  resultsSection: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  resultsList: {
    paddingBottom: 24,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resultCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    lineHeight: 20,
  },
  resultPreview: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    marginTop: 4,
  },
  resultPageBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  resultPageBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  bookmarkCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
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
  emptyResults: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyResultsText: {
    fontSize: 15,
    color: "#888",
  },

  backButtonText: {
    fontSize: 16,
    color: "#1E40AF",
    fontWeight: "600",
  },
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
  clearanceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  clearanceBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearanceBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
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
