import React, {
  createContext,
  useContext,
  useState,
  useCallback,
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

export const CustomAlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  const closeAlert = useCallback(() => {
    setAlert(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showAlert = useCallback(
    (
      title,
      message,
      buttons = [{ text: 'OK' }],
      options = {}
    ) => {
      const confirmButton =
        buttons.find(button => button.text !== 'Cancel') ||
        { text: 'OK' };

      const cancelButton =
        buttons.find(button => button.text === 'Cancel');

      setAlert({
        visible: true,
        title,
        message,
        type: options.type || 'info',

        confirmText: confirmButton.text || 'OK',
        cancelText: cancelButton?.text || 'Cancel',

        showCancel: !!cancelButton,

        onConfirm: () => {
          closeAlert();

          if (confirmButton.onPress) {
            confirmButton.onPress();
          }
        },

        onCancel: () => {
          closeAlert();

          if (cancelButton?.onPress) {
            cancelButton.onPress();
          }
        },
      });
    },
    [closeAlert]
  );

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <CustomAlertModal
        {...alert}
      />
    </AlertContext.Provider>
  );
};

const CustomAlertModal = ({
  visible,
  title,
  message,
  type,
  confirmText,
  cancelText,
  showCancel,
  onConfirm,
  onCancel,
}) => {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

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

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.buttons}>

            {showCancel && (
              <Pressable
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelText}>
                  {cancelText}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.confirmButton,
                {
                  backgroundColor: current.color,
                },
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {confirmText}
              </Text>
            </Pressable>

          </View>
        </View>
      </View>
    </Modal>
  );
};

export const useCustomAlert = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error(
      'useCustomAlert must be used inside CustomAlertProvider'
    );
  }

  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
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

  cancelButton: {
    flex: 1,
    height: 48,

    borderRadius: theme.radius.md,

    backgroundColor: theme.colors.overlayLight,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButton: {
    flex: 1,
    height: 48,

    borderRadius: theme.radius.md,

    alignItems: 'center',
    justifyContent: 'center',

    ...theme.shadows.button,
  },

  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  confirmText: {
    color: theme.colors.black,
    fontSize: 15,
    fontWeight: '700',
  },
});
