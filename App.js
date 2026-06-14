import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ANSWER_CATEGORIES } from './answers';
import InterstitialScreen from './InterstitialScreen';
import { chooseAnswer, classifyQuestion } from './questionEngine';

const SPARKLE_POINTS = [
  { x: -120, y: -40 },
  { x: 120, y: -48 },
  { x: -88, y: 72 },
  { x: 88, y: 72 },
  { x: 0, y: -144 },
  { x: 0, y: 144 },
  { x: -140, y: 20 },
  { x: 140, y: 24 },
  { x: -60, y: -120 },
  { x: 60, y: -120 },
  { x: -60, y: 120 },
  { x: 60, y: 120 },
  { x: -150, y: -90 },
  { x: 150, y: -90 },
  { x: -150, y: 90 },
  { x: 150, y: 90 },
];
const HALO_GLYPHS = ['✦', '✧', '✶', '✴', '✹', '✷', '✵', '✺'];

export default function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('life');
  const [inputError, setInputError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef(null);
  const interstitialRef = useRef(null);
  const answerAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const revealLoopRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (revealLoopRef.current) revealLoopRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!answer) return;
    if (enableAnimations) {
      answerAnim.setValue(0);
      sparkleAnim.setValue(0);
      Animated.spring(answerAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      Animated.timing(sparkleAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    }
    if (enableHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [answer, enableAnimations, enableHaptics, answerAnim, sparkleAnim]);

  useEffect(() => {
    if (!countdown || !enableAnimations) {
      if (revealLoopRef.current) revealLoopRef.current.stop();
      revealAnim.setValue(0);
      return;
    }
    revealAnim.setValue(0);
    revealLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(revealAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(revealAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    revealLoopRef.current.start();
  }, [countdown, enableAnimations, revealAnim]);

  const haloGlyphStyle = (index) => {
    const angle = (index / HALO_GLYPHS.length) * Math.PI * 2;
    const radius = 56;
    return {
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
      ],
    };
  };


  const selectedCategory =
    ANSWER_CATEGORIES.find((category) => category.key === selectedCategoryKey) ||
    ANSWER_CATEGORIES[0];

  const resetQuestion = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setQuestion('');
    setAnswer('');
    setCountdown(null);
    setInputError('');
    setSelectedCategoryKey('life');
  };

  const findAnswer = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 2) {
      setInputError('请先写下一个完整的问题');
      if (enableHaptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }
    if (timerRef.current) return;

    Keyboard.dismiss();
    setInputError('');
    const matchedCategory = classifyQuestion(trimmedQuestion, ANSWER_CATEGORIES);
    setSelectedCategoryKey(matchedCategory.key);

    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    if (nextCount % 3 === 0) {
      interstitialRef.current?.show();
    }

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
        setAnswer(chooseAnswer(trimmedQuestion, matchedCategory));
      }
    }, 700);
  };

  const categoryBackgrounds = {
    life: require('./assets/images/categories/life.png'),
    love: require('./assets/images/categories/love.png'),
    career: require('./assets/images/categories/career.png'),
    wealth: require('./assets/images/categories/wealth.png'),
    family: require('./assets/images/categories/family.png'),
    study: require('./assets/images/categories/study.png'),
    health: require('./assets/images/categories/health.png'),
    friendship: require('./assets/images/categories/friendship.png'),
    decision: require('./assets/images/categories/decision.png'),
    luck: require('./assets/images/categories/luck.png'),
  };

  return (
    <ImageBackground
      source={categoryBackgrounds[selectedCategory?.key] || require('./assets/images/the-book-of-answers-zh.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
      <View style={styles.topBar}>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Text style={styles.settingsText}>设置</Text>
        </Pressable>
      </View>
      <View style={styles.brandHeader} pointerEvents="none">
        <Text style={styles.brandTitle}>答案之书</Text>
        {(answer || countdown) && (
          <View style={styles.categoryRibbon}>
            <Text style={styles.categoryRibbonLabel}>问题属于</Text>
            <Text style={styles.categoryRibbonText}>{selectedCategory?.label || '人生'}</Text>
          </View>
        )}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!answer && !countdown && (
          <View style={styles.promptWrap}>
            <Text style={styles.header}>写下你想问的问题</Text>
            <Text style={styles.categoryHint}>答案之书会理解问题，并寻找最贴近的答案</Text>
            <View style={[styles.questionBox, inputError && styles.questionBoxError]}>
              <TextInput
                value={question}
                onChangeText={(value) => {
                  setQuestion(value);
                  setInputError('');
                }}
                placeholder="例如：我现在应该换工作吗？"
                placeholderTextColor="rgba(255,255,255,0.52)"
                style={styles.questionInput}
                multiline
                maxLength={80}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
              />
              <Text style={styles.characterCount}>{question.length}/80</Text>
            </View>
            {!!inputError && <Text style={styles.inputError}>{inputError}</Text>}
          </View>
        )}
        {countdown ? (
          <View style={styles.countdownWrap}>
            <Text style={styles.readingLabel}>正在理解你的问题</Text>
            <Animated.View
              style={[
                styles.halo,
                enableAnimations && {
                  transform: [
                    {
                      rotate: revealAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              {HALO_GLYPHS.map((g, i) => (
                <Text key={`glyph-${i}`} style={[styles.haloGlyph, haloGlyphStyle(i)]}>
                  {g}
                </Text>
              ))}
            </Animated.View>
          </View>
        ) : answer ? (
          <View style={styles.answerWrap}>
            <Text style={styles.questionEcho}>“{question.trim()}”</Text>
            {enableAnimations &&
              SPARKLE_POINTS.map((p, i) => (
                <Animated.View
                  key={`sparkle-${i}`}
                  style={[
                    styles.sparkle,
                    {
                      transform: [
                        {
                          translateX: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, p.x],
                          }),
                        },
                        {
                          translateY: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, p.y],
                          }),
                        },
                        {
                          scale: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 1],
                          }),
                        },
                      ],
                      opacity: sparkleAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
                    },
                  ]}
                />
              ))}
            <Animated.View
              style={[
                styles.answerTextWrap,
                enableAnimations && {
                  opacity: answerAnim,
                  transform: [{ scale: answerAnim }],
                },
              ]}
            >
              <Text style={styles.answer}>{answer}</Text>
            </Animated.View>
          </View>
        ) : null}

        {countdown == null && (
          <TouchableOpacity
            style={[styles.button, answer && styles.buttonRed]}
            onPress={answer ? resetQuestion : findAnswer}
          >
            <Text style={styles.buttonText}>{answer ? '问另一个问题' : '寻找答案'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <InterstitialScreen ref={interstitialRef} />
      <Modal animationType="fade" transparent visible={showSettings} onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>设置</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>问题分类</Text>
              <Text style={styles.settingValue}>自动识别</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>震动</Text>
              <Switch value={enableHaptics} onValueChange={setEnableHaptics} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>动画</Text>
              <Switch value={enableAnimations} onValueChange={setEnableAnimations} />
            </View>
            <Pressable style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <Text style={styles.closeButtonText}>完成</Text>
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
  keyboardView: { flex: 1, width: '100%', alignItems: 'center' },
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
  brandHeader: {
    position: 'absolute',
    top: 116,
    left: 20,
    right: 20,
    zIndex: 3,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFD95A',
    fontSize: 54,
    lineHeight: 62,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(83, 27, 0, 0.9)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  categoryRibbon: {
    marginTop: 8,
    minWidth: 132,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(196, 112, 16, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 221, 125, 0.88)',
    shadowColor: '#FFD45A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 10,
  },
  categoryRibbonLabel: {
    color: 'rgba(255,246,209,0.78)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryRibbonText: {
    color: '#FFF6D1',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 245,
    paddingHorizontal: 24,
    paddingBottom: 38,
  },
  header: {
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    marginTop: 0,
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
    alignSelf: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  promptWrap: { width: '100%', maxWidth: 380, alignItems: 'center', marginBottom: 18 },
  categoryHint: {
    color: '#FFF6D1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    width: '100%',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  questionBox: {
    width: '100%',
    minHeight: 132,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 151, 0.7)',
    borderRadius: 8,
    backgroundColor: 'rgba(8, 16, 28, 0.72)',
  },
  questionBoxError: { borderColor: '#FF8A80' },
  questionInput: {
    minHeight: 82,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 27,
    padding: 0,
  },
  characterCount: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  inputError: {
    alignSelf: 'flex-start',
    marginTop: 7,
    color: '#FFD0CC',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3a86ff',
    width: 220,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  buttonRed: { backgroundColor: '#3a86ff' },
  answerWrap: { width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  questionEcho: {
    maxWidth: 330,
    marginBottom: 14,
    color: 'rgba(255,246,209,0.86)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  answerTextWrap: { alignItems: 'center', width: 320, alignSelf: 'center' },
  answer: {
    fontSize: 36,
    color: '#FFFFFF',
    marginVertical: 16,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 0,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F8F4E3',
    shadowColor: '#F8F4E3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  countdownWrap: { alignItems: 'center', marginBottom: 24 },
  readingLabel: {
    marginBottom: 16,
    color: '#FFF6D1',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  halo: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloGlyph: {
    position: 'absolute',
    fontSize: 18,
    color: '#7CFC00',
    textShadowColor: 'rgba(124,252,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
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
  settingValue: { color: '#9AC2FF', fontSize: 15 },
  closeButton: {
    marginTop: 14,
    backgroundColor: '#3a86ff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
