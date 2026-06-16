const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const db = require("../config/db");
const pino = require("pino");
const axios = require('axios'); // Install jika belum: npm install axios

async function startWhatsApp() {
    // Menyimpan session token agar gratis selamanya tanpa scan ulang
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }), // Menyembunyikan log logistik berlebih
        printQRInTerminal: true // QR Code akan muncul di terminal VS Code
    });

    sock.ev.on('creds.update', saveCreds);

    // Event Handler saat ada pesan masuk
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const senderNumber = msg.key.remoteJid;
            const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

            console.log(`[Pesan Masuk] Dari: ${senderNumber} | Isi: ${messageText}`);

            try {
                // 1. Logika Auto-Capture (Tetap seperti kemarin)
                const [rows] = await db.query("SELECT * FROM customers WHERE phone_number = ?", [senderNumber]);
                if (rows.length === 0) {
                    await db.query("INSERT INTO customers (phone_number, status) VALUES (?, ?)", [senderNumber, 'New Lead']);
                }

                // 2. INTEGRASI AI & QUERY DATABASE PINTAR
                console.log(`[AI Pemrosesan] Menganalisis intent pesan...`);
                let kategoriAI = 'Inquiry'; // Default fallback

                try {
                    kategoriAI = await dapatkanKlasifikasiAI(messageText);
                    console.log(`[AI Hasil] Pesan dikategorikan sebagai: ${kategoriAI}`);
                } catch (err) {
                    console.log(`[AI Error] Menggunakan logika pencarian kemiripan kata di database...`);
                }

                // 3. AMBIL BALASAN DINAMIS BERDASARKAN HASIL DATASET DI DATABASE
                // Mencari teks di database yang paling mirip dengan pesan masuk pelanggan
                const [datasetMatches] = await db.query(
                    "SELECT label FROM ai_training_dataset WHERE ? LIKE CONCAT('%', text, '%') OR text LIKE CONCAT('%', ?, '%') LIMIT 1",
                    [messageText, messageText]
                );

                if (datasetMatches.length > 0) {
                    kategoriAI = datasetMatches[0].label;
                }

                // 4. ATUR BALASAN OTOMATIS YANG BERVARIASI (TIDAK SAMA TERUS)
                let replyText = "";
                if (kategoriAI === 'Inquiry') {
                    replyText = "Halo! Terima kasih telah bertanya. Admin kami akan segera memberikan informasi lengkap terkait layanan kami.";
                } else if (kategoriAI === 'Complaint') {
                    replyText = "Halo, kami memohon maaf atas ketidaknyamanan Anda. Laporan Anda telah kami catat di sistem CRM dan akan segera ditangani oleh tim teknis.";
                } else if (kategoriAI === 'Transaction') {
                    replyText = "Halo! Terima kasih telah melakukan transaksi. Silakan tunggu sejenak, sistem sedang memverifikasi detail pembayaran Anda.";
                }

                // Kirim balasan otomatis pintar ke WhatsApp pelanggan
                if (replyText !== "") {
                    await sock.sendMessage(senderNumber, { text: replyText });
                    await db.query("INSERT INTO messages (phone_number, message_text, direction, category_by_AI) VALUES (?, ?, ?, ?)",
                        [senderNumber, replyText, 'outgoing', kategoriAI]);
                }

            } catch (error) {
                console.error("[Backend Error]: ", error);
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("==================================================");
            console.log("[CRM] QR Code Terdeteksi! Silakan Scan Melalui WA:");
            console.log("==================================================");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            console.log("[CRM] Koneksi terputus, mencoba menghubungkan kembali...");
            startWhatsApp();
        } else if (connection === 'open') {
            console.log("[CRM] Selamat Zerive, WhatsApp Gateway Berhasil Terhubung!");
        }
    });
}

// Fungsi pembantu untuk mengirim teks ke API Python Data Engineer kalian
async function dapatkanKlasifikasiAI(text) {
    try {
        // Ganti URL dengan endpoint API Python (Flask/FastAPI) milik rekan timmu
        const response = await axios.post('http://localhost:8000/api/classify', { text: text });
        return response.data.label; // Mengembalikan hasil: 'Inquiry', 'Complaint', atau 'Transaction'
    } catch (error) {
        console.error("Gagal mendapatkan klasifikasi AI, menggunakan default.");
        return 'Inquiry';
    }
}

module.exports = { startWhatsApp };