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
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {/* <Animated.View style={[
        styles.searchHeader,
        { marginTop: marginTopAnim },
      ]}>
        <View style={styles.searchInputContainer}>
          <TouchableOpacity onPress = {() => setIsFocused(false)}>
            <Text>
              back
            </Text>
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
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.searchButton,
              !searchEngineReady && styles.searchButtonDisabled,
            ]}
            // onPress={handleSearchOrShowResults}
            disabled={!searchEngineReady}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>
                {hasExistingResults ? "Results" : "Search"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!searchEngineReady && (
          <View style={styles.initializingBanner}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.initializingText}>
              Initializing search engine...
            </Text>
          </View>
        )}
      </Animated.View> */}
      <View style={styles.titleRow}>
        <ThemedText type="title" style={styles.title}>
          REMS
        </ThemedText>
      </View>
      <TouchableOpacity
        style={styles.openSearchButton}
        onPress={() => setShowSearchModal(true)}
      >
        <Text style={styles.openSearchButtonText}>Open Search</Text>
      </TouchableOpacity>

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
    marginBottom: 18 ,
    marginTop: 70,
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

});
