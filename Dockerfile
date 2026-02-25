FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src
COPY config.json ./config.json
COPY workspace ./workspace

RUN npm install && apk add --no-cache git
RUN npm run build

CMD ["npm", "start"]

