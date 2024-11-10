import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const Two = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    checkUserToken();
  }, []);

  const checkUserToken = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking user token", error);
    }
  };

  const toggleForm = () => setIsLogin(!isLogin);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    console.log("Logging in...");

    if (!email || !password) {
      Alert.alert("Error", "Email and password are required.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Invalid email format.");
      return;
    }

    const loginData = {
      email: email,
      password: password,
    };

    try {
      const response = await axios.post(
        "https://geekyblinders.pythonanywhere.com/login",
        loginData
      );

      console.log(response.data);

      if (response.data.success) {
        await AsyncStorage.setItem("userToken", response.data.token);
        Alert.alert("Success", "Login successful!");
        setIsLoggedIn(true);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Login error", error);
      Alert.alert("Error", "Login Failed - Wrong Credentials");
    }
  };

  const handleSignup = async () => {
    console.log("Signing up...");

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Invalid email format.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const notificationToken = await getTokenFromStorage();
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Confirm Password:", confirmPassword);
    console.log("Notification Token:", notificationToken);

    const signupData = {
      name: name,
      email: email,
      password: password,
      notificationToken: notificationToken,
    };

    try {
      const response = await axios.post(
        "https://geekyblinders.pythonanywhere.com/signup",
        signupData
      );

      console.log(response.data);

      if (response.data.success) {
        await AsyncStorage.setItem("userToken", response.data.token);
        Alert.alert("Success", "Signup successful!");
        setIsLoggedIn(true);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Signup error", error);
      Alert.alert(
        "Error",
        "An error occurred during signup. Please try again."
      );
    }
  };

  const getTokenFromStorage = async () => {
    try {
      const token = await AsyncStorage.getItem("expoPushToken");
      return token;
    } catch (error) {
      console.error("Token retrieval error", error);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      setIsLoggedIn(false);
      Alert.alert("Success", "Logged out successfully!");
    } catch (error) {
      console.error("Logout error", error);
      Alert.alert(
        "Error",
        "An error occurred during logout. Please try again."
      );
    }
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Logged In</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#fff"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#fff"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#fff"
      />

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#fff"
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={isLogin ? handleLogin : handleSignup}
      >
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleForm}>
        <Text style={styles.switchText}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    color: "#fff",
  },
  button: {
    width: "40%",
    padding: 15,
    backgroundColor: "#5dcb97",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  switchText: {
    color: "#fff",
    marginTop: 20,
  },
});

export default Two;
