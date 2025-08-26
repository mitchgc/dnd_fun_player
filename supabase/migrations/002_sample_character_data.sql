-- Sample character data for testing
-- This will be applied after proper authentication is set up

-- Sample weapon templates
INSERT INTO public.character_weapons (id, character_id, name, weapon_data, is_equipped) VALUES
  (uuid_generate_v4(), uuid_generate_v4(), 'Rapier', '{
    "damage": "1d8",
    "damageType": "piercing",
    "attackBonus": 3,
    "properties": ["finesse", "light"],
    "description": "A swift, precise weapon favored by rogues"
  }'::jsonb, true),
  (uuid_generate_v4(), uuid_generate_v4(), 'Shortbow', '{
    "damage": "1d6",
    "damageType": "piercing",
    "attackBonus": 3,
    "range": "80/320",
    "properties": ["ammunition", "two-handed"],
    "description": "A reliable ranged weapon"
  }'::jsonb, false);

-- Sample ability templates for different classes
INSERT INTO public.character_abilities (id, character_id, ability_name, ability_type, ability_data, uses_remaining, max_uses, recharge_type) VALUES
  (uuid_generate_v4(), uuid_generate_v4(), 'Sneak Attack', 'passive', '{
    "description": "Deal extra damage when you have advantage or an ally is nearby",
    "damage": "2d6",
    "requirements": ["advantage", "ally_within_5ft"]
  }'::jsonb, null, null, null),
  (uuid_generate_v4(), uuid_generate_v4(), 'Cunning Action', 'bonus_action', '{
    "description": "Dash, Disengage, or Hide as a bonus action",
    "options": ["dash", "disengage", "hide"]
  }'::jsonb, null, null, null);

-- Function to create a sample character for testing
-- This should be called after user authentication is set up
CREATE OR REPLACE FUNCTION create_sample_character(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  char_id UUID;
  weapon_id UUID;
  ability_id UUID;
BEGIN
  -- Create character
  INSERT INTO public.characters (
    user_id,
    name,
    race,
    character_class,
    level,
    ability_scores,
    current_hp,
    max_hp,
    armor_class,
    initiative_bonus,
    speed
  ) VALUES (
    user_uuid,
    'Kira Shadowblade',
    'Half-Elf',
    'Rogue',
    3,
    '{
      "strength": 10,
      "dexterity": 16,
      "constitution": 14,
      "intelligence": 12,
      "wisdom": 13,
      "charisma": 15
    }'::jsonb,
    22,
    22,
    14,
    3,
    30
  )
  RETURNING id INTO char_id;

  -- Add weapons
  INSERT INTO public.character_weapons (character_id, name, weapon_data, is_equipped)
  VALUES 
    (char_id, 'Rapier', '{
      "damage": "1d8",
      "damageType": "piercing",
      "attackBonus": 5,
      "properties": ["finesse", "light"],
      "description": "A masterwork rapier with intricate engravings"
    }'::jsonb, true),
    (char_id, 'Shortbow', '{
      "damage": "1d6",
      "damageType": "piercing",
      "attackBonus": 5,
      "range": "80/320",
      "properties": ["ammunition", "two-handed"],
      "description": "A well-crafted shortbow"
    }'::jsonb, false),
    (char_id, 'Dagger', '{
      "damage": "1d4",
      "damageType": "piercing",
      "attackBonus": 5,
      "properties": ["finesse", "light", "thrown"],
      "range": "20/60",
      "description": "A sharp throwing dagger"
    }'::jsonb, false);

  -- Add abilities
  INSERT INTO public.character_abilities (character_id, ability_name, ability_type, ability_data, uses_remaining, max_uses, recharge_type)
  VALUES 
    (char_id, 'Sneak Attack', 'passive', '{
      "description": "Deal extra 2d6 damage when you have advantage or an ally is within 5 feet of target",
      "damage": "2d6",
      "requirements": ["advantage_or_ally_nearby"]
    }'::jsonb, null, null, null),
    (char_id, 'Cunning Action', 'bonus_action', '{
      "description": "Dash, Disengage, or Hide as a bonus action",
      "options": ["dash", "disengage", "hide"]
    }'::jsonb, null, null, null),
    (char_id, 'Thieves Tools', 'action', '{
      "description": "Attempt to pick locks or disarm traps",
      "skill_check": "sleight_of_hand",
      "bonus": 5
    }'::jsonb, null, null, null);

  -- Add resources
  INSERT INTO public.character_resources (character_id, resource_name, current_value, max_value, resource_type)
  VALUES
    (char_id, 'Superiority Dice', 0, 0, 'superiority_die'); -- Placeholder for future features

  RETURN char_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;