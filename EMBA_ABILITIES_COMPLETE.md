# Level 5 Kobold Warlock (Genie - Efreeti) Complete Abilities List

## Character: Emba
**Race:** Kobold  
**Class:** Warlock  
**Subclass:** The Genie (Efreeti Patron)  
**Level:** 5  
**Proficiency Bonus:** +3

---

## RACIAL ABILITIES (Kobold)

### Darkvision
- **Type:** Racial (Passive)
- **Description:** You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.
- **Uses:** Always active

### Draconic Cry
- **Type:** Racial (Active)  
- **Action:** Bonus Action
- **Range:** 10 feet
- **Description:** You let out a cry at your enemies within 10 feet of you. Until the start of your next turn, you and your allies have advantage on attack rolls against any of those enemies who could hear you.
- **Uses:** 3 per long rest (equal to proficiency bonus)

### Kobold Legacy (Defiance)
- **Type:** Racial (Passive)
- **Description:** You have advantage on saving throws to avoid or end the frightened condition on yourself.
- **Uses:** Always active

---

## WARLOCK CLASS FEATURES

### Pact Magic
- **Type:** Class Feature
- **Description:** You have facility with spells granted by your patron. You have 2 spell slots of 3rd level that recharge on a short rest.
- **Spell Slots:** 2 (3rd level)
- **Recharge:** Short rest

### Eldritch Invocations (3 known)

#### Agonizing Blast
- **Type:** Invocation (Passive)
- **Description:** When you cast eldritch blast, add your Charisma modifier (+4) to the damage it deals on a hit.
- **Uses:** Always active with eldritch blast

#### Repelling Blast  
- **Type:** Invocation (Passive)
- **Description:** When you hit a creature with eldritch blast, you can push the creature up to 10 feet away from you in a straight line.
- **Uses:** Always active with eldritch blast

#### Devil's Sight
- **Type:** Invocation (Passive)
- **Description:** You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.
- **Uses:** Always active

---

## GENIE PATRON FEATURES

### Expanded Spell List
- **Type:** Patron Feature (Passive)
- **Description:** The Genie lets you choose from an expanded list of spells when you learn a warlock spell.
- **Efreeti Spells Available:**
  - 1st level: Burning Hands
  - 2nd level: Scorching Ray  
  - 3rd level: Fireball
  - 4th level: Fire Shield
  - 5th level: Flame Strike

### Genie's Vessel
- **Type:** Patron Feature (Item)
- **Description:** Your patron gifts you a magical vessel (Tiny object) that grants you power. You can use it as a spellcasting focus for your warlock spells.
- **Stats:** AC = spell save DC (15), HP = warlock level + prof bonus (8), immune to poison/psychic damage

### Bottled Respite
- **Type:** Patron Feature (Active)
- **Action:** Action
- **Description:** You can magically vanish and enter your vessel. The interior is a 20-foot-radius cylinder, 20 feet high, with comfortable atmosphere. You can remain for up to your proficiency bonus (3) hours. You can't be targeted by attacks or spells while inside.
- **Uses:** 1 per long rest

### Genie's Wrath (Fire)
- **Type:** Patron Feature (Passive)
- **Description:** Once during each of your turns when you hit with an attack roll, you can deal extra fire damage equal to your proficiency bonus (+3).
- **Uses:** Once per turn (unlimited)

---

## PACT BOON

### Pact of the Talisman
- **Type:** Pact Boon (Active)
- **Description:** Your patron gives you an amulet - a talisman. When the wearer fails an ability check, they can add a d4 to the roll, potentially turning it into a success.
- **Uses:** 3 per long rest (equal to proficiency bonus)

---

## FEAT ABILITIES

### Fey Touched - Comprehend Languages
- **Type:** Feat Spell
- **Casting:** 1st level spell
- **Description:** You understand the literal meaning of any spoken language that you hear and any written language you see.
- **Uses:** 1 per long rest (without spell slot)

### Fey Touched - Misty Step  
- **Type:** Feat Spell
- **Casting:** 2nd level spell, Bonus Action
- **Range:** 30 feet
- **Description:** You teleport up to 30 feet to an unoccupied space you can see.
- **Uses:** 1 per long rest (without spell slot)

---

## BACKGROUND FEATURE

### All Eyes on You
- **Type:** Background Feature
- **Description:** Your accent, mannerisms, figures of speech, and perhaps even your appearance all mark you as foreign. Curious glances are directed your way wherever you go. You can more easily find a place to perform in any settlement and can parley this attention into access to people and places you might not otherwise have.
- **Uses:** Always available

---

## KNOWN SPELLS & CANTRIPS

### Cantrips (3 known)
- **Eldritch Blast:** 1d10 force damage, 120 ft range, +7 to hit, +4 damage (Agonizing), can push 10 ft (Repelling)
- **Thunderclap:** 5 ft radius, Con save or 1d6 thunder damage  
- **Minor Illusion:** Create sound or image for 1 minute

### Spells Known (6 total)
- **1st Level:** Armor of Agathys, Charm Person, Hex
- **2nd Level:** Darkness, Crown of Madness
- **3rd Level:** Fly

---

## WEAPONS & ATTACKS

### Eldritch Blast (Primary Attack)
- **Attack Bonus:** +7 (prof + Cha)
- **Damage:** 1d10+4 force damage per beam
- **Range:** 120 feet  
- **Special:** 2 beams at level 5, can push target 10 feet
- **Notes:** Most reliable damage source

### Light Crossbow (Backup)
- **Attack Bonus:** +4 (prof + Dex)  
- **Damage:** 1d8+1 piercing
- **Range:** 80/320 feet
- **Properties:** Ammunition, Loading, Light, Two-handed

---

## RESOURCES TO TRACK

1. **Spell Slots (3rd Level):** 2/2 (recharge: short rest)
2. **Draconic Cry Uses:** 3/3 (recharge: long rest)  
3. **Bottled Respite Uses:** 1/1 (recharge: long rest)
4. **Pact Talisman Uses:** 3/3 (recharge: long rest)
5. **Fey Touched - Comprehend Languages:** 1/1 (recharge: long rest)
6. **Fey Touched - Misty Step:** 1/1 (recharge: long rest)

---

## DATABASE INSERTION NOTES

The database structure needs these abilities added to show properly in the Stats page. The current tables appear to be:
- `dnd_character_abilities` - for special abilities and features
- `dnd_character_weapons` - for attacks and weapons  
- `dnd_character_resources` - for trackable resources like spell slots and ability uses

Each ability should include the name, description, type, and usage limitations as documented above.