import os
import json
import logging
import random
# Pinecone & LangChain
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from langchain_tavily import TavilySearch

from dotenv import load_dotenv
load_dotenv()

# 연결 상태 로깅
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# max_results=3: 속도와 토큰 절약을 위해 상위 3개만 검색
tavily_search = TavilySearch(max_results=3)
tavily_search.name = "search_realtime_info_tool"
# ======================================ksu수정(기존 주석처리)=========================================
# tavily_search.description = """
# [Tool] 실시간 혹은 최근의 정보가 필요할 때 웹에서 검색합니다.
# [도구 사용 기준]
# 최신 뉴스, 날씨, 현재 트렌드 등 **대중문화** 또는 **실시간 정보**에 대해 이야기할 필요가 있을 때
# [도구를 사용하면 안되는 상황]
# 위로가 필요한 일반적인 대화나, 철학적인 질문에는 **절대** 사용하지 마세요.
# [도구가 필요한 대화]
# 사용자가 '요즘 날씨', '오늘 날씨', '오늘 뉴스', '날씨', '뉴스', '영화', '음악', '드라마' 정보를 구체적으로 말할 때만 사용하세요.
# """

tavily_search.description = """
[Tool] 실시간 정보, 뉴스, 혹은 사용자의 질문에 대한 구체적인 해결책이나 팁(Tip)이 필요할 때 웹에서 검색합니다.

[도구 사용 기준]
1. 최신 뉴스, 날씨, 트렌드 등 실시간 정보가 필요할 때
2. 사용자가 '방법', '팁', '조언', '정보' 등을 구체적으로 물어볼 때 (예: "기억력 좋아지는 법", "잠 잘 오는 팁")

[도구를 사용하면 안되는 상황]
단순한 위로나 공감이 필요한 대화, 정답이 없는 철학적인 질문에는 사용하지 마세요.
"""
# ======================================ksu수정=========================================

# 데이터 파일 경로
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, '..', 'data', 'conversation_rules.json')

# 설정
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
TALK_INDEX_NAME = "talk-assets"
WISDOM_INDEX_NAME = "welldying-wisdom"
EMBEDDING_MODEL = "text-embedding-3-small"

# 전역 객체 초기화
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
except Exception as e:
    logger.warning(f"Pinecone 초기화 실패: {e}")
    index = None

# 대화 규칙
with open(file_path, 'r', encoding='utf-8') as f:
    RULES = json.load(f)

# ======================================ksu수정(기존 주석처리)=========================================
# @tool
# def recommend_activities_tool(user_emotion: str, mobility_status: str = "거동 가능") -> str:
#     """
#     [Tool] 사용자의 감정과 거동 상태를 기반으로 '의미 있는 활동'을 추천합니다.
#     사용자가 심심해하거나, 무기력하거나, 기분 전환이 필요할 때 호출하세요.
#     """
#     index = pc.Index(TALK_INDEX_NAME)
#     if not index: 
#         return "DB 연결 오류"
#     print("[Tool: 활동 추천]")
#     # 1. Logic: 감정 -> 태그 매핑
#     mappings = RULES.get("mappings", {})
#   
#     target_tags = []
#     for key, tags in mappings.get("emotion_to_feeling_tags", {}).items():
#         if key in user_emotion: target_tags.extend(tags)
#     if not target_tags: target_tags = ["평온/이완"]
#     energy_limit = 5
#     for key, val in mappings.get("mobility_to_energy_range", {}).items():
#         if key in mobility_status:
#             energy_limit = val.get("max_energy", 5)
#     # 2. RAG: Pinecone Search
#     query = f"효과: {', '.join(target_tags)}인 활동"
#     vec = embeddings.embed_query(query)
#   
#     res = index.query(
#         vector=vec, 
#         top_k=10,
#         include_metadata=True, 
#         filter={"type": {"$eq": "activity"}, "ENERGY_REQUIRED": {"$lte": energy_limit}}
#     )
#     matches = res.get('matches', [])
#     if not matches: 
#         return "적절한 활동을 찾지 못했습니다."
#   
#     selected_matches = random.sample(matches, min(len(matches), 3))
#     results = []
#     for m in selected_matches:
#         meta = m['metadata']
#         results.append(f"- {meta.get('activity_kr')} (기대효과: {meta.get('FEELING_TAGS')})")
#   
#     print("[Tool] 검색 결과\n", results)
#     return "\n".join(results)
# 
# ======================================ksu수정=========================================

# ======================================ksu추가=========================================
@tool
def recommend_activities_tool(user_emotion: str, mobility_status: str = "거동 가능") -> str:
    """
    [Tool] 사용자의 감정과 거동 상태를 기반으로 '의미 있는 활동'을 추천합니다.
    사용자가 심심해하거나, 무기력하거나, 기분 전환이 필요할 때 호출하세요.
    """
    print(f"[Tool: 활동 추천] 감정: {user_emotion}, 거동: {mobility_status}")

    # 0. [Pain-Aware Logic] 통증/고통이 심한 경우 (Micro-Activities)
    # 감정 키워드에 '고통', '아픔', '힘듦', '죽음', '미치겠' 등이 포함되면 DB 검색을 패스하고 즉시 처방
    pain_keywords = ["고통", "아픔", "통증", "미치겠", "죽을", "힘들", "괴로"]
    if any(k in user_emotion for k in pain_keywords) or "거동 불가" in mobility_status:
        print(">>> [Pain Mode] 통증/거동불가 감지 -> 초소형 활동(Micro-Activities) 추천")
        micro_activities = [
            "- **5-4-3-2-1 기법**: 지금 눈에 보이는 것 5개, 들리는 소리 4개, 느껴지는 감각 3개를 차례로 말해보세요. (통증 분산 효과)",
            "- **상상 여행**: 눈을 감고 가장 행복했던 여행지의 바람 냄새와 햇살을 아주 구체적으로 떠올려보세요.",
            "- **4-7-8 호흡**: 4초간 숨을 마시고, 7초간 참고, 8초간 천천히 내뱉어 보세요. 신경계를 이완시켜 줍니다.",
            "- **소리 집중**: 창밖에서 들리는 가장 작은 소리에 귀를 기울여 보세요. 새소리인가요, 바람 소리인가요?",
            "- **손가락 탭핑**: 엄지손가락으로 검지부터 새끼손가락까지 하나씩 천천히 눌러보세요."
        ]
        return "\n".join(random.sample(micro_activities, 2))

    index = pc.Index(TALK_INDEX_NAME)
    if not index: 
        return "DB 연결 오류"
    
    # 1. Logic: 감정 -> 태그 매핑
    mappings = RULES.get("mappings", {})
  
    target_tags = []
    for key, tags in mappings.get("emotion_to_feeling_tags", {}).items():
        if key in user_emotion: target_tags.extend(tags)
    if not target_tags: target_tags = ["평온/이완"]
    energy_limit = 5
    for key, val in mappings.get("mobility_to_energy_range", {}).items():
        if key in mobility_status:
            energy_limit = val.get("max_energy", 5)
            
    # 2. RAG: Pinecone Search
    query = f"효과: {', '.join(target_tags)}인 활동"
    vec = embeddings.embed_query(query)
  
    res = index.query(
        vector=vec, 
        top_k=10,
        include_metadata=True, 
        filter={"type": {"$eq": "activity"}, "ENERGY_REQUIRED": {"$lte": energy_limit}}
    )
    matches = res.get('matches', [])
    if not matches: 
        return "적절한 활동을 찾지 못했습니다."
  
    selected_matches = random.sample(matches, min(len(matches), 3))
    results = []
    for m in selected_matches:
        meta = m['metadata']
        results.append(f"- {meta.get('activity_kr')} (기대효과: {meta.get('FEELING_TAGS')})")
  
    print("[Tool] 검색 결과\n", results)
    return "\n".join(results)
# ======================================ksu추가=========================================
@tool
def search_empathy_questions_tool(context: str) -> str:
    """
    [Tool] 대화 맥락에 맞는 '공감 질문'을 검색합니다.
    사용자의 말을 더 깊이 듣고 싶거나 대화가 막혔을 때 호출하세요.
    """
    index = pc.Index(TALK_INDEX_NAME)
    if not index: 
        return "DB 연결 오류"
  
    vec = embeddings.embed_query(context)
    res = index.query(
        vector=vec, 
        top_k=3, 
        include_metadata=True, 
        filter={"type": {"$eq": "question"}}
    )
  
    # In-Context Learning 유도
    questions = [f"- {m['metadata'].get('question_text')} (의도: {m['metadata'].get('intent')})" for m in res['matches']]
  
    print(f"[Tool 질문]\n {questions}")
    return "\n".join(questions) if questions else "적절한 질문이 없습니다."

@tool
def search_welldying_wisdom_tool(topic: str) -> str:
    """
    [Tool] 죽음, 삶의 의미, 상실 등 깊이 있고 철학적인 주제에 대한 지혜를 검색합니다.
    사용자의 진지함 점수가 높거나, 심오한 질문을 던졌을 때 사용하세요.
  
    Args:
        topic (str): 검색할 주제 키워드 (예: "죽음의 의미", "후회 없는 삶", "용서")
    """
    index = pc.Index(WISDOM_INDEX_NAME)
    if not index: 
        return "지혜 DB 연결 오류"
  
    logger.info(f"지식 검색 요청: {topic}")
  
    vec = embeddings.embed_query(topic)
  
    # DB에 type='wisdom'으로 데이터를 적재해두었다고 가정
    res = index.query(
        vector=vec, 
        top_k=3, 
        include_metadata=True, 
        filter={"type": {"$eq": "wisdom"}}
    )
  
    matches = res.get('matches', [])
    if not matches:
        return "관련된 명언을 찾지 못했습니다. 보편적인 인류의 지혜로 답변해주세요."
  
    results = []
    for m in matches:
        meta = m['metadata']
        # content: 본문, source: 출처
        results.append(f"내용: {meta.get('content', '')}\n출처: {meta.get('source', 'Unknown')}")
  
    print("[Tool 지식 검색]", results)
    return "\n---\n".join(results)
    
# 외부 모듈에서 import 할 수 있도록 TOOLS 리스트 정의
TOOLS_TALK = [recommend_activities_tool, search_empathy_questions_tool, search_welldying_wisdom_tool]

# Tavily 검색이 유효할 때만 추가
if tavily_search:
    TOOLS_TALK.append(tavily_search)