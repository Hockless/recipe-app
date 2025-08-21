import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ReceiptsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F0E68C', dark: '#4A4A00' }}
      headerImage={<Ionicons size={310} name="receipt" style={styles.headerImage} />}> 
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Receipt Scanner</ThemedText>
      </ThemedView>
      <ThemedText>Scan grocery receipts to track expenses and ingredients.</ThemedText>
      <Collapsible title="Scan Receipt">
        <ThemedText>
          Use your camera to scan grocery receipts and automatically extract ingredient information.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Expense Tracking">
        <ThemedText>
          Keep track of your grocery spending and analyze your food budget over time.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Ingredient Database">
        <ThemedText>
          Build a database of ingredients you frequently buy to help with meal planning.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});