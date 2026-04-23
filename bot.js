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

// 2. إعداد Firebase باستخدام متغيرات البيئة (الأكثر أماناً)
try {
    // نقوم ببناء كائن الاعتماد من المتغيرات التي أضفتها في إعدادات Back4app
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // السطر أدناه يعالج مشكلة الرموز في المفتاح الخاص (Private Key)
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    };

    if (!firebaseConfig.projectId || !firebaseConfig.privateKey) {
        throw new Error("بيانات Firebase مفقودة في إعدادات البيئة (Environment Variables)");
    }

    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
    console.log("✅ Firebase connected successfully via Environment Variables");
} catch (e) {
    console.error("❌ Firebase error:", e.message);
}

const db = admin.firestore();

// 3. إعداد البوت
if (!process.env.BOT_TOKEN) {
    console.error("❌ BOT_TOKEN is missing!");
    process.exit(1);
}
const bot = new Telegraf(process.env.BOT_TOKEN);

// معالجة الأخطاء
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// رسالة ترحيب بسيطة
bot.start((ctx) => ctx.reply('أهلاً بك! البوت يعمل الآن بنجاح وبشكل نظيف وآمن.'));

// 4. تشغيل البوت (مرة واحدة وبإعدادات التنظيف)
bot.launch({
  dropPendingUpdates: true 
})
.then(() => console.log('✅ البوت يعمل الآن وبدون أي تعارض!'))
.catch((error) => {
  console.error('❌ فشل تشغيل البوت:', error);
});

// إيقاف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
