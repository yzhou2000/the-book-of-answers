import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { ANSWERS } from './answers';

export default function App() {
  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  return (
    <ImageBackground
      source={require('./assets/images/book_of_answer.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.content}>
        {!answer && <Text style={styles.header}>Think of a question!</Text>}
        {countdown ? (
          <Text style={styles.countdown}>{countdown}</Text>
        ) : answer ? (
          <Text style={styles.answer}>{answer}</Text>
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
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#0d1b2a' },
  content: { alignItems: 'center', paddingTop: 360 },
  header: { fontSize: 36, color: '#F8F4E3',  marginVertical: 16, textAlign: 'center', paddingHorizontal: 20, fontWeight: '700'  },
  button: { backgroundColor: '#3a86ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 18 },
  buttonRed: { backgroundColor: '#3a86ff' },
  answer: { fontSize: 36, color: '#F8F4E3', marginVertical: 16, textAlign: 'center', paddingHorizontal: 20, fontWeight: '700' },
  countdown: { fontSize: 48, color: '#7CFC00', marginVertical: 12, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
});


