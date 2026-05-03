const youtubedl = require('youtube-dl-exec');

console.log('Starting download...');

youtubedl('https://youtu.be/JDY8XkebaeA', {
  output: 'public/hero.mp4',
  format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
})
.then(output => console.log('Download completed successfully.'))
.catch(err => console.error('Download failed:', err));
