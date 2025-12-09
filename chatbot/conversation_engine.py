import logging
from typing import TypedDict, Annotated, List, Literal, Dict, Any

# LangChain / LangGraph Imports
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages

# Custom Modules
from chatbot_modules.llm_client import LLMClient
from chatbot_modules.session_manager import SessionManager
from chatbot_modules.recommend_ba import TOOLS_TALK
from chatbot_modules.search_info import TOOLS_INFO

# Separated Agents
from chatbot_modules.empathy_agent import empathy_node
from chatbot_modules.info_agent import info_node

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# LangGraph 상태 정의
# ---------------------------------------------------------------------------
class AgentState(TypedDict):
    # messages: LangGraph에서 메시지 리스트를 누적 관리하기 위한 상태
    # add_messages(리듀서): 리스트를 덮어쓰지 않고 계속 append해 주는 함수
    messages: Annotated[List[BaseMessage], add_messages]
    # user_profile: 사용자 성향, 나이, 기본 정보 등 세션에 저장할 정보
    user_profile: Dict[str, Any]
    # current_mode: 'chat'(공감/대화 모드) vs 'info'(정보 검색 모드)
    current_mode: Literal["chat", "info"]


# ---------------------------------------------------------------------------
# ConversationEngine: 대화 흐름을 제어하는 메인 클래스
# ---------------------------------------------------------------------------
class ConversationEngine:
    def __init__(self):
        self.llm_client = LLMClient()
        self.session_manager = SessionManager()
        self.memory = MemorySaver()

        # 사용자가 "종료", "잘자" 등 말하면 다이어리를 생성하도록 트리거로 사용
        self.diary_triggers = ["종료", "그만", "잘자", "내일 봐", "다이어리 써줘"]

        # LangGraph 컴파일된 앱
        self.app = self._build_graph()

    # -----------------------------------------------------------------------
    # Graph 구성
    # -----------------------------------------------------------------------
    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # 1. 노드 등록
        workflow.add_node("empathy_agent", empathy_node)     # 공감/대화 에이전트
        workflow.add_node("info_agent", info_node)           # 정보 검색 에이전트
        workflow.add_node("tools_talk", ToolNode(TOOLS_TALK))  # 대화 관련 도구
        workflow.add_node("tools_info", ToolNode(TOOLS_INFO))  # 정보 검색 도구

        # 2. Entry Point: current_mode에 따라 시작 노드 분기
        workflow.set_conditional_entry_point(
            self._route_mode,
            {
                "empathy_agent": "empathy_agent",
                "info_agent": "info_agent",
            },
        )

        # 3. 공감 에이전트에서 Tool 호출 여부 체크
        workflow.add_conditional_edges(
            "empathy_agent",
            self._should_continue_talk,
            {
                "tools_talk": "tools_talk",
                END: END,
            },
        )

        # 4. 정보 에이전트에서 Tool 호출 여부 체크
        workflow.add_conditional_edges(
            "info_agent",
            self._should_continue_info,
            {
                "tools_info": "tools_info",
                END: END,
            },
        )

        # 5. 툴 실행 후 다시 해당 에이전트로 복귀
        workflow.add_edge("tools_talk", "empathy_agent")
        workflow.add_edge("tools_info", "info_agent")

        return workflow.compile(checkpointer=self.memory)

    # -----------------------------------------------------------------------
    # 라우팅 로직
    # -----------------------------------------------------------------------
    def _route_mode(self, state: AgentState):
        """
        current_mode 값을 보고 'empathy_agent' 또는 'info_agent'로 분기
        """
        mode = state.get("current_mode", "chat")
        logger.info(f"[Router] Current Mode: {mode}")
        if mode == "info":
            return "info_agent"
        return "empathy_agent"

    def _should_continue_talk(self, state: AgentState):
        """
        공감/대화 에이전트 쪽에서 Tool을 호출해야 하는지 검사.

        last_message.tool_calls(툴 호출 정보)가 있으면 tools_talk로,
        없으면 그래프 종료(END).
        """
        last_message = state["messages"][-1]
        if last_message.tool_calls:
            return "tools_talk"
        return END

    def _should_continue_info(self, state: AgentState):
        """
        정보 에이전트 쪽에서 Tool을 호출해야 하는지 검사.
        """
        last_message = state["messages"][-1]
        if last_message.tool_calls:
            return "tools_info"
        return END

    # -----------------------------------------------------------------------
    # 다이어리 생성 로직
    # -----------------------------------------------------------------------
    def generate_diary_summary(self, user_id: str) -> str:
        """
        세션에 저장된 사용자 대화 히스토리를 불러와
        '오늘의 다이어리' 형식의 텍스트를 생성한다.
        """
        history_text = self.session_manager.export_user_history(user_id)
        prompt = f"""
        당신은 사용자의 하루를 따뜻하게 기록해주는 '회고록 작가'입니다.
        아래 대화 기록을 바탕으로, 사용자의 기분과 있었던 일을 3~5문장의 '오늘의 다이어리' 형식으로 작성해주세요.
        
        [대화 기록]
        {history_text}
        """
        return self.llm_client.generate_text("당신은 에세이 작가입니다.", prompt)

    def _check_diary_trigger(self, text: str) -> bool:
        """
        사용자의 입력 문장에 다이어리 종료/마무리 트리거가 포함되어 있는지 검사.
        """
        return any(trigger in text for trigger in self.diary_triggers)

    # -----------------------------------------------------------------------
    # Public Interface: UI에서 직접 호출하는 메소드
    # -----------------------------------------------------------------------
    def process_user_message(self, user_id: str, text: str, mode: str = "chat") -> str:
        """
        UI에서 호출하는 메인 엔트리 포인트.

        - user_id: 사용자 식별자 (세션 구분용)
        - text: 사용자가 보낸 메시지
        - mode: 'chat' 또는 'info' (UI 토글 상태)
        """

        # 1. 세션 로드
        session = self.session_manager.load_session(user_id)
        profile = session.get("user_profile", {})

        # 2. LangGraph 실행을 위한 입력값 구성
        config = {"configurable": {"thread_id": user_id}}
        inputs = {
            "messages": [HumanMessage(content=text)],
            "user_profile": profile,
            "current_mode": mode,
        }

        # 사용자가 보낸 메시지는 바로 세션에 기록 (다이어리용 로그)
        self.session_manager.add_message(user_id, "user", text)

        response_text = ""

        # 3. 그래프 스트리밍 실행
        try:
            for event in self.app.stream(inputs, config=config):
                for k, v in event.items():
                    if "messages" in v:
                        msg = v["messages"][-1]
                        # tool 호출 결과가 아닌, 실제 AI 답변만 추출
                        if isinstance(msg, AIMessage) and not msg.tool_calls:
                            response_text = msg.content
        except Exception as e:
            logger.error(f"Error during graph execution: {e}")
            return "시스템 오류가 발생했습니다."

        # 4. 어시스턴트 답변도 세션에 저장
        self.session_manager.add_message(user_id, "assistant", response_text)

        # 5. 다이어리 트리거가 포함된 입력인지 확인
        if self._check_diary_trigger(text):
            diary = self.generate_diary_summary(user_id)
            response_text += (
                f"\n\n[시스템]: 대화를 마무리하며 오늘의 다이어리를 작성했습니다.\n\n{diary}"
            )
            # 종료 시 마지막 방문 시간 업데이트
            self.session_manager.update_last_visit(user_id)

        return response_text