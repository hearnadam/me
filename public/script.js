/**
 * Custom SVG Knowledge Graph
 * Fluid hierarchical layout with interactive subgraph exploration
 */

// ============================================
// Sound & Haptic Feedback System
// ============================================

class AudioFeedback {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.muted = false; // New muted state
    this.gainNode = null;
    this.masterVolume = 0.15; // Subtle volume
    this.dragOscillator = null;
    this.dragGainNode = null;
    this.init();
  }

  init() {
    try {
      // Lazy initialization - only create when first used
      this.context = null;
      
      // Load muted state from localStorage
      const savedMuteState = localStorage.getItem('soundMuted');
      if (savedMuteState !== null) {
        this.muted = savedMuteState === 'true';
      }
    } catch (e) {
      console.log('Web Audio API not supported');
      this.enabled = false;
    }
  }

  ensureContext() {
    if (!this.enabled || this.muted) return false;
    
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
        this.gainNode.gain.value = this.masterVolume;
      } catch (e) {
        this.enabled = false;
        return false;
      }
    }
    
    // Resume context if suspended (for autoplay policies)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('soundMuted', this.muted.toString());
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Subtle hover sound - cheerful upward lilt
  playHover() {
    if (!this.ensureContext()) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    // Gentle upward sweep for cheerfulness
    oscillator.frequency.setValueAtTime(700, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(850, this.context.currentTime + 0.05);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, this.context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // Click sound - playful two-note chirp
  playClick() {
    if (!this.ensureContext()) return;
    
    // First note
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    
    osc1.connect(gain1);
    gain1.connect(this.gainNode);
    
    osc1.frequency.value = 550;
    osc1.type = 'sine';
    
    gain1.gain.setValueAtTime(0, this.context.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.04);
    
    osc1.start(this.context.currentTime);
    osc1.stop(this.context.currentTime + 0.04);
    
    // Second note (slightly higher)
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    
    osc2.connect(gain2);
    gain2.connect(this.gainNode);
    
    osc2.frequency.value = 700;
    osc2.type = 'sine';
    
    gain2.gain.setValueAtTime(0, this.context.currentTime + 0.03);
    gain2.gain.linearRampToValueAtTime(0.25, this.context.currentTime + 0.035);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
    
    osc2.start(this.context.currentTime + 0.03);
    osc2.stop(this.context.currentTime + 0.08);
  }

  // Section expand sound - ascending tone
  playExpand() {
    if (!this.ensureContext()) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, this.context.currentTime + 0.1);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, this.context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.12);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.12);
  }

  // Section collapse sound - descending tone
  playCollapse() {
    if (!this.ensureContext()) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.frequency.setValueAtTime(600, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(400, this.context.currentTime + 0.08);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // Card hover - warm cheerful tone
  playCardHover() {
    if (!this.ensureContext()) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    // Gentle upward sweep
    oscillator.frequency.setValueAtTime(500, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(620, this.context.currentTime + 0.06);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.12);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.12);
  }

  // Goodbye sound - gentle descending farewell wave
  playBye() {
    if (!this.ensureContext()) return;
    
    // Three gentle descending notes
    const notes = [600, 500, 400];
    const startTimes = [0, 0.08, 0.16];
    
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      const startTime = this.context.currentTime + startTimes[i];
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
      
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }

  // Drag sound - warm continuous tone that plays during drag
  startDrag() {
    if (!this.ensureContext()) return;
    
    // Stop existing drag sound if any
    this.stopDrag();
    
    // Create oscillators for a warm, rich tone
    this.dragOscillator = this.context.createOscillator();
    this.dragGainNode = this.context.createGain();
    
    // Add a second oscillator for warmth (perfect fifth interval)
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    
    this.dragOscillator.connect(this.dragGainNode);
    osc2.connect(gain2);
    this.dragGainNode.connect(this.gainNode);
    gain2.connect(this.gainNode);
    
    // Warm, low frequency (A2 note)
    this.dragOscillator.frequency.value = 220;
    this.dragOscillator.type = 'sine';
    
    // Second harmonic for richness (E3 - perfect fifth)
    osc2.frequency.value = 330;
    osc2.type = 'sine';
    
    // Very subtle, constant volume
    this.dragGainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.dragGainNode.gain.linearRampToValueAtTime(0.12, this.context.currentTime + 0.05);
    
    gain2.gain.setValueAtTime(0, this.context.currentTime);
    gain2.gain.linearRampToValueAtTime(0.06, this.context.currentTime + 0.05);
    
    this.dragOscillator.start(this.context.currentTime);
    osc2.start(this.context.currentTime);
    
    // Store second oscillator for cleanup
    this.dragOscillator2 = osc2;
    this.dragGainNode2 = gain2;
    this.dragBaseFreq = 220;
    this.dragBaseFreq2 = 330;
  }
  
  // Update drag sound based on velocity - creates oscillation effect
  updateDrag(velocity) {
    if (!this.dragOscillator || !this.ensureContext()) return;
    
    // Modulate frequency based on movement speed (creates warm oscillation)
    // Map velocity (0-20 typical range) to frequency modulation
    const modulationAmount = Math.min(velocity * 3, 100); // Max +100Hz
    const targetFreq = this.dragBaseFreq + modulationAmount;
    const targetFreq2 = this.dragBaseFreq2 + modulationAmount * 1.5;
    
    const now = this.context.currentTime;
    
    // Smooth frequency transition for warm oscillation
    this.dragOscillator.frequency.cancelScheduledValues(now);
    this.dragOscillator.frequency.setValueAtTime(this.dragOscillator.frequency.value, now);
    this.dragOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.08);
    
    if (this.dragOscillator2) {
      this.dragOscillator2.frequency.cancelScheduledValues(now);
      this.dragOscillator2.frequency.setValueAtTime(this.dragOscillator2.frequency.value, now);
      this.dragOscillator2.frequency.linearRampToValueAtTime(targetFreq2, now + 0.08);
    }
  }
  
  stopDrag() {
    if (!this.dragOscillator) return;
    
    try {
      // Fade out smoothly
      const now = this.context.currentTime;
      this.dragGainNode.gain.cancelScheduledValues(now);
      this.dragGainNode.gain.setValueAtTime(this.dragGainNode.gain.value, now);
      this.dragGainNode.gain.linearRampToValueAtTime(0.01, now + 0.08);
      
      if (this.dragGainNode2) {
        this.dragGainNode2.gain.cancelScheduledValues(now);
        this.dragGainNode2.gain.setValueAtTime(this.dragGainNode2.gain.value, now);
        this.dragGainNode2.gain.linearRampToValueAtTime(0.01, now + 0.08);
      }
      
      this.dragOscillator.stop(now + 0.1);
      if (this.dragOscillator2) {
        this.dragOscillator2.stop(now + 0.1);
      }
    } catch (e) {
      // Oscillator might already be stopped
    }
    
    this.dragOscillator = null;
    this.dragGainNode = null;
    this.dragOscillator2 = null;
    this.dragGainNode2 = null;
  }
}

class HapticFeedback {
  constructor() {
    this.enabled = 'vibrate' in navigator;
  }

  light() {
    if (this.enabled) {
      navigator.vibrate(10); // 10ms light tap
    }
  }

  medium() {
    if (this.enabled) {
      navigator.vibrate(20); // 20ms medium tap
    }
  }

  strong() {
    if (this.enabled) {
      navigator.vibrate(30); // 30ms strong tap
    }
  }

  pattern(pattern) {
    if (this.enabled) {
      navigator.vibrate(pattern); // Custom pattern [vibrate, pause, vibrate...]
    }
  }
}

// Initialize feedback systems
const audioFeedback = new AudioFeedback();
const hapticFeedback = new HapticFeedback();

// ============================================
// Graph Configuration
// ============================================

const sectionConfig = {
  work: { shape: 'square', itemSelector: '.work-item', color: '#3D5FA8' },
  projects: { shape: 'triangle', itemSelector: '.project-card', color: '#347A5C' },
  media: { shape: 'circle', itemSelector: '.talk-item', color: '#B35F2E' },
  contact: { shape: 'diamond', itemSelector: '.contact-item', color: '#7D529A' }
};

// Color system that adapts to theme
const COLORS = {
  dark: {
    node: '#A3AAA7',
    nodeHover: '#E7E9E8',
    center: '#1D7A84',
    link: '#3a3f3d',       // Single neutral color for all links
    linkHover: '#5a605d',
    bg: '#0F1211'
  },
  light: {
    node: '#5E6461',
    nodeHover: '#1C1E1D',
    center: '#0F4D56',
    link: '#c5c8c6',       // Single neutral color for all links
    linkHover: '#9a9d9b',
    bg: '#F7F7F5'
  }
};

// Current theme colors
let NODE_COLOR = COLORS.dark.node;
let NODE_COLOR_HOVER = COLORS.dark.nodeHover;
let CENTER_COLOR = COLORS.dark.center;
let LINK_COLOR = COLORS.dark.link;
let LINK_COLOR_HOVER = COLORS.dark.linkHover;
let GRAPH_BG = COLORS.dark.bg;

const domIndex = new Map();
const nodeIndex = new Map(); // Map node IDs for manual cross-linking
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

// Force simulation parameters - tuned for soft, gentle movement
const FORCE_PARAMS = {
  linkDistance: 120,        // Spring rest length
  linkStrength: 0.3,        // Spring stiffness (lower = softer/more elastic)
  chargeStrength: -250,     // Node repulsion (gentler)
  chargeDistance: 300,      // Max distance for repulsion
  collideRadius: 30,        // Collision radius
  centerStrength: 0.02,     // Pull toward center (very gentle)
  velocityDecay: 0.4        // Friction/damping (higher = less bouncy, softer settling)
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
  
  // Manual cross-references: data-graph-links-to="node-id-1,node-id-2"
  const linksTo = itemEl.dataset.graphLinksTo ? itemEl.dataset.graphLinksTo.split(',').map(s => s.trim()) : [];

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
    linksTo  // Manual cross-references
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

// Generate curved path between two points
function generateCurvedPath(sx, sy, tx, ty) {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 1) return `M ${sx} ${sy} L ${tx} ${ty}`;
  
  // Perpendicular offset for curve - consistent direction based on angle
  const angle = Math.atan2(dy, dx);
  const curvature = Math.min(dist * 0.12, 25);
  
  // Control point perpendicular to midpoint
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const cx = mx + Math.cos(angle + Math.PI / 2) * curvature;
  const cy = my + Math.sin(angle + Math.PI / 2) * curvature;
  
  return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;
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

    case 'tilde':
      // Create a ~ (tilde) shape using a path - balanced S-curve
      const tilde = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      // Symmetric tilde matching the HTML icon style
      const w = size * 1.2;
      const d = `M ${-w} ${size * 0.4} C ${-w * 0.5} ${-size * 0.6} ${-w * 0.3} ${-size * 0.6} 0 0 C ${w * 0.3} ${size * 0.6} ${w * 0.5} ${size * 0.6} ${w} ${-size * 0.4}`;
      tilde.setAttribute('d', d);
      tilde.setAttribute('stroke', color);
      tilde.setAttribute('stroke-width', size * 0.6);
      tilde.setAttribute('stroke-linecap', 'round');
      tilde.setAttribute('fill', 'none');
      group.appendChild(tilde);
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
    color: CENTER_COLOR,
    shape: 'tilde',
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
      color: config.color,
      shape,
      size: CATEGORY_SIZE,
      x,
      y
    });

    // Link category to center - use neutral link color
    links.push({
      source: 'center',
      target: `cat-${catKey}`,
      type: 'spine'
    });

    const items = block.querySelectorAll(config.itemSelector);

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
      nodeIndex.set(node.id, node);  // Index by ID for manual cross-linking

      // Link item to category (hierarchical link) - use neutral link color
      links.push({
        source: `cat-${catKey}`,
        target: node.id,
        type: 'branch'
      });
    });
  });

  // ============================================
  // Create Manual Reference Links (cross-category connections)
  // Use data-graph-links-to="node-id-1,node-id-2" on HTML elements
  // ============================================
  
  let referenceLinksCount = 0;
  
  nodes.forEach(node => {
    if (node.type !== 'item' || !node.linksTo || node.linksTo.length === 0) return;
    
    node.linksTo.forEach(targetId => {
      const targetNode = nodeIndex.get(targetId);
      
      // Only create link if target exists and is different node
      if (targetNode && targetNode.id !== node.id) {
        links.push({
          source: node.id,
          target: targetNode.id,
          type: 'reference'
        });
        referenceLinksCount++;
        console.log(`🔗 Manual link: "${node.label}" → "${targetNode.label}"`);
      }
    });
  });

  console.log(`✨ Knowledge graph built: ${nodes.length} nodes, ${links.length} links (${referenceLinksCount} manual cross-references)`);

  return { nodes, links };
}

// ============================================
// Accordion Section Management
// ============================================

const sectionBlocks = document.querySelectorAll('.section-block');
let activeCategory = null;

function toggleSection(sectionId, forceOpen = null, updateHash = true) {
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

    // Update URL hash
    if (updateHash) {
      window.history.pushState(null, '', `#${sectionId}`);
    }

    setTimeout(() => {
      block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  } else {
    activeCategory = null;
    // Clear hash when closing
    if (updateHash) {
      window.history.pushState(null, '', window.location.pathname);
    }
  }

  if (svg) {
    highlightCategory(shouldOpen ? sectionId : null);
  }

  return shouldOpen;
}

sectionBlocks.forEach(block => {
  const header = block.querySelector('.section-header');
  const sectionId = block.dataset.section;
  
  // Add sound on hover
  header.addEventListener('mouseenter', () => {
    audioFeedback.playHover();
    hapticFeedback.light();
  });
  
  header.addEventListener('click', () => {
    const willOpen = !block.classList.contains('active');
    if (willOpen) {
      audioFeedback.playExpand();
      hapticFeedback.medium();
    } else {
      audioFeedback.playCollapse();
      hapticFeedback.light();
    }
    toggleSection(sectionId);
  });
});

// Handle URL hash on load
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const validSection = document.querySelector(`.section-block[data-section="${hash}"]`);
    if (validSection) {
      toggleSection(hash, true, false);
    }
  }
});

// Handle back/forward navigation
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    toggleSection(hash, true, false);
  } else {
    // Close all sections if hash is removed
    sectionBlocks.forEach(b => {
      b.classList.remove('active');
      b.querySelector('.section-header').setAttribute('aria-expanded', 'false');
    });
    activeCategory = null;
  }
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
    .style('background-color', GRAPH_BG);

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

  // Render links as curved paths
  linksGroup
    .selectAll('path')
    .data(graphData.links)
    .enter()
    .append('path')
    .attr('class', d => `link link-${d.type}`)
    .attr('d', d => {
      const source = graphData.nodes.find(n => n.id === d.source);
      const target = graphData.nodes.find(n => n.id === d.target);
      return generateCurvedPath(
        source?.x ?? centerX, source?.y ?? centerY,
        target?.x ?? centerX, target?.y ?? centerY
      );
    })
    .attr('fill', 'none')
    .attr('stroke', LINK_COLOR)
    .attr('stroke-width', d => {
      if (d.type === 'spine') return 1;
      return 0.75;
    })
    .attr('stroke-opacity', d => {
      if (d.type === 'branch') return 0; // Hidden until subgraph opens
      if (d.type === 'reference') return 0; // Hidden until both nodes visible
      return 0.4;
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

  // Drag behavior with clickDistance to distinguish from clicks
  let dragStartPos = null;
  let wasDragged = false;
  let lastDragPos = null;
  let lastDragTime = null;
  
  const drag = d3.drag()
    .clickDistance(4)
    .on('start', function(event, d) {
      if (!event.active) simulation.alphaTarget(0.2).restart();
      d3.select(this).style('cursor', 'grabbing');
      d.fx = d.x;
      d.fy = d.y;
      // Track start position to detect actual drag
      dragStartPos = { x: event.x, y: event.y };
      lastDragPos = { x: event.x, y: event.y };
      lastDragTime = Date.now();
      wasDragged = false;
    })
    .on('drag', function(event, d) {
      d.fx = event.x;
      d.fy = event.y;
      // Check if we've actually moved
      if (dragStartPos) {
        const dx = event.x - dragStartPos.x;
        const dy = event.y - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5 && !wasDragged) {
          wasDragged = true;
          // Start continuous warm drag sound
          audioFeedback.startDrag();
        }
        
        // Calculate velocity for sound modulation
        if (wasDragged && lastDragPos && lastDragTime) {
          const now = Date.now();
          const dt = Math.max(now - lastDragTime, 1);
          const vx = (event.x - lastDragPos.x) / dt;
          const vy = (event.y - lastDragPos.y) / dt;
          const velocity = Math.sqrt(vx * vx + vy * vy) * 100; // Scale up for audible effect
          
          // Update sound based on velocity
          audioFeedback.updateDrag(velocity);
          
          lastDragPos = { x: event.x, y: event.y };
          lastDragTime = now;
        }
      }
    })
    .on('end', function(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d3.select(this).style('cursor', 'grab');
      if (d.type !== 'center') {
        d.fx = null;
        d.fy = null;
      }
      // Stop drag sound
      audioFeedback.stopDrag();
      dragStartPos = null;
      lastDragPos = null;
      lastDragTime = null;
    });

  nodeElements.call(drag);

  // Add interactions
  nodeElements
    .on('mouseover', function(event, d) {
      if (d.hidden) return;
      
      // Play sound based on node type
      if (d.type === 'center') {
        audioFeedback.playHover();
      } else if (d.type === 'category') {
        audioFeedback.playCardHover();
      } else {
        audioFeedback.playHover();
      }
      hapticFeedback.light();
      
      // Scale up node on hover
      d3.select(this).select('g')
        .transition()
        .duration(250)
        .ease(d3.easeCubicOut)
        .attr('transform', 'scale(1.2)');
      
      // Highlight connected visible links only (don't reveal hidden ones)
      linksGroup.selectAll('.link')
        .filter(function(link) {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const isConnected = sourceId === d.id || targetId === d.id;
          const isVisible = parseFloat(d3.select(this).attr('stroke-opacity')) > 0;
          return isConnected && isVisible;
        })
        .transition()
        .duration(250)
        .ease(d3.easeCubicOut)
        .attr('stroke', LINK_COLOR_HOVER)
        .attr('stroke-opacity', 0.8)
        .attr('stroke-width', 1.5);
      
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
        .duration(250)
        .ease(d3.easeCubicOut)
        .attr('transform', 'scale(1)');
      
      // Reset link styling
      linksGroup.selectAll('.link')
        .transition()
        .duration(250)
        .ease(d3.easeCubicOut)
        .attr('stroke', LINK_COLOR)
        .attr('stroke-opacity', link => {
          if (link.type === 'branch') {
            const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
            return targetNode && !targetNode.hidden ? 0.4 : 0;
          }
          if (link.type === 'reference') {
            const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
            const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
            const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
            return bothVisible ? 0.5 : 0;
          }
          return 0.4;
        })
        .attr('stroke-width', link => {
          if (link.type === 'spine') return 1;
          return 0.75;
        });
      
      highlightDomItem(null);
      hideTooltip();
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      
      // Don't trigger click if node was dragged
      if (wasDragged) {
        wasDragged = false;
        return;
      }
      
      // Play click sound
      audioFeedback.playClick();
      hapticFeedback.medium();
      
      if (d.type === 'category') {
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
        }, 450);
      } else if (d.type === 'item') {
        // Expand sections and show cross-references
        const el = domIndex.get(d.id);
        
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
        }, 450);
        
        // Scroll to the clicked item
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      } else if (d.type === 'center') {
        // Clicking center opens the about me section and shuffles the graph
        toggleSection('intro', true);
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
          .duration(400)
          .ease(d3.easeCubicOut)
          .style('opacity', 0)
          .style('pointer-events', 'none');
        
        // Hide all branch and reference links
        linksGroup.selectAll('.link-branch, .link-reference')
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .attr('stroke-opacity', 0);
        
        simulation.alpha(0.15).restart();
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
      return targetNode && !targetNode.hidden ? 0.4 : 0;
    });
  
  // Update visibility of reference links (show when both nodes are visible)
  linksGroup.selectAll('.link-reference')
    .transition()
    .duration(300)
    .attr('stroke-opacity', d => {
      const sourceNode = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
      return bothVisible ? 0.4 : 0;
    });
  
  // Restart simulation to settle the layout
  simulation.alpha(0.3).restart();
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
      return targetNode && !targetNode.hidden ? 0.4 : 0;
    });
  
  // Update visibility of reference links (show when both nodes are visible)
  linksGroup.selectAll('.link-reference')
    .transition()
    .duration(300)
    .attr('stroke-opacity', d => {
      const sourceNode = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
      const targetNode = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      const bothVisible = sourceNode && targetNode && !sourceNode.hidden && !targetNode.hidden;
      return bothVisible ? 0.4 : 0;
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
  nodesGroup.selectAll('.node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);

  linksGroup.selectAll('.link')
    .attr('d', d => generateCurvedPath(d.source.x, d.source.y, d.target.x, d.target.y));
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
    .duration(300)
    .ease(d3.easeCubicOut)
    .attr('transform', 'scale(1.5)')
    .transition()
    .duration(400)
    .ease(d3.easeCubicOut)
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
  simulation.alpha(0.8).restart();
  
  // Zoom back to fit the whole graph
  setTimeout(() => {
    zoomToFit();
  }, 150);
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
  background: rgba(15, 18, 17, 0.95);
  border: 1px solid rgba(34, 39, 38, 0.8);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #A3AAA7;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 1000;
  max-width: 180px;
  border-radius: 3px;
  backdrop-filter: blur(8px);
`;
document.body.appendChild(tooltip);

function updateTooltipTheme(theme) {
  if (theme === 'light') {
    tooltip.style.background = 'rgba(247, 247, 245, 0.95)';
    tooltip.style.borderColor = 'rgba(225, 228, 226, 0.8)';
    tooltip.style.color = '#5E6461';
  } else {
    tooltip.style.background = 'rgba(15, 18, 17, 0.95)';
    tooltip.style.borderColor = 'rgba(34, 39, 38, 0.8)';
    tooltip.style.color = '#A3AAA7';
  }
}

function showTooltip(event, node) {
  if (!node || node.hidden) return;

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const colors = theme === 'light' 
    ? { primary: '#1C1E1D', muted: '#7A7F7C', accent: '#5E6461' }
    : { primary: '#E7E9E8', muted: '#6E7672', accent: '#A3AAA7' };

  if (node.type === 'center') {
    tooltip.innerHTML = `
      <div style="color: ${colors.primary}; margin-bottom: 2px;">${node.label}</div>
    `;
  } else if (node.type === 'item') {
    // Check if this node has cross-references
    const relatedCats = getRelatedCategories(node);
    const hasRefs = relatedCats.length > 0;
    
    tooltip.innerHTML = `
      <div style="color: ${colors.primary}; margin-bottom: 2px;">${node.label}</div>
      ${node.subtitle ? `<div style="color: ${colors.muted}; font-size: 9px;">${node.subtitle}</div>` : ''}
      ${hasRefs ? `<div style="color: ${colors.accent}; font-size: 9px; margin-top: 2px;">↗ ${relatedCats.length} connection${relatedCats.length > 1 ? 's' : ''}</div>` : ''}
    `;
  } else {
    tooltip.innerHTML = `
      <div style="color: ${colors.primary}; margin-bottom: 2px;">${node.label}</div>
      ${node.subtitle ? `<div style="color: ${colors.muted}; font-size: 9px;">${node.subtitle}</div>` : ''}
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
// Add Sound to Interactive Elements
// ============================================

function addSoundToElements() {
  // Add sound to project cards
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      audioFeedback.playCardHover();
      hapticFeedback.light();
    });
    card.addEventListener('click', (e) => {
      // Check if it's an external link
      if (card.hasAttribute('href') && card.getAttribute('target') === '_blank') {
        e.preventDefault();
        audioFeedback.playBye();
        hapticFeedback.pattern([10, 30, 10]); // Short-long-short pattern
        setTimeout(() => {
          window.open(card.getAttribute('href'), '_blank', 'noopener,noreferrer');
        }, 100);
      } else {
        audioFeedback.playClick();
        hapticFeedback.light();
      }
    });
  });

  // Add sound to talk items
  document.querySelectorAll('.talk-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      audioFeedback.playCardHover();
      hapticFeedback.light();
    });
    item.addEventListener('click', (e) => {
      // Check if it's an external link
      if (item.hasAttribute('href') && item.getAttribute('target') === '_blank') {
        e.preventDefault();
        audioFeedback.playBye();
        hapticFeedback.pattern([10, 30, 10]);
        setTimeout(() => {
          window.open(item.getAttribute('href'), '_blank', 'noopener,noreferrer');
        }, 100);
      } else {
        audioFeedback.playClick();
        hapticFeedback.light();
      }
    });
  });

  // Add sound to contact items
  document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      audioFeedback.playCardHover();
      hapticFeedback.light();
    });
    item.addEventListener('click', (e) => {
      // Check if it's an external link
      if (item.hasAttribute('href') && item.getAttribute('target') === '_blank') {
        e.preventDefault();
        audioFeedback.playBye();
        hapticFeedback.pattern([10, 30, 10]);
        setTimeout(() => {
          window.open(item.getAttribute('href'), '_blank', 'noopener,noreferrer');
        }, 100);
      } else {
        audioFeedback.playClick();
        hapticFeedback.light();
      }
    });
  });

  // Add sound to work items
  document.querySelectorAll('.work-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      audioFeedback.playHover();
      hapticFeedback.light();
    });
  });

  // Add sound to work join link
  document.querySelectorAll('.work-join-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      audioFeedback.playCardHover();
      hapticFeedback.light();
    });
    link.addEventListener('click', (e) => {
      // This is an external link
      if (link.hasAttribute('href') && link.getAttribute('target') === '_blank') {
        e.preventDefault();
        audioFeedback.playBye();
        hapticFeedback.pattern([10, 30, 10]);
        setTimeout(() => {
          window.open(link.getAttribute('href'), '_blank', 'noopener,noreferrer');
        }, 100);
      } else {
        audioFeedback.playClick();
        hapticFeedback.light();
      }
    });
  });
}

function updateMuteButton(muted) {
  const button = document.getElementById('mute-toggle');
  const icon = document.getElementById('mute-icon');
  const label = document.getElementById('mute-label');
  
  if (!button || !icon || !label) return;
  
  if (muted) {
    // Show muted icon
    icon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>
    `;
    label.textContent = 'Muted';
    button.classList.add('muted');
  } else {
    // Show sound on icon
    icon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      </svg>
    `;
    label.textContent = 'Sound';
    button.classList.remove('muted');
  }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initGraph();
  addSoundToElements();
  
  // Initialize mute button state
  updateMuteButton(audioFeedback.isMuted());
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeCategory) {
    toggleSection(activeCategory, false);
  }
});

// ============================================
// Theme Toggle
// ============================================

function getTheme() {
  // Check localStorage first (user's explicit choice)
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  
  // Otherwise observe system preference, default to dark
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return 'dark'; // Default to dark
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update theme colors for graph
  const colors = COLORS[theme];
  NODE_COLOR = colors.node;
  NODE_COLOR_HOVER = colors.nodeHover;
  CENTER_COLOR = colors.center;
  LINK_COLOR = colors.link;
  LINK_COLOR_HOVER = colors.linkHover;
  GRAPH_BG = colors.bg;
  
  // Update SVG background if it exists
  if (svg) {
    svg.style('background-color', GRAPH_BG);
  }
  
  // Update tooltip theme
  updateTooltipTheme(theme);
  
  // Update toggle button
  updateThemeToggle(theme);
  
  // Rebuild graph with new colors
  if (graphData) {
    // Update center node color
    const centerNode = graphData.nodes.find(n => n.id === 'center');
    if (centerNode) {
      centerNode.color = CENTER_COLOR;
    }
    
    // Update all item node colors
    graphData.nodes.forEach(node => {
      if (node.type === 'item') {
        node.color = NODE_COLOR;
      }
    });
    
    // Re-render nodes with new colors
    if (nodesGroup) {
      nodesGroup.selectAll('.node').each(function(d) {
        const nodeGroup = d3.select(this);
        // Remove old shape
        nodeGroup.selectAll('g').remove();
        // Add new shape with updated color
        const shapeGroup = createShape(d.shape, d.size, d.color);
        nodeGroup.node().appendChild(shapeGroup);
      });
    }
    
    // Update link colors (all use same neutral color now)
    if (linksGroup) {
      linksGroup.selectAll('.link')
        .attr('stroke', LINK_COLOR);
    }
  }
}

function updateThemeToggle(theme) {
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  
  if (theme === 'light') {
    // Show moon icon (for switching to dark)
    icon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    label.textContent = 'Dark';
  } else {
    // Show sun icon (for switching to light)
    icon.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    label.textContent = 'Light';
  }
}

// Initialize theme on load
const initialTheme = getTheme();
setTheme(initialTheme);

// Mute toggle click handler
document.addEventListener('DOMContentLoaded', () => {
  const muteToggle = document.getElementById('mute-toggle');
  if (muteToggle) {
    muteToggle.addEventListener('mouseenter', () => {
      // Don't play sound on mute button hover if muted
      if (!audioFeedback.isMuted()) {
        audioFeedback.playHover();
      }
      hapticFeedback.light();
    });
    muteToggle.addEventListener('click', () => {
      const nowMuted = audioFeedback.toggleMute();
      updateMuteButton(nowMuted);
      
      // Play a sound when unmuting (to confirm it works)
      if (!nowMuted) {
        audioFeedback.playClick();
      }
      hapticFeedback.medium();
    });
  }
});

// Theme toggle click handler
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('mouseenter', () => {
      audioFeedback.playHover();
      hapticFeedback.light();
    });
    toggle.addEventListener('click', () => {
      audioFeedback.playClick();
      hapticFeedback.medium();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }
});

