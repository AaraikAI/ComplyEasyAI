/**
 * Jest Setup - Mock native modules and global test utilities
 */

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      delete store[key];
    }),
    __store: store,
    __clearStore: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Silence console.warn for act() warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return;
  originalWarn(...args);
};
