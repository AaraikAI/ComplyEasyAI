/**
 * App Navigator
 *
 * Root navigation structure with:
 * - Auth stack (login) when not authenticated
 * - Main tab navigator (dashboard, vendors, risks, frameworks, issues, settings)
 *   when authenticated
 * - Stack navigators nested inside tabs for detail screens
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { colors, fontSize, spacing } from '../components/shared';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import VendorsScreen from '../screens/VendorsScreen';
import RisksScreen from '../screens/RisksScreen';
import FrameworksScreen from '../screens/FrameworksScreen';
import IssuesScreen from '../screens/IssuesScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ============================================================================
// NAVIGATORS
// ============================================================================

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Tab icon component using text emoji (avoids external icon dependency)
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </Text>
  );
}

// ============================================================================
// AUTH NAVIGATOR
// ============================================================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// ============================================================================
// MAIN TAB NAVIGATOR
// ============================================================================

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: fontSize.xl,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '500',
        },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Vendors"
        component={VendorsScreen}
        options={{
          title: 'Vendors',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏢" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Risks"
        component={RisksScreen}
        options={{
          title: 'Risks',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚠️" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Frameworks"
        component={FrameworksScreen}
        options={{
          title: 'Frameworks',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Issues"
        component={IssuesScreen}
        options={{
          title: 'Issues',
          tabBarIcon: ({ focused }) => <TabIcon icon="🎫" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </MainTab.Navigator>
  );
}

// ============================================================================
// LOADING SCREEN
// ============================================================================

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingLogo}>
        <Text style={styles.loadingLogoText}>CE</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loadingSpinner}
      />
      <Text style={styles.loadingText}>Loading ComplyEasy AI...</Text>
    </View>
  );
}

// ============================================================================
// ROOT NAVIGATOR
// ============================================================================

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingLogoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  loadingSpinner: {
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
