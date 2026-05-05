import './style.css';
import { DBSCANVisualizer } from './src/visualizer.js';
import { drawKDistancePlot } from './src/tuning.js';
import { generateDatasets, quizData } from './src/content.js';

// Initialize Lucide icons with safety check
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
} else {
    setTimeout(() => typeof lucide !== 'undefined' && lucide.createIcons(), 500);
}

// Prism highlighting
if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
}

const viz = new DBSCANVisualizer('viz-canvas');
const datasets = generateDatasets(viz.canvas.width, viz.canvas.height);

// Initial Dataset
viz.setPoints(datasets.circles);

// Hero Background Animation
initHeroBg();

// UI Elements
const epsSlider = document.getElementById('eps-slider');
const epsVal = document.getElementById('eps-val');
const minPtsSlider = document.getElementById('minpts-slider');
const minPtsVal = document.getElementById('minpts-val');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const datasetSelect = document.getElementById('dataset-select');

// Controls
epsSlider.addEventListener('input', (e) => {
    viz.eps = parseInt(e.target.value);
    epsVal.textContent = viz.eps;
    viz.reset();
    updateKPlot();
});

minPtsSlider.addEventListener('input', (e) => {
    viz.minPts = parseInt(e.target.value);
    minPtsVal.textContent = viz.minPts;
    viz.reset();
    updateKPlot();
});

speedSlider.addEventListener('input', (e) => {
    viz.animationSpeed = parseFloat(e.target.value);
    speedVal.textContent = viz.animationSpeed.toFixed(1) + 'x';
});

datasetSelect.addEventListener('change', (e) => {
    viz.setPoints(datasets[e.target.value]);
    updateKPlot();
});

document.getElementById('btn-run').addEventListener('click', () => viz.run());
document.getElementById('btn-step').addEventListener('click', () => viz.step());
document.getElementById('btn-reset').addEventListener('click', () => viz.reset());

// K-Distance Plot
function updateKPlot() {
    const distances = viz.getKDistances(viz.minPts);
    drawKDistancePlot('k-distance-chart', distances);
}
updateKPlot();

// Quiz Initialization
initQuiz();

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-up');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('section > div').forEach(div => observer.observe(div));

function initHeroBg() {
    const canvas = document.getElementById('hero-bg');
    const ctx = canvas.getContext('2d');
    let width, height;
    let points = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 50; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#F4B400';
        
        points.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw lines
            points.forEach(p2 => {
                const d = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
                if (d < 150) {
                    ctx.strokeStyle = `rgba(244, 180, 0, ${1 - d/150})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function initQuiz() {
    const container = document.getElementById('quiz-container');
    quizData.forEach((q, i) => {
        const qDiv = document.createElement('div');
        qDiv.style.cssText = 'background:white;border-radius:20px;padding:28px 32px;border:2px solid #EBEBEB;';
        qDiv.innerHTML = `
            <h3 style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;color:#1E1E1E;margin-bottom:16px;">${i+1}. ${q.question}</h3>
            <div style="display:flex;flex-direction:column;gap:10px;">
                ${q.options.map((opt, idx) => `
                    <div class="quiz-option" data-q="${i}" data-idx="${idx}">${opt}</div>
                `).join('')}
            </div>
            <div class="feedback" style="display:none;margin-top:14px;font-size:0.875rem;font-weight:600;"></div>
        `;
        container.appendChild(qDiv);
    });

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('quiz-option')) {
            const qIdx = e.target.dataset.q;
            const optIdx = parseInt(e.target.dataset.idx);
            const question = quizData[qIdx];
            const options = e.target.parentElement.querySelectorAll('.quiz-option');
            const feedback = e.target.parentElement.nextElementSibling;

            options.forEach(opt => opt.classList.remove('correct', 'wrong'));
            
            if (optIdx === question.correct) {
                e.target.classList.add('correct');
                feedback.textContent = '✅ Correct! Great job.';
                feedback.style.cssText = 'display:block;margin-top:14px;font-size:0.875rem;font-weight:600;color:#059669;';
            } else {
                e.target.classList.add('wrong');
                feedback.textContent = '❌ Not quite. Try again!';
                feedback.style.cssText = 'display:block;margin-top:14px;font-size:0.875rem;font-weight:600;color:#FF3B30;';
            }
        }
    });
}
