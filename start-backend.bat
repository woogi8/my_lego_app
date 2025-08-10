@echo off
echo Starting LEGO Management Backend Server...
echo.

cd server
echo Installing dependencies...
call npm install

echo.
echo Starting server...
call npm start

pause