import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore Recipes</ThemedText>
      </ThemedView>
      <ThemedText>Discover new recipes and cooking techniques.</ThemedText>
      <Collapsible title="Popular Categories">
        <ThemedText>
          Browse recipes by category: appetizers, main dishes, desserts, and more.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more about Expo Router</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Search by Ingredients">
        <ThemedText>
          Find recipes based on ingredients you have available in your kitchen.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Dietary Preferences">
        <ThemedText>
          Filter recipes by dietary requirements: vegetarian, vegan, gluten-free, and more.
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