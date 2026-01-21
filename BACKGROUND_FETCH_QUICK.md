# Background Fetch API - Quick Reference

## What is it?

A feature that allows content scripts to make authenticated API requests through the background service worker, automatically including the user's login cookies.

## Why use it?

- ✅ Makes requests with user's authentication cookies (`credentials: 'include'`)
- ✅ Bypasses some CORS restrictions
- ✅ Centralized request handling
- ✅ Works from any content script context

## Quick Start

### In Content Script

```javascript
// Simple async/await usage
async function getData() {
    try {
        const data = await fetchViaBackground('https://site-a.com/api/endpoint');
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### POST Request

```javascript
const result = await fetchViaBackground('https://site-a.com/api/submit', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key: 'value' })
});
```

## The Message Format

```javascript
chrome.runtime.sendMessage(
    {
        action: 'FETCH_API',
        url: 'https://site-a.com/api/endpoint',
        options: {
            method: 'GET',
            headers: { /* ... */ },
            body: /* ... */
        }
    },
    (response) => {
        if (response.success) {
            console.log(response.data);
        } else {
            console.error(response.error);
        }
    }
);
```

## Files Modified

1. **src/scripts/background.js** - Added message listener and fetch handler
2. **src/scripts/content.js** - Added example `fetchViaBackground()` helper
3. **src/scripts/api-helper.js** - New utility file with convenience functions

## Documentation

For complete documentation with examples, see [BACKGROUND_FETCH.md](BACKGROUND_FETCH.md)

## Example Use Cases

1. **Fetch user profile data** on page load
2. **Submit form data** with authentication
3. **Periodic data refresh** every N seconds
4. **Pre-load data** before user interaction
5. **Sync data** between extension and server

## Important Notes

- Automatically includes cookies (`credentials: 'include'`)
- User must be logged in to Site A
- Handles JSON responses automatically
- All errors are caught and returned
- Async-friendly with Promise support

---

**Ready to use!** The helper function is already included in `content.js`.
