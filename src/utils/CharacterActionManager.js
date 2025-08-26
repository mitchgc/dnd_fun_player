// Universal actions available to all characters
const UNIVERSAL_ACTIONS = {
  attack: {
    name: 'Attack',
    type: 'action',
    description: 'Make a melee or ranged weapon attack',
    requiresTarget: true
  },
  dash: {
    name: 'Dash',
    type: 'action',
    description: 'Double your speed for this turn',
    effect: (character) => ({ speed: character.speed * 2 })
  },
  dodge: {
    name: 'Dodge',
    type: 'action',
    description: 'Disadvantage on attacks against you, advantage on Dex saves',
    effect: () => ({ isDodging: true })
  },
  help: {
    name: 'Help',
    type: 'action',
    description: 'Grant advantage to an ally on their next ability check',
    requiresTarget: true
  },
  hide: {
    name: 'Hide',
    type: 'action',
    description: 'Attempt to hide from enemies',
    requiresCheck: 'stealth'
  },
  ready: {
    name: 'Ready',
    type: 'action',
    description: 'Prepare an action to trigger on a specific condition'
  },
  search: {
    name: 'Search',
    type: 'action',
    description: 'Devote attention to finding something',
    requiresCheck: 'perception'
  },
  useObject: {
    name: 'Use an Object',
    type: 'action',
    description: 'Interact with an object in the environment'
  }
};

// Class-specific action templates
const CLASS_ACTIONS = {
  rogue: {
    cunningAction: {
      name: 'Cunning Action',
      type: 'bonus_action',
      description: 'Dash, Disengage, or Hide as a bonus action',
      level: 2,
      subActions: ['dash', 'disengage', 'hide']
    },
    sneakAttack: {
      name: 'Sneak Attack',
      type: 'passive',
      description: 'Deal extra damage when you have advantage or an ally is nearby',
      level: 1,
      getDamage: (level) => `${Math.ceil(level / 2)}d6`
    },
    evasion: {
      name: 'Evasion',
      type: 'reaction',
      description: 'Take half or no damage from area effects',
      level: 7
    }
  },
  fighter: {
    secondWind: {
      name: 'Second Wind',
      type: 'bonus_action',
      description: 'Regain hit points equal to 1d10 + fighter level',
      level: 1,
      uses: 1,
      recharge: 'short_rest',
      getHealing: (level) => ({ dice: '1d10', bonus: level })
    },
    actionSurge: {
      name: 'Action Surge',
      type: 'special',
      description: 'Take an additional action on your turn',
      level: 2,
      uses: 1,
      recharge: 'short_rest'
    },
    indomitable: {
      name: 'Indomitable',
      type: 'reaction',
      description: 'Reroll a failed saving throw',
      level: 9,
      uses: 1,
      recharge: 'long_rest'
    }
  },
  wizard: {
    arcaneRecovery: {
      name: 'Arcane Recovery',
      type: 'special',
      description: 'Recover spell slots during a short rest',
      level: 1,
      uses: 1,
      recharge: 'long_rest',
      getSlots: (level) => Math.ceil(level / 2)
    }
  },
  barbarian: {
    rage: {
      name: 'Rage',
      type: 'bonus_action',
      description: 'Enter a rage for damage resistance and bonus damage',
      level: 1,
      uses: 2, // Increases with level
      recharge: 'long_rest',
      getDuration: () => '1 minute',
      getBonusDamage: (level) => level < 9 ? 2 : level < 16 ? 3 : 4
    },
    recklessAttack: {
      name: 'Reckless Attack',
      type: 'special',
      description: 'Gain advantage on attacks, but enemies have advantage against you',
      level: 2
    }
  }
};

// Race-specific actions
const RACE_ACTIONS = {
  'yuan-ti': {
    magicResistance: {
      name: 'Magic Resistance',
      type: 'passive',
      description: 'Advantage on saving throws against spells and magical effects'
    },
    poisonImmunity: {
      name: 'Poison Immunity',
      type: 'passive',
      description: 'Immune to poison damage and the poisoned condition'
    }
  },
  dragonborn: {
    breathWeapon: {
      name: 'Breath Weapon',
      type: 'action',
      description: 'Exhale destructive energy in a cone or line',
      uses: 1,
      recharge: 'short_rest',
      getDamage: (level) => level < 6 ? '2d6' : level < 11 ? '3d6' : level < 16 ? '4d6' : '5d6'
    }
  },
  halfling: {
    lucky: {
      name: 'Lucky',
      type: 'passive',
      description: 'Reroll natural 1s on attack rolls, ability checks, and saving throws'
    }
  },
  elf: {
    trance: {
      name: 'Trance',
      type: 'passive',
      description: 'Meditate for 4 hours instead of sleeping for 8'
    }
  }
};

class CharacterActionManager {
  constructor(character) {
    this.character = character;
    this._actionsCache = null;
    this._bonusActionsCache = null;
    this._reactionsCache = null;
    this._passivesCache = null;
  }

  // Invalidate cache when character state changes
  invalidateCache() {
    this._actionsCache = null;
    this._bonusActionsCache = null;
    this._reactionsCache = null;
    this._passivesCache = null;
  }

  // Get all available actions
  getAvailableActions() {
    if (!this._actionsCache) {
      this._actionsCache = [
        ...this.getUniversalActions(),
        ...this.getClassActions('action'),
        ...this.getRaceActions('action'),
        ...this.getEquipmentActions('action'),
        ...this.getCustomActions('action')
      ].filter(action => this.checkPrerequisites(action));
    }
    return this._actionsCache;
  }

  // Get available bonus actions
  getAvailableBonusActions() {
    if (!this._bonusActionsCache) {
      this._bonusActionsCache = [
        ...this.getClassActions('bonus_action'),
        ...this.getRaceActions('bonus_action'),
        ...this.getEquipmentActions('bonus_action'),
        ...this.getCustomActions('bonus_action')
      ].filter(action => this.checkPrerequisites(action));
    }
    return this._bonusActionsCache;
  }

  // Get available reactions
  getAvailableReactions() {
    if (!this._reactionsCache) {
      this._reactionsCache = [
        ...this.getClassActions('reaction'),
        ...this.getRaceActions('reaction'),
        ...this.getEquipmentActions('reaction'),
        ...this.getCustomActions('reaction')
      ].filter(action => this.checkPrerequisites(action));
    }
    return this._reactionsCache;
  }

  // Get passive abilities
  getPassiveAbilities() {
    if (!this._passivesCache) {
      this._passivesCache = [
        ...this.getClassActions('passive'),
        ...this.getRaceActions('passive'),
        ...this.getEquipmentActions('passive'),
        ...this.getCustomActions('passive')
      ];
    }
    return this._passivesCache;
  }

  // Get universal actions
  getUniversalActions() {
    return Object.entries(UNIVERSAL_ACTIONS).map(([key, action]) => ({
      ...action,
      id: `universal-${key}`,
      source: 'universal'
    }));
  }

  // Get class-specific actions
  getClassActions(type = null) {
    const characterClass = this.character.character_class?.toLowerCase();
    const classActions = CLASS_ACTIONS[characterClass] || {};
    
    return Object.entries(classActions)
      .filter(([_, action]) => {
        // Filter by type if specified
        if (type && action.type !== type) return false;
        // Check level requirement
        if (action.level && this.character.level < action.level) return false;
        return true;
      })
      .map(([key, action]) => ({
        ...action,
        id: `class-${key}`,
        source: 'class',
        // Add dynamic values based on character level
        ...(action.getDamage && { damage: action.getDamage(this.character.level) }),
        ...(action.getHealing && { healing: action.getHealing(this.character.level) }),
        ...(action.getSlots && { slots: action.getSlots(this.character.level) }),
        ...(action.getBonusDamage && { bonusDamage: action.getBonusDamage(this.character.level) })
      }));
  }

  // Get race-specific actions
  getRaceActions(type = null) {
    const characterRace = this.character.race?.toLowerCase().replace(/\s+/g, '-');
    const raceActions = RACE_ACTIONS[characterRace] || {};
    
    return Object.entries(raceActions)
      .filter(([_, action]) => !type || action.type === type)
      .map(([key, action]) => ({
        ...action,
        id: `race-${key}`,
        source: 'race',
        ...(action.getDamage && { damage: action.getDamage(this.character.level) })
      }));
  }

  // Get equipment-based actions
  getEquipmentActions(type = null) {
    const weapons = this.character.character_weapons || [];
    const actions = [];

    // Weapon attacks
    if (!type || type === 'action') {
      weapons
        .filter(weapon => weapon.is_equipped)
        .forEach(weapon => {
          const weaponData = weapon.weapon_data || {};
          actions.push({
            id: `weapon-${weapon.id}`,
            name: `Attack with ${weapon.name}`,
            type: 'action',
            source: 'equipment',
            description: `Make an attack with ${weapon.name}`,
            damage: weaponData.damage || '1d6',
            damageType: weaponData.damageType || 'slashing',
            attackBonus: weaponData.attackBonus || 0,
            requiresTarget: true,
            weapon: weapon
          });
        });
    }

    return actions;
  }

  // Get custom abilities from database
  getCustomActions(type = null) {
    const abilities = this.character.character_abilities || [];
    
    return abilities
      .filter(ability => !type || ability.ability_type === type)
      .map(ability => ({
        id: `ability-${ability.id}`,
        name: ability.ability_name,
        type: ability.ability_type,
        source: 'custom',
        description: ability.ability_data?.description || '',
        uses: ability.uses_remaining,
        maxUses: ability.max_uses,
        recharge: ability.recharge_type,
        ...ability.ability_data
      }));
  }

  // Check if action prerequisites are met
  checkPrerequisites(action) {
    // Check if character is conscious
    if (this.character.current_hp <= 0 && action.type !== 'passive') {
      return false;
    }

    // Check if character has uses remaining
    if (action.uses !== undefined && action.uses <= 0) {
      return false;
    }

    // Check conditions that might prevent actions
    const conditions = this.character.conditions || [];
    if (conditions.includes('paralyzed') || conditions.includes('stunned')) {
      return action.type === 'passive';
    }
    if (conditions.includes('incapacitated')) {
      return action.type === 'passive';
    }

    // Check specific action requirements
    if (action.requiresWeapon && !this.hasEquippedWeapon()) {
      return false;
    }

    return true;
  }

  // Helper method to check if character has equipped weapon
  hasEquippedWeapon() {
    const weapons = this.character.character_weapons || [];
    return weapons.some(w => w.is_equipped);
  }

  // Calculate action's effect on character
  calculateActionEffect(action, target = null) {
    const effects = {
      selfEffects: {},
      targetEffects: {},
      resourceCost: {}
    };

    // Calculate resource costs
    if (action.uses !== undefined) {
      effects.resourceCost.uses = 1;
    }

    // Apply action-specific effects
    if (action.effect) {
      const actionEffect = typeof action.effect === 'function' 
        ? action.effect(this.character, target)
        : action.effect;
      
      effects.selfEffects = { ...effects.selfEffects, ...actionEffect };
    }

    // Calculate damage for attacks
    if (action.damage && target) {
      effects.targetEffects.damage = this.calculateDamage(action);
    }

    // Calculate healing
    if (action.healing) {
      effects.selfEffects.healing = this.calculateHealing(action);
    }

    return effects;
  }

  // Calculate damage for an action
  calculateDamage(action) {
    // This would involve rolling dice and applying modifiers
    // Simplified for now
    const baseDamage = action.damage || '1d6';
    const modifier = this.getAbilityModifier(action.abilityScore || 'strength');
    
    return {
      dice: baseDamage,
      modifier: modifier + (action.bonusDamage || 0),
      type: action.damageType || 'slashing'
    };
  }

  // Calculate healing for an action
  calculateHealing(action) {
    const baseHealing = action.healing || { dice: '1d8', bonus: 0 };
    const modifier = this.getAbilityModifier('constitution');
    
    return {
      dice: baseHealing.dice,
      modifier: baseHealing.bonus + modifier
    };
  }

  // Get ability modifier
  getAbilityModifier(ability) {
    const scores = this.character.ability_scores || {};
    const score = scores[ability] || 10;
    return Math.floor((score - 10) / 2);
  }

  // Get proficiency bonus based on character level
  getProficiencyBonus() {
    const level = this.character.level || 1;
    return Math.ceil(level / 4) + 1;
  }
}

export default CharacterActionManager;