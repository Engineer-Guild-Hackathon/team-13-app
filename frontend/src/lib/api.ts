import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

// 動的にAPI URLを決定
const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 本番環境では同じホストの8000ポートを使用
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const baseURL = getBaseURL();
console.log('API Base URL:', baseURL);

export function useApi() {
  const { getAccessTokenSilently, isAuthenticated, error: authError } = useAuth0();
  const client = axios.create({ baseURL });
  
  // Auth0エラーをログ出力
  if (authError) {
    console.error('🔐 Auth0 Error:', authError);
  }

  // リクエストインターセプターでトークンを追加
  client.interceptors.request.use(async (config) => {
    console.log('Making API request to:', config.url);
    console.log('Full URL:', baseURL + config.url);
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request');
      } catch (error) {
        console.error('Failed to get access token:', error);
        console.log('Continuing without token...');
      }
    } else {
      console.log('User not authenticated, no token added');
    }
    return config;
  });

  // レスポンスインターセプターでエラーハンドリング
  client.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        message: error.message,
        fullError: error
      });
      
      // ネットワークエラーの場合
      if (error.code === 'ERR_NETWORK') {
        console.error('🌐 Network Error - Check if backend is running on port 8000');
      }
      
      // CORSエラーの場合
      if (error.message.includes('CORS')) {
        console.error('🚫 CORS Error - Check backend CORS settings');
      }
      
      return Promise.reject(error);
    }
  );

  return {
    uploadPdf: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await client.post("/upload/pdf", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return data as { material_id: string; chars: number };
    },
    uploadUrl: async (url: string, title?: string) => {
      const { data } = await client.post("/upload/url", { url, title });
      return data as { material_id: string; chars: number };
    },
    generateQuestions: async (material_id: string, level: string, persona: string, num = 5) => {
      const { data } = await client.post("/materials/generate-questions", {
        material_id,
        level,
        persona,
        num_questions: num
      });
      return data as {
        session_id: string;
        questions: { id: string; question: string }[];
      };
    },
    submitAnswer: async (session_id: string, question_id: string, answer_text: string) => {
      const { data } = await client.post("/sessions/answer", {
        session_id,
        question_id,
        answer_text
      });
      return data as {
        feedback: {
          score: number;
          strengths: string[];
          suggestions: string[];
          model_answer: string;
        };
      };
    },
    history: async () => {
      const { data } = await client.get("/history");
      return data as {
        sessions: {
          session_id: string;
          material_id: string;
          material_title: string;
          level: string;
          questions: { id: string; question: string }[];
        }[];
      };
    }
  };
}
