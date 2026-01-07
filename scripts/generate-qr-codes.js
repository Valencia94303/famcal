const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const HOST_IP = '192.168.1.47';
const PORT = 3000;

const cards = [
  { name: 'miguelito', cardId: 'card-miguelito-001' },
  { name: 'maggie', cardId: 'card-maggie-001' },
];

const outputDir = path.join(__dirname, '..', 'public', 'qr-codes');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateQRCodes() {
  for (const card of cards) {
    const url = `http://${HOST_IP}:${PORT}/pos?card=${card.cardId}`;
    const filename = path.join(outputDir, `${card.name}-pos-qr.png`);

    await QRCode.toFile(filename, url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    console.log(`✅ Generated QR code for ${card.name}:`);
    console.log(`   URL: ${url}`);
    console.log(`   File: ${filename}`);
    console.log('');
  }

  console.log('🎉 All QR codes generated in public/qr-codes/');
  console.log('');
  console.log('View them at:');
  console.log(`   http://${HOST_IP}:${PORT}/qr-codes/miguelito-pos-qr.png`);
  console.log(`   http://${HOST_IP}:${PORT}/qr-codes/maggie-pos-qr.png`);
}

generateQRCodes().catch(console.error);
