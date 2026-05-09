const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Streaming route: return direct audio stream URL
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;

    // Use yt-dlp to get metadata
    const info = await youtubedl(`ytsearch:${query}`, {
      dumpSingleJson: true,
      defaultSearch: 'ytsearch',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: 'bestaudio'
    });

    if (!info || !info.entries || info.entries.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const video = info.entries[0];
    const audioFormat = video.formats.find(f => f.acodec !== 'none' && f.url);

    if (!audioFormat) {
      return res.status(500).json({ error: 'No audio stream available' });
    }

    // Return direct audio stream URL
    res.json({ url: audioFormat.url });
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer running on port ${PORT}`);
});