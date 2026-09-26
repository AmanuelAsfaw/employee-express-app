// src/components/CompanyDrawerHeader.js

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import { theme } from '../theme/theme';

export default function CompanyDrawerHeader({
  companyName = 'ZPrime',
  logo,
}) {
  // ---------------------------------------
  // Entrance animations
  // ---------------------------------------

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;

  // ---------------------------------------
  // Continuous animations
  // ---------------------------------------

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const orbOneAnim = useRef(new Animated.Value(0)).current;
  const orbTwoAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(contentY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();

    // ---------------------------------------
    // Logo floating animation
    // ---------------------------------------

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ---------------------------------------
    // Breathing glow
    // ---------------------------------------

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),

        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // ---------------------------------------
    // Background orb movement
    // ---------------------------------------

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbOneAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(orbOneAnim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbTwoAnim, {
          toValue: 1,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(orbTwoAnim, {
          toValue: 0,
          duration: 6500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ---------------------------------------
    // Subtle shimmer
    // ---------------------------------------

    Animated.loop(
      Animated.sequence([
        Animated.delay(1800),

        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    fadeAnim,
    contentY,
    logoScale,
    floatAnim,
    glowAnim,
    orbOneAnim,
    orbTwoAnim,
    shimmerAnim,
  ]);

  // ---------------------------------------
  // Animated values
  // ---------------------------------------

  const orbOneStyle = {
    transform: [
      {
        translateX: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
      {
        translateY: orbOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 15],
        }),
      },
    ],
  };

  const orbTwoStyle = {
    transform: [
      {
        translateX: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
      {
        translateY: orbTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
    ],
  };

  const glowStyle = {
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.05, 0.14],
    }),
    transform: [
      {
        scale: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1.08],
        }),
      },
    ],
  };

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.35, 0],
    }),

    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 80],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>

      {/* =====================================
          BACKGROUND
      ====================================== */}

      <Animated.View
        style={[
          styles.orbOne,
          orbOneStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.orbTwo,
          orbTwoStyle,
        ]}
      />

      <View style={styles.gridLineOne} />
      <View style={styles.gridLineTwo} />

      {/* =====================================
          MAIN CONTENT
      ====================================== */}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: contentY },
            ],
          },
        ]}
      >

        {/* =====================================
            LOGO AREA
        ====================================== */}

        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [
                { scale: logoScale },
                { translateY: floatAnim },
              ],
            },
          ]}
        >

          {/* Outer glow */}
          <Animated.View
            style={[
              styles.logoGlow,
              glowStyle,
            ]}
          />

          {/* Decorative ring */}
          <View style={styles.outerRing} />

          {/* Main logo */}
          <View style={styles.logoContainer}>

            {logo ? (
              <Image
                source={
                  typeof logo === 'string'
                    ? { uri: logo }
                    : logo
                }
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>
                  Z
                </Text>
              </View>
            )}

          </View>

          {/* Small cyan indicator */}
          <View style={styles.logoStatus}>
            <View style={styles.logoStatusDot} />
          </View>

        </Animated.View>

        {/* =====================================
            COMPANY NAME
        ====================================== */}

        <View style={styles.info}>

          <Text
            style={styles.companyName}
            numberOfLines={1}
          >
            {companyName}
          </Text>

          {/* Underline accent */}
          <View style={styles.nameAccent}>
            <View style={styles.nameAccentDot} />
            <View style={styles.nameAccentLine} />
            <View style={styles.nameAccentDot} />
          </View>

          {/* ===================================
              SYSTEM STATUS
          ==================================== */}

          <View style={styles.statusPill}>

            <View style={styles.statusIndicator}>
              <View style={styles.statusPulse} />
              <View style={styles.statusDot} />
            </View>

            <Text style={styles.statusText}>
              Billing System
            </Text>

            <View style={styles.statusDivider} />

            <Text style={styles.activeText}>
              ACTIVE
            </Text>

          </View>

        </View>

        {/* =====================================
            SHIMMER ACCENT
        ====================================== */}

        <View style={styles.bottomAccent}>

          <View style={styles.accentBase} />

          <Animated.View
            style={[
              styles.accentShimmer,
              shimmerStyle,
            ]}
          />

        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({

  // =========================================
  // CONTAINER
  // =========================================

  container: {
    position: 'relative',

    overflow: 'hidden',

    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 24,

    backgroundColor: theme.colors.surface,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 5,
  },

  // =========================================
  // BACKGROUND ORBS
  // =========================================

  orbOne: {
    position: 'absolute',

    width: 180,
    height: 180,

    borderRadius: 90,

    top: -125,
    right: -70,

    backgroundColor: theme.colors.cyan,

    opacity: 0.055,
  },

  orbTwo: {
    position: 'absolute',

    width: 150,
    height: 150,

    borderRadius: 75,

    bottom: -110,
    left: -70,

    backgroundColor: theme.colors.cyan,

    opacity: 0.045,
  },

  // Very subtle decorative lines
  gridLineOne: {
    position: 'absolute',

    width: 220,
    height: 1,

    top: 72,
    right: -50,

    backgroundColor: theme.colors.cyan,

    opacity: 0.035,

    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  gridLineTwo: {
    position: 'absolute',

    width: 200,
    height: 1,

    bottom: 65,
    left: -40,

    backgroundColor: theme.colors.cyan,

    opacity: 0.03,

    transform: [
      {
        rotate: '-25deg',
      },
    ],
  },

  // =========================================
  // LOGO
  // =========================================

  logoWrapper: {
    width: 116,
    height: 116,

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  logoGlow: {
    position: 'absolute',

    width: 116,
    height: 116,

    borderRadius: 58,

    backgroundColor: theme.colors.cyan,
  },

  outerRing: {
    position: 'absolute',

    width: 112,
    height: 112,

    borderRadius: 56,

    borderWidth: 1,

    borderColor: theme.colors.cyan,

    opacity: 0.28,
  },

  logoContainer: {
    width: 94,
    height: 94,

    borderRadius: 47,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.background,

    borderWidth: 1,

    borderColor: theme.colors.border,

    overflow: 'hidden',

    // iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.10,
    shadowRadius: 12,

    // Android
    elevation: 6,
  },

  logo: {
    width: 82,
    height: 82,
  },

  logoPlaceholder: {
    width: '100%',
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.cyan,
  },

  logoText: {
    fontSize: 40,

    fontWeight: '900',

    color: '#fff',

    letterSpacing: -1,
  },

  // =========================================
  // LOGO STATUS
  // =========================================

  logoStatus: {
    position: 'absolute',

    right: 5,
    bottom: 7,

    width: 20,
    height: 20,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,

    borderWidth: 2,

    borderColor: theme.colors.surface,
  },

  logoStatusDot: {
    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: theme.colors.cyan,
  },

  // =========================================
  // COMPANY INFO
  // =========================================

  info: {
    alignItems: 'center',

    marginTop: 17,
  },

  companyName: {
    maxWidth: 240,

    fontSize: 20,

    fontWeight: '800',

    color: theme.colors.text,

    textAlign: 'center',

    letterSpacing: -0.4,
  },

  // =========================================
  // NAME ACCENT
  // =========================================

  nameAccent: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 8,
    marginBottom: 10,
  },

  nameAccentLine: {
    width: 28,
    height: 1,

    marginHorizontal: 5,

    backgroundColor: theme.colors.cyan,

    opacity: 0.5,
  },

  nameAccentDot: {
    width: 3,
    height: 3,

    borderRadius: 2,

    backgroundColor: theme.colors.cyan,

    opacity: 0.65,
  },

  // =========================================
  // STATUS PILL
  // =========================================

  statusPill: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: theme.colors.background,

    borderWidth: 1,

    borderColor: theme.colors.border,
  },

  statusIndicator: {
    width: 10,
    height: 10,

    marginRight: 6,

    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: theme.colors.cyan,
  },

  statusPulse: {
    position: 'absolute',

    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: theme.colors.cyan,

    opacity: 0.15,
  },

  statusText: {
    fontSize: 11,

    fontWeight: '600',

    color: theme.colors.textSecondary || '#888',

    letterSpacing: 0.15,
  },

  statusDivider: {
    width: 1,
    height: 12,

    marginHorizontal: 8,

    backgroundColor: theme.colors.border,
  },

  activeText: {
    fontSize: 9,

    fontWeight: '800',

    color: theme.colors.cyan,

    letterSpacing: 0.8,
  },

  // =========================================
  // BOTTOM ACCENT
  // =========================================

  bottomAccent: {
    width: 70,
    height: 3,

    marginTop: 20,

    overflow: 'hidden',

    borderRadius: 2,
  },

  accentBase: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: theme.colors.cyan,

    opacity: 0.18,

    borderRadius: 2,
  },

  accentShimmer: {
    position: 'absolute',

    width: 35,
    height: 3,

    left: 0,
    top: 0,

    backgroundColor: theme.colors.cyan,

    borderRadius: 2,
  },
});
