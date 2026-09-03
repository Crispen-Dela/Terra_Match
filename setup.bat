@echo off
echo ===================================================
echo   TerraMatch Full-Stack Startup Setup Script
echo ===================================================
echo.
echo [1/4] Installing Frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Installing Backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Initializing PostgreSQL Schema with Prisma...
call npx prisma db push
if %errorlevel% neq 0 (
    echo Error pushing database schema. Please ensure PostgreSQL is running.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Seeding Database with Ghanaian Land Listings & Contractors...
node prisma/seed.js
if %errorlevel% neq 0 (
    echo Error seeding database.
    pause
    exit /b %errorlevel%
)

cd ..
echo.
echo ===================================================
echo   🎉 Setup Completed Successfully!
echo   Run start.bat or 'npm run dev:all' to launch.
echo ===================================================
pause
