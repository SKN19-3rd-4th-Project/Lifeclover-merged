import json
from datetime import datetime

from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

# 간단한 더미 데이터 (백엔드 준비 전 임시)
SAMPLE_DIARIES = {
    "2025-12-03": {
        "emoji": "🎂",
        "tags": "#기념 #영화 #기분전환",
        "content": "오늘 사용자님은 삶의 무게를 느끼며 장례와 유산 상속에 대한 정보를 찾으셨어요.\n그래도 불구하고 '주토피아' 영화를 보면서 잠시나마 미소를 찾으셨답니다.\n기분 좋은 감정이 이어져 내일은 조금 더 따뜻한 날이 되기를 바랍니다.",
    },
    "2025-12-07": {
        "emoji": "🌱",
        "tags": "#미선택",
        "content": "",
    },
}


def index(request, page: str = "home"):
  """Serve the main landing page with the requested section active."""
  safe_page = page if page in {"home", "services", "chat", "diary"} else "home"
  return render(request, "index.html", {"current_page": safe_page})


@csrf_exempt
def chat_api(request):
  """간단한 더미 챗 API (백엔드 준비 전 임시)."""
  if request.method != "POST":
    return HttpResponseNotAllowed(["POST"])

  try:
    payload = json.loads(request.body.decode("utf-8"))
  except Exception:
    return JsonResponse({"error": "잘못된 요청입니다."}, status=400)

  message = (payload.get("message") or "").strip()
  mode = payload.get("mode") or "chat"
  if not message:
    return JsonResponse({"error": "메시지를 입력해주세요."}, status=400)

  reply = f"[{mode}] '{message}'에 대한 임시 응답입니다. (백엔드 준비 중)"
  return JsonResponse({"response": reply})


def diaries_api(request):
  """다이어리 리스트 더미 API."""
  if request.method != "GET":
    return HttpResponseNotAllowed(["GET"])

  diaries = []
  for date, item in SAMPLE_DIARIES.items():
    diaries.append({
        "date": date,
        "emoji": item.get("emoji") or "",
        "tags": item.get("tags") or "",
    })
  diaries.sort(key=lambda d: d["date"])
  return JsonResponse({"diaries": diaries})


def diary_detail_api(request, date_key: str):
  """특정 날짜 다이어리 상세 더미 API."""
  if request.method != "GET":
    return HttpResponseNotAllowed(["GET"])

  entry = SAMPLE_DIARIES.get(date_key)
  if not entry:
    return JsonResponse({"error": "기록이 없습니다."}, status=404)
  return JsonResponse({"content": entry.get("content") or ""})
