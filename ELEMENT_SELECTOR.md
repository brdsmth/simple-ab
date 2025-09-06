# Element Selector Feature

The Element Selector is a powerful visual tool that allows users to select elements from their website and automatically generate JSON modifications for A/B test variants.

## How It Works

1. **Visual Selection**: Users can open their website in a new tab with an overlay that allows them to visually select elements
2. **Smart Selector Generation**: The tool automatically generates optimal CSS selectors for selected elements
3. **Auto-Population**: Selected elements automatically populate the variant's JSON modifications with appropriate defaults
4. **Cross-Window Communication**: The selector communicates with the main application using the postMessage API

## Usage

### From Variant Creation/Editing
1. Click the "🎯 Select Element" button next to the Modifications field
2. A new tab opens with the element selector overlay
3. Navigate to your website (or it auto-loads if a project domain is configured)
4. Click "Start Selecting Elements" to enter selection mode
5. Hover over elements to see them highlighted
6. Click on an element to select it
7. Review the selected element details
8. Click "✅ Use This Element" to apply it to your variant

### Element Selector Features
- **Smart Highlighting**: Elements are highlighted with visual indicators when hovered
- **Optimal Selectors**: Generates the most specific and reliable CSS selectors
- **Element Information**: Shows tag name, ID, classes, text content, and generated selector
- **Responsive Design**: Works on mobile and desktop
- **Keyboard Support**: Press ESC to cancel selection mode

## Technical Implementation

### Components
- `ElementSelectorPage.tsx` - Main selector page that opens in new tab
- `ElementSelector.tsx` - Reusable overlay component
- Integration in `ExperimentDetail.tsx` for variant creation/editing

### CSS Selector Generation
The selector generation algorithm prioritizes:
1. Element ID (most specific)
2. Class names
3. Tag name with classes
4. Parent hierarchy with nth-child selectors for uniqueness

### Communication Flow
```
Main App (Variant Form) 
    ↓ (opens new tab)
Element Selector Page
    ↓ (user selects element)
postMessage API
    ↓ (element data)
Main App (auto-populates form)
```

### Generated JSON Structure
```json
{
  "selector": "#cta-button",
  "changes": {
    "style": {
      "background-color": "#3b82f6",
      "color": "#ffffff"
    },
    "text": "Original Button Text",
    "attributes": {
      "data-variant": "modified"
    }
  }
}
```

## Security Considerations

- The element selector page is a public route to allow access to external websites
- Cross-origin communication is handled securely using postMessage
- Only accepts messages with the specific 'ELEMENT_SELECTED' type
- No sensitive data is transmitted between windows

## Browser Compatibility

- Modern browsers supporting ES6+
- postMessage API
- CSS selector API
- Window.open with specific dimensions

## Future Enhancements

- Multiple element selection
- Advanced selector customization
- Element property inspection
- Screenshot capture of selected elements
- Selector validation and testing
