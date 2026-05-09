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

// Streaming route: return all audio formats
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;

    // Step 1: Search YouTube for the video
    const search = await playdl.search(query, { limit: 1 });
    if (!search || search.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const videoUrl = search[0].url;

    // Step 2: Get video info
    const videoInfo = await playdl.video_basic_info(videoUrl);

    // Step 3: Collect audio formats
    const audioFormats = videoInfo.format
      .filter(f => f.hasAudio && !f.hasVideo)
      .map(f => ({
        itag: f.itag,
        mimeType: f.mimeType,
        bitrate: f.bitrate || null,
        url: f.url
      }));

    if (audioFormats.length === 0) {
      return res.status(500).json({ error: 'No audio stream available' });
    }

    // Step 4: Return all audio options
    res.json({
      videoTitle: videoInfo.video_details.title,
      audioOptions: audioFormats
    });
  } catch (err) {
    console.error('play-dl error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});