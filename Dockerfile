FROM apify/actor-node:16

WORKDIR /app
COPY package*.json ./
RUN npm install

RUN npx playwright install chromium --with-deps

COPY . .

CMD ["node", "scrape.js"]