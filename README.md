# LeySync

**The universal data bridge for HoYoVerse games.**

LeySync empowers players to take control of their account data. It seamlessly intercepts authenticated data from official sources (like HoYoLAB's Battle Chronicle) and converts it into open formats compatible with popular community calculators, optimizers, and planners.

## � Vision

The goal of LeySync is simple: **Your Data, Everywhere.**
Instead of manually entering hundreds of artifacts or stats, LeySync acts as the connector between the official game APIs and the ecosystem of third-party tools.

### Supported Games
| Game | Status | Export Format | Target Tools |
|------|--------|---------------|--------------|
| **Genshin Impact** | ✅ Active | GOOD v3 | [Genshin Optimizer](https://frzyc.github.io/genshin-optimizer), Enka.Network |
| **Zenless Zone Zero** | 🚧 Planned | *TBD* | ZZZ Optimizers |
| **Honkai: Star Rail** | 🚧 Planned | *TBD* | Fribbels HSR Optimizer |

## 🚀 Key Features

- **One-Click Capture**: Automatically detects data when you browse HoYoLAB.
- **Privacy First**: Runs entirely in your browser. Your session cookies never leave your device.
- **Smart Conversion**:
  - **Genshin Impact**:
    - Converts Artifacts, Weapons, and Characters.
    - Handles complex logic like Talent Level boosts from constellations.
    - Differentiates generic keys (e.g., Travelers by element).
- **Developer Friendly**: Clean codebase designed for contributing new parsers and game support.

## 📁 Project Structure

```
/hoyo-extension
├── /src
│   ├── /scripts           # Core extension logic (background, content bridge)
│   ├── /converters        # The heart of the bridge
│   │   ├── /parsers       # Raw API -> Internal Object
│   │   └── /formatters    # Internal Object -> External Format (GOOD, etc.)
│   ├── /types             # TypeScript definitions for type safety
│   ├── /ui                # User Interface
│   └── /icons
└── manifest.json
```

## 🎮 How to Use

1. **Install LeySync**: Load the extension in developer mode (Chrome/Edge/Firefox).
2. **Visit HoYoLAB**: Log in to the [Battle Chronicle](https://act.hoyolab.com/app/community-game-records-sea/index.html).
3. **Capture**: Browse to your character roster. LeySync will silently capture the data.
4. **Export**: Click the extension icon to download your data JSON.
5. **Optimize**: Upload the JSON to Genshin Optimizer or other tools.

## 🤝 Contributing

We welcome contributions! Whether it's adding a new parser for ZZZ, fixing a bug, or improving the GOOD format mapping.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/zzz-support`).
3. Commit your changes.
4. Open a Pull Request.

---
**LeySync** — connecting your journey to the tools you love.