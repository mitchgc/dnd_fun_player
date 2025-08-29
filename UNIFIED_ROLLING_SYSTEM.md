# Unified Rolling System Design - Updated Specification

## Current State Analysis

### Existing Roll Calculation Methods

1. **Basic Dice Rolling** (`src/utils/diceUtils.js`)
   - `rollDice(sides)` - Simple random generation
   - No support for multiple dice or modifiers

2. **Attack Rolls** (`useDiceRolls.js`)
   - Weapon attacks with advantage/disadvantage
   - Spell attacks with multi-beam support (Eldritch Blast)
   - Hardcoded conditional damage (Sneak Attack)

3. **Standard Rolls** (`performStandardRoll`)
   - Skills, ability checks, saves
   - Simple modifier addition
   - No advantage/disadvantage support

4. **Spell Saves** (`App.tsx`)
   - Inline damage parsing
   - No actual save rolling (just DC display)
   - Separate from attack system

### Identified Hardcoded Special Cases (PRIORITY FIXES)

1. **Eldritch Blast Beam Scaling** (3 locations)
   - String matching: `ability.ability_name?.toLowerCase().includes('eldritch blast')`
   - Level thresholds: 5th(2), 11th(3), 17th(4) beams hardcoded

2. **Weapon Damage Detection** (2 locations)
   - `if (weapon.damage_dice?.includes('d8')) { ... } else { /* assume d6 */ }`
   - Only supports d6/d8, no d4/d10/d12/d20 weapons

3. **Sneak Attack Assumptions** (2 locations)
   - `if (bonus.damage_dice?.includes('3d6'))` assumes all conditional damage is 3d6
   - No level scaling or different conditional abilities

4. **Target AC Hardcoding**
   - `const hits_target = attackTotal >= 15; // Assume AC 15`

5. **Death Save Constants**
   - DC 10, nat 20/1 success/failure hardcoded

6. **Healing Formulas**
   - Basic healing potion 2d4+2 hardcoded

## D&D Roll Types Matrix

| Roll Type | Current Support | Required Features |
|-----------|----------------|-------------------|
| **Attack Rolls** | ✅ Partial | Advantage, crits, finesse |
| **Damage Rolls** | ✅ Basic | Resistance, vulnerability, rerolls |
| **Ability Checks** | ✅ Basic | Advantage, guidance, expertise |
| **Saving Throws** | ⚠️ Limited | Death saves, concentration |
| **Initiative** | ❌ None | Dex mod, Alert feat, advantages |
| **Contested Rolls** | ❌ None | Grapple, shove, deception vs insight |
| **Tool Checks** | ❌ None | Proficiency, expertise |
| **Group Checks** | ❌ None | Average of multiple rolls |
| **Percentile Rolls** | ❌ None | Wild magic, divine intervention |

## Scalability Requirements

### Bonus Sources
- **Equipment**: +1/+2/+3 weapons, magic items
- **Spells**: Bless, Guidance, Haste, Shield of Faith
- **Class Features**: Rage, Bardic Inspiration, Aura of Protection
- **Feats**: Lucky, Great Weapon Master, Sharpshooter
- **Conditions**: Cover, high ground, flanking (optional rules)
- **Homebrew**: Custom bonuses, house rules

### Bonus Types
- **Flat modifiers**: +2 to hit, +5 damage
- **Additional dice**: 1d4 guidance, 2d6 sneak attack
- **Advantage/Disadvantage**: Roll twice, take best/worst
- **Rerolls**: Reroll 1s and 2s (Great Weapon Fighting)
- **Dice manipulation**: Change after rolling (Lucky, Portent)
- **Critical changes**: Expanded crit range (19-20)
- **Resistance/Vulnerability**: Half or double damage

## Unified Rolling System Architecture

### Core Components

```typescript
// 1. Roll Definition
interface RollDefinition {
  id: string;
  type: RollType;
  baseExpression: DiceExpression;
  context: RollContext;
  modifiers: RollModifier[];
}

// 2. Enhanced Dice Expression Parser (IMPROVED ARCHITECTURE)
interface DiceExpression {
  expression: string; // Raw "3d6+2kh1" for parsing
  parsed: {
    count: number;
    sides: number;
    modifier?: number;
    operations: Operation[]; // keep, drop, reroll, explode
  };
}

interface Operation {
  type: 'keep_highest' | 'keep_lowest' | 'drop_highest' | 'drop_lowest' | 'reroll' | 'explode' | 'minimum';
  value: number; // how many to keep/drop, or threshold for reroll/explode/minimum
}

// Supports advanced notation:
// - "2d20kh1" (advantage)
// - "2d20kl1" (disadvantage)  
// - "4d6dl1" (ability score generation)
// - "1d6r1,2" (Great Weapon Fighting reroll 1s and 2s)
// - "1d6x6" (exploding dice on 6s)
// - "2d6m3" (minimum 3 per die)

// 3. Roll Context (for conditional bonuses)
interface RollContext {
  character: Character;
  source: {
    type: 'weapon' | 'spell' | 'ability' | 'skill' | 'save';
    name: string;
    tags: string[]; // ['melee', 'finesse', 'spell_attack', etc.]
  };
  target?: {
    ac?: number;
    saveBonus?: number;
    conditions: string[]; // ['prone', 'stunned', etc.]
  };
  environment: {
    advantage: boolean;
    disadvantage: boolean;
    hidden: boolean;
    blessed: boolean;
    inspired: boolean;
    // ... other conditions
  };
}

// 4. Modifier System
interface RollModifier {
  id: string;
  name: string;
  source: ModifierSource;
  type: ModifierType;
  value: number | DiceExpression;
  condition?: (context: RollContext) => boolean;
  application: ApplicationTiming;
  stacks: boolean;
}

enum ModifierSource {
  ABILITY_SCORE = 'ability_score',
  PROFICIENCY = 'proficiency',
  EXPERTISE = 'expertise',
  ITEM = 'item',
  SPELL = 'spell',
  CLASS_FEATURE = 'class_feature',
  FEAT = 'feat',
  CONDITION = 'condition',
  HOMEBREW = 'homebrew'
}

enum ModifierType {
  FLAT_BONUS = 'flat',          // +2
  DICE_BONUS = 'dice',          // +1d4
  ADVANTAGE = 'advantage',       // Roll twice, keep highest
  DISADVANTAGE = 'disadvantage', // Roll twice, keep lowest
  REROLL = 'reroll',            // Reroll certain values
  MINIMUM = 'minimum',          // Treat rolls below X as X
  CRITICAL_RANGE = 'crit_range', // Crit on 19-20
  MULTIPLIER = 'multiplier',    // Double damage (vulnerability)
  DIVIDER = 'divider'          // Half damage (resistance)
}

enum ApplicationTiming {
  BEFORE_ROLL = 'before',      // Advantage, bless
  AFTER_ROLL = 'after',        // Lucky feat, cutting words
  ON_DAMAGE = 'on_damage',     // Resistance, vulnerability
  ONCE_PER_TURN = 'once_turn', // Sneak attack
  ONCE_PER_REST = 'once_rest'  // Inspiration
}

// 5. Enhanced Roll Engine with Pre-Roll Analysis
class RollEngine {
  private modifierRegistry: Map<string, RollModifier[]>;
  private criticalRules: CriticalRules;
  
  // NEW: Pre-roll analysis for UI clarity
  analyzeRoll(definition: RollDefinition): PreRollInfo {
    const modifiers = this.gatherModifiers(definition);
    const dice = this.analyzeDice(definition, modifiers);
    const conditions = this.analyzeConditions(definition, modifiers);
    
    return {
      dice,
      modifiers: modifiers.map(m => ({
        id: m.id,
        label: m.name,
        value: typeof m.value === 'number' ? m.value : '1d' + m.value.sides,
        source: m.source,
        condition: m.condition ? 'Conditional' : undefined
      })),
      conditions,
      estimatedRange: this.calculateEstimatedRange(dice, modifiers),
      criticalRange: this.criticalRules.range
    };
  }
  
  executeRoll(definition: RollDefinition): RollResult {
    // 1. Gather applicable modifiers
    const modifiers = this.gatherModifiers(definition);
    
    // 2. Apply pre-roll modifiers (advantage, etc.)
    const preRollMods = modifiers.filter(m => m.application === ApplicationTiming.BEFORE_ROLL);
    const adjustedExpression = this.applyPreRollModifiers(definition.baseExpression, preRollMods);
    
    // 3. Execute the roll with enhanced dice operations
    const baseResult = this.rollDiceWithOperations(adjustedExpression);
    
    // 4. Check for critical hits using configurable rules
    const isCritical = this.checkCriticalHit(baseResult, definition.type);
    if (isCritical && definition.type === 'damage') {
      baseResult = this.applyCriticalDamage(baseResult, definition);
    }
    
    // 5. Apply post-roll modifiers
    const postRollMods = modifiers.filter(m => m.application === ApplicationTiming.AFTER_ROLL);
    const finalResult = this.applyPostRollModifiers(baseResult, postRollMods);
    
    // 6. Calculate totals
    return this.calculateResult(finalResult, modifiers, isCritical);
  }
  
  private gatherModifiers(definition: RollDefinition): RollModifier[] {
    const applicable = [];
    
    // Check each registered modifier
    for (const [source, modifiers] of this.modifierRegistry) {
      for (const modifier of modifiers) {
        if (!modifier.condition || modifier.condition(definition.context)) {
          applicable.push(modifier);
        }
      }
    }
    
    // Sort by priority and handle stacking
    return this.sortAndDeduplicateModifiers(applicable);
  }
}

// 6. Critical Hit Rules (NEW ARCHITECTURE)
interface CriticalRules {
  range: number[]; // [20] standard, [19,20] Champion
  damageStrategy: 'double_dice' | 'max_base_dice' | 'double_total';
  affectedDice: 'weapon_only' | 'all_damage' | 'exclude_modifiers';
  additionalDice?: string; // "1d6" for Brutal Critical
}

// 7. Pre-Roll Information Structure (NEW)
interface PreRollInfo {
  dice: DicePreview[];
  modifiers: ModifierPreview[];
  conditions: ConditionPreview[];
  estimatedRange: { min: number; max: number };
  criticalRange: number[];
}

interface DicePreview {
  label: string; // "Weapon Damage", "Sneak Attack"
  expression: string; // "1d8", "3d6"
  source: string; // "Shortsword", "Rogue Feature"
}

interface ModifierPreview {
  label: string; // "Strength Modifier", "+1 Sword"
  value: string; // "+3", "1d4"
  source: string;
  condition?: string; // "when hidden", "once per turn"
}

interface ConditionPreview {
  label: string; // "Advantage", "Critical 19-20"
  description: string;
  active: boolean;
}

// 6. Result Structure
interface RollResult {
  total: number;
  breakdown: RollBreakdown[];
  criticalSuccess: boolean;
  criticalFailure: boolean;
  metadata: {
    type: RollType;
    modifiersApplied: string[];
    timestamp: number;
  };
}

interface RollBreakdown {
  type: 'die' | 'modifier' | 'reroll';
  label: string;
  value: number;
  details?: {
    sides?: number;
    originalRoll?: number;
    source?: string;
  };
}
```

## Comprehensive Code Review: Files Requiring Changes

### CORE ROLL FUNCTIONS - Complete Replacement Required

#### `src/utils/diceUtils.js`
- **`rollDice()`** - Keep as utility function
- **`getWeaponStats()`** - **REPLACE** - Hardcoded d6/d8 logic, 3d6 sneak attack assumptions
- **`rollAttack()`** - **REPLACE** - Hardcoded weapon damage parsing, conditional damage logic

#### `src/hooks/useDiceRolls.js`  
- **`performAttackRoll()`** - **REPLACE** - Attack roll execution, hardcoded logging
- **`performSpellAttack()`** - **REPLACE** - Eldritch Blast beam scaling, hardcoded AC 15, Agonizing Blast logic
- **`performStandardRoll()`** - **REPLACE** - Skill/save rolls, no advantage/disadvantage support
- **`performHealingRoll()`** - **REPLACE** - Hardcoded healing formulas (2d4+2, hit dice)

### ROLL EXECUTION TRIGGERS - Update to Use New System

#### `src/App.tsx`
- **Lines 502-523** - Attack roll trigger logic  
- **Lines 524-600** - Spell save damage parsing (hardcoded dice parsing)
- **Lines 450-490** - Roll action generation and weapon processing
- **Lines 380-420** - Healing action generation

### ROLL DISPLAY COMPONENTS - Major Updates Required

#### `src/components/Rolls/RollResult.jsx`
- **`renderAttackResult()`** - **UPDATE** - Uses old roll result format, manual dice construction
- **Lines 35-80** - Critical hit display logic, hardcoded damage calculations  
- **Lines 100-150** - Spell attack result rendering

#### `src/components/Rolls/UnifiedRollDisplay.jsx`
- **`formatDieLabel()`** - **UPDATE** - Advantage/disadvantage display logic
- **`getDiceHighlight()`** - **UPDATE** - Critical hit highlighting
- **Entire component** - Needs new roll result format

#### `src/components/Rolls/RollPopup.jsx`
- **Component structure** - **UPDATE** - Add pre-roll information display phase
- **Roll execution flow** - **UPDATE** - Integrate new roll engine

### DATA TRANSFORMATION - Complete Rewrite

#### `src/utils/rollDataTransforms.js`
- **`transformRollLogToUnified()`** - **REWRITE** - Handles old log format conversion
- **`createUnifiedRoll()`** - **REWRITE** - Roll creation from scratch  
- **Entire file** - Bridge between old and new systems, will be obsolete

### ACTION GENERATION - Moderate Updates

#### `src/data/rollActionsGenerator.js`
- **`generateAttackActions()`** - **UPDATE** - Add weapon tags, damage parsing
- **`generateSkillActions()`** - **UPDATE** - Add advantage conditions
- **`generateSavingThrowActions()`** - **UPDATE** - Add concentration saves
- **`generateCombatActions()`** - **UPDATE** - Add initiative, death saves

### BATTLE COMPONENTS - Integration Updates

#### `src/components/Battle/TurnManager.jsx`
- **Lines 200-250** - Action ability processing, Eldritch Blast hardcoding
- **Lines 380-410** - Ability button rendering with damage display

#### `src/components/Battle/ActionInfoPopup.jsx`
- **Lines 50-100** - Beam count calculation, passive bonus display
- **Damage prediction logic** - **UPDATE** - Use new pre-roll analysis

### RESOURCE MANAGEMENT - Integration Points

#### `src/utils/resourceManager.js`
- **`getConditionalDamageBonuses()`** - **UPDATE** - Integrate with new modifier system
- **`getPassiveDamageBonuses()`** - **UPDATE** - Convert to new resolver format
- **Bonus application logic** - **UPDATE** - Use new modifier pipeline

### SUPPORTING FILES - Minor Updates

#### `src/types/dice.ts`
- **Current interface** - **REPLACE** with new roll types

#### `src/data/skillsSystem.js`
- **Skill modifier calculations** - **UPDATE** - Use new modifier resolvers

#### `src/data/dnd5eRules.js` 
- **Hit point calculations** - **MINOR** - May need hitDie integration

### NEW FILES REQUIRED

#### Core System
- `src/utils/rollEngine.ts` ✓ (created)
- `src/utils/rollResolvers.ts` ✓ (created)
- `src/types/rolls.ts` ✓ (created)

#### Components  
- `src/components/Rolls/PreRollDisplay.tsx` ✓ (created)
- `src/components/Rolls/RollExecutionDisplay.tsx` - **CREATE**
- `src/components/Rolls/ModifierBreakdown.tsx` - **CREATE**

#### Integration
- `src/hooks/useUnifiedRolls.js` - **CREATE**
- `src/utils/rollMigration.js` - **CREATE** (data migration utilities)

## Updated Implementation Phases

### Phase 1: Core Infrastructure & Priority Fixes (Week 1)
1. **Enhanced `RollEngine`** with pre-roll analysis and configurable critical rules
2. **Advanced `DiceExpression` parser** supporting "2d20kh1", "1d6r1,2", etc.
3. **Critical hit architecture** with configurable damage strategies
4. **Modifier registry system** with proper stacking/deduplication
5. **Pre-roll information display** for UI transparency

### Phase 2: Replace Hardcoded Special Cases (Week 2)
1. **Weapon damage detection** - Replace d6/d8 assumptions with full parser
2. **Eldritch Blast beam scaling** - Convert to configurable multi-attack system  
3. **Sneak Attack mechanics** - Replace 3d6 assumptions with level-scaled conditional damage
4. **Death save constants** - Make DC and crit ranges configurable
5. **Healing formulas** - Replace hardcoded potion mechanics

### Phase 3: Component Integration (Week 3)  
1. **RollResult.jsx** - Update to use new roll result format
2. **UnifiedRollDisplay.jsx** - Support new dice operations and critical rules
3. **RollPopup.jsx** - Add pre-roll analysis phase before execution
4. **PreRollDisplay.tsx** - Complete UI for showing dice/modifiers/conditions
5. **App.tsx roll triggers** - Integrate with new roll engine

### Phase 4: Advanced Features & Battle Integration (Week 4)
1. **TurnManager.jsx** - Replace hardcoded ability processing with resolvers
2. **ActionInfoPopup.jsx** - Use pre-roll analysis for damage predictions
3. **resourceManager.js** - Convert to new modifier pipeline
4. **Initiative rolls** - Add to combat system
5. **Concentration saves** - Implement with configurable DC

### Phase 5: Polish & Cleanup (Week 5)
1. **rollDataTransforms.js** - Remove after migration complete
2. **Resistance/vulnerability system** - Final damage modifier layer
3. **Reroll mechanics** - Great Weapon Fighting, Lucky feat support
4. **Contested rolls** - Grapple, shove mechanics
5. **Comprehensive testing** - Edge cases and performance optimization

## Migration Summary

**Total Files Requiring Changes:** 15 core files + 3 new files  
**Hardcoded Patterns to Replace:** 12 major patterns across 8 files  
**New Architecture Components:** 7 interfaces, 3 enums, 1 engine class  

## Success Metrics

### Code Quality (Updated)
- [ ] Zero hardcoded special cases remain in roll calculations
- [ ] All roll mechanics configurable via data structures  
- [ ] Advanced dice operations supported (kh1, r1,2, x6, etc.)
- [ ] Configurable critical hit rules for different table preferences
- [ ] 95%+ test coverage for roll mechanics and edge cases

### User Experience (Enhanced)
- [ ] **Pre-roll clarity** - Users see exactly what will be rolled before execution
- [ ] **Transparent modifiers** - All bonuses shown with sources
- [ ] **Condition visibility** - Advantage, critical ranges, rerolls clearly displayed
- [ ] **Accurate predictions** - Damage ranges match actual roll possibilities  
- [ ] **Consistent UI** - Same information format across all roll types

### Performance (Maintained)
- [ ] Pre-roll analysis completes in <50ms
- [ ] Roll execution maintains <100ms for complex multi-attacks
- [ ] No UI lag during dice animation sequences
- [ ] Modifier resolution scales with character complexity

## Architecture Rating Assessment

**Review Score: 8.5/10** ✅

### Strengths
- **Comprehensive hardcoded pattern identification** with specific file locations
- **Enhanced dice expression parser** supporting advanced D&D mechanics
- **Configurable critical hit system** addressing table rule variations  
- **Pre-roll transparency** giving users full visibility before execution
- **Realistic phased implementation** with clear deliverables

### Areas Addressed from Review
- ✅ **Enhanced DiceExpression interface** with operation support
- ✅ **Critical hit rules architecture** with configurable strategies
- ✅ **Pre-roll information system** for UI clarity
- ✅ **Comprehensive file-by-file change analysis**

### Ready for Implementation
The specification now provides a complete roadmap for eliminating all hardcoded special cases while providing users with clear pre-roll information about dice, modifiers, and conditions.

## Usage Examples

```javascript
// Simple attack roll
const attackRoll = rollEngine.executeRoll({
  type: 'attack',
  baseExpression: { count: 1, sides: 20 },
  context: {
    character: activeCharacter,
    source: { type: 'weapon', name: 'Shortsword', tags: ['melee', 'finesse'] },
    environment: { advantage: isHidden }
  }
});

// Spell save with damage
const spellSave = rollEngine.executeRoll({
  type: 'spell_save',
  baseExpression: { count: 8, sides: 6 }, // 8d6 fireball
  context: {
    character: activeCharacter,
    source: { type: 'spell', name: 'Fireball', tags: ['fire', 'aoe'] },
    target: { saveBonus: targetDexMod }
  }
});

// Skill check with guidance
const skillCheck = rollEngine.executeRoll({
  type: 'skill',
  baseExpression: { count: 1, sides: 20 },
  context: {
    character: activeCharacter,
    source: { type: 'skill', name: 'Persuasion', tags: ['charisma'] },
    environment: { blessed: true, inspired: true }
  }
});
```

## Benefits of Unified System

1. **Consistency**: All rolls use same pipeline
2. **Extensibility**: New bonus sources plug in easily
3. **Maintainability**: Single source of truth for roll mechanics
4. **Testability**: Isolated components with clear interfaces
5. **Performance**: Efficient modifier caching and calculation
6. **User Experience**: Consistent UI for all roll types


Code Review: Areas Requiring Roll System Replacement

  CORE ROLL FUNCTIONS - Complete Replacement Required

  src/utils/diceUtils.js

  - rollDice() - Basic random generator, keep as utility
  - getWeaponStats() - REPLACE - Hardcoded d6/d8 logic, 3d6 sneak attack assumptions
  - rollAttack() - REPLACE - Hardcoded weapon damage parsing, conditional damage logic

  src/hooks/useDiceRolls.js

  - performAttackRoll() - REPLACE - Attack roll execution, hardcoded logging
  - performSpellAttack() - REPLACE - Eldritch Blast beam scaling, hardcoded AC 15, Agonizing Blast logic
  - performStandardRoll() - REPLACE - Skill/save rolls, no advantage/disadvantage support
  - performHealingRoll() - REPLACE - Hardcoded healing formulas (2d4+2, hit dice)

  ROLL EXECUTION TRIGGERS - Update to Use New System

  src/App.tsx

  - Lines 502-523 - Attack roll trigger logic
  - Lines 524-600 - Spell save damage parsing (hardcoded dice parsing)
  - Lines 450-490 - Roll action generation and weapon processing
  - Lines 380-420 - Healing action generation

  ROLL DISPLAY COMPONENTS - Major Updates Required

  src/components/Rolls/RollResult.jsx

  - renderAttackResult() - UPDATE - Uses old roll result format, manual dice construction
  - Lines 35-80 - Critical hit display logic, hardcoded damage calculations
  - Lines 100-150 - Spell attack result rendering

  src/components/Rolls/UnifiedRollDisplay.jsx

  - formatDieLabel() - UPDATE - Advantage/disadvantage display logic
  - getDiceHighlight() - UPDATE - Critical hit highlighting
  - Entire component - Needs new roll result format

  src/components/Rolls/RollPopup.jsx

  - Component structure - UPDATE - Add pre-roll information display phase
  - Roll execution flow - UPDATE - Integrate new roll engine

  DATA TRANSFORMATION - Complete Rewrite

  src/utils/rollDataTransforms.js

  - transformRollLogToUnified() - REWRITE - Handles old log format conversion
  - createUnifiedRoll() - REWRITE - Roll creation from scratch
  - Entire file - Bridge between old and new systems, will be obsolete

  ACTION GENERATION - Moderate Updates

  src/data/rollActionsGenerator.js

  - generateAttackActions() - UPDATE - Add weapon tags, damage parsing
  - generateSkillActions() - UPDATE - Add advantage conditions
  - generateSavingThrowActions() - UPDATE - Add concentration saves
  - generateCombatActions() - UPDATE - Add initiative, death saves

  BATTLE COMPONENTS - Integration Updates

  src/components/Battle/TurnManager.jsx

  - Lines 200-250 - Action ability processing, Eldritch Blast hardcoding
  - Lines 380-410 - Ability button rendering with damage display

  src/components/Battle/ActionInfoPopup.jsx

  - Lines 50-100 - Beam count calculation, passive bonus display
  - Damage prediction logic - UPDATE - Use new pre-roll analysis

  RESOURCE MANAGEMENT - Integration Points

  src/utils/resourceManager.js

  - getConditionalDamageBonuses() - UPDATE - Integrate with new modifier system
  - getPassiveDamageBonuses() - UPDATE - Convert to new resolver format
  - Bonus application logic - UPDATE - Use new modifier pipeline

  SUPPORTING FILES - Minor Updates

  src/types/dice.ts

  - Current interface - REPLACE with new roll types

  src/data/skillsSystem.js

  - Skill modifier calculations - UPDATE - Use new modifier resolvers

  src/data/dnd5eRules.js

  - Hit point calculations - MINOR - May need hitDie integration

  NEW FILES REQUIRED

  Core System

  - src/utils/rollEngine.ts ✓ (created)
  - src/utils/rollResolvers.ts ✓ (created)
  - src/types/rolls.ts ✓ (created)

  Components

  - src/components/Rolls/PreRollDisplay.tsx ✓ (created)
  - src/components/Rolls/RollExecutionDisplay.tsx - CREATE
  - src/components/Rolls/ModifierBreakdown.tsx - CREATE

  Integration

  - src/hooks/useUnifiedRolls.js - CREATE
  - src/utils/rollMigration.js - CREATE (data migration utilities)

  MIGRATION PRIORITY

  Phase 1 (Critical)

  1. useDiceRolls.js - Core roll functions
  2. diceUtils.js - Basic utilities
  3. App.tsx - Main roll triggers

  Phase 2 (Display)

  1. RollResult.jsx - Result display
  2. UnifiedRollDisplay.jsx - Roll formatting
  3. PreRollDisplay.tsx - New pre-roll UI

  Phase 3 (Integration)

  1. rollActionsGenerator.js - Action generation
  2. TurnManager.jsx - Battle integration
  3. resourceManager.js - Bonus system

  Phase 4 (Polish)

  1. rollDataTransforms.js - Legacy bridge (then remove)
  2. ActionInfoPopup.jsx - Enhanced previews
  3. Test coverage and cleanup

  Total Files Requiring Changes: 15 core files + 3 new files
  Hardcoded Patterns to Replace: 12 major patterns across 8 files