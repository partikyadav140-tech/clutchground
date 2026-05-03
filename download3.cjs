const https = require('https');
const fs = require('fs');

const data = JSON.stringify({
  url: 'https://youtu.be/JDY8XkebaeA',
  vQuality: '1080'
});

const options = {
  hostname: 'api.cobalt.tools',
  path: '/api/json',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(body);
    try {
      const parsed = JSON.parse(body);
      if (parsed.url) {
        console.log('Got download URL:', parsed.url);
        https.get(parsed.url, (response) => {
          const file = fs.createWriteStream('public/hero.mp4');
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('Download complete!');
          });
        });
      } else {
        console.error('No URL found in response');
      }
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
