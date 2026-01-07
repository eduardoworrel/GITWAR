FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ARG VITE_S2_STREAM=game-state
ARG VITE_S2_BASIN=gitworld

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_S2_STREAM=$VITE_S2_STREAM
ENV VITE_S2_BASIN=$VITE_S2_BASIN

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
