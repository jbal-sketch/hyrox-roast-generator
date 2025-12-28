function generateShareCardImage(data) {
    const canvas = document.getElementById('shareCard');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (optimized for social media)
    const width = 1200;
    const height = 630;
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
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🔥 HYROX ROAST 🔥', width / 2, 40);
    
    // Athlete name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    const athleteName = data.data.athleteName || 'Unknown Athlete';
    ctx.fillText(athleteName, width / 2, 120);
    
    // Stats section
    ctx.fillStyle = '#FF8C42';
    ctx.font = '36px Arial';
    const statsY = 220;
    const stats = [
        `Time: ${data.data.totalTime || 'N/A'}`,
        `Overall: #${data.data.overallPosition}`,
        `Category: #${data.data.categoryPosition}`
    ];
    
    stats.forEach((stat, index) => {
        ctx.fillText(stat, width / 2, statsY + (index * 50));
    });
    
    // Divider line
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 400);
    ctx.lineTo(width - 100, 400);
    ctx.stroke();
    
    // Roast text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const roastText = data.roast;
    const maxWidth = width - 200;
    const lineHeight = 40;
    const maxLines = 4;
    const words = roastText.split(' ');
    const lines = [];
    let currentLine = '';
    
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
    
    // Display lines (truncate if too many)
    const displayLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
        displayLines[maxLines - 1] = displayLines[maxLines - 1].substring(0, displayLines[maxLines - 1].length - 3) + '...';
    }
    
    displayLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, 430 + (index * lineHeight));
    });
    
    // Footer
    ctx.fillStyle = '#FF8C42';
    ctx.font = '24px Arial';
    ctx.fillText('Get your roast at hyroxroast.com', width / 2, height - 50);
}

