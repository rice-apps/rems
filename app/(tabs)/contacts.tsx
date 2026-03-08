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
  Platform,
  SectionList,
} from "react-native";
import * as Contacts from "expo-contacts";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

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

const FILTERS = ["All", "ALS", "SE", "BLS", "OBS"];

export default function ContactsScreen() {
  const [isAddingContacts, setIsAddingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [contactData, setContactData] = useState<ContactCategory[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const filteredData = useMemo(() => {
    return contactData
      .map((category) => ({
        ...category,
        contacts: category.contacts.filter((contact) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            q === "" ||
            `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(q) ||
            contact.college.toLowerCase().includes(q) ||
            contact.phone.includes(searchQuery);

          const matchesFilter =
            selectedFilter === "All" || contact.clearances.includes(selectedFilter);

          return matchesSearch && matchesFilter;
        }),
      }))
      .filter((category) => category.contacts.length > 0);
  }, [searchQuery, selectedFilter, contactData]);

  const totalFiltered = filteredData.reduce((sum, cat) => sum + cat.contacts.length, 0);

  // ── Contact helpers ──────────────────────────────────────────────────────

  const requestContactsPermission = async (): Promise<boolean> => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant contacts permission to add contacts to your phone.");
      return false;
    }
    return true;
  };

  const formatPhoneNumber = (phone: string) => phone.replace(/-/g, "");

  const addSingleContact = async (contact: Contact): Promise<boolean> => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) return false;

      const newContact = {
        name: `${contact.firstName} ${contact.lastName}`,
        contactType: Contacts.ContactTypes.Person,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumbers: [{ label: "mobile", number: formatPhoneNumber(contact.phone) }],
        emails: [{ label: "work", email: contact.email }],
        note: contact.clearances.length > 0
          ? `REMS - ${contact.college}\nClearances: ${contact.clearances.join(", ")}`
          : `REMS - ${contact.college}`,
      };

      await Contacts.addContactAsync(newContact);
      return true;
    } catch (error) {
      console.error("Error adding contact:", error);
      return false;
    }
  };

  const addBatchContacts = async (contacts: Contact[], categoryName: string) => {
    setIsAddingContacts(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) { setIsAddingContacts(false); return; }

      let successCount = 0;
      for (const contact of contacts) {
        const success = await addSingleContact(contact);
        if (success) successCount++;
      }

      Alert.alert("Contacts Added", `Added ${successCount} of ${contacts.length} from ${categoryName}.`);
    } catch {
      Alert.alert("Error", "An error occurred while adding contacts.");
    } finally {
      setIsAddingContacts(false);
    }
  };

  const addAllContacts = async () => {
    setIsAddingContacts(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) { setIsAddingContacts(false); return; }

      let totalSuccess = 0;
      let totalContacts = 0;
      for (const category of contactData) {
        totalContacts += category.contacts.length;
        for (const contact of category.contacts) {
          const success = await addSingleContact(contact);
          if (success) totalSuccess++;
        }
      }

      Alert.alert("All Contacts Added", `Added ${totalSuccess} of ${totalContacts} REMS contacts.`);
    } catch {
      Alert.alert("Error", "An error occurred while adding contacts.");
    } finally {
      setIsAddingContacts(false);
    }
  };

  const addIndividualContact = async (contact: Contact) => {
    const success = await addSingleContact(contact);
    if (success) {
      Alert.alert("Contact Added", `${contact.firstName} ${contact.lastName} has been added.`);
    } else {
      Alert.alert("Error", `Failed to add ${contact.firstName} ${contact.lastName}.`);
    }
  };

  const makeCall = (phone: string) => Linking.openURL(`tel:${formatPhoneNumber(phone)}`);

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 40 }]}>
        <Text style={{ fontSize: 16, color: "#999", textAlign: "center" }}>{loadError}</Text>
      </View>
    );
  }

  const sections = filteredData.map((cat) => ({
    title: cat.title,
    data: cat.contacts,
  }));

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.firstName}-${item.lastName}-${index}`}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerBrand}>REMS</Text>
                <Text style={styles.headerSubtitle}>Contacts</Text>
              </View>
              <TouchableOpacity
                style={styles.addAllChip}
                onPress={addAllContacts}
                disabled={isAddingContacts}
                activeOpacity={0.7}
              >
                {isAddingContacts ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={16} color={Colors.light.primary} />
                    <Text style={styles.addAllChipText}>Add All</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#999" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, college, or phone..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Access */}
            {quickAccess.length > 0 && (
              <View style={styles.quickAccessRow}>
                {quickAccess.map((entry) => (
                  <TouchableOpacity
                    key={entry.label}
                    style={styles.quickAccessCard}
                    onPress={() => makeCall(entry.phone)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={18} color={Colors.light.primary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.quickAccessLabel}>{entry.label}</Text>
                      <Text style={styles.quickAccessPhone}>{entry.phone}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
              style={styles.filtersRow}
            >
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={{ paddingRight: 20 }} />
            </ScrollView>

            {/* Result count */}
            <Text style={styles.resultCount}>
              {totalFiltered} contact{totalFiltered !== 1 ? "s" : ""}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {section.title} ({section.data.length})
            </Text>
            <TouchableOpacity
              style={styles.batchAddChip}
              onPress={() => addBatchContacts(section.data, section.title)}
              disabled={isAddingContacts}
              activeOpacity={0.7}
            >
              <Text style={styles.batchAddText}>+ Add All</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item: contact }) => (
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactInfo}
              onPress={() => makeCall(contact.phone)}
              activeOpacity={0.7}
            >
              <View style={styles.contactNameRow}>
                <Text style={styles.contactName}>
                  {contact.firstName} {contact.lastName}
                </Text>
                {contact.clearances.length > 0 && (
                  <View style={styles.badgeRow}>
                    {contact.clearances.map((cl) => (
                      <View key={cl} style={styles.clearanceBadge}>
                        <Text style={styles.clearanceText}>{cl}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.contactDetails}>
                <Ionicons name="call-outline" size={14} color="#999" />
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                {contact.college ? (
                  <>
                    <Text style={styles.contactDot}>·</Text>
                    <Text style={styles.contactCollege}>{contact.college}</Text>
                  </>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addIndividualContact(contact)}
              disabled={isAddingContacts}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContent: {
    paddingBottom: 40,
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
  headerBrand: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    color: Colors.light.primary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
  },
  addAllChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  addAllChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ececec",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },

  // Quick Access
  quickAccessRow: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  quickAccessCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 14,
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  quickAccessPhone: {
    fontSize: 13,
    color: "#666",
    marginTop: 1,
  },

  // Filters
  filtersRow: {
    marginTop: 16,
  },
  filtersContent: {
    paddingLeft: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  filterChipActive: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  filterTextActive: {
    color: Colors.light.primary,
  },

  // Result count
  resultCount: {
    fontSize: 12,
    color: "#999",
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 4,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  batchAddChip: {
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  batchAddText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },

  // Contact card
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
    marginRight: 12,
  },
  contactNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
  },
  clearanceBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearanceText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.primary,
    letterSpacing: 0.4,
  },
  contactDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactPhone: {
    fontSize: 13,
    color: "#666",
  },
  contactDot: {
    fontSize: 13,
    color: "#ccc",
    marginHorizontal: 2,
  },
  contactCollege: {
    fontSize: 13,
    color: "#999",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
  },
});
