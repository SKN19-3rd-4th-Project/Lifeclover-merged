import os
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone

# 1. 경로 설정
current_dir = Path(__file__).resolve().parent
# F:\SKN-19\lifeclover_ui_ksu\Lifeclover-ui -> F:\SKN-19\.env
parent_env_path = current_dir.parent.parent / '.env' 
local_env_path = current_dir / '.env'

print(f"Checking parent .env at: {parent_env_path}")
print(f"Checking local .env at: {local_env_path}")

# 2. 파일 존재 여부 확인 및 로드
api_key = None

if parent_env_path.exists():
    print("✅ Parent .env file EXISTS.")
    print(f"File size: {parent_env_path.stat().st_size} bytes")
    load_dotenv(dotenv_path=parent_env_path)
    api_key = os.getenv("PINECONE_API_KEY")
    if api_key:
        print("✅ Loaded PINECONE_API_KEY from parent .env")
    else:
        print("❌ Parent .env exists but PINECONE_API_KEY not found or empty.")
else:
    print("❌ Parent .env file does NOT exist.")

if not api_key and local_env_path.exists():
    print("Trying local .env...")
    load_dotenv(dotenv_path=local_env_path, override=True)
    api_key = os.getenv("PINECONE_API_KEY")
    if api_key:
        print("✅ Loaded PINECONE_API_KEY from local .env")
    else:
        print("❌ Local .env exists but PINECONE_API_KEY not found or empty.")

# 3. 연결 테스트
if api_key:
    print(f"Key length: {len(api_key)}")
    print(f"Key starts with: {api_key[:10]}...")
    
    try:
        pc = Pinecone(api_key=api_key)
        indexes = pc.list_indexes()
        print(f"Indexes visible: {len(indexes)}")
        for idx in indexes:
            print(f"- {idx.name}")
            
        # Check for specific index 'funeral-services'
        target_index = "funeral-services"
        if any(idx.name == target_index for idx in indexes):
             print(f"✅ Index '{target_index}' found!")
        else:
             print(f"⚠️ Index '{target_index}' NOT found in the list.")
             
    except Exception as e:
        print(f"Pinecone connection error: {e}")
else:
    print("❌ Failed to load PINECONE_API_KEY from any .env file")
