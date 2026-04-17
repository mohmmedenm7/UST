const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
require('dotenv').config();

// ─────────────────────────────────────────────
//  إعداد Firebase
// ─────────────────────────────────────────────
const serviceAccount = require('./test-ff854-firebase-adminsdk-1y0kq-c26cc58bb9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─────────────────────────────────────────────
//  إعداد البوت
// ─────────────────────────────────────────────
const bot = new Telegraf(process.env.BOT_TOKEN);

// ─────────────────────────────────────────────
//  دوال مساعدة
// ─────────────────────────────────────────────

/**
 * تحويل رابط Google Drive العادي إلى رابط تحميل مباشر
 * @param {string} url - رابط Google Drive
 * @returns {string} رابط التحميل المباشر
 */
const toDirectDownloadUrl = (url) => {
  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

// ─────────────────────────────────────────────
//  دوال التعامل مع Firestore
// ─────────────────────────────────────────────

/**
 * جلب جميع المواد من Firestore
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
const getSubjects = async () => {
  const snapshot = await db.collection('subjects').get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));
};

/**
 * جلب دروس مادة معينة
 * @param {string} subjectId - معرّف المادة
 * @returns {Promise<Array<{id: string, title: string}>>}
 */
const getLessons = async (subjectId) => {
  const snapshot = await db
    .collection('subjects')
    .doc(subjectId)
    .collection('lessons')
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
  }));
};

/**
 * جلب تفاصيل درس معيّن
 * @param {string} subjectId - معرّف المادة
 * @param {string} lessonId  - معرّف الدرس
 * @returns {Promise<Object|null>}
 */
const getLessonDetails = async (subjectId, lessonId) => {
  const doc = await db
    .collection('subjects')
    .doc(subjectId)
    .collection('lessons')
    .doc(lessonId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return { id: doc.id, ...doc.data() };
};

// ─────────────────────────────────────────────
//  أمر /start — عرض المواد
// ─────────────────────────────────────────────
bot.start(async (ctx) => {
  try {
    const subjects = await getSubjects();

    if (subjects.length === 0) {
      return ctx.reply('⚠️ لا توجد مواد متاحة حالياً.');
    }

    // بناء أزرار Inline لكل مادة
    const buttons = subjects.map((subject) =>
      [Markup.button.callback(`📚 ${subject.name}`, `subject_${subject.id}`)]
    );

    await ctx.reply(
      '🎓 *مرحباً بك في بوت الجامعة!*\n\nاختر المادة التي تريد استعراض دروسها:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('خطأ في جلب المواد:', error);
    await ctx.reply('❌ حدث خطأ أثناء جلب المواد. حاول مرة أخرى لاحقاً.');
  }
});

// ─────────────────────────────────────────────
//  عند اختيار مادة — عرض الدروس
// ─────────────────────────────────────────────
bot.action(/^subject_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const subjectId = ctx.match[1];
    const lessons = await getLessons(subjectId);

    if (lessons.length === 0) {
      return ctx.editMessageText('⚠️ لا توجد دروس متاحة لهذه المادة بعد.');
    }

    // بناء أزرار Inline لكل درس (مع تمرير معرّف المادة والدرس)
    const buttons = lessons.map((lesson) =>
      [Markup.button.callback(`📖 ${lesson.title}`, `lesson_${subjectId}_${lesson.id}`)]
    );

    // زر رجوع للقائمة الرئيسية
    buttons.push([Markup.button.callback('🔙 رجوع للمواد', 'back_to_subjects')]);

    await ctx.editMessageText(
      '📚 *اختر الدرس:*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('خطأ في جلب الدروس:', error);
    await ctx.reply('❌ حدث خطأ أثناء جلب الدروس. حاول مرة أخرى لاحقاً.');
  }
});

// ─────────────────────────────────────────────
//  عند اختيار درس — عرض التفاصيل
// ─────────────────────────────────────────────
bot.action(/^lesson_(.+)_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const subjectId = ctx.match[1];
    const lessonId = ctx.match[2];
    const lesson = await getLessonDetails(subjectId, lessonId);

    if (!lesson) {
      return ctx.editMessageText('⚠️ لم يتم العثور على هذا الدرس.');
    }

    // بناء نص الرسالة
    let message = `📖 *${lesson.title}*\n\n`;
    message += lesson.description
      ? `📝 ${lesson.description}`
      : '📝 لا يوجد وصف لهذا الدرس.';

    // أزرار: رجوع
    const buttons = [
      [Markup.button.callback('🔙 رجوع للدروس', `subject_${subjectId}`)],
      [Markup.button.callback('🏠 القائمة الرئيسية', 'back_to_subjects')],
    ];

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    });

    // إرسال الملف مباشرة في المحادثة
    if (lesson.url) {
      const downloadUrl = toDirectDownloadUrl(lesson.url);
      await ctx.replyWithDocument(
        { url: downloadUrl, filename: `${lesson.title}.pdf` },
        { caption: `📥 ${lesson.title}` }
      );
    }
  } catch (error) {
    console.error('خطأ في جلب تفاصيل الدرس:', error);
    await ctx.reply('❌ حدث خطأ أثناء جلب تفاصيل الدرس. حاول مرة أخرى لاحقاً.');
  }
});

// ─────────────────────────────────────────────
//  زر الرجوع — العودة لقائمة المواد
// ─────────────────────────────────────────────
bot.action('back_to_subjects', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const subjects = await getSubjects();

    if (subjects.length === 0) {
      return ctx.editMessageText('⚠️ لا توجد مواد متاحة حالياً.');
    }

    const buttons = subjects.map((subject) =>
      [Markup.button.callback(`📚 ${subject.name}`, `subject_${subject.id}`)]
    );

    await ctx.editMessageText(
      '🎓 *اختر المادة التي تريد استعراض دروسها:*',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      }
    );
  } catch (error) {
    console.error('خطأ في الرجوع:', error);
    await ctx.reply('❌ حدث خطأ. حاول مرة أخرى لاحقاً.');
  }
});

// ─────────────────────────────────────────────
//  تشغيل البوت
// ─────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🤖 البوت يعمل الآن...'))
  .catch((error) => console.error('❌ فشل تشغيل البوت:', error));

// إيقاف آمن عند إنهاء العملية
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));