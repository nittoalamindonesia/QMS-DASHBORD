// wa-bot/index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { toolingCol } = require('./firebaseAdmin');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, // Biarkan tetap false agar kelihatan
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-default-browser-check',
      '--remote-debugging-port=9222' // Mengunci port debugging agar koneksi stabil
    ]
  }
});

client.on('qr', (qr) => {
  console.log('\n--- SCAN QR CODE INI DI WHATSAPP HP KAMU ---');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('\n✅ WhatsApp Bot Order & Tracking Tooling SIAP DIGUNAKAN!');
});

// Helper untuk membuat Custom Document ID unik dari Nama Item (Mencegah Duplikasi)
const createDocId = (itemName) => {
  return itemName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
};

// Menerima & Memproses Pesan WA Masuk
client.on('message', async (msg) => {
  const body = msg.body.trim();

  // A. MENU HELP / BANTUAN
  if (body.toLowerCase() === '!help' || body.toLowerCase() === '!menu') {
    const helpText = `
*--- BOT KONTROL TOOLING & WIRE ---*

1️⃣ *INPUT / UPDATE DATA TOOLING (#ADD)*
Format: \`#ADD#TIPE#NAMA_ITEM#QTY#ORDER_DATE#ETA\`
Contoh:
\`#ADD#Tooling#Punch Header M6#5#2026-07-24#2026-09-24\`
_(Note: Jika NAMA_ITEM sama, data lama akan otomatis diperbarui/di-overwrite, tidak membuat baris baru)_

2️⃣ *UPDATE ETA / STATUS DONE (#UPDATE)*
Format: \`#UPDATE#NAMA_ITEM#ETA_ATAU_DONE\`
Contoh Update ETA:
\`#UPDATE#Punch Header M6#2026-09-30\`
Contoh Selesai (Otomatis Hapus dari Database):
\`#UPDATE#Punch Header M6#DONE\`

3️⃣ *CEK ITEM ON PROGRESS*
Ketik: \`!progress\` atau \`!check\`
    `;
    await msg.reply(helpText);
    return;
  }

  // B. CEK ITEM YANG SEDANG ON PROGRESS (Sudah dioptimalkan agar lebih fleksibel)
  if (body.toLowerCase() === '!progress' || body.toLowerCase() === '!check') {
    try {
      const snapshot = await toolingCol.get();

      if (snapshot.empty) {
        await msg.reply('ℹ️ Tidak ada item di dalam database.');
        return;
      }

      let itemListText = `*📋 DAFTAR ITEM ON PROGRESS:*\n\n`;
      let count = 1;
      let foundCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const status = (data.status || 'ORDERED').toUpperCase();
        
        // Menampilkan item yang statusnya masih order/on progress
        if (status === 'ORDERED' || status === 'ON PROGRESS') {
          itemListText += `${count}. *${data.item_name || 'Tanpa Nama'}*\n   • Tipe: ${data.item_type || '-'}\n   • Qty: ${data.qty || '-'}\n   • Order Date: ${data.order_date || '-'}\n   • ETA: ${data.eta_date || data.eta || '-'}\n   • Status: ${status}\n\n`;
          count++;
          foundCount++;
        }
      });

      if (foundCount === 0) {
        await msg.reply('ℹ️ Tidak ada item yang sedang *ON PROGRESS* saat ini.');
        return;
      }

      itemListText += `_Gunakan #UPDATE#NAMA_ITEM#DONE jika item sudah sampai untuk menghapus dari database._`;
      await msg.reply(itemListText);
    } catch (error) {
      console.error('Gagal mengambil data progress:', error);
      await msg.reply('❌ Gagal mengambil daftar item on progress.');
    }
    return;
  }

  // C. INPUT / UPDATE DATA (#ADD)
  if (body.startsWith('#ADD#')) {
    const parts = body.split('#');

    if (parts.length < 6) {
      await msg.reply('❌ Format #ADD salah!\nGunakan: *#ADD#TIPE#NAMA_ITEM#QTY#ORDER_DATE#ETA*\n\nContoh:\n`#ADD#Tooling#Punch M6#5#2026-07-24#2026-09-24`');
      return;
    }

    const itemType = parts[2].trim();
    const itemName = parts[3].trim();
    const qty = parseInt(parts[4].trim(), 10);
    const orderDate = parts[5].trim();
    const etaDate = parts[6] ? parts[6].trim() : '';

    if (isNaN(qty) || qty <= 0) {
      await msg.reply('❌ Qty harus berupa angka yang valid.');
      return;
    }

    try {
      const docId = createDocId(itemName);
      const docRef = toolingCol.doc(docId);

      await docRef.set({
        item_type: itemType,
        item_name: itemName,
        qty: qty,
        order_date: orderDate,
        eta_date: etaDate,
        eta: etaDate,
        status: 'ORDERED',
        type: 'New',
        created_via: 'WhatsApp',
        sender_number: msg.from,
        updated_at: new Date().toISOString()
      }, { merge: true });

      await msg.reply(`✅ *DATA TOOLING BERHASIL DISIMPAN / DIPERBARUI!*\n\n📌 *Tipe:* ${itemType}\n📌 *Item:* ${itemName}\n📌 *Qty:* ${qty}\n📌 *Order Date:* ${orderDate}\n📌 *ETA:* ${etaDate || 'Belum diisi'}`);
    } catch (error) {
      console.error('Gagal simpan ADD:', error);
      await msg.reply('❌ Terjadi kesalahan saat menyimpan data.');
    }
    return;
  }

  // D. INPUT UPDATE ETA / STATUS DONE (#UPDATE)
  if (body.startsWith('#UPDATE#')) {
    const parts = body.split('#');

    if (parts.length < 4) {
      await msg.reply('❌ Format #UPDATE salah!\nGunakan: *#UPDATE#NAMA_ITEM#ETA_ATAU_DONE*\n\nContoh Update ETA:\n`#UPDATE#Punch M6#2026-08-25`\n\nContoh Done (Hapus dari DB):\n`#UPDATE#Punch M6#DONE`');
      return;
    }

    const itemName = parts[2].trim();
    const value = parts[3].trim().toUpperCase();

    try {
      const docId = createDocId(itemName);
      const docRef = toolingCol.doc(docId);

      if (value === 'DONE' || value === 'ARRIVED' || value === 'SELESAI') {
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          await msg.reply(`⚠️ Item *${itemName}* tidak ditemukan di database.`);
          return;
        }

        await docRef.delete();
        await msg.reply(`🎉 *TOOLING SELESAI & DIHAPUS!*\n\nItem *${itemName}* telah berstatus *${value}* (Sudah Sampai) dan otomatis dihapus dari database.`);
      } else {
        await docRef.set({
          item_name: itemName,
          eta_date: value,
          eta: value,
          status: 'ON PROGRESS',
          updated_at: new Date().toISOString()
        }, { merge: true });

        await msg.reply(`✅ *UPDATE ETA BERHASIL DICATAT!*\n\n📌 *Item:* ${itemName}\n📌 *ETA Baru:* ${value}`);
      }
    } catch (error) {
      console.error('Gagal simpan UPDATE:', error);
      await msg.reply('❌ Terjadi kesalahan saat memproses update.');
    }
    return;
  }
});

// Jalankan WhatsApp Client
client.initialize();