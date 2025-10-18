import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";

import DropDownPicker from "react-native-dropdown-picker";

export default function Index() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState([
    { label: "Epinephrine", value: "epinephrine" },
  ]);

  const [routeOpen, setRouteOpen] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeItems, setRouteItems] = useState([
    { label: "Oral", value: "oral" },
  ]);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [isLbs, setIsLbs] = useState(false);
  const [dosage, setDosage] = useState("");

  const calculateDosage = () => {
    const ageNum = parseFloat(age);
    let weightNum = parseFloat(weight);

    if (isNaN(ageNum) || isNaN(weightNum)) {
      setDosage("Please enter valid age and weight.");
      return;
    }

    // Convert weight to kilograms if the unit is pounds
    if (isLbs) {
      weightNum = weightNum * 0.453592;
    }

    let result = 0;
    switch (value) {
      case "epinephrine":
        result = weightNum * 10;
        break;
      default:
        result = 0;
    }

    setDosage(`${result.toFixed(1)} mg`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dosage Calculator</Text>

      <DropDownPicker
        searchable={true}
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        placeholder="Select Drug"
        listMode="SCROLLVIEW"
        style={[styles.dropdown, { marginBottom: 20 }]}
      />

      <Text style={styles.label}>Age (years):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <View style={styles.weightContainer}>
        <Text style={styles.label}>Weight (kgs):</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>lbs</Text>
          <Switch value={isLbs} onValueChange={setIsLbs} />
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder={`Enter weight in ${isLbs ? "lbs" : "kg"}`}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <DropDownPicker
        searchable={true}
        open={routeOpen}
        value={route}
        items={routeItems}
        setOpen={setRouteOpen}
        setValue={setRoute}
        setItems={setRouteItems}
        placeholder="Select Route of Administration"
        listMode="SCROLLVIEW"
        style={[styles.dropdown, { marginBottom: 20 }]}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Calculate" onPress={calculateDosage} />
      </View>

      {dosage ? <Text style={styles.result}>Dosage: {dosage}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 5,
  },
  dropdown: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    height: 55,
    marginBottom: 20,
  },
  result: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: "500",
  },
});
