// Load images
let backgroundImage = null;

// Preload images
function loadImages() {
    return new Promise((resolve, reject) => {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
            backgroundImage = bgImg;
            resolve();
        };
        bgImg.onerror = () => {
            console.warn('Failed to load background image');
            resolve();
        };
        bgImg.src = 'insta background with logo.png';
    });
}

// Initialize images on page load
loadImages();

function generateShareCardImage(data, format = 'stories') {
    const canvas = document.getElementById('shareCard');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on format
    const isStories = format === 'stories';
    const width = 1080;
    const height = isStories ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background image
    if (backgroundImage && backgroundImage.complete) {
        // Calculate scaling to cover entire canvas
        const imgAspect = backgroundImage.width / backgroundImage.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
            // Image is wider - fit height
            drawHeight = height;
            drawWidth = height * imgAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
        } else {
            // Image is taller - fit width
            drawWidth = width;
            drawHeight = width / imgAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
        
        // Add dark overlay for text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
    } else {
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1F2937');
        gradient.addColorStop(1, '#111827');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Note: Logo is already included in the background image
    
    // Use modern font stack
    const modernFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    // Define spacing constants
    const titleFontSize = isStories ? 72 : 60;
    const bannerHeight = isStories ? 140 : 120;
    const spacingAfterTitle = isStories ? 30 : 25;
    const spacingAfterBanner = isStories ? 40 : 35;
    const maxWidth = width - 160; // Padding on both sides
    
    // Calculate title height
    ctx.font = `bold ${titleFontSize}px ${modernFont}`;
    const title = data.title || 'HYROX ROAST';
    const titleMetrics = ctx.measureText(title);
    const titleHeight = titleMetrics.actualBoundingBoxAscent + titleMetrics.actualBoundingBoxDescent;
    
    // Process roast text to calculate its height
    const roastText = data.roast || '';
    let fontSize = isStories ? 42 : 32;
    let lineHeight, paragraphSpacing;
    let allLines = [];
    
    // Split text into paragraphs
    const paragraphs = roastText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) {
        paragraphs.push(roastText);
    }
    
    // Calculate roast text dimensions (try to fit, reducing font size if necessary)
    let attempts = 0;
    const maxAvailableHeight = height * 0.6; // Use max 60% of canvas height for text
    while (attempts < 8) {
        ctx.font = `${fontSize}px ${modernFont}`;
        lineHeight = fontSize * 1.4; // Better line spacing for Instagram
        paragraphSpacing = Math.max(20, fontSize * 0.8);
        allLines = [];
        
        // Process each paragraph separately
        paragraphs.forEach((paragraph, paraIndex) => {
            const words = paragraph.trim().split(/\s+/);
            let currentLine = '';
            
            // Word wrap each paragraph
            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine) {
                    allLines.push({ text: currentLine, isParagraphBreak: false });
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            
            if (currentLine) {
                allLines.push({ text: currentLine, isParagraphBreak: false });
            }
            
            // Add paragraph spacing (except after last paragraph)
            if (paraIndex < paragraphs.length - 1) {
                allLines.push({ text: '', isParagraphBreak: true });
            }
        });
        
        // Calculate total height including paragraph spacing
        const totalTextHeight = allLines.reduce((sum, line) => {
            return sum + (line.isParagraphBreak ? paragraphSpacing : lineHeight);
        }, 0);
        
        // If text fits, break; otherwise reduce font size
        if (totalTextHeight <= maxAvailableHeight || fontSize <= 22) {
            break;
        }
        
        fontSize -= 2;
        attempts++;
    }
    
    // Recalculate lineHeight and paragraphSpacing with final fontSize
    lineHeight = fontSize * 1.4;
    paragraphSpacing = Math.max(20, fontSize * 0.8);
    
    // Calculate total roast text height
    const roastTextHeight = allLines.reduce((sum, line) => {
        return sum + (line.isParagraphBreak ? paragraphSpacing : lineHeight);
    }, 0);
    
    // Calculate total content height
    const totalContentHeight = titleHeight + spacingAfterTitle + bannerHeight + spacingAfterBanner + roastTextHeight;
    
    // Calculate vertical center position
    const contentStartY = (height - totalContentHeight) / 2;
    
    // Set text shadow properties for Instagram-style readability
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw title
    let currentY = contentStartY;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${titleFontSize}px ${modernFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, width / 2, currentY);
    currentY += titleHeight + spacingAfterTitle;
    
    // Draw yellow banner with finish time
    ctx.shadowBlur = 0; // No shadow on banner
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFD700'; // Yellow
    ctx.fillRect(0, currentY, width, bannerHeight);
    
    // Finish time text on banner
    const finishTime = data.data.totalTime || 'N/A';
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${isStories ? 72 : 60}px ${modernFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FINISH TIME: ${finishTime}`, width / 2, currentY + bannerHeight / 2);
    currentY += bannerHeight + spacingAfterBanner;
    
    // Re-enable text shadow for roast text
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw roast text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${fontSize}px ${modernFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    allLines.forEach((line) => {
        if (line.isParagraphBreak) {
            currentY += paragraphSpacing;
        } else {
            ctx.fillText(line.text, width / 2, currentY);
            currentY += lineHeight;
        }
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Minimal footer at absolute bottom (very small, subtle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `16px ${modernFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('hyrox-roast-generator.vercel.app', width / 2, height - 10);
}
