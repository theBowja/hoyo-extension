# Build Instructions

## Quick Start

```bash
# Install dependencies (none required currently)
npm install

# Build distribution ZIPs for both browsers
npm run build

# Clean build directory
npm run clean
```

## Build Commands

### Build for All Browsers
```bash
npm run build
```
Creates:
- `build/data-bridge-chrome.zip` (Chrome/Edge)
- `build/data-bridge-firefox.zip` (Firefox)

### Build for Chrome/Edge Only
```bash
npm run build:chrome
```

### Build for Firefox Only
```bash
npm run build:firefox
```

## Manual Build

If you prefer to manually create the ZIP files:

### Windows (PowerShell)
```powershell
Compress-Archive -Path manifest.json,src,LICENSE,README.md -DestinationPath build/data-bridge.zip -Force
```

### macOS/Linux
```bash
zip -r build/data-bridge.zip manifest.json src LICENSE README.md
```

## What Gets Included

The build process includes:
- ✅ `manifest.json` - Extension manifest
- ✅ `src/` - All source code
  - `src/scripts/` - All JavaScript files
  - `src/ui/` - All UI files (HTML, CSS, JS)
  - `src/icons/` - All icon files
- ✅ `LICENSE` - License file
- ✅ `README.md` - Documentation

## What Gets Excluded

The `.gitignore` file excludes from version control:
- ❌ `node_modules/`
- ❌ `build/*.zip` (built files)
- ❌ IDE configuration files
- ❌ OS-specific files

## Publishing

### Chrome Web Store

1. Build the extension: `npm run build:chrome`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload `build/data-bridge-chrome.zip`
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons (AMO)

1. Build the extension: `npm run build:firefox`
2. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
3. Upload `build/data-bridge-firefox.zip`
4. Fill in listing details
5. Submit for review

### Edge Add-ons

1. Use the same ZIP as Chrome: `build/data-bridge-chrome.zip`
2. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
3. Upload the ZIP file
4. Fill in store listing details
5. Submit for review

## Development vs Production

- **Development**: Load the unpacked extension directly from the project folder
- **Production**: Use the built ZIP files for distribution

## Troubleshooting

### Build fails on Windows
- Ensure you're using PowerShell (not Command Prompt)
- Make sure no files are open/locked in the directories being zipped

### Build fails on macOS/Linux
- Install `zip` utility: `apt-get install zip` or `brew install zip`
- Ensure you have execute permissions on build scripts

### ZIP file is too large
- Check that `node_modules/` is excluded
- Remove any unnecessary files from `src/`
- The final ZIP should be < 5MB
