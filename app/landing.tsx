import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

const LandingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>환영합니다</Text>
      <Text style={styles.subtitle}>안전하게 로그인되었습니다.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
});

export default LandingScreen;
