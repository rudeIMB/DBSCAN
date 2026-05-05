export class DBSCANVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.eps = 30;
        this._epsNorm = null; // normalized eps (fraction of canvas diagonal)
        this.minPts = 4;
        this.clusters = [];
        this.visited = new Set();
        this.noise = new Set();
        this.currentPointIndex = -1;
        this.isRunning = false;
        this.isStepping = false;
        this.animationSpeed = 1;
        this.abortController = null;
        
        this.colors = {
            unvisited: '#C8C8C8',
            core: '#10b981',
            border: '#F4B400',
            noise: '#FF3B30',
            visited: '#F4B400',
            clusterBase: ['#F4B400', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316']
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasInput(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.handleCanvasInput(t.clientX, t.clientY);
        }, { passive: false });
    }

    handleCanvasInput(clientX, clientY) {
        if (this.isRunning) return;
        const rect = this.canvas.getBoundingClientRect();
        // Scale from CSS pixels to canvas pixels
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        this.points.push({
            x, y,
            type: 'unvisited',
            clusterId: -1,
            isVisiting: false
        });
        this.draw();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const newW = Math.max(rect.width, 1);
        const newH = Math.max(rect.height, 1);
        const oldW = this.canvas.width || newW;
        const oldH = this.canvas.height || newH;

        // Scale existing (user-placed or pre-set) points proportionally
        if (this.canvas.width > 0 && this.canvas.height > 0 && this.points.length > 0) {
            const scaleX = newW / oldW;
            const scaleY = newH / oldH;
            this.points.forEach(p => {
                p.x *= scaleX;
                p.y *= scaleY;
            });
        }

        // Keep eps as a stable fraction of canvas width so it scales correctly
        if (this.canvas.width > 0) {
            // Persist the normalized eps before changing canvas size
            this._epsNorm = this.eps / oldW;
        } else {
            // First call — set a sensible default (5% of width)
            this._epsNorm = this.eps / newW;
        }
        this.eps = Math.round(this._epsNorm * newW);

        this.canvas.width = newW;
        this.canvas.height = newH;
        this.draw();
    }

    setPoints(points) {
        // Accept either raw {x,y} (already in canvas coords) or normalized {nx,ny} (0-1)
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.points = points.map(p => ({
            x: p.nx !== undefined ? p.nx * w : p.x,
            y: p.ny !== undefined ? p.ny * h : p.y,
            type: 'unvisited',
            clusterId: -1,
            isVisiting: false
        }));
        this.reset();
    }

    reset() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isRunning = false;
        this.isStepping = false;
        this.visited.clear();
        this.noise.clear();
        this.clusters = [];
        this.currentPointIndex = -1;
        this.points.forEach(p => {
            p.type = 'unvisited';
            p.clusterId = -1;
            p.isVisiting = false;
        });
        this.draw();
        this.updateStats();
    }

    updateStats() {
        document.getElementById('cluster-count').textContent = this.clusters.length;
        document.getElementById('noise-count').textContent = this.noise.size;
        document.getElementById('status-text').textContent = this.isRunning ? 'Running...' : 'Ready';
    }

    async run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.abortController = new AbortController();
        this.updateStats();
        
        for (let i = 0; i < this.points.length; i++) {
            if (this.visited.has(i)) continue;
            
            try {
                await this.processPoint(i);
            } catch (e) {
                if (e.name === 'AbortError') break;
                throw e;
            }
            if (!this.isRunning) break;
        }
        
        this.isRunning = false;
        this.updateStats();
        document.getElementById('status-text').textContent = 'Completed';
    }

    async step() {
        if (this.isRunning) return;
        this.isStepping = true;
        
        // Find next unvisited point
        let found = false;
        for (let i = this.currentPointIndex + 1; i < this.points.length; i++) {
            if (!this.visited.has(i)) {
                this.currentPointIndex = i;
                await this.processPoint(i);
                found = true;
                break;
            }
        }
        
        if (!found) {
            document.getElementById('status-text').textContent = 'Completed';
        }
        this.isStepping = false;
    }

    async processPoint(index) {
        if (this.abortController?.signal.aborted) throw { name: 'AbortError' };
        this.visited.add(index);
        const neighbors = this.getNeighbors(index);
        
        this.points[index].isVisiting = true;
        this.draw();
        await this.sleep(100 / this.animationSpeed);

        if (neighbors.length < this.minPts) {
            this.noise.add(index);
            this.points[index].type = 'noise';
        } else {
            const clusterId = this.clusters.length;
            this.clusters.push([index]);
            this.points[index].clusterId = clusterId;
            this.points[index].type = 'core';
            
            await this.expandCluster(clusterId, neighbors);
        }
        
        this.points[index].isVisiting = false;
        this.draw();
        this.updateStats();
    }

    async expandCluster(clusterId, neighbors) {
        let i = 0;
        while (i < neighbors.length) {
            if (this.abortController?.signal.aborted) throw { name: 'AbortError' };
            const neighborIdx = neighbors[i];
            
            if (this.noise.has(neighborIdx)) {
                this.noise.delete(neighborIdx);
                this.points[neighborIdx].type = 'border';
                this.points[neighborIdx].clusterId = clusterId;
                this.clusters[clusterId].push(neighborIdx);
            }
            
            if (!this.visited.has(neighborIdx)) {
                this.visited.add(neighborIdx);
                this.points[neighborIdx].clusterId = clusterId;
                this.clusters[clusterId].push(neighborIdx);
                this.points[neighborIdx].isVisiting = true;
                this.draw();
                await this.sleep(50 / this.animationSpeed);
                
                const nextNeighbors = this.getNeighbors(neighborIdx);
                if (nextNeighbors.length >= this.minPts) {
                    this.points[neighborIdx].type = 'core';
                    neighbors.push(...nextNeighbors.filter(n => !neighbors.includes(n)));
                } else {
                    this.points[neighborIdx].type = 'border';
                }
                this.points[neighborIdx].isVisiting = false;
            }
            i++;
        }
    }

    getNeighbors(index) {
        const neighbors = [];
        const p1 = this.points[index];
        for (let i = 0; i < this.points.length; i++) {
            const p2 = this.points[i];
            const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            if (dist <= this.eps) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw epsilon circles for points being visited
        this.points.forEach((p, i) => {
            if (p.isVisiting) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, this.eps, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });

        // Draw points
        this.points.forEach((p, i) => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            
            let color = this.colors.unvisited;
            if (p.type === 'core') color = this.colors.core;
            else if (p.type === 'border') color = this.colors.border;
            else if (p.type === 'noise') color = this.colors.noise;
            
            // If in a cluster, use a distinct color but keep the type indicator (e.g., halo)
            if (p.clusterId !== -1) {
                const clusterColor = this.colors.clusterBase[p.clusterId % this.colors.clusterBase.length];
                this.ctx.fillStyle = clusterColor;
            } else {
                this.ctx.fillStyle = color;
            }

            this.ctx.fill();

            // Highlight visiting point
            if (p.isVisiting) {
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.stroke();
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getKDistances(k) {
        const distances = [];
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const dists = [];
            for (let j = 0; j < this.points.length; j++) {
                if (i === j) continue;
                const p2 = this.points[j];
                dists.push(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
            }
            dists.sort((a, b) => a - b);
            distances.push(dists[k - 1] || 0);
        }
        return distances.sort((a, b) => a - b);
    }
}
