import os
from pathlib import Path
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# 프로젝트 루트(.env)까지 올라가서 환경 변수를 확실히 로드
ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# 환경 변수(OPENAI_API_KEY)는 settings.py 또는 실행 환경에서 미리 설정된다고 가정
api_key = os.getenv("OPENAI_API_KEY")
model_name = "gpt-4o"


class LLMClient:
    """
    모델을 관리하는 클라이언트 클래스.
    LangGraph 및 Tool Calling을 지원하기 위해 LangChain ChatOpenAI 객체를 감싸서 사용합니다.
    """

    def __init__(self, model_name: str = model_name):
        if not api_key:
            # OPENAI_API_KEY가 설정되지 않았다면 개발 단계에서 바로 알 수 있도록 예외를 발생시킴
            raise ValueError("환경 변수 OPENAI_API_KEY가 설정되지 않았습니다.")

        self.model_name = model_name
        self.chat_model = ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=0.7,
        )

    def get_model_with_tools(self, tools: list):
        """
        Tool Calling을 지원하는 모델 객체를 반환합니다.

        - tools: LangChain Tool 리스트
        - empathy_agent, info_agent에서 Tool을 사용하는 노드에 주입할 때 사용
        """
        return self.chat_model.bind_tools(tools)

    def get_base_model(self):
        """
        Tool 없이 기본 대화만 수행하는 모델 객체를 반환합니다.
        info_agent 등 단순 질의응답용으로 사용할 수 있습니다.
        """
        return self.chat_model

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """
        단순 텍스트 생성 메서드.
        예) 회고/다이어리 생성 등에 사용.

        - system_prompt: 시스템 역할 지시문
        - user_prompt: 사용자가 전달한 실제 내용
        """
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]

        # invoke() 호출 결과에서 content만 추출
        response = self.chat_model.invoke(messages)
        return response.content
