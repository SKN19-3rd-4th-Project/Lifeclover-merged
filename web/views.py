from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import sys
import os

# Add chatbot directory to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHATBOT_DIR = os.path.join(BASE_DIR, 'chatbot')
sys.path.insert(0, CHATBOT_DIR)

from conversation_engine import ConversationEngine

# Initialize conversation engine (singleton pattern)
conversation_engine = None

def get_conversation_engine():
    global conversation_engine
    if conversation_engine is None:
        conversation_engine = ConversationEngine()
    return conversation_engine


def index(request, page: str = "home"):
    """Serve the main landing page with the requested section active."""
    safe_page = page if page in {"home", "services", "chat", "diary"} else "home"
    return render(request, "index.html", {"current_page": safe_page})


@csrf_exempt
@require_http_methods(["POST"])
def chat_message(request):
    """
    Handle chat messages from frontend.
    Expects JSON: {"message": str, "mode": "chat" | "info", "service_type": str (optional)}
    Returns JSON: {"response": str, "error": str (optional)}
    """
    try:
        data = json.loads(request.body)
        message = data.get("message", "").strip()
        mode = data.get("mode", "chat")  # "chat" or "info"
        service_type = data.get("service_type", "")  # For info mode context
        
        if not message:
            return JsonResponse({"error": "메시지가 비어있습니다."}, status=400)
        
        # Use hardcoded test user ID
        user_id = "test_user_01"
        
        # Get conversation engine
        engine = get_conversation_engine()
        
        # If info mode with service type, prepend context to first message
        if mode == "info" and service_type:
            # Map service types to Korean context
            service_context = {
                "funeral_facilities": "장례 시설",
                "support_policy": "지원 정책",
                "inheritance": "유산 상속",
                "digital_info": "디지털 개인 정보"
            }
            context = service_context.get(service_type, "")
            if context:
                message = f"[사용자가 '{context}' 정보를 요청함] {message}"
        
        # Process message through conversation engine
        response = engine.process_user_message(user_id, message, mode=mode)
        
        return JsonResponse({"response": response})
    
    except json.JSONDecodeError:
        return JsonResponse({"error": "잘못된 JSON 형식입니다."}, status=400)
    except Exception as e:
        print(f"Chat error: {e}")
        return JsonResponse({"error": f"오류가 발생했습니다: {str(e)}"}, status=500)


@require_http_methods(["GET"])
def get_diaries(request):
    """
    Get all diary entries metadata for calendar display.
    Returns JSON: {"diaries": [{"date": "YYYY-MM-DD", "emoji": str, "tags": str, "preview": str}]}
    """
    try:
        user_id = "test_user_01"
        
        # Get conversation engine to access diary manager
        engine = get_conversation_engine()
        diaries_metadata = engine.diary_manager.list_diaries(user_id)
        
        return JsonResponse({"diaries": diaries_metadata})
    
    except Exception as e:
        print(f"Get diaries error: {e}")
        return JsonResponse({"error": f"다이어리 조회 중 오류가 발생했습니다: {str(e)}"}, status=500)


@require_http_methods(["GET"])
def get_diary_detail(request, date):
    """
    Get detailed diary content for a specific date.
    Returns JSON: {"date": str, "content": str}
    """
    try:
        user_id = "test_user_01"
        
        # Get conversation engine to access session manager
        engine = get_conversation_engine()
        diary_content = engine.session_manager.get_diary_entry(user_id, date)
        
        if not diary_content:
            return JsonResponse({"date": date, "content": ""})
        
        return JsonResponse({"date": date, "content": diary_content})
    
    except Exception as e:
        print(f"Get diary detail error: {e}")
        return JsonResponse({"error": f"다이어리 조회 중 오류가 발생했습니다: {str(e)}"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def generate_diary(request):
    """
    Generate diary from today's conversations.
    Returns JSON: {"success": bool, "diary": str, "message": str}
    """
    try:
        user_id = "test_user_01"
        
        # Get conversation engine
        engine = get_conversation_engine()
        
        # Generate diary
        diary_result = engine.generate_diary_summary(user_id)
        
        if "다이어리를 생성하지 않았습니다" in diary_result or "생성할 수 없습니다" in diary_result:
            return JsonResponse({
                "success": False,
                "message": diary_result
            })
        
        return JsonResponse({
            "success": True,
            "diary": diary_result,
            "message": "다이어리가 생성되었습니다."
        })
    
    except Exception as e:
        print(f"Generate diary error: {e}")
        return JsonResponse({
            "success": False,
            "error": f"다이어리 생성 중 오류가 발생했습니다: {str(e)}"
        }, status=500)
