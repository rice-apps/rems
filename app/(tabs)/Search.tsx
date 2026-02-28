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
import Pdf, { PdfRef } from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { SemanticSearchEngine } from "../search/semanticSearch";

interface SearchResult {
  page: number;
  relevance: number;
  section: string;
  text: string;
  title?: string;
}

export default function SearchScreen() {
  const { page, nonce } = useLocalSearchParams<{ page?: string; nonce?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchEngineReady, setSearchEngineReady] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const pdfRef = useRef<PdfRef>(null);
  const searchEngineRef = useRef<SemanticSearchEngine | null>(null);

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
  }, []);

  useEffect(() => {
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pdfRef.current) {
        setTimeout(() => {
          pdfRef.current?.setPage(pageNum);
        }, 300);
      }
    }
  }, [page, nonce]);

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

  

  const handleSearchOrShowResults = async () => {
    if (hasExistingResults) {
      // Show existing results
      setShowResultsModal(true);
      return;
    }

    // Perform new search
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (!searchEngineRef.current) {
      console.warn("Search engine not initialized yet");
      return;
    }

    setIsLoading(true);

    try {
      const semanticResults = await searchEngineRef.current.search(
        searchQuery,
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
    // Close modal
    setShowResultsModal(false);

    // Force PDF to navigate to the page using ref
    if (pdfRef.current) {
      // Small delay to ensure PDF is visible before navigation
      setTimeout(() => {
        pdfRef.current?.setPage(pageNumber);
      }, 100);
    }
  };

  const updateRecommendations = async (query: string) => {
    if (query.length < 3 || !searchEngineRef.current) {
      setRecommendations([]);
      return;
    }

    try {
      const results = await searchEngineRef.current.search(query, 5);
      const formatted: SearchResult[] = results.map((result) => ({
        page: result.metadata.pageNumber || 1,
        relevance: result.score,
        section: result.metadata.title || result.text.substring(0, 100),
        text: result.text,
        title: result.metadata.title,
      }));
      setRecommendations(formatted);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setRecommendations([]);
    }
  };

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
              onSubmitEditing={handleSearchOrShowResults}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.searchButton,
              !searchEngineReady && styles.searchButtonDisabled,
            ]}
            onPress={handleSearchOrShowResults}
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
            <ActivityIndicator size="small" color="#1E40AF" />
            <Text style={styles.initializingText}>
              Initializing search engine...
            </Text>
          </View>
        )}
      </View>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <FlatList
            data={recommendations}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recommendationItem}
                onPress={() => {
                  setSearchQuery(item.title || item.section);
                  setRecommendations([]);
                  handleSearchOrShowResults();
                }}
              >
                <Text style={styles.recommendationText}>
                  {item.title || item.section}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `rec-${index}`}
            horizontal={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* PDF Viewer */}
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
      </View>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowResultsModal(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Search Results</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

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
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No results found for &quot;{lastSearchQuery}&quot;
                </Text>
              </View>
            )}
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
    backgroundColor: "#1E40AF",
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
    backgroundColor: "#f8f9fa",
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
    color: "#1E40AF",
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
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#fff",
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
