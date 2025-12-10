FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
ARG REACT_APP_GMAPS_API_KEY
ENV REACT_APP_GMAPS_API_KEY=$REACT_APP_GMAPS_API_KEY
RUN npm install
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]