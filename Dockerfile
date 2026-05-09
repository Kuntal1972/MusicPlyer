FROM node:18

# Install ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y ffmpeg python3-pip
RUN pip3 install -U yt-dlp

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]