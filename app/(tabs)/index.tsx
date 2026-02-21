import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  Animated,
  Keyboard
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SemanticSearchEngine } from "../search/semanticSearch";

interface SearchResult {
  page: number;
  relevance: number;
  section: string;
  text: string;
  title?: string;
}

export default function SearchScreen() {
  const marginTopAnim = useRef(new Animated.Value(150)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEngineReady, setSearchEngineReady] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(true);
  const [showRecommendedModal, setShowRecommendedModal] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const searchEngineRef = useRef<SemanticSearchEngine | null>(null);
  const router = useRouter();
  const [showSearchModal, setShowSearchModal] = useState(false);


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



  const source = Platform.select({
    ios: require("../../assets/guidelines/guidelines.pdf"),
    android: { uri: "bundle-assets://guidelines.pdf" },
  });

  const handleLoadComplete = (numberOfPages: number) => {
    console.log(`PDF loaded with ${numberOfPages} pages`);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const [recommendedSearches, setRecommendedSearches] = useState<string[]>([]);

  const hasSearchChanged = searchQuery.trim() !== lastSearchQuery;
  const hasExistingResults = searchResults.length > 0 && !hasSearchChanged;



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
      const semanticResults = await searchEngineRef.current.search(
        query,
        15
      );

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
      setShowResultsModal(true)
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


  /* End of search results */


  // const updateRecommendations = async (query: string) => {
  //   if (query.length < 3 || !searchEngineRef.current) {
  //     setRecommendations([]);
  //     return;
  //   }

  //   try {
  //     const results = await searchEngineRef.current.search(query, 5);
  //     const formatted: SearchResult[] = results.map((result) => ({
  //       page: result.metadata.pageNumber || 1,
  //       relevance: result.score,
  //       section: result.metadata.title || result.text.substring(0, 100),
  //       text: result.text,
  //       title: result.metadata.title,
  //     }));
  //     setRecommendations(formatted);
  //   } catch (error) {
  //     console.error("Error getting recommendations:", error);
  //     setRecommendations([]);
  //   }
  // };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const isEmptySearch = !searchQuery.trim();

    if (isEmptySearch) {
      return (
        <TouchableOpacity
          style={styles.bookmarkCard} onPress={() => {
            setShowSearchModal(false);
            jumpToPage(item.page);
          }}
        >
          <Text style={styles.bookmarkTitle} numberOfLines={1}>{item.title || item.section}</Text>
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
          isMediumRelevance &&
          !isHighRelevance &&
          styles.resultCardMediumRelevance,
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
            jumpToPage(item.page)
          }
          }
          activeOpacity={0.7}
        >
          <Text style={styles.pageButtonText}>Page {item.page}</Text>
          <Text style={styles.pageButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const recommendedCategories = [
    { id: 1, label: "Airway & breathing", checked: false },
    { id: 2, label: "Cardiac", checked: false },
    { id: 3, label: "Medical (seizure, hypoglycemia)", checked: false },
    { id: 4, label: "Trauma", checked: false },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.hamburgerButton}>
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, styles.hamburgerLineShort]} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleRow}>
        <ThemedText type="title" style={styles.title}>
          REMS
        </ThemedText>
      </View>

      {/* Search Bar Button */}
      <TouchableOpacity
        style={styles.searchBarButton}
        onPress={() => setShowSearchModal(true)}
      >
        <View style={styles.searchBarLogo}>
          <Text style={styles.searchBarLogoText}>R</Text>
        </View>
        <Text style={styles.searchBarPlaceholder}>Option A</Text>
      </TouchableOpacity>

      {/* Recommended Search Section */}
      <View style={styles.recommendedCard}>
        <View style={styles.recommendedHeader}>
          <Text style={styles.recommendedTitle}>Recommended search</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See more</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recommendedContent}>
          {recommendedCategories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryRow}>
              <View style={styles.checkbox}>
                {category.checked && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View
            style={[
              styles.searchHeader,
            ]}
          >
            <View style={styles.searchInputContainer}>
              {/* Back button closes modal */}
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
                />
              </View>
            </View>

            {!searchEngineReady && (
              <View style={styles.initializingBanner}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.initializingText}>
                  Initializing search engine...
                </Text>
              </View>
            )}
          </View>
          {/*put search results here*/}
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


      {/* Recommendations */}


      {/* PDF Viewer
      <View style={styles.pdfView}>
        <Pdf
          ref={pdfRef}
          source={source}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={(error) => {
            console.error("PDF Error:", error);
          }}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={false}
          horizontal={false}
          enableDoubleTapZoom={true}
          spacing={10}
          fitPolicy={2}
          minScale={1.0}
          maxScale={3.0}
        />
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>Page {currentPage}</Text>
        </View>
      </View> */}

      {/* Results Modal */}
      {/*uncomment below to show items on home screen*/}
      {/* {showResultsModal && (
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
      )} */}

      {/* {showRecommendedModal && (
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
      )} */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
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
  title: {
    paddingTop: 20,
    fontSize: 48,
    letterSpacing: 2,
    color: Colors.light.tint,
    fontWeight: "800",
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
  searchButton: {
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  searchButtonDisabled: {
    backgroundColor: "#ccc",
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  initializingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  openSearchButton: {
    marginTop: 60,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    alignItems: "center",

  },
  openSearchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  initializingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#856404",
  },
  pdfView: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get("window").width,
  },
  pageIndicator: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageIndicatorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  titleRow: {
    alignItems: "center",
    marginBottom: 8,
    marginTop: 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
    paddingRight: 12
  },
  backButtonText: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "600",
  },
  backButtonPlaceholder: {
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  resultsView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  resultsHeader: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  resultsHeaderSubtitle: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#007AFF",
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  recommendationsContainer: {
    backgroundColor: "red",
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  recommendationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recommendationText: {
    fontSize: 16,
    color: "#333",
  },
  bookmarkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bookmarkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  bookmarkPage: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  // OLD HOMEPAGE STYLES
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  menuButton: { padding: 8 },
  menuIcon: { width: 22, height: 22, resizeMode: "contain" },
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

  // New home page styles
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 8,
  },
  hamburgerButton: {
    padding: 8,
    justifyContent: "center",
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: "#333",
    marginVertical: 2,
  },
  hamburgerLineShort: {
    width: 14,
  },
  loginText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
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
    backgroundColor: Colors.light.tint,
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
  recommendedCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
  },
  recommendedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  seeMoreText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  recommendedContent: {
    paddingTop: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 16,
    color: "#333",
  },
});

// Old index code

// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   ScrollView,
//   StyleSheet,
//   Pressable,
//   Image,
//   Animated,
//   Dimensions,
//   TouchableWithoutFeedback,
//   Alert,
//   Platform,
// } from "react-native"; 

// import { ThemedView } from "@/components/themed-view";
// import { ThemedText } from "@/components/themed-text";
// import { Colors } from "@/constants/theme";
// import { useColorScheme } from "@/hooks/use-color-scheme";

// const isIOS = Platform.OS === "ios";

// export default function HomePage() {
//   const theme = (useColorScheme() ?? "light") as "light" | "dark";

//   const leftBar = require("@/assets/images/LeftBar.png");

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [listOpen, setListOpen] = useState(false);
//   const [selectedListValue, setSelectedListValue] = useState<string | null>(
//     null
//   );

//   // Values to show in dropdown
//   const listValues = [
//     "Airway & breathing",
//     "Cardiac",
//     "Medical (seizure, hypoglycemia)",
//     "Trauma",
//   ];

//   const panelWidth = Math.min(
//     360,
//     Math.round(Dimensions.get("window").width * 0.78)
//   );
//   const translateX = useRef(new Animated.Value(-panelWidth)).current;
//   const translateY = useRef(new Animated.Value(0)).current;

//   const listItems = [
//     "Option A",
//     "Option B",
//     "Option C",
//     "Option D",
//     "Option E",
//     "Option F",
//     "Option G",
//     "Option H",
//     "Option I",
//     "Option J",
//     "Option K",
//     "Option L",
//     "Option M",
//     "Option N",
//     "Option O",
//     "Option P",
//   ];

//   // animation values for each dropdown item (initialized after listItems is defined)
//   const itemTranslate = useRef(
//     listItems.map(() => new Animated.Value(40))
//   ).current;
//   const itemOpacity = useRef(
//     listItems.map(() => new Animated.Value(0))
//   ).current;

//   useEffect(() => {
//     Animated.timing(translateX, {
//       toValue: sidebarOpen ? 0 : -panelWidth,
//       duration: 220,
//       useNativeDriver: true,
//     }).start();
//   }, [sidebarOpen, panelWidth, translateX]);

//   const handleSideBarPress = () => setSidebarOpen(true);

//   const handleListOpen = () => {
//     Animated.timing(translateY, {
//       toValue: listOpen ? 0 : -100,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//     setListOpen(!listOpen);
//   };

//   const handleSelectListValue = (v: string) => {
//     setSelectedListValue(v);
//     Animated.timing(translateY, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//     setListOpen(false);
//   };

//   React.useEffect(() => {
//     if (listOpen) {
//       itemTranslate.forEach((t) => t.setValue(40));
//       itemOpacity.forEach((o) => o.setValue(0));

//       const anims = itemTranslate.map((t, i) =>
//         Animated.parallel([
//           Animated.timing(t, {
//             toValue: 0,
//             duration: 320,
//             useNativeDriver: true,
//           }),
//           Animated.timing(itemOpacity[i], {
//             toValue: 1,
//             duration: 300,
//             useNativeDriver: true,
//           }),
//         ])
//       );

//       Animated.stagger(20, anims).start();
//     } else {
//       const anims = itemTranslate.map((t, i) =>
//         Animated.parallel([
//           Animated.timing(t, {
//             toValue: 40,
//             duration: 180,
//             useNativeDriver: true,
//           }),
//           Animated.timing(itemOpacity[i], {
//             toValue: 0,
//             duration: 180,
//             useNativeDriver: true,
//           }),
//         ])
//       );
//       Animated.stagger(20, anims.reverse()).start();
//     }
//   }, [listOpen, itemTranslate, itemOpacity]);

//   // small square icon used at left of search
//   const SearchLogo = () => (
//     <View style={[styles.searchLogo, { backgroundColor: Colors[theme].tint }]}>
//       <ThemedText style={styles.searchLogoText}>R</ThemedText>
//     </View>
//   );

//   return (
//     <ThemedView style={styles.container}>
//       {/* Hide these when listOpen */}
//       {!listOpen && (
//         <>
//           <View style={styles.topRow}>
//             <Pressable onPress={handleSideBarPress} style={styles.menuButton}>
//               <Image
//                 source={leftBar}
//                 style={[styles.menuIcon, { tintColor: Colors[theme].icon }]}
//               />
//             </Pressable>
//             <Pressable onPress={() => Alert.alert("Log in")}>
//               <ThemedText type="defaultSemiBold">Log in</ThemedText>
//             </Pressable>
//           </View>

//           <View style={styles.titleRow}>
//             <ThemedText type="title" style={styles.title}>
//               REMS
//             </ThemedText>
//           </View>
//         </>
//       )}

//       {/* Search bar - positioned absolutely when listOpen */}
//       <Animated.View
//         style={[
//           styles.searchContainerAbsolute,
//           { transform: [{ translateY }] },
//         ]}
//       >
//         <Pressable
//           onPress={handleListOpen}
//           style={[
//             styles.searchContainer,
//             isIOS ? styles.searchContainerIOS : null,
//           ]}
//         >
//           <SearchLogo />
//           <ThemedText style={styles.searchText}>
//             {selectedListValue ?? "Type anything to search"}
//           </ThemedText>
//         </Pressable>
//       </Animated.View>

//       {/* Hide card when listOpen */}
//       {!listOpen && (
//         <View style={styles.card}>
//           <View style={styles.cardHeader}>
//             <ThemedText type="defaultSemiBold">Recommended search</ThemedText>
//             <Pressable>
//               <ThemedText type="link">See more</ThemedText>
//             </Pressable>
//           </View>

//           <View style={styles.cardContent}>
//             {listValues.map((label) => (
//               <View key={label} style={styles.cardRow}>
//                 <View
//                   style={[
//                     styles.iconBox,
//                     { backgroundColor: Colors[theme].tint },
//                   ]}
//                 >
//                   <View style={styles.iconInner} />
//                 </View>
//                 <ThemedText style={styles.cardLabel}>{label}</ThemedText>
//               </View>
//             ))}
//           </View>
//         </View>
//       )}

//       {/* Dropdown under search — full screen when open so items can extend/scroll to bottom */}
//       {listOpen && (
//         <View
//           style={[
//             styles.fullscreenDropdown,
//             { backgroundColor: "transparent" },
//           ]}
//         >
//           <View style={styles.dropdownScroll}>
//             {listItems.slice(0, 14).map((v, index, array) => (
//               <Animated.View
//                 key={v}
//                 style={{
//                   transform: [{ translateY: itemTranslate[index] }],
//                   opacity: itemOpacity[index],
//                 }}
//               >
//                 <Pressable
//                   style={styles.dropdownItem}
//                   onPress={() => handleSelectListValue(v)}
//                 >
//                   <ThemedText style={styles.dropdownText}>{v}</ThemedText>
//                 </Pressable>
//                 {index < array.length - 1 && <View style={styles.separator} />}
//               </Animated.View>
//             ))}
//             <View style={{ height: 40 }} />
//           </View>
//         </View>
//       )}

//       {/* Sidebar overlay/backdrop */}
//       {sidebarOpen && (
//         <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
//           <View style={styles.backdrop} />
//         </TouchableWithoutFeedback>
//       )}

//       <Animated.View
//         pointerEvents={sidebarOpen ? "auto" : "none"}
//         style={[
//           styles.sidebar,
//           { width: panelWidth, transform: [{ translateX }] },
//         ]}
//       >
//         <View style={styles.sidebarContent}>
//           <ThemedText type="title">Menu</ThemedText>
//         </View>
//       </Animated.View>
//     </ThemedView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, paddingTop: 42, paddingHorizontal: 20 },
//   topRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   menuButton: { padding: 8 },
//   menuIcon: { width: 22, height: 22, resizeMode: "contain" },
//   titleRow: { alignItems: "center", marginBottom: 18 },
//   title: {
//     paddingTop: 20,
//     fontSize: 48,
//     letterSpacing: 2,
//     color: Colors.light.tint,
//     fontWeight: "800",
//   },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#ececec",
//     borderRadius: 28,
//     height: 56,
//     paddingHorizontal: 14,
//     marginBottom: 14,
//   },
//   searchContainerAbsolute: {
//     position: "absolute",
//     backgroundColor: "transparent",
//     top: 170,
//     left: 20,
//     right: 20,
//     zIndex: 100,
//     // remove bottom margin so dropdown can sit flush under the search bar
//     marginBottom: 0,
//   },
//   separator: {
//     height: 1,
//     backgroundColor: "#e0e0e0",
//     marginHorizontal: 8,
//   },
//   dropdownText: { fontSize: 20, color: "#333" },
//   searchContainerIOS: {
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   searchLogo: {
//     width: 34,
//     height: 34,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   searchLogoText: { color: "white", fontWeight: "700" },
//   searchInner: { flex: 1 },
//   searchText: { color: "#777", fontSize: 16 },
//   card: {
//     backgroundColor: "#f3f3f3",
//     borderRadius: 18,
//     padding: 14,
//     marginTop: 80,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   cardContent: { paddingVertical: 6 },
//   cardRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
//   iconBox: {
//     width: 44,
//     height: 44,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   iconInner: {
//     width: 22,
//     height: 22,
//     backgroundColor: "white",
//     borderRadius: 4,
//   },
//   cardLabel: { fontSize: 16, color: "#333" },
//   dropdown: {
//     position: "absolute",
//     left: 20,
//     right: 20,
//     top: 120,
//     borderRadius: 10,
//     padding: 8,
//     elevation: 4,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   dropdownItem: { paddingVertical: 13, paddingHorizontal: 8 },
//   fullscreenDropdown: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 136,
//     bottom: 0,
//     zIndex: 200,
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     overflow: "hidden",
//   },
//   dropdownScroll: { flexGrow: 1, padding: 0 },
//   backdrop: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0,0,0,0.25)",
//   },
//   sidebar: {
//     position: "absolute",
//     top: 0,
//     bottom: 0,
//     left: 0,
//     backgroundColor: "white",
//     zIndex: 1000,
//   },
//   sidebarContent: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
//   sidebarListItem: { paddingVertical: 12 },
// });



// //   [
// //     "node_3",
// //     {
// //       "id": "node_3",
// //       "text": "_____________________________________",
// //       "source": "clinical-guidelines.html",
// //       "nodeIndex": 3,
// //       "xpath": "/html/body/p[5]",
// //       "tagName": "p",
// //       "bookmark": null
// //     }
// //   ],