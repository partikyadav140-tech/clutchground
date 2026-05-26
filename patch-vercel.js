import fs from 'fs';
import path from 'path';

const outputDir = '/vercel/output';

try {
  // 1. Remove the serverless functions folder so Vercel does not deploy serverless code
  const functionsDir = path.join(outputDir, 'functions');
  if (fs.existsSync(functionsDir)) {
    fs.rmSync(functionsDir, { recursive: true, force: true });
    console.log('Removed serverless functions folder successfully.');
  }

  // 2. Create the Vercel Build Output API config.json with external proxy routing
  const configPath = path.join(outputDir, 'config.json');
  const config = {
    version: 3,
    routes: [
      // Allow static assets to load locally from Vercel's CDN
      {
        src: '^/assets/(.*)',
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
        continue: true
      },
      {
        src: '^/(manifest\\.webmanifest|new-banner\\.png|hero-banner\\.png|robots\\.txt|sitemap\\.xml|sw\\.js|posters/.*|pwa-.*)',
        continue: true
      },
      // Proxy everything else directly to the Render backend service
      {
        src: '/(.*)',
        dest: 'https://clutchground-api.onrender.com/$1'
      }
    ]
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Successfully patched Vercel config.json with Render proxy routes!');
} catch (error) {
  console.error('Error patching Vercel output:', error);
  process.exit(1);
}
