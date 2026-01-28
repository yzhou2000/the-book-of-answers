import { StatusBar } from 'expo-status-bar';
import { Animated, ImageBackground, Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ANSWERS } from './answers';
import InterstitialScreen from './InterstitialScreen';

export default function App() {
  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const timerRef = useRef(null);
  const interstitialRef = useRef(null);
  const answerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!answer) return;
    if (enableAnimations) {
      answerAnim.setValue(0);
      Animated.spring(answerAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
    }
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [answer, enableAnimations, enableHaptics, answerAnim]);

  return (
    <ImageBackground
      source={require('./assets/images/book_of_answer.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        {!answer && <Text style={styles.header}>Think of a question!</Text>}
        {countdown ? (
          <Text style={styles.countdown}>{countdown}</Text>
        ) : answer ? (
          <Animated.View
            style={[
              styles.answerWrap,
              enableAnimations && {
                opacity: answerAnim,
                transform: [{ scale: answerAnim }],
              },
            ]}
          >
            <Text style={styles.answer}>{answer}</Text>
          </Animated.View>
        ) : null}

        {countdown == null && (
          <TouchableOpacity
            style={[styles.button, answer && styles.buttonRed]}
            onPress={() => {
              // If an answer is already shown, clear it (don't load a new one).
              if (answer) {
                setAnswer('');
                return;
              }
              // start countdown then pick an answer
              if (timerRef.current) return;
              if (enableHaptics) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              }
              interstitialRef.current?.show();
              let n = 3;
              setCountdown(n);
              timerRef.current = setInterval(() => {
                n -= 1;
                if (n > 0) {
                  setCountdown(n);
                } else {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                  setCountdown(null);
                  const idx = Math.floor(Math.random() * ANSWERS.length);
                  setAnswer(ANSWERS[idx]);
                }
              }, 1000);
            }}
          >
            <Text style={styles.buttonText}>{answer ? 'Try again' : 'Tap me'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <InterstitialScreen ref={interstitialRef} />
      <Modal animationType="fade" transparent visible={showSettings} onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Haptics</Text>
              <Switch value={enableHaptics} onValueChange={setEnableHaptics} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Animations</Text>
              <Switch value={enableAnimations} onValueChange={setEnableAnimations} />
            </View>
            <Pressable style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#0d1b2a' },
  topBar: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 2,
  },
  settingsButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  settingsText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { alignItems: 'center', paddingTop: 360 },
  header: { fontSize: 36, color: '#F8F4E3',  marginVertical: 16, textAlign: 'center', paddingHorizontal: 20, fontWeight: '700'  },
  button: { backgroundColor: '#3a86ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 18 },
  buttonRed: { backgroundColor: '#3a86ff' },
  answerWrap: { alignItems: 'center' },
  answer: { fontSize: 36, color: '#F8F4E3', marginVertical: 16, textAlign: 'center', paddingHorizontal: 20, fontWeight: '700' },
  countdown: { fontSize: 48, color: '#7CFC00', marginVertical: 12, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: { color: '#E5E7EB', fontSize: 16 },
  closeButton: {
    marginTop: 14,
    backgroundColor: '#3a86ff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
