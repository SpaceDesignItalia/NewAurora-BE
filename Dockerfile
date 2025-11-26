FROM node:22.16

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
