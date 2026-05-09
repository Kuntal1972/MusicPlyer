const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// New streaming route
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;
    const result = await yts(query);

    if (!result.videos || result.videos.length === 0) {
      return res.status(404).send('No video found');
    }

    const video = result.videos[0];
    const audioUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

    // Instead of piping yt-dlp, redirect client to YouTube audio
    res.json({ url: audioUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Streaming failed');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});