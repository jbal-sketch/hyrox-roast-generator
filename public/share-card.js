function generateShareCardImage(data) {
    const canvas = document.getElementById('shareCard');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (optimized for Instagram square posts: 1080x1080)
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1F2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < width; i += 50) {
        for (let j = 0; j < height; j += 50) {
            ctx.fillRect(i, j, 1, 1);
        }
    }
    
    // Title
    ctx.fillStyle = '#FF6B35';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🔥 HYROX ROAST 🔥', width / 2, 50);
    
    // Athlete name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px Arial';
    const athleteName = data.data.athleteName || 'Unknown Athlete';
    ctx.fillText(athleteName, width / 2, 130);
    
    // Stats section
    ctx.fillStyle = '#FF8C42';
    ctx.font = '32px Arial';
    const statsY = 200;
    const stats = [
        `Time: ${data.data.totalTime || 'N/A'}`
    ];
    
    stats.forEach((stat, index) => {
        ctx.fillText(stat, width / 2, statsY + (index * 45));
    });
    
    // Divider line
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 260);
    ctx.lineTo(width - 80, 260);
    ctx.stroke();
    
    // Roast text - show full text, no truncation
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const roastText = data.roast;
    const maxWidth = width - 160; // Padding on both sides
    const availableHeight = height - 320; // Space from divider to footer
    
    // Start with a font size and adjust if needed
    let fontSize = 28;
    let lineHeight = 38;
    let lines = [];
    
    // Try to fit the text, reducing font size if necessary
    let attempts = 0;
    while (attempts < 3) {
        ctx.font = `${fontSize}px Arial`;
        lineHeight = fontSize + 10;
        lines = [];
        let currentLine = '';
        const words = roastText.split(' ');
        
        // Word wrap the full text
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        const totalTextHeight = lines.length * lineHeight;
        
        // If text fits, break; otherwise reduce font size
        if (totalTextHeight <= availableHeight || fontSize <= 20) {
            break;
        }
        
        fontSize -= 2;
        attempts++;
    }
    
    // Calculate starting Y position to center the text vertically
    const totalTextHeight = lines.length * lineHeight;
    const startY = Math.max(300, 280 + Math.max(0, (availableHeight - totalTextHeight) / 2));
    
    // Display all lines (no truncation)
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        // Make sure we don't go past the footer area
        if (y < height - 80) {
            ctx.fillText(line, width / 2, y);
        }
    });
    
    // Footer
    ctx.fillStyle = '#FF8C42';
    ctx.font = '22px Arial';
    ctx.fillText('Get your roast at hyroxroast.com', width / 2, height - 50);
}

