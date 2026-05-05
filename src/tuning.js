export function drawKDistancePlot(containerId, distances) {
    const container = document.getElementById(containerId);
    if (!container || typeof d3 === 'undefined') return;

    // Clear previous render
    d3.select(container).selectAll('*').remove();

    if (distances.length === 0) return;

    const margin = { top: 20, right: 80, bottom: 52, left: 56 };
    const totalW = container.clientWidth;
    const totalH = container.clientHeight || 320;
    const W = totalW - margin.left - margin.right;
    const H = totalH - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', totalW)
        .attr('height', totalH)
        .attr('viewBox', `0 0 ${totalW} ${totalH}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('overflow', 'visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([0, distances.length - 1]).range([0, W]);
    const yScale = d3.scaleLinear()
        .domain([d3.min(distances) * 0.95, d3.max(distances) * 1.05])
        .range([H, 0])
        .nice();

    // Gradient
    const defs = svg.append('defs');
    const gradId = `kd-grad-${Math.random().toString(36).slice(2)}`;
    const grad = defs.append('linearGradient')
        .attr('id', gradId).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.20);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0);

    // Grid
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-W).tickFormat(''))
        .call(ax => ax.select('.domain').remove())
        .call(ax => ax.selectAll('line').attr('stroke', '#F0F0F0').attr('stroke-dasharray', '4,3'));

    // Area fill
    const area = d3.area()
        .x((_, i) => xScale(i))
        .y0(H).y1(d => yScale(d))
        .curve(d3.curveCatmullRom.alpha(0.5));
    g.append('path').datum(distances).attr('fill', `url(#${gradId})`).attr('d', area);

    // Line with draw animation
    const line = d3.line()
        .x((_, i) => xScale(i)).y(d => yScale(d))
        .curve(d3.curveCatmullRom.alpha(0.5));
    const path = g.append('path').datum(distances)
        .attr('fill', 'none').attr('stroke', '#38bdf8')
        .attr('stroke-width', 2.5).attr('d', line);
    const len = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
        .transition().duration(900).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);

    // Elbow detection via max 2nd derivative
    let elbowIdx = 1, maxCurv = -Infinity;
    for (let i = 1; i < distances.length - 1; i++) {
        const c = distances[i + 1] + distances[i - 1] - 2 * distances[i];
        if (c > maxCurv) { maxCurv = c; elbowIdx = i; }
    }
    const ex = xScale(elbowIdx), ey = yScale(distances[elbowIdx]);

    const elbowG = g.append('g').attr('transform', `translate(${ex},${ey})`);
    elbowG.append('circle').attr('r', 22)
        .attr('fill', 'rgba(244,180,0,0.08)')
        .attr('stroke', 'rgba(244,180,0,0.35)').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');
    elbowG.append('circle').attr('r', 5)
        .attr('fill', '#F4B400').attr('stroke', 'white').attr('stroke-width', 2);

    const labelRight = ex < W * 0.65;
    const lx = labelRight ? 30 : -138;
    const lG = elbowG.append('g').attr('transform', `translate(${lx},-10)`);
    lG.append('rect').attr('x', -8).attr('y', -18).attr('width', 120).attr('height', 42)
        .attr('rx', 8).attr('fill', 'white')
        .attr('stroke', 'rgba(244,180,0,0.4)').attr('stroke-width', 1.5);
    lG.append('text').attr('y', -2)
        .attr('font-size', 11).attr('font-family', 'Poppins, sans-serif').attr('font-weight', 700)
        .attr('fill', '#C68A00').text('↑ Elbow point');
    lG.append('text').attr('y', 14)
        .attr('font-size', 10).attr('font-family', 'Inter, sans-serif')
        .attr('fill', '#9A9A9A').text('Optimal ε here');
    elbowG.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', labelRight ? 22 : -22).attr('y2', -5)
        .attr('stroke', 'rgba(244,180,0,0.5)').attr('stroke-dasharray', '3,2');

    // Tooltip
    d3.select(container).style('position', 'relative');
    const tooltip = d3.select(container).append('div')
        .style('position', 'absolute').style('pointer-events', 'none').style('opacity', 0)
        .style('background', 'white').style('border', '1.5px solid #EBEBEB')
        .style('border-radius', '10px').style('padding', '8px 12px')
        .style('font-family', 'Inter, sans-serif').style('font-size', '12px')
        .style('box-shadow', '0 4px 16px rgba(0,0,0,0.08)').style('white-space', 'nowrap')
        .style('z-index', '10');

    const hoverLine = g.append('line').attr('y1', 0).attr('y2', H)
        .attr('stroke', '#E0E0E0').attr('stroke-width', 1).attr('stroke-dasharray', '4,3').attr('opacity', 0);
    const hoverDot = g.append('circle').attr('r', 4.5)
        .attr('fill', '#38bdf8').attr('stroke', 'white').attr('stroke-width', 2).attr('opacity', 0);

    g.append('rect').attr('width', W).attr('height', H)
        .attr('fill', 'none').attr('pointer-events', 'all').style('cursor', 'crosshair')
        .on('mousemove', function(event) {
            const [mx] = d3.pointer(event, this);
            const idx = Math.max(0, Math.min(Math.round(xScale.invert(mx)), distances.length - 1));
            const cx = xScale(idx), cy = yScale(distances[idx]);
            hoverLine.attr('x1', cx).attr('x2', cx).attr('opacity', 1);
            hoverDot.attr('cx', cx).attr('cy', cy).attr('opacity', 1);
            const tipX = cx + margin.left + (cx > W * 0.7 ? -130 : 12);
            tooltip
                .html(`<b style="color:#1E1E1E;">Point ${idx + 1}</b><br><span style="color:#38bdf8;">k-dist: <b>${distances[idx].toFixed(1)}</b></span>`)
                .style('left', `${tipX}px`).style('top', `${cy + margin.top - 30}px`).style('opacity', 1);
        })
        .on('mouseleave', () => {
            hoverLine.attr('opacity', 0); hoverDot.attr('opacity', 0); tooltip.style('opacity', 0);
        });

    // X axis
    g.append('g').attr('transform', `translate(0,${H})`)
        .call(d3.axisBottom(xScale).ticks(6).tickSize(4))
        .call(ax => ax.select('.domain').attr('stroke', '#EBEBEB'))
        .call(ax => ax.selectAll('text').attr('fill', '#9A9A9A').attr('font-size', 11).attr('font-family', 'Inter, sans-serif'))
        .call(ax => ax.selectAll('line').attr('stroke', '#EBEBEB'));
    g.append('text').attr('x', W / 2).attr('y', H + 44)
        .attr('text-anchor', 'middle').attr('font-size', 11)
        .attr('font-family', 'Inter, sans-serif').attr('fill', '#9A9A9A').text('Sorted Points →');

    // Y axis
    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(4))
        .call(ax => ax.select('.domain').attr('stroke', '#EBEBEB'))
        .call(ax => ax.selectAll('text').attr('fill', '#9A9A9A').attr('font-size', 11).attr('font-family', 'Inter, sans-serif'))
        .call(ax => ax.selectAll('line').attr('stroke', '#EBEBEB'));
    g.append('text').attr('transform', 'rotate(-90)')
        .attr('x', -H / 2).attr('y', -44)
        .attr('text-anchor', 'middle').attr('font-size', 11)
        .attr('font-family', 'Inter, sans-serif').attr('fill', '#9A9A9A').text('← K-Distance (ε)');
}
