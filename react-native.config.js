module.exports = {
  dependencies: {
    // Disable old react-native-fs to avoid duplicate symbols with @dr.pogodin/react-native-fs
    // Both are installed via native-universal-fs but provide the same native module
    'react-native-fs': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
