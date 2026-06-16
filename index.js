const express = require('express');
const { startWhatsApp } = require('./controllers/whatsappController');
require('dotenv').config();

const app = express();
app.use(express.json()); // Agar server bisa menerima data format JSON

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server SmartConnect Backend berjalan di port ${PORT}`);
    
    // Menjalankan gateway WhatsApp secara asynchronous saat server aktif
    startWhatsApp();
});