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
} from "react-native";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEngineReady, setSearchEngineReady] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const searchEngineRef = useRef<SemanticSearchEngine | null>(null);
  const router = useRouter();

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

    // Load bookmarks as default listing
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



  // const handleSearchOrShowResults = async () => {
  const updateRecommendations = async (query: string) => {
    // Perform new search
    if (!query.trim()) {
      setSearchResults(bookmarks);
      return;
    }

    if (!searchEngineRef.current) {
      console.warn("Search engine not initialized yet");
      return;
    }

    setIsLoading(true);
    /* Search result logic */
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
      // Removed setShowResultsModal(true) since results are shown inline
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
          onPress={() => jumpToPage(item.page)}
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
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
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
              /* This is the part where we are compiling the search results. We can probably just replace the function below*/
              // onSubmitEditing={handleSearchOrShowResults}
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
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchHeader: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  backButtonText: {
    fontSize: 16,
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
});
