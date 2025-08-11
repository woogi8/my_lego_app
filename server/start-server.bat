@echo off
echo 🚀 LEGO 관리 시스템 서버 시작 중...
echo 📡 서버 주소: http://localhost:3000
echo ⚠️  서버를 종료하려면 Ctrl+C를 누르세요
echo.
cd /d "%~dp0"
node server.js
pause