export function drawKDistancePlot(canvasId, distances) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (distances.length === 0) return;

    const maxDist = Math.max(...distances);
    const minDist = Math.min(...distances);

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + height);
    ctx.lineTo(padding + width, padding + height);
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + height);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
    
    ctx.beginPath();
    distances.forEach((d, i) => {
        const x = padding + (i / (distances.length - 1)) * width;
        const y = padding + height - ((d - minDist) / (maxDist - minDist)) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    
    distances.forEach((d, i) => {
        const x = padding + (i / (distances.length - 1)) * width;
        const y = padding + height - ((d - minDist) / (maxDist - minDist)) * height;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Add labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Outfit';
    ctx.fillText('Sorted Points', padding + width / 2 - 40, padding + height + 30);
    ctx.save();
    ctx.translate(padding - 30, padding + height / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('K-Distance (ε)', 0, 0);
    ctx.restore();

    // Highlight the "Elbow" area with a pulse effect (static for now)
    const elbowX = padding + width * 0.85;
    const elbowY = padding + height * 0.35;
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fill();
    
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Optimal ε Area', elbowX + 25, elbowY + 5);
}
