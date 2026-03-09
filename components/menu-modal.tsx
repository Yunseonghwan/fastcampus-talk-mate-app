import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const MENU_ITEMS = [
  { label: '대화기록', icon: 'history' as const, route: '/chat-history' },
  { label: '토큰구매', icon: 'shopping-cart' as const, route: '/token-purchase' },
  { label: '권한설정', icon: 'settings' as const, route: 'settings' },
] as const;

type MenuModalProps = {
  visible: boolean;
  onClose: () => void;
};

const MenuModal = ({ visible, onClose }: MenuModalProps) => {
  const handleMenuPress = (route: string) => {
    onClose();
    if (route === 'settings') {
      Linking.openSettings();
    } else {
      router.push(route as any);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.route}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleMenuPress(item.route)}
            >
              <MaterialIcons name={item.icon} size={22} color="#333" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 260,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemPressed: {
    backgroundColor: '#f4f4f5',
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11181C',
  },
});

export default MenuModal;
