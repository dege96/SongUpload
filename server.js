const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to songs directory
const SONGS_DIR = path.join(__dirname, 'Songs');

// Store the list of songs
let songsList = [];

// Function to update the songs list
function updateSongsList() {
  try {
    const files = fs.readdirSync(SONGS_DIR);
    songsList = files
      .filter(file => file.endsWith('.mp3'))
      .map(file => ({
        name: file,
        path: `/songs/${encodeURIComponent(file)}`,
        fullPath: path.join(SONGS_DIR, file)
      }));
    console.log('Songs list updated:', songsList.length, 'songs found');
  } catch (error) {
    console.error('Error updating songs list:', error);
  }
}

// Initial song list update
updateSongsList();

// Watch for changes in the Songs directory
const watcher = chokidar.watch(SONGS_DIR, {
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', path => {
    console.log(`File ${path} has been added`);
    updateSongsList();
  })
  .on('unlink', path => {
    console.log(`File ${path} has been removed`);
    updateSongsList();
  });

// Serve static files from the public directory
app.use(express.static('public'));

// Serve MP3 files from the Songs directory
app.use('/songs', express.static(SONGS_DIR));

// API endpoint to get the list of songs
app.get('/api/songs', (req, res) => {
  res.json(songsList);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 