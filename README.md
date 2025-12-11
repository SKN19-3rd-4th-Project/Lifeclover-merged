> SK네트웍스 Family AI 캠프 19기 4차 프로젝트  
> 개발기간: 25.11.26 ~ 25.12.17 <br>
> 주제 : LLM을 연동한 내외부 문서 기반 질의 응답 시스템

<br>

---

# 📚 목차

1. [팀 소개](#%EF%B8%8F-%ED%8C%80-%EC%86%8C%EA%B0%9C)
2. [프로젝트 개요](#-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EA%B0%9C%EC%9A%94)
3. [기술 스택 & 사용한 모델](#-%EA%B8%B0%EC%88%A0-%EC%8A%A4%ED%83%9D--%EC%82%AC%EC%9A%A9%ED%95%9C-%EB%AA%A8%EB%8D%B8)
4. [시스템 아키텍처](#%EC%8B%9C%EC%8A%A4%ED%85%9C-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98)
5. [WBS](#-wbs)
6. [요구사항 명세서](#%EF%B8%8F%E2%83%A3-%EC%9A%94%EA%B5%AC%EC%82%AC%ED%95%AD-%EB%AA%85%EC%84%B8%EC%84%9C)
7. [수집한 데이터 및 전처리 요약](#%EF%B8%8F-%EC%88%98%EC%A7%91%ED%95%9C-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%B0%8F-%EC%A0%84%EC%B2%98%EB%A6%AC-%EC%9A%94%EC%95%BD)
8. [DB 연동 구현 코드](#db-%EC%97%B0%EB%8F%99-%EA%B5%AC%ED%98%84-%EC%BD%94%EB%93%9C)
9. [테스트 계획 및 결과 보고서](#-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EA%B3%84%ED%9A%8D-%EB%B0%8F-%EA%B2%B0%EA%B3%BC-%EB%B3%B4%EA%B3%A0%EC%84%9C)
10. [트러블 슈팅](#-%ED%8A%B8%EB%9F%AC%EB%B8%94%EC%8A%88%ED%8C%85)
11. [수행결과(시연 페이지)](#-%EC%88%98%ED%96%89%EA%B2%B0%EA%B3%BC%EC%8B%9C%EC%97%B0-%ED%8E%98%EC%9D%B4%EC%A7%80)
12. [한 줄 회고](#%EF%B8%8F-%ED%95%9C-%EC%A4%84-%ED%9A%8C%EA%B3%A0)

<br>

---

# 🖐️ 팀 소개

- ## 팀명 : **맺음**
- ### 팀원 소개 :

<div align="center">
	
| [@배상준](https://github.com/WindyAle) | [@박소희](https://github.com/xxoysauce) | [@이승원](https://github.com/seungwon-sw) | [@김성욱](https://github.com/souluk319) | [@박진형](https://github.com/vispi94) |
| :----------------------------------------: | :----------------------------------------: | :----------------------------------------: | :----------------------------------------: | :----------------------------------------: |
| <img src="data/image/BSJ.png" width="120"> | <img src="data/image/PSH.png" width="120"> | <img src="data/image/LSW.png" width="120"> | <img src="data/image/KSU.png" width="120"> | <img src="data/image/PJH.png" width="120"> |

</div>

<br>

---

# 📖 프로젝트 개요

##  주제 : 남은 인생을 후회 없이 잘 살고, 품위 있는 끝맺음을 준비하며, <br> 새로운 삶의 의미를 찾아가는 과정을 돕는 AI 기반의 '대화 상대' 챗봇 서비스

- ###  **프로젝트 소개**

"**라잎클로버**"는 사용자가 남은 삶을 정돈하고 의미를 찾을 수 있도록 돕는 AI 대화형 챗봇 서비스입니다.  
**상속, 장례 절차, 인터넷 계정 관리, 정서 상담 등 다양한 주제를 RAG 기반으로 안내**하며  
**사용자의 감정·기억까지 반영된 맞춤형 대화를 제공**합니다.

- ###  **프로젝트 배경**

"삶의 마무리 과정(상속·장례·연명의료 등)에 대한 정보 수요가 증가하고 있지만,<br>
궁금한 정보를 다양하게 제공하거나 정서적 부담으로 주변에 쉽게 이야기하기 어려운 고민을<br>
한 곳에서 상담/안내해주는 통합 서비스는 부족합니다."

- **현대 사회 이슈**
   -   고령화 사회 심화
   -   독거노인 + 1인 가구 증가
   -   무연고자 사망 증가

<details>
<summary>관련 기사</summary>

### ■ 무연고 사망 증가

<img src="data/image/news1.png">

- 무연고 사망자는 년마다 증가하는 추세이며, 통계에 잡히지 않는 불특정 다수도 있어 관심과 대책이 요망됨.

[https://repository.kli.re.kr/bitstream/2021.oak/6926/2/%EB%85%B8%EB%8F%99%EB%A6%AC%EB%B7%B0_no.208_2022.7_7.pdf](https://repository.kli.re.kr/bitstream/2021.oak/6926/2/%EB%85%B8%EB%8F%99%EB%A6%AC%EB%B7%B0_no.208_2022.7_7.pdf)
##### 출처: 보건복지부


### ■ 고령화 + 1인 가구

<img src="data/image/news2.png">

-   한국은 2025년 초고령사회 진입.
    
-   노년층 1인 가구 폭증 → 죽음 준비·장례 절차의 정보 접근성 낮음.    
[https://kostat.go.kr/portal/korea/kor_nw/1/1/index.board?bmode=read&aSeq=429567?utm_source=chatgpt.com](https://kostat.go.kr/portal/korea/kor_nw/1/1/index.board?bmode=read&aSeq=429567?utm_source=chatgpt.com)
##### 출처: 통계청

## 해외 죽음 준비 문화 동향
	
### ■ 일본의 ‘슈카츠(終活, Shukatsu)’ 확산

-   일본에서는 **자기 죽음을 준비하는 활동 전체**를 가리키는 말로 ‘슈카츠(終活)’가 이미 널리 사용됨. [위키백과](https://en.wikipedia.org/wiki/Shukatsu_%28end-of-life_planning%29?utm_source=chatgpt.com)

-   주체적인 삶의 마무리, 남겨진 가족의 부담 경감, 현재 삶의 재발견과 성찰, 물리적 정리를 대비하는 문화<br>
   Shukatsu 개념 정리(위키피디아) <br>
   [](https://en.wikipedia.org/wiki/Shukatsu_(end-of-life_planning))[https://en.wikipedia.org/wiki/Shukatsu_(end-of-life_planning)](https://en.wikipedia.org/wiki/Shukatsu_(end-of-life_planning))

### ■ 미국 – Legacy AI / Digital Afterlife 시장 등장

- “StoryWorth”: AI 기반 인생 회고 스토리북 생성 서비스 → 미국에서 급성장.
    
    출처: StoryWorth 공식
    
    https://welcome.storyworth.com/?utm_source=chatgpt.com
    
- “HereAfter AI”: AI가 사용자의 생전 음성·이야기를 기록 → 유족이 대화 가능.
    
    출처: HereAfter
    
    https://www.hereafter.ai/?utm_source=chatgpt.com

<br>

#### => 해외에는 `웰다잉 Well Dying (남은 삶을 어떻게 잘 살아내고 마무리할 것인지)` 문화가 성행하나 국내에선 낯설고 관심 부족한 상태
	
### "이러한 배경에서 저희는 **신뢰할 수 있는 안내/대화 서비스의 필요성**을 느끼고 도움을 줄 수 있는 챗봇을 구상하게 되었습니다."

</details>

- ### **프로젝트 목표**

1.  **핵심 정보 제공**: 상속·장례·인터넷 개인정보 처리 등 삶의 마무리에 필요한 정보를 정확하게 안내
    
2.  **맞춤형 대화**: 감정·기억을 반영한 개인화된 상담 제공
    
3.  **RAG 기반 정확성 향상**: GPT-4o + Pinecone으로 근거 기반 답변 생성
    
4.  **사용자 중심 UI 구현**: (여기에 구현 프로그램 명 입력) 을 사용한 모바일 최적화 인터페이스로 간편한 이용 환경 제공

<br>

---

# 💻 기술 스택 & 사용한 모델  

| 분야                | 사용 도구 |
|---------------------|-----------|
| **Language**        | [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=Python&logoColor=white)](https://www.python.org/) |
| **Collaboration Tool** | [![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/) [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/) [![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white)](https://www.notion.so/) [![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/) |
| **LLM Model**       | [![GPT-4o](https://img.shields.io/badge/GPT--4o%20-412991?style=for-the-badge&logo=openai&logoColor=white)](https://platform.openai.com/) 
| **Embedding Model** | [![text-embedding-3-small](https://img.shields.io/badge/text--embedding--3--small-00A67D?style=for-the-badge&logo=openai&logoColor=white)](https://platform.openai.com/docs/guides/embeddings) |
| **Vector DB**       | [![Pinecone](https://img.shields.io/badge/Pinecone-0075A8?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/) |
| **Orchestration / RAG** | [![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/) [![LangGraph](https://img.shields.io/badge/LangGraph-000000?style=for-the-badge)](https://langchain-ai.github.io/langgraph/) |
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=black) |
| **Development Env** | [![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/) [![Conda](https://img.shields.io/badge/Conda-3EB049?style=for-the-badge&logo=anaconda&logoColor=white)](https://www.anaconda.com/)

<br>

---

# 🪢시스템 아키텍처

### 프로젝트 구조

<br>

### 시스템 아키텍처 구조도

<br>

---

# 📅 WBS

<br>

---

# *️⃣ 요구사항 명세서

**시작 페이지 관리 (SP)**

<img src="data/image/sp.png"><br>

**안내 페이지 관리 (INFO)**

<img src="data/image/info.png"><br>

**채팅 페이지 관리 (CHAT)**

<img src="data/image/chat.png"><br>

**회원 관리 (MBM)**

<img src="data/image/mbm.png"><br>

**세션 관리 (SES)**

<img src="data/image/ses.png"><br>

**비기능 요구 사항 (NFR)**

<img src="data/image/nfr.png"><br>

<br>

---

# 🖥️ 화면 설계서

<img src="data/image/start_page.png"><br>

<img src="data/image/info_page.png"><br>

<img src="data/image/login_page.png"><br>

<img src="data/image/signup_page1.png"><br>

<img src="data/image/signup_page2.png"><br>

<img src="data/image/infochat_page.png"><br>

<img src="data/image/chat_page.png"><br>

<img src="data/image/diary_page.png"><br>

<br>

---

# 💡 테스트 계획 및 결과 보고서

<br>

---
# 🐛 트러블슈팅

<br>

---

# 🤖 수행결과(시연 페이지)

<br>

---

# ✒️ 한 줄 회고

| 이름 | 회고 |
|----------|-------------|
| 배상준 |  |
| 박소희 |  |
| 이승원 |  |
| 김성욱 |  |
| 박진형 |  |
