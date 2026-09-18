// src/theme/theme.js

export const theme = {
  colors: {
    // ---------------- Brand / Primary ----------------
    primary: '#00D8FF',
    primaryDark: '#009FC2',
    primaryLight: '#8DEFFF',

    // ---------------- Background ----------------
    background: '#020F24',
    backgroundSecondary: '#03152E',

    // ---------------- Surfaces ----------------
    surface: '#02152E',
    surfaceSecondary: '#061C38',
    surfaceElevated: '#082442',
    navy: '#061B36',

    // ---------------- Text ----------------
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textMuted: '#777777',
    textDisabled: '#555555',

    // ---------------- Borders / Dividers ----------------
    border: 'rgba(0,216,255,0.12)',
    borderLight: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.06)',

    // ---------------- Cyan ----------------
    cyan: '#00D8FF',
    cyanLight: '#8DEFFF',
    cyanDark: '#009FC2',

    // ---------------- Purple ----------------
    purple: '#4F46E5',
    purpleLight: '#8F8CFF',
    purpleDark: '#3730A3',

    // ---------------- Status ----------------
    success: '#16A34A',
    successLight: '#DCFCE7',

    warning: '#D97706',
    warningLight: '#FEF3C7',

    info: '#0891B2',
    infoLight: '#CFFAFE',

    danger: '#E74C3C',
    dangerLight: '#FEE2E2',

    // ---------------- Basic ----------------
    white: '#FFFFFF',
    black: '#000000',

    // ---------------- Transparent / Overlay ----------------
    overlayLight: 'rgba(255,255,255,0.08)',
    overlayMedium: 'rgba(255,255,255,0.12)',
    overlayDark: 'rgba(0,0,0,0.30)',
  },

  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 15,
    xl: 18,
    xxl: 20,
    round: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 15,
    xxl: 20,
    xxxl: 24,
    huge: 35,
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },

    elevated: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 5,
    },

    button: {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
  },
};
