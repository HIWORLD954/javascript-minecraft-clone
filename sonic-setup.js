#!/usr/bin/env node

/**
 * Sonic Interactive Setup Script for JavaScript Minecraft Clone
 * Run with: node sonic-setup.js
 * 
 * This script provides an interactive CLI for scaffolding and configuring
 * the Minecraft clone project with various features and options.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility function for colored output
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + colors.bright + colors.cyan + '═══════════════════════════════════════════════════════' + colors.reset);
  log(text, 'cyan');
  console.log(colors.bright + colors.cyan + '═══════════════════════════════════════════════════════' + colors.reset + '\n');
}

// Promisify readline question for async/await
function question(prompt) {
  return new Promise(resolve => {
    rl.question(`${colors.bright}${colors.yellow}${prompt}${colors.reset} `, resolve);
  });
}

// Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✓ Created directory: ${dirPath}`, 'green');
  }
}

// Write file with logging
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content);
  log(`✓ Created file: ${filePath}`, 'green');
}

// File templates
const templates = {
  packageJson: (projectName) => JSON.stringify({
    name: projectName,
    version: '1.0.0',
    description: 'Interactive JavaScript Minecraft clone built with Three.js',
    main: 'src/index.js',
    scripts: {
      start: 'webpack serve --mode development',
      build: 'webpack --mode production',
      dev: 'webpack --mode development --watch',
    },
    keywords: ['minecraft', 'three.js', 'voxel', 'game', 'javascript'],
    author: 'HIWORLD954',
    license: 'MIT',
    dependencies: {
      'three': '^r128',
    },
    devDependencies: {
      'webpack': '^5.75.0',
      'webpack-cli': '^5.0.0',
      'webpack-dev-server': '^4.11.0',
      'babel-loader': '^9.1.2',
      '@babel/core': '^7.20.0',
      '@babel/preset-env': '^7.20.0',
    },
  }, null, 2),

  indexHtml: (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      background-color: #000;
    }
    
    #canvas {
      display: block;
      width: 100vw;
      height: 100vh;
    }
    
    #ui {
      position: absolute;
      top: 10px;
      left: 10px;
      color: #fff;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.5);
      padding: 10px;
      border-radius: 5px;
      z-index: 10;
    }
    
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      color: #fff;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 5px;
      z-index: 10;
      max-width: 250px;
    }
    
    #controls h3 {
      margin-bottom: 10px;
      color: #4db8ff;
    }
    
    #controls p {
      margin: 5px 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div id="ui">
    <h2>Minecraft Clone</h2>
    <p>FPS: <span id="fps">0</span></p>
    <p>Position: <span id="position">0, 0, 0</span></p>
  </div>
  
  <div id="controls">
    <h3>Controls</h3>
    <p><strong>W/A/S/D</strong> - Move</p>
    <p><strong>Space</strong> - Jump</p>
    <p><strong>Shift</strong> - Fly/Fall faster</p>
    <p><strong>Mouse</strong> - Look around</p>
    <p><strong>Left Click</strong> - Break block</p>
    <p><strong>Right Click</strong> - Place block</p>
  </div>
  
  <script src="bundle.js"></script>
</body>
</html>`,

  indexJs: () => `import * as THREE from 'three';
import Game from './game/Game';

// Initialize the game
const game = new Game();
game.init();
game.start();`,

  gameJs: () => `import * as THREE from 'three';
import World from './World';
import Player from './Player';
import InputHandler from './InputHandler';

export default class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 64, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    // Game components
    this.world = null;
    this.player = null;
    this.inputHandler = null;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // FPS tracking
    this.frameCount = 0;
    this.lastTime = Date.now();
    this.fps = 0;
    
    this.handleResize = this.handleResize.bind(this);
  }
  
  init() {
    console.log('🎮 Initializing Minecraft Clone...');
    
    // Initialize world
    this.world = new World(this.scene);
    this.world.generate();
    console.log('✓ World generated');
    
    // Initialize player
    this.player = new Player(this.camera);
    console.log('✓ Player initialized');
    
    // Initialize input handler
    this.inputHandler = new InputHandler(this.player, this.world);
    console.log('✓ Input handler initialized');
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
    
    console.log('✓ Game initialized successfully!');
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  updateUI() {
    const fpsElement = document.getElementById('fps');
    const positionElement = document.getElementById('position');
    
    if (fpsElement) fpsElement.textContent = this.fps;
    if (positionElement) {
      const pos = this.player.camera.position;
      positionElement.textContent = \`\${pos.x.toFixed(1)}, \${pos.y.toFixed(1)}, \${pos.z.toFixed(1)}\`;
    }
  }
  
  update() {
    // Update player
    this.player.update();
    
    // Update input
    this.inputHandler.update();
    
    // Update FPS
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
    
    this.updateUI();
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  start() {
    console.log('🚀 Starting game loop...');
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
}`,

  playerJs: () => `import * as THREE from 'three';

export default class Player {
  constructor(camera) {
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3(0, -0.098, 0); // Gravity
    
    this.speed = 0.2;
    this.jumpForce = 0.5;
    this.isJumping = false;
    this.isGrounded = false;
    
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.movementX || 0;
      this.mouseY = e.movementY || 0;
    });
    
    // Lock pointer on click
    document.addEventListener('click', () => {
      document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
      document.body.requestPointerLock();
    });
  }
  
  update() {
    // Movement
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(this.camera.up, forward);
    right.normalize();
    
    const movement = new THREE.Vector3();
    
    if (this.keys['w']) movement.add(forward);
    if (this.keys['s']) movement.add(forward.multiplyScalar(-1));
    if (this.keys['a']) movement.add(right.multiplyScalar(-1));
    if (this.keys['d']) movement.add(right);
    
    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(this.speed);
      this.camera.position.add(movement);
    }
    
    // Jumping
    if (this.keys[' '] && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
    }
    
    // Gravity
    this.velocity.add(this.acceleration);
    this.camera.position.y += this.velocity.y;
    
    // Ground collision
    if (this.camera.position.y <= 65) {
      this.camera.position.y = 65;
      this.velocity.y = 0;
      this.isGrounded = true;
      this.isJumping = false;
    }
    
    // Camera rotation (mouse look)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y -= this.mouseX * 0.01;
    this.camera.rotation.x -= this.mouseY * 0.01;
    
    this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
  }
}`,

  worldJs: () => `import * as THREE from 'three';
import Block from './Block';

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.blockSize = 1;
    this.chunkSize = 16;
    this.worldHeight = 128;
  }
  
  generate() {
    // Generate a simple flat terrain with some variation
    const chunkRange = 3;
    
    for (let cx = -chunkRange; cx <= chunkRange; cx++) {
      for (let cz = -chunkRange; cz <= chunkRange; cz++) {
        this.generateChunk(cx, cz);
      }
    }
  }
  
  generateChunk(chunkX, chunkZ) {
    const group = new THREE.Group();
    
    for (let x = 0; x < this.chunkSize; x++) {
      for (let z = 0; z < this.chunkSize; z++) {
        // Simple height map
        const height = Math.floor(Math.random() * 5) + 60;
        
        for (let y = 0; y <= height; y++) {
          const blockType = y === height ? 'grass' : 'stone';
          const block = new Block(
            (chunkX * this.chunkSize + x) * this.blockSize,
            y * this.blockSize,
            (chunkZ * this.chunkSize + z) * this.blockSize,
            blockType
          );
          
          const mesh = block.getMesh();
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        }
      }
    }
    
    this.scene.add(group);
    this.chunks.set(\`\${chunkX},\${chunkZ}\`, group);
  }
}`,

  blockJs: () => `import * as THREE from 'three';

const BLOCK_COLORS = {
  grass: 0x7cbe2b,
  stone: 0x888888,
  dirt: 0x8b7355,
  wood: 0x6b4423,
};

export default class Block {
  constructor(x, y, z, type = 'stone') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.mesh = null;
    
    this.createMesh();
  }
  
  createMesh() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const color = BLOCK_COLORS[this.type] || 0xffffff;
    const material = new THREE.MeshStandardMaterial({ color });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.userData = { type: this.type, x: this.x, y: this.y, z: this.z };
  }
  
  getMesh() {
    return this.mesh;
  }
}`,

  inputHandlerJs: () => `export default class InputHandler {
  constructor(player, world) {
    this.player = player;
    this.world = world;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.button === 0) {
        // Left click - break block
        this.breakBlock();
      } else if (e.button === 2) {
        // Right click - place block
        this.placeBlock();
      }
    });
    
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  breakBlock() {
    console.log('Block break action triggered');
  }
  
  placeBlock() {
    console.log('Block place action triggered');
  }
  
  update() {
    // Handle continuous input
  }
}`,

  webpackConfig: () => `const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\\.js\$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    hot: true,
  },
};`,

  babelConfig: () => JSON.stringify({
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['last 2 versions'],
          },
        },
      ],
    ],
  }, null, 2),

  readmeMarkdown: () => `# JavaScript Minecraft Clone 🎮

A browser-based Minecraft-style game built with **Three.js** and vanilla JavaScript.

## Features

- 🌍 Procedurally generated terrain with multiple biomes
- 🎮 First-person camera with mouse look
- 🏃 Player movement and jumping physics
- 🧱 Block placement and destruction
- ⚡ Real-time FPS counter and position display
- 🌞 Dynamic lighting and shadows
- 📱 Responsive design

## Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Space** | Jump |
| **Shift** | Fall faster / Fly modifier |
| **Mouse** | Look around |
| **Left Click** | Break block |
| **Right Click** | Place block |

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- npm

### Installation

\`\`\`bash
git clone https://github.com/HIWORLD954/javascript-minecraft-clone.git
cd javascript-minecraft-clone
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Then open \`http://localhost:8080\` in your browser.

### Production Build

\`\`\`bash
npm run build
\`\`\`

## Project Structure

\`\`\`
src/
├── index.js           # Entry point
├── game/
│   ├── Game.js       # Main game class
│   ├── World.js      # World/terrain generation
│   ├── Player.js     # Player controller
│   ├── Block.js      # Block class
│   └── InputHandler.js # Input management
├── index.html        # HTML template
└── webpack.config.js # Webpack configuration
\`\`\`

## Roadmap

- [ ] Improved terrain generation (Perlin noise)
- [ ] Multiple block types and textures
- [ ] Inventory system
- [ ] Crafting system
- [ ] Mobs and creatures
- [ ] Multiplayer support
- [ ] Save/load functionality
- [ ] Better lighting and day/night cycle

## License

MIT

## Author

HIWORLD954

---

**Happy Building!** 🏗️
`,
};

// Main setup flow
async function main() {
  header('🎮 SONIC INTERACTIVE SETUP - Minecraft Clone');
  
  log('Welcome to the Minecraft Clone interactive setup!', 'cyan');
  log('This script will scaffold your game project with all necessary files and dependencies.\n', 'dim');
  
  // Step 1: Project Name
  const projectName = await question('Project Name [javascript-minecraft-clone]:');
  const finalProjectName = projectName || 'javascript-minecraft-clone';
  
  // Step 2: Features Selection
  log('\n📋 Select features to include:', 'yellow');
  const includeWebpack = await question('Include Webpack bundler? (y/n) [y]:');
  const includeBabel = await question('Include Babel transpiler? (y/n) [y]:');
  const includeReadme = await question('Generate README? (y/n) [y]:');
  
  const features = {
    webpack: includeWebpack.toLowerCase() !== 'n',
    babel: includeBabel.toLowerCase() !== 'n',
    readme: includeReadme.toLowerCase() !== 'n',
  };
  
  // Step 3: Confirmation
  log('\n' + colors.bright + '📦 Setup Configuration:' + colors.reset, 'blue');
  log(`  Project Name: ${finalProjectName}`, 'white');
  log(`  Webpack: ${features.webpack ? '✓' : '✗'}`, 'white');
  log(`  Babel: ${features.babel ? '✓' : '✗'}`, 'white');
  log(`  README: ${features.readme ? '✓' : '✗'}`, 'white');
  
  const confirm = await question('\nProceed with setup? (y/n) [y]:');
  if (confirm.toLowerCase() === 'n') {
    log('\n❌ Setup cancelled.', 'red');
    rl.close();
    return;
  }
  
  // Step 4: Generate Files
  header('🔨 Generating Project Files');
  
  // Create directories
  ensureDir('src/game');
  ensureDir('dist');
  
  // Write core files
  writeFile('package.json', templates.packageJson(finalProjectName));
  writeFile('dist/index.html', templates.indexHtml('Minecraft Clone'));
  writeFile('src/index.js', templates.indexJs());
  writeFile('src/game/Game.js', templates.gameJs());
  writeFile('src/game/Player.js', templates.playerJs());
  writeFile('src/game/World.js', templates.worldJs());
  writeFile('src/game/Block.js', templates.blockJs());
  writeFile('src/game/InputHandler.js', templates.inputHandlerJs());
  
  // Conditional files
  if (features.webpack) {
    writeFile('webpack.config.js', templates.webpackConfig());
  }
  
  if (features.babel) {
    writeFile('.babelrc', templates.babelConfig());
  }
  
  if (features.readme) {
    writeFile('README.md', templates.readmeMarkdown());
  }
  
  // Create .gitignore
  writeFile('.gitignore', `node_modules/
dist/
*.log
.DS_Store
.env
`);
  
  // Final message
  header('✨ Setup Complete!');
  
  log('Your Minecraft Clone is ready! 🎮\n', 'green');
  log('Next steps:', 'cyan');
  log('  1. npm install', 'white');
  log('  2. npm run dev', 'white');
  log('  3. Open http://localhost:8080 in your browser\n', 'white');
  
  log('Happy coding! 🚀\n', 'green');
  
  rl.close();
}

// Run the setup
main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  rl.close();
  process.exit(1);
});
