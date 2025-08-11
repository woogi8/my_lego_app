@echo off
title LEGO 관리 시스템 - 전체 실행
echo 🧱 LEGO 관리 시스템 전체 실행
echo.
echo 📡 백엔드 서버를 시작합니다...
start "LEGO Backend Server" cmd /k "cd /d server && node server.js"

echo ⏳ 서버 시작을 기다리는 중... (3초)
timeout /t 3 /nobreak >nul

echo 🌐 프론트엔드 앱을 시작합니다...
echo.
echo 🔗 브라우저에서 http://localhost:3000 (서버) 와 React 앱이 자동으로 열립니다.
echo ⚠️  서버 창을 닫으면 로그인이 작동하지 않습니다!
echo.
npm start