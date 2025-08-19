import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import IngredientSearch, { IngredientItem } from '@/components/IngredientSearch';
import RecipePhotoScanner from '@/components/RecipePhotoScanner';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// Use shared units utilities
import { UNIT_OPTIONS, buildAmount, parseAmount, type UnitGroup, type UnitOption } from '@/utils/units';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  // UI-only fields to build amount consistently
  qty?: string;
  unit?: string; // 'g'|'kg'|'ml'|'L'|'tsp'|'tbsp'|'cup'|'slice'|'clove'|'piece'|'pack'|'bottle'|'can'|'each'|'custom'
  customUnit?: string;
}

interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  instructions?: string;
  imageUri?: string;
  dateCreated: string;
}

export default function AddRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're in edit mode
  const isEditMode = params.editMode === 'true';
  const editRecipeId = params.recipeId as string;
  
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: '', qty: '', unit: 'each' }
  ]);
  const [showScanner, setShowScanner] = useState(false);
  // Unit picker state
  const [unitPickerVisible, setUnitPickerVisible] = useState(false);
  const [unitPickerForId, setUnitPickerForId] = useState<string | null>(null);

  // Load recipe data if in edit mode
  useEffect(() => {
    if (isEditMode && params.recipeData) {
      try {
        const recipeData = JSON.parse(params.recipeData as string) as Recipe;
        setTitle(recipeData.title);
        setInstructions(recipeData.instructions || '');
        setImageUri(recipeData.imageUri || null);
        const parsed = (recipeData.ingredients.length > 0 ? recipeData.ingredients : [{ id: '1', name: '', amount: '' }]).map((ing) => {
          const { qty, unit, customUnit } = parseAmount(ing.amount || '');
          return { ...ing, qty, unit, customUnit } as Ingredient;
        });
        setIngredients(parsed);
      } catch (error) {
        console.error('Error parsing recipe data:', error);
        Alert.alert('Error', 'Failed to load recipe data for editing');
      }
    }
  }, [isEditMode, params.recipeData]);

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: '',
      amount: '',
      qty: '',
      unit: 'each',
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    }
  };

  const updateIngredient = (id: string, field: 'name' | 'amount' | 'qty' | 'unit' | 'customUnit', value: string) => {
    setIngredients(prev => prev.map(ingredient => {
      if (ingredient.id !== id) return ingredient;
      const next = { ...ingredient, [field]: value } as Ingredient;
      if (field === 'qty' || field === 'unit' || field === 'customUnit') {
        next.amount = buildAmount(next.qty, next.unit, next.customUnit);
      }
      if (field === 'amount') {
        const parsed = parseAmount(value);
        next.qty = parsed.qty;
        next.unit = parsed.unit;
        next.customUnit = parsed.customUnit;
      }
      return next;
    }));
  };

  // Image helpers (restored)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permission to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Save (restored, now ensures amount is composed from qty/unit)
  const saveRecipe = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    // Compose amounts before validating
    const normalizedIngredients = ingredients.map(ing => ({
      ...ing,
      amount: ing.amount || buildAmount(ing.qty, ing.unit, ing.customUnit),
    }));

    const filledIngredients = normalizedIngredients.filter(ing => ing.name.trim() || (ing.amount && ing.amount.trim()));
    if (filledIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    try {
      const existingRecipes = await AsyncStorage.getItem('recipes');
      const recipes = existingRecipes ? JSON.parse(existingRecipes) : [];

      if (isEditMode && editRecipeId) {
        const recipeIndex = recipes.findIndex((r: Recipe) => r.id === editRecipeId);
        if (recipeIndex !== -1) {
          recipes[recipeIndex] = {
            ...recipes[recipeIndex],
            title: title.trim(),
            ingredients: filledIngredients.map((i: Ingredient) => ({ id: i.id, name: i.name, amount: i.amount })),
            instructions: instructions.trim(),
            imageUri: imageUri || undefined,
          };
        }
      } else {
        const recipe: Recipe = {
          id: Date.now().toString(),
          title: title.trim(),
          ingredients: filledIngredients.map((i: Ingredient) => ({ id: i.id, name: i.name, amount: i.amount })),
          instructions: instructions.trim(),
          imageUri: imageUri || undefined,
          dateCreated: new Date().toISOString()
        };
        recipes.push(recipe);
      }

      await AsyncStorage.setItem('recipes', JSON.stringify(recipes));

      const successMessage = isEditMode ? 'Recipe updated successfully!' : 'Recipe saved successfully!';
      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    }
  };

  const handleScannedRecipe = (extractedData: {
    title?: string;
    ingredients: { name: string; amount?: string }[];
    instructions?: string;
  }) => {
    if (extractedData.title) {
      setTitle(extractedData.title);
    }

    if (extractedData.ingredients.length > 0) {
      const formattedIngredients = extractedData.ingredients.map((ing, index) => {
        const parsed = parseAmount(ing.amount || '');
        return {
          id: `scanned_${Date.now()}_${index}`,
          name: ing.name,
          amount: ing.amount || '',
          qty: parsed.qty,
          unit: parsed.unit,
          customUnit: parsed.customUnit,
        } as Ingredient;
      });
      setIngredients(formattedIngredients);
    }

    if (extractedData.instructions) {
      setInstructions(extractedData.instructions);
    }

    setShowScanner(false);
  };

  // New: Back handler with web/no-history fallback
  const handleBack = () => {
    if ((router as any).canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <>
      {showScanner ? (
        <RecipePhotoScanner
          onRecipeExtracted={handleScannedRecipe}
          visible={showScanner}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              {isEditMode ? 'Edit Recipe' : 'Add New Recipe'}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.form}>
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Recipe Title</ThemedText>
                <TouchableOpacity onPress={() => setShowScanner(true)} style={styles.scanButton}>
                  <ThemedText style={styles.scanButtonText}>📷 Scan Recipe</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter recipe name..."
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Recipe Photo</ThemedText>
                <TouchableOpacity onPress={showImageOptions} style={styles.addButton}>
                  <ThemedText style={styles.addButtonText}>📷 Add Photo</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              {imageUri ? (
                <ThemedView style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.recipeImage} />
                  <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageButton}>
                    <ThemedText style={styles.removeImageText}>Remove Photo</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <ThemedView style={styles.placeholderContainer}>
                  <ThemedText style={styles.placeholderText}>No photo added yet</ThemedText>
                  <ThemedText style={styles.placeholderSubtext}>Tap &quot;Add Photo&quot; to upload an image</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Enter cooking instructions..."
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients</ThemedText>
                <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                  <ThemedText style={styles.addButtonText}>+ Add</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {ingredients.map((ingredient, index) => (
                <ThemedView key={ingredient.id} style={[styles.ingredientRow, { zIndex: 9999 - index }]}> 
                  <ThemedText style={styles.ingredientNumber}>{index + 1}.</ThemedText>
                  <ThemedView style={[styles.ingredientInputContainer, { zIndex: 9999 - index }]}> 
                    <IngredientSearch
                      onSelectIngredient={(selectedIngredient: IngredientItem) => 
                        updateIngredient(ingredient.id, 'name', selectedIngredient.name)
                      }
                      placeholder="Search ingredients..."
                      value={ingredient.name}
                      onChangeText={(text) => updateIngredient(ingredient.id, 'name', text)}
                    />
                  </ThemedView>

                  {/* Quantity input */}
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    placeholder="Qty"
                    value={ingredient.qty ?? ''}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'qty', text)}
                    placeholderTextColor="#999"
                  />

                  {/* Unit selector */}
                  <TouchableOpacity
                    style={[styles.unitButton]}
                    onPress={() => { setUnitPickerForId(ingredient.id); setUnitPickerVisible(true); }}
                  >
                    <ThemedText style={styles.unitButtonText}>
                      {(ingredient.unit === 'custom' ? (ingredient.customUnit || 'Custom') : (ingredient.unit || 'unit'))}
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Remove */}
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeIngredient(ingredient.id)}
                      style={styles.removeButton}
                    >
                      <ThemedText style={styles.removeButtonText}>×</ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              ))}
            </ThemedView>

            {/* Unit picker modal */}
            <Modal
              visible={unitPickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setUnitPickerVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Select unit</ThemedText>
                  <ScrollView style={{ maxHeight: 300 }}>
                    {(['Common', 'Weight', 'Volume', 'Kitchen', 'Other'] as UnitGroup[]).map((group) => (
                      <View key={group}>
                        <ThemedText style={styles.unitGroupLabel}>{group}</ThemedText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {UNIT_OPTIONS.filter(u => u.group === group).map((u: UnitOption) => (
                            <TouchableOpacity
                              key={u.value}
                              style={styles.unitChip}
                              onPress={() => {
                                if (!unitPickerForId) return;
                                updateIngredient(unitPickerForId, 'unit', u.value);
                                if (u.value !== 'custom') {
                                  const ing = ingredients.find(i => i.id === unitPickerForId);
                                  const nextAmount = buildAmount(ing?.qty, u.value, ing?.customUnit);
                                  updateIngredient(unitPickerForId, 'amount', nextAmount);
                                  setUnitPickerVisible(false);
                                  setUnitPickerForId(null);
                                }
                              }}
                            >
                              <ThemedText style={styles.unitChipText}>{u.label}</ThemedText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Custom unit input if selected */}
                  {!!unitPickerForId && (ingredients.find(i => i.id === unitPickerForId)?.unit === 'custom') && (
                    <View style={{ marginTop: 12 }}>
                      <ThemedText style={{ marginBottom: 6 }}>Custom unit</ThemedText>
                      <TextInput
                        placeholder="e.g., bottle, bar, sachet"
                        style={styles.input}
                        value={ingredients.find(i => i.id === unitPickerForId)?.customUnit || ''}
                        onChangeText={(t) => updateIngredient(unitPickerForId!, 'customUnit', t)}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={[styles.addButton, { marginTop: 10, alignSelf: 'flex-end' }]}
                        onPress={() => {
                          if (!unitPickerForId) return;
                          const ing = ingredients.find(i => i.id === unitPickerForId);
                          const nextAmount = buildAmount(ing?.qty, 'custom', ing?.customUnit);
                          updateIngredient(unitPickerForId, 'amount', nextAmount);
                          setUnitPickerVisible(false);
                          setUnitPickerForId(null);
                        }}
                      >
                        <ThemedText style={styles.addButtonText}>Done</ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => { setUnitPickerVisible(false); setUnitPickerForId(null); }}>
                    <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <TouchableOpacity onPress={saveRecipe} style={styles.saveButton}>
              <ThemedText style={styles.saveButtonText}>
                {isEditMode ? 'Update Recipe' : 'Save Recipe'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FF6B6B',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
    zIndex: 1,
  },
  section: {
    marginBottom: 30,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 1,
  },
  ingredientNumber: {
    width: 25,
    fontSize: 16,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  ingredientInputContainer: {
    flex: 2,
    marginRight: 10,
    zIndex: 9999,
  },
  ingredientNameInput: {
    flex: 2,
    marginRight: 10,
  },
  ingredientAmountInput: {
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  removeImageButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
  },
  qtyInput: {
    width: 70,
    marginRight: 8,
  },
  unitButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
    marginRight: 8,
  },
  unitButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
  },
  unitGroupLabel: { fontWeight: '700', marginTop: 8, marginBottom: 6 },
  unitChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  unitChipText: { fontWeight: '600', color: '#333' },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});
