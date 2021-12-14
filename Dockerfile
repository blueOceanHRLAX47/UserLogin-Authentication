FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

WORKDIR /usr/src/app/Cultivate_Frontend

COPY Cultivate_Frontend/package*.json ./
RUN npm install

COPY . .

RUN npm run build

WORKDIR /usr/src/app

EXPOSE 3000

CMD [ "node", "server/index.js" ]