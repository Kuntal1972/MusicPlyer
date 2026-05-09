FROM node:18

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg curl

# Download yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]