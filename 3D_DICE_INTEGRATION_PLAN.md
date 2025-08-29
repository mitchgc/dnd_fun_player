# 3D Dice Integration Plan for D&D Helper

## Overview
Integration of `@3d-dice/dice-box-threejs` library to provide realistic 3D dice rolling animations while maintaining the existing unified roll system's functionality.

## Architecture Design

### 1. Integration Points

The current `RollEngine` already has a perfect integration point via the `customDiceRoller` config option:

```typescript
// src/utils/rollEngine.ts - Line 530-531
if (this.config.customDiceRoller) {
  return this.config.customDiceRoller(sides);
}
```

### 2. Proposed Architecture

```
┌─────────────────────┐
│   User Interface    │
│  (Roll Button)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   RollEngine        │
│  (Analyzes Roll)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3D Dice Service    │ ◄── New Component
│  (Visual Rolling)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Roll Results       │
│  (Display)          │
└─────────────────────┘
```

## Implementation Plan

### Phase 1: Core 3D Dice Service

Create `src/services/dice3DService.ts`:

```typescript
import DiceBox from '@3d-dice/dice-box-threejs';

export class Dice3DService {
  private diceBox: DiceBox | null = null;
  private pendingRolls: Map<string, (results: number[]) => void> = new Map();
  private isEnabled: boolean = false;
  
  initialize(containerId: string, options?: Partial<DiceBoxConfig>) {
    this.diceBox = new DiceBox(containerId, {
      onRollComplete: (results) => this.handleRollComplete(results),
      theme_colorset: 'sunset', // D&D aesthetic
      theme_material: 'metal',
      gravity_multiplier: 400,
      sounds: true,
      ...options
    });
    this.isEnabled = true;
  }
  
  async rollDice(notation: string, predeterminedResults?: number[]): Promise<number[]> {
    if (!this.isEnabled || !this.diceBox) {
      // Fallback to standard random rolls
      return this.fallbackRoll(notation);
    }
    
    // Format: "3d6@4,5,2" for predetermined results
    const rollNotation = predeterminedResults 
      ? `${notation}@${predeterminedResults.join(',')}`
      : notation;
    
    return new Promise((resolve) => {
      const rollId = crypto.randomUUID();
      this.pendingRolls.set(rollId, resolve);
      this.diceBox.roll(rollNotation);
    });
  }
  
  // For RollEngine integration
  createCustomRoller() {
    return async (sides: number): Promise<number> => {
      const results = await this.rollDice(`1d${sides}`);
      return results[0];
    };
  }
}

export const dice3DService = new Dice3DService();
```

### Phase 2: React Component Integration

Create `src/components/Dice3D/Dice3DContainer.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { dice3DService } from '../../services/dice3DService';

interface Dice3DContainerProps {
  enabled?: boolean;
  onReady?: () => void;
  className?: string;
}

export const Dice3DContainer: React.FC<Dice3DContainerProps> = ({ 
  enabled = true, 
  onReady,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (enabled && containerRef.current && !isInitialized) {
      dice3DService.initialize(containerRef.current.id, {
        // React-specific config
        onRollComplete: (results) => {
          // Could dispatch to Redux or context here
        }
      });
      setIsInitialized(true);
      onReady?.();
    }
  }, [enabled, isInitialized, onReady]);
  
  return (
    <div 
      id="dice-3d-container"
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      style={{ 
        display: enabled ? 'block' : 'none'
      }}
    />
  );
};
```

### Phase 3: RollEngine Integration

Modify `src/utils/rollEngine.ts`:

```typescript
import { dice3DService } from '../services/dice3DService';

export class RollEngine {
  constructor(config: Partial<RollEngineConfig> = {}) {
    this.config = {
      // ... existing config
      use3DDice: config.use3DDice ?? false,
      ...config
    };
    
    // Set up 3D dice if enabled
    if (this.config.use3DDice) {
      this.config.customDiceRoller = dice3DService.createCustomRoller();
    }
  }
  
  // Enhanced to handle 3D dice with predetermined results
  private async rollDiceWithOperations(expression: DiceExpression): Promise<DiceRoll> {
    const { count, sides, operations } = expression.parsed;
    
    // For 3D dice, we need to generate all results first
    let rolls: number[] = [];
    
    if (this.config.use3DDice) {
      // Generate predetermined results for visual consistency
      const predeterminedRolls = [];
      for (let i = 0; i < count; i++) {
        predeterminedRolls.push(Math.floor(Math.random() * sides) + 1);
      }
      
      // Visual roll with predetermined results
      rolls = await dice3DService.rollDice(`${count}d${sides}`, predeterminedRolls);
    } else {
      // Standard rolling
      for (let i = 0; i < count; i++) {
        rolls.push(this.rollSingleDie(sides));
      }
    }
    
    // ... rest of the method remains the same
  }
}
```

### Phase 4: UI Integration

Update `src/components/Rolls/RollPopup.jsx`:

```jsx
import { Dice3DContainer } from '../Dice3D/Dice3DContainer';
import { useSettings } from '../../hooks/useSettings';

export const RollPopup = ({ onRoll, rollConfig }) => {
  const { use3DDice } = useSettings();
  const [showDiceAnimation, setShowDiceAnimation] = useState(false);
  
  const handleRoll = async () => {
    if (use3DDice) {
      setShowDiceAnimation(true);
      // 3D dice will handle the visual
    }
    
    // Execute roll through engine
    const result = await rollEngine.executeRoll(rollConfig);
    
    // Display results after animation
    setTimeout(() => {
      setShowDiceAnimation(false);
      onRoll(result);
    }, 2000); // Adjust based on animation duration
  };
  
  return (
    <>
      {/* Existing UI */}
      <button onClick={handleRoll}>Roll</button>
      
      {/* 3D Dice overlay */}
      {showDiceAnimation && (
        <Dice3DContainer 
          enabled={use3DDice}
          className="animate-fade-in"
        />
      )}
    </>
  );
};
```

### Phase 5: Settings & Configuration

Create `src/hooks/useSettings.ts`:

```typescript
export const useSettings = () => {
  const [settings, setSettings] = useState({
    use3DDice: true,
    diceTheme: 'sunset',
    diceMaterial: 'metal',
    diceSound: true,
    diceAnimationSpeed: 1.0
  });
  
  const updateDiceSettings = (newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Re-initialize dice service with new settings
    if (newSettings.diceTheme || newSettings.diceMaterial) {
      dice3DService.updateTheme({
        theme_colorset: newSettings.diceTheme,
        theme_material: newSettings.diceMaterial
      });
    }
  };
  
  return { ...settings, updateDiceSettings };
};
```

## Advanced Features

### 1. Multi-Expression Support

For complex rolls like attack + damage:

```typescript
// Roll attack and damage with separate 3D animations
const attackRoll = await dice3DService.rollDice("1d20+5");
const damageRoll = await dice3DService.rollDice("2d6+3");

// Or combined notation
const combined = await dice3DService.rollDice("1d20+5,2d6+3");
```

### 2. Advantage/Disadvantage Visualization

```typescript
// Show both d20s for advantage
const advantageRoll = await dice3DService.rollDice("2d20kh1");
// Library will show both dice, highlight the kept one
```

### 3. Critical Hit Effects

```typescript
// Special effects for crits
if (roll.criticalSuccess) {
  dice3DService.playEffect('critical');
  // Could trigger special dice colors or particle effects
}
```

## Integration Benefits

1. **Non-Breaking**: Uses existing `customDiceRoller` config
2. **Progressive Enhancement**: Falls back to standard rolls if 3D disabled
3. **Deterministic**: Pre-generates results for visual consistency
4. **Performant**: Async handling prevents UI blocking
5. **Configurable**: Users can toggle on/off, customize appearance

## Installation Steps

```bash
# 1. Install the library
npm install @3d-dice/dice-box-threejs

# 2. Copy required assets
cp -r node_modules/@3d-dice/dice-box-threejs/public/* public/dice-assets/

# 3. Update public/index.html to include Three.js if needed
```

## Configuration Options

```javascript
const diceConfig = {
  // Visual themes
  theme_colorset: 'sunset' | 'white' | 'black' | 'custom',
  theme_material: 'metal' | 'wood' | 'glass' | 'plastic',
  
  // Physics
  gravity_multiplier: 400,  // How fast dice fall
  throw_force: 5,           // How hard dice are thrown
  
  // Display
  scale: 100,               // Size of dice
  shadows: true,            // Enable shadows
  
  // Audio
  sounds: true,             // Enable dice sounds
  volume: 0.5,             // Sound volume
  
  // Performance
  delay: 10,               // Delay between dice throws
  timeout: 20000          // Max time for roll animation
};
```

## Testing Strategy

1. **Unit Tests**: Mock `dice3DService` for RollEngine tests
2. **Integration Tests**: Test fallback behavior when 3D disabled
3. **Visual Tests**: Manual testing of dice animations
4. **Performance Tests**: Ensure no lag with multiple dice

## Potential Challenges & Solutions

### Challenge 1: Bundle Size
- **Solution**: Lazy load 3D dice module only when enabled

### Challenge 2: Mobile Performance
- **Solution**: Auto-disable on low-end devices, reduce quality settings

### Challenge 3: Multiple Simultaneous Rolls
- **Solution**: Queue system for sequential animations

### Challenge 4: Result Sync
- **Solution**: Pre-generate results, pass to both engine and 3D service

## Future Enhancements

1. **Custom Dice Sets**: User-uploaded textures
2. **Roll History Replay**: Re-watch previous rolls
3. **Multiplayer Sync**: Share dice animations in real-time
4. **AR Mode**: Roll dice on real table using camera
5. **Dice Customization**: Colors, materials, effects per character

## Conclusion

This integration provides a visually engaging dice rolling experience while maintaining the robustness of the existing unified roll system. The architecture ensures clean separation of concerns and allows for progressive enhancement based on user preferences and device capabilities.