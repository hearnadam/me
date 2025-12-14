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
const REFERENCE_LINK_COLOR = '#d4a574'; // Accent color for reference links

const domIndex = new Map();
const nodeIndex = new Map(); // Map of reference IDs to node objects
let svg, g, linksGroup, nodesGroup;
let graphData = null;
let currentHighlightedCategory = null;
let activeSubgraph = null; // Track which category's subgraph is visible
let simulation = null; // D3 force simulation

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

// Force simulation parameters - tuned for fluid, elastic movement
const FORCE_PARAMS = {
  linkDistance: 120,        // Spring rest length
  linkStrength: 0.5,        // Spring stiffness (lower = more elastic)
  chargeStrength: -300,     // Node repulsion (less aggressive)
  chargeDistance: 300,      // Max distance for repulsion
  collideRadius: 30,        // Collision radius
  centerStrength: 0.03,     // Pull toward center (gentle)
  velocityDecay: 0.3        // Friction/damping (lower = more bouncy)
};

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
  
  // Extract reference ID (can be explicitly set or derived from data-graph-ref)
  const referenceId = itemEl.dataset.graphRef || extractReferenceId(id);
  
  // Collect full text content for reference detection
  const fullText = (label + ' ' + subtitle + ' ' + itemEl.textContent).toLowerCase();

  itemEl.dataset.graphId = id;

  return {
    id,
    label,
    subtitle,
    type: 'item',
    category: sectionKey,
    color: NODE_COLOR,
    shape: 'circle',
    size: ITEM_SIZE,
    referenceId,        // For others to reference this node
    fullText            // For detecting references to other nodes
  };
}

// Extract a clean reference ID from a node ID or label
function extractReferenceId(idOrLabel) {
  // Remove category prefix and indices, keep core identifier
  return idOrLabel
    .replace(/^(work|opensource|talks|contact)-/, '')
    .replace(/-\d+$/, '')
    .toLowerCase();
}

// Find potential references in text content
function findReferences(text, allReferenceIds) {
  const foundRefs = new Set();
  const textLower = text.toLowerCase();
  
  // Check each reference ID to see if it appears in the text
  allReferenceIds.forEach(refId => {
    // Skip very short IDs to avoid false positives
    if (refId.length < 3) return;
    
    // Check if reference ID appears as a whole word
    const regex = new RegExp(`\\b${refId}\\b`, 'i');
    if (regex.test(textLower)) {
      foundRefs.add(refId);
    }
  });
  
  return Array.from(foundRefs);
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
  nodeIndex.clear();

  // Get container dimensions for centering
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;

  // Center node - represents "me" (fixed position)
  const centerNode = {
    id: 'center',
    label: 'me',
    type: 'center',
    category: null,
    color: NODE_COLOR,
    shape: 'circle',
    size: CENTER_SIZE,
    x: centerX,
    y: centerY,
    fx: centerX,  // Fixed x position
    fy: centerY   // Fixed y position
  };
  nodes.push(centerNode);

  // Category nodes - will be positioned by force simulation
  const categories = Object.entries(sectionConfig);
  const categoryAngleStep = (Math.PI * 2) / categories.length;

  categories.forEach(([catKey, config], idx) => {
    const block = document.querySelector(`.section-block[data-section="${catKey}"]`);
    if (!block) return;

    const label = block.querySelector('.section-title')?.textContent?.trim() || catKey;
    const shape = config.shape;

    // Give initial positions in a circle as a starting point
    const angle = idx * categoryAngleStep - Math.PI / 2;
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
      y
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

    // Item nodes - will be positioned by force simulation
    items.forEach((itemEl, itemIdx) => {
      const node = collectItemData(catKey, itemEl, itemIdx);

      // Give initial positions near their parent category
      const spread = 60;
      const itemX = x + (Math.random() - 0.5) * spread;
      const itemY = y + (Math.random() - 0.5) * spread;

      node.x = itemX;
      node.y = itemY;
      node.hidden = true; // Items are hidden by default

      nodes.push(node);
      domIndex.set(node.id, itemEl);
      
      // Add to reference index for cross-linking
      if (node.referenceId) {
        nodeIndex.set(node.referenceId, node);
      }

      // Link item to category (hierarchical link)
      links.push({
        source: `cat-${catKey}`,
        target: node.id,
        type: 'branch',
        color: NODE_COLOR
      });
    });
  });

  // ============================================
  // Create Reference Links (cross-category connections)
  // ============================================
  
  const allReferenceIds = Array.from(nodeIndex.keys());
  let referenceLinksCount = 0;
  
  nodes.forEach(node => {
    if (node.type !== 'item' || !node.fullText) return;
    
    // Find references in this node's text
    const references = findReferences(node.fullText, allReferenceIds);
    
    references.forEach(refId => {
      const targetNode = nodeIndex.get(refId);
      
      // Don't create self-references or links to nodes in same category
      if (targetNode && targetNode.id !== node.id && targetNode.category !== node.category) {
        links.push({
          source: node.id,
          target: targetNode.id,
          type: 'reference',
          color: REFERENCE_LINK_COLOR
        });
        referenceLinksCount++;
        console.log(`📚 Reference link: "${node.label}" → "${targetNode.label}" (via "${refId}")`);
      }
    });
  });

  console.log(`✨ Knowledge graph built: ${nodes.length} nodes, ${links.length} links (${referenceLinksCount} cross-references)`);

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
    
    // Update center force
    if (simulation) {
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2)
        .strength(FORCE_PARAMS.centerStrength));
      
      // Update center node position
      const centerNode = graphData.nodes.find(n => n.id === 'center');
      if (centerNode) {
        centerNode.fx = newWidth / 2;
        centerNode.fy = newHeight / 2;
      }
      
      simulation.alpha(0.3).restart();
    }
  });
}

function renderGraph() {
  if (!graphData) return;

  // Stop existing simulation if any
  if (simulation) {
    simulation.stop();
  }

  // Clear existing elements
  linksGroup.selectAll('*').remove();
  nodesGroup.selectAll('*').remove();

  // Get center position for fallback
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;

  // Create force simulation
  simulation = d3.forceSimulation(graphData.nodes)
    .force('link', d3.forceLink(graphData.links)
      .id(d => d.id)
      .distance(d => {
        // Different distances for different link types
        if (d.type === 'spine') return FORCE_PARAMS.linkDistance * 0.8;
        if (d.type === 'branch') return FORCE_PARAMS.linkDistance * 0.6;
        if (d.type === 'reference') return FORCE_PARAMS.linkDistance * 1.2; // Longer reference links
        return FORCE_PARAMS.linkDistance;
      })
      .strength(d => {
        // Stronger springs for spine connections
        if (d.type === 'spine') return FORCE_PARAMS.linkStrength;
        if (d.type === 'branch') return FORCE_PARAMS.linkStrength * 0.5;
        if (d.type === 'reference') return FORCE_PARAMS.linkStrength * 0.3; // Weaker reference springs
        return FORCE_PARAMS.linkStrength;
      })
    )
    .force('charge', d3.forceManyBody()
      .strength(FORCE_PARAMS.chargeStrength)
      .distanceMax(FORCE_PARAMS.chargeDistance)
    )
    .force('center', d3.forceCenter(centerX, centerY)
      .strength(FORCE_PARAMS.centerStrength)
    )
    .force('collision', d3.forceCollide()
      .radius(d => {
        if (d.type === 'center') return FORCE_PARAMS.collideRadius * 0.5;
        if (d.type === 'category') return FORCE_PARAMS.collideRadius;
        return FORCE_PARAMS.collideRadius * 0.5;
      })
      .strength(0.7)
    )
    .velocityDecay(FORCE_PARAMS.velocityDecay)
    .on('tick', ticked);

  // Render links with straight lines (fluidity comes from physics)
  linksGroup
    .selectAll('line')
    .data(graphData.links)
    .enter()
    .append('line')
    .attr('class', d => `link link-${d.type}`)
    .attr('data-target', d => d.target)
    .attr('x1', d => {
      const source = graphData.nodes.find(n => n.id === d.source);
      return source ? source.x : centerX;
    })
    .attr('y1', d => {
      const source = graphData.nodes.find(n => n.id === d.source);
      return source ? source.y : centerY;
    })
    .attr('x2', d => {
      const target = graphData.nodes.find(n => n.id === d.target);
      return target ? target.x : centerX;
    })
    .attr('y2', d => {
      const target = graphData.nodes.find(n => n.id === d.target);
      return target ? target.y : centerY;
    })
    .attr('stroke', d => d.color)
    .attr('stroke-width', d => {
      if (d.type === 'spine') return 1.5;
      if (d.type === 'reference') return 1.2;
      return 1;
    })
    .attr('stroke-opacity', d => {
      if (d.type === 'branch') return 0; // Hidden until subgraph opens
      if (d.type === 'reference') return 0; // Hidden until both nodes visible
      return 0.3;
    });

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

  // Add drag behavior that works with force simulation
  const drag = d3.drag()
    .on('start', function(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d3.select(this).style('cursor', 'grabbing');
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', function(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', function(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d3.select(this).style('cursor', 'grab');
      // Release the node so it can move freely again
      if (d.type !== 'center') {
        d.fx = null;
        d.fy = null;
      }
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
      
      // Highlight connected links (but not reference links - only hierarchical)
      linksGroup.selectAll('.link')
        .filter(link => {
          // Only highlight spine and branch links, not references
          if (link.type === 'reference') return false;
          
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return sourceId === d.id || targetId === d.id;
        })
        .transition()
        .duration(150)
        .attr('stroke-opacity', 0.7)
        .attr('stroke-width', 2.5);
      
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
      
      // Reset link opacity (working with force simulation link objects)
      linksGroup.selectAll('.link')
        .transition()
        .duration(150)
        .attr('stroke-opacity', link => {
          if (link.type === 'branch') {
            const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
            return targetNode && !targetNode.hidden ? 0.3 : 0;
          }
          if (link.type === 'reference') {
            const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
            const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
            const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
            return bothVisible ? 0.5 : 0;
          }
          return 0.3;
        })
        .attr('stroke-width', link => {
          if (link.type === 'spine') return 1.5;
          if (link.type === 'reference') return 1.2;
          return 1;
        });
      
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
        
        // Recenter to show the expanded category
        setTimeout(() => {
          if (activeSubgraph) {
            zoomToVisibleNodes();
          } else {
            zoomToFit();
          }
        }, 350);
      } else if (d.type === 'item') {
        // Find all categories that contain nodes referenced by or referencing this node
        const relatedCategories = getRelatedCategories(d);
        
        // Expand this node's category
        toggleSection(d.category, true);
        
        // Expand all related categories to show cross-references
        relatedCategories.forEach(catKey => {
          toggleSection(catKey, true);
        });
        
        // Show all related subgraphs
        showMultipleSubgraphs([d.category, ...relatedCategories]);
        
        // Recenter graph to show all visible nodes (wait for nodes to appear)
        setTimeout(() => {
          zoomToVisibleNodes();
        }, 350);
        
        // Scroll to the clicked item
        const el = domIndex.get(d.id);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      } else if (d.type === 'center') {
        // Clicking center shuffles the graph to random positions
        reshuffleGraph();
        
        // Collapse any open subgraph
        if (activeSubgraph) {
          toggleSubgraph(null);
        }
      }
    });

  // Handle background clicks
  svg.on('click', function(event) {
    if (event.target.tagName === 'svg') {
      // Close all subgraphs
      if (activeSubgraph) {
        activeSubgraph = null;
        
        // Hide all item nodes
        graphData.nodes.forEach(node => {
          if (node.type === 'item') {
            node.hidden = true;
          }
        });
        
        // Update visibility
        nodesGroup.selectAll('.node-item')
          .transition()
          .duration(300)
          .style('opacity', 0)
          .style('pointer-events', 'none');
        
        // Hide all branch and reference links
        linksGroup.selectAll('.link-branch, .link-reference')
          .transition()
          .duration(300)
          .attr('stroke-opacity', 0);
        
        simulation.alpha(0.2).restart();
        zoomToFit();
      }
      
      // Close all sections
      if (activeCategory) {
        sectionBlocks.forEach(b => {
          b.classList.remove('active');
          b.querySelector('.section-header').setAttribute('aria-expanded', 'false');
        });
        activeCategory = null;
      }
    }
  });
}

// Get all categories that contain nodes referenced by or referencing the given node
function getRelatedCategories(node) {
  if (!graphData) return [];
  
  const relatedCats = new Set();
  
  graphData.links.forEach(link => {
    if (link.type !== 'reference') return;
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === sourceId);
    const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === targetId);
    
    // If this node is the source, add target's category
    if (sourceId === node.id && targetNode && targetNode.category) {
      relatedCats.add(targetNode.category);
    }
    // If this node is the target, add source's category
    if (targetId === node.id && sourceNode && sourceNode.category) {
      relatedCats.add(sourceNode.category);
    }
  });
  
  return Array.from(relatedCats);
}

// Show multiple subgraphs at once (for cross-references)
function showMultipleSubgraphs(categoryKeys) {
  if (!graphData || !simulation) return;
  
  // Make sure we have an array
  const categories = Array.isArray(categoryKeys) ? categoryKeys : [categoryKeys];
  activeSubgraph = categories.length > 0 ? categories : null;
  
  // Show/hide nodes based on whether their category is in the list
  graphData.nodes.forEach(node => {
    if (node.type === 'item') {
      node.hidden = !categories.includes(node.category);
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
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      return targetNode && !targetNode.hidden ? 0.3 : 0;
    });
  
  // Update visibility of reference links (show when both nodes are visible)
  linksGroup.selectAll('.link-reference')
    .transition()
    .duration(300)
    .attr('stroke-opacity', d => {
      const sourceNode = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
      return bothVisible ? 0.5 : 0;
    });
  
  // Restart simulation to settle the layout
  simulation.alpha(0.3).restart();
  
  // Don't auto-zoom when showing multiple subgraphs - let user see the connections
}

function toggleSubgraph(categoryKey) {
  if (!graphData || !simulation) return;
  
  // If clicking the same category, close it and zoom out
  if (activeSubgraph === categoryKey) {
    categoryKey = null;
  }
  
  // Use the new multi-subgraph function
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
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      return targetNode && !targetNode.hidden ? 0.3 : 0;
    });
  
  // Update visibility of reference links (show when both nodes are visible)
  linksGroup.selectAll('.link-reference')
    .transition()
    .duration(300)
    .attr('stroke-opacity', d => {
      const sourceNode = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
      return bothVisible ? 0.5 : 0;
    });
  
  // Restart simulation to settle the layout
  simulation.alpha(0.3).restart();
  
  // Zoom into the subgraph or zoom out
  if (categoryKey) {
    zoomToCategory(categoryKey);
  } else {
    zoomToFit();
  }
}

// Legacy function - now just uses zoomToVisibleNodes
function zoomToCategory(categoryKey) {
  zoomToVisibleNodes();
}

function zoomToVisibleNodes() {
  if (!graphData) return;
  
  const container = document.getElementById('graph-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // Find all visible nodes (center, categories, and non-hidden items)
  const visibleNodes = graphData.nodes.filter(n => 
    n.type === 'center' || n.type === 'category' || (n.type === 'item' && !n.hidden)
  );
  
  if (visibleNodes.length === 0) return;
  
  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  visibleNodes.forEach(node => {
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
  
  // Calculate scale
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(containerWidth / width, containerHeight / height, 1.5); // Max zoom 1.5x
  
  // Calculate translation to center the bounding box
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

// Called on each tick of the force simulation
function ticked() {
  // Update node positions
  nodesGroup.selectAll('.node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  // Update link positions - straight lines that flow with the physics
  linksGroup.selectAll('.link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);
}

function updateNodePositions() {
  // This function is now handled by the simulation's tick
  // Keep it for manual updates if needed
  ticked();
}

function reshuffleGraph() {
  if (!graphData || !simulation) return;
  
  const container = document.getElementById('graph-container');
  const centerX = container ? container.offsetWidth / 2 : 300;
  const centerY = container ? container.offsetHeight / 2 : 300;
  
  // Visual feedback - pulse the center node
  const centerNode = nodesGroup.select('.node[data-id="center"]');
  centerNode.select('g')
    .transition()
    .duration(200)
    .attr('transform', 'scale(1.8)')
    .transition()
    .duration(300)
    .attr('transform', 'scale(1)');
  
  // Define radius ranges for different node types
  const categoryRadius = 180;
  const itemRadius = 280;
  
  // Randomize positions for all nodes (except center)
  graphData.nodes.forEach(node => {
    if (node.type === 'center') {
      // Keep center fixed at actual center
      node.fx = centerX;
      node.fy = centerY;
      node.x = centerX;
      node.y = centerY;
    } else if (node.type === 'category') {
      // Random position in a circle around center
      const angle = Math.random() * Math.PI * 2;
      const radius = categoryRadius * (0.7 + Math.random() * 0.6); // Random radius between 70% and 130%
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      // Release any fixed positions
      node.fx = null;
      node.fy = null;
    } else if (node.type === 'item') {
      // Random position in outer circle
      const angle = Math.random() * Math.PI * 2;
      const radius = itemRadius * (0.6 + Math.random() * 0.8);
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      // Release any fixed positions
      node.fx = null;
      node.fy = null;
    }
  });
  
  // Restart simulation with high energy to settle into new positions
  simulation.alpha(1).restart();
  
  // Zoom back to fit the whole graph
  setTimeout(() => {
    zoomToFit();
  }, 100);
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
  if (!node || node.hidden) return;

  if (node.type === 'center') {
    tooltip.innerHTML = `
      <div style="color: #e8e6e3; margin-bottom: 2px;">${node.label}</div>
      <div style="color: #5c5856; font-size: 9px;">click to shuffle</div>
    `;
  } else if (node.type === 'item') {
    // Check if this node has cross-references
    const relatedCats = getRelatedCategories(node);
    const hasRefs = relatedCats.length > 0;
    
    tooltip.innerHTML = `
      <div style="color: #e8e6e3; margin-bottom: 2px;">${node.label}</div>
      ${node.subtitle ? `<div style="color: #5c5856; font-size: 9px;">${node.subtitle}</div>` : ''}
      ${hasRefs ? `<div style="color: #d4a574; font-size: 9px; margin-top: 2px;">🔗 ${relatedCats.length} cross-reference${relatedCats.length > 1 ? 's' : ''}</div>` : ''}
    `;
  } else {
    tooltip.innerHTML = `
      <div style="color: #e8e6e3; margin-bottom: 2px;">${node.label}</div>
      ${node.subtitle ? `<div style="color: #5c5856; font-size: 9px;">${node.subtitle}</div>` : ''}
    `;
  }

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

