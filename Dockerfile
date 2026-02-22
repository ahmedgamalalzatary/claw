FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src
COPY config.json ./config.json
COPY workspace ./workspace

RUN apk add --no-cache git
RUN npm install
RUN npm run build

CMD ["npm", "start"]

