import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
  TouchableOpacity,
} from "react-native";

import { Picker } from "@react-native-picker/picker";

// ============================================================================
// DRUG CONFIGURATION DATA
// ============================================================================

interface RouteOption {
  label: string;
  value: string;
}

interface DosageConfig {
  pediatric?: {
    formula?: (weight: number) => number;
    max?: number;
    unit?: string;
    notes?: string;
    fixedDose?: string;
  };
  adult?: {
    formula?: (weight: number) => number;
    max?: number;
    unit?: string;
    notes?: string;
    fixedDose?: string;
  };
}

interface DrugConfig {
  label: string;
  value: string;
  routes: RouteOption[];
  dosages: {
    [routeValue: string]: DosageConfig;
  };
}

const DRUG_DATABASE: DrugConfig[] = [
  {
    label: "Epinephrine",
    value: "epinephrine",
    routes: [
      { label: "Anaphylaxis (IM)", value: "im" },
      { label: "Cardiac arrest (IV/IO)", value: "iv_io" },
    ],
    dosages: {
      im: {
        pediatric: {
          formula: (weight) => weight * 0.01,
          max: 0.5,
          unit: "mg",
          notes: "EMT alternative: Epi-Pen Jr 0.15 mg.",
        },
        adult: {
          formula: (weight) => weight * 0.01,
          max: 0.5,
          unit: "mg",
          notes:
            "at AEMT/Paramedic level; consider re-dose q ~3–15 minutes. Or, 0.3 mg (EMT with medical command)",
        },
      },
      iv_io: {
        pediatric: {
          formula: (weight) => weight * 0.01,
          max: 1,
          unit: "mg",
          notes: "every 3-5 minutes while pulseless",
        },
        adult: {
          fixedDose: "1 mg every 3-5 minutes while pulseless",
        },
      },
    },
  },
  {
    label: "Amiodarone",
    value: "amiodarone",
    routes: [
      {
        label: "IV/IO push for arrest; infusion post-ROSC (ALS)",
        value: "iv_io",
      },
    ],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => weight * 5,
          unit: "mg",
        },
        adult: {
          fixedDose:
            "300 mg IV/IO first dose, then 150 mg after 5 min. Post-ROSC: 150 mg IV/IO over 10 minutes.",
        },
      },
    },
  },
  {
    label: "Calcium Chloride",
    value: "calcium_chloride",
    routes: [{ label: "IV/IO", value: "iv_io" }],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => weight * 10,
          max: 1000,
          unit: "mg",
        },
        adult: {
          formula: (weight) => weight * 10,
          max: 1000,
          unit: "mg",
        },
      },
    },
  },
  {
    label: "Sodium Bicarbonate",
    value: "sodium_bicarbonate",
    routes: [{ label: "IV/IO", value: "iv_io" }],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => weight * 1,
          max: 50,
          unit: "mEq",
        },
        adult: {
          formula: (weight) => weight * 1,
          max: 50,
          unit: "mEq",
        },
      },
    },
  },
  {
    label: "Glucagon",
    value: "glucagon",
    routes: [
      { label: "Hypoglycemia without access (IM)", value: "im" },
      { label: "Beta-blocker overdose (ALS) (IV/IO)", value: "iv_io" },
    ],
    dosages: {
      im: {
        pediatric: {
          fixedDose:
            "0.5 mg (if weight < 25 kg). Beta-blocker overdose: 0.03 mg/kg IV/IO (max 1 mg)",
        },
        adult: {
          fixedDose: "1 mg IM if no access. Beta-blocker overdose: 1 mg IV/IO",
        },
      },
      iv_io: {
        pediatric: {
          formula: (weight) => weight * 0.03,
          max: 1,
          unit: "mg",
        },
        adult: {
          fixedDose: "1 mg",
        },
      },
    },
  },
  {
    label: "Dextrose 10% (D10)",
    value: "d10",
    routes: [
      {
        label:
          "IV/IO piggyback drip or extension set; macro drip, drip wide open until response",
        value: "iv_io",
      },
    ],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => 5 * weight,
          max: 250,
          unit: "mL",
          notes: "Stop when BGL > 60 mg/dL and patient improves",
        },
        adult: {
          formula: (weight) => 5 * weight,
          max: 250,
          unit: "mL",
          notes: "Stop when BGL > 60 mg/dL and patient improves",
        },
      },
    },
  },
  {
    label: "Dextrose 25% (D25)",
    value: "d25",
    routes: [{ label: "slow IV/IO", value: "iv_io" }],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => 2 * weight,
          max: 100,
          unit: "mL",
          notes:
            "max is 50-100 mL depending on page variant; commonly used for <25 kg.",
        },
        adult: {
          formula: (weight) => 2 * weight,
          max: 100,
          unit: "mL",
          notes: "alternative to D10/D50 when indicated.",
        },
      },
    },
  },
  {
    label: "Dextrose 50% (D50)",
    value: "d50",
    routes: [{ label: "slow IV/IO", value: "iv_io" }],
    dosages: {
      iv_io: {
        pediatric: {
          formula: (weight) => 1 * weight,
          max: 50,
          unit: "mL",
          notes: "use caution",
        },
        adult: {
          formula: (weight) => 1 * weight,
          max: 50,
          unit: "mL",
        },
      },
    },
  },
  {
    label: "Naloxone (Narcan)",
    value: "narcan",
    routes: [
      {
        label: "IVP/IOP/IM/IN; titrate to effective breathing",
        value: "ivp_iop_im_in",
      },
    ],
    dosages: {
      ivp_iop_im_in: {
        pediatric: {
          formula: (weight) => 0.1 * weight,
          max: 0.4,
          unit: "mg",
          notes: "repeat every 5 minutes to total 4mg",
        },
        adult: {
          fixedDose:
            "0.4 mg every 5 minutes to total 4mg. Consider 4 mg in single-use spray.",
        },
      },
    },
  },
  {
    label: "Albuterol",
    value: "albuterol",
    routes: [{ label: "Nebulized via SVN", value: "svn" }],
    dosages: {
      svn: {
        pediatric: {
          fixedDose:
            "2.5 mg neb for wheeze in anaphylaxis. Repeat per medical control.",
        },
        adult: {
          fixedDose:
            "5 mg neb for wheeze in anaphylaxis. Repeat per medical control.",
        },
      },
    },
  },
  {
    label: "Diphenhydramine",
    value: "diphenhydramine",
    routes: [
      { label: "IV", value: "iv" },
      { label: "No IV access (IM)", value: "im" },
    ],
    dosages: {
      iv: {
        pediatric: {
          fixedDose:
            "Per protocol (weight-based not specified on extracted lines).",
        },
        adult: {
          fixedDose: "50 mg IV (IM if needed).",
        },
      },
      im: {
        pediatric: {
          fixedDose:
            "Per protocol (weight-based not specified on extracted lines).",
        },
        adult: {
          fixedDose: "50 mg IV (IM if needed).",
        },
      },
    },
  },
  {
    label: "Methylprednisolone",
    value: "methylprednisolone",
    routes: [{ label: "IV", value: "iv" }],
    dosages: {
      iv: {
        pediatric: {
          formula: (weight) => 1 * weight,
          max: 125,
          unit: "mg",
        },
        adult: {
          formula: (weight) => 1 * weight,
          max: 125,
          unit: "mg",
        },
      },
    },
  },
  {
    label: "Loratadine (Claritin)",
    value: "claritin",
    routes: [{ label: "PO", value: "po" }],
    dosages: {
      po: {
        pediatric: {
          fixedDose:
            "2-5 years: 5 mg PO; 0-6 years: 10 mg PO (acute allergic reaction).",
        },
        adult: {
          fixedDose: "10 mg PO for acute urticaria/allergic reaction.",
        },
      },
    },
  },
  {
    label: "Aspirin",
    value: "aspirin",
    routes: [{ label: "PO", value: "po" }],
    dosages: {
      po: {
        pediatric: {
          fixedDose: "N/A",
        },
        adult: {
          fixedDose: "324 mg",
          notes: "Chewed when MI suspected",
        },
      },
    },
  },
  {
    label: "Oral Glucose",
    value: "oral_glucose",
    routes: [{ label: "PO", value: "po" }],
    dosages: {
      po: {
        pediatric: {
          fixedDose: "7.5g Oral Glucose PO",
        },
        adult: {
          fixedDose: "15g Oral Glucose PO",
        },
      },
    },
  },
  {
    label: "Nitroglycerin",
    value: "nitroglycerin",
    routes: [{ label: "Sublingual", value: "sublingual" }],
    dosages: {
      sublingual: {
        pediatric: {
          fixedDose: "N/A",
        },
        adult: {
          fixedDose:
            "0.4 mg SL every 3–5 min if SBP > 100 mmHg. Place IV before 2nd dose; consider med command if age ≤ 40",
        },
      },
    },
  },
];

// ============================================================================
// CALCULATION LOGIC
// ============================================================================

function calculateDosage(
  drugValue: string | null,
  routeValue: string | null,
  ageGroup: string | null,
  weightKg: number
): string {
  if (!drugValue || !routeValue || !ageGroup || !weightKg) {
    return "";
  }

  const drug = DRUG_DATABASE.find((d) => d.value === drugValue);
  if (!drug) return "";

  const dosageConfig = drug.dosages[routeValue];
  if (!dosageConfig) return "";

  const config =
    ageGroup === "pediatric" ? dosageConfig.pediatric : dosageConfig.adult;
  if (!config) return "";

  // Handle fixed dose
  if (config.fixedDose) {
    return config.fixedDose;
  }

  // Handle calculated dose
  if (config.formula) {
    let dose = config.formula(weightKg);

    // Apply maximum if specified
    if (config.max !== undefined && dose > config.max) {
      dose = config.max;
    }

    dose = parseFloat(dose.toFixed(2));

    let result = `${dose} ${config.unit || ""}`.trim();

    // Add notes if specified
    if (config.notes) {
      result += `. ${config.notes}`;
    }

    return result;
  }

  return "";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Index() {
  // Drug dropdown
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [showDrugPicker, setShowDrugPicker] = useState(false);
  const [drugItems] = useState(
    DRUG_DATABASE.map((drug) => ({
      label: drug.label,
      value: drug.value,
    }))
  );

  // Route dropdown
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const [filteredDrugItems, setFilteredDrugItems] = useState(drugItems);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routeItems, setRouteItems] = useState<RouteOption[]>([
    { label: "Please select drug", value: "" },
  ]);

  // Age group dropdown
  const [ageGroup, setAgeGroup] = useState<string | null>(null);

  // Weight input
  const [weight, setWeight] = useState("");
  const [isLbs, setIsLbs] = useState(false);
  const [weightFocused, setWeightFocused] = useState(false);

  // Calculated result
  const [dosage, setDosage] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const weightBorderAnim = useRef(new Animated.Value(0)).current;
  const resultCardScale = useRef(new Animated.Value(1)).current;
  const toggleSlideAnim = useRef(new Animated.Value(0)).current; // 0 for lbs, 1 for kg

  // Update routes when drug changes
  React.useEffect(() => {
    if (selectedDrug) {
      const drug = DRUG_DATABASE.find((d) => d.value === selectedDrug);
      if (drug) {
        setRouteItems(drug.routes);
        setSelectedRoute(null); // Reset route when drug changes
      }
    }
  }, [selectedDrug]);

  useEffect(() => {
    if (drugSearchQuery.trim() === "") {
      setFilteredDrugItems(drugItems);
    } else {
      const filtered = drugItems.filter((drug) =>
        drug.label.toLowerCase().includes(drugSearchQuery.toLowerCase())
      );
      setFilteredDrugItems(filtered);
    }
  }, [drugSearchQuery, drugItems]);

  // Recalculate dosage when inputs change
  React.useEffect(() => {
    if (weight && selectedDrug && selectedRoute && ageGroup) {
      let weightNum = parseFloat(weight);

      // Convert pounds to kilograms
      if (isLbs) {
        weightNum = weightNum * 0.45359237;
      }

      const result = calculateDosage(
        selectedDrug,
        selectedRoute,
        ageGroup,
        weightNum
      );
      setDosage(result);
    } else {
      setDosage("");
    }
  }, [weight, selectedDrug, selectedRoute, ageGroup, isLbs]);

  // Animate dosage result when it changes
  useEffect(() => {
    if (dosage && dosage !== "XXX") {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(-20);

      // Run animations in parallel
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse the result card
      Animated.sequence([
        Animated.timing(resultCardScale, {
          toValue: 1.02,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(resultCardScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset to initial state if no dosage
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [dosage, fadeAnim, scaleAnim, slideAnim, resultCardScale]);

  // Animate weight input border on focus
  useEffect(() => {
    Animated.timing(weightBorderAnim, {
      toValue: weightFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [weightFocused, weightBorderAnim]);

  // Animate lb/kg toggle with sliding animation
  useEffect(() => {
    Animated.spring(toggleSlideAnim, {
      toValue: isLbs ? 0 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isLbs, toggleSlideAnim]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ alignItems: "center", width: "100%" }}
      >
        <Animated.View
          style={[
            styles.result,
            {
              transform: [{ scale: resultCardScale }],
            },
          ]}
        >
          <View style={styles.white}>
            <Text>Hello</Text>
          </View>
          <Text style={styles.title}>Dosage Calculator</Text>
          <Animated.Text
            style={[
              styles.dosageText,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            {dosage || "XXX"}
          </Animated.Text>
        </Animated.View>

        <View style={styles.border}>
          <Text style={styles.label}>Drug Administered</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDrugPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {selectedDrug
                ? drugItems.find((d) => d.value === selectedDrug)?.label
                : "Select a drug..."}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={showDrugPicker}
            transparent={true}
            animationType="slide"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowDrugPicker(false);
                  setDrugSearchQuery("");
                }}
              />
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Drug</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDrugPicker(false);
                      setDrugSearchQuery("");
                    }}
                  >
                    <Text style={styles.modalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search drugs..."
                    value={drugSearchQuery}
                    onChangeText={setDrugSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {drugSearchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setDrugSearchQuery("")}
                      style={styles.clearButton}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.pickerScrollView}>
                  <Picker
                    selectedValue={selectedDrug}
                    onValueChange={(itemValue) => setSelectedDrug(itemValue)}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="Select a drug..." value={null} />
                    {filteredDrugItems.map((drug) => (
                      <Picker.Item
                        key={drug.value}
                        label={drug.label}
                        value={drug.value}
                      />
                    ))}
                  </Picker>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          <Text style={styles.label}>Route of Administration:</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              !selectedDrug && styles.pickerButtonDisabled,
            ]}
            onPress={() => selectedDrug && setShowRoutePicker(true)}
            disabled={!selectedDrug}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedDrug && styles.pickerButtonTextDisabled,
              ]}
            >
              {selectedRoute
                ? routeItems.find((r) => r.value === selectedRoute)?.label
                : "Select a route..."}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={showRoutePicker}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowRoutePicker(false)}
              />
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowRoutePicker(false)}>
                    <Text style={styles.modalDoneButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={selectedRoute}
                  onValueChange={(itemValue) => setSelectedRoute(itemValue)}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a route..." value={null} />
                  {routeItems.map((route) => (
                    <Picker.Item
                      key={route.value}
                      label={route.label}
                      value={route.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Weight</Text>
          <Animated.View
            style={[
              styles.weightInputContainer,
              {
                borderBottomColor: weightBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#e0e0e0", "#003686"],
                }),
                borderBottomWidth: weightBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ]}
          >
            <TextInput
              style={styles.weightInput}
              placeholder=""
              keyboardType="decimal-pad"
              value={weight}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              onChangeText={(text) => {
                // Only allow numbers and decimal point
                const numericValue = text.replace(/[^0-9.]/g, "");
                // Prevent multiple decimal points
                const parts = numericValue.split(".");
                const validValue =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : numericValue;
                setWeight(validValue);
              }}
            />
            <View style={styles.toggleContainerInside}>
              <Animated.View
                style={[
                  styles.toggleSlider,
                  {
                    transform: [
                      {
                        translateX: toggleSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 52], // Width adjusted to match button size
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text
                style={[
                  styles.toggleButton,
                  isLbs && styles.toggleButtonActive,
                ]}
                onPress={() => setIsLbs(true)}
              >
                lb
              </Text>
              <Text
                style={[
                  styles.toggleButton,
                  !isLbs && styles.toggleButtonActive,
                ]}
                onPress={() => setIsLbs(false)}
              >
                kg
              </Text>
            </View>
          </Animated.View>

          <Text style={styles.label}>Age Group:</Text>
          <View style={styles.ageGroupButtonContainer}>
            <TouchableOpacity
              style={[
                styles.ageGroupButton,
                ageGroup === "pediatric" && styles.ageGroupButtonActive,
              ]}
              onPress={() => setAgeGroup("pediatric")}
            >
              <Text
                style={[
                  styles.ageGroupButtonText,
                  ageGroup === "pediatric" && styles.ageGroupButtonTextActive,
                ]}
              >
                Pediatric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ageGroupButton,
                ageGroup === "adult" && styles.ageGroupButtonActive,
              ]}
              onPress={() => setAgeGroup("adult")}
            >
              <Text
                style={[
                  styles.ageGroupButtonText,
                  ageGroup === "adult" && styles.ageGroupButtonTextActive,
                ]}
              >
                Adult
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  weightInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 55,
    borderRadius: 8,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 20,
  },
  weightInput: {
    flex: 1,
    fontSize: 16,
    color: "#133465",
    fontWeight: "bold",
  },
  toggleContainerInside: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    padding: 3,
    position: "relative",
  },
  toggleSlider: {
    position: "absolute",
    width: 52,
    height: 32,
    backgroundColor: "#fff",
    borderRadius: 18,
    left: 3,
    top: 1,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "500",
    color: "#666",
    zIndex: 1,
    width: 52,
    textAlign: "center",
  },
  toggleButtonActive: {
    backgroundColor: "transparent",
    color: "#003686",
    fontWeight: "600",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    overflow: "visible",
  },
  label: {
    fontSize: 16,
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 5,
    color: "#989898",
  },
  pickerContainer: {
    width: "100%",
    height: 55,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 20,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    height: 55,
    color: "#133465",
  },
  pickerItem: {
    height: 300,
    color: "#133465",
    fontWeight: "bold",
  },
  pickerButton: {
    height: 55,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 20,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#133465",
    fontWeight: "bold",
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  pickerButtonTextDisabled: {
    color: "#999",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalDoneButton: {
    fontSize: 17,
    color: "#007AFF",
    fontWeight: "600",
  },
  result: {
    width: "100%",
    backgroundColor: "white",
    paddingBottom: 30,
    borderRadius: 30,
    marginBottom: 30,
    justifyContent: "flex-end",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: "stretch",
    overflow: "visible",
  },
  title: {
    fontSize: 15,
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "white",
  },
  dosageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003686",
    backgroundColor: "white",
    textAlign: "center",
  },
  border: {
    padding: 12,
  },
  white: {
    backgroundColor: "white",
    position: "absolute",
    top: -130,
    left: -50,
    width: 1000,
    height: 200,
  },
  ageGroupButtonContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    gap: 10,
  },
  ageGroupButton: {
    flex: 1,
    height: 55,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  ageGroupButtonActive: {
    backgroundColor: "#003686",
    borderColor: "#003686",
  },
  ageGroupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  ageGroupButtonTextActive: {
    color: "white",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    position: "relative",
  },
  searchInput: {
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#133465",
  },
  clearButton: {
    position: "absolute",
    right: 24,
    top: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  pickerScrollView: {
    maxHeight: 400,
  },
});
