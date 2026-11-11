# 멀티스테이지: node 로 Vite 빌드 → python 으로 dist 정적 서빙(+horizon 프록시).
FROM node:22-slim AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY --from=build /src/dist ./dist
COPY server.py ./
ENV PORT=8080
EXPOSE 8080
CMD ["python", "server.py"]
