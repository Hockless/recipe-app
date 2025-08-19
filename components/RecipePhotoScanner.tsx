import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
// Removed static import of expo-mlkit-ocr to prevent crash on web
// import ExpoMlkitOcr from 'expo-mlkit-ocr';

// Shared result type for extracted recipes
type ExtractedRecipe = {
  title?: string;
  ingredients: Array<{ name: string; amount?: string }>;
  instructions?: string;
};

import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface RecipePhotoScannerProps {
  onRecipeExtracted: (extractedData: {
    title?: string;
    ingredients: Array<{ name: string; amount?: string }>;
    instructions?: string;
  }) => void;
  visible: boolean;
  onClose: () => void;
}

// Lazy-load OCR module only on native platforms to avoid web crash
let OCR_MODULE: any | null = null;
const loadOcrModule = async () => {
  if (Platform.OS === 'web') {
    throw new Error('web-not-supported');
  }
  if (!OCR_MODULE) {
    const mod: any = await import('expo-mlkit-ocr');
    OCR_MODULE = mod?.default ?? mod;
  }
  return OCR_MODULE;
};

export default function RecipePhotoScanner({ onRecipeExtracted, visible, onClose }: RecipePhotoScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo) {
          await processImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const normalizeUriForOcr = async (uri: string): Promise<string> => {
    try {
      if (uri.startsWith('content://')) {
        const dest = `${FileSystem.cacheDirectory}ocr-${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        return dest;
      }
      // Ensure we pass a file:// or absolute path; expo-mlkit-ocr accepts file://
      return uri;
    } catch (e) {
      console.warn('Failed to normalize URI for OCR, using original. Error:', e);
      return uri;
    }
  };

  type OcrPoint = { x: number; y: number };
  type OcrLine = { text: string; cornerPoints: OcrPoint[] };
  type OcrBlock = { text: string; cornerPoints: OcrPoint[]; lines: OcrLine[] };

  const getBounds = (points: OcrPoint[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  };

  const parseRecipeFromOcr = (ocr: { blocks: OcrBlock[]; text?: string }): ExtractedRecipe => {
    const blocks = ocr?.blocks ?? [];
    if (!blocks.length) return { title: undefined, ingredients: [], instructions: undefined };

    // Flatten all lines with geometry
    const allLines = blocks.flatMap(b => (b.lines || []).map(l => {
      const bnd = getBounds(l.cornerPoints || []);
      return { text: (l.text || '').trim(), ...bnd };
    })).filter(l => l.text.length > 0);

    if (!allLines.length) return { title: undefined, ingredients: [], instructions: undefined };

    // Page bounds
    const allPoints: OcrPoint[] = blocks.flatMap(b => b.cornerPoints || []);
    const page = getBounds(allPoints);
    const pageW = Math.max(1, page.width);
    const pageH = Math.max(1, page.height);
    const midX = page.minX + pageW / 2;
    const sideMargin = pageW * 0.08; // 8% margin away from center for safety

    // Title: lines in top band, prefer widest/tallest
    const topBandY = page.minY + pageH * 0.18;
    const topLines = allLines
      .filter(l => l.minY < topBandY && l.width > pageW * 0.25)
      .sort((a, b) => a.minY - b.minY || a.minX - b.minX);

    // Heuristic: pick up to first 2-3 prominent lines (by height), near the very top
    const prominent = [...topLines]
      .sort((a, b) => b.height - a.height || a.minY - b.minY)
      .slice(0, 3)
      .sort((a, b) => a.minY - b.minY || a.minX - b.minX);

    let title = prominent.map(l => l.text).join(' ').trim();

    // If title still empty, fallback to absolute top-most long line
    if (!title) {
      const candidate = allLines.sort((a, b) => a.minY - b.minY || b.width - a.width)[0];
      title = candidate?.text?.trim() || '';
    }

    // Determine title bottom to exclude it from ingredients
    const titleBottom = prominent.length ? Math.max(...prominent.map(l => l.maxY)) : (page.minY + pageH * 0.12);

    // Left column ingredient candidates: left of mid minus margin, below title
    const leftLines = allLines
      .filter(l => l.cx < (midX - sideMargin) && l.minY > titleBottom)
      .sort((a, b) => a.minY - b.minY || a.minX - b.minX)
      .map(l => l.text);

    // Filter out metadata/notes often present in left column
    const metaPatterns = [
      /^serves\b/i, /^prep\b/i, /^cook\b/i, /per\s+serving/i, /cals|calories|protein|carbs/i,
      /^non[-\s]?fast\s+day/i, /^cook'?s\s+tip/i, /^tip\b/i, /^get ahead/i, /^serve\b/i
    ];

    const cleanedLeft = leftLines.filter(t => {
      const s = t.trim();
      if (s.length < 2) return false;
      if (s.endsWith(':')) return false; // section headers like "For the dressing:"
      return !metaPatterns.some(rx => rx.test(s));
    });

    // Try to parse ingredients from cleanedLeft
    const ingredients: Array<{ name: string; amount?: string }> = [];
    for (const line of cleanedLeft) {
      const ing = parseIngredientLine(line, [
        'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
        'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'g', 'gram', 'grams',
        'kg', 'kilogram', 'kilograms', 'ml', 'liter', 'liters', 'pint', 'pints',
        'quart', 'quarts', 'gallon', 'gallons', 'inch', 'inches', 'cm', 'piece', 'pieces',
        'slice', 'slices', 'clove', 'cloves', 'dash', 'pinch', 'handful', 'tbsp', 'tsp'
      ]);
      if (ing) ingredients.push(ing);
    }

    return { title: title || undefined, ingredients, instructions: undefined };
  };

  const processImage = async (imageUri: string) => {
    try {
      // Web guard: OCR not supported on web
      if (Platform.OS === 'web') {
        setIsProcessing(false);
        Alert.alert(
          'Not supported on web',
          'OCR scanning requires the native app. Please run on Android or iOS (dev build or installed build).',
          [{ text: 'OK' }]
        );
        return;
      }

      const uri = await normalizeUriForOcr(imageUri);

      // Load OCR module dynamically (handles missing native module gracefully)
      let result: any;
      try {
        const Ocr = await loadOcrModule();
        result = await Ocr.recognizeText(uri);
      } catch (e: any) {
        setIsProcessing(false);
        const msg = String(e?.message || e);
        if (msg.includes('web-not-supported')) {
          Alert.alert('Not supported on web', 'Please build and run on a device to use OCR.', [{ text: 'OK' }]);
        } else {
          Alert.alert(
            'OCR module unavailable',
            'The OCR module is not available. Make sure expo-mlkit-ocr is installed and the app has been rebuilt (native build).',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      // First, try geometry-aware parsing (title + left-column ingredients only)
      let parsedRecipe: ExtractedRecipe = parseRecipeFromOcr(result);

      // Fallback: if ingredients empty, use plain-text parser
      if (!parsedRecipe.ingredients.length) {
        const extractedText = result?.text?.trim() ?? '';
        if (extractedText) {
          parsedRecipe = parseRecipeText(extractedText);
        }
      }

      setIsProcessing(false);

      if (parsedRecipe.title || parsedRecipe.ingredients.length > 0) {
        onRecipeExtracted(parsedRecipe);
        onClose();
      } else {
        Alert.alert(
          'Could not parse recipe',
          'We detected text, but could not recognize ingredients or a title. You can still enter the details manually.',
          [ { text: 'OK' } ]
        );
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
      Alert.alert(
        'Processing Error',
        'Failed to run text recognition. Please try again with a clearer photo.',
        [ { text: 'OK' } ]
      );
    }
  };

  const parseRecipeText = (text: string): ExtractedRecipe => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let title = '';
    const ingredients: Array<{ name: string; amount?: string }> = [];
    let instructions = '';
    
    let currentSection = 'title';
    let ingredientSection = false;
    
    // Common ingredient keywords to help identify ingredient sections
    const ingredientKeywords = [
      'ingredients', 'ingredient', 'you will need', 'what you need',
      'shopping list', 'supplies', 'items needed'
    ];
    
    // Common instruction keywords
    const instructionKeywords = [
      'instructions', 'method', 'directions', 'steps', 'how to', 'preparation'
    ];
    
    // Common measurement units
    const measurements = [
      'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
      'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'g', 'gram', 'grams',
      'kg', 'kilogram', 'kilograms', 'ml', 'liter', 'liters', 'pint', 'pints',
      'quart', 'quarts', 'gallon', 'gallons', 'inch', 'inches', 'cm', 'piece', 'pieces',
      'slice', 'slices', 'clove', 'cloves', 'dash', 'pinch', 'handful'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Try to identify title (usually first meaningful line)
      if (currentSection === 'title' && line.length > 3 && !title) {
        // Skip common headers
        if (!ingredientKeywords.some(keyword => line.includes(keyword)) && 
            !instructionKeywords.some(keyword => line.includes(keyword))) {
          title = lines[i];
          continue;
        }
      }
      
      // Check if we're entering ingredients section
      if (ingredientKeywords.some(keyword => line.includes(keyword))) {
        ingredientSection = true;
        currentSection = 'ingredients';
        continue;
      }
      
      // Check if we're entering instructions section
      if (instructionKeywords.some(keyword => line.includes(keyword))) {
        ingredientSection = false;
        currentSection = 'instructions';
        continue;
      }
      
      // Parse ingredients
      if (ingredientSection || currentSection === 'ingredients') {
        // Skip if line looks like a section header
        if (instructionKeywords.some(keyword => line.includes(keyword))) {
          ingredientSection = false;
          currentSection = 'instructions';
          continue;
        }
        
        const originalLine = lines[i];
        
        // Try to parse ingredient with amount
        const ingredient = parseIngredientLine(originalLine, measurements);
        if (ingredient) {
          ingredients.push(ingredient);
        }
      }
      
      // Parse instructions
      if (currentSection === 'instructions' && !ingredientSection) {
        if (!instructionKeywords.some(keyword => line.includes(keyword))) {
          instructions += lines[i] + '\n';
        }
      }
    }
    
    return {
      title: title || undefined,
      ingredients,
      instructions: instructions.trim() || undefined
    };
  };

  const parseIngredientLine = (line: string, measurements: string[]): { name: string; amount?: string } | null => {
    const trimmed = line.trim();
    
    // Skip very short lines or lines that look like headers
    if (trimmed.length < 3 || trimmed.endsWith(':')) {
      return null;
    }
    
    // Look for patterns like "2 cups flour" or "1 tbsp olive oil"
    const measurementPattern = new RegExp(`^([0-9]+(?:[./][0-9]+)?(?:\\s*[-–]\\s*[0-9]+(?:[./][0-9]+)?)?)\\s*(${measurements.join('|')})(?:s)?\\s+(.+)$`, 'i');
    const match = trimmed.match(measurementPattern);
    
    if (match) {
      const amount = `${match[1]} ${match[2]}`;
      const name = match[3].trim();
      return { name, amount };
    }
    
    // Look for patterns like "flour - 2 cups" or "olive oil (1 tbsp)"
    const reversePattern = /^(.+?)(?:\s*[-–(]\s*([0-9]+(?:[./][0-9]+)?(?:\s*[-–]\s*[0-9]+(?:[./][0-9]+)?)?)\s*([a-zA-Z]+)(?:s)?\s*[)]?)$/i;
    const reverseMatch = trimmed.match(reversePattern);
    
    if (reverseMatch && measurements.some(m => reverseMatch[3].toLowerCase().includes(m.toLowerCase()))) {
      const name = reverseMatch[1].trim();
      const amount = `${reverseMatch[2]} ${reverseMatch[3]}`;
      return { name, amount };
    }
    
    // If no amount found but looks like an ingredient, just return the name
    if (trimmed.match(/^[a-zA-Z][a-zA-Z\s]+$/)) {
      return { name: trimmed };
    }
    
    return null;
  };

  const toggleFlash = () => {
    setFlash(flash === 'off' ? 'on' : 'off');
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <ThemedView style={styles.container}>
          <ThemedView style={styles.permissionContainer}>
            <ThemedText style={styles.permissionText}>Camera permission required</ThemedText>
            <ThemedText style={styles.permissionSubtext}>
              To scan recipes from photos, please grant camera access.
            </ThemedText>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <ThemedView style={styles.container}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <ThemedText style={styles.processingText}>
              Extracting recipe from photo...
            </ThemedText>
          </View>
        )}
        
        <CameraView
          style={styles.camera}
          facing={facing}
          flash={flash}
          ref={cameraRef}
        >
          <View style={styles.buttonContainer}>
            {/* Close button */}
            <TouchableOpacity style={styles.topButton} onPress={onClose}>
              <ThemedText style={styles.buttonText}>✕</ThemedText>
            </TouchableOpacity>
            
            {/* Flash toggle */}
            <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
              <ThemedText style={styles.buttonText}>
                {flash === 'off' ? '🔦' : '💡'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomControls}>
            {/* Gallery button */}
            <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
              <ThemedText style={styles.controlButtonText}>📁</ThemedText>
            </TouchableOpacity>
            
            {/* Capture button */}
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            {/* Flip camera button */}
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <ThemedText style={styles.controlButtonText}>🔄</ThemedText>
            </TouchableOpacity>
          </View>
        </CameraView>
        
        <ThemedView style={styles.instructionBar}>
          <ThemedText style={styles.instructionText}>
            📷 Position the recipe in the frame and tap the capture button
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  topButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  captureButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonInner: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  instructionBar: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});
