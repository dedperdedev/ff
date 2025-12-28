# Скрипт для загрузки проекта на GitHub
# Использование: .\deploy-to-github.ps1

Write-Host "=== Загрузка проекта на GitHub ===" -ForegroundColor Green

# Проверка наличия репозитория
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nСоздайте репозиторий на GitHub:" -ForegroundColor Yellow
    Write-Host "1. Перейдите на https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Введите название репозитория (например: trading-bot-ui)" -ForegroundColor Cyan
    Write-Host "3. НЕ добавляйте README, .gitignore или лицензию" -ForegroundColor Cyan
    Write-Host "4. Нажмите 'Create repository'" -ForegroundColor Cyan
    
    $repoName = Read-Host "`nВведите название вашего GitHub репозитория"
    $username = Read-Host "Введите ваш GitHub username"
    
    if ($repoName -and $username) {
        $repoUrl = "https://github.com/$username/$repoName.git"
        git remote add origin $repoUrl
        Write-Host "`nРепозиторий подключен: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "Ошибка: не указаны данные" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Репозиторий уже подключен: $remote" -ForegroundColor Green
}

# Push на GitHub
Write-Host "`nЗагрузка на GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Проект успешно загружен на GitHub!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Ошибка при загрузке. Проверьте:" -ForegroundColor Red
    Write-Host "- Правильность URL репозитория" -ForegroundColor Yellow
    Write-Host "- Настройки авторизации GitHub" -ForegroundColor Yellow
    Write-Host "- Наличие интернет-соединения" -ForegroundColor Yellow
}





