# 🚀 Vercel 배포 가이드

## ⚠️ 현재 상태와 Vercel 배포 문제점

### 현재 구조의 문제
1. **Express 서버**: Vercel은 서버리스 환경이라 Express 서버 직접 실행 불가
2. **로컬 엑셀 파일**: 서버리스 환경에서 파일 시스템 접근 제한
3. **localhost:3000**: 프로덕션에서는 로컬호스트 사용 불가

## 📦 Vercel 배포를 위한 해결 방안

### Option 1: Vercel Functions 사용 (부분 구현됨)
```
/api/auth/login.js - 로그인 API (Supabase 직접 연결) ✅
/api/legos/*.js - 레고 데이터 API (구현 필요) ⏳
```

### Option 2: 백엔드 분리 배포 (추천)
1. **프론트엔드**: Vercel에 배포
2. **백엔드**: 다른 서비스에 배포
   - Render.com (무료)
   - Railway.app
   - Heroku
   - AWS EC2

### Option 3: 완전한 Supabase 마이그레이션
- 엑셀 파일 대신 Supabase 데이터베이스 사용
- Supabase의 내장 API 활용
- 파일 저장소는 Supabase Storage 사용

## 🔧 Vercel 배포 방법

### 1. 환경 변수 설정 (Vercel Dashboard)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
REACT_APP_API_URL=/api
```

### 2. 배포 명령어
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 주의사항
- 현재 엑셀 파일 기반 기능은 작동하지 않음
- 로그인 기능만 Vercel Functions로 구현됨
- 레고 데이터 CRUD는 추가 구현 필요

## 🎯 추천 솔루션

### 즉시 배포 가능한 방법:
1. **백엔드 서버를 Render.com에 배포**
   - server 폴더를 별도 저장소로 분리
   - Render.com에 Node.js 앱으로 배포
   - 무료 플랜 사용 가능

2. **프론트엔드를 Vercel에 배포**
   - REACT_APP_API_URL을 Render 서버 URL로 설정
   - 예: https://your-app.onrender.com/api

3. **데이터 저장소 변경**
   - 엑셀 파일 → Supabase 데이터베이스
   - 이미 lego_user 테이블 사용 중이므로 확장 가능

## 📝 결론

**현재 코드로는 Vercel 배포 시 제한적으로만 작동합니다.**

완전한 배포를 위해서는:
1. 백엔드를 별도 서비스에 배포하거나
2. 모든 API를 Vercel Functions로 재작성하거나
3. Supabase로 완전히 마이그레이션 필요

가장 빠른 방법은 **백엔드 분리 배포**입니다.