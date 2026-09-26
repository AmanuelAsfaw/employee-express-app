// src/screens/LoginScreen.js

import React, { useEffect, useRef, useState } from 'react';

import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  Easing,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { handleLoginAPI } from '../utils/api_utils.js';
import { theme } from '../theme/theme.js';
import { CompanyName, CompanyLogo } from '../constants/companyInfo.js';
import ZPrimeFooter from '../components/Z-PrimeFooter.js';


// ======================================================
// AX BRAND COLORS
// ======================================================

const AX = {
  cyan: '#18B8C9',
  cyanLight: '#42D2DF',
  cyanDark: '#0797AD',

  navy: '#243B88',
  navyDark: '#172A68',
  navyDeep: '#0D173D',

  green: '#61A83B',
  yellow: '#FFD21C',
  red: '#D92C2C',

  white: '#FFFFFF',
};


// ======================================================
// LOGIN SCREEN
// ======================================================

const LoginScreen = ({ navigation, setUserToken, setRole }) => {

  // ====================================================
  // STATE
  // ====================================================

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);


  // ====================================================
  // MAIN ENTRANCE ANIMATION
  // ====================================================

  const screenOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const screenTranslate = useRef(
    new Animated.Value(35)
  ).current;


  // ====================================================
  // LOGO ANIMATION
  // ====================================================

  const logoOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const logoScale = useRef(
    new Animated.Value(0.65)
  ).current;

  const logoFloat = useRef(
    new Animated.Value(0)
  ).current;

  const logoGlow = useRef(
    new Animated.Value(0)
  ).current;

  const logoRotate = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // BRAND PARTICLES
  // ====================================================

  const particleOne = useRef(
    new Animated.Value(0)
  ).current;

  const particleTwo = useRef(
    new Animated.Value(0)
  ).current;

  const particleThree = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // BACKGROUND
  // ====================================================

  const backgroundOne = useRef(
    new Animated.Value(0)
  ).current;

  const backgroundTwo = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // CARD ANIMATION
  // ====================================================

  const cardTranslate = useRef(
    new Animated.Value(45)
  ).current;

  const cardOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const cardScale = useRef(
    new Animated.Value(0.96)
  ).current;


  // ====================================================
  // FIELD ANIMATION
  // ====================================================

  const usernameFocus = useRef(
    new Animated.Value(0)
  ).current;

  const passwordFocus = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // BUTTON
  // ====================================================

  const buttonScale = useRef(
    new Animated.Value(1)
  ).current;

  const buttonShimmer = useRef(
    new Animated.Value(0)
  ).current;

  const arrowAnimation = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // SECURITY
  // ====================================================

  const securityPulse = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // INFO CARD
  // ====================================================

  const infoFloat = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // ERROR
  // ====================================================

  const errorShake = useRef(
    new Animated.Value(0)
  ).current;


  // ====================================================
  // START ANIMATIONS
  // ====================================================

  useEffect(() => {

    // ----------------------------------------------
    // Main entrance
    // ----------------------------------------------

    Animated.parallel([

      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(screenTranslate, {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      }),

      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 650,
        delay: 180,
        useNativeDriver: true,
      }),

      Animated.spring(cardTranslate, {
        toValue: 0,
        friction: 8,
        tension: 55,
        delay: 120,
        useNativeDriver: true,
      }),

      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 55,
        delay: 120,
        useNativeDriver: true,
      }),

    ]).start();


    // ----------------------------------------------
    // Logo floating
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Logo glow
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(logoGlow, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Logo rotation
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Background movement
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(backgroundOne, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(backgroundOne, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    Animated.loop(

      Animated.sequence([

        Animated.timing(backgroundTwo, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(backgroundTwo, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Particles
    // ----------------------------------------------

    const particleAnimation = (
      value,
      duration,
      distance
    ) => {

      Animated.loop(

        Animated.sequence([

          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),

          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),

        ])

      ).start();

    };


    particleAnimation(
      particleOne,
      2600,
      20
    );

    particleAnimation(
      particleTwo,
      3200,
      25
    );

    particleAnimation(
      particleThree,
      3800,
      18
    );


    // ----------------------------------------------
    // Login button shimmer
    // ----------------------------------------------

    Animated.loop(

      Animated.timing(buttonShimmer, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })

    ).start();


    // ----------------------------------------------
    // Button arrow
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(arrowAnimation, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(arrowAnimation, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Security pulse
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(securityPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(securityPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();


    // ----------------------------------------------
    // Info card
    // ----------------------------------------------

    Animated.loop(

      Animated.sequence([

        Animated.timing(infoFloat, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(infoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

      ])

    ).start();

  }, []);


  // ====================================================
  // LOGIN
  // ====================================================

  const handleLogin = async () => {

    setError('');

    if (!username.trim()) {

      setError('Please enter your username.');

      triggerErrorAnimation();

      return;
    }

    if (!password) {

      setError('Please enter your password.');

      triggerErrorAnimation();

      return;
    }

    setLoading(true);

    const dummyEvent = {
      preventDefault: () => {},
    };

    try {

      await handleLoginAPI(

        dummyEvent,

        setError,

        setLoading,

        navigation.navigate,

        username.trim(),

        password,

        (usr) => {

          console.log(
            `Welcome back, ${usr.username}!`
          );

          navigation.replace('Dashboard');
        },

        setUserToken,
        setRole

      );

    } catch (err) {

      console.error(
        'Login error:',
        err
      );

      setError(
        'Unable to login. Please try again.'
      );

      setLoading(false);

      triggerErrorAnimation();
    }
  };


  // ====================================================
  // ERROR SHAKE
  // ====================================================

  const triggerErrorAnimation = () => {

    errorShake.setValue(0);

    Animated.sequence([

      Animated.timing(errorShake, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),

      Animated.timing(errorShake, {
        toValue: -1,
        duration: 70,
        useNativeDriver: true,
      }),

      Animated.timing(errorShake, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),

      Animated.timing(errorShake, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),

    ]).start();
  };


  // ====================================================
  // BUTTON PRESS
  // ====================================================

  const animateButton = (value) => {

    Animated.spring(buttonScale, {

      toValue: value,

      friction: 6,

      tension: 120,

      useNativeDriver: true,

    }).start();
  };


  // ====================================================
  // INPUT FOCUS
  // ====================================================

  const handleFocus = (field) => {

    setFocusedField(field);

    setError('');

    const animation =
      field === 'username'
        ? usernameFocus
        : passwordFocus;

    Animated.spring(animation, {

      toValue: 1,

      friction: 7,

      tension: 100,

      useNativeDriver: true,

    }).start();
  };


  const handleBlur = (field) => {

    setFocusedField(null);

    const animation =
      field === 'username'
        ? usernameFocus
        : passwordFocus;

    Animated.spring(animation, {

      toValue: 0,

      friction: 7,

      tension: 100,

      useNativeDriver: true,

    }).start();
  };


  // ====================================================
  // INTERPOLATIONS
  // ====================================================

  const logoTranslateY =
    logoFloat.interpolate({

      inputRange: [0, 1],

      outputRange: [0, -7],

    });


  const logoGlowScale =
    logoGlow.interpolate({

      inputRange: [0, 1],

      outputRange: [0.85, 1.2],

    });


  const logoGlowOpacity =
    logoGlow.interpolate({

      inputRange: [0, 1],

      outputRange: [0.06, 0.18],

    });


  const logoRotation =
    logoRotate.interpolate({

      inputRange: [0, 1],

      outputRange: ['-2deg', '2deg'],

    });


  const particleOneY =
    particleOne.interpolate({

      inputRange: [0, 1],

      outputRange: [0, -18],

    });


  const particleTwoY =
    particleTwo.interpolate({

      inputRange: [0, 1],

      outputRange: [0, 16],

    });


  const particleThreeY =
    particleThree.interpolate({

      inputRange: [0, 1],

      outputRange: [0, -12],

    });


  const backgroundOneY =
    backgroundOne.interpolate({

      inputRange: [0, 1],

      outputRange: [0, 35],

    });


  const backgroundTwoY =
    backgroundTwo.interpolate({

      inputRange: [0, 1],

      outputRange: [0, -30],

    });


  const usernameIconScale =
    usernameFocus.interpolate({

      inputRange: [0, 1],

      outputRange: [1, 1.12],

    });


  const passwordIconScale =
    passwordFocus.interpolate({

      inputRange: [0, 1],

      outputRange: [1, 1.12],

    });


  const buttonShimmerX =
    buttonShimmer.interpolate({

      inputRange: [0, 1],

      outputRange: [-180, 260],

    });


  const arrowX =
    arrowAnimation.interpolate({

      inputRange: [0, 1],

      outputRange: [0, 5],

    });


  const securityScale =
    securityPulse.interpolate({

      inputRange: [0, 1],

      outputRange: [1, 1.08],

    });


  const securityOpacity =
    securityPulse.interpolate({

      inputRange: [0, 1],

      outputRange: [0.75, 1],

    });


  const infoTranslate =
    infoFloat.interpolate({

      inputRange: [0, 1],

      outputRange: [0, -4],

    });


  const errorTranslate =
    errorShake.interpolate({

      inputRange: [-1, 0, 1],

      outputRange: [-6, 0, 6],

    });


  // ====================================================
  // UI
  // ====================================================

  return (

    <View style={styles.screen}>

      <StatusBar
        barStyle="light-content"
        backgroundColor={AX.navyDeep}
      />


      {/* ==================================================
          ANIMATED BACKGROUND
          ================================================== */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          styles.backgroundGlowOne,
          {
            transform: [
              {
                translateY: backgroundOneY,
              },
            ],
          },
        ]}
      />


      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundGlow,
          styles.backgroundGlowTwo,
          {
            transform: [
              {
                translateY: backgroundTwoY,
              },
            ],
          },
        ]}
      />


      {/* ==================================================
          BRAND COLOR BANDS
          ================================================== */}

      <View
        pointerEvents="none"
        style={styles.brandLineContainer}
      >

        <View
          style={[
            styles.brandLine,
            {
              backgroundColor: AX.green,
              flex: 1,
            },
          ]}
        />

        <View
          style={[
            styles.brandLine,
            {
              backgroundColor: AX.yellow,
              flex: 0.8,
            },
          ]}
        />

        <View
          style={[
            styles.brandLine,
            {
              backgroundColor: AX.red,
              flex: 0.6,
            },
          ]}
        />

      </View>


      {/* ==================================================
          MAIN
          ================================================== */}

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        style={styles.container}
      >

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <Animated.View
            style={[
              styles.content,
              {
                opacity: screenOpacity,

                transform: [
                  {
                    translateY: screenTranslate,
                  },
                ],
              },
            ]}
          >


            {/* ==================================================
                LOGO
                ================================================== */}

            <View style={styles.brandContainer}>

              {/* Glow */}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.logoOuterGlow,
                  {
                    opacity: logoGlowOpacity,

                    transform: [
                      {
                        scale: logoGlowScale,
                      },
                    ],
                  },
                ]}
              />


              {/* Green particle */}

              <Animated.View
                style={[
                  styles.particle,
                  styles.particleGreen,
                  {
                    transform: [
                      {
                        translateY: particleOneY,
                      },
                    ],
                  },
                ]}
              />


              {/* Yellow particle */}

              <Animated.View
                style={[
                  styles.particle,
                  styles.particleYellow,
                  {
                    transform: [
                      {
                        translateY: particleTwoY,
                      },
                    ],
                  },
                ]}
              />


              {/* Red particle */}

              <Animated.View
                style={[
                  styles.particle,
                  styles.particleRed,
                  {
                    transform: [
                      {
                        translateY: particleThreeY,
                      },
                    ],
                  },
                ]}
              />


              {/* Logo */}

              <Animated.View
                style={[
                  styles.logoContainer,

                  {
                    opacity: logoOpacity,

                    transform: [
                      {
                        scale: logoScale,
                      },
                      {
                        translateY: logoTranslateY,
                      },
                      {
                        rotate: logoRotation,
                      },
                    ],
                  },
                ]}
              >

                <View
                  style={styles.logoInnerGlow}
                />

                {CompanyLogo ? (

                  <Image
                    source={
                      typeof CompanyLogo === 'string'
                        ? { uri: CompanyLogo }
                        : CompanyLogo
                    }
                    style={styles.logo}
                    resizeMode="contain"
                  />

                ) : (

                  <MaterialCommunityIcons
                    name="truck-fast"
                    size={48}
                    color={AX.cyan}
                  />

                )}

              </Animated.View>


              {/* Company name */}

              <Animated.Text
                style={[
                  styles.brandName,
                  {
                    opacity: logoOpacity,
                  },
                ]}
              >
                {CompanyName || 'AX'}
              </Animated.Text>


              <View style={styles.brandBadge}>

                <View
                  style={styles.onlineDot}
                />

                <Text
                  style={styles.brandSubtitle}
                >
                  DELIVERY MANAGEMENT SYSTEM
                </Text>

              </View>

            </View>


            {/* ==================================================
                LOGIN CARD
                ================================================== */}

            <Animated.View
              style={[
                styles.card,
                {
                  opacity: cardOpacity,

                  transform: [
                    {
                      translateY: cardTranslate,
                    },
                    {
                      scale: cardScale,
                    },
                  ],
                },
              ]}
            >

              {/* Top cyan accent */}

              <View
                style={styles.cardAccent}
              />


              {/* Colored mini accent */}

              <View
                style={styles.cardColorAccent}
              >

                <View
                  style={[
                    styles.cardColor,
                    {
                      backgroundColor:
                        AX.green,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.cardColor,
                    {
                      backgroundColor:
                        AX.yellow,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.cardColor,
                    {
                      backgroundColor:
                        AX.red,
                    },
                  ]}
                />

              </View>


              {/* Header */}

              <View
                style={styles.cardHeaderRow}
              >

                <View
                  style={styles.headerTextContainer}
                >

                  <Text
                    style={styles.eyebrow}
                  >
                    AX SECURE PORTAL
                  </Text>

                  <Text
                    style={styles.header}
                  >
                    Welcome back
                  </Text>

                </View>


                <View
                  style={styles.headerIcon}
                >

                  <MaterialCommunityIcons
                    name="shield-lock-outline"
                    size={23}
                    color={AX.cyan}
                  />

                </View>

              </View>


              {/* <Text
                style={styles.subHeader}
              >
                Sign in to manage your deliveries,
                drivers, customers and operations.
              </Text> */}


              {/* ==================================================
                  ERROR
                  ================================================== */}

              {error ? (

                <Animated.View
                  style={[
                    styles.errorBox,
                    {
                      transform: [
                        {
                          translateX:
                            errorTranslate,
                        },
                      ],
                    },
                  ]}
                >

                  <View
                    style={styles.errorIcon}
                  >

                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color={AX.red}
                    />

                  </View>

                  <Text
                    style={styles.errorText}
                  >
                    {error}
                  </Text>

                </Animated.View>

              ) : null}


              {/* ==================================================
                  USERNAME
                  ================================================== */}

              <View
                style={styles.fieldContainer}
              >

                <Text
                  style={styles.label}
                >
                  USERNAME
                </Text>


                <View
                  style={[
                    styles.inputGroup,

                    focusedField ===
                      'username' &&
                      styles.inputGroupFocused,
                  ]}
                >

                  <Animated.View
                    style={[
                      styles.inputIcon,

                      {
                        transform: [
                          {
                            scale:
                              usernameIconScale,
                          },
                        ],
                      },
                    ]}
                  >

                    <MaterialCommunityIcons
                      name="account-outline"
                      size={21}
                      color={
                        focusedField ===
                        'username'
                          ? AX.cyan
                          : theme.colors.textSecondary
                      }
                    />

                  </Animated.View>


                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"

                    onFocus={() =>
                      handleFocus(
                        'username'
                      )
                    }

                    onBlur={() =>
                      handleBlur(
                        'username'
                      )
                    }
                  />

                </View>

              </View>


              {/* ==================================================
                  PASSWORD
                  ================================================== */}

              <View
                style={styles.fieldContainer}
              >

                <Text
                  style={styles.label}
                >
                  PASSWORD
                </Text>


                <View
                  style={[
                    styles.inputGroup,

                    focusedField ===
                      'password' &&
                      styles.inputGroupFocused,
                  ]}
                >

                  <Animated.View
                    style={[
                      styles.inputIcon,

                      {
                        transform: [
                          {
                            scale:
                              passwordIconScale,
                          },
                        ],
                      },
                    ]}
                  >

                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={21}
                      color={
                        focusedField ===
                        'password'
                          ? AX.cyan
                          : theme.colors.textSecondary
                      }
                    />

                  </Animated.View>


                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={
                      theme.colors.textMuted
                    }
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={
                      !showPassword
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"

                    onFocus={() =>
                      handleFocus(
                        'password'
                      )
                    }

                    onBlur={() =>
                      handleBlur(
                        'password'
                      )
                    }

                    onSubmitEditing={
                      handleLogin
                    }
                  />


                  <TouchableOpacity
                    style={
                      styles.visibilityButton
                    }

                    onPress={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }

                    disabled={loading}

                    activeOpacity={0.7}
                  >

                    <MaterialCommunityIcons
                      name={
                        showPassword
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={21}
                      color={
                        theme.colors.textSecondary
                      }
                    />

                  </TouchableOpacity>

                </View>

              </View>


              {/* ==================================================
                  FORGOT PASSWORD
                  ================================================== */}

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => {
                  // navigation.navigate('ForgotPassword');
                }}
                disabled={loading}
                activeOpacity={0.7}
              >

                <Text
                  style={styles.forgotText}
                >
                  Forgot password?
                </Text>

                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={14}
                  color={AX.cyan}
                />

              </TouchableOpacity>


              {/* ==================================================
                  LOGIN BUTTON
                  ================================================== */}

              <Animated.View
                style={{
                  transform: [
                    {
                      scale: buttonScale,
                    },
                  ],
                }}
              >

                <TouchableOpacity
                  style={[
                    styles.loginButton,

                    loading &&
                      styles.loginButtonDisabled,
                  ]}

                  onPress={handleLogin}

                  onPressIn={() =>
                    animateButton(0.965)
                  }

                  onPressOut={() =>
                    animateButton(1)
                  }

                  disabled={loading}

                  activeOpacity={1}
                >

                  {/* Animated shimmer */}

                  {!loading && (

                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.buttonShimmer,

                        {
                          transform: [
                            {
                              translateX:
                                buttonShimmerX,
                            },
                            {
                              rotate:
                                '18deg',
                            },
                          ],
                        },
                      ]}
                    />

                  )}


                  <View
                    style={styles.buttonInner}
                  >

                    {loading ? (

                      <>

                        <ActivityIndicator
                          size="small"
                          color={AX.white}
                        />

                        <Text
                          style={
                            styles.loginButtonText
                          }
                        >
                          Signing in...
                        </Text>

                      </>

                    ) : (

                      <>

                        <Text
                          style={
                            styles.loginButtonText
                          }
                        >
                          Sign In
                        </Text>


                        <Animated.View
                          style={[
                            styles.arrowCircle,

                            {
                              transform: [
                                {
                                  translateX:
                                    arrowX,
                                },
                              ],
                            },
                          ]}
                        >

                          <MaterialCommunityIcons
                            name="arrow-right"
                            size={18}
                            color={AX.navy}
                          />

                        </Animated.View>

                      </>

                    )}

                  </View>

                </TouchableOpacity>

              </Animated.View>


              {/* ==================================================
                  SECURE ACCESS
                  ================================================== */}

              <View
                style={
                  styles.dividerContainer
                }
              >

                <View
                  style={styles.divider}
                />


                <Animated.View
                  style={[
                    styles.securePill,

                    {
                      transform: [
                        {
                          scale:
                            securityScale,
                        },
                      ],

                      opacity:
                        securityOpacity,
                    },
                  ]}
                >

                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={14}
                    color={AX.green}
                  />

                  <Text
                    style={
                      styles.dividerText
                    }
                  >
                    SECURE ACCESS
                  </Text>

                </Animated.View>


                <View
                  style={styles.divider}
                />

              </View>


              {/* ==================================================
                  SECURITY ROW
                  ================================================== */}

              <View
                style={styles.securityRow}
              >

                <Animated.View
                  style={[
                    styles.securityIcon,

                    {
                      transform: [
                        {
                          scale:
                            securityScale,
                        },
                      ],

                      opacity:
                        securityOpacity,
                    },
                  ]}
                >

                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={15}
                    color={AX.green}
                  />

                </Animated.View>


                <Text
                  style={styles.securityText}
                >
                  Your connection and account
                  are protected
                </Text>

              </View>

            </Animated.View>


            {/* ==================================================
                INFORMATION CARD
                ================================================== */}

            <Animated.View
              style={[
                styles.infoCard,

                {
                  transform: [
                    {
                      translateY:
                        infoTranslate,
                    },
                  ],
                },
              ]}
            >

              <View
                style={styles.infoIcon}
              >

                <MaterialCommunityIcons
                  name="truck-fast-outline"
                  size={25}
                  color={AX.cyan}
                />

              </View>


              <View
                style={styles.infoContent}
              >

                <Text
                  style={styles.infoTitle}
                >
                  Everything in one place
                </Text>

                <Text
                  style={styles.infoText}
                >
                  Manage deliveries, drivers,
                  customers and operations from
                  one powerful platform.
                </Text>

              </View>


              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={theme.colors.textMuted}
              />

            </Animated.View>


            {/* ==================================================
                FOOTER
                ================================================== */}

            <ZPrimeFooter />

          </Animated.View>

        </ScrollView>

      </KeyboardAvoidingView>

    </View>
  );
};


// ======================================================
// EXPORT
// ======================================================

export default LoginScreen;


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ====================================================
  // SCREEN
  // ====================================================

  screen: {
    flex: 1,

    backgroundColor:
      AX.navyDeep,

    overflow: 'hidden',
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: 'center',

    paddingHorizontal: 22,

    paddingVertical: 38,
  },

  content: {
    width: '100%',

    maxWidth: 520,

    alignSelf: 'center',
  },


  // ====================================================
  // BACKGROUND
  // ====================================================

  backgroundGlow: {
    position: 'absolute',

    width: 330,
    height: 330,

    borderRadius: 165,

    opacity: 0.11,
  },

  backgroundGlowOne: {
    backgroundColor: AX.cyan,

    top: -150,

    right: -110,
  },

  backgroundGlowTwo: {
    backgroundColor: AX.navy,

    bottom: -140,

    left: -120,
  },


  // ====================================================
  // BRAND COLOR LINE
  // ====================================================

  brandLineContainer: {
    position: 'absolute',

    top: 0,

    left: 0,

    right: 0,

    height: 3,

    flexDirection: 'row',

    zIndex: 20,
  },

  brandLine: {
    height: 3,
  },


  // ====================================================
  // BRAND
  // ====================================================

  brandContainer: {
    alignItems: 'center',

    marginBottom: 25,

    position: 'relative',
  },

  logoOuterGlow: {
    position: 'absolute',

    width: 145,

    height: 145,

    borderRadius: 73,

    backgroundColor: AX.cyan,

    top: -28,

    opacity: 0.1,
  },

  logoContainer: {
    width: 112,

    height: 112,

    borderRadius: 34,

    backgroundColor: '#F8FBFF',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 14,

    borderWidth: 2,

    borderColor:
      'rgba(24,184,201,0.35)',

    shadowColor: AX.cyan,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.25,

    shadowRadius: 22,

    elevation: 12,

    position: 'relative',
  },

  logoInnerGlow: {
    position: 'absolute',

    width: 90,

    height: 90,

    borderRadius: 45,

    backgroundColor: AX.cyan,

    opacity: 0.035,
  },

  logo: {
    width: 94,

    height: 94,
  },

  particle: {
    position: 'absolute',

    width: 7,

    height: 7,

    borderRadius: 4,

    zIndex: 5,
  },

  particleGreen: {
    backgroundColor: AX.green,

    top: 12,

    left: '30%',
  },

  particleYellow: {
    backgroundColor: AX.yellow,

    top: 80,

    right: '24%',
  },

  particleRed: {
    backgroundColor: AX.red,

    top: 65,

    left: '20%',
  },

  brandName: {
    color: AX.white,

    fontSize: 25,

    fontWeight: '900',

    letterSpacing: 0.4,

    textAlign: 'center',
  },

  brandBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 8,

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor:
      'rgba(24,184,201,0.08)',

    borderWidth: 1,

    borderColor:
      'rgba(24,184,201,0.18)',
  },

  onlineDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: AX.green,

    marginRight: 7,
  },

  brandSubtitle: {
    color: '#A8C7D5',

    fontSize: 8.5,

    fontWeight: '800',

    letterSpacing: 1.2,
  },


  // ====================================================
  // LOGIN CARD
  // ====================================================

  card: {
    backgroundColor:
      '#111F4A',

    borderRadius: 27,

    borderWidth: 1,

    borderColor:
      'rgba(66,210,223,0.18)',

    padding: 25,

    position: 'relative',

    overflow: 'hidden',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 15,
    },

    shadowOpacity: 0.35,

    shadowRadius: 30,

    elevation: 14,
  },

  cardAccent: {
    position: 'absolute',

    top: 0,

    left: 30,

    right: 30,

    height: 3,

    backgroundColor: AX.cyan,

    borderBottomLeftRadius: 5,

    borderBottomRightRadius: 5,
  },

  cardColorAccent: {
    position: 'absolute',

    top: 0,

    left: 30,

    flexDirection: 'row',

    height: 3,
  },

  cardColor: {
    width: 16,

    height: 3,

    marginRight: 3,
  },


  // ====================================================
  // HEADER
  // ====================================================

  cardHeaderRow: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',
  },

  headerTextContainer: {
    flex: 1,
  },

  eyebrow: {
    color: AX.cyanLight,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.5,

    marginBottom: 7,
  },

  header: {
    color: AX.white,

    fontSize: 23,

    lineHeight: 35,

    fontWeight: '900',
  },

  headerIcon: {
    width: 46,

    height: 46,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      'rgba(24,184,201,0.08)',

    borderWidth: 1,

    borderColor:
      'rgba(24,184,201,0.18)',

    marginLeft: 15,
  },

  subHeader: {
    color: '#9DB3C9',

    fontSize: 12.5,

    lineHeight: 19,

    marginTop: 10,

    marginBottom: 25,
  },


  // ====================================================
  // ERROR
  // ====================================================

  errorBox: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(217,44,44,0.10)',

    borderWidth: 1,

    borderColor:
      'rgba(217,44,44,0.25)',

    borderRadius: 14,

    paddingHorizontal: 12,

    paddingVertical: 11,

    marginBottom: 18,
  },

  errorIcon: {
    width: 30,

    height: 30,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      'rgba(217,44,44,0.10)',
  },

  errorText: {
    flex: 1,

    color: '#FF8A80',

    fontSize: 12,

    lineHeight: 18,

    marginLeft: 10,
  },


  // ====================================================
  // INPUTS
  // ====================================================

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    color: '#91A9C0',

    fontSize: 9.5,

    fontWeight: '900',

    letterSpacing: 1.2,

    marginBottom: 8,
  },

  inputGroup: {
    height: 58,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#0C1839',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.07)',

    borderRadius: 16,

    paddingHorizontal: 10,
  },

  inputGroupFocused: {
    borderColor: AX.cyan,

    backgroundColor:
      '#10214B',

    shadowColor: AX.cyan,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    shadowOpacity: 0.22,

    shadowRadius: 12,

    elevation: 4,
  },

  inputIcon: {
    width: 38,

    height: 38,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,

    backgroundColor:
      'rgba(255,255,255,0.025)',
  },

  input: {
    flex: 1,

    height: '100%',

    color: AX.white,

    fontSize: 14,

    paddingVertical: 0,
  },

  visibilityButton: {
    width: 40,

    height: 40,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 12,
  },


  // ====================================================
  // FORGOT
  // ====================================================

  forgotButton: {
    alignSelf: 'flex-end',

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: -2,

    marginBottom: 21,

    paddingVertical: 4,
  },

  forgotText: {
    color: AX.cyanLight,

    fontSize: 12,

    fontWeight: '800',

    marginRight: 4,
  },


  // ====================================================
  // LOGIN BUTTON
  // ====================================================

  loginButton: {
    height: 59,

    backgroundColor: AX.cyan,

    borderRadius: 17,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    shadowColor: AX.cyan,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.25,

    shadowRadius: 13,

    elevation: 7,

    position: 'relative',
  },

  loginButtonDisabled: {
    backgroundColor: AX.cyanDark,

    opacity: 0.8,
  },

  buttonShimmer: {
    position: 'absolute',

    width: 55,

    height: 90,

    backgroundColor:
      'rgba(255,255,255,0.25)',

    top: -15,

    left: 0,
  },

  buttonInner: {
    width: '100%',

    paddingHorizontal: 17,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    zIndex: 2,
  },

  loginButtonText: {
    color: AX.navyDeep,

    fontSize: 14,

    fontWeight: '900',

    letterSpacing: 0.3,

    marginRight: 12,
  },

  arrowCircle: {
    width: 31,

    height: 31,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: AX.white,
  },


  // ====================================================
  // SECURE
  // ====================================================

  dividerContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 23,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor:
      'rgba(255,255,255,0.06)',
  },

  securePill: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 10,
  },

  dividerText: {
    color: '#7188A2',

    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 1.1,

    marginLeft: 5,
  },

  securityRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  securityIcon: {
    width: 27,

    height: 27,

    borderRadius: 9,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor:
      'rgba(97,168,59,0.09)',
  },

  securityText: {
    color: '#829AB3',

    fontSize: 10.5,

    marginLeft: 8,
  },


  // ====================================================
  // INFO CARD
  // ====================================================

  infoCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      '#101E45',

    borderWidth: 1,

    borderColor:
      'rgba(24,184,201,0.12)',

    borderRadius: 19,

    padding: 15,

    marginTop: 15,
  },

  infoIcon: {
    width: 46,

    height: 46,

    borderRadius: 14,

    backgroundColor:
      'rgba(24,184,201,0.08)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,

    borderWidth: 1,

    borderColor:
      'rgba(24,184,201,0.14)',
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: AX.white,

    fontSize: 13,

    fontWeight: '900',

    marginBottom: 4,
  },

  infoText: {
    color: '#829AB3',

    fontSize: 10.5,

    lineHeight: 16,
  },

});