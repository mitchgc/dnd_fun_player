# Unified Roll System Specification

## Executive Summary

This specification defines a unified rolling system to replace the current fragmented and hardcoded mechanics in the D&D Helper app. The system provides clear pre-roll information showing exactly what dice will be rolled, what bonuses apply, and any special conditions before execution.

## Current Problems Analysis

### Hardcoded Special Cases Found

1. **Eldritch Blast Beam Scaling** (3 locations)
   - `if (ability.ability_name?.toLowerCase().includes('eldritch blast'))`
   - Level-based beam count: 5th(2), 11th(3), 17th(4)
   - String matching for spell identification

2. **Weapon Damage Detection** (2 locations)  
   - `if (weapon.damage_dice?.includes('d8')) { ... } else { /* assume d6 */ }`
   - Only handles d6/d8, ignores d4/d10/d12/d20 weapons
   - No support for multiple damage dice

3. **Sneak Attack Hardcoding** (2 locations)
   - `if (bonus.damage_dice?.includes('3d6'))`  
   - Assumes all conditional damage is exactly 3d6
   - No scaling by level or different conditional abilities

4. **AC Assumptions**
   - `const hits_target = attackTotal >= 15; // Assume AC 15`
   - Hardcoded target AC for hit calculations

5. **Death Save Constants**
   - `success: roll >= 10, critSuccess: roll === 20, critFail: roll === 1`
   - DC and crit ranges hardcoded

6. **Healing Potion Formula**
   - `dice: '2d4+2'` and `healingAmount += 2; // +2 bonus`
   - Basic healing potion mechanics hardcoded

## System Requirements

### Functional Requirements

#### FR1: Pre-Roll Information Display
- **FR1.1**: Show all dice that will be rolled with clear labels
- **FR1.2**: Display all modifiers with sources (ability, proficiency, equipment, spells)
- **FR1.3**: Indicate special conditions (advantage, disadvantage, crit range changes)
- **FR1.4**: Show estimated damage/result ranges
- **FR1.5**: Display target information (AC, save DC) when applicable

#### FR2: Configurable Mechanics
- **FR2.1**: Replace hardcoded Eldritch Blast with configurable multi-attack spells
- **FR2.2**: Support any weapon damage die size (d4, d6, d8, d10, d12, d20)
- **FR2.3**: Handle variable conditional damage (sneak attack scales by level)
- **FR2.4**: Support custom critical ranges (Champion Fighter 19-20)
- **FR2.5**: Allow dice manipulation mechanics (rerolls, minimums)

#### FR3: Bonus System
- **FR3.1**: Stack compatible bonuses (multiple +1 items)
- **FR3.2**: Prevent stacking incompatible bonuses (multiple proficiency)
- **FR3.3**: Handle conditional bonuses (only when hidden, once per turn)
- **FR3.4**: Support temporary bonuses (Bless, Bardic Inspiration)

#### FR4: Roll Types Coverage
- Attack rolls (melee, ranged, spell attacks)
- Damage rolls (weapon, spell, conditional)  
- Skill checks with expertise
- Ability checks
- Saving throws (death saves, concentration)
- Initiative rolls
- Healing rolls (potions, short rest, long rest)
- Utility rolls (raw dice)

#### FR5: Advanced Mechanics
- **FR5.1**: Advantage/Disadvantage with cancellation rules
- **FR5.2**: Critical hit mechanics (double dice, not modifiers)
- **FR5.3**: Resistance/Vulnerability (half/double final damage)
- **FR5.4**: Reroll mechanics (Great Weapon Fighting, Lucky)
- **FR5.5**: Minimum damage rules
- **FR5.6**: Contested rolls
- **FR5.7**: Group checks

### Non-Functional Requirements

#### NFR1: Performance
- Pre-roll analysis must complete in <50ms
- Roll execution must complete in <100ms
- Support for 20+ simultaneous rolls (multi-attack)

#### NFR2: Extensibility
- New bonus types added without core code changes
- Custom homebrew mechanics easily pluggable
- Character class features configurable via data

#### NFR3: Maintainability
- Single source of truth for each mechanic
- Clear separation between analysis and execution
- Comprehensive test coverage for edge cases

## System Architecture

### Core Components

#### 1. Roll Definition
```
RollDefinition {
  type: RollType (attack, damage, skill, save, etc.)
  context: RollContext (character, action, environment)
  baseExpression: DiceExpression (1d20, 3d6, etc.)
}
```

#### 2. Pre-Roll Analysis Engine
```
PreRollAnalyzer {
  analyzeDice(context, rollType) -> DiceInfo[]
  analyzeModifiers(context, rollType) -> ModifierInfo[]  
  analyzeConditions(context, rollType) -> RollCondition[]
  estimateRange(dice, modifiers, conditions) -> {min, max}
}
```

#### 3. Roll Execution Engine  
```
RollExecutor {
  rollDice(diceInfo, conditions) -> DiceResult[]
  applyModifiers(modifiers, conditions) -> ModifierResult[]
  calculateTotal(diceResults, modifierResults) -> RollTotal
}
```

#### 4. Resolver Registry
```
ResolverRegistry {
  diceResolvers: Map<string, DiceResolver>
  modifierResolvers: Map<string, ModifierResolver>
  conditionResolvers: Map<string, ConditionResolver>
}
```

### Data Structures

#### Roll Context
```
RollContext {
  character: {
    id, level, class, abilities, equipment, features
  }
  action: {
    name, type, tags, damage_dice, attack_bonus
  }
  environment: {
    hidden, prone, blessed, inspired, flanking, cover
  }
  target?: {
    ac, saveModifier, vulnerabilities, resistances
  }
}
```

#### Pre-Roll Information
```
PreRollInfo {
  dice: DiceInfo[] {
    id, label, expression, count, sides, baseBonus, source
  }
  modifiers: ModifierInfo[] {
    id, label, value, type, source, stacks, condition?
  }
  conditions: RollCondition[] {
    type, label, description, active, source
  }
  metadata: {
    rollType, estimatedRange, criticalRange, hasAdvantage, target?
  }
}
```

## Resolver Specifications

### Dice Resolvers

#### Base Dice Resolver
- **Purpose**: Add appropriate base dice for roll type
- **Logic**: d20 for attacks/checks/saves, weapon/spell dice for damage
- **Replaces**: Hardcoded die sizes in diceUtils.js

#### Weapon Damage Resolver  
- **Purpose**: Parse weapon damage expressions
- **Logic**: Support any dice format (1d4, 2d6, 3d8+2, etc.)
- **Replaces**: `if (weapon.damage_dice?.includes('d8'))` logic

#### Conditional Damage Resolver
- **Purpose**: Add conditional damage dice (Sneak Attack, Divine Smite)
- **Logic**: Check conditions and character level for scaling
- **Replaces**: `if (bonus.damage_dice?.includes('3d6'))` logic

#### Multi-Attack Resolver
- **Purpose**: Handle multi-beam/multi-attack spells
- **Logic**: Configurable beam count by spell name and character level
- **Replaces**: Hardcoded Eldritch Blast beam scaling

### Modifier Resolvers

#### Ability Score Resolver
- **Purpose**: Add appropriate ability modifier
- **Logic**: STR for melee, DEX for ranged/finesse, spell mod for spells
- **Config**: Weapon properties determine which ability

#### Proficiency Resolver
- **Purpose**: Add proficiency bonus when applicable
- **Logic**: Check character proficiencies, add expertise if applicable
- **Config**: Character proficiency lists

#### Equipment Resolver
- **Purpose**: Add magical weapon/armor bonuses  
- **Logic**: Check equipment for enhancement bonuses
- **Config**: Item bonus database

#### Spell Resolver
- **Purpose**: Add spell-based bonuses (Bless, Guidance)
- **Logic**: Check character buff status, add appropriate dice/bonuses
- **Config**: Spell effect database

### Condition Resolvers

#### Advantage Resolver
- **Purpose**: Determine advantage/disadvantage sources
- **Logic**: Check hiding, prone, flanking, etc. conditions
- **Config**: Condition-to-advantage mapping

#### Critical Range Resolver
- **Purpose**: Determine critical hit ranges
- **Logic**: Check for Champion Fighter, magic items, etc.
- **Config**: Feature-to-crit-range mapping

#### Resistance Resolver
- **Purpose**: Apply damage resistances/vulnerabilities
- **Logic**: Check target resistances against damage types
- **Config**: Creature resistance database

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Define TypeScript interfaces for all data structures
- [ ] Implement PreRollAnalyzer with basic dice/modifier resolution
- [ ] Create resolver registry system
- [ ] Build PreRollDisplay component for UI

### Phase 2: Replace Hardcoded Cases (Week 2)  
- [ ] Weapon damage resolver (replace d6/d8 logic)
- [ ] Conditional damage resolver (replace 3d6 sneak attack)
- [ ] Multi-attack resolver (replace Eldritch Blast hardcoding)
- [ ] Ability modifier resolver (replace attack stat selection)

### Phase 3: Expand Coverage (Week 3)
- [ ] Proficiency and expertise resolvers
- [ ] Equipment bonus resolver
- [ ] Spell bonus resolver (Bless, Bardic Inspiration)
- [ ] Advantage/disadvantage resolver

### Phase 4: Advanced Mechanics (Week 4)
- [ ] Critical range resolver (Champion Fighter)
- [ ] Resistance/vulnerability resolver
- [ ] Reroll mechanics resolver
- [ ] Contested roll support

### Phase 5: Integration & Polish (Week 5)
- [ ] Replace old roll functions throughout codebase
- [ ] Add comprehensive test coverage
- [ ] Performance optimization
- [ ] UI/UX refinements

## Success Metrics

### Code Quality
- [ ] Zero hardcoded special cases remain
- [ ] All roll mechanics configurable via data
- [ ] 90%+ test coverage for roll mechanics
- [ ] No performance regressions

### User Experience  
- [ ] Clear pre-roll information for every roll type
- [ ] Accurate damage/result predictions
- [ ] Consistent UI across all roll types
- [ ] Easy addition of homebrew mechanics

### Maintainability
- [ ] New character abilities added via configuration
- [ ] New equipment bonuses added without code changes
- [ ] Roll mechanics documented and testable
- [ ] Clear separation of concerns

## Risk Assessment

### High Risk
- **Data Migration**: Existing character data structure changes
- **Performance**: Complex resolver chains could slow down pre-roll analysis
- **Complexity**: Over-engineering the resolver system

### Medium Risk
- **Edge Cases**: Unusual D&D rule interactions
- **UI Complexity**: Too much information overwhelming users
- **Backward Compatibility**: Breaking existing roll logs

### Mitigation Strategies
- Incremental rollout with feature flags
- Performance benchmarking at each phase
- Comprehensive test suite for edge cases
- User testing for UI clarity

## Open Questions

1. **Character Data Structure**: How should we store character abilities, equipment bonuses, and temporary effects?

2. **Homebrew Support**: What level of customization should we allow for house rules?

3. **Multi-Character**: How does this system scale when managing multiple party members?

4. **Mobile Performance**: Will complex resolver chains perform well on mobile devices?

5. **Spell Slot Tracking**: How should we handle resource consumption (spell slots, ability uses)?

6. **Target Management**: Should we maintain a separate target/enemy database?

## Next Steps

1. **Review & Approval**: Get stakeholder sign-off on this specification
2. **Technical Design**: Create detailed technical design document
3. **Data Model Design**: Define character/equipment data structures
4. **Prototype**: Build minimal working prototype for validation
5. **Implementation Planning**: Break down into detailed development tasks