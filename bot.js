const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const http = require('http');
require('dotenv').config();

// 1. خادم فحص الحالة (Health Check)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is alive!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server listening on port ${PORT}`);
});

// 2. إعداد Firebase
// ملاحظة: تأكد أن ملف .json موجود فعلياً في نفس المجلد
try {
    const serviceAccount = require('./test-ff854-firebase-adminsdk-1y0kq-c26cc58bb9.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase connected");
} catch (e) {
    console.error("❌ Firebase error: ملف الـ JSON غير موجود أو به خطأ");
}

const db = admin.firestore();

// 3. إعداد البوت
if (!process.env.BOT_TOKEN) {
    console.error("❌ BOT_TOKEN is missing in environment variables!");
    process.exit(1);
}
const bot = new Telegraf(process.env.BOT_TOKEN);

// معالجة الأخطاء
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// رسالة ترحيب بسيطة للتجربة
bot.start((ctx) => ctx.reply('أهلاً بك! البوت يعمل الآن بنجاح وبشكل نظيف.'));

// 4. تشغيل البوت (مرة واحدة فقط وبإعدادات التنظيف)
bot.launch({
  dropPendingUpdates: true 
})
.then(() => console.log('✅ البوت يعمل الآن بتوكن جديد وبشكل نظيف!'))
.catch((error) => {
  console.error('❌ فشل تشغيل البوت:', error);
  process.exit(1);
});

// إيقاف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
