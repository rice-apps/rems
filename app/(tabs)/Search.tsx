import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Pdf, { PdfRef } from 'react-native-pdf';

interface SearchResult {
  page: number;
  relevance: number;
  section: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pdfRef = useRef<PdfRef>(null);

  const source = Platform.select({
    ios: require('../../assets/guidelines/guidelines.pdf'),
    android: { uri: 'bundle-assets://guidelines.pdf' },
  });

  const handleLoadComplete = (numberOfPages: number) => {
    console.log(`PDF loaded with ${numberOfPages} pages`);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    // TODO: Implement actual PDF text extraction and search
    // For now, this is a placeholder structure
    // You'll need to integrate a PDF text extraction library
    // or implement server-side search

    // Mock search results for demonstration
    const mockResults: SearchResult[] = [
      {
        page: 5,
        relevance: 0.8,
        section: "Head injury"
      },
      {
        page: 12,
        relevance: 0.6,
        section: "Another section"
      },
    ];

    setTimeout(() => {
      setSearchResults(mockResults);
      setIsLoading(false);
    }, 500);
  };

  const jumpToPage = (pageNumber: number) => {
    if (pdfRef.current) {
      setCurrentPage(pageNumber);
      // The page prop on the Pdf component will trigger navigation
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    // Convert relevance to percentage for display
    const relevancePercentage = Math.round(item.relevance * 100);

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => jumpToPage(item.page)}
      >
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.sectionName}>{item.section}</Text>
            <View style={[
              styles.relevanceBadge,
              { backgroundColor: item.relevance > 0.7 ? '#34C759' : item.relevance > 0.4 ? '#FF9500' : '#FF3B30' }
            ]}>
              <Text style={styles.relevanceText}>{relevancePercentage}%</Text>
            </View>
          </View>
          <Text style={styles.pageNumber}>Page {item.page}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search in guidelines..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : searchResults.length > 0 ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item, index) => `${item.page}-${index}`}
            style={styles.resultsList}
          />
        </View>
      ) : null}

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <Pdf
          ref={pdfRef}
          source={source}
          page={currentPage}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={(error) => {
            console.error('PDF Error:', error);
          }}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={true}
          horizontal={false}
          // These props allow for better search/navigation experience
          spacing={10}
          fitPolicy={0} // 0: fit width, 1: fit height, 2: fit both
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsHeader: {
    padding: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  relevanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
});
