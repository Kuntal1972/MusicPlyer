const songInput = document.getElementById('songInput');
const addSongBtn = document.getElementById('addSongBtn');
const csvUpload = document.getElementById('csvUpload');
const songTable = document.getElementById('songTable').querySelector('tbody');
const player = document.getElementById('player');
const songInfo = document.getElementById('songInfo');

let queue = [];
let currentIndex = -1;

// ✅ Add song manually
addSongBtn.addEventListener('click', () => {
  const name = songInput.value.trim();
  if (name) addSongToTable(name);
});

// ✅ Upload CSV
csvUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split('\n');
    lines.forEach(line => {
      if (line.trim()) addSongToTable(line.trim());
    });
  };
  reader.readAsText(file);
});



document.getElementById('playBtn').addEventListener('click', async () => {
  const songName = document.getElementById('songInput').value.trim();
  if (!songName) {
    alert('Please enter a song name');
    return;
  }

  try {
    const response = await fetch(`/stream/${encodeURIComponent(songName)}`);
    if (!response.ok) throw new Error('Backend error');

    const data = await response.json();

    if (data.audioOptions && data.audioOptions.length > 0) {
      const quality = document.getElementById('qualitySelect').value;
      let chosen;

      if (quality === 'low') {
        chosen = data.audioOptions.find(opt => opt.itag === 139);
      } else if (quality === 'medium') {
        chosen = data.audioOptions.find(opt => opt.itag === 140);
      } else if (quality === 'high') {
        chosen = data.audioOptions.find(opt => opt.itag === 251);
      }

      // Auto mode: pick best available
      if (!chosen && quality === 'auto') {
        chosen = data.audioOptions.find(opt => opt.itag === 140) ||
                 data.audioOptions.find(opt => opt.itag === 251) ||
                 data.audioOptions.find(opt => opt.itag === 139) ||
                 data.audioOptions[0];
      }

      if (!chosen) {
        chosen = data.audioOptions[0]; // fallback
      }

      const audioPlayer = document.getElementById('audioPlayer');
      audioPlayer.src = chosen.url;
      audioPlayer.play();

      console.log(`Playing ${data.videoTitle} with itag ${chosen.itag} (${chosen.mimeType})`);
    } else {
      alert('No audio options returned');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to play song');
  }
});



// ✅ Add song row to table
function addSongToTable(name) {
  const row = document.createElement('tr');
  row.innerHTML = `<td><input type="checkbox"></td><td>${name}</td>`;
  songTable.appendChild(row);
}

// ✅ Collect selected songs
function getSelectedSongs() {
  const rows = songTable.querySelectorAll('tr');
  const songs = [];
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type=checkbox]');
    if (checkbox.checked) {
      songs.push({ name: row.cells[1].textContent });
    }
  });
  return songs;
}

// ✅ Playback controls
//document.getElementById('playBtn').addEventListener('click', () => {
  //queue = getSelectedSongs();
  //currentIndex = 0;
  //playCurrent();
//});

document.getElementById('pauseBtn').addEventListener('click', () => player.pause());
document.getElementById('resumeBtn').addEventListener('click', () => player.play());
document.getElementById('stopBtn').addEventListener('click', () => { player.pause(); player.currentTime = 0; });
document.getElementById('nextBtn').addEventListener('click', () => { if (currentIndex < queue.length-1) { currentIndex++; playCurrent(); }});
document.getElementById('prevBtn').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; playCurrent(); }});
document.getElementById('volUpBtn').addEventListener('click', () => player.volume = Math.min(1, player.volume+0.1));
document.getElementById('volDownBtn').addEventListener('click', () => player.volume = Math.max(0, player.volume-0.1));
document.getElementById('clearBtn').addEventListener('click', () => { songTable.innerHTML = ''; queue = []; currentIndex = -1; player.pause(); });

// ✅ Play current song
function playCurrent() {
  if (currentIndex < 0 || currentIndex >= queue.length) return;
  const song = queue[currentIndex];
  //fetch('/play', {
fetch('https://musicplyer.onrender.com/play', {  
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songs: [song] })
  })
  .then(res => res.json())
  .then(data => {
    //player.src = data.streamUrl;
    player.src = `https://musicplyer.onrender.com/stream/${encodeURIComponent(song.name)}`;
    player.load();
    player.addEventListener('canplaythrough', () => player.play(), { once: true });
    songInfo.innerHTML = `
      <strong>Song:</strong> ${data.metadata.title}<br>
      <strong>Singer:</strong> ${data.metadata.singer}<br>
      <strong>Music Director:</strong> ${data.metadata.musicDirector}<br>
      <strong>Lyricist:</strong> ${data.metadata.lyricist}<br>
      <strong>${data.metadata.type}:</strong> ${data.metadata.albumOrMovie}
    `;
  });
}

// ✅ Voice recognition add song
document.getElementById('voiceAddBtn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.start();
  recognition.onresult = (event) => {
    const spoken = event.results[event.results.length-1][0].transcript.trim();
    addSongToTable(spoken);
  };
});

// ✅ Voice recognition play song (interactive)
document.getElementById('voicePlayBtn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.start();
  recognition.onresult = (event) => {
    let spoken = event.results[event.results.length-1][0].transcript.toLowerCase().trim();
    let voicePref = null, singer = null;

    if (spoken.includes("male")) { voicePref = "male"; spoken = spoken.replace("male","").trim(); }
    if (spoken.includes("female")) { voicePref = "female"; spoken = spoken.replace("female","").trim(); }

    // crude singer extraction: "by <name>"
    if (spoken.includes("by")) {
      const parts = spoken.split("by");
      spoken = parts[0].trim();
      singer = parts[1].trim();
    }

    // remove play/song/track prefix
    spoken = spoken.replace(/play|song|track/gi, "").trim();

    const songName = spoken;

//    fetch('/play', {
fetch('https://musicplyer.onrender.com/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs: [{ name: songName, voice: voicePref, singer: singer }] })
    })
    .then(res => res.json())
    .then(data => {
      //player.src = data.streamUrl;
      player.src = `https://musicplyer.onrender.com/stream/${encodeURIComponent(song.name)}`;
      player.load();
      player.addEventListener('canplaythrough', () => player.play(), { once: true });
      songInfo.innerHTML = `
        <strong>Song:</strong> ${data.metadata.title}<br>
        <strong>Singer:</strong> ${data.metadata.singer}<br>
        <strong>Music Director:</strong> ${data.metadata.musicDirector}<br>
        <strong>Lyricist:</strong> ${data.metadata.lyricist}<br>
        <strong>${data.metadata.type}:</strong> ${data.metadata.albumOrMovie}
      `;
    });
  };
});