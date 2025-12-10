import os
import json
import logging
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

# 기존 모듈 임포트 (경로는 프로젝트 구조에 따라 조정 필요)
# models.py가 같은 앱 내에 있다고 가정
try:
    from .models import UserProfile 
except ImportError:
    # 모델이 없을 경우를 대비한 가상 클래스 (실제 적용 시 삭제)
    UserProfile = None 

# 챗봇 세션 관리자 임포트 (chatbot 폴더 내에 있다고 가정)
try:
    from chatbot.chatbot_modules.session_manager import SessionManager
except ImportError:
    # 경로가 다를 경우 상대 경로로 시도
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from chatbot_modules.session_manager import SessionManager

logger = logging.getLogger(__name__)

class MemberManager:
    """
    회원 가입, 로그인, 탈퇴 및 챗봇 세션 연동을 관리하는 클래스
    """
    def __init__(self):
        self.session_manager = SessionManager()

    def register_member(self, request, username, password, email, checklist_data):
        """
        [회원가입]
        1. Django User 생성
        2. 체크리스트 및 추가 정보 DB 저장 (UserProfile)
        3. 챗봇 세션 파일 초기화
        """
        if User.objects.filter(username=username).exists():
            return False, "이미 존재하는 아이디입니다."

        try:
            with transaction.atomic():
                # 1. 기본 유저 생성
                user = User.objects.create_user(username=username, password=password, email=email)
                
                # 2. 체크리스트 데이터 파싱
                # 체크리스트 항목을 개별 필드로 매핑
                mobility_mapping = {
                    '걷기가 비교적 편하다': 'comfortable_walking',
                    '천천히라면 걷기는 가능하다': 'slow_walking',
                    '실내에서만 주로 움직인다': 'indoor_only',
                    '대부분 누워 지낸다': 'mostly_lying',
                }
                
                emotion_mapping = {
                    '불안하다': 'anxious',
                    '무기력하다': 'lethargic',
                    '외롭다': 'lonely',
                    '혼란스럽다': 'confused',
                    '슬프다': 'sad',
                    '그래도 꽤 평온하다': 'peaceful',
                    '말로 표현하기 어렵다': 'hard_to_express',
                }
                
                # 체크리스트에서 값 추출
                preferred_name = checklist_data.get('A1', '')
                mobility_kr = checklist_data.get('A2', '')
                emotion_kr = checklist_data.get('B1', '')
                
                # 한글 값을 영문 코드로 변환
                mobility_status = mobility_mapping.get(mobility_kr, '')
                current_emotion = emotion_mapping.get(emotion_kr, '')
                
                # 3. UserProfile 생성 및 저장
                if UserProfile:
                    # 알려진 필드 외의 추가 데이터는 additional_checklist_data에 저장
                    known_fields = {'A1', 'A2', 'B1'}
                    additional_data = {k: v for k, v in checklist_data.items() if k not in known_fields}
                    
                    UserProfile.objects.create(
                        user=user,
                        preferred_name=preferred_name,
                        mobility_status=mobility_status,
                        current_emotion=current_emotion,
                        additional_checklist_data=json.dumps(additional_data, ensure_ascii=False)
                    )
                
                # 4. 챗봇 세션 파일 초기화 (빈 파일 생성)
                # 로그인 시 해당 username으로 파일을 로드할 수 있게 미리 생성해둡니다.
                self.session_manager.save_session(user.username, {
                    "user_profile": {
                        "name": preferred_name if preferred_name else username,
                        "username": username
                    },
                    "conversation_history": []
                })
                
                logger.info(f"회원가입 완료: {username} (호칭: {preferred_name})")
                return True, "회원가입이 완료되었습니다."
                
        except Exception as e:
            logger.error(f"회원가입 중 오류 발생: {e}")
            return False, f"회원가입 처리 중 오류가 발생했습니다: {str(e)}"

    def login_member(self, request, username, password):
        """
        [로그인]
        1. Django 인증
        2. 챗봇 세션 파일 존재 확인 및 로드 준비
        """
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # 챗봇 세션 파일 확인 (없으면 복구 또는 생성)
            # 로그인한 사용자 ID(username)를 키로 사용하여 세션을 로드합니다.
            session_data = self.session_manager.load_session(user.username)
            
            # 마지막 접속 시간 업데이트 (선택 사항)
            self.session_manager.update_last_visit(user.username)
            
            logger.info(f"로그인 성공: {username}")
            return True, "로그인되었습니다."
        else:
            return False, "아이디 또는 비밀번호가 올바르지 않습니다."

    def logout_member(self, request):
        """
        [로그아웃]
        """
        if request.user.is_authenticated:
            # 로그아웃 전 마지막 상태 저장 (필요시)
            username = request.user.username
            self.session_manager.update_last_visit(username)
            
        logout(request)
        return True, "로그아웃되었습니다."

    def withdraw_member(self, request):
        """
        [회원탈퇴]
        1. DB에서 회원 정보 삭제 (Cascade)
        2. chatbot/sessions 파일 삭제
        """
        user = request.user
        if not user.is_authenticated:
            return False, "로그인 상태가 아닙니다."
            
        username = user.username
        
        try:
            with transaction.atomic():
                # 1. DB 삭제
                # Django의 User를 삭제하면 연결된 UserProfile도 같이 삭제됨 (on_delete=models.CASCADE 설정 시)
                user.delete()
                
                # 2. 세션 파일 삭제
                # SessionManager에 delete 기능이 없다면 os.remove로 직접 처리하거나 추가 구현 필요
                # 앞서 구현한 delete_diary_entry와 유사하게 세션 파일 삭제 로직 수행
                session_path = self.session_manager._get_file_path(username)
                if os.path.exists(session_path):
                    os.remove(session_path)
                
                # 다이어리 파일들도 삭제 (선택 사항)
                # glob을 이용해 해당 유저의 다이어리 전체 삭제 가능
                
                logger.info(f"회원탈퇴 완료: {username}")
                return True, "회원탈퇴가 완료되었습니다."
                
        except Exception as e:
            logger.error(f"회원탈퇴 실패: {e}")
            return False, "탈퇴 처리 중 오류가 발생했습니다."