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

export function generateDatasets(width, height) {
    return {
        circles: generateCircles(width, height),
        moons: generateMoons(width, height),
        blobs: generateBlobs(width, height),
        random: generateRandom(width, height)
    };
}

function generateCircles(width, height) {
    const points = [];
    const center = { x: width / 2, y: height / 2 };
    // Inner circle
    for (let i = 0; i < 50; i++) {
        const r = 50 + Math.random() * 20;
        const a = Math.random() * Math.PI * 2;
        points.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
    }
    // Outer circle
    for (let i = 0; i < 100; i++) {
        const r = 150 + Math.random() * 30;
        const a = Math.random() * Math.PI * 2;
        points.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
    }
    return points;
}

function generateMoons(width, height) {
    const points = [];
    const centerX = width / 2;
    const centerY = height / 2;
    // Top moon
    for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI;
        const r = 100;
        points.push({ 
            x: centerX - 60 + Math.cos(a) * r + (Math.random() - 0.5) * 30, 
            y: centerY + Math.sin(a) * r + (Math.random() - 0.5) * 30 
        });
    }
    // Bottom moon
    for (let i = 0; i < 60; i++) {
        const a = Math.random() * Math.PI;
        const r = 100;
        points.push({ 
            x: centerX + 60 + Math.cos(a) * r + (Math.random() - 0.5) * 30, 
            y: centerY - Math.sin(a) * r + (Math.random() - 0.5) * 30 
        });
    }
    return points;
}

function generateBlobs(width, height) {
    const points = [];
    const centers = [
        { x: width * 0.25, y: height * 0.25 },
        { x: width * 0.75, y: height * 0.75 },
        { x: width * 0.75, y: height * 0.25 }
    ];
    centers.forEach(c => {
        for (let i = 0; i < 40; i++) {
            points.push({ 
                x: c.x + (Math.random() - 0.5) * 100, 
                y: c.y + (Math.random() - 0.5) * 100 
            });
        }
    });
    return points;
}

function generateRandom(width, height) {
    const points = [];
    for (let i = 0; i < 150; i++) {
        points.push({ x: Math.random() * width, y: Math.random() * height });
    }
    return points;
}
