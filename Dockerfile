FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# أضف هذا السطر (تأكد من اختيار الرقم الذي يستخدمه تطبيقك في الكود)
EXPOSE 3000

CMD ["npm", "start"]
