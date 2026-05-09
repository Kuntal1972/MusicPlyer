const express = require('express');
const cors = require('cors');
const playdl = require('play-dl');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy streaming route
app.get('/stream/:song', async (req, res) => {
  try {
    const query = req.params.song;

    // Search YouTube for the song
    const search = await playdl.search(query, { limit: 1 });
    if (!search || search.length === 0) {
      return res.status(404).json({ error: 'No video found' });
    }

    const videoUrl = search[0].url;

    // Get video info
    const info = await playdl.video_basic_info(videoUrl);

    // Get audio stream (proxied through backend)
    const stream = await playdl.stream(videoUrl, { quality: 2 });

    // Set headers so browser knows it's audio
    res.setHeader('Content-Type', stream.type === 'opus' ? 'audio/webm' : 'audio/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the stream directly to client
    stream.stream.pipe(res);

    console.log(`Streaming: ${info.video_details.title}`);
  } catch (err) {
    console.error('Streaming error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MusicPlayer backend running on port ${PORT}`);
});