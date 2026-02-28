import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Contacts from "expo-contacts";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

// Type definitions
interface Contact {
  firstName: string;
  lastName: string;
  phone: string;
  college: string;
  email: string;
  clearances: string[];
}

interface ContactCategory {
  title: string;
  contacts: Contact[];
}

interface QuickAccessEntry {
  label: string;
  phone: string;
}

export default function Index() {
  const [isAddingContacts, setIsAddingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [contactData, setContactData] = useState<ContactCategory[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filters = ["All", "ALS", "SE", "BLS", "OBS"];

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [
          { data: categories, error: catError },
          { data: qa, error: qaError },
        ] = await Promise.all([
          supabase
            .from("contact_categories")
            .select("title, contacts(first_name, last_name, phone, college, email, clearances)")
            .order("sort_order")
            .order("last_name", { referencedTable: "contacts" }),
          supabase.from("quick_access").select("label, phone").order("sort_order"),
        ]);

        if (catError) throw catError;
        if (qaError) throw qaError;

        const grouped: ContactCategory[] = (categories ?? []).map((cat) => ({
          title: cat.title,
          contacts: ((cat.contacts as any[]) ?? []).map((c) => ({
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone,
            college: c.college,
            email: c.email,
            clearances: c.clearances ?? [],
          })),
        }));

        setContactData(grouped);
        setQuickAccess(qa ?? []);
      } catch (err) {
        setLoadError("Failed to load contacts. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Filter and search contacts
  const filteredData = useMemo(() => {
    return contactData.map((category) => ({
      ...category,
      contacts: category.contacts.filter((contact) => {
        const matchesSearch =
          searchQuery === "" ||
          `${contact.firstName} ${contact.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          contact.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery);

        const matchesFilter =
          selectedFilter === "All" ||
          contact.clearances.includes(selectedFilter);

        return matchesSearch && matchesFilter;
      }),
    })).filter((category) => category.contacts.length > 0);
  }, [searchQuery, selectedFilter, contactData]);

  // Request contacts permission
  const requestContactsPermission = async (): Promise<boolean> => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant contacts permission to add contacts to your phone."
      );
      return false;
    }
    return true;
  };

  // Format phone number
  const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/-/g, "");
  };

  // Add a single contact
  const addSingleContact = async (contact: Contact): Promise<boolean> => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) return false;

      const newContact: Contacts.Contact = {
        name: `${contact.firstName} ${contact.lastName}`,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumbers: [
          {
            label: "mobile",
            number: formatPhoneNumber(contact.phone),
          },
        ],
        emails: [
          {
            label: "work",
            email: contact.email,
          },
        ],
        note:
          contact.clearances.length > 0
            ? `REMS - ${contact.college}\nClearances: ${contact.clearances.join(
                ", "
              )}`
            : `REMS - ${contact.college}`,
      };

      await Contacts.addContactAsync(newContact);
      return true;
    } catch (error) {
      console.error("Error adding contact:", error);
      return false;
    }
  };

  // Add batch of contacts
  const addBatchContacts = async (
    contacts: Contact[],
    categoryName: string
  ) => {
    setIsAddingContacts(true);

    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setIsAddingContacts(false);
        return;
      }

      let successCount = 0;
      for (const contact of contacts) {
        const success = await addSingleContact(contact);
        if (success) successCount++;
      }

      Alert.alert(
        "Contacts Added",
        `Successfully added ${successCount} of ${contacts.length} contacts from ${categoryName}.`
      );
    } catch (error) {
      Alert.alert("Error", "An error occurred while adding contacts.");
    } finally {
      setIsAddingContacts(false);
    }
  };

  // Add all contacts
  const addAllContacts = async () => {
    setIsAddingContacts(true);

    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setIsAddingContacts(false);
        return;
      }

      let totalSuccess = 0;
      let totalContacts = 0;

      for (const category of contactData) {
        totalContacts += category.contacts.length;
        for (const contact of category.contacts) {
          const success = await addSingleContact(contact);
          if (success) totalSuccess++;
        }
      }

      Alert.alert(
        "All Contacts Added",
        `Successfully added ${totalSuccess} of ${totalContacts} REMS contacts.`
      );
    } catch (error) {
      Alert.alert("Error", "An error occurred while adding contacts.");
    } finally {
      setIsAddingContacts(false);
    }
  };

  // Make phone call
  const makeCall = (phone: string) => {
    const phoneNumber = formatPhoneNumber(phone);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Render quick access buttons
  const renderQuickAccess = () => (
    <View style={styles.quickAccessContainer}>
      <Text style={styles.quickAccessTitle}>Quick Access</Text>
      <View style={styles.quickAccessButtons}>
        {quickAccess.map((entry) => (
          <TouchableOpacity
            key={entry.label}
            style={styles.quickAccessButton}
            onPress={() => makeCall(entry.phone)}
          >
            <Text style={styles.quickAccessLabel}>{entry.label}</Text>
            <Text style={styles.quickAccessPhone}>{entry.phone}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render filter chips
  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterChip,
            selectedFilter === filter && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive,
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Add individual contact with feedback
  const addIndividualContact = async (contact: Contact) => {
    const success = await addSingleContact(contact);
    if (success) {
      Alert.alert(
        "Contact Added",
        `${contact.firstName} ${contact.lastName} has been added to your contacts.`
      );
    } else {
      Alert.alert(
        "Error",
        `Failed to add ${contact.firstName} ${contact.lastName}.`
      );
    }
  };

  // Render individual contact card
  const renderContact = (contact: Contact) => (
    <View
      key={`${contact.firstName}-${contact.lastName}-${contact.phone}`}
      style={styles.contactCard}
    >
      <TouchableOpacity
        style={styles.contactInfo}
        onPress={() => makeCall(contact.phone)}
        activeOpacity={0.7}
      >
        <Text style={styles.contactName}>
          {contact.firstName} {contact.lastName}
        </Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.contactCollege}>{contact.college}</Text>
          {contact.clearances.length > 0 && (
            <View style={styles.clearancesContainer}>
              {contact.clearances.map((clearance) => (
                <View key={clearance} style={styles.clearanceBadge}>
                  <Text style={styles.clearanceText}>{clearance}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.individualAddButton}
        onPress={() => addIndividualContact(contact)}
        disabled={isAddingContacts}
      >
        <Text style={styles.individualAddButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  // Render category section
  const renderCategory = (category: ContactCategory) => (
    <View key={category.title} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>
          {category.title} ({category.contacts.length})
        </Text>
        <TouchableOpacity
          style={styles.batchAddButton}
          onPress={() => addBatchContacts(category.contacts, category.title)}
          disabled={isAddingContacts}
        >
          <Text style={styles.batchAddButtonText}>+ Add All</Text>
        </TouchableOpacity>
      </View>
      {category.contacts.map(renderContact)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.headerTitle}>REMS Contacts</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Sign Out", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() },
              ]);
            }}
            style={{ padding: 6 }}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, college, or phone..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addAllButton}
          onPress={addAllContacts}
          disabled={isAddingContacts}
        >
          {isAddingContacts ? (
            <ActivityIndicator color="#003C7D" />
          ) : (
            <Text style={styles.addAllButtonText}>+ Add All Contacts</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderQuickAccess()}
        {renderFilters()}

        {isLoading ? (
          <View style={styles.noResultsContainer}>
            <ActivityIndicator size="large" color="#133465" />
          </View>
        ) : loadError ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>{loadError}</Text>
          </View>
        ) : filteredData.length > 0 ? (
          filteredData.map(renderCategory)
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No contacts found</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#133465",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginBottom: 15,
  },
  searchInput: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#333333",
  },
  addAllButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  addAllButtonText: {
    color: "#133465",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  quickAccessContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickAccessTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  quickAccessButtons: {
    flexDirection: "row",
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  quickAccessLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  quickAccessPhone: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  filtersContainer: {
    marginTop: 20,
    paddingLeft: 20,
  },
  filtersContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#003C7D",
    borderColor: "#003C7D",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  categorySection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  batchAddButton: {
    backgroundColor: "#133465",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  batchAddButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactInfo: {
    flex: 1,
    marginRight: 12,
  },
  individualAddButton: {
    backgroundColor: "#133465",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  individualAddButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#133465",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  contactCollege: {
    fontSize: 14,
    color: "#999999",
    marginRight: 12,
  },
  clearancesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  clearanceBadge: {
    backgroundColor: "#E8F4F8",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  clearanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#003C7D",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#999999",
  },
  bottomPadding: {
    height: 40,
  },
});
