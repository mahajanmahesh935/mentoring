@echo off
setlocal

:: Exit on error
setlocal EnableDelayedExpansion

:: Define the GitHub raw URL for the JSON file
set "GITHUB_REPO=https://raw.githubusercontent.com/ELEVATE-Project/mentoring-mobile-app/refs/heads/release-3.1.0/forms.json"
set "JSON_FILE=forms.json"

:: set organization_id
set "organization_id=1"


:: Check if the output directory is passed as an argument, otherwise use the current directory
if "%~2"=="" (
    set "OUTPUT_DIR=."
) else (
    set "OUTPUT_DIR=%~2"
)

:: Ensure the directory exists
if not exist "!OUTPUT_DIR!" (
    echo Error: Directory '!OUTPUT_DIR!' does not exist.
    exit /b 1
)

:: Define the output file path in the specified directory
set "SQL_OUTPUT_FILE=!OUTPUT_DIR!\forms.sql"

:: Fetch the JSON file from the GitHub repository
echo Fetching JSON file from GitHub...
curl -o "!JSON_FILE!" "!GITHUB_REPO!"

:: Check if the download was successful
if errorlevel 1 (
    echo Failed to download JSON file from GitHub.
    exit /b 1
)

:: Append 'SELECT NULL;' to the end of the SQL file
echo delete from forms; > "!SQL_OUTPUT_FILE!"

:: Create or overwrite the SQL output file
echo Generating SQL insert statements...
>> "!SQL_OUTPUT_FILE!" (
    echo.

    :: Initialize ID counter starting from 1
    set /a id_counter=1

    :: Use PowerShell to parse JSON and generate SQL
    for /f "usebackq delims=" %%i in (`powershell -command "Get-Content '!JSON_FILE!' | ConvertFrom-Json | ForEach-Object { 'INSERT INTO forms (id, type, sub_type, data, version, organization_id) VALUES (' + [int]$env:id_counter + ', ''$($_.type)'', ''$($_.sub_type)'', ''$($_.data | ConvertTo-Json -Compress -Depth 100)'', 1, ''!organization_id!'');' }"`) do (
        echo %%i
        set /a id_counter+=1
    )
)

:: Append 'SELECT NULL;' to the end of the SQL file
echo SELECT NULL; >> "!SQL_OUTPUT_FILE!"

echo SQL file generated: "!SQL_OUTPUT_FILE!"

endlocal
