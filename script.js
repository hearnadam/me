/**
 * Custom SVG Knowledge Graph
 * Fluid hierarchical layout with interactive subgraph exploration
 */

// ============================================
// Graph Configuration
// ============================================

const sectionConfig = {
  work: { shape: 'square', itemSelector: '.work-item' },
  opensource: { shape: 'triangle', itemSelector: '.project-card' },
  talks: { shape: 'circle', itemSelector: '.talk-item' },
  contact: { shape: 'diamond', itemSelector: '.contact-item' }
};

// Neutral color for all nodes
const NODE_COLOR = '#5c5856';
const NODE_COLOR_HOVER = '#9a9590';

const domIndex = new Map();
let svg, g, linksGroup, nodesGroup;
let graphData = null;
let currentHighlightedCategory = null;
let activeSubgraph = null; // Track which category's subgraph is visible

// Graph offset for panning and zooming
let graphOffset = { x: 0, y: 0 };
let currentScale = 1;
let currentTransform = { x: 0, y: 0, k: 1 };

// Layout constants
const CATEGORY_RADIUS = 140;
const ITEM_RADIUS = 90;
const CENTER_SIZE = 8;
const CATEGORY_SIZE = 14;
const ITEM_SIZE = 6;

// ============================================
// Utility Functions
// ============================================

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'node';
}

function collectItemData(sectionKey, itemEl, fallbackIdx) {
  const explicitId = itemEl.dataset.graphId;
  const label = itemEl.dataset.graphLabel || itemEl.querySelector('h3, .work-company, .project-name, .talk-title, .contact-label, .contact-value')?.textContent?.trim() || itemEl.textContent.trim();
  const subtitle = itemEl.dataset.graphSubtitle || itemEl.querySelector('.work-role, .project-desc, .talk-venue, .contact-value')?.textContent?.trim() || '';
  const id = explicitId || `${sectionKey}-${slugify(label)}-${fallbackIdx}`;

  itemEl.dataset.graphId = id;

  return {
    id,
    label,
    subtitle,
    type: 'item',
    category: sectionKey,
    color: NODE_COLOR,
    shape: 'circle',
    size: ITEM_SIZE
  };
}

function highlightDomItem(node) {
  domIndex.forEach(el => el.classList.remove('is-graph-highlight'));
  if (!node || node.type !== 'item') return;

  const el = domIndex.get(node.id);
  if (el) {
    el.classList.add('is-graph-highlight');
  }
}

// ============================================
// Shape Rendering Functions
// ============================================

function createShape(shape, size, color) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  switch (shape) {
    case 'square':
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', -size);
      rect.setAttribute('y', -size);
      rect.setAttribute('width', size * 2);
      rect.setAttribute('height', size * 2);
      rect.setAttribute('fill', color);
      rect.setAttribute('rx', '1');
      group.appendChild(rect);
      break;

    case 'triangle':
      const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const h = size * 1.3;
      const points = `0,${-h} ${h * 0.866},${h * 0.5} ${-h * 0.866},${h * 0.5}`;
      triangle.setAttribute('points', points);
      triangle.setAttribute('fill', color);
      group.appendChild(triangle);
      break;

    case 'circle':
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', size);
      circle.setAttribute('fill', color);
      group.appendChild(circle);
      break;

    case 'diamond':
      const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const s = size * 1.2;
      const diamondPoints = `0,${-s} ${s},0 0,${s} ${-s},0`;
      diamond.setAttribute('points', diamondPoints);
      diamond.setAttribute('fill', color);
      group.appendChild(diamond);
      break;

    default:
      const defaultCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      defaultCircle.setAttribute('r', size);
      defaultCircle.setAttribute('fill', color);
      group.appendChild(defaultCircle);
  }

  return group;
}

// ============================================
// Build Graph Data with Structured Layout
// ============================================

function buildGraphData() {
  const nodes = [];
  const links = [];
  domIndex.clear();

  // Get container dimensions for centering
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;

  // Center node - represents "me"
  nodes.push({
    id: 'center',
    label: 'me',
    type: 'center',
    category: null,
    color: NODE_COLOR,
    shape: 'circle',
    size: CENTER_SIZE,
    x: centerX,
    y: centerY
  });

  // Category nodes positioned in a circle around center
  const categories = Object.entries(sectionConfig);
  const categoryAngleStep = (Math.PI * 2) / categories.length;

  categories.forEach(([catKey, config], idx) => {
    const block = document.querySelector(`.section-block[data-section="${catKey}"]`);
    if (!block) return;

    const label = block.querySelector('.section-title')?.textContent?.trim() || catKey;
    const shape = config.shape;

    const angle = idx * categoryAngleStep - Math.PI / 2; // Start from top
    const x = centerX + Math.cos(angle) * CATEGORY_RADIUS;
    const y = centerY + Math.sin(angle) * CATEGORY_RADIUS;

    // Category node
    nodes.push({
      id: `cat-${catKey}`,
      label,
      type: 'category',
      category: catKey,
      color: NODE_COLOR,
      shape,
      size: CATEGORY_SIZE,
      x,
      y,
      angle
    });

    // Link category to center
    links.push({
      source: 'center',
      target: `cat-${catKey}`,
      type: 'spine',
      color: NODE_COLOR
    });

    const items = block.querySelectorAll(config.itemSelector);
    const itemCount = items.length;
    const itemAngleSpread = Math.PI * 0.6; // Spread items in an arc
    const itemAngleStart = angle - itemAngleSpread / 2;
    const itemAngleStep = itemCount > 1 ? itemAngleSpread / (itemCount - 1) : 0;

    // Item nodes - simple circles/dots (hidden by default)
    items.forEach((itemEl, itemIdx) => {
      const node = collectItemData(catKey, itemEl, itemIdx);

      const itemAngle = itemCount > 1 ? itemAngleStart + itemIdx * itemAngleStep : angle;
      const itemX = x + Math.cos(itemAngle) * ITEM_RADIUS;
      const itemY = y + Math.sin(itemAngle) * ITEM_RADIUS;

      node.x = itemX;
      node.y = itemY;
      node.angle = itemAngle;
      node.parentX = x;
      node.parentY = y;
      node.relativeAngle = itemAngle - angle;
      node.distance = ITEM_RADIUS;
      node.hidden = true; // Items are hidden by default

      nodes.push(node);
      domIndex.set(node.id, itemEl);

      // Link item to category
      links.push({
        source: `cat-${catKey}`,
        target: node.id,
        type: 'branch',
        color: NODE_COLOR
      });
    });
  });

  return { nodes, links };
}

// ============================================
// Accordion Section Management
// ============================================

const sectionBlocks = document.querySelectorAll('.section-block');
let activeCategory = null;

function toggleSection(sectionId, forceOpen = null) {
  const block = document.querySelector(`.section-block[data-section="${sectionId}"]`);
  if (!block) return false;

  const header = block.querySelector('.section-header');
  const isCurrentlyOpen = block.classList.contains('active');
  const shouldOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

  sectionBlocks.forEach(b => {
    b.classList.remove('active');
    b.querySelector('.section-header').setAttribute('aria-expanded', 'false');
  });

  if (shouldOpen) {
    block.classList.add('active');
    header.setAttribute('aria-expanded', 'true');
    activeCategory = sectionId;

    setTimeout(() => {
      block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  } else {
    activeCategory = null;
  }

  if (svg) {
    highlightCategory(shouldOpen ? sectionId : null);
  }

  return shouldOpen;
}

sectionBlocks.forEach(block => {
  const header = block.querySelector('.section-header');
  const sectionId = block.dataset.section;
  header.addEventListener('click', () => toggleSection(sectionId));
});

// ============================================
// SVG Graph Setup
// ============================================

function initGraph() {
  const container = document.getElementById('graph-container');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Create SVG
  svg = d3.select(container)
    .append('svg')
    .attr('width', container.offsetWidth)
    .attr('height', container.offsetHeight)
    .style('background-color', '#0a0c10');

  // Create main group for transformation (panning and zooming)
  g = svg.append('g').attr('class', 'graph-root');
  
  // Create groups for layering inside the main group
  linksGroup = g.append('g').attr('class', 'links');
  nodesGroup = g.append('g').attr('class', 'nodes');
  
  // Add zoom and pan behavior to the SVG
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.5, 3])
    .on('zoom', (event) => {
      // Don't zoom if a node is being dragged
      if (event.sourceEvent && event.sourceEvent.type === 'drag') return;
      
      g.attr('transform', event.transform);
      currentTransform = event.transform;
    });
  
  svg.call(zoomBehavior);
  
  // Store zoom behavior for programmatic zoom
  svg.zoomBehavior = zoomBehavior;

  // Build and render graph
  graphData = buildGraphData();
  renderGraph();

  // Handle resize
  window.addEventListener('resize', () => {
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;
    svg.attr('width', newWidth).attr('height', newHeight);
    
    // Recenter the graph
    const centerNode = graphData.nodes.find(n => n.id === 'center');
    if (centerNode) {
      const dx = newWidth / 2 - centerNode.x;
      const dy = newHeight / 2 - centerNode.y;
      graphData.nodes.forEach(node => {
        node.x += dx;
        node.y += dy;
      });
      updateNodePositions();
    }
  });
}

function renderGraph() {
  if (!graphData) return;

  // Clear existing elements
  linksGroup.selectAll('*').remove();
  nodesGroup.selectAll('*').remove();

  // Get center position for fallback
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;

  // Render links with curved paths
  linksGroup
    .selectAll('path')
    .data(graphData.links)
    .enter()
    .append('path')
    .attr('class', d => `link link-${d.type}`)
    .attr('data-target', d => d.target)
    .attr('d', d => {
      const source = graphData.nodes.find(n => n.id === d.source);
      const target = graphData.nodes.find(n => n.id === d.target);
      
      const sx = source ? source.x : centerX;
      const sy = source ? source.y : centerY;
      const tx = target ? target.x : centerX;
      const ty = target ? target.y : centerY;
      
      // Create flowing curved paths
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (d.type === 'spine') {
        // Gentle curve for spine connections (center to categories)
        const curvature = 0.15;
        const offsetX = -dy * curvature;
        const offsetY = dx * curvature;
        const cx = (sx + tx) / 2 + offsetX;
        const cy = (sy + ty) / 2 + offsetY;
        return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
      } else {
        // More pronounced curve for branch connections (category to items)
        const curvature = 0.25;
        const offsetX = -dy * curvature;
        const offsetY = dx * curvature;
        const cx = (sx + tx) / 2 + offsetX;
        const cy = (sy + ty) / 2 + offsetY;
        return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
      }
    })
    .attr('stroke', d => d.color)
    .attr('stroke-width', d => d.type === 'spine' ? 1.5 : 1)
    .attr('fill', 'none')
    .attr('stroke-opacity', d => d.type === 'branch' ? 0 : 0.3);

  // Render nodes
  const nodeElements = nodesGroup
    .selectAll('.node')
    .data(graphData.nodes)
    .enter()
    .append('g')
    .attr('class', d => `node node-${d.type}${d.hidden ? ' node-hidden' : ''}`)
    .attr('data-id', d => d.id)
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .style('cursor', 'grab')
    .style('opacity', d => d.hidden ? 0 : 1);

  // Add shapes to nodes
  nodeElements.each(function(d) {
    const nodeGroup = d3.select(this);
    const shapeGroup = createShape(d.shape, d.size, d.color);
    nodeGroup.node().appendChild(shapeGroup);
  });

  // No labels - removed per requirements

  // Add drag behavior - drag individual nodes with dynamic updates
  const drag = d3.drag()
    .on('start', function(event, d) {
      d3.select(this).style('cursor', 'grabbing');
      d.dragStartX = d.x;
      d.dragStartY = d.y;
    })
    .on('drag', function(event, d) {
      // Update the position of the dragged node
      d.x = event.x;
      d.y = event.y;

      // If dragging a category node, update positions of its child items
      if (d.type === 'category') {
        const catKey = d.id.replace('cat-', '');
        graphData.nodes.forEach(node => {
          if (node.type === 'item' && node.category === catKey) {
            // Maintain relative position from parent
            const angle = node.relativeAngle + d.angle;
            node.x = d.x + Math.cos(angle) * node.distance;
            node.y = d.y + Math.sin(angle) * node.distance;
            node.parentX = d.x;
            node.parentY = d.y;
          }
        });
      }

      // Update positions
      updateNodePositions();
    })
    .on('end', function(event, d) {
      d3.select(this).style('cursor', 'grab');
    });

  nodeElements.call(drag);

  // Add interactions
  nodeElements
    .on('mouseover', function(event, d) {
      if (d.hidden) return;
      
      // Scale up node on hover
      d3.select(this).select('g')
        .transition()
        .duration(150)
        .attr('transform', 'scale(1.3)');
      
      // Highlight connected links
      if (d.type === 'category') {
        linksGroup.selectAll('.link')
          .filter(link => link.source === d.id || link.target === d.id)
          .transition()
          .duration(150)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', 2);
      }
      
      // Highlight DOM item if it's an item node
      if (d.type === 'item') {
        highlightDomItem(d);
      }

      // Show tooltip
      showTooltip(event, d);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).select('g')
        .transition()
        .duration(150)
        .attr('transform', 'scale(1)');
      
      // Reset link opacity
      linksGroup.selectAll('.link')
        .transition()
        .duration(150)
        .attr('stroke-opacity', link => link.type === 'branch' ? (graphData.nodes.find(n => n.id === link.target).hidden ? 0 : 0.3) : 0.3)
        .attr('stroke-width', link => link.type === 'spine' ? 1.5 : 1);
      
      highlightDomItem(null);
      hideTooltip();
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      
      if (d.type === 'category') {
        // Toggle subgraph visibility
        const catKey = d.id.replace('cat-', '');
        toggleSubgraph(catKey);
        toggleSection(catKey, true);
      } else if (d.type === 'item') {
        // Navigate to the item in the accordion
        const category = d.category;
        if (category) {
          toggleSection(category, true);
          const el = domIndex.get(d.id);
          if (el) {
            setTimeout(() => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }
      } else if (d.type === 'center') {
        // Clicking center collapses any open subgraph
        if (activeSubgraph) {
          toggleSubgraph(null);
        }
      }
    });

  // Handle background clicks
  svg.on('click', function(event) {
    if (event.target.tagName === 'svg') {
      if (activeSubgraph) {
        toggleSubgraph(null);
      }
      if (activeCategory) {
        toggleSection(activeCategory, false);
      }
    }
  });
}

function toggleSubgraph(categoryKey) {
  if (!graphData) return;
  
  // If clicking the same category, close it and zoom out
  if (activeSubgraph === categoryKey) {
    categoryKey = null;
  }
  
  activeSubgraph = categoryKey;
  
  // Animate item nodes and their links
  graphData.nodes.forEach(node => {
    if (node.type === 'item') {
      node.hidden = categoryKey ? node.category !== categoryKey : true;
    }
  });
  
  // Update visibility of item nodes
  nodesGroup.selectAll('.node-item')
    .transition()
    .duration(300)
    .style('opacity', d => d.hidden ? 0 : 1)
    .style('pointer-events', d => d.hidden ? 'none' : 'auto');
  
  // Update visibility of branch links
  linksGroup.selectAll('.link-branch')
    .transition()
    .duration(300)
    .attr('stroke-opacity', d => {
      const targetNode = graphData.nodes.find(n => n.id === d.target);
      return targetNode && !targetNode.hidden ? 0.3 : 0;
    });
  
  // Zoom into the subgraph or zoom out
  if (categoryKey) {
    zoomToCategory(categoryKey);
  } else {
    zoomToFit();
  }
}

function zoomToCategory(categoryKey) {
  const container = document.getElementById('graph-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // Find the category node
  const catNode = graphData.nodes.find(n => n.id === `cat-${categoryKey}`);
  if (!catNode) return;
  
  // Find all related nodes (category + its items)
  const relatedNodes = graphData.nodes.filter(n => 
    n.id === `cat-${categoryKey}` || 
    (n.type === 'item' && n.category === categoryKey)
  );
  
  // Calculate bounding box of the subgraph
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  relatedNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  });
  
  // Add padding
  const padding = 100;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;
  
  // Calculate scale to fit the subgraph
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(containerWidth / width, containerHeight / height, 2.5);
  
  // Calculate translation to center the subgraph
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const translateX = containerWidth / 2 - centerX * scale;
  const translateY = containerHeight / 2 - centerY * scale;
  
  // Create transform object and apply via D3 zoom
  const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
  
  svg.transition()
    .duration(600)
    .call(svg.zoomBehavior.transform, transform);
}

function zoomToFit() {
  const container = document.getElementById('graph-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // Find center and category nodes
  const mainNodes = graphData.nodes.filter(n => 
    n.type === 'center' || n.type === 'category'
  );
  
  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  mainNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  });
  
  // Add padding
  const padding = 80;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;
  
  // Calculate scale
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(containerWidth / width, containerHeight / height, 1);
  
  // Calculate translation
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const translateX = containerWidth / 2 - centerX * scale;
  const translateY = containerHeight / 2 - centerY * scale;
  
  // Create transform object and apply via D3 zoom
  const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
  
  svg.transition()
    .duration(600)
    .call(svg.zoomBehavior.transform, transform);
}

function updateNodePositions() {
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;

  // Update node positions
  nodesGroup.selectAll('.node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  // Update link positions with curved paths
  linksGroup.selectAll('.link')
    .attr('d', function(d) {
      const source = graphData.nodes.find(n => n.id === d.source);
      const target = graphData.nodes.find(n => n.id === d.target);
      
      const sx = source ? source.x : centerX;
      const sy = source ? source.y : centerY;
      const tx = target ? target.x : centerX;
      const ty = target ? target.y : centerY;
      
      // Create flowing curved paths
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (d.type === 'spine') {
        // Gentle curve for spine connections
        const curvature = 0.15;
        const offsetX = -dy * curvature;
        const offsetY = dx * curvature;
        const cx = (sx + tx) / 2 + offsetX;
        const cy = (sy + ty) / 2 + offsetY;
        return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
      } else {
        // More pronounced curve for branch connections
        const curvature = 0.25;
        const offsetX = -dy * curvature;
        const offsetY = dx * curvature;
        const cx = (sx + tx) / 2 + offsetX;
        const cy = (sy + ty) / 2 + offsetY;
        return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
      }
    });
}

function highlightCategory(categoryKey) {
  // Simplified - we don't use category highlighting anymore
  currentHighlightedCategory = categoryKey;
}

function clearHighlights() {
  currentHighlightedCategory = null;
}

// ============================================
// Tooltip
// ============================================

const tooltip = document.createElement('div');
tooltip.className = 'graph-tooltip';
tooltip.style.cssText = `
  position: fixed;
  padding: 6px 10px;
  background: rgba(10, 12, 16, 0.9);
  border: 1px solid rgba(92, 88, 86, 0.4);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #9a9590;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 1000;
  max-width: 180px;
  border-radius: 3px;
  backdrop-filter: blur(8px);
`;
document.body.appendChild(tooltip);

function showTooltip(event, node) {
  if (!node || node.type === 'center' || node.hidden) return;

  tooltip.innerHTML = `
    <div style="color: #e8e6e3; margin-bottom: 2px;">${node.label}</div>
    ${node.subtitle ? `<div style="color: #5c5856; font-size: 9px;">${node.subtitle}</div>` : ''}
  `;

  tooltip.style.left = event.pageX + 12 + 'px';
  tooltip.style.top = event.pageY + 12 + 'px';
  tooltip.style.opacity = '1';
}

function hideTooltip() {
  tooltip.style.opacity = '0';
}

// ============================================
// CSS for Graph Elements
// ============================================

const graphStyles = `
  .node {
    transition: opacity 300ms ease;
  }

  .node-hidden {
    pointer-events: none;
  }

  .link {
    transition: stroke-opacity 300ms ease;
  }

  .node g {
    transition: transform 150ms ease;
  }

  .node:active g {
    transform: scale(0.9);
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = graphStyles;
document.head.appendChild(styleSheet);

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', initGraph);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeCategory) {
    toggleSection(activeCategory, false);
  }
});

