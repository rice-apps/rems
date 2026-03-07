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
  ActivityIndicator,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/supabase";

// ============================================================================
// CLEARANCE LEVELS
// ============================================================================

const CLEARANCE_HIERARCHY: Record<string, number> = {
  OBS: 0,   // Observer
  BLS: 1,   // EMT / Basic Life Support
  SE: 2,    // AEMT / Special Events
  ALS: 3,   // Advanced Life Support
};

const CLEARANCE_LABELS: Record<string, string> = {
  OBS: "Observer",
  BLS: "EMT",
  SE: "AEMT",
  ALS: "ALS",
};

// Incharge category_id in the contacts table
const INCHARGE_CATEGORY_ID = 2;

interface DrugPermission {
  minLevel: number;
  approval?: string;
  inchargeOnly?: boolean;
}

function getUserClearanceLevel(clearances: string[]): { level: number; key: string } {
  let highest = { level: -1, key: "OBS" };
  for (const c of clearances) {
    const upper = c.toUpperCase();
    const level = CLEARANCE_HIERARCHY[upper];
    if (level !== undefined && level > highest.level) {
      highest = { level, key: upper };
    }
  }
  return highest.level >= 0 ? highest : { level: 0, key: "OBS" };
}

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
    label: "Dextrose",
    value: "dextrose",
    routes: [
      { label: "D10 IV/IO (drip wide open until response)", value: "d10_iv" },
      { label: "D25 slow IV/IO", value: "d25_iv" },
      { label: "D50 slow IV/IO", value: "d50_iv" },
    ],
    dosages: {
      d10_iv: {
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
      d25_iv: {
        pediatric: {
          formula: (weight) => 2 * weight,
          max: 100,
          unit: "mL",
          notes: "Commonly used for <25 kg",
        },
        adult: {
          formula: (weight) => 2 * weight,
          max: 100,
          unit: "mL",
        },
      },
      d50_iv: {
        pediatric: {
          formula: (weight) => 1 * weight,
          max: 50,
          unit: "mL",
          notes: "Use caution",
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
  const { session } = useSession();

  // Clearance state
  const [userClearance, setUserClearance] = useState<{ level: number; key: string } | null>(null);
  const [isIncharge, setIsIncharge] = useState(false);
  const [drugPermissions, setDrugPermissions] = useState<Record<string, DrugPermission>>({});
  const [clearanceLoading, setClearanceLoading] = useState(true);

  // Fetch user clearance, category, and drug permissions from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const email = session?.user?.email;

      // Fetch drug permissions (always, even without a session)
      const { data: permsData } = await supabase
        .from("drug_permissions")
        .select("drug_value, min_level, approval, incharge_only");

      if (permsData) {
        const permsMap: Record<string, DrugPermission> = {};
        for (const row of permsData) {
          permsMap[row.drug_value] = {
            minLevel: row.min_level,
            approval: row.approval ?? undefined,
            inchargeOnly: row.incharge_only,
          };
        }
        setDrugPermissions(permsMap);
      }

      if (!email) {
        setClearanceLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("contacts")
          .select("clearances, category_id")
          .ilike("email", email.toLowerCase())
          .single();

        if (data) {
          setIsIncharge(data.category_id === INCHARGE_CATEGORY_ID);
          if (data.clearances?.length) {
            setUserClearance(getUserClearanceLevel(data.clearances));
          } else {
            setUserClearance({ level: 0, key: "OBS" });
          }
        } else {
          setUserClearance({ level: 0, key: "OBS" });
        }
      } catch {
        setUserClearance({ level: 0, key: "OBS" });
      } finally {
        setClearanceLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // All drugs visible to everyone
  const drugItems = DRUG_DATABASE.map((drug) => ({
    label: drug.label,
    value: drug.value,
  }));

  // Drug dropdown
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [showDrugPicker, setShowDrugPicker] = useState(false);

  // Approval warning adjusts based on clearance level and incharge status
  const getApprovalNote = (drugValue: string): string | undefined => {
    if (!userClearance) return undefined;
    const perm = drugPermissions[drugValue];
    if (!perm) return undefined;

    // Medical Command approval is always required regardless of level
    if (perm.approval?.includes("Medical Command")) return perm.approval;

    // Incharges get full access (no approval warnings)
    if (isIncharge) return undefined;

    // Incharge-only drugs — non-incharges can't give these
    if (perm.inchargeOnly) return "Incharge only — above your clearance";

    // Below min clearance level
    if (userClearance.level < perm.minLevel) {
      return "Above your clearance — requires approval";
    }

    return perm.approval;
  };

  const selectedDrugApproval = selectedDrug
    ? getApprovalNote(selectedDrug)
    : undefined;

  // Route dropdown
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routeItems, setRouteItems] = useState<RouteOption[]>([
    { label: "Please select drug", value: "" },
  ]);

  // Age group
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerBrand}>REMS</Text>
            <Text style={styles.headerSubtitle}>Dosage Calculator</Text>
          </View>
          {userClearance && (
            <View style={styles.clearanceBadge}>
              <Text style={styles.clearanceBadgeText}>
                {isIncharge ? "Incharge" : (CLEARANCE_LABELS[userClearance.key] || userClearance.key)}
              </Text>
            </View>
          )}
        </View>

        {/* Loading state */}
        {clearanceLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1E40AF" />
            <Text style={styles.loadingText}>Loading clearance...</Text>
          </View>
        )}

        {/* Calculator */}
        {!clearanceLoading && userClearance && (
          <>
        {/* Form */}
        <View style={styles.form}>
          {/* Age Group — inline toggle */}
          <View style={styles.ageToggleRow}>
            <TouchableOpacity
              style={[
                styles.ageToggleButton,
                ageGroup === "pediatric" && styles.ageToggleButtonActive,
              ]}
              onPress={() => setAgeGroup("pediatric")}
            >
              <Text
                style={[
                  styles.ageToggleText,
                  ageGroup === "pediatric" && styles.ageToggleTextActive,
                ]}
              >
                Pediatric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ageToggleButton,
                ageGroup === "adult" && styles.ageToggleButtonActive,
              ]}
              onPress={() => setAgeGroup("adult")}
            >
              <Text
                style={[
                  styles.ageToggleText,
                  ageGroup === "adult" && styles.ageToggleTextActive,
                ]}
              >
                Adult
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Drug</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDrugPicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedDrug && styles.pickerButtonPlaceholder,
              ]}
            >
              {selectedDrug
                ? drugItems.find((d) => d.value === selectedDrug)?.label
                : "Select a drug..."}
            </Text>
            <Text style={styles.pickerChevron}>›</Text>
          </TouchableOpacity>
          {selectedDrugApproval ? (
            <View style={styles.approvalNote}>
              <Text style={styles.approvalNoteText}>{selectedDrugApproval}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Route</Text>
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
                (!selectedRoute || !selectedDrug) &&
                  styles.pickerButtonPlaceholder,
              ]}
            >
              {selectedRoute
                ? routeItems.find((r) => r.value === selectedRoute)?.label
                : "Select a route..."}
            </Text>
            <Text style={styles.pickerChevron}>›</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Weight</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              placeholder="Enter weight"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={weight}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9.]/g, "");
                const parts = numericValue.split(".");
                const validValue =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : numericValue;
                setWeight(validValue);
              }}
            />
            <View style={styles.toggleContainer}>
              <Animated.View
                style={[
                  styles.toggleSlider,
                  {
                    transform: [
                      {
                        translateX: toggleSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 48],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text
                style={[
                  styles.toggleOption,
                  isLbs && styles.toggleOptionActive,
                ]}
                onPress={() => setIsLbs(true)}
              >
                lb
              </Text>
              <Text
                style={[
                  styles.toggleOption,
                  !isLbs && styles.toggleOptionActive,
                ]}
                onPress={() => setIsLbs(false)}
              >
                kg
              </Text>
            </View>
          </View>
        </View>

        {/* Result Card */}
        <Animated.View
          style={[
            styles.resultCard,
            dosage ? styles.resultCardActive : null,
            { transform: [{ scale: resultCardScale }] },
          ]}
        >
          <Text style={styles.resultLabel}>
            {dosage ? "Calculated Dosage" : "Fill in all fields above"}
          </Text>
          <Animated.Text
            style={[
              styles.dosageText,
              dosage ? styles.dosageTextActive : null,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            {dosage || "—"}
          </Animated.Text>
          {selectedDrugApproval && dosage ? (
            <View style={styles.approvalBanner}>
              <Text style={styles.approvalBannerText}>{selectedDrugApproval}</Text>
            </View>
          ) : null}
        </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Picker Modals */}
      <Modal visible={showDrugPicker} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDrugPicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDrugPicker(false)}>
                <Text style={styles.modalDoneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedDrug}
              onValueChange={(itemValue) => setSelectedDrug(itemValue)}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Select a drug..." value={null} />
              {drugItems.map((drug) => (
                <Picker.Item
                  key={drug.value}
                  label={drug.label}
                  value={drug.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      <Modal visible={showRoutePicker} transparent animationType="fade">
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

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerBrand: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
  },
  clearanceBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearanceBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#888",
  },
  observerCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  observerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  observerText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  approvalBanner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  approvalBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  approvalNote: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  approvalNoteText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#92400E",
  },
  resultCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    marginBottom: 24,
  },
  resultCardActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#1E40AF",
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#888",
    marginBottom: 8,
  },
  dosageText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ccc",
    textAlign: "center",
    lineHeight: 30,
  },
  dosageTextActive: {
    color: "#1E40AF",
  },
  form: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  ageToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  ageToggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  ageToggleButtonActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#1E40AF",
  },
  ageToggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999",
  },
  ageToggleTextActive: {
    color: "#1E40AF",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: "#999",
    fontWeight: "400",
  },
  pickerButtonDisabled: {
    opacity: 0.4,
  },
  pickerChevron: {
    fontSize: 22,
    color: "#999",
    fontWeight: "300",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  weightInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    padding: 3,
    position: "relative",
  },
  toggleSlider: {
    position: "absolute",
    width: 48,
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    left: 3,
    top: 3,
  },
  toggleOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    zIndex: 1,
    width: 48,
    textAlign: "center",
  },
  toggleOptionActive: {
    color: "#1E40AF",
    fontWeight: "600",
  },
  pickerItem: {
    height: 120,
    color: "#333",
    fontWeight: "600",
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalDoneButton: {
    fontSize: 17,
    color: "#1E40AF",
    fontWeight: "600",
  },
});
