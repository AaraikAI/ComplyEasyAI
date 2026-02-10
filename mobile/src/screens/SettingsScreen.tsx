/**
 * Settings Screen
 *
 * User profile, account settings, notification preferences,
 * app information, and logout functionality.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  Card,
  Badge,
  ListItem,
  Divider,
  SectionHeader,
  Button,
  colors,
  spacing,
  fontSize,
  borderRadius,
} from '../components/shared';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout, isLoading } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              // Logout always succeeds from user perspective
            }
          },
        },
      ]
    );
  };

  const userInitials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <Card>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.profileBadges}>
              <Badge label={user?.role || 'User'} variant="primary" size="md" />
              {user?.tier && (
                <Badge label={user.tier} variant="secondary" size="md" />
              )}
            </View>
          </View>
        </View>
        {user?.organizationName && (
          <View style={styles.orgRow}>
            <Text style={styles.orgLabel}>Organization</Text>
            <Text style={styles.orgName}>{user.organizationName}</Text>
          </View>
        )}
      </Card>

      {/* Account Section */}
      <SectionHeader title="Account" />
      <Card padding={0}>
        <ListItem
          title="Edit Profile"
          subtitle="Name, email, and avatar"
          leftIcon="👤"
          onPress={() => {}}
        />
        <ListItem
          title="Change Password"
          subtitle="Update your password"
          leftIcon="🔒"
          onPress={() => {}}
        />
        <ListItem
          title="Two-Factor Authentication"
          subtitle="Add extra security"
          leftIcon="🛡️"
          onPress={() => {}}
        />
      </Card>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <Card>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive alerts for compliance updates
            </Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={pushNotifications ? colors.primary : colors.gray400}
          />
        </View>
        <Divider />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>
              Get email summaries and alerts
            </Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={emailNotifications ? colors.primary : colors.gray400}
          />
        </View>
      </Card>

      {/* Security */}
      <SectionHeader title="Security" />
      <Card>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Text style={styles.settingDescription}>
              Use Face ID or fingerprint to unlock
            </Text>
          </View>
          <Switch
            value={biometricAuth}
            onValueChange={setBiometricAuth}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={biometricAuth ? colors.primary : colors.gray400}
          />
        </View>
      </Card>

      {/* Data & Privacy */}
      <SectionHeader title="Data & Privacy" />
      <Card padding={0}>
        <ListItem
          title="Data Export"
          subtitle="Download your compliance data"
          leftIcon="📥"
          onPress={() => {}}
        />
        <ListItem
          title="Privacy Policy"
          subtitle="How we handle your data"
          leftIcon="📜"
          onPress={() => {}}
        />
        <ListItem
          title="Terms of Service"
          subtitle="Legal terms and conditions"
          leftIcon="📋"
          onPress={() => {}}
        />
      </Card>

      {/* App Info */}
      <SectionHeader title="About" />
      <Card padding={0}>
        <ListItem
          title="App Version"
          subtitle="ComplyEasy AI Mobile"
          rightLabel="2.0.0"
          leftIcon="📱"
        />
        <ListItem
          title="API Version"
          rightLabel="v2"
          leftIcon="🔌"
        />
        <ListItem
          title="Support"
          subtitle="Get help with the app"
          leftIcon="💬"
          onPress={() => {}}
        />
        <ListItem
          title="Open Source Licenses"
          leftIcon="📄"
          onPress={() => {}}
        />
      </Card>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button
          label="Sign Out"
          onPress={handleLogout}
          variant="danger"
          fullWidth
          loading={isLoading}
        />
      </View>

      {/* Bottom spacer */}
      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  orgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orgLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  orgName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Logout
  logoutSection: {
    marginTop: spacing.xxl,
  },
});
