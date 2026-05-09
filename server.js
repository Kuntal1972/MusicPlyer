const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const cors = require('cors');
app.use(cors());

// Play request
app.post('/play', (req, res) => {
  const songs = req.body.songs;
  if (!songs || songs.length === 0) {
    return res.status(400).send('No songs selected');
  }

  const song = songs[0];
  console.log(`Playing: ${song.name} [${song.voice || "default"}] [${song.singer || ""}]`);

  const queryParts = [song.name];
  if (song.voice) queryParts.push(song.voice);
  if (song.singer) queryParts.push(song.singer);
  const query = queryParts.join(" ");

  const metadata = {
    title: song.name,
    singer: song.singer || "Unknown",
    musicDirector: "Unknown",
    lyricist: "Unknown",
    type: "Song",
    albumOrMovie: "Unknown"
  };

  res.json({
    streamUrl: `/stream/${encodeURIComponent(query)}`,
    metadata
  });
});

// Stream audio
app.get('/stream/:song', (req, res) => {
  const songName = req.params.song;
  const ytProcess = spawn('yt-dlp', [
    '-x', '--audio-format', 'mp3',
    '--no-playlist',
    '-o', '-', 
    `ytsearch5:${songName}`
  ]);

  res.setHeader('Content-Type', 'audio/mpeg');
  ytProcess.stdout.pipe(res);

  ytProcess.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });

  ytProcess.on('close', (code) => {
    console.log(`yt-dlp exited with code ${code}`);
  });
});

app.listen(4000, () => {
  console.log('MusicPlayer running on http://localhost:4000');
});