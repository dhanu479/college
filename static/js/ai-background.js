class AIBackgroundAnimation {
    constructor() {
        this.initBackground();
        this.initNodes();
        this.animate();
        this.initBinaryRain();
    }

    initBackground() {
        const background = document.createElement('div');
        background.className = 'ai-video-background';
        
        // Add layers
        background.innerHTML = `
            <div class="neural-grid"></div>
            <div class="neural-nodes"></div>
            <div class="synaptic-lines"></div>
            <div class="data-stream"></div>
            <div class="binary-overlay"></div>
            <div class="neural-pulse"></div>
            <div class="circuit-overlay"></div>
            <div class="glow-overlay"></div>
        `;
        
        document.body.insertBefore(background, document.body.firstChild);
        
        this.nodesContainer = background.querySelector('.neural-nodes');
        this.linesContainer = background.querySelector('.synaptic-lines');
        this.binaryContainer = background.querySelector('.binary-overlay');
    }

    initNodes() {
        this.nodes = [];
        const nodeCount = Math.floor((window.innerWidth * window.innerHeight) / 20000);
        
        for (let i = 0; i < nodeCount; i++) {
            const node = {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                connections: []
            };
            
            const element = document.createElement('div');
            element.className = 'neural-node';
            element.style.left = `${node.x}px`;
            element.style.top = `${node.y}px`;
            
            this.nodesContainer.appendChild(element);
            node.element = element;
            this.nodes.push(node);
        }
    }

    updateNodes() {
        this.nodes.forEach(node => {
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges
            if (node.x < 0 || node.x > window.innerWidth) node.vx *= -1;
            if (node.y < 0 || node.y > window.innerHeight) node.vy *= -1;
            
            // Update DOM element
            node.element.style.left = `${node.x}px`;
            node.element.style.top = `${node.y}px`;
        });
    }

    drawConnections() {
        // Clear previous connections
        this.linesContainer.innerHTML = '';
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        // Draw connections between nearby nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', this.nodes[i].x);
                    line.setAttribute('y1', this.nodes[i].y);
                    line.setAttribute('x2', this.nodes[j].x);
                    line.setAttribute('y2', this.nodes[j].y);
                    line.setAttribute('stroke', 'rgba(255, 215, 0, ' + (1 - distance/150) * 0.3 + ')');
                    svg.appendChild(line);
                }
            }
        }
        
        this.linesContainer.appendChild(svg);
    }

    initBinaryRain() {
        const chars = '01';
        const columns = Math.floor(window.innerWidth / 14);
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.style.left = `${i * 14}px`;
            column.style.top = `${Math.random() * -1000}px`;
            column.style.position = 'absolute';
            column.className = 'binary-column';
            
            setInterval(() => {
                column.textContent = chars[Math.floor(Math.random() * chars.length)];
                column.style.top = `${parseFloat(column.style.top) + 14}px`;
                
                if (parseFloat(column.style.top) > window.innerHeight) {
                    column.style.top = '-14px';
                }
            }, Math.random() * 1000 + 50);
            
            this.binaryContainer.appendChild(column);
        }
    }

    animate() {
        this.updateNodes();
        this.drawConnections();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIBackgroundAnimation();
});
