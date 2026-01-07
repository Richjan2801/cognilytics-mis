# Gunakan image Node.js
FROM node:20-alpine

# Set folder kerja
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh kode sumber frontend
COPY . .

# Buka port Vite (default biasanya 5173)
EXPOSE 5173

# Jalankan server development agar bisa hot-reload
# "--host" penting agar bisa diakses dari luar container (browser kamu)
CMD ["npm", "run", "dev", "--", "--host"]