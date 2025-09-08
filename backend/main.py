from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from io import BytesIO
import pdfplumber
import requests
from bs4 import BeautifulSoup
import os, json, time

# --- Auth0 JWKS 検証 ---
from jose import jwt
from jose.utils import base64url_decode

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")                   # e.g. "your-tenant.eu.auth0.com"
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")               # e.g. "https://api.uteach"
AUTH0_ALG = "RS256"
JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"

security = HTTPBearer()
_jwks_cache = {"keys": [], "fetched_at": 0}

def _get_jwks():
    # 5分キャッシュ
    if time.time() - _jwks_cache["fetched_at"] > 300:
        resp = requests.get(JWKS_URL, timeout=10)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()["keys"]
        _jwks_cache["fetched_at"] = time.time()
    return _jwks_cache["keys"]

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    unverified_header = jwt.get_unverified_header(token)
    jwks = _get_jwks()
    rsa_key = {}
    for key in jwks:
        if key["kid"] == unverified_header.get("kid"):
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
            break
    if not rsa_key:
        raise HTTPException(status_code=401, detail="Invalid header")

    payload = jwt.decode(
        token,
        rsa_key,
        algorithms=[AUTH0_ALG],
        audience=AUTH0_AUDIENCE,
        issuer=f"https://{AUTH0_DOMAIN}/"
    )
    return payload  # {sub, scope, ...}

# --- Firestore ---
from google.cloud import firestore
db = firestore.Client()   # GOOGLE_APPLICATION_CREDENTIALS を設定

# --- Gemini ---
import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

# --- FastAPI ---
app = FastAPI(title="UTeach API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- モデル ---
class UploadURL(BaseModel):
    url: str
    title: Optional[str] = None

class GenerateReq(BaseModel):
    material_id: str
    level: str = "beginner"  # beginner | intermediate | advanced
    persona: str = "curious"  # curious | practical | analytical | custom
    num_questions: int = 5

class AnswerReq(BaseModel):
    session_id: str
    question_id: str
    answer_text: str

# --- ユーティリティ ---
def chunk_text(text: str, chunk_size: int = 2800) -> List[str]:
    # ざっくり文字数分割（実運用では token ベース推奨）
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    out = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            out.append(page.extract_text() or "")
    return "\n".join(out)

def extract_text_from_url(url: str) -> str:
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    # 最低限の抽出（必要なら Readability 等に差し替え）
    for t in soup(["script", "style", "header", "footer", "nav"]):
        t.extract()
    text = " ".join(soup.get_text(separator=" ").split())
    return text

def gemini_student_questions(context: str, level: str, persona: str, n: int):
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
    # レベルを日本語に変換
    level_map = {
        "beginner": "初級",
        "intermediate": "中級", 
        "advanced": "上級"
    }
    japanese_level = level_map.get(level, level)
    
    # ペルソナに応じた学生の性格を設定
    persona_descriptions = {
        "curious": "好奇心旺盛で、常に「なぜ？」「どうして？」と質問し、深く理解したいタイプの学生",
        "practical": "実践重視で、実際の応用や具体例を重視し、実用的な知識を求めるタイプの学生",
        "analytical": "論理的な思考を好み、体系的に理解したいタイプの学生",
        "custom": "ユーザーが指定した性格・特徴を持つ学生"
    }
    
    student_persona = persona_descriptions.get(persona, persona_descriptions["curious"])
    
    sys = (
        f"あなたは{student_persona}です。教材について{n}個の質問を生成してください。 "
        f"レベル: {japanese_level}。 "
        "あなたの性格に合った質問をしてください。各質問を新しい行に書いてください。Q1:, Q2: のように始めてください。 "
        "JSONやコードブロックは使わず、シンプルな質問文のみで日本語で回答してください。"
    )
    # safetyやJSON指定は Gemini 側の機能に合わせて調整可
    resp = model.generate_content([sys, context])
    text = resp.text.strip()
    # テキストから質問を抽出
    lines = text.splitlines()
    questions = []
    for line in lines:
        line = line.strip()
        if line and not line.startswith('```') and not line.startswith('{') and not line.startswith('['):
            # Q1:, Q2: などのプレフィックスを削除
            if ':' in line:
                question = line.split(':', 1)[1].strip()
            else:
                question = line
            if question:
                questions.append(question)

    # 指定された数の質問を返す
    result = []
    for i, q in enumerate(questions[:n]):
        result.append({"id": f"q{i+1}", "question": q})
    
    return result

def gemini_teacher_feedback(question: str, answer: str, context: str):
    model = genai.GenerativeModel(GEMINI_MODEL)
    sys = (
        "あなたは教育アシスタントです。先生の学生への説明を評価してください。 "
        "以下のJSON形式でのみで日本語で回答してください: {\"score\":0-100,\"strengths\":[],\"suggestions\":[],\"model_answer\":\"...\"}。"
    )
    prompt = f"# 質問\n{question}\n\n# 先生の回答\n{answer}\n\n# 教材内容\n{context[:4000]}"
    resp = model.generate_content([sys, prompt])
    try:
        return json.loads(resp.text)
    except Exception:
        return {"score": 70, "strengths": [], "suggestions": [resp.text[:500]], "model_answer": ""}

# --- エンドポイント ---

@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...), user=Depends(verify_jwt)):
    content = await file.read()
    text = extract_text_from_pdf(content)
    doc = db.collection("materials").document()
    doc.set({
        "owner": user["sub"],
        "title": file.filename,
        "type": "pdf",
        "content": text,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return {"material_id": doc.id, "chars": len(text)}

@app.post("/upload/url")
async def upload_url(body: UploadURL, user=Depends(verify_jwt)):
    text = extract_text_from_url(body.url)
    doc = db.collection("materials").document()
    doc.set({
        "owner": user["sub"],
        "title": body.title or body.url,
        "type": "url",
        "url": body.url,
        "content": text,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return {"material_id": doc.id, "chars": len(text)}

@app.post("/materials/generate-questions")
async def generate_questions(req: GenerateReq, user=Depends(verify_jwt)):
    mat = db.collection("materials").document(req.material_id).get()
    if not mat.exists or mat.to_dict().get("owner") != user["sub"]:
        raise HTTPException(404, "material not found")
    context = mat.to_dict()["content"]
    questions = gemini_student_questions(context, req.level, req.persona, req.num_questions)
    sess = db.collection("sessions").document()
    sess.set({
        "owner": user["sub"],
        "material_id": req.material_id,
        "level": req.level,
        "persona": req.persona,
        "questions": questions,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return {"session_id": sess.id, "questions": questions}

@app.post("/sessions/answer")
async def submit_answer(req: AnswerReq, user=Depends(verify_jwt)):
    sess_ref = db.collection("sessions").document(req.session_id)
    sess = sess_ref.get()
    if not sess.exists or sess.to_dict().get("owner") != user["sub"]:
        raise HTTPException(404, "session not found")
    mat = db.collection("materials").document(sess.to_dict()["material_id"]).get()
    context = mat.to_dict().get("content", "") if mat.exists else ""
    # 対象質問の本文
    question_text = next((q["question"] for q in sess.to_dict()["questions"] if q["id"] == req.question_id), "")
    feedback = gemini_teacher_feedback(question_text, req.answer_text, context)
    # Firestore 追記
    sess_ref.collection("answers").add({
        "question_id": req.question_id,
        "answer_text": req.answer_text,
        "feedback": feedback,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return {"feedback": feedback}

@app.get("/history")
async def history(user=Depends(verify_jwt)):
    q = db.collection("sessions").where("owner", "==", user["sub"]).order_by("createdAt", direction=firestore.Query.DESCENDING).limit(20).stream()
    out = []
    for doc in q:
        d = doc.to_dict()
        out.append({"session_id": doc.id, "material_id": d["material_id"], "level": d["level"], "questions": d.get("questions", [])})
    return {"sessions": out}
