# Raindrop Live

**Raindrop Live** is a user-friendly, lightweight plugin that brings your [Raindrop.io](https://raindrop.io) bookmarks directly into [Obsidian](https://obsidian.md) using live codeblocks. Unlike other plugins that import thousands of files, Raindrop Live gives you a real-time view of your bookmarks without cluttering your vault.

This is a modernized and improved fork of the original `obsidian-raindrop` plugin by Micah Topping.

## ✨ New in Raindrop Live
- **Sidebar GUI Builder:** No more manual coding. Click the Raindrop icon in your left sidebar to visually build your view and insert it into any note.
- **Improved Stability:** Patched crashes and updated for modern Obsidian (1.x) compatibility.
- **Clean UI:** Optimized display for both List and Table views.

## 🚀 How to Use
1. **Sidebar Icon:** Click the Raindrop icon in the left ribbon.
2. **Build your View:** Select your collection, sort order, and filters in the popup window.
3. **Insert:** Click "Insert Raindrop View" to drop the live list into your current note.

## 🛠️ Manual Configuration (Optional)
If you prefer to write the codeblocks manually, use the following syntax:

```raindrop
collection: 0
format: list
search: #css
sort: -created
showTags: true
highlights: false
```

### Options
| Key | Optional | Effect |
| --- | :---: | --- |
| `collection` | Y | ID of the collection (0 for All, -1 for Unsorted). |
| `format` | Y | `list` or `table`. |
| `sort` | Y | `created`, `-created`, `title`, `-title`. |
| `search` | Y | Raindrop search operators (e.g., `#tag`). |
| `showTags` | Y | `true` or `false`. |
| `highlights`| Y | `true` or `false` (shows your bookmark highlights). |

## ⚙️ Setup
1. Go to [Raindrop Integrations](https://app.raindrop.io/settings/integrations).
2. Click **"Create new app"**.
3. Copy the **"Test token"**.
4. Paste it into the Raindrop Live settings in Obsidian.

---
*Maintained by [destiny911](https://github.com/destiny911). Based on the original work by Micah Topping.*
