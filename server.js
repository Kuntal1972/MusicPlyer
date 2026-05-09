const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const yts = require('yt-search');
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
    const result = await yts(query);
    if (!result.videos || result.videos.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }
    const videoId = result.videos[0].videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 2: Get formats for that video
    const info = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: 'bestaudio'
    });

    // Step 3: Collect all audio formats
    const audioFormats = info.formats
      .filter(f => f.url && f.acodec && f.acodec !== 'none')
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
      videoTitle: info.title,
      audioOptions: audioFormats
    });
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});