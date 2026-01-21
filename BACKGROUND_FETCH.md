# Background Fetch API

This extension includes a powerful feature that allows content scripts to make authenticated API requests through the background script. This is particularly useful for:

- Making requests that require the user's login cookies
- Bypassing CORS restrictions
- Centralized API request handling
- Making requests from contexts where direct fetch might not work

## How It Works

1. **Content Script** sends a message to the background script requesting an API call
2. **Background Script** makes the fetch request with `credentials: 'include'` (includes cookies)
3. **Background Script** returns the response back to the content script

This pattern ensures that API requests are made with the user's authentication cookies, maintaining their logged-in session.

## Usage in Content Scripts

### Basic Example

```javascript
// Send a message to background script to fetch data
chrome.runtime.sendMessage(
    {
        action: 'FETCH_API',
        url: 'https://site-a.com/api/user/profile',
        options: {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        }
    },
    (response) => {
        if (response.success) {
            console.log('Data:', response.data);
        } else {
            console.error('Error:', response.error);
        }
    }
);
```

### Using the Helper Function

The content script includes a `fetchViaBackground()` helper function:

```javascript
// In content.js, you can use the built-in helper:
async function getData() {
    try {
        const data = await fetchViaBackground('https://site-a.com/api/endpoint');
        console.log('Received data:', data);
    } catch (error) {
        console.error('Failed to fetch:', error);
    }
}
```

### Using the API Helper Library

For more complex scenarios, use the dedicated `api-helper.js` file:

```javascript
// First, include api-helper.js in your content script
// In manifest.json:
{
  "content_scripts": [{
    "js": ["src/scripts/api-helper.js", "src/scripts/content.js"]
  }]
}

// Then use the helper functions:
async function example() {
    // Simple GET request
    const userData = await fetchFromSiteA('/api/user/profile');
    
    // POST request
    const result = await postToSiteA('/api/submit', {
        key: 'value',
        data: 'example'
    });
    
    // Custom request
    const custom = await fetchViaBackground('https://site-a.com/api/custom', {
        method: 'PUT',
        headers: {
            'Custom-Header': 'value'
        },
        body: JSON.stringify({ data: 'test' })
    });
}
```

## Complete Examples

### Example 1: Fetch User Data on Page Load

```javascript
// In content.js
async function loadUserData() {
    try {
        const userData = await fetchViaBackground(
            'https://site-a.com/api/user/profile'
        );
        
        console.log('User ID:', userData.id);
        console.log('User Name:', userData.name);
        
        // Do something with the data
        displayUserInfo(userData);
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// Run when page loads
loadUserData();
```

### Example 2: POST Data with Authentication

```javascript
// Submit form data via background fetch
async function submitForm(formData) {
    try {
        const result = await fetchViaBackground(
            'https://site-a.com/api/submit',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }
        );
        
        console.log('Submission successful:', result);
        return result;
    } catch (error) {
        console.error('Submission failed:', error);
        throw error;
    }
}

// Usage
const data = { name: 'John', email: 'john@example.com' };
submitForm(data);
```

### Example 3: Periodic Data Refresh

```javascript
// Fetch fresh data every 30 seconds
async function startPeriodicFetch() {
    async function fetchAndUpdate() {
        try {
            const data = await fetchViaBackground(
                'https://site-a.com/api/latest-updates'
            );
            
            // Update UI with new data
            updateDashboard(data);
        } catch (error) {
            console.error('Periodic fetch failed:', error);
        }
    }
    
    // Initial fetch
    fetchAndUpdate();
    
    // Then every 30 seconds
    setInterval(fetchAndUpdate, 30000);
}

startPeriodicFetch();
```

## Background Script Implementation

The background script (`src/scripts/background.js`) handles all fetch requests:

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FETCH_API') {
        handleBackgroundFetch(request.url, request.options)
            .then(response => {
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});
```

## Important Notes

### Credentials and Cookies

- All background fetches use `credentials: 'include'`
- This automatically includes cookies for the target domain
- The user must be logged in to Site A for authenticated requests to work
- Cookies are isolated per browser profile

### CORS Considerations

- Background scripts can make cross-origin requests
- The target server must allow the extension's origin or use proper CORS headers
- Some APIs may block extension contexts - test thoroughly

### Error Handling

Always handle errors properly:

```javascript
try {
    const data = await fetchViaBackground(url);
    // Success
} catch (error) {
    if (error.message.includes('HTTP 401')) {
        console.log('User not authenticated');
    } else if (error.message.includes('HTTP 404')) {
        console.log('Endpoint not found');
    } else {
        console.log('Network error:', error);
    }
}
```

### Security Best Practices

1. **Validate URLs**: Only fetch from trusted domains
2. **Sanitize Data**: Clean and validate all response data
3. **Handle Sensitive Data**: Don't log sensitive information
4. **Rate Limiting**: Avoid hammering APIs with too many requests
5. **User Privacy**: Only fetch data the user expects

## Debugging

Enable detailed logging in the background script:

```javascript
// In background.js, logs will show:
console.log('[Data Bridge Background] Fetching:', url);
console.log('[Data Bridge Background] Fetch successful:', data);
console.error('[Data Bridge Background] Fetch failed:', error);
```

View logs:
- **Background Script**: Open `chrome://extensions/` → Click "Service worker" → View console
- **Content Script**: Open DevTools on the page → Console tab

## Troubleshooting

### Request fails with "User not authenticated"
- User needs to be logged in to Site A in the same browser
- Check if cookies are enabled
- Verify the API endpoint requires authentication

### Request fails with CORS error
- Background fetches should bypass CORS, but some servers block extension contexts
- Check server's CORS configuration
- Verify the API allows requests from browser extensions

### No response received
- Ensure `return true` is in the message listener (keeps channel open)
- Check background script logs for errors
- Verify the message format is correct

## Example Integration

Here's a complete example showing how to use background fetch in your extension:

```javascript
// content.js - Site A
(function() {
    // Helper function (already included in content.js)
    async function fetchViaBackground(url, options = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: 'FETCH_API', url, options },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (response?.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response?.error || 'Unknown error'));
                    }
                }
            );
        });
    }
    
    // Your custom logic
    async function initExtension() {
        try {
            // Fetch initial data
            const config = await fetchViaBackground(
                'https://site-a.com/api/config'
            );
            
            console.log('Extension initialized with config:', config);
            
            // Use the config to set up your extension
            setupExtension(config);
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtension);
    } else {
        initExtension();
    }
})();
```

---

**Ready to use!** The background fetch feature is now fully integrated into your extension.
