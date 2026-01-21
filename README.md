# Data Bridge Extension

A cross-browser extension (Manifest V3) for Chrome, Edge, and Firefox that captures JSON request payloads from Site A and displays them on a static dashboard (Site B).

## 🎯 Features

- **Non-blocking Fetch Interception**: Captures POST/PUT request payloads without interfering with the original requests
- **Toast Notifications**: Visual feedback when data is successfully captured
- **Persistent Storage**: Uses `chrome.storage.local` to save captured payloads
- **Beautiful Dashboard**: Auto-updating dashboard to view all captured data
- **Extension Popup**: Quick stats and data management from the browser toolbar
- **Data Export**: Export captured data as JSON files
- **Background Fetch API**: Make authenticated API requests via background script with user cookies (see [BACKGROUND_FETCH.md](BACKGROUND_FETCH.md))
- **Cross-browser Compatible**: Works on Chrome, Edge, and Firefox

## 📁 Project Structure

```
/hoyo-extension
├── /src                    # All extension code
│   ├── /scripts           # JavaScript files
│   │   ├── interceptor.js # Main world fetch interceptor
│   │   ├── content.js     # Isolated world bridge script
│   │   ├── background.js  # Background service worker
│   │   ├── api-helper.js  # API fetch helper functions
│   │   └── dashboard.js   # Dashboard data viewer
│   ├── /ui                # User interface files
│   │   ├── popup.html     # Extension popup
│   │   ├── popup.js       # Popup logic
│   │   ├── viewer.html    # Full-page data viewer
│   │   └── styles.css     # Popup styles
│   └── /icons             # Extension icons
│       ├── icon-16.png    # 16x16 icon
│       ├── icon-48.png    # 48x48 icon
│       └── icon-128.png   # 128x128 icon
├── /build                 # Built ZIP files (created by npm run build)
├── manifest.json          # Extension manifest (V3)
├── package.json           # Build scripts and metadata
├── .gitignore            # Git ignore rules
├── BACKGROUND_FETCH.md   # Background fetch API documentation
├── BUILD.md              # Build instructions
├── LICENSE               # License file
└── README.md             # This file
```

## 🔧 Configuration

Before using the extension, you need to configure the following:

### 1. Update Site URLs

In `manifest.json`, replace the placeholder URLs with your actual sites:

```json
"host_permissions": [
  "https://your-actual-site-a.com/*",
  "https://your-actual-dashboard.com/*"
]
```

Also update the `matches` fields in `content_scripts` accordingly.

### 2. Configure Target URL Pattern

In `src/scripts/interceptor.js`, modify the `TARGET_URL_PATTERN` to match the specific API endpoint you want to intercept:

```javascript
// Example: Match any URL containing "/api/data"
const TARGET_URL_PATTERN = /\/api\/data/i;

// Example: Match exact endpoint
const TARGET_URL_PATTERN = /^https:\/\/site-a\.com\/api\/submit$/;

// Example: Match multiple endpoints
const TARGET_URL_PATTERN = /\/(api\/submit|api\/update|api\/create)/i;
```

### 3. Add Required HTML Element to Dashboard

Your static dashboard must have a `<div>` with the ID `data-view`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Data Bridge Dashboard</title>
</head>
<body>
  <div id="data-view"></div>
  <!-- The extension will populate this div automatically -->
</body>
</html>
```

## 🚀 Installation

### Development Installation

#### Chrome / Edge

1. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `hoyo-extension` folder
5. The extension should now be installed and active

#### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file from the `hoyo-extension` folder
4. The extension will be loaded temporarily (until Firefox restarts)

### Production Build

To create distribution-ready ZIP files:

```bash
# Build for both Chrome and Firefox
npm run build

# Build for Chrome only
npm run build:chrome

# Build for Firefox only
npm run build:firefox

# Clean build directory
npm run clean
```

The ZIP files will be created in the `build/` directory.

## 📖 How It Works

### On Site A (Source)

1. **Injection**: When you visit Site A, `content.js` injects `interceptor.js` into the main world
2. **Interception**: `interceptor.js` monkey-patches `window.fetch` to intercept POST/PUT requests
3. **Capture**: When a request matches the target pattern, it:
   - Extracts the JSON payload
   - Sends it to the isolated world via `postMessage`
   - Shows a success toast notification
   - Lets the original request proceed normally
4. **Storage**: `content.js` receives the message and saves the payload to `chrome.storage.local`
5. **Badge Update**: The extension badge shows the total number of captures

### Extension Popup

Click the extension icon in your browser toolbar to:
- View capture statistics
- See the latest captured payload preview
- Export all data as JSON
- Clear all captured data
- Open the full data viewer

### On Dashboard (Site B)

1. **Auto-load**: `dashboard.js` automatically retrieves all captured payloads from storage
2. **Display**: Renders them in beautifully styled cards with:
   - Capture number and timestamp
   - HTTP method (POST/PUT)
   - Request URL
   - Formatted JSON payload
3. **Live Updates**: Listens for storage changes and auto-refreshes when new data is captured

### Full Data Viewer

Click "View All Data" in the popup to open a full-page viewer (`viewer.html`) that displays all captured payloads with the same beautiful styling as the dashboard.

## 🎨 Features in Detail

### Toast Notifications

When data is captured successfully on Site A, an animated toast notification appears in the top-right corner with a gradient background and smooth slide-in/out animations.

### Extension Badge

The extension icon displays a badge with the current number of captured payloads, making it easy to track activity at a glance.

### Data Export

Export all captured data as a timestamped JSON file directly from the popup. Perfect for backup or further analysis.

### Data Persistence

- Stores up to 50 most recent captures
- Each capture includes:
  - Unique ID
  - Request payload
  - Request URL
  - HTTP method
  - Timestamp
  - Capture time

### Review-Safe Code

All code is:
- Clearly commented
- Well-structured
- No obfuscation
- Easy to audit and modify

## 🔒 Security Notes

- The extension only runs on the specified domains in `host_permissions`
- Data is stored locally in the browser (not sent to any external servers)
- The interceptor does not modify or block any requests
- All communications use the extension's isolated context

## 🐛 Troubleshooting

### Data not being captured?

1. Check that the URL pattern in `src/scripts/interceptor.js` matches your target endpoint
2. Open DevTools Console and look for `[Data Bridge]` log messages
3. Verify that the request is actually a POST/PUT with a JSON body
4. Ensure the extension has permission for the site (check `chrome://extensions/`)

### Dashboard not showing data?

1. Verify that your dashboard has a `<div id="data-view"></div>` element
2. Check that the dashboard URL matches the `host_permissions` in `manifest.json`
3. Open DevTools Console and look for `[Data Bridge Dashboard]` messages
4. Try clicking the "Refresh Data" button

### Toast not appearing?

1. Check if the site has CSP restrictions blocking inline styles
2. Verify that the payload was actually captured (check console logs)
3. Ensure the interceptor script is being injected (check Elements panel for script tag)

### Popup not opening?

1. Check the browser console for errors when clicking the extension icon
2. Ensure all popup files are in the correct location (`src/ui/`)
3. Verify the paths in `manifest.json` are correct

## 📝 Development

### Running in Development

Simply load the unpacked extension following the installation instructions above. Changes to the code will require reloading the extension:

- Chrome/Edge: Go to `chrome://extensions/` and click the reload icon
- Firefox: Click "Reload" in `about:debugging`

### File Structure Guidelines

- **Scripts**: All JavaScript logic goes in `src/scripts/`
- **UI**: HTML and CSS files go in `src/ui/`
- **Icons**: All icon files go in `src/icons/`
- **Root**: Only `manifest.json`, `package.json`, and documentation

## 📄 License

This extension is provided as-is for educational and development purposes. See LICENSE file for details.

## 🤝 Contributing

Feel free to modify and extend this extension for your specific use case!

---

**Built with ❤️ for seamless cross-site data bridging**