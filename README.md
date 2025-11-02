# Interactive Word Cloud Website

A beautiful, responsive word cloud visualization that displays words from a CSV file with interactive hover tooltips.

## Features

✨ **Dynamic Word Cloud** - Words are sized and positioned automatically based on frequency  
🎨 **Unique Colors** - Each word has a distinct color for visual differentiation  
💬 **Interactive Tooltips** - Hover over any word to see its explanation  
📱 **Responsive Design** - Works beautifully on desktop, tablet, and mobile devices  
♿ **Accessible** - Built with accessibility and modern web standards in mind  
🎯 **Smooth Animations** - Elegant transitions and hover effects

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `script.js` - Word cloud logic and interactivity

## Usage

1. Open `index.html` in a modern web browser
2. The word cloud will automatically generate from the embedded CSV data
3. Hover over any word to see its explanation
4. Click on words for visual feedback

## Customizing the Data

To update the words and explanations, edit the `csvData` variable in `script.js`:

```javascript
const csvData = `Word1,Explanation1
Word2,Explanation2
...`;
```

The CSV format is: `word,explanation` (one word per line)

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- CSS3 (gradients, transitions, flexbox)
- ES6 JavaScript

## Technologies Used

- **WordCloud2.js** - Word cloud generation library
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with gradients and animations

## Performance

- Optimized canvas rendering
- Efficient hover detection
- Responsive to window resizing

Enjoy your interactive word cloud! 🎨
