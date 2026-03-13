@echo off
title Reset School Database
cls
echo ==========================================
echo    School System Database Resetter
echo ==========================================
echo.

echo [1/2] Stopping existing server (if running)...
taskkill /f /im node.exe >nul 2>&1

echo [2/2] Resetting school.json to empty state...
(
echo {
echo   "subjects": [],
echo   "teachers": [],
echo   "teacher_schedules": [],
echo   "students": [],
echo   "student_registrations": [],
echo   "enrollment_requests": [],
echo   "config": {
echo     "teacher_pin": "@dmin"
echo   }
echo }
) > school.json

echo.
echo ==========================================
echo    RESET COMPLETE! 
echo    Data has been cleared successfully.
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
exit