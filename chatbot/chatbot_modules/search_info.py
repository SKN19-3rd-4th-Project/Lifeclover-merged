import os
import logging

from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Pinecone / Embeddings 초기화
# -----------------------------------------------------------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "funeral-services"           # 실제 인덱스 이름과 다르면 여기를 수정해야 합니다.
EMBEDDING_MODEL = "text-embedding-3-small"

pc = None
index = None
embeddings = None
vectorstore = None

try:
    if not PINECONE_API_KEY:
        raise ValueError(
            "You haven't specified an API key. Please set PINECONE_API_KEY."
        )

    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(INDEX_NAME)
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

    # langchain_pinecone VectorStore
    vectorstore = PineconeVectorStore(
        index=index,
        embedding=embeddings,
    )
except Exception as e:
    # API 키가 없거나 인덱스가 없으면 여기로 빠짐
    logger.warning(f"Pinecone 초기화 실패: {e}")
    vectorstore = None


# -----------------------------------------------------------------------------
# 공통 유틸
# -----------------------------------------------------------------------------
def _safe_search(query: str, k: int = 5, filter: dict = None) -> str:
    """
    내부에서 공통으로 사용하는 안전한 검색 래퍼.

    - vectorstore 가 None 이면 'DB 연결 오류' 메시지 반환
    - 검색 결과가 없으면 '검색 결과가 없습니다.' 반환
    """
    if not vectorstore:
        return "DB 연결 오류"

    docs = vectorstore.similarity_search(query=query, k=k, filter=filter)

    if not docs:
        return "검색 결과가 없습니다."

    lines: list[str] = []
    for i, d in enumerate(docs, start=1):
        # page_content 기준으로 간단히 정리
        lines.append(f"[{i}] {d.page_content}")
    return "\n\n".join(lines)


# -----------------------------------------------------------------------------
# Tool 정의
# -----------------------------------------------------------------------------
@tool
def search_funeral_facilities(region: str, facility_type: str = "all") -> str:
    """
    [장례 시설 검색] 장례식장, 봉안당, 화장장, 묘지, 자연장지 등을 검색합니다.

    - region: 시/군/구 또는 광역 단위 지역명 (예: '군포시', '서울', '수도권')
    - facility_type: '장례식장', '봉안당', '화장장', '묘지', '자연장지' 등
      - 특별히 구분하지 않을 경우 기본값 'all' 사용
    """
    # 쿼리 문장 생성
    if facility_type == "all":
        query = f"{region} 지역의 장례 관련 시설(장례식장, 봉안당, 화장장, 묘지, 자연장지)"
        filter_query = {"category": "funeral"}
    else:
        query = f"{region} 지역의 {facility_type} 정보를 알려줘"
        filter_query = {"category": "funeral", "facility_type": facility_type}

    return _safe_search(query=query, k=5, filter=filter_query)


@tool
def search_public_funeral_ordinance(region: str) -> str:
    """
    [공영 장례 조례 검색] 지자체의 공영 장례 지원/조례 정보를 검색합니다.

    - region: '서울특별시', '경기도 군포시' 처럼 하나의 지자체 이름
    """
    query = f"{region} 지역의 공영 장례 지원 조례 및 제도"
    filter_query = {"category": "public_funeral"}
    return _safe_search(query=query, k=5, filter=filter_query)


@tool
def search_cremation_subsidy_ordinance(region: str) -> str:
    """
    [화장 장려금/지원 검색] 지자체의 화장 장려금 관련 조례/지원 정보를 검색합니다.

    - region: '서울특별시', '경기도 군포시' 등
    """
    query = f"{region} 지역의 화장 장려금 및 화장 지원 조례"
    filter_query = {"category": "cremation_subsidy"}
    return _safe_search(query=query, k=5, filter=filter_query)


@tool
def search_digital_legacy(platform: str) -> str:
    """
    [디지털 유산 검색] 특정 플랫폼(카카오, 네이버, 구글 등)의 계정 사전·사후 처리 방법을 검색합니다.

    - platform: '카카오', '네이버', '구글', '유튜브' 등
    """
    query = f"{platform} 계정의 사전·사후 처리 방법 (사망 시 계정 관리, 메모리얼 서비스 등)"
    filter_query = {"category": "digital_legacy", "platform": platform}
    return _safe_search(query=query, k=5, filter=filter_query)


@tool
def search_legacy(topic: str) -> str:
    """
    [유산/상속 검색] 상속 절차, 상속포기/한정승인, 유언, 유류분 등
    유산 관련 법률/절차 정보를 검색합니다.

    - topic: 사용자가 알고 싶어 하는 주제 키워드
      예: '상속 순위', '한정승인', '유류분', '유언장 효력'
    """
    query = f"유산/상속 관련: {topic} 에 대해 설명해줘"
    filter_query = {"category": "legacy"}
    return _safe_search(query=query, k=5, filter=filter_query)


# ConversationEngine 및 info_agent 에서 사용하는 Tool 리스트
TOOLS_INFO = [
    search_funeral_facilities,
    search_public_funeral_ordinance,
    search_cremation_subsidy_ordinance,
    search_digital_legacy,
    search_legacy,
]
