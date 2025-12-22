# Shadowdark Character Sheet JSON Field Guide

Use this guide to understand what each field does when creating your preset JSON files.

## Quick Start

1. Copy `TEMPLATE.json`
2. Rename it to `preset-1.json` (or `preset-2.json`, `preset-3.json`)
3. Fill in the values using this guide
4. Delete the `_comment` and `_comment2` lines

---

## Field Reference

### Identity Section

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Character name | `"Thorin Ironbeard"` |
| `ancestry` | Race/ancestry | `"Dwarf"`, `"Human"`, `"Elf"`, `"Halfling"` |
| `class` | Character class | `"Fighter"`, `"Wizard"`, `"Priest"`, `"Thief"` |
| `background` | Character background | `"Soldier"`, `"Acolyte"`, `"Urchin"` |
| `alignment` | Moral alignment | `"Lawful"`, `"Neutral"`, `"Chaotic"` |
| `title` | Character title | `"Seeker"`, `"Blade for Hire"` |
| `deity` | God/goddess (for Priests) | `"Madelon, Goddess of Light"` |
| `languages` | Known languages | `"Common, Dwarvish, Orcish"` |
| `notes` | Personal notes | `"Has scar on left eye"` |

### Combat Stats (Vitals)

| Field | Description | Example |
|-------|-------------|---------|
| `ac` | Armor Class | `"15"` |
| `hpCur` | Current Hit Points | `"8"` |
| `hpMax` | Maximum Hit Points | `"8"` |
| `move` | Movement speed | `"30"` (usually 30 or 25 for dwarves) |

### Character Progression

| Field | Description | Example |
|-------|-------------|---------|
| `level` | Character level | `"1"` |
| `xp` | Experience points | `"0"` |
| `luck` | Luck/Fortune (optional) | `""` (leave empty if not using) |
| `coins` | Money | `"15 gp"`, `"5 gp, 20 sp"` |

### Ability Scores (3-18)

All ability scores should be numbers as strings:

| Field | Ability | Example |
|-------|---------|---------|
| `str` | Strength | `"16"` |
| `dex` | Dexterity | `"12"` |
| `con` | Constitution | `"14"` |
| `int` | Intelligence | `"8"` |
| `wis` | Wisdom | `"10"` |
| `cha` | Charisma | `"11"` |

**Note:** Modifiers calculate automatically from scores using: (score - 10) / 2 rounded down

### Combat Info

| Field | Description | Example |
|-------|-------------|---------|
| `atk` | Final attack bonus | `"+3"` |
| `spellAtk` | Spell attack/DC | `"+3, DC 13"` or `""` for non-casters |
| `save1` | Save/Check notes | `"Advantage vs poison"` |
| `save2` | Other bonuses | `"Turn undead +2"` |

### Talents (by Level)

Shadowdark characters get talents at levels 1, 2, 4, 7, and 10:

| Field | Level | Example |
|-------|-------|---------|
| `talent1` | Level 1 | `"Hauler (Str-based gear slots +2)"` |
| `talent2` | Level 2 | `"Weapon Mastery (Swords)"` |
| `talent4` | Level 4 | `""` (empty for level 1 chars) |
| `talent7` | Level 7 | `""` |
| `talent10` | Level 10 | `""` |

### Weapons & Spells

| Field | Description | Example |
|-------|-------------|---------|
| `weapons` | List of weapons/attacks | `"Longsword +3, d8\nDagger +3, d4"` |
| `spellsKnown` | Known spells | `"Magic Missile, Sleep, Shield, Light"` |

**Note:** Use `\n` for new lines in weapons list

### Inventory Slots (inv1 - inv20)

Each field represents one inventory slot. Number of slots = Strength score.

```json
"inv1": "Longsword",
"inv2": "Chain mail",
"inv3": "Shield",
"inv4": "Backpack",
"inv5": "Rations (7 days)",
```

Leave unused slots empty: `"inv11": ""`

### Gear & Supplies

| Field | Description | Example |
|-------|-------------|---------|
| `armor` | Armor description | `"Chain mail, Shield"` |
| `rations` | Number of rations | `"7"` |
| `torches` | Number of torches | `"6"` |

### Session Tracking

| Field | Description | Example |
|-------|-------------|---------|
| `conditions` | Current conditions | `""` (usually empty for presets) |
| `log` | Session notes | `""` (usually empty for presets) |

---

## Fields NOT Saved in Presets

These fields are intentionally NOT included in presets (players track during play):

- Spell slot checkboxes (`spell1_1`, `spell1_2`, etc.)
- Death timer checkboxes (`death1`, `death2`, etc.)
- Status effect checkboxes (`status_prone`, etc.)
- Torch timer state

---

## Example: Level 1 Fighter

```json
{
  "name": "Bjorn the Bold",
  "ancestry": "Human",
  "class": "Fighter",
  "background": "Mercenary",
  "alignment": "Neutral",
  "title": "Sellsword",
  "deity": "",
  "languages": "Common",
  "notes": "Veteran of many battles",

  "ac": "16",
  "hpCur": "10",
  "hpMax": "10",
  "move": "30",

  "level": "1",
  "xp": "0",
  "luck": "",
  "coins": "20 gp",

  "str": "16",
  "dex": "14",
  "con": "15",
  "int": "8",
  "wis": "10",
  "cha": "12",

  "atk": "+3",
  "spellAtk": "",
  "save1": "",
  "save2": "",

  "talent1": "Grit (Advantage on STR checks to break objects)",
  "talent2": "",
  "talent4": "",
  "talent7": "",
  "talent10": "",

  "weapons": "Battleaxe +3, d10\nShortbow +2, d6",
  "spellsKnown": "",

  "inv1": "Battleaxe",
  "inv2": "Shortbow",
  "inv3": "Arrows (20)",
  "inv4": "Chain mail",
  "inv5": "Shield",
  "inv6": "Backpack",
  "inv7": "Bedroll",
  "inv8": "Rations (10 days)",
  "inv9": "Rope (60 ft)",
  "inv10": "Waterskin",
  "inv11": "",
  "inv12": "",
  "inv13": "",
  "inv14": "",
  "inv15": "",
  "inv16": "",
  "inv17": "",
  "inv18": "",
  "inv19": "",
  "inv20": "",

  "armor": "Chain mail, Shield",
  "rations": "10",
  "torches": "6",

  "conditions": "",
  "log": ""
}
```

---

## Tips

1. **Use the Export Button**: Fill out a character in the sheet, then click "Export" to get perfect JSON
2. **Numbers as Strings**: All values should be strings (in quotes), even numbers
3. **Empty Fields**: Use `""` for empty fields, not `null`
4. **Multi-line Text**: Use `\n` for line breaks in weapons/spells
5. **Validate JSON**: Use a JSON validator online if you get errors loading presets
6. **Copy Characters**: Duplicate working presets and modify them

---

## Troubleshooting

**"Failed to load preset"**
- Make sure the file is in the same folder as `index.html`
- Check that the filename matches exactly: `preset-1.json`, `preset-2.json`, or `preset-3.json`

**"Invalid JSON"**
- Check for missing commas between fields
- Check for missing quotes around values
- Remove the `_comment` lines
- Validate your JSON at jsonlint.com
