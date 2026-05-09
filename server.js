const express = require('express');
const cors = require('cors');
const playdl = require('play-dl');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Streaming route
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;

    // Search YouTube
    const search = await playdl.search(query, { limit: 1 });
    if (!search || search.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const videoUrl = search[0].url;

    // Get audio stream (always returns a playable URL)
    const stream = await playdl.stream(videoUrl, { quality: 2 });
    const info = await playdl.video_basic_info(videoUrl);

    res.json({
      videoTitle: info.video_details.title,
      audioStream: {
        url: stream.url,
        type: stream.type,
        duration: info.video_details.durationInSec
      }
    });
  } catch (err) {
    console.error('play-dl error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MusicPlayer running on port ${PORT}`));