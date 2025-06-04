# Screen Orientation Guide

This guide explains how to enable and control screen orientation for specific screens in your React Native Expo app.

## Setup

1. **Install Dependencies**
```bash
npx expo install expo-screen-orientation
```

2. **Update app.json**
```json
{
  "expo": {
    "orientation": "default"
  }
}
```

## Usage

### Basic Usage

Import and use the `useScreenOrientation` hook in any screen:

```javascript
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function MyScreen() {
  // Enable rotation for this screen
  useScreenOrientation(true);
  
  return (
    // Your screen content
  );
}
```

### Configuration Options

```javascript
// Allow all orientations
useScreenOrientation(true);

// Keep portrait locked (default behavior)
useScreenOrientation(false);

// Custom lock orientation when leaving screen
useScreenOrientation(true, ScreenOrientation.OrientationLock.LANDSCAPE);
```

### Predefined Configurations

```javascript
import { useScreenOrientation, OrientationConfig } from '../hooks/useScreenOrientation';

// Allow all orientations
useScreenOrientation(OrientationConfig.ALL.enableRotation);

// Portrait only
useScreenOrientation(OrientationConfig.PORTRAIT_ONLY.enableRotation);

// Default (portrait locked)
useScreenOrientation(OrientationConfig.DEFAULT.enableRotation);
```

## Examples

### 1. Grades Screen (Responsive Table)
```javascript
// GradesScreen.js
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function GradesScreen() {
  // Enable rotation to show more table columns in landscape
  useScreenOrientation(true);
  
  // Detect orientation for responsive design
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const isLandscape = screenData.width > screenData.height;
  
  return (
    // Responsive table based on orientation
  );
}
```

### 2. Video Player Screen
```javascript
// VideoPlayerScreen.js
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function VideoPlayerScreen() {
  // Allow rotation for better video viewing
  useScreenOrientation(true);
  
  return (
    // Video player content
  );
}
```

### 3. Form Screen (Portrait Only)
```javascript
// FormScreen.js
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export default function FormScreen() {
  // Keep portrait for better form UX
  useScreenOrientation(false);
  
  return (
    // Form content
  );
}
```

## How It Works

1. **Screen Focus**: When a screen comes into focus, the hook enables/disables rotation
2. **Screen Blur**: When leaving the screen, it locks back to portrait (or specified orientation)
3. **Automatic**: No manual intervention needed - works with navigation

## Benefits

- ✅ **Per-Screen Control**: Each screen can have its own orientation behavior
- ✅ **Automatic Management**: Handles orientation locking/unlocking automatically
- ✅ **Navigation Aware**: Works seamlessly with React Navigation
- ✅ **Reusable**: One hook for all screens
- ✅ **Configurable**: Multiple preset configurations available

## Screens Currently Using Rotation

- **GradesScreen**: Enabled for responsive table viewing
- **TimetableScreen**: Optional (commented out by default)

## Adding to New Screens

Simply add one line to any screen component:

```javascript
useScreenOrientation(true); // Enable rotation
// or
useScreenOrientation(false); // Keep portrait locked
```

The hook will automatically handle the rest!
