import { useState, useRef, useEffect } from 'react';
import { Button, Group, Text, ActionIcon, Alert, Stack } from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconVolume, IconVolumeOff } from '@tabler/icons-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function VoiceInput({ onTranscript, disabled = false, placeholder = "音声で回答を入力..." }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isManuallyStopped, setIsManuallyStopped] = useState(false);

  useEffect(() => {
    // ブラウザの音声認識APIサポートをチェック
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('お使いのブラウザは音声認識をサポートしていません。Chrome、Edge、Safariをお試しください。');
      return;
    }

    // 音声認識インスタンスを作成
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    // 設定
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP'; // 日本語設定
    recognition.maxAlternatives = 1;
    
    // 音声認識のタイムアウト設定を調整
    if ('webkitSpeechRecognition' in window) {
      // Chrome/Edge用の設定
      (recognition as any).continuous = true;
      (recognition as any).interimResults = true;
      // 音声認識のタイムアウトを延長
      (recognition as any).serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
    }

    // イベントハンドラー
    recognition.onstart = () => {
      setIsListening(true);
      setIsManuallyStopped(false);
      setError(null);
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('音声認識エラー:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'no-speech':
          setError('音声が検出されませんでした。もう一度お試しください。');
          break;
        case 'audio-capture':
          setError('マイクへのアクセスができません。マイクの許可を確認してください。');
          break;
        case 'not-allowed':
          setError('マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。');
          break;
        case 'network':
          setError('ネットワークエラーが発生しました。');
          break;
        default:
          setError('音声認識でエラーが発生しました。');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      // 自動的に音声認識を再開（ユーザーが手動で停止していない場合）
      if (!isManuallyStopped && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (error) {
            console.log('音声認識の再開に失敗:', error);
          }
        }, 500);
      }
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setIsManuallyStopped(false);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsManuallyStopped(true);
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <Alert color="orange" title="音声認識未対応">
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Group gap="sm" align="center">
        <ActionIcon
          size="lg"
          variant={isListening ? "filled" : "light"}
          color={isListening ? "red" : "blue"}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
        >
          {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
        </ActionIcon>
        
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text size="sm" fw={500} c={isListening ? "red" : "blue"}>
            {isListening ? "音声認識中..." : "音声入力"}
          </Text>
          {interimTranscript && (
            <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
              {interimTranscript}
            </Text>
          )}
        </Stack>
      </Group>

      {error && (
        <Alert color="red" title="エラー">
          {error}
        </Alert>
      )}

      
    </Stack>
  );
}

// TypeScript用の型定義
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
