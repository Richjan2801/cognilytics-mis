# Gunakan image Node.js versi stabil
FROM node:18-alpine

# Set folder kerja di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json dulu (agar caching efisien)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh kode sumber backend
COPY . .

# Buka port yang dipakai backend (sesuaikan jika di server.js bukan 5000)
EXPOSE 5000

# Jalankan server
CMD ["npm", "start"]