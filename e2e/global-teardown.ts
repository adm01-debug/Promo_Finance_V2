import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Clean up any test data if needed
  try {
    // Remove storage state file if it exists
    const storageStatePath = path.join(__dirname, '.auth/user.json');
    if (fs.existsSync(storageStatePath)) {
      fs.unlinkSync(storageStatePath);
      console.log('✅ Removed storage state file');
    }
    
    // Clean up test screenshots/videos if in CI
    if (process.env.CI) {
      const artifactsDir = path.join(__dirname, 'test-results');
      if (fs.existsSync(artifactsDir)) {
        // Keep artifacts for debugging, just log
        console.log('📁 Test artifacts available in:', artifactsDir);
      }
    }
    
    // Log summary
    console.log('✅ Global teardown complete');
  } catch (error) {
    console.log('⚠️ Teardown warning:', error);
    // Don't fail teardown
  }
}

export default globalTeardown;
