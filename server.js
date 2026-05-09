const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');

const app = express();
app.use(cors());
app.use(express.json());


const path = require('path');

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/play', (req, res) => {
  const { songs } = req.body;
  if (!songs || songs.length === 0) {
    return res.status(400).send('No songs provided');
  }
  res.json({ message: `Playing ${songs[0].name}` });
});

app.get('/stream/:song', (req, res) => {
  const query = req.params.song;

  const process = youtubedl.raw(`ytsearch:${query}`, {
    x: true,
    audioFormat: 'mp3',
    o: '-'
  });

  res.setHeader('Content-Type', 'audio/mpeg');
  process.stdout.pipe(res);

  process.stderr.on('data', data => {
    console.error(`yt-dlp error: ${data}`);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});