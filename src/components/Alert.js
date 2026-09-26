// src/components/Alert.js
import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { theme } from '../theme/theme';

const AlertContext = createContext(null);

// --------------------------------------------------
// Provider
// --------------------------------------------------

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const closeAlert = () => {
    setAlert(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const showAlert = (
    title,
    message,
    buttons = [{ text: 'OK' }],
    options = {}
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      buttons,
      type: options.type || 'info',
    });
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        closeAlert,
      }}
    >
      {children}

      <AlertModal
        alert={alert}
        closeAlert={closeAlert}
      />
    </AlertContext.Provider>
  );
};

// --------------------------------------------------
// Alert Modal
// --------------------------------------------------

const AlertModal = ({ alert, closeAlert }) => {
  const {
    visible,
    title,
    message,
    buttons,
    type,
  } = alert;

  const colors = {
    info: {
      color: theme.colors.cyan,
      background: theme.colors.infoLight,
      icon: 'i',
    },

    success: {
      color: theme.colors.success,
      background: theme.colors.successLight,
      icon: '✓',
    },

    warning: {
      color: theme.colors.warning,
      background: theme.colors.warningLight,
      icon: '!',
    },

    danger: {
      color: theme.colors.danger,
      background: theme.colors.dangerLight,
      icon: '!',
    },
  };

  const current = colors[type] || colors.info;

  const handleButtonPress = button => {
    closeAlert();

    if (button.onPress) {
      // Run after closing the modal
      setTimeout(() => {
        button.onPress();
      }, 100);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeAlert}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: current.background,
              },
            ]}
          >
            <Text
              style={[
                styles.icon,
                {
                  color: current.color,
                },
              ]}
            >
              {current.icon}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {title}
          </Text>

          {/* Message */}
          {!!message && (
            <Text style={styles.message}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View
            style={[
              styles.buttons,
              buttons.length === 1 && styles.singleButton,
            ]}
          >
            {buttons.map((button, index) => {
              const isCancel =
                button.style === 'cancel';

              const isDestructive =
                button.style === 'destructive';

              const buttonColor = isDestructive
                ? theme.colors.danger
                : current.color;

              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() =>
                    handleButtonPress(button)
                  }
                  style={({ pressed }) => [
                    styles.button,

                    isCancel
                      ? styles.cancelButton
                      : {
                          backgroundColor: buttonColor,
                        },

                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,

                      isCancel
                        ? styles.cancelText
                        : {
                            color: theme.colors.black,
                          },
                    ]}
                  >
                    {button.text || 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --------------------------------------------------
// Same API as React Native Alert
// --------------------------------------------------

export const Alert = {
  alert: (...args) => {
    if (!global.__CUSTOM_ALERT__) {
      console.warn(
        'Custom Alert is not initialized. Make sure AlertProvider is added to App.js.'
      );

      return;
    }

    global.__CUSTOM_ALERT__(...args);
  },
};

// --------------------------------------------------
// Connect Alert.alert() to Provider
// --------------------------------------------------

export const AlertBridge = () => {
  const { showAlert } = useContext(AlertContext);

  React.useEffect(() => {
    global.__CUSTOM_ALERT__ = showAlert;

    return () => {
      global.__CUSTOM_ALERT__ = null;
    };
  }, [showAlert]);

  return null;
};

// --------------------------------------------------
// Styles
// --------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: theme.spacing.xxl,

    backgroundColor: theme.colors.overlayDark,
  },

  container: {
    width: '100%',
    maxWidth: 400,

    padding: theme.spacing.xxxl,

    borderRadius: theme.radius.xl,

    backgroundColor: theme.colors.surfaceElevated,

    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadows.elevated,
  },

  iconContainer: {
    width: 56,
    height: 56,

    borderRadius: theme.radius.round,

    alignSelf: 'center',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: theme.spacing.xxl,
  },

  icon: {
    fontSize: 26,
    fontWeight: '800',
  },

  title: {
    color: theme.colors.text,

    fontSize: 20,
    fontWeight: '700',

    textAlign: 'center',

    marginBottom: theme.spacing.md,
  },

  message: {
    color: theme.colors.textSecondary,

    fontSize: 15,
    lineHeight: 22,

    textAlign: 'center',

    marginBottom: theme.spacing.xxxl,
  },

  buttons: {
    flexDirection: 'row',

    gap: theme.spacing.md,
  },

  singleButton: {
    flexDirection: 'column',
  },

  button: {
    flex: 1,

    minHeight: 48,

    borderRadius: theme.radius.md,

    alignItems: 'center',
    justifyContent: 'center',

    ...theme.shadows.button,
  },

  cancelButton: {
    backgroundColor: theme.colors.overlayLight,

    borderWidth: 1,
    borderColor: theme.colors.borderLight,

    shadowOpacity: 0,
    elevation: 0,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  cancelText: {
    color: theme.colors.textSecondary,
  },

  pressed: {
    opacity: 0.7,
  },
});
