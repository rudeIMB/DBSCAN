export const quizData = [
    {
        question: "What happens if you decrease the Epsilon (ε) value?",
        options: [
            "Clusters become larger and more inclusive",
            "Clusters become smaller and more points are labeled as noise",
            "The algorithm runs faster but results are the same",
            "Noise points are automatically merged into clusters"
        ],
        correct: 1
    },
    {
        question: "Which point type has at least MinPts neighbors within Epsilon?",
        options: [
            "Border Point",
            "Noise Point",
            "Core Point",
            "Reachable Point"
        ],
        correct: 2
    },
    {
        question: "What is the primary advantage of DBSCAN over K-Means?",
        options: [
            "It is faster for any dataset size",
            "It can find clusters of arbitrary shapes and identify outliers",
            "It always requires fewer hyperparameters",
            "It works better for high-dimensional text data"
        ],
        correct: 1
    }
];

// All generators return normalized coords (nx, ny) in 0..1 range.
// DBSCANVisualizer.setPoints() maps them to actual canvas pixels at render time,
// so datasets stay correct on every screen size and after resize.

export function generateDatasets() {
    return {
        circles: generateCircles(),
        moons:   generateMoons(),
        blobs:   generateBlobs(),
        random:  generateRandom()
    };
}

function generateCircles() {
    const pts = [];
    // Inner ring — radius ~12% of canvas short-side
    for (let i = 0; i < 50; i++) {
        const r = 0.12 + Math.random() * 0.04;
        const a = Math.random() * Math.PI * 2;
        pts.push({ nx: 0.5 + Math.cos(a) * r, ny: 0.5 + Math.sin(a) * r });
    }
    // Outer ring — radius ~35%
    for (let i = 0; i < 100; i++) {
        const r = 0.33 + Math.random() * 0.06;
        const a = Math.random() * Math.PI * 2;
        pts.push({ nx: 0.5 + Math.cos(a) * r, ny: 0.5 + Math.sin(a) * r });
    }
    return pts;
}

function generateMoons() {
    const pts = [];
    for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI;
        const r = 0.25;
        pts.push({
            nx: 0.35 + Math.cos(a) * r + (Math.random() - 0.5) * 0.06,
            ny: 0.5  + Math.sin(a) * r + (Math.random() - 0.5) * 0.06
        });
    }
    for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI;
        const r = 0.25;
        pts.push({
            nx: 0.65 + Math.cos(a) * r + (Math.random() - 0.5) * 0.06,
            ny: 0.5  - Math.sin(a) * r + (Math.random() - 0.5) * 0.06
        });
    }
    return pts;
}

function generateBlobs() {
    const pts = [];
    const centers = [
        { cx: 0.25, cy: 0.25 },
        { cx: 0.75, cy: 0.75 },
        { cx: 0.75, cy: 0.25 }
    ];
    centers.forEach(({ cx, cy }) => {
        for (let i = 0; i < 40; i++) {
            pts.push({
                nx: cx + (Math.random() - 0.5) * 0.22,
                ny: cy + (Math.random() - 0.5) * 0.22
            });
        }
    });
    return pts;
}

function generateRandom() {
    const pts = [];
    for (let i = 0; i < 150; i++) {
        pts.push({ nx: Math.random(), ny: Math.random() });
    }
    return pts;
}
