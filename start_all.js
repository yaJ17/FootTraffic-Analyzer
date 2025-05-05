#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kill any existing Node.js or Python processes to avoid port conflicts
try {
  console.log('Cleaning up any existing processes...');
  execSync('pkill -f node || true', { stdio: 'ignore' });
  execSync('pkill -f python || true', { stdio: 'ignore' });
  // Give some time for processes to terminate
  execSync('sleep 1');
} catch (err) {
  // Ignore errors if no processes found
}

// Create required directories
console.log('Creating required directories...');
const uploadDir = path.join(__dirname, 'flask_backend', 'uploads');
const templatesDir = path.join(__dirname, 'flask_backend', 'templates');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created directory: ${uploadDir}`);
}

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log(`Created directory: ${templatesDir}`);
}

// Copy sample videos if they don't exist
const sampleVideos = [
  { source: 'attached_assets/palengke.mp4', dest: 'flask_backend/uploads/palengke.mp4' },
  { source: 'attached_assets/school.mp4', dest: 'flask_backend/uploads/school.mp4' }
];

console.log('Checking for sample videos...');
sampleVideos.forEach(video => {
  if (fs.existsSync(video.source) && !fs.existsSync(video.dest)) {
    console.log(`Copying ${video.source} to ${video.dest}...`);
    fs.copyFileSync(video.source, video.dest);
  } else if (!fs.existsSync(video.source)) {
    console.log(`Warning: Source video ${video.source} not found`);
  } else {
    console.log(`Video ${video.dest} already exists`);
  }
});

// Start Flask server in the background
console.log('Starting Flask server on port 5003...');
const flaskServer = spawn('python', ['flask_backend/simple_server.py'], {
  env: { 
    ...process.env, 
    PORT: '5003', 
    PYTHONPATH: `${process.env.PYTHONPATH || ''}:${__dirname}` 
  },
  stdio: 'pipe'
});

// Log Flask server output
flaskServer.stdout.on('data', (data) => {
  console.log(`[Flask] ${data.toString().trim()}`);
});

flaskServer.stderr.on('data', (data) => {
  console.error(`[Flask Error] ${data.toString().trim()}`);
});

flaskServer.on('close', (code) => {
  console.log(`Flask server exited with code ${code}`);
});

// Wait for Flask server to start (simple check)
const waitForFlaskServer = () => {
  return new Promise((resolve) => {
    console.log('Waiting for Flask server to start...');
    
    // Try to connect to Flask server
    const checkServer = () => {
      const req = createServer().listen(0);
      req.once('listening', () => {
        const port = req.address().port;
        req.close();
        
        const httpReq = createServer();
        const httpGet = httpReq.get || http.get;
        const httpRequest = httpGet({
          host: 'localhost',
          port: 5003,
          path: '/hello',
          timeout: 1000
        }, (res) => {
          if (res.statusCode === 200) {
            console.log('Flask server is ready!');
            resolve();
          } else {
            setTimeout(checkServer, 500);
          }
        });
        
        httpReq.on('error', () => {
          setTimeout(checkServer, 500);
        });
      });
    };
    
    // Check every 500ms, but resolve after 5 seconds max
    checkServer();
    setTimeout(resolve, 5000);
  });
};

// Start the main app after Flask server
waitForFlaskServer().then(() => {
  console.log('Starting main application on port 5000...');
  
  // Start the main app
  const mainApp = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    flaskServer.kill();
    mainApp.kill();
    process.exit(0);
  });
});