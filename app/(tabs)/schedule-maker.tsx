import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Types
interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
  role: "In-Charge" | "ALS-cleared" | "Observer";
}

// Helper to get week dates
const getWeekDates = (referenceDate: Date): Date[] => {
  const day = referenceDate.getDay();
  const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(referenceDate);
  monday.setDate(diff);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
};

const formatDateRange = (start: Date, end: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString(
    "en-US",
    options
  )} - ${end.toLocaleDateString("en-US", options)}`;
};

const formatFullDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Sample data - replace with your actual data source
const SAMPLE_SHIFTS: Shift[] = [
  {
    id: "1",
    startTime: "9:00 pm",
    endTime: "11:00 pm",
    name: "Jane Doe",
    role: "In-Charge",
  },
  {
    id: "2",
    startTime: "9:00 pm",
    endTime: "11:00 pm",
    name: "Jane Doe",
    role: "In-Charge",
  },
  {
    id: "3",
    startTime: "9:00 pm",
    endTime: "11:00 pm",
    name: "Jane Doe",
    role: "ALS-cleared",
  },
  {
    id: "4",
    startTime: "9:00 pm",
    endTime: "11:00 pm",
    name: "Jane Doe",
    role: "ALS-cleared",
  },
  {
    id: "5",
    startTime: "11:00 pm",
    endTime: "1:00 am",
    name: "Jane Doe",
    role: "Observer",
  },
  {
    id: "6",
    startTime: "11:00 pm",
    endTime: "1:00 am",
    name: "Jane Doe",
    role: "Observer",
  },
];

type FilterType = "all" | "my" | "open";

export default function ScheduleMakerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    return getWeekDates(now)[0];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const weekDates = getWeekDates(currentWeekStart);
  const weekEnd = weekDates[6];

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleRequestSwitch = (shiftId: string) => {
    console.log("Request switch for shift:", shiftId);
  };

  const handleAddShift = () => {
    console.log("Add new shift");
  };

  // Theme colors
  const colors = {
    background: isDark ? "#121212" : "#FFFFFF",
    surface: isDark ? "#1E1E1E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1a365d",
    textSecondary: isDark ? "#A0A0A0" : "#4a5568",
    border: isDark ? "#333333" : "#E2E8F0",
    primary: "#1a365d",
    primaryLight: isDark ? "#2d4a6f" : "#EBF4FF",
    accent: isDark ? "#4A90D9" : "#1a365d",
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: isDark ? "#333" : "#E2E8F0" },
          ]}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>REMS</Text>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <Text style={[styles.dateRange, { color: colors.text }]}>
          {formatDateRange(currentWeekStart, weekEnd)}
        </Text>
        <View style={styles.navButtons}>
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: colors.text }]}>
              {"<"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: colors.text }]}>
              {">"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Week View */}
      <View style={styles.calendarRow}>
        {weekDates.map((date, index) => {
          const isSelected =
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayColumn}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                {DAY_NAMES[index]}
              </Text>
              <View
                style={[
                  styles.dateCircle,
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    { color: isSelected ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {date.getDate()}
                </Text>
                {isSelected && <View style={styles.selectedDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "all" && styles.filterButtonActive,
            activeFilter === "all" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: activeFilter === "all" ? "#FFFFFF" : colors.text },
            ]}
          >
            All shifts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "my" && styles.filterButtonActive,
            activeFilter === "my" && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setActiveFilter("my")}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: activeFilter === "my" ? "#FFFFFF" : colors.text },
            ]}
          >
            My shifts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === "open" && styles.filterButtonActive,
            activeFilter === "open" && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setActiveFilter("open")}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: activeFilter === "open" ? "#FFFFFF" : colors.text },
            ]}
          >
            Open shifts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.border }]}
          onPress={handleAddShift}
        >
          <Text style={[styles.addButtonText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Selected Date Header */}
      <Text style={[styles.selectedDateHeader, { color: colors.text }]}>
        {formatFullDate(selectedDate)}
      </Text>

      {/* Shifts List */}
      <ScrollView
        style={styles.shiftsList}
        showsVerticalScrollIndicator={false}
      >
        {SAMPLE_SHIFTS.map((shift) => (
          <View
            key={shift.id}
            style={[
              styles.shiftCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.shiftTime}>
              <Text style={[styles.timeText, { color: colors.text }]}>
                {shift.startTime}
              </Text>
              <Text style={[styles.timeText, { color: colors.text }]}>
                {shift.endTime}
              </Text>
            </View>

            <View style={styles.shiftInfo}>
              <Text style={[styles.shiftName, { color: colors.text }]}>
                {shift.name}
              </Text>
              <Text style={[styles.shiftRole, { color: colors.textSecondary }]}>
                {shift.role}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.switchButton, { borderColor: colors.accent }]}
              onPress={() => handleRequestSwitch(shift.id)}
            >
              <Text style={[styles.switchButtonText, { color: colors.accent }]}>
                Request switch
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  weekNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateRange: {
    fontSize: 16,
    fontWeight: "600",
  },
  navButtons: {
    flexDirection: "row",
    gap: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: "500",
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: "center",
  },
  dayName: {
    fontSize: 14,
    marginBottom: 8,
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectedDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonActive: {
    borderColor: "transparent",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: "300",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  selectedDateHeader: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  shiftsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  shiftCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  shiftTime: {
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  shiftRole: {
    fontSize: 14,
  },
  switchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
