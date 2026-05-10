FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install

COPY . .
RUN npm run build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
