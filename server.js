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

// Rekursiv funktion för att hämta filer i submappar
function getAllSongsInDirectory(dir, subPath = '') {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let songs = [];

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.join(subPath, item.name);

      if (item.isDirectory()) {
        // Rekursivt söker i submappen
        const subDirSongs = getAllSongsInDirectory(fullPath, relativePath);
        songs = songs.concat(subDirSongs);
      } else if (item.isFile() && (item.name.endsWith('.mp3') || item.name.endsWith('.wav'))) {
        // Lägger till musikfiler
        songs.push({
          name: item.name,
          folder: subPath || 'Root',
          path: `/songs/${encodeURIComponent(relativePath)}`,
          fullPath: fullPath,
          displayPath: subPath ? `${subPath}/${item.name}` : item.name
        });
      }
    }

    return songs;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// Function to update the songs list
function updateSongsList() {
  try {
    songsList = getAllSongsInDirectory(SONGS_DIR);
    console.log('Songs list updated:', songsList.length, 'songs found');
  } catch (error) {
    console.error('Error updating songs list:', error);
  }
}

// Initial song list update
updateSongsList();

// Watch for changes in the Songs directory and all subdirectories
const watcher = chokidar.watch(SONGS_DIR, {
  persistent: true,
  ignoreInitial: true,
  recursive: true
});

watcher
  .on('add', path => {
    console.log(`File ${path} has been added`);
    updateSongsList();
  })
  .on('unlink', path => {
    console.log(`File ${path} has been removed`);
    updateSongsList();
  })
  .on('addDir', path => {
    console.log(`Directory ${path} has been added`);
    updateSongsList();
  })
  .on('unlinkDir', path => {
    console.log(`Directory ${path} has been removed`);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 