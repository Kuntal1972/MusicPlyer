const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/stream/:song', async (req, res) => {
  const query = req.params.song;

  try {
    // Spawn yt-dlp process
    const process = youtubedl.exec(`ytsearch:${query}`, {
      x: true,
      audioFormat: 'mp3',
      o: '-'
    });

    res.setHeader('Content-Type', 'audio/mpeg');

    process.stdout.pipe(res);

    process.stderr.on('data', data => {
      console.error(`yt-dlp error: ${data}`);
    });

    process.on('error', err => {
      console.error('Spawn error:', err);
      res.status(500).send('Streaming failed');
    });
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).send('Streaming failed');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});