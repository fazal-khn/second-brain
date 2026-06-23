FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build step is needed if running next start, but we can also run dev in dev environments.
# To keep this container compatible with both dev and production, we build the application.
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
