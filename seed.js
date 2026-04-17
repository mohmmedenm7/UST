/**
 * سكريبت لإضافة بيانات تجريبية إلى Firestore
 * شغّل هذا الملف مرة واحدة لملء قاعدة البيانات ببيانات نموذجية
 *
 *   node seed.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./test-ff854-firebase-adminsdk-1y0kq-c26cc58bb9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─────────────────────────────────────────────
//  بيانات تجريبية
// ─────────────────────────────────────────────
const sampleData = [
  {
    name: 'الرياضيات',
    lessons: [
      {
        title: 'المشتقات',
        description: 'شرح مفهوم المشتقات وقواعد الاشتقاق الأساسية.',
        pdfUrl: 'https://example.com/derivatives.pdf',
      },
      {
        title: 'التكاملات',
        description: 'مقدمة في التكامل المحدود وغير المحدود.',
        pdfUrl: 'https://example.com/integrals.pdf',
      },
      {
        title: 'المصفوفات',
        description: 'العمليات على المصفوفات وخصائصها.',
        pdfUrl: 'https://example.com/matrices.pdf',
      },
    ],
  },
  {
    name: 'البرمجة',
    lessons: [
      {
        title: 'مقدمة في JavaScript',
        description: 'أساسيات لغة JavaScript والمتغيرات والدوال.',
        pdfUrl: 'https://example.com/js-intro.pdf',
      },
      {
        title: 'Node.js',
        description: 'بناء تطبيقات الخادم باستخدام Node.js.',
        pdfUrl: 'https://example.com/nodejs.pdf',
      },
    ],
  },
  {
    name: 'الفيزياء',
    lessons: [
      {
        title: 'الميكانيكا الكلاسيكية',
        description: 'قوانين نيوتن للحركة وتطبيقاتها.',
        pdfUrl: 'https://example.com/mechanics.pdf',
      },
      {
        title: 'الكهرومغناطيسية',
        description: 'المجالات الكهربائية والمغناطيسية وقوانين ماكسويل.',
        pdfUrl: 'https://example.com/electromagnetism.pdf',
      },
    ],
  },
];

// ─────────────────────────────────────────────
//  إضافة البيانات إلى Firestore
// ─────────────────────────────────────────────
const seedDatabase = async () => {
  console.log('⏳ جاري إضافة البيانات التجريبية...\n');

  for (const subject of sampleData) {
    // إنشاء مستند المادة
    const subjectRef = await db.collection('subjects').add({
      name: subject.name,
    });
    console.log(`📚 تمت إضافة المادة: ${subject.name} (${subjectRef.id})`);

    // إضافة الدروس كـ sub-collection
    for (const lesson of subject.lessons) {
      const lessonRef = await subjectRef.collection('lessons').add({
        title: lesson.title,
        description: lesson.description,
        pdfUrl: lesson.pdfUrl,
      });
      console.log(`   📖 تمت إضافة الدرس: ${lesson.title} (${lessonRef.id})`);
    }
  }

  console.log('\n✅ تمت إضافة جميع البيانات بنجاح!');
  process.exit(0);
};

seedDatabase().catch((error) => {
  console.error('❌ خطأ أثناء إضافة البيانات:', error);
  process.exit(1);
});
