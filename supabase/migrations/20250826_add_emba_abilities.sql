-- Migration: Add Level 5 Kobold Warlock (Genie - Efreeti) abilities for Emba
-- Created: 2025-08-26

-- First, let's clear existing abilities for Emba to avoid duplicates
DELETE FROM dnd_character_abilities WHERE character_id = (
    SELECT id FROM dnd_characters WHERE name = 'Emba'
);

DELETE FROM dnd_character_weapons WHERE character_id = (
    SELECT id FROM dnd_characters WHERE name = 'Emba'
);

DELETE FROM dnd_character_resources WHERE character_id = (
    SELECT id FROM dnd_characters WHERE name = 'Emba'
);

-- Insert all special abilities for Level 5 Kobold Warlock (Genie - Efreeti)
INSERT INTO dnd_character_abilities (
    character_id, 
    name, 
    description, 
    ability_type, 
    uses_per_rest, 
    uses_remaining, 
    rest_type
) VALUES 

-- Kobold Racial Abilities
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Darkvision', 
'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can''t discern color in darkness, only shades of gray.',
'racial', 
999, 
999, 
'none'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Draconic Cry', 
'As a bonus action, you let out a cry at your enemies within 10 feet of you. Until the start of your next turn, you and your allies have advantage on attack rolls against any of those enemies who could hear you. You can use this trait a number of times equal to your proficiency bonus, and you regain all expended uses when you finish a long rest.',
'racial', 
3, 
3, 
'long'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Kobold Legacy (Defiance)', 
'You have advantage on saving throws to avoid or end the frightened condition on yourself.',
'racial', 
999, 
999, 
'none'),

-- Warlock Class Features
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Pact Magic', 
'Your arcane research and the magic bestowed on you by your patron have given you facility with spells. You have two 3rd-level spell slots that recharge on a short rest.',
'class', 
2, 
2, 
'short'),

-- Genie Patron Features
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Expanded Spell List', 
'The Genie lets you choose from an expanded list of spells when you learn a warlock spell. Efreeti spells: 1st-Burning Hands, 2nd-Scorching Ray, 3rd-Fireball, 4th-Fire Shield, 5th-Flame Strike.',
'patron', 
999, 
999, 
'none'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Genie''s Vessel', 
'Your patron gifts you a magical vessel (Tiny object) that grants you power. You can use it as a spellcasting focus for warlock spells. The vessel has AC equal to your spell save DC, HP equal to your warlock level + proficiency bonus, and immunity to poison and psychic damage.',
'patron', 
999, 
999, 
'none'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Bottled Respite', 
'As an action, you can magically vanish and enter your vessel. The interior is a 20-foot-radius cylinder, 20 feet high. The atmosphere is comfortable and you can remain for up to your proficiency bonus hours. You can''t be targeted by attacks or spells, and you reappear when the effect ends. Once used, can''t use again until you finish a long rest.',
'patron', 
1, 
1, 
'long'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Genie''s Wrath (Fire)', 
'Once during each of your turns when you hit with an attack roll, you can deal extra fire damage equal to your proficiency bonus (+3). This represents your Efreeti patron''s fiery power.',
'patron', 
999, 
999, 
'none'),

-- Eldritch Invocations
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Agonizing Blast', 
'When you cast eldritch blast, add your Charisma modifier (+4) to the damage it deals on a hit.',
'invocation', 
999, 
999, 
'none'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Repelling Blast', 
'When you hit a creature with eldritch blast, you can push the creature up to 10 feet away from you in a straight line.',
'invocation', 
999, 
999, 
'none'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Devil''s Sight', 
'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.',
'invocation', 
999, 
999, 
'none'),

-- Pact Boon
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Pact of the Talisman', 
'Your patron gives you an amulet - a talisman that can aid the wearer when the need is great. When the wearer fails an ability check, they can add a d4 to the roll, potentially turning the roll into a success. This benefit can be used a number of times equal to your proficiency bonus, and all expended uses are restored when you finish a long rest.',
'pact', 
3, 
3, 
'long'),

-- Feat: Fey Touched
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Fey Touched - Comprehend Languages', 
'You learn the comprehend languages spell. You can cast it once using this feat without expending a spell slot, and you regain the ability to do so when you finish a long rest.',
'feat', 
1, 
1, 
'long'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Fey Touched - Misty Step', 
'You learn the misty step spell. You can cast it once using this feat without expending a spell slot, and you regain the ability to do so when you finish a long rest.',
'feat', 
1, 
1, 
'long'),

-- Background Feature
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'All Eyes on You', 
'Your accent, mannerisms, figures of speech, and perhaps even your appearance all mark you as foreign. Curious glances are directed your way wherever you go, which can be a hindrance or a help. You can more easily find a place to perform in any settlement of at least modest size, and you can find an audience for your work. You can also parley this attention into access to people and places you might not otherwise have, for you and your traveling companions.',
'background', 
999, 
999, 
'none');

-- Add weapons
INSERT INTO dnd_character_weapons (
    character_id,
    name,
    weapon_type,
    damage_dice,
    damage_type,
    attack_bonus,
    damage_bonus,
    range_normal,
    properties,
    description
) VALUES 

-- Eldritch Blast (treated as a weapon for attack purposes)
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Eldritch Blast', 
'cantrip', 
'1d10', 
'force', 
7, -- +3 prof +4 cha
4, -- +4 cha from agonizing blast
120,
'Cantrip, Force damage, Repelling Blast (push 10ft)',
'Your warlock cantrip attack. Deals 1d10+4 force damage and can push targets 10 feet away. At 5th level, you can make 2 beams.'),

-- Light Crossbow
((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Light Crossbow', 
'ranged', 
'1d8', 
'piercing', 
4, -- +3 prof +1 dex
1, -- +1 dex
80,
'Ammunition, Loading, Light, Two-handed',
'A simple ranged weapon. Loading property means you can only fire one bolt per action regardless of attacks per turn.');

-- Add resources/spell slots
INSERT INTO dnd_character_resources (
    character_id,
    resource_name,
    current_amount,
    max_amount,
    resource_type,
    recharge_type
) VALUES 

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Spell Slots (3rd Level)', 
2, 
2, 
'spell_slot',
'short_rest'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Draconic Cry Uses', 
3, 
3, 
'racial_ability',
'long_rest'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Bottled Respite Uses', 
1, 
1, 
'patron_ability',
'long_rest'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Pact Talisman Uses', 
3, 
3, 
'pact_ability',
'long_rest'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Fey Touched - Comprehend Languages', 
1, 
1, 
'feat_spell',
'long_rest'),

((SELECT id FROM dnd_characters WHERE name = 'Emba'), 
'Fey Touched - Misty Step', 
1, 
1, 
'feat_spell',
'long_rest');