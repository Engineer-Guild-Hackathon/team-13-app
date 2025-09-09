from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from io import BytesIO
import pdfplumber
import requests
from bs4 import BeautifulSoup
import os, json, time

# --- Gemini ---
import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "AIzaSyAi5T8LRfBoIBH3k6q_0_aRYlMIU2P2kbQ"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# --- FastAPI ---
app = FastAPI(title="UTeach API (Simple)", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 全てのオリジンを許可（本番環境では制限推奨）
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
    level: str = "beginner"
    num_questions: int = 5

class AnswerReq(BaseModel):
    session_id: str
    question_id: str
    answer_text: str

# --- ユーティリティ ---
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
    for t in soup(["script", "style", "header", "footer", "nav"]):
        t.extract()
    text = " ".join(soup.get_text(separator=" ").split())
    return text

def gemini_student_questions(context: str, level: str, n: int):
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        # レベルを日本語に変換
        level_map = {
            "beginner": "初級",
            "intermediate": "中級", 
            "advanced": "上級"
        }
        japanese_level = level_map.get(level, level)
        
        sys = (
            f"あなたは学習意欲の高い学生です。提供された教材を読んで、{japanese_level}レベルの学習者として{n}個の質問を考えてください。\n\n"
            "質問の要件：\n"
            f"- {japanese_level}レベルの学習者に適した難易度\n"
            "- 教材の内容を理解するために重要なポイント\n"
            "- 実用的で具体的な質問\n"
            "- 学習者の理解を深める質問\n\n"
            "回答形式：\n"
            "Q1: [質問文]\n"
            "Q2: [質問文]\n"
            "Q3: [質問文]\n"
            "...\n\n"
            "注意：JSONやコードブロックは使わず、シンプルな質問文のみで回答してください。"
        )
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
    except Exception as e:
        print(f"Gemini API error: {e}")
        # エラーを再発生させる
        raise e

def gemini_teacher_feedback(question: str, answer: str, context: str):
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        sys = (
            "あなたは経験豊富な教育アシスタントです。先生が学生の質問に対して行った回答を評価してください。\n\n"
            "評価の観点：\n"
            "- 回答の正確性と完全性\n"
            "- 学生の理解レベルに適した説明\n"
            "- 具体例や実例の使用\n"
            "- 論理的で分かりやすい構成\n"
            "- 学習意欲を高める内容\n\n"
            "以下のJSON形式で回答してください：\n"
            "{\n"
            '  "score": 0-100の点数,\n'
            '  "strengths": ["良い点1", "良い点2", ...],\n'
            '  "suggestions": ["改善提案1", "改善提案2", ...],\n'
            '  "model_answer": "より良い回答例"\n'
            "}\n\n"
            "strengthsとsuggestionsは日本語で、具体的で建設的な内容にしてください。"
        )
        prompt = f"【学生の質問】\n{question}\n\n【先生の回答】\n{answer}\n\n【教材の内容】\n{context[:4000]}"
        resp = model.generate_content([sys, prompt])
        try:
            # JSONテキストをクリーンアップ
            text = resp.text.strip()
            # コードブロックを削除
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()
            
            # JSONを解析
            feedback_data = json.loads(text)
            
            # データの検証と正規化
            return {
                "score": int(feedback_data.get("score", 70)),
                "strengths": feedback_data.get("strengths", []) if isinstance(feedback_data.get("strengths"), list) else [],
                "suggestions": feedback_data.get("suggestions", []) if isinstance(feedback_data.get("suggestions"), list) else [],
                "model_answer": str(feedback_data.get("model_answer", ""))
            }
        except Exception as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {resp.text[:200]}...")
            return {
                "score": 70, 
                "strengths": [], 
                "suggestions": [f"フィードバックの解析に失敗しました: {str(e)[:100]}"], 
                "model_answer": ""
            }
    except Exception as e:
        print(f"Gemini API error: {e}")
        # エラーを再発生させる
        raise e

# --- データ保存用（簡易版） ---
materials_storage = {}
sessions_storage = {}  # セッション管理用

# --- エンドポイント ---

@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
        material_id = f"pdf_{int(time.time())}"
        materials_storage[material_id] = {
            "title": file.filename,
            "content": text,
            "type": "pdf"
        }
        return {"material_id": material_id, "chars": len(text), "text": text[:500]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF processing error: {str(e)}")

@app.post("/upload/url")
async def upload_url(body: UploadURL):
    try:
        text = extract_text_from_url(body.url)
        material_id = f"url_{int(time.time())}"
        # タイトルを適切に設定
        title = body.title
        if not title:
            # URLからドメイン名を抽出してタイトルとして使用
            from urllib.parse import urlparse
            parsed_url = urlparse(body.url)
            title = f"{parsed_url.netloc} - {parsed_url.path.split('/')[-1] or 'ページ'}"
        
        materials_storage[material_id] = {
            "title": title,
            "content": text,
            "type": "url"
        }
        return {"material_id": material_id, "chars": len(text), "text": text[:500]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL processing error: {str(e)}")

@app.post("/materials/generate-questions")
async def generate_questions(req: GenerateReq):
    try:
        # 実際の教材内容を取得
        if req.material_id not in materials_storage:
            raise HTTPException(status_code=404, detail="Material not found")
        
        material = materials_storage[req.material_id]
        context = material["content"]
        
        # 実際の教材内容に基づいて質問生成
        questions = gemini_student_questions(context, req.level, req.num_questions)
        
        # セッション情報を保存
        session_id = f"session_{int(time.time())}"
        sessions_storage[session_id] = {
            "material_id": req.material_id,
            "material_title": material["title"],
            "material_content": context,
            "questions": questions,
            "level": req.level,
            "created_at": time.time()
        }
        
        return {"session_id": session_id, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Question generation error: {str(e)}")

@app.post("/sessions/answer")
async def submit_answer(req: AnswerReq):
    try:
        # セッション情報から質問と教材を取得
        if req.session_id not in sessions_storage:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions_storage[req.session_id]
        
        # 質問IDから実際の質問を取得
        question_text = "質問が見つかりません"
        for q in session["questions"]:
            if q["id"] == req.question_id:
                question_text = q["question"]
                break
        
        # 実際の教材内容を使用
        material_content = session["material_content"]
        
        feedback = gemini_teacher_feedback(question_text, req.answer_text, material_content)
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Answer processing error: {str(e)}")

@app.get("/history")
async def history():
    # レベルを日本語に変換
    level_map = {
        "beginner": "初級",
        "intermediate": "中級", 
        "advanced": "上級"
    }
    
    # セッション情報を返す（簡易版）
    sessions = []
    for session_id, session_data in sessions_storage.items():
        japanese_level = level_map.get(session_data["level"], session_data["level"])
        sessions.append({
            "session_id": session_id,
            "material_id": session_data["material_id"],
            "material_title": session_data["material_title"],
            "level": japanese_level,
            "questions": session_data["questions"],
            "created_at": session_data["created_at"]
        })
    
    # 作成日時でソート（新しい順）
    sessions.sort(key=lambda x: x["created_at"], reverse=True)
    return {"sessions": sessions}

@app.get("/health")
async def health():
    return {"status": "ok", "message": "UTeach API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
