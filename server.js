const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/stream/:song', (req, res) => {
  const query = req.params.song;

  const process = youtubedl.raw(`ytsearch:${query}`, {
    o: '-',
    f: 'bestaudio'
  });

  res.setHeader('Content-Type', 'audio/mpeg');

  // Pipe yt-dlp output through ffmpeg to ensure MP3
  const ffmpegProcess = ffmpeg(process.stdout)
    .audioCodec('libmp3lame')
    .format('mp3')
    .on('error', err => {
      console.error('FFmpeg error:', err);
      res.status(500).send('Streaming failed');
    });

  ffmpegProcess.pipe(res);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});