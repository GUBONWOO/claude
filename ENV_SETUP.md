# 환경 변수 설정 가이드

## 📋 필수 설정

프로젝트를 실행하기 전에 `.env` 파일을 설정해야 합니다.

### 1️⃣ .env 파일 생성

`.env.example` 파일을 복사하여 `.env` 파일을 만듭니다:

```bash
cp .env.example .env
```

### 2️⃣ 데이터베이스 비밀번호 입력

`.env` 파일을 열어서 `DB_PASSWORD`에 PostgreSQL 비밀번호를 입력하세요:

```env
DB_PASSWORD=your_actual_password_here
```

## 🔧 환경 변수 설명

### 백엔드 서버
- `PORT`: Express 서버 포트 (기본값: 3001)

### PostgreSQL 데이터베이스 (필수)
- `DB_HOST`: 데이터베이스 호스트 (예: localhost)
- `DB_PORT`: 데이터베이스 포트 (예: 6055)
- `DB_NAME`: 데이터베이스 이름 (예: bike)
- `DB_USER`: 데이터베이스 사용자명
- `DB_PASSWORD`: 데이터베이스 비밀번호 ⚠️ **필수 입력**

### 프론트엔드
- `REACT_APP_API_URL`: 백엔드 API URL (기본값: http://localhost:3001)

## ⚠️ 주의사항

1. **DB_PASSWORD는 반드시 입력**해야 합니다. 비어있으면 서버가 시작되지 않습니다.
2. `.env` 파일은 Git에 업로드되지 않습니다 (보안).
3. `.env.example`은 예시 파일로 Git에 포함됩니다.

## 🚀 서버 실행

환경 변수 설정 후:

```bash
npm start
```

## 🔍 문제 해결

**에러 메시지: "Missing required environment variables"**
- `.env` 파일이 있는지 확인
- 모든 필수 환경 변수가 설정되어 있는지 확인
- `DB_PASSWORD`가 비어있지 않은지 확인
