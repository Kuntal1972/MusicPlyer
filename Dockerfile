# Use official Node image with npm included
FROM node:18

# Install ffmpeg and curl
RUN apt-get update && apt-get install -y ffmpeg curl

# Download yt-dlp binary (no Python needed)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the project
COPY . .

# Expose port (Render uses PORT env var)
EXPOSE 4000

CMD ["node", "server.js"]