FROM node:18 AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . ./
RUN yarn build

FROM nginx:1.25.2-alpine

WORKDIR /app
ADD ./default.conf.template /etc/nginx/conf.d/default.conf.template
RUN apk update \
   && apk upgrade \
   && apk add --no-cache openssl \
   && apk add --no-cache certbot
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
