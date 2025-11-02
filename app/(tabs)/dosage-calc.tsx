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
    { label: "Amiodarone", value: "amiodarone" },
    { label: "Calcium Chloride", value: "calcium chloride" },
    { label: "sodium bicarbonate", value: "sodium bicarbonate" },
    { label: "glucagon", value: "glucagon" },
    { label: "Dextrose 10% (D10)", value: "d10" },
    { label: "Dextrose 25% (D25)", value: "d25" },
    { label: "Dextrose 50% (D50)", value: "d50" },
    { label: "Naloxone (Narcan)", value: "narcan" },
    { label: "Albuterol", value: "albuterol" },
    { label: "Diphenhydramine", value: "diphenhydramine" },
    { label: "Methylprednisolone", value: "methylprednisolone" },
    { label: "Loratadine (Claritin)", value: "claritin" },
  ]);

  // Age Group dropdown
  const [ageGroupOpen, setAgeGroupOpen] = useState(false);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [ageGroupItems, setAgeGroupItems] = useState([
    { label: "Pediatric", value: "pediatric" },
    { label: "Adult", value: "adult" },
  ]);

  //Route of Administration Dropdown
  const [routeOpen, setRouteOpen] = useState(false);
  const [route, setRoute] = useState<string | null>(null);
  const [routeItems, setRouteItems] = useState([
    { label: "Anaphylaxis", value: "anaphylaxis" },
    { label: "Cardiac arrest", value: "cardiac arrest" },
    { label: "Refractory anaphylaxis", value: "refractory anaphylaxis" },
    { label: "IV/IO", value: "iv/io" },
    { label: "Refractory anaphylaxis", value: "refractory anaphylaxis" },
  ]);
  const [weight, setWeight] = useState("");
  const [isLbs, setIsLbs] = useState(false);
  const [dosage, setDosage] = useState("");

  const makeAdminister = () => {
    let administrationMethod = [{ label: "", value: "" }];
    switch (value) {
      case "epinephrine":
        administrationMethod = [
          { label: "Anaphylaxis (IM)", value: "im_epinephrine" },
          { label: "Cardiac arrest (IV/IO)", value: "iv/io_ephinephrine" },
        ];
        break;
      case "amiodarone":
        administrationMethod = [
          {
            label: "IV/IO push for arrest; infusion post-ROSC (ALS)",
            value: "iv/io_amoidarone",
          },
        ];
        break;
      case "calcium chloride":
      case "sodium bicarbonate":
        administrationMethod = [
          { label: "IV/IO", value: "iv/io_calciumchloridesodiumbicarbonate" },
        ];
        break;
      case "glucagon":
        administrationMethod = [
          { label: "Hypoglecemia without access (IM)", value: "im_glucagon" },
          {
            label: "beta-blocker overdose (ALS) (IV/IO)",
            value: "iv/io_glucagon",
          },
        ];
        break;
      case "d10":
        administrationMethod = [
          {
            label:
              "IV/IO piggyback drip or extension set; macro drip, drip wide open until response",
            value: "iv/io_d10",
          },
        ];
        break;
      case "d25":
      case "d50":
        administrationMethod = [{ label: "slow IV/IO", value: "iv/io_d25d50" }];
        break;
      case "narcan":
        administrationMethod = [
          {
            label: "IVP/IOP/IM/IN; titrate to effective breathing",
            value: "ivp/iop/im/in_narcan",
          },
        ];
        break;
      case "albuterol":
        administrationMethod = [
          { label: "Nebulized via SVN", value: "svn_albuterol" },
        ];
        break;
      case "diphenhydramine":
        administrationMethod = [
          { label: "IV", value: "iv_diphenhydramine" },
          { label: "no IV access (IM)", value: "im_diphenhydramine" },
        ];
        break;
      case "methylprednisolone":
        administrationMethod = [
          { label: "IV", value: "iv_methylprednisolone" },
        ];
        break;
      case "claritin":
        administrationMethod = [{ label: "PO", value: "po_calaritin" }];
        break;
    }
    setRouteItems(administrationMethod);
  };

  const calculateDosage = () => {
    if (!ageGroup) {
      setDosage("Please select an age group.");
      return;
    }

    let weightNum = parseFloat(weight);

    if (isNaN(weightNum)) {
      setDosage("Please enter a valid weight.");
      return;
    }

    // Convert weight to kilograms if the unit is pounds
    if (isLbs) {
      weightNum = weightNum * 0.45359237;
    }

    let result = "";
    console.log("value:", value, "route:", route, "weightNum:", weightNum);
    switch (ageGroup) {
      case "pediatric":
        switch (value) {
          case "epinephrine":
            switch (route) {
              case "im_epinephrine":
                let temp = weightNum * 0.01;
                if (temp > 0.5) {
                  temp = 0.5;
                }
                result = temp.toString() + "mg";
                result += " EMT alternative: Epi-Pen Jr 0.15 mg.";
                break;
              case "iv/io_ephinephrine":
                let temp1 = weightNum * 0.01;
                if (temp1 > 1) {
                  temp1 = 1;
                }
                result = temp1.toString() + "mg";
                result = result + " every 3-5 minutes while pulseless";
                break;
            }
            break;
          case "amiodarone":
            let temp2 = weightNum * 5;
            result = temp2.toString() + "mg";
            break;
          case "calcium chloride":
            let temp3 = weightNum * 10;
            if (temp3 > 1000) {
              temp3 = 1000;
            }
            result = temp3.toString() + "mg";
            break;
          case "sodium bicarbonate":
            let temp4 = weightNum * 1;
            if (temp4 > 50) {
              temp4 = 50;
            }
            result = temp4.toString() + "mEq";
            break;
          case "glucagon":
            //NOT SURE ABOUT THESE
            switch (route) {
              case "im_glucagon":
                if (weightNum < 25) {
                  result = (0.5).toString() + "mg";
                } else {
                  result = "error: not seen on spreadsheet";
                }
                break;
              case "iv/io_glucagon":
                let temp5 = weightNum * 0.03;
                if (temp5 > 1) {
                  temp5 = 1;
                }
                result = temp5 + "mg";
                break;
            }
            break;
          case "d10":
            let temp6 = 5 * weightNum;
            if (temp6 > 250) {
              temp6 = 250;
            }
            result = temp6.toString() + "mL";
            result += ". Stop when BGL > 60 mg/dL and patient improves";
            break;
          case "d25":
            let temp7 = 2 * weightNum;
            if (temp7 > 100) {
              temp7 = 100;
            }
            result = temp7.toString() + "mL";

            break;
          case "d50":
            let temp8 = 1 * weightNum;
            if (temp8 > 50) {
              temp8 = 50;
            }
            result = temp8.toString() + "mL";

            break;
          case "narcan":
            let temp9 = 0.1 * weightNum;
            if (temp9 > 0.4) {
              temp9 = 0.4;
            }
            result = temp9.toString() + "mg";
            result += " every 5 minutes to total 4mg";
            break;
          case "albuterol":
            result =
              "5 mg neb for wheeze in anaphylaxis; repeat per medical control.";
            break;
          case "diphenhydramine":
            switch (route) {
              case "iv_diphenhydramine":
                result =
                  "Per protocol (weight-based not specified on extracted lines).";
                break;
              case "im_diphenhydramine":
                result =
                  "Per protocol (weight-based not specified on extracted lines).";
                break;
            }
            break;
          case "methylprednisolone":
            let temp10 = 1 * weightNum;
            if (temp10 > 125) {
              temp10 = 125;
            }
            result = temp10.toString() + "mg";
            break;
          case "loratadine":
            result =
              "2-5 years: 5 mg PO; 0-6 years: 10 mg PO (acute allergic reaction).";
            break;
        }
        break;

      case "adult":
        switch (value) {
          case "epinephrine":
            //NOT SURE ABOUT THESE
            switch (route) {
              case "im_epinephrine":
                let temp11 = 0.01 * weightNum;
                if (temp11 > 0.5) {
                  temp11 = 0.5;
                }
                result = temp11 + "mg";
                result +=
                  " at AEMT/Paramedic level; consider re-dose q ~3–15 minutes. Or, 0.3 mg (EMT with medical command)";
                break;
              case "iv/io_ephinephrine":
                result = "1 mg every 3-5 minutes while pulseless";
            }
          case "amiodarone":
            result =
              "300 mg IV/IO first dose, then 150 mg after 5 min. Post-ROSC: 150 mg IV/IO over 10 minutes.";
          case "calcium chloride":
            let temp12 = weightNum * 10;
            if (temp12 > 1000) {
              temp12 = 1000;
            }
            result = temp12.toString() + "mg";
            break;
          case "sodium bicarbonate":
            let temp13 = weightNum * 1;
            if (temp13 > 50) {
              temp13 = 50;
            }
            result = temp13.toString() + "mEq";
            break;
          case "glucagon":
            switch (route) {
              case "im_glucagon":
                result = "1mg IM if no access";
                break;
              case "iv/io_glucagon":
                result = "1 mg";
                break;
            }
          case "d10":
            let temp14 = 5 * weightNum;
            if (temp14 > 250) {
              temp14 = 250;
            }
            result = temp14.toString() + "mL";
            result += ". Stop when BGL > 60 mg/dL and patient improves";
            break;
          case "d25":
            let temp15 = 2 * weightNum;
            if (temp15 > 100) {
              temp15 = 100;
            }
            result = temp15.toString() + "mL";
            break;
          case "d50":
            let temp16 = 1 * weightNum;
            if (temp16 > 50) {
              temp16 = 50;
            }
            result = temp16.toString() + "mL";

            break;
          case "narcan":
            result =
              "0.4 mg every 5 minutes to total 4mg. Consider 4 mg in single-use spray.";
            break;
          case "albuterol":
            result =
              "5 mg neb for wheeze in anaphylaxis; repeat per medical control.";
            break;
          case "diphenhydramine":
            switch (route) {
              case "iv_diphenhydramine":
                //equation for diphenhydraine, IV
                break;
              case "im_diphenhydramine":
                //equation for diphenhydraine, IM
                break;
            }
            break;
          case "methylprednisolone":
            let temp = 1 * weightNum;
            if (temp > 125) {
              temp = 125;
            }
            result = temp.toString() + "mg";
            break;
          case "loratadine":
            result = "10 mg PO for acute urticaria/allergic reaction.";
            break;
        }
    }
    setDosage(result);
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
        zIndex={3000}
        zIndexInverse={1000}
        setValue={setValue}
        setItems={setItems}
        onChangeValue={makeAdminister}
        placeholder="Select Drug"
        listMode="SCROLLVIEW"
        style={[styles.dropdown, { marginBottom: 20 }]}
      />

      <Text style={styles.label}>Age Group:</Text>
      <DropDownPicker
        open={ageGroupOpen}
        value={ageGroup}
        items={ageGroupItems}
        setOpen={setAgeGroupOpen}
        setValue={setAgeGroup}
        setItems={setAgeGroupItems}
        zIndex={2000}
        zIndexInverse={2000}
        placeholder="Select Age Group"
        listMode="SCROLLVIEW"
        style={[styles.dropdown, { marginBottom: 20 }]}
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
        placeholderTextColor="#0a0a0a"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <Text style={styles.label}>Route of Administration:</Text>
      <DropDownPicker
        searchable={true}
        open={routeOpen}
        value={route}
        items={routeItems}
        setOpen={setRouteOpen}
        setValue={setRoute}
        setItems={setRouteItems}
        zIndex={1000}
        zIndexInverse={3000}
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
