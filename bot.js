const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const http = require('http'); // أضفنا هذا السطر
require('dotenv').config();

// ─────────────────────────────────────────────
// إعداد خادم ويب بسيط لإرضاء فحص الحالة (Health Check)
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server listening on port ${PORT}`);
});

// ─────────────────────────────────────────────
// إعداد Firebase
// ─────────────────────────────────────────────
// تأكد أن ملف الـ JSON موجود في المجلد الرئيسي أو استخدم متغيرات البيئة
const serviceAccount = require('./test-ff854-firebase-adminsdk-1y0kq-c26cc58bb9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─────────────────────────────────────────────
// إعداد البوت
// ─────────────────────────────────────────────
const bot = new Telegraf(process.env.BOT_TOKEN);

// ... (بقية دوال المساعدة والتعامل مع Firestore كما هي في كودك) ...

// ─────────────────────────────────────────────
// تشغيل البوت
// ─────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🤖 البوت يعمل الآن...'))
  .catch((error) => {
    console.error('❌ فشل تشغيل البوت:', error);
    process.exit(1); // إنهاء العملية في حال فشل البوت
  });

// إيقاف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
