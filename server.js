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

// Metadata endpoint (returns info only)
app.get('/info/:song', async (req, res) => {
  try {
    const query = req.params.song;
    const search = await playdl.search(query, { limit: 1 });
    if (!search || search.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const videoUrl = search[0].url;
    const info = await playdl.video_basic_info(videoUrl);

    res.json({
      videoTitle: info.video_details.title,
      channel: info.video_details.channel?.name,
      duration: info.video_details.durationInSec,
      thumbnail: info.video_details.thumbnails[0]?.url,
      url: videoUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Info fetch failed' });
  }
});

// Streaming endpoint (pipes audio directly)
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;
    const search = await playdl.search(query, { limit: 1 });
    if (!search || search.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const videoUrl = search[0].url;
    const stream = await playdl.stream(videoUrl, { quality: 2 });

    res.setHeader('Content-Type', stream.type === 'opus' ? 'audio/webm' : 'audio/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    stream.stream.pipe(res);
  } catch (err) {
    console.error('Streaming error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MusicPlayer backend running on port ${PORT}`));