# استخدام نسخة مستقرة وحديثة
FROM node:20-slim

# إنشاء مجلد العمل
WORKDIR /app

# نسخ ملفات التعريف وتثبيت المكتبات
COPY package*.json ./
RUN npm install --production

# نسخ ملفات المشروع بالكامل (تأكد أن ملف Firebase JSON ضمنها)
COPY . .

# فتح المنفذ الذي يطلبه Back4app
EXPOSE 3000

# أمر التشغيل
CMD ["npm", "start"]
