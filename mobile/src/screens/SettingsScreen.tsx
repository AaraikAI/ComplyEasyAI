/**
 * Settings Screen
 *
 * User profile, account settings, notification preferences,
 * app information, and logout functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  loadPreferences,
  savePreference,
  type NotificationPreferences,
} from '../services/preferences';
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

const SUPPORT_EMAIL = 'support@complyeasy.ai';
const PRIVACY_POLICY_URL = 'https://complyeasy.ai/privacy';
const TERMS_URL = 'https://complyeasy.ai/terms';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout, isLoading, updateUser } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  // Hydrate toggles from the persisted on-device preferences so they survive
  // app restarts instead of resetting to their defaults on every launch.
  useEffect(() => {
    let active = true;
    loadPreferences().then((prefs: NotificationPreferences) => {
      if (!active) return;
      setPushNotifications(prefs.pushNotifications);
      setEmailNotifications(prefs.emailNotifications);
      setBiometricAuth(prefs.biometricAuth);
    });
    return () => {
      active = false;
    };
  }, []);

  // Optimistically update the UI, then persist; revert on a write failure.
  const handleToggle = (
    key: keyof NotificationPreferences,
    setter: (v: boolean) => void,
    value: boolean
  ) => {
    setter(value);
    savePreference(key, value).catch(() => {
      setter(!value);
      Alert.alert('Could not save', 'Your preference could not be saved. Please try again.');
    });
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'ios' || typeof Alert.prompt !== 'function') {
      Alert.alert(
        'Edit Profile',
        'Editing your profile name from this view is available on iOS. Use the web app to update your full profile.',
        [{ text: 'OK' }]
      );
      return;
    }
    const currentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    Alert.prompt(
      'Edit Profile',
      'Update your display name.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const name = (value || '').trim();
            if (!name) {
              Alert.alert('Name Required', 'Please enter a name.');
              return;
            }
            try {
              const result = await api.auth.updateProfile({ name });
              const updated = result.data || {};
              const [firstName, ...rest] = name.split(' ');
              // Reflect the saved name locally; the API persists the full record.
              updateUser({
                firstName: updated.firstName || firstName || '',
                lastName: updated.lastName || rest.join(' ') || '',
              });
              Alert.alert('Profile Updated', 'Your profile has been updated.');
            } catch (err: any) {
              Alert.alert('Update Failed', err.message || 'Could not update your profile.');
            }
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  const handleChangePassword = () => {
    if (Platform.OS !== 'ios' || typeof Alert.prompt !== 'function') {
      Alert.alert(
        'Change Password',
        'Changing your password from this view is available on iOS. You can also reset it from the sign-in screen.',
        [{ text: 'OK' }]
      );
      return;
    }
    // Collect the current password, then the new one, then call the API.
    Alert.prompt(
      'Current Password',
      'Enter your current password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (current?: string) => {
            const currentPassword = current || '';
            if (!currentPassword) {
              Alert.alert('Required', 'Please enter your current password.');
              return;
            }
            Alert.prompt(
              'New Password',
              'Enter a new password (at least 8 characters).',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Change',
                  onPress: async (next?: string) => {
                    const newPassword = next || '';
                    if (newPassword.length < 8) {
                      Alert.alert('Too Short', 'New password must be at least 8 characters.');
                      return;
                    }
                    try {
                      await api.auth.changePassword(currentPassword, newPassword);
                      // The server invalidates the session on password change, so
                      // sign the user out to force re-authentication.
                      Alert.alert(
                        'Password Changed',
                        'Your password has been changed. Please sign in again.',
                        [{ text: 'OK', onPress: () => { logout(); } }]
                      );
                    } catch (err: any) {
                      Alert.alert('Change Failed', err.message || 'Could not change your password.');
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ],
      'secure-text'
    );
  };

  const handleTwoFactor = async () => {
    try {
      const result = await api.auth.twoFactorStatus();
      const enabled = !!result.data?.enabled;
      Alert.alert(
        'Two-Factor Authentication',
        enabled
          ? 'Two-factor authentication is currently enabled on your account.'
          : 'Two-factor authentication is not enabled. Set it up in the web app to scan the authenticator QR code, then sign in here as usual.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Unavailable', err.message || 'Could not load your two-factor status.');
    }
  };

  const handleDataExport = () => {
    // The export endpoints stream downloadable files, which require a file-save
    // capability not yet bundled in the mobile build. Direct users to the web
    // app to download their data rather than presenting a control that no-ops.
    Alert.alert(
      'Data Export',
      'Compliance data exports are available as downloadable files in the ComplyEasy web app. Open it on your computer to export and download your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Web App', onPress: () => openUrl('https://app.complyeasy.ai/settings/export', 'Data Export') },
      ]
    );
  };

  const openUrl = async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(label, `Unable to open ${url} on this device.`);
      }
    } catch {
      Alert.alert(label, `Unable to open ${url} on this device.`);
    }
  };

  const handleSupport = () => openUrl(`mailto:${SUPPORT_EMAIL}?subject=ComplyEasy%20Mobile%20Support`, 'Support');
  const handlePrivacyPolicy = () => openUrl(PRIVACY_POLICY_URL, 'Privacy Policy');
  const handleTerms = () => openUrl(TERMS_URL, 'Terms of Service');
  const handleLicenses = () =>
    Alert.alert(
      'Open Source Licenses',
      'ComplyEasy AI Mobile is built with React Native, Expo, and other open-source software. Full license texts are bundled with the app and available at complyeasy.ai/licenses.',
      [{ text: 'OK' }]
    );

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
          onPress={handleEditProfile}
        />
        <ListItem
          title="Change Password"
          subtitle="Update your password"
          leftIcon="🔒"
          onPress={handleChangePassword}
        />
        <ListItem
          title="Two-Factor Authentication"
          subtitle="Add extra security"
          leftIcon="🛡️"
          onPress={handleTwoFactor}
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
            onValueChange={(v) => handleToggle('pushNotifications', setPushNotifications, v)}
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
            onValueChange={(v) => handleToggle('emailNotifications', setEmailNotifications, v)}
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
            onValueChange={(v) => handleToggle('biometricAuth', setBiometricAuth, v)}
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
          onPress={handleDataExport}
        />
        <ListItem
          title="Privacy Policy"
          subtitle="How we handle your data"
          leftIcon="📜"
          onPress={handlePrivacyPolicy}
        />
        <ListItem
          title="Terms of Service"
          subtitle="Legal terms and conditions"
          leftIcon="📋"
          onPress={handleTerms}
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
          onPress={handleSupport}
        />
        <ListItem
          title="Open Source Licenses"
          leftIcon="📄"
          onPress={handleLicenses}
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
