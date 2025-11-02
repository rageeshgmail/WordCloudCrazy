// Global variables to store word data and configuration
let wordData = [];
let wordPositions = [];
let wordColorMap = {}; // Store color mapping for word position detection

/**
 * Parse Excel file and extract words from first column and explanations from second column
 * Only reads the first sheet of the Excel file
 */
function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                // Read Excel file as array buffer
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get only the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert sheet to array format (no headers)
                const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Extract words (first column) and explanations (second column)
                const wordData = [];
                sheetData.forEach(row => {
                    // Check if first column has a value
                    if (row[0] && String(row[0]).trim()) {
                        const word = String(row[0]).trim();
                        const explanation = row[1] ? String(row[1]).trim() : word;
                        
                        wordData.push({
                            word: word,
                            explanation: explanation
                        });
                    }
                });
                
                if (wordData.length === 0) {
                    reject(new Error('No words found in the first column.'));
                } else {
                    resolve(wordData);
                }
            } catch (error) {
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file.'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Generate unique color palette for words
 * Returns an array of distinct colors
 */
function generateColorPalette(count) {
    const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5',
        '#6b8e23', '#ff6347', '#4682b4', '#ffa500', '#32cd32',
        '#ff1493', '#1e90ff', '#ffd700', '#00ced1', '#ff69b4'
    ];
    
    // Extend palette by cycling through colors if needed
    const palette = [];
    for (let i = 0; i < count; i++) {
        palette.push(colors[i % colors.length]);
    }
    
    return palette;
}

/**
 * Load word data and prepare word cloud configuration
 * Ensures each word appears at least once with adequate size
 */
function loadWordData(data) {
    wordData = data;
    
    // Create color mapping for each word (stored globally for position detection)
    const colorPalette = generateColorPalette(wordData.length);
    wordColorMap = {};
    wordData.forEach((item, index) => {
        wordColorMap[item.word.toLowerCase()] = colorPalette[index];
    });
    
    // Prepare word list with weights
    // Each word gets a minimum weight to ensure it appears in the cloud
    const wordList = wordData.map((item, index) => {
        // Minimum weight of 40 ensures all words appear at least once
        // Slight variation for visual interest
        const weight = 40 + (index % 10) * 2;
        return [item.word, weight];
    });
    
    // Word cloud configuration
    const container = document.querySelector('.wordcloud-container');
    const canvasWidth = container.clientWidth - 40;
    const canvasHeight = container.clientHeight - 40;
    
    return {
        list: wordList,
        gridSize: 12,
        weightFactor: function(size) {
            // Calculate font size based on weight and container size
            return size * 0.8 * Math.min(canvasWidth, canvasHeight) / 400;
        },
        fontFamily: 'Arial, sans-serif',
        color: function(word) {
            // Return unique color for each word
            return wordColorMap[word.toLowerCase()] || '#333333';
        },
        rotateRatio: 0.3, // 30% of words can be rotated
        rotationSteps: 2,
        backgroundColor: 'transparent',
        drawOutOfBound: false,
        shrinkToFit: true,
        minSize: 12, // Minimum font size in pixels for readability
        ellipticity: 0.65
    };
}

/**
 * Generate and display the word cloud on the canvas
 */
function generateWordCloud(options) {
    const canvas = document.getElementById('wordcloud-canvas');
    const container = document.querySelector('.wordcloud-container');
    
    // Set canvas size
    canvas.width = container.clientWidth - 40;
    canvas.height = container.clientHeight - 40;
    
    // Clear previous word positions
    wordPositions.length = 0;
    
    // Generate word cloud
    WordCloud(canvas, options);
    
    // Extract word positions for hover detection
    setTimeout(() => {
        extractWordPositions(canvas);
        addInteractivity(canvas);
    }, 100);
}

/**
 * Extract word positions from canvas by analyzing pixel colors
 * This allows us to detect which word is under the mouse cursor
 */
function extractWordPositions(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Group pixels by color to identify word boundaries
    const colorGroups = {};
    
    // Sample every 2 pixels for performance
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const idx = (y * canvas.width + x) * 4;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const a = imageData.data[idx + 3];
            
            // If pixel is not transparent, it's part of a word
            if (a > 0) {
                const colorKey = `${r},${g},${b}`;
                
                if (!colorGroups[colorKey]) {
                    colorGroups[colorKey] = {
                        minX: x, maxX: x,
                        minY: y, maxY: y
                    };
                }
                
                const group = colorGroups[colorKey];
                group.minX = Math.min(group.minX, x);
                group.maxX = Math.max(group.maxX, x);
                group.minY = Math.min(group.minY, y);
                group.maxY = Math.max(group.maxY, y);
            }
        }
    }
    
    // Match color groups to words and create position records
    Object.keys(colorGroups).forEach(colorKey => {
        const [r, g, b] = colorKey.split(',').map(Number);
        const hexColor = rgbToHex(r, g, b);
        
        // Find matching word by color using stored color map
        for (const item of wordData) {
            const wordLower = item.word.toLowerCase();
            const expectedColor = wordColorMap[wordLower];
            
            if (expectedColor && colorsMatch(expectedColor, hexColor, 25)) {
                const bounds = colorGroups[colorKey];
                wordPositions.push({
                    word: item.word,
                    explanation: item.explanation,
                    minX: bounds.minX,
                    maxX: bounds.maxX,
                    minY: bounds.minY,
                    maxY: bounds.maxY
                });
                break;
            }
        }
    });
}

/**
 * Convert RGB values to hex color
 */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Check if two hex colors match within tolerance
 */
function colorsMatch(color1, color2, tolerance) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    if (!c1 || !c2) return false;
    
    return Math.abs(c1.r - c2.r) < tolerance &&
           Math.abs(c1.g - c2.g) < tolerance &&
           Math.abs(c1.b - c2.b) < tolerance;
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Find which word is at the given coordinates
 */
function findWordAtPosition(x, y) {
    for (const wordPos of wordPositions) {
        if (x >= wordPos.minX && x <= wordPos.maxX &&
            y >= wordPos.minY && y <= wordPos.maxY) {
            return wordPos;
        }
    }
    return null;
}

/**
 * Add interactivity to the canvas for hover tooltips
 */
function addInteractivity(canvas) {
    const tooltip = document.getElementById('tooltip');
    const rect = canvas.getBoundingClientRect();
    
    let currentWord = null;
    
    // Show tooltip when hovering over a word
    canvas.addEventListener('mousemove', (e) => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const wordPos = findWordAtPosition(x, y);
        
        if (wordPos && wordPos.word !== currentWord) {
            currentWord = wordPos.word;
            showTooltip(e, wordPos.explanation);
            canvas.style.cursor = 'pointer';
        } else if (!wordPos) {
            currentWord = null;
            hideTooltip();
            canvas.style.cursor = 'default';
        }
    });
    
    // Hide tooltip when mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
        currentWord = null;
        hideTooltip();
        canvas.style.cursor = 'default';
    });
}

/**
 * Display tooltip near mouse pointer with word explanation
 */
function showTooltip(event, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.classList.add('show');
    
    // Position tooltip near mouse pointer
    const x = event.clientX;
    const y = event.clientY;
    
    tooltip.style.left = x + 15 + 'px';
    tooltip.style.top = y - 15 + 'px';
    
    // Adjust position if tooltip goes off screen
    requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 10;
        
        if (tooltipRect.right > window.innerWidth - padding) {
            tooltip.style.left = (x - tooltipRect.width - 15) + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight - padding) {
            tooltip.style.top = (y - tooltipRect.height - 15) + 'px';
        }
        if (tooltipRect.left < padding) {
            tooltip.style.left = padding + 'px';
        }
        if (tooltipRect.top < padding) {
            tooltip.style.top = padding + 'px';
        }
    });
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

/**
 * Initialize file input handler
 * Wait for user to select Excel file, then parse and generate word cloud
 */
function setupFileInput() {
    const fileInput = document.getElementById('file-input');
    
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }
        
        try {
            // Parse Excel file
            const data = await parseExcelFile(file);
            
            // Load data and get word cloud options
            const options = loadWordData(data);
            
            // Generate word cloud
            generateWordCloud(options);
            
        } catch (error) {
            alert('Error: ' + error.message);
            console.error('Error processing file:', error);
        }
    });
}

// Initialize when page loads
window.addEventListener('load', () => {
    setupFileInput();
});
