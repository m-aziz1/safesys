import { StyleSheet, Dimensions, Button } from "react-native";
import { Text, View } from "@/components/Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const { width, height } = Dimensions.get("window");

export default function TabOneScreen() {
  const [placeholderText, setPlaceholderText] = useState("Loading...");
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [userId, setUserId] = useState(null);
  const [lockerId, setLockerId] = useState(null);

  useEffect(() => {
    registerForPushNotifications();

    const checkAndValidateToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          setPlaceholderText("Login Required");
          return;
        }

        const response = await axios.post(
          "https://geekyblinders.pythonanywhere.com/validate_jwt",
          { token }
        );

        const { status, jwt, locker, user } = response.data;

        if (status && jwt === "Valid") {
          if (locker) {
            // Call the API to check for suspicious activity
            setUserId(user);
            setLockerId(locker);
            checkSuspiciousActivity(user);
          } else {
            setPlaceholderText("No Lockers");
          }
        } else {
          await AsyncStorage.removeItem("userToken");
          setPlaceholderText("Login Required");
        }
      } catch (error) {
        console.error("JWT Validation Error:", error);
        setPlaceholderText("Login Required");
      }
    };

    const checkSuspiciousActivity = async (userId: number) => {
      try {
        const formData = {
          user: userId,
        };
        const response = await axios.post(
          "https://geekyblinders.pythonanywhere.com/latest_activity",
          formData
        );

        if (response.data.status) {
          setPlaceholderText("Suspicious Activity Detected");
          setSuspiciousActivity(true);
        } else {
          setPlaceholderText("Locker Secured");
          setSuspiciousActivity(false);
        }
      } catch (error) {
        console.error("Suspicious Activity Check Error:", error);
        setPlaceholderText("Error checking activity");
      }
    };

    checkAndValidateToken();

    const interval = setInterval(() => {
      if (userId) {
        checkSuspiciousActivity(userId);
      }
    }, 5000);
  }, []);

  const registerForPushNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem("expoPushToken", token);
        console.log("Push notification token:", token);
      } else {
        alert("Failed to get push token for notifications!");
      }
    } else {
      alert("Must use a physical device for Push Notifications");
    }
  };

  const handleIgnore = async () => {
    try {
      if (userId && lockerId) {
        await axios.post("https://geekyblinders.pythonanywhere.com/ignore", {
          user: userId,
          locker: lockerId,
        });
        setSuspiciousActivity(false);
        setPlaceholderText("Ignored");
      } else {
        setPlaceholderText("Error: Missing User or Locker ID");
      }
    } catch (error) {
      console.error("Error ignoring activity:", error);
      setPlaceholderText("Error ignoring activity");
    }
  };

  const handleReport = async () => {
    try {
      if (userId && lockerId) {
        await axios.post("https://geekyblinders.pythonanywhere.com/report", {
          user: userId,
          locker: lockerId,
        });
        setSuspiciousActivity(false);
        setPlaceholderText("Reported");
      } else {
        setPlaceholderText("Error: Missing User or Locker ID");
      }
    } catch (error) {
      console.error("Error reporting activity:", error);
      setPlaceholderText("Error reporting activity");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.rectangle}>
        <Text style={styles.rectangleText}>{placeholderText}</Text>
      </View>
      {suspiciousActivity && (
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Ignore" onPress={handleIgnore} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Report" onPress={handleReport} />
          </View>
        </View>
      )}
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  rectangle: {
    width: width * 0.9,
    height: height * 0.25,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 30,
  },
  rectangleText: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-around",
    width: width * 0.9,
  },
  buttonWrapper: {
    width: "49%",
  },
});
