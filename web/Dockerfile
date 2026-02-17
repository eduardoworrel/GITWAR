FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_S2_STREAM=game-state
ARG VITE_S2_BASIN=gitworld
ARG VITE_CLERK_PUBLISHABLE_KEY

ENV VITE_S2_STREAM=$VITE_S2_STREAM
ENV VITE_S2_BASIN=$VITE_S2_BASIN
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
