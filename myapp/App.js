// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth flow
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import PictureScreen from './screens/PictureScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import FoodFormScreen from './screens/FoodFormScreen';
import FoodFormScreen1 from './screens/FoodFormScreen1';
import FoodDetail from './screens/FoodDetail'; 
import FoodEditDetail from './screens/FoodEditDetail';
import SummaryScreen from './screens/SummaryScreen'; 

// Main tabs
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import HistoryScreen from './screens/HistoryScreen';
import HistoryDetail from './screens/HistoryDetail';
import ProfileScreen from './screens/ProfileScreen';

const AuthStack = createStackNavigator();
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <AuthStack.Screen name="Picture" component={PictureScreen} />
      <AuthStack.Screen name="Summary" component={SummaryScreen} />
    </AuthStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Camera') iconName = 'camera-outline';
          else if (route.name === 'History') iconName = 'calendar-outline';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#555',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const RootStack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{ headerShown: false }}
        keyboardHandlingEnabled={false}   // ✅ ปิด auto scroll เวลาเปิดคีย์บอร์ด (iOS)
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
        <RootStack.Screen name="FoodForm" component={FoodFormScreen} />
        <RootStack.Screen name="Camera" component={CameraScreen} />
        <RootStack.Screen name="FoodForm1" component={FoodFormScreen1} />
        <RootStack.Screen name="FoodDetail" component={FoodDetail} />  
        <RootStack.Screen name="FoodEditDetail" component={FoodEditDetail} />
        <RootStack.Screen name="HistoryDetail" component={HistoryDetail} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
