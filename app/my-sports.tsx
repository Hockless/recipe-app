import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function MySportsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#CCE5FF', dark: '#0B1E3A' }}
      headerImage={<Ionicons size={310} name="football" style={styles.headerImage} />}>
      {/* Intentionally left blank – rebuilding from scratch */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#4B89DC',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
});
