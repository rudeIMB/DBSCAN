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
        ctx.fillStyle = '#38bdf8';
        
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
                    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - d/150})`;
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
        qDiv.className = 'p-8 rounded-3xl bg-white/5 border border-white/10';
        qDiv.innerHTML = `
            <h3 class="text-xl font-bold text-white mb-6">${i+1}. ${q.question}</h3>
            <div class="grid gap-3">
                ${q.options.map((opt, idx) => `
                    <div class="quiz-option" data-q="${i}" data-idx="${idx}">${opt}</div>
                `).join('')}
            </div>
            <div class="mt-4 feedback hidden text-sm font-medium"></div>
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
                feedback.textContent = 'Correct! Great job.';
                feedback.className = 'mt-4 feedback text-emerald-400 block';
            } else {
                e.target.classList.add('wrong');
                feedback.textContent = 'Not quite. Try again!';
                feedback.className = 'mt-4 feedback text-red-400 block';
            }
        }
    });
}
