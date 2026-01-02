import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import mobileAds, { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const FORCE_TEST_ADS = true;
const interstitialAdUnitId = __DEV__ || FORCE_TEST_ADS
  ? Platform.select({
      android: 'ca-app-pub-3940256099942544/1033173712',
      ios: 'ca-app-pub-3940256099942544/4411468910',
    })
  : Platform.select({
      android: 'ca-app-pub-2776707850684969/7114478692',
      ios: 'ca-app-pub-2776707850684969/1015974207',
    });

// Invisible component that shows an interstitial only when requested by the parent
const InterstitialScreen = forwardRef(function InterstitialScreen(_, ref) {
  const adRef = useRef(null);
  const unsubRef = useRef(null);
  const isLoadingRef = useRef(false);
  const isLoadedRef = useRef(false);
  const pendingShowRef = useRef(false);
  const [status, setStatus] = useState('idle');

  const cleanup = () => {
    if (unsubRef.current) {
      unsubRef.current.loaded?.();
      unsubRef.current.opened?.();
      unsubRef.current.closed?.();
      unsubRef.current.clicked?.();
      unsubRef.current.error?.();
    }
    unsubRef.current = null;
    adRef.current = null;
    isLoadedRef.current = false;
    isLoadingRef.current = false;
    setStatus('idle');
  };

  const setupAndLoad = async () => {
    if (isLoadingRef.current || isLoadedRef.current) return;
    isLoadingRef.current = true;
    setStatus('loading');

    try {
      await mobileAds().initialize();
      cleanup();

      const interstitial = InterstitialAd.createForAdRequest(
        interstitialAdUnitId || TestIds.INTERSTITIAL,
        { requestNonPersonalizedAdsOnly: false }
      );
      adRef.current = interstitial;

      unsubRef.current = {
        loaded: interstitial.addAdEventListener(AdEventType.LOADED, () => {
          console.log('[AdMob] Interstitial loaded');
          isLoadedRef.current = true;
          isLoadingRef.current = false;
          setStatus('loaded');
          if (pendingShowRef.current) {
            pendingShowRef.current = false;
            interstitial.show();
          }
        }),
        opened: interstitial.addAdEventListener(AdEventType.OPENED, () => {
          console.log('[AdMob] Interstitial opened');
        }),
        closed: interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('[AdMob] Interstitial closed');
          isLoadedRef.current = false;
          setStatus('idle');
          setupAndLoad();
        }),
        clicked: interstitial.addAdEventListener(AdEventType.CLICKED, () => {
          console.log('[AdMob] Interstitial clicked');
        }),
        error: interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
          console.warn('Interstitial error:', error);
          isLoadingRef.current = false;
          isLoadedRef.current = false;
          setStatus('error');
        }),
      };

      await interstitial.load();
    } catch (e) {
      isLoadingRef.current = false;
      isLoadedRef.current = false;
      setStatus('error');
      console.warn('Failed to load interstitial:', e);
    }
  };

  const showInterstitial = () => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
    if (isLoadedRef.current && adRef.current) {
      adRef.current.show();
      return;
    }
    pendingShowRef.current = true;
    setupAndLoad();
  };

  useImperativeHandle(ref, () => ({
    show: showInterstitial,
  }));

  useEffect(() => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      setupAndLoad();
    }
    return () => {
      cleanup();
    };
  }, []);

  if (!__DEV__) return null; // invisible UI in production

  return (
    <View pointerEvents="none" style={styles.debugWrap}>
      <Text style={styles.debugText}>Ad status: {status}</Text>
    </View>
  );
});

export default InterstitialScreen;

const styles = StyleSheet.create({
  debugWrap: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
  },
});
