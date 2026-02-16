import { StatusBar } from 'expo-status-bar';
import { Animated, Dimensions, ImageBackground, Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ANSWER_CATEGORIES } from './answers';
import InterstitialScreen from './InterstitialScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
const CATEGORY_COLORS = ['#F6C453', '#FF6B6B', '#6BCB77', '#4D96FF', '#B980F0'];

export default function App() {
  const totalCategories = ANSWER_CATEGORIES.length;
  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [pageIndex, setPageIndex] = useState(totalCategories > 1 ? 1 : 0);
  const [showSettings, setShowSettings] = useState(false);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef(null);
  const interstitialRef = useRef(null);
  const categoryScrollRef = useRef(null);
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


  const categories = ANSWER_CATEGORIES;
  const pages = totalCategories > 1
    ? [categories[totalCategories - 1], ...categories, categories[0]]
    : categories;
  const categoryIndex = totalCategories > 1 ? (pageIndex - 1 + totalCategories) % totalCategories : 0;
  const selectedCategory = categories[categoryIndex] || categories[0];

  const categoryBackgrounds = {
    general: require('./assets/images/categories/general.png'),
    love: require('./assets/images/categories/love.png'),
    family: require('./assets/images/categories/family.png'),
    career: require('./assets/images/categories/career.png'),
    finance: require('./assets/images/categories/finance.png'),
  };

  return (
    <ImageBackground
      source={categoryBackgrounds[selectedCategory?.key] || require('./assets/images/the-book-of-answers-zh.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Text style={styles.settingsText}>设置</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.categoryStrip} pointerEvents="box-none">
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={categoryScrollRef}
            scrollEnabled
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            contentOffset={totalCategories > 1 ? { x: SCREEN_WIDTH, y: 0 } : { x: 0, y: 0 }}
            onMomentumScrollEnd={(event) => {
              const nextPage = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (totalCategories > 1) {
                if (nextPage === 0) {
                  setPageIndex(totalCategories);
                  categoryScrollRef.current?.scrollTo({ x: totalCategories * SCREEN_WIDTH, animated: false });
                } else if (nextPage === totalCategories + 1) {
                  setPageIndex(1);
                  categoryScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
                } else {
                  setPageIndex(nextPage);
                }
                setAnswer('');
                setCountdown(null);
              }
            }}
          >
            {pages.map((cat, i) => (
              <View key={`${cat.key}-${i}`} style={styles.categoryPage}>
                <View style={styles.categoryTitleSpacer} />
              </View>
            ))}
          </Animated.ScrollView>
        </View>
        {!answer && (
          <Text style={styles.header}>
            请默念你的问题。
          </Text>
        )}
        {countdown ? (
          <View style={styles.countdownWrap}>
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
              const nextCount = tapCount + 1;
              setTapCount(nextCount);
              if (nextCount % 3 === 0) {
                interstitialRef.current?.show();
              }
              let n = 5;
              setCountdown(n);
              timerRef.current = setInterval(() => {
                n -= 1;
                if (n > 0) {
                  setCountdown(n);
                } else {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                  setCountdown(null);
                  const pool = selectedCategory?.answers || [];
                  const idx = Math.floor(Math.random() * pool.length);
                  setAnswer(pool[idx] || '');
                }
              }, 1000);
            }}
          >
            <Text style={styles.buttonText}>{answer ? '再问一次' : '寻找答案'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <InterstitialScreen ref={interstitialRef} />
      <View style={styles.ribbonNav} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.ribbonButton}
          activeOpacity={0.7}
          delayPressIn={0}
          delayPressOut={0}
          hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
          pressRetentionOffset={{ top: 40, bottom: 40, left: 40, right: 40 }}
          onPress={() => {
            if (totalCategories <= 1) return;
            const nextPage = pageIndex - 1;
            categoryScrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
            setPageIndex(nextPage);
            setAnswer('');
            setCountdown(null);
          }}
        >
          <Text style={styles.ribbonButtonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ribbonButton}
          activeOpacity={0.7}
          delayPressIn={0}
          delayPressOut={0}
          hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
          pressRetentionOffset={{ top: 40, bottom: 40, left: 40, right: 40 }}
          onPress={() => {
            if (totalCategories <= 1) return;
            const nextPage = pageIndex + 1;
            categoryScrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
            setPageIndex(nextPage);
            setAnswer('');
            setCountdown(null);
          }}
        >
          <Text style={styles.ribbonButtonText}>›</Text>
        </TouchableOpacity>
      </View>
      <Modal animationType="fade" transparent visible={showSettings} onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>设置</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>分类</Text>
              <Pressable
                onPress={() => {
                  if (totalCategories <= 1) return;
                  const nextPage = pageIndex + 1;
                  categoryScrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
                  setPageIndex(nextPage);
                  setAnswer('');
                  setCountdown(null);
                }}
              >
                <Text style={styles.settingValue}>{selectedCategory?.label || '人生日常'}</Text>
              </Pressable>
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
  categoryStrip: { width: '100%', height: 90, marginTop: 6 },
  categoryPage: { width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' },
  categoryTitleSpacer: { height: 24 },
  ribbonNav: {
    position: 'absolute',
    bottom: 80,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  ribbonButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonButtonText: { color: '#F8F4E3', fontSize: 26, fontWeight: '700', lineHeight: 28 },
  header: {
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    marginTop: -16,
    marginBottom: 16,
    textAlign: 'center',
    width: 320,
    alignSelf: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  button: { backgroundColor: '#3a86ff', width: 220, paddingVertical: 12, borderRadius: 8, marginTop: -8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  buttonRed: { backgroundColor: '#3a86ff' },
  answerWrap: { alignItems: 'center', justifyContent: 'center', marginTop: -48 },
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
  countdownWrap: { alignItems: 'center', marginVertical: 16 },
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
