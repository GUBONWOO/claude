# ========================================
# Stage 1: React 빌드
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드 시점 환경변수 주입
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ========================================
# Stage 2: 프로덕션 실행
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# React 빌드 결과물 복사
COPY --from=builder /app/build ./build

# 백엔드 파일 복사
COPY proxy-server.js ./
COPY database/ ./database/

# Railway는 환경변수로 PORT를 주입 (Railway는 PORT 사용)
ENV SERVER_PORT=8080

EXPOSE 8080

CMD ["node", "proxy-server.js"]
