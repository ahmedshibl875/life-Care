import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Top Graphic Area */}
      <View style={styles.graphicContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>💙</Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Life Care</Text>
        <Text style={styles.subtitle}>
          Your complete health companion. Monitor vitals, connect with doctors, and stay healthy anywhere, anytime.
        </Text>

        <View style={styles.buttonsWrapper}>
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryButtonText}>I'm New Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  graphicContainer: {
    flex: 0.55,
    backgroundColor: '#2563EB', // Blue 600
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  circle1: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.4,
    left: -width * 0.1,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: -width * 0.2,
    right: -width * 0.2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  iconText: {
    fontSize: 60,
  },
  contentContainer: {
    flex: 0.45,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B', // Slate 500
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  buttonsWrapper: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0', // Slate 200
  },
  secondaryButtonText: {
    color: '#334155', // Slate 700
    fontSize: 18,
    fontWeight: '700',
  },
});
