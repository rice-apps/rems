import React, { useState, useMemo } from "react";
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

// Quick Access Numbers
const QUICK_ACCESS = {
  onDutyIncharge: "713-412-6279",
  captainsPhone: "713-412-6896",
};

// ALL CONTACTS from the PDF
const CONTACT_DATA: ContactCategory[] = [
  {
    title: "Medical Command",
    contacts: [
      {
        firstName: "Cameron",
        lastName: "Decker",
        phone: "713-927-5114",
        college: "MD1",
        email: "camerondecker@gmail.com",
        clearances: [],
      },
      {
        firstName: "Louis",
        lastName: "Fornage",
        phone: "713-203-4902",
        college: "MD3",
        email: "lbf1@rice.edu",
        clearances: [],
      },
      {
        firstName: "Hashim",
        lastName: "Zaidi",
        phone: "832-766-6972",
        college: "MD2",
        email: "hashim.q.zaidi@gmail.com",
        clearances: [],
      },
    ],
  },
  {
    title: "InCharges",
    contacts: [
      {
        firstName: "Nancy",
        lastName: "Johnson",
        phone: "734-657-0011",
        college: "Duncan",
        email: "nrj2@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Justin",
        lastName: "Xia",
        phone: "512-783-8170",
        college: "Duncan",
        email: "jjx3@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Michiel",
        lastName: "Noe",
        phone: "915-255-9205",
        college: "Grad",
        email: "mrn3@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Arnav",
        lastName: "Murthy",
        phone: "469-863-9182",
        college: "Martel",
        email: "am255@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Dylan",
        lastName: "Balise",
        phone: "413-276-5273",
        college: "Sid Rich",
        email: "dhb3@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Hari",
        lastName: "Surnedi",
        phone: "319-575-4107",
        college: "Martel",
        email: "hcs2@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Connie",
        lastName: "Ni",
        phone: "973-389-6567",
        college: "Sid Rich",
        email: "cwn5@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
    ],
  },
  {
    title: "InCharge Trainees",
    contacts: [
      {
        firstName: "Dia",
        lastName: "Gupta",
        phone: "917-640-0031",
        college: "Will Rice",
        email: "dg123@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Kai",
        lastName: "Hyodo",
        phone: "346-473-5019",
        college: "Duncan",
        email: "kdh11@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Rithvik",
        lastName: "Katikaneni",
        phone: "832-732-2682",
        college: "Martel",
        email: "rk105@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Kriti",
        lastName: "Pandellapalli",
        phone: "740-601-5555",
        college: "Duncan",
        email: "krp3@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Evan",
        lastName: "Shalev",
        phone: "702-302-0929",
        college: "Brown",
        email: "eas10@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Steven",
        lastName: "Szladewski",
        phone: "936-314-9104",
        college: "Baker",
        email: "sas33@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Abhishek",
        lastName: "Tripathi",
        phone: "832-537-2930",
        college: "Brown",
        email: "at116@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
      {
        firstName: "Amogh",
        lastName: "Varanasi",
        phone: "913-238-7073",
        college: "Duncan",
        email: "av102@rice.edu",
        clearances: ["ALS", "SE", "OBS"],
      },
    ],
  },
  {
    title: "Duty Crew",
    contacts: [
      {
        firstName: "Jordan",
        lastName: "Altman",
        phone: "516-725-0447",
        college: "Lovett",
        email: "jra15@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Ann",
        lastName: "Antwi-Boasiako",
        phone: "832-759-1433",
        college: "McMurtry",
        email: "aba5@rice.edu",
        clearances: [],
      },
      {
        firstName: "Vijay",
        lastName: "Arora",
        phone: "412-974-1247",
        college: "Martel",
        email: "va51@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Moiz",
        lastName: "Asif",
        phone: "956-598-4700",
        college: "Hanszen",
        email: "ma187@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Sam",
        lastName: "Balakrishnan",
        phone: "610-235-7362",
        college: "McMurtry",
        email: "sb150@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Varsha",
        lastName: "Chandramouli",
        phone: "317-514-0889",
        college: "Jones",
        email: "vkc1@rice.edu",
        clearances: ["ALS", "SE", "BLS"],
      },
      {
        firstName: "Bami",
        lastName: "Dagim",
        phone: "404-834-4246",
        college: "Lovett",
        email: "bd70@rice.edu",
        clearances: [],
      },
      {
        firstName: "Justin",
        lastName: "Dang",
        phone: "754-802-9425",
        college: "Hanszen",
        email: "jd110@rice.edu",
        clearances: ["ALS", "SE"],
      },
      {
        firstName: "Nandini",
        lastName: "Dasari",
        phone: "469-785-9907",
        college: "Lovett",
        email: "nd68@rice.edu",
        clearances: [],
      },
      {
        firstName: "Malak",
        lastName: "Ettahali",
        phone: "713-306-4747",
        college: "McMurtry",
        email: "me71@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Pedro",
        lastName: "Garza",
        phone: "956-333-7667",
        college: "Will Rice",
        email: "pjg6@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Nimah",
        lastName: "Haidar",
        phone: "346-203-2498",
        college: "Brown",
        email: "nsh2@rice.edu",
        clearances: ["SE", "OBS"],
      },
      {
        firstName: "Samah",
        lastName: "Haidar",
        phone: "346-203-2495",
        college: "Brown",
        email: "sfh5@rice.edu",
        clearances: ["SE", "OBS"],
      },
      {
        firstName: "Ambereen",
        lastName: "Haq",
        phone: "512-964-4399",
        college: "Jones",
        email: "ah158@rice.edu",
        clearances: [],
      },
      {
        firstName: "Diana",
        lastName: "Ho",
        phone: "210-961-1432",
        college: "Wiess",
        email: "dh87@rice.edu",
        clearances: [],
      },
      {
        firstName: "Daniel",
        lastName: "Hong",
        phone: "818-456-8295",
        college: "Brown",
        email: "dh88@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Aayaz",
        lastName: "Husain",
        phone: "919-448-7790",
        college: "Lovett",
        email: "ah287@rice.edu",
        clearances: [],
      },
      {
        firstName: "Christopher",
        lastName: "Kaleekal",
        phone: "713-726-6616",
        college: "Brown",
        email: "ck60@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Ellen",
        lastName: "Kang",
        phone: "714-768-7216",
        college: "Martel",
        email: "eyk5@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Kaitlyn",
        lastName: "Kim",
        phone: "949-545-3337",
        college: "Duncan",
        email: "kk88@rice.edu",
        clearances: [],
      },
      {
        firstName: "Suhani",
        lastName: "Koppolu",
        phone: "970-449-3075",
        college: "Brown",
        email: "sk232@rice.edu",
        clearances: [],
      },
      {
        firstName: "Ilyas",
        lastName: "Kose",
        phone: "908-329-5094",
        college: "Martel",
        email: "ik21@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Ananya",
        lastName: "Lertpradist",
        phone: "210-660-9919",
        college: "Sid Rich",
        email: "al128@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Iris",
        lastName: "Li",
        phone: "224-300-8506",
        college: "McMurtry",
        email: "ijl1@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Michael",
        lastName: "Li",
        phone: "425-698-9369",
        college: "Brown",
        email: "ml221@rice.edu",
        clearances: [],
      },
      {
        firstName: "Andy",
        lastName: "Liu",
        phone: "281-901-0402",
        college: "Duncan",
        email: "al168@rice.edu",
        clearances: [],
      },
      {
        firstName: "Runshan",
        lastName: "Liu",
        phone: "832-396-4129",
        college: "Baker",
        email: "rl112@rice.edu",
        clearances: [],
      },
      {
        firstName: "Katie",
        lastName: "Lu",
        phone: "510-945-9026",
        college: "Brown",
        email: "kcl5@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Abigail",
        lastName: "Ma",
        phone: "281-770-2817",
        college: "Wiess",
        email: "am371@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Ellen",
        lastName: "Maerean",
        phone: "203-788-8015",
        college: "Will Rice",
        email: "ekm6@rice.edu",
        clearances: ["SE", "BLS"],
      },
      {
        firstName: "Jehad",
        lastName: "Mahmoud",
        phone: "346-400-1776",
        college: "Martel",
        email: "jm233@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Nehal",
        lastName: "Patel",
        phone: "832-484-9762",
        college: "Baker",
        email: "nap12@rice.edu",
        clearances: ["SE", "OBS"],
      },
      {
        firstName: "Esteban",
        lastName: "Pierrend",
        phone: "623-202-7666",
        college: "Jones",
        email: "ep78@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Abishai",
        lastName: "Rajan",
        phone: "469-853-4880",
        college: "Martel",
        email: "adr7@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Akshara",
        lastName: "Sankar",
        phone: "214-883-4016",
        college: "McMurtry",
        email: "as386@rice.edu",
        clearances: [],
      },
      {
        firstName: "Esha",
        lastName: "Sarakinti",
        phone: "469-536-7291",
        college: "Will Rice",
        email: "ers15@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Sanjay",
        lastName: "Senthilvelan",
        phone: "832-392-9212",
        college: "Duncan",
        email: "egy1@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Srikar",
        lastName: "Siripuram",
        phone: "713-726-4636",
        college: "Duncan",
        email: "ss301@rice.edu",
        clearances: [],
      },
      {
        firstName: "Michael",
        lastName: "Tsao",
        phone: "832-712-2816",
        college: "Duncan",
        email: "mct15@rice.edu",
        clearances: ["SE", "OBS"],
      },
      {
        firstName: "Ramya",
        lastName: "Viswanathan",
        phone: "602-348-4002",
        college: "Martel",
        email: "rv38@rice.edu",
        clearances: [],
      },
      {
        firstName: "Katie",
        lastName: "Voong",
        phone: "860-818-2659",
        college: "McMurtry",
        email: "kv31@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Charissa",
        lastName: "Wang",
        phone: "817-205-2798",
        college: "Duncan",
        email: "cw212@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Abe",
        lastName: "White",
        phone: "412-735-0967",
        college: "Hanszen",
        email: "aw152@rice.edu",
        clearances: ["OBS"],
      },
      {
        firstName: "Tori",
        lastName: "Xiao",
        phone: "737-202-0626",
        college: "Baker",
        email: "tx22@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Jade",
        lastName: "Xu",
        phone: "734-846-1332",
        college: "McMurtry",
        email: "jx35@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Kevin",
        lastName: "Yang",
        phone: "346-433-5195",
        college: "Will Rice",
        email: "ky32@rice.edu",
        clearances: [],
      },
      {
        firstName: "Eliana",
        lastName: "Yared",
        phone: "469-222-5748",
        college: "Lovett",
        email: "egy1@rice.edu",
        clearances: ["SE"],
      },
      {
        firstName: "Ashley",
        lastName: "Zhang",
        phone: "972-900-3352",
        college: "McMurtry",
        email: "acz5@rice.edu",
        clearances: ["OBS"],
      },
    ],
  },
  {
    title: "Observers",
    contacts: [
      {
        firstName: "Ria",
        lastName: "Chauhan",
        phone: "201-600-9446",
        college: "Hanszen",
        email: "rc183@rice.edu",
        clearances: [],
      },
      {
        firstName: "Elizabeth",
        lastName: "Craig",
        phone: "972-762-9029",
        college: "Duncan",
        email: "ejc16@rice.edu",
        clearances: [],
      },
      {
        firstName: "Emily",
        lastName: "Dodge",
        phone: "512-718-6613",
        college: "Martel",
        email: "ed66@rice.edu",
        clearances: [],
      },
      {
        firstName: "Bella",
        lastName: "Hendricks",
        phone: "832-463-7021",
        college: "Will Rice",
        email: "bh67@rice.edu",
        clearances: [],
      },
      {
        firstName: "Hana",
        lastName: "Jeong",
        phone: "713-702-1462",
        college: "Brown",
        email: "hj56@rice.edu",
        clearances: [],
      },
      {
        firstName: "Sanjana",
        lastName: "Kavula",
        phone: "214-585-8049",
        college: "Hanszen",
        email: "sk285@rice.edu",
        clearances: [],
      },
      {
        firstName: "Jadon",
        lastName: "Lee",
        phone: "972-971-8481",
        college: "Baker",
        email: "jl521@rice.edu",
        clearances: [],
      },
      {
        firstName: "Paul",
        lastName: "Morrison",
        phone: "817-213-7797",
        college: "Baker",
        email: "pm76@rice.edu",
        clearances: [],
      },
      {
        firstName: "Matthew",
        lastName: "Ochoa",
        phone: "682-360-8449",
        college: "Wiess",
        email: "mo57@rice.edu",
        clearances: [],
      },
      {
        firstName: "Cindy",
        lastName: "Shen",
        phone: "832-989-3619",
        college: "Brown",
        email: "cs227@rice.edu",
        clearances: [],
      },
      {
        firstName: "Joseph",
        lastName: "Stroschein",
        phone: "208-631-5365",
        college: "Wiess",
        email: "js368@rice.edu",
        clearances: [],
      },
      {
        firstName: "Sahil",
        lastName: "Veeravalli",
        phone: "309-218-2012",
        college: "Jones",
        email: "sv78@rice.edu",
        clearances: [],
      },
      {
        firstName: "Tin",
        lastName: "Vu",
        phone: "817-781-2448",
        college: "Jones",
        email: "tgv2@rice.edu",
        clearances: [],
      },
    ],
  },
];

export default function Index() {
  const [isAddingContacts, setIsAddingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const filters = ["All", "ALS", "SE", "BLS", "OBS"];

  // Filter and search contacts
  const filteredData = useMemo(() => {
    return CONTACT_DATA.map((category) => ({
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
  }, [searchQuery, selectedFilter]);

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

      for (const category of CONTACT_DATA) {
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
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => makeCall(QUICK_ACCESS.onDutyIncharge)}
        >
          <Text style={styles.quickAccessLabel}>On Duty InCharge</Text>
          <Text style={styles.quickAccessPhone}>
            {QUICK_ACCESS.onDutyIncharge}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAccessButton}
          onPress={() => makeCall(QUICK_ACCESS.captainsPhone)}
        >
          <Text style={styles.quickAccessLabel}>Captain's Phone</Text>
          <Text style={styles.quickAccessPhone}>
            {QUICK_ACCESS.captainsPhone}
          </Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>REMS Contacts</Text>

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

        {filteredData.length > 0 ? (
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
