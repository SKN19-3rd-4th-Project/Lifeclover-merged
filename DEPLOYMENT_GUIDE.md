# Lifeclover Docker 배포 실행 가이드

## ✅ 사전 준비 확인

1. Docker Desktop 설치 확인:
```bash
docker --version
docker-compose --version
```

2. 프로젝트 디렉토리로 이동:
```bash
cd c:\Projects\Lifeclover-merged
```

---

## 🚀 Phase 1: 로컬 개발 환경 테스트

### 1-1. 환경 변수 설정
```bash
# .env 파일 생성 (.env.example 복사)
copy .env.example .env

# .env 파일 편집 (메모장 또는 VS Code)
notepad .env
```

**필수 수정 항목**:
- `OPENAI_API_KEY`: OpenAI API 키 입력
- `ANTHROPIC_API_KEY`: Anthropic API 키 입력 (선택사항)
- `SECRET_KEY`: 랜덤 문자열로 변경

### 1-2. Docker 빌드 및 실행
```bash
# 개발 모드로 실행
docker-compose up --build

# 백그라운드 실행 (추천)
docker-compose up -d --build
```

### 1-3. 로그 확인
```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f web
docker-compose logs -f db
```

### 1-4. 데이터베이스 마이그레이션
```bash
docker-compose exec web python manage.py migrate
```

### 1-5. 슈퍼유저 생성
```bash
docker-compose exec web python manage.py createsuperuser
```

### 1-6. 브라우저 테스트
브라우저에서 접속: http://localhost:8000

### 1-7. 중지 및 정리
```bash
# 중지
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

---

## 🌐 Phase 2: 프로덕션 배포 준비

### 2-1. 프로덕션 환경 변수 설정
```bash
# .env 파일에서 프로덕션 설정 수정
notepad .env
```

**변경 항목**:
```env
DEBUG=False
SECRET_KEY=매우-복잡한-랜덤-키-50자-이상
DB_PASSWORD=강력한-비밀번호-변경-필수
DB_ROOT_PASSWORD=강력한-루트-비밀번호
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-ip-address
```

### 2-2. 프로덕션 모드 테스트
```bash
# 프로덕션 compose 파일로 실행
docker-compose -f docker-compose.prod.yml up --build -d

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 마이그레이션
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# 정적 파일 수집 (자동으로 되지만 확인용)
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

### 2-3. 브라우저 테스트
브라우저에서 접속: http://localhost

### 2-4. 중지
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## ☁️ Phase 3: AWS Lightsail 배포

### 3-1. Lightsail 인스턴스 생성

**AWS 콘솔에서 수행**:
1. AWS Lightsail 접속
2. "Create instance" 클릭
3. 설정:
   - Platform: Linux/Unix
   - Blueprint: OS Only → Ubuntu 22.04 LTS
   - Instance plan: $10/month (2GB RAM 권장)
4. 인스턴스 이름 입력 후 생성
5. "Networking" 탭에서 포트 열기:
   - HTTP (80)
   - HTTPS (443)
   - Custom (8000) - 테스트용

### 3-2. SSH 키 다운로드

AWS 콘솔에서:
1. "Account" → "SSH keys" → 키 다운로드
2. 키 파일을 안전한 위치에 저장

### 3-3. 고정 IP 할당

1. "Networking" 탭
2. "Create static IP"
3. 인스턴스에 연결

### 3-4. SSH 접속 테스트

**Windows (PowerShell)**:
```powershell
# SSH 키 권한 설정 (첫 접속 시만)
icacls "경로\LightsailDefaultKey.pem" /inheritance:r
icacls "경로\LightsailDefaultKey.pem" /grant:r "%username%:R"

# SSH 접속
ssh -i "경로\LightsailDefaultKey.pem" ubuntu@YOUR_LIGHTSAIL_IP
```

### 3-5. 서버 초기 설정

**Lightsail 서버에서 실행**:
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git 설치
sudo apt install git -y

# 재로그인 (Docker 권한 적용)
exit
```

다시 SSH 접속:
```powershell
ssh -i "경로\LightsailDefaultKey.pem" ubuntu@YOUR_LIGHTSAIL_IP
```

### 3-6. 프로젝트 가져오기

**Option A: Git Clone (추천)**
```bash
# GitHub에 푸시 후
git clone https://github.com/your-username/Lifeclover-merged.git
cd Lifeclover-merged
```

**Option B: 파일 업로드 (WinSCP 또는 scp)**
```powershell
# Windows에서 실행
scp -i "경로\LightsailDefaultKey.pem" -r c:\Projects\Lifeclover-merged ubuntu@YOUR_LIGHTSAIL_IP:~/
```

### 3-7. 환경 변수 설정

```bash
cd Lifeclover-merged

# .env 파일 생성 및 편집
nano .env
```

**.env 파일 내용** (.env.example 참고):
```env
DEBUG=False
SECRET_KEY=랜덤-SECRET-KEY-생성
ALLOWED_HOSTS=YOUR_LIGHTSAIL_IP,your-domain.com

DB_NAME=lcdb
DB_USER=django
DB_PASSWORD=강력한-비밀번호
DB_ROOT_PASSWORD=강력한-루트-비밀번호
DB_HOST=db
DB_PORT=3306

OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

저장: `Ctrl+X` → `Y` → `Enter`

### 3-8. 프로덕션 배포

```bash
# 프로덕션 모드로 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 로그 확인 (문제 발생 시)
docker-compose -f docker-compose.prod.yml logs -f

# 마이그레이션 (자동 실행되지만 확인)
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# 슈퍼유저 생성
docker-compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

### 3-9. 브라우저 접속 확인

```
http://YOUR_LIGHTSAIL_IP
```

### 3-10. 자동 시작 설정

```bash
# systemd 서비스 생성
sudo nano /etc/systemd/system/lifeclover.service
```

내용:
```ini
[Unit]
Description=Lifeclover Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/Lifeclover-merged
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

서비스 활성화:
```bash
sudo systemctl enable lifeclover.service
sudo systemctl start lifeclover.service

# 상태 확인
sudo systemctl status lifeclover.service
```

---

## 🔒 Phase 4: HTTPS 설정 (선택사항)

### 4-1. 도메인 연결

1. 도메인 DNS 설정:
   - A 레코드: `@` → Lightsail IP
   - A 레코드: `www` → Lightsail IP

2. DNS 전파 확인 (10분~24시간):
```bash
nslookup your-domain.com
```

### 4-2. SSL 인증서 발급

```bash
# Nginx 중지
docker-compose -f docker-compose.prod.yml stop nginx

# Certbot 설치
sudo apt install certbot -y

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 인증서 위치: /etc/letsencrypt/live/your-domain.com/
```

### 4-3. SSL 인증서 복사

```bash
# SSL 디렉토리 생성
mkdir -p nginx/ssl

# 인증서 복사
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

### 4-4. Nginx 설정 수정

```bash
nano nginx/nginx.conf
```

HTTPS 블록 주석 제거 및 도메인 수정 후 저장

### 4-5. 재시작

```bash
docker-compose -f docker-compose.prod.yml up -d --build nginx
```

### 4-6. 자동 갱신 설정

```bash
sudo crontab -e
```

추가:
```cron
0 2 1 * * certbot renew --pre-hook "docker-compose -f /home/ubuntu/Lifeclover-merged/docker-compose.prod.yml stop nginx" --post-hook "cp /etc/letsencrypt/live/your-domain.com/*.pem /home/ubuntu/Lifeclover-merged/nginx/ssl/ && docker-compose -f /home/ubuntu/Lifeclover-merged/docker-compose.prod.yml start nginx"
```

---

## 🔧 유용한 명령어

### Docker 명령어
```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f web

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart web

# Django 관리 명령 실행
docker-compose -f docker-compose.prod.yml exec web python manage.py <command>

# 데이터베이스 백업
docker-compose -f docker-compose.prod.yml exec db mysqldump -u django -p lcdb > backup.sql

# 데이터베이스 복원
docker-compose -f docker-compose.prod.yml exec -T db mysql -u django -p lcdb < backup.sql
```

### 시스템 모니터링
```bash
# 디스크 사용량
df -h

# 메모리 사용량
free -h

# Docker 리소스 사용량
docker stats

# 로그 파일 크기 확인
docker-compose -f docker-compose.prod.yml exec web ls -lh /app/*.log
```

---

## 🐛 트러블슈팅

### 문제 1: 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs web

# 전체 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### 문제 2: 데이터베이스 연결 실패
```bash
# DB 상태 확인
docker-compose -f docker-compose.prod.yml exec db mysqladmin -u root -p ping

# DB 로그 확인
docker-compose -f docker-compose.prod.yml logs db
```

### 문제 3: 정적 파일 404
```bash
# 정적 파일 재수집
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Nginx 재시작
docker-compose -f docker-compose.prod.yml restart nginx
```

### 문제 4: 메모리 부족
```bash
# Docker 리소스 정리
docker system prune -a

# 로그 파일 제한 (docker-compose.yml 이미 설정됨)
```

---

## 📊 다음 단계

- [ ] 모니터링 설정 (Uptime Robot 등)
- [ ] 자동 백업 스크립트
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] CDN 설정 (CloudFlare 등)

배포 완료 후 보안 체크리스트:
- [ ] DEBUG=False 확인
- [ ] 강력한 비밀번호 사용
- [ ] HTTPS 적용
- [ ] 방화벽 설정 확인
- [ ] 정기 백업 설정
