// Load images
let backgroundImage = null;
let logoImage = null;

// Preload images
function loadImages() {
    return new Promise((resolve, reject) => {
        let loaded = 0;
        const total = 2;
        
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => {
            backgroundImage = bgImg;
            loaded++;
            if (loaded === total) resolve();
        };
        bgImg.onerror = () => {
            console.warn('Failed to load background image');
            loaded++;
            if (loaded === total) resolve();
        };
        bgImg.src = 'insta hyrox background.png';
        
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
            logoImage = logoImg;
            loaded++;
            if (loaded === total) resolve();
        };
        logoImg.onerror = () => {
            console.warn('Failed to load logo image');
            loaded++;
            if (loaded === total) resolve();
        };
        logoImg.src = 'logo.png';
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
    
    // Draw logo in top-left corner
    if (logoImage && logoImage.complete) {
        const logoSize = isStories ? 120 : 100;
        const logoX = 40;
        const logoY = 40;
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    }
    
    // Title text (above banner)
    const title = data.title || 'HYROX ROAST';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${isStories ? 60 : 50}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleY = isStories ? 60 : 50;
    ctx.fillText(title, width / 2, titleY);
    
    // Yellow banner with finish time
    const bannerHeight = isStories ? 120 : 100;
    const bannerY = isStories ? 150 : 130;
    ctx.fillStyle = '#FFD700'; // Yellow
    ctx.fillRect(0, bannerY, width, bannerHeight);
    
    // Finish time text on banner
    const finishTime = data.data.totalTime || 'N/A';
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${isStories ? 64 : 52}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`FINISH TIME: ${finishTime}`, width / 2, bannerY + bannerHeight / 2);
    
    // Roast text below banner
    const roastText = data.roast || '';
    const maxWidth = width - 160; // Padding on both sides
    const startY = bannerY + bannerHeight + (isStories ? 40 : 35);
    const availableHeight = height - startY - (isStories ? 80 : 70); // Space for footer
    
    // Use modern font stack
    const modernFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    // Start with a font size and adjust if needed
    let fontSize = isStories ? 36 : 28;
    let lineHeight = fontSize + 10;
    let paragraphSpacing = 20;
    let allLines = [];
    
    // Split text into paragraphs
    const paragraphs = roastText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) {
        paragraphs.push(roastText);
    }
    
    // Try to fit the text, reducing font size if necessary
    let attempts = 0;
    while (attempts < 5) {
        ctx.font = `${fontSize}px ${modernFont}`;
        lineHeight = fontSize + 10;
        paragraphSpacing = Math.max(16, fontSize * 0.7);
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
        if (totalTextHeight <= availableHeight || fontSize <= 20) {
            break;
        }
        
        fontSize -= 2;
        attempts++;
    }
    
    // Recalculate lineHeight and paragraphSpacing with final fontSize
    lineHeight = fontSize + 10;
    paragraphSpacing = Math.max(16, fontSize * 0.7);
    
    // Draw all lines
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let currentY = startY;
    
    allLines.forEach((line) => {
        if (line.isParagraphBreak) {
            currentY += paragraphSpacing;
        } else {
            if (currentY < height - 80) {
                ctx.fillText(line.text, width / 2, currentY);
                currentY += lineHeight;
            }
        }
    });
    
    // Footer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${isStories ? 24 : 20}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Get your roast at https://hyrox-roast-generator.vercel.app/', width / 2, height - 30);
}
