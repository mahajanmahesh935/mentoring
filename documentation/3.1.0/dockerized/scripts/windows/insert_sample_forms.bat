@echo off
setlocal enabledelayedexpansion

REM Exit on error
set "ERRORLEVEL=0"

REM Ensure correct number of arguments are provided
if "%~2"=="" (
    echo Error: Folder name and database URL not provided. Usage: %0 <folder_name> <database_url>
    exit /b 1
)

REM Use the provided folder name
set "FOLDER_NAME=sample-data\%~1"

REM Check if folder exists
if not exist "!FOLDER_NAME!" (
    echo Error: Folder '!FOLDER_NAME!' not found.
    exit /b 1
)

REM Use the provided database URL
set "DEV_DATABASE_URL=%~2"

REM Extract database credentials and connection details using for
for /f "tokens=4,5,6,7 delims=:@/" %%a in ("%DEV_DATABASE_URL%") do (
    set "DB_USER=%%a"
    set "DB_PASSWORD=%%b"
    set "DB_HOST=%%c"
    set "DB_PORT=%%d"
)

REM Extract DB_NAME
for /f "tokens=*" %%a in ("%DEV_DATABASE_URL%") do (
    for /f "delims=/ tokens=2" %%b in ("%%a") do set "DB_NAME=%%b"
)

REM Log database variables
echo Extracted Database Variables:
echo DB_USER: !DB_USER!
echo DB_PASSWORD: !DB_PASSWORD!
echo DB_HOST: !DB_HOST!
echo DB_PORT: !DB_PORT!
echo DB_NAME: !DB_NAME!

REM Define the container name (same as DB_HOST)
set "CONTAINER_NAME=!DB_HOST!"

REM Wait for Docker container to be up
echo Waiting for Docker container '!CONTAINER_NAME!' to be up...
:waitForContainer
docker inspect "!CONTAINER_NAME!" >nul 2>&1
if errorlevel 1 (
    echo Waiting for container...
    timeout /t 1 >nul
    goto waitForContainer
)
echo Container is now up.

REM Wait for PostgreSQL to be ready to accept connections
echo Waiting for PostgreSQL on '!DB_HOST!:!DB_PORT!' to accept connections...
:waitForDB
docker exec "!CONTAINER_NAME!" pg_isready -h localhost -p !DB_PORT! -U !DB_USER! >nul 2>&1
if errorlevel 1 (
    echo Waiting for database to be ready...
    timeout /t 1 >nul
    goto waitForDB
)
echo Database is ready.

REM Function to check if the database exists
:checkDatabase
docker exec "!CONTAINER_NAME!" psql -h localhost -U !DB_USER! -p !DB_PORT! -lqt | findstr /i /c:"!DB_NAME!" >nul
exit /b %errorlevel%

echo Checking existence of database '!DB_NAME!'...
:waitForDBExistence
call :checkDatabase
if errorlevel 1 (
    echo Database '!DB_NAME!' does not exist, waiting...
    timeout /t 5 >nul
    goto waitForDBExistence
)
echo Database '!DB_NAME!' exists, proceeding with script.

REM ------------------------------------------------------------
REM New code to push `forms.sql` data into the database
REM ------------------------------------------------------------

set "DEFAULT_FORM_FOLDER_LOCATION=!FOLDER_NAME!"

REM Ensure create_default_form_sql.bat is executable
call create_default_form_sql.bat "!FOLDER_NAME!"

set "FORMS_SQL_FILE=forms.sql"
if not exist "!FORMS_SQL_FILE!" (
    echo Error: forms.sql not found.
    exit /b 1
)

echo Copying forms.sql to container '!CONTAINER_NAME!'...
docker cp "!FORMS_SQL_FILE!" "!CONTAINER_NAME!:/forms.sql"

echo Inserting Forms Data from forms.sql...
docker exec --user "!DB_USER!" "!CONTAINER_NAME!" psql -h localhost -U !DB_USER! -d !DB_NAME! -p !DB_PORT! -f /forms.sql

echo Forms Data Insertion Completed
