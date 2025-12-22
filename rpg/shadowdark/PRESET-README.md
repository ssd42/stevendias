# Shadowdark Character Presets

## How to Create Your Own Presets

You can create as many preset characters as you want! The system dynamically loads all presets listed in `presets.json`.

### Quick Start: Adding a New Preset

1. **Create the character JSON file**
   - Open `index.html` in your browser
   - Fill out a character sheet completely
   - Click "⬇️ Export" to download a JSON file
   - Rename it to something descriptive (e.g., `Ron.json`, `Baragon.json`)
   - Place it in the same folder as `index.html`

2. **Add it to the manifest**
   - Open `presets.json` in a text editor
   - Add a new entry for your preset:

```json
[
  {
    "file": "preset-1.json",
    "name": "Example Fighter",
    "description": "Human Fighter - Great for beginners"
  },
  {
    "file": "Ron.json",
    "name": "Ron",
    "description": "Your custom character description"
  }
]
```

3. **Test it**
   - Reload `index.html` in your browser
   - Click "📋 Load Preset"
   - Your new preset should appear in the list!

### The Manifest File (presets.json)

The `presets.json` file tells the character sheet which presets are available. Each entry needs three fields:

| Field | Description | Example |
|-------|-------------|---------|
| `file` | Exact filename of the preset JSON | `"Ron.json"` |
| `name` | Display name in the modal | `"Ron the Brave"` |
| `description` | Short description (1-2 lines) | `"Human Fighter - Tank build"` |

**Important:** Make sure the `file` field exactly matches your JSON filename (including `.json` extension and capitalization).

### Manual Method: Edit JSON Files Directly

If you prefer to write JSON by hand:

1. Copy `TEMPLATE.json` to a new file (e.g., `MyCharacter.json`)
2. Fill in the values using `FIELD-GUIDE.md` as a reference
3. Add the file to `presets.json` manifest
4. Reload the character sheet

## Using Presets

1. Open the character sheet (`index.html`)
2. Click "📋 Load Preset" in the toolbar
3. Select a preset from the list
4. The character will load and auto-save to browser storage

**Warning:** Loading a preset overwrites your current character. Export first if you want to keep it!

## Example presets.json

```json
[
  {
    "file": "preset-1.json",
    "name": "Example Fighter",
    "description": "Human Fighter - Great for beginners"
  },
  {
    "file": "preset-2.json",
    "name": "Example Wizard",
    "description": "Elf Wizard - Spellcaster with low HP"
  },
  {
    "file": "preset-3.json",
    "name": "Example Priest",
    "description": "Dwarf Priest - Healer and support"
  },
  {
    "file": "Ron.json",
    "name": "Ron",
    "description": "Player character"
  },
  {
    "file": "Baragon.json",
    "name": "Baragon",
    "description": "Player character"
  }
]
```

## Organizing Presets

You can organize your presets however you like:
- Group by player name
- Group by class
- Group by campaign
- Add version numbers to filenames

Just remember to update `presets.json` whenever you add, remove, or rename a preset file!

## Notes

- All preset files must be in the **same folder** as `index.html`
- Filenames are case-sensitive
- When loading a preset, it **overwrites** the current character (export first if needed!)
- Spell slots and death timer checkboxes are NOT saved in presets (intentional)
- The modal loads the manifest each time it opens, so you can add presets without reloading the page
