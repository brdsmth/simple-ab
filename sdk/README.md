# SimpleAB JavaScript SDK

JavaScript SDK for client-side A/B testing integration.

## Installation

Add the SDK to your website:

```html
<script src="http://localhost:9000/dist/simpleab.js"></script>
<script>
  SimpleAB.init({
    apiKey: 'your-api-key-here',
    apiUrl: 'http://localhost:3001/api',
    enableLogging: true
  });
</script>
```

## How It Works

1. **Automatic variant assignment** - Users get consistent variants based on their ID
2. **Automatic modifications** - SDK applies changes to your page elements
3. **Event tracking** - Conversion events are tracked automatically

## Variant Configuration

Define modifications in your experiment variants:

```json
{
  "selector": "#my-button",
  "style": {
    "background-color": "#ff0000",
    "color": "white"
  },
  "text": "New Button Text"
}
```

### Supported Modifications

- **Style changes**: `"style": {"color": "red", "font-size": "16px"}`
- **Text changes**: `"text": "New text content"`
- **Attribute changes**: `"attributes": {"href": "/new-link"}`
- **Visibility**: `"visibility": "hidden"` or `"visibility": "visible"`

## API

### Initialize
```javascript
SimpleAB.init(config)
```

### Track Events
```javascript
SimpleAB.trackGoal('conversion', { value: 100 })
```

### Get Variant
```javascript
const variant = SimpleAB.getVariant('experiment-id')
```
