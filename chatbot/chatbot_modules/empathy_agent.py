# empathy_agent.py
# 역할: v1 / v2 / v3 중에서 선택해서 불러오기

# ==============================================================================
# 버전 선택 (이 한 줄만 바꾸면 됨!)
# ==============================================================================
PROMPT_VERSION = "v2"  # "v1", "v2", "v3" 중에서 선택

# ==============================================================================
# 버전별 import
# ==============================================================================
if PROMPT_VERSION == "v1":
    from chatbot_modules.chatbot_prompts.empathy.v1 import empathy_node
elif PROMPT_VERSION == "v2":
    from chatbot_modules.chatbot_prompts.empathy.v2 import empathy_node
elif PROMPT_VERSION == "v3":
    from chatbot_modules.chatbot_prompts.empathy.v3 import empathy_node
else:
    raise ValueError(f"Unknown PROMPT_VERSION: {PROMPT_VERSION}")

__all__ = ["empathy_node"]
