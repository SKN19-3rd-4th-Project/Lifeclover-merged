# AWS EC2 배포 가이드 - Lifeclover Docker 프로젝트

## 📋 목차
1. [EC2 인스턴스 생성](#1-ec2-인스턴스-생성)
2. [서버 초기 설정](#2-서버-초기-설정)
3. [프로젝트 배포](#3-프로젝트-배포)
4. [도메인 및 HTTPS 설정](#4-도메인-및-https-설정)
5. [모니터링 및 유지보수](#5-모니터링-및-유지보수)

---

## 1. EC2 인스턴스 생성

### 1-1. AWS 콘솔 접속
1. AWS Management Console 로그인
2. 리전 선택: **서울 (ap-northeast-2)** 권장
3. EC2 서비스로 이동

### 1-2. 인스턴스 시작

**[Launch Instance] 클릭**

#### ① 이름 및 태그
```
Name: Lifeclover-Web-Server
```

#### ② AMI 선택
```
Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
64-bit (x86)
```

#### ③ 인스턴스 유형
**권장**: `t3.small` (2 vCPU, 2GB RAM) - 월 약 $15
**최소**: `t2.micro` (1 vCPU, 1GB RAM) - 프리티어, 성능 제한

#### ④ 키 페어 (로그인)
```
- 새 키 페어 생성 클릭
- 키 페어 이름: lifeclover-key
- 키 페어 유형: RSA
- 프라이빗 키 파일 형식: .pem
- [키 페어 생성] 클릭
- 자동으로 다운로드되는 파일 안전하게 보관
```

#### ⑤ 네트워크 설정
```
✅ 퍼블릭 IP 자동 할당: 활성화
✅ 보안 그룹 생성
  - SSH (22) - 위치: 내 IP
  - HTTP (80) - 위치: 0.0.0.0/0
  - HTTPS (443) - 위치: 0.0.0.0/0
  - Custom TCP (8000) - 위치: 0.0.0.0/0 (테스트용, 나중에 제거)
```

#### ⑥ 스토리지 구성
```
30 GB gp3 (General Purpose SSD)
```

#### ⑦ 고급 세부 정보
```
(기본값 그대로)
```

**[인스턴스 시작] 클릭**

### 1-3. 탄력적 IP 할당 (고정 IP)

1. 좌측 메뉴: **네트워크 및 보안** → **탄력적 IP**
2. **[탄력적 IP 주소 할당]** 클릭
3. **[할당]** 클릭
4. 생성된 IP 선택 → **작업** → **탄력적 IP 주소 연결**
5. 인스턴스: `Lifeclover-Web-Server` 선택
6. **[연결]** 클릭

**🎯 고정 IP 주소 확보!**

---

## 2. 서버 초기 설정

### 2-1. SSH 접속

#### Windows (PowerShell)

```powershell
# 키 파일 권한 설정 (처음 한 번만)
icacls "C:\Users\YourName\Downloads\lifeclover-key.pem" /inheritance:r
icacls "C:\Users\YourName\Downloads\lifeclover-key.pem" /grant:r "%username%:R"

# SSH 접속
ssh -i "C:\Users\YourName\Downloads\lifeclover-key.pem" ubuntu@YOUR_ELASTIC_IP
```

#### Mac/Linux

```bash
# 키 파일 권한 설정
chmod 400 ~/Downloads/lifeclover-key.pem

# SSH 접속
ssh -i ~/Downloads/lifeclover-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 2-2. 시스템 업데이트

```bash
# 패키지 목록 업데이트
sudo apt update

# 설치된 패키지 업그레이드
sudo apt upgrade -y
```

### 2-3. Docker 설치

```bash
# Docker 공식 스크립트로 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker --version
docker-compose --version
```

### 2-4. Git 설치

```bash
sudo apt install git -y
git --version
```

### 2-5. SSH 재접속 (Docker 권한 적용)

```bash
# 현재 접속 종료
exit

# 다시 접속
ssh -i "경로/lifeclover-key.pem" ubuntu@YOUR_ELASTIC_IP
```

---

## 3. 프로젝트 배포

### 3-1. GitHub에 코드 푸시 (로컬에서)

```bash
cd c:\Projects\Lifeclover-merged

# .env 파일 제외 확인
echo ".env" >> .gitignore

# 커밋 및 푸시
git add .
git commit -m "feat: Docker 배포 준비 완료"
git push origin main
```

### 3-2. 서버에서 프로젝트 클론

```bash
# 홈 디렉토리에서 실행
cd ~

# GitHub에서 클론
git clone https://github.com/your-username/Lifeclover-merged.git

# 프로젝트 디렉토리로 이동
cd Lifeclover-merged
```

### 3-3. 환경 변수 설정

```bash
# .env 파일 생성
nano .env
```

**`.env` 파일 내용**:
```env
# Django Settings
DEBUG=False
SECRET_KEY=매우-복잡한-랜덤-키-최소-50자-이상-입력하세요
ALLOWED_HOSTS=YOUR_ELASTIC_IP,your-domain.com,www.your-domain.com

# Database Settings
DB_NAME=lcdb
DB_USER=django
DB_PASSWORD=강력한-비밀번호-입력
DB_ROOT_PASSWORD=강력한-루트-비밀번호-입력
DB_HOST=db
DB_PORT=3306

# LLM API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
TAVILY_API_KEY=your-tavily-api-key

# Pinecone (if using)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-environment
```

저장: `Ctrl+X` → `Y` → `Enter`

### 3-4. 프로덕션 모드로 배포

```bash
# 프로덕션 docker-compose 실행
docker-compose -f docker-compose.prod.yml up -d --build
```

**빌드 시간**: 5-10분 소요 (처음)

### 3-5. 로그 확인

```bash
# 전체 로그
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스만
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f nginx
```

성공 메시지:
```
nginx_1  | ... server started
web_1    | Booting worker with pid: 28
db_1     | ready for connections
```

### 3-6. 데이터베이스 초기화

```bash
# 마이그레이션 (자동 실행되지만 확인)
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# 슈퍼유저 생성
docker-compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

### 3-7. 접속 테스트

브라우저에서:
```
http://YOUR_ELASTIC_IP
```

✅ 페이지가 로드되면 성공!

---

## 4. 도메인 및 HTTPS 설정

### 4-1. 도메인 구매 (선택사항)

**추천 서비스**:
- Namecheap
- GoDaddy
- Cloudflare Registrar

### 4-2. DNS 설정

도메인 제공업체 DNS 관리 페이지에서:

```
Type: A
Name: @
Value: YOUR_ELASTIC_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_ELASTIC_IP
TTL: 3600
```

**DNS 전파 확인** (10분~24시간):
```bash
nslookup your-domain.com
```

### 4-3. HTTPS 인증서 발급 (Let's Encrypt)

```bash
# Nginx 컨테이너 임시 중지
docker-compose -f docker-compose.prod.yml stop nginx

# Certbot 설치
sudo apt install certbot -y

# SSL 인증서 발급
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# 인증서 위치 확인
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

### 4-4. SSL 인증서 Docker로 복사

```bash
# SSL 디렉토리 생성
mkdir -p ~/Lifeclover-merged/nginx/ssl

# 인증서 복사
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem \
  ~/Lifeclover-merged/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem \
  ~/Lifeclover-merged/nginx/ssl/

# 권한 설정
sudo chown ubuntu:ubuntu ~/Lifeclover-merged/nginx/ssl/*.pem
sudo chmod 644 ~/Lifeclover-merged/nginx/ssl/*.pem
```

### 4-5. Nginx 설정 수정

```bash
nano ~/Lifeclover-merged/nginx/nginx.conf
```

HTTPS 블록 주석 제거 및 도메인 수정:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;  # ← 도메인 입력
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... 나머지 설정
}
```

### 4-6. Nginx 재시작

```bash
docker-compose -f docker-compose.prod.yml up -d --build nginx
```

### 4-7. HTTPS 접속 확인

브라우저에서:
```
https://your-domain.com
```

🔒 자물쇠 아이콘 확인!

### 4-8. 자동 갱신 설정

```bash
# Crontab 편집
sudo crontab -e
```

추가:
```cron
# 매월 1일 오전 2시에 인증서 갱신
0 2 1 * * certbot renew --pre-hook "docker-compose -f /home/ubuntu/Lifeclover-merged/docker-compose.prod.yml stop nginx" --post-hook "cp /etc/letsencrypt/live/your-domain.com/*.pem /home/ubuntu/Lifeclover-merged/nginx/ssl/ && docker-compose -f /home/ubuntu/Lifeclover-merged/docker-compose.prod.yml start nginx"
```

---

## 5. 모니터링 및 유지보수

### 5-1. 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너
docker-compose -f docker-compose.prod.yml ps

# 리소스 사용량
docker stats

# 로그 확인
docker-compose -f docker-compose.prod.yml logs --tail=100 -f web
```

### 5-2. 자동 시작 설정

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

활성화:
```bash
sudo systemctl enable lifeclover.service
sudo systemctl start lifeclover.service

# 상태 확인
sudo systemctl status lifeclover.service
```

### 5-3. 데이터베이스 백업

```bash
# 백업 스크립트 생성
nano ~/backup.sh
```

내용:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# MySQL 백업
docker-compose -f /home/ubuntu/Lifeclover-merged/docker-compose.prod.yml exec -T db \
  mysqldump -u django -p강력한-비밀번호 lcdb > $BACKUP_DIR/lcdb_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

실행 권한 및 cron 등록:
```bash
chmod +x ~/backup.sh

# Crontab 편집
crontab -e

# 매일 오전 3시 백업
0 3 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### 5-4. 코드 업데이트

```bash
cd ~/Lifeclover-merged

# 최신 코드 가져오기
git pull origin main

# 재배포
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5-5. 서버 재부팅 후 자동 시작 확인

```bash
# 재부팅
sudo reboot

# (재접속 후)
docker-compose -f docker-compose.prod.yml ps
```

---

## 📊 비용 예상

| 항목 | 사양 | 월 비용 |
|------|------|---------|
| **EC2 t3.small** | 2 vCPU, 2GB RAM | $15 |
| **탄력적 IP** | 고정 IP | 무료 (인스턴스 실행 중) |
| **EBS 스토리지** | 30GB gp3 | $3 |
| **데이터 전송** | 1TB/월 무료 | 포함 |
| **도메인** | 선택사항 | $10-15/년 |
| **LLM API** | 사용량 기준 | $20-50/월 |
| **총계** | | **$18-68/월** |

---

## 🔒 보안 체크리스트

- [x] DEBUG=False
- [x] 강력한 SECRET_KEY
- [x] 강력한 DB 비밀번호
- [x] ALLOWED_HOSTS 설정
- [x] HTTPS 적용
- [x] SSH 키 기반 인증
- [ ] fail2ban 설치 (추가 보안)
- [ ] 정기 백업 설정
- [ ] CloudWatch 모니터링 (선택)

---

## 🛠️ 트러블슈팅

### 문제 1: 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### 문제 2: 메모리 부족
```bash
# 스왑 메모리 추가 (t2.micro 등 저사양)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 문제 3: 디스크 공간 부족
```bash
# Docker 정리
docker system prune -a --volumes

# 로그 파일 확인
docker-compose -f docker-compose.prod.yml logs --tail=0
```

---

## 🎉 배포 완료!

**다음 단계**:
1. ✅ http://YOUR_ELASTIC_IP 접속 확인
2. ✅ HTTPS 설정 (도메인 있는 경우)
3. ✅ 백업 설정
4. ✅ 모니터링 도구 설정 (Uptime Robot 등)

**유지보수**:
- 정기적인 서버 업데이트
- 백업 확인
- 로그 모니터링
- 비용 모니터링 (AWS Cost Explorer)
