FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time переменные. Vite вшивает их в бандл на этапе `npm run build`,
# поэтому это именно ARG, а не runtime-ENV.
ARG VITE_YANDEX_MAPS_API_KEY=""
ARG VITE_API_BASE_URL=""
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN if [ ! -f api-key.txt ]; then printf '' > api-key.txt; fi
RUN if [ -n "$VITE_YANDEX_MAPS_API_KEY" ]; then printf '%s' "$VITE_YANDEX_MAPS_API_KEY" > api-key.txt; fi
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# В Timeweb Cloud Apps ключ Яндекса можно прокинуть как build-arg
# (запекается в /api-key.txt при сборке), а можно как runtime env:
# тогда CMD ниже перезапишет файл при старте контейнера.
CMD ["/bin/sh", "-c", "if [ -n \"$VITE_YANDEX_MAPS_API_KEY\" ]; then printf '%s' \"$VITE_YANDEX_MAPS_API_KEY\" > /usr/share/nginx/html/api-key.txt; fi && exec nginx -g 'daemon off;'"]
