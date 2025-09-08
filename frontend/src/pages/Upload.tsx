import { useState } from "react";
import { Button, FileInput, Group, Stack, Text, TextInput, Title, SegmentedControl, Alert, Loader, Center, Container, Textarea, Select, Card, ThemeIcon, Divider, Badge } from "@mantine/core";
import { IconUpload, IconLink, IconBrain, IconSettings, IconPlayerPlay } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useApi } from "../lib/api";
import { useAuth0 } from "@auth0/auth0-react";
import Guard from "../components/Guard";

// ペルソナ定義
const PERSONAS = {
  curious: {
    name: "好奇心旺盛な生徒",
    description: "常に「なぜ？」「どうして？」と質問し、深く理解したいタイプ",
    shortDesc: "「なぜ？」を連発する探究心旺盛なタイプ",
    color: "blue",
    icon: "🤔"
  },
  practical: {
    name: "実践重視の生徒", 
    description: "実際の応用や具体例を重視し、実用的な知識を求めるタイプ",
    shortDesc: "実用例や具体例を重視する実用派",
    color: "green",
    icon: "💡"
  },
  analytical: {
    name: "論理的な生徒",
    description: "論理的な思考を好み、体系的に理解したいタイプ",
    shortDesc: "論理的思考で体系的に理解したいタイプ",
    color: "purple", 
    icon: "🧠"
  },
  custom: {
    name: "カスタム指定",
    description: "ユーザーが詳細にペルソナを指定できます",
    shortDesc: "ユーザーが詳細にペルソナを指定",
    color: "gray",
    icon: "✏️"
  }
};

export default function Upload() {
  const api = useApi();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [level, setLevel] = useState("beginner");
  const [persona, setPersona] = useState<keyof typeof PERSONAS>("curious");
  const [customPersona, setCustomPersona] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingUrl, setIsUploadingUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdf = async () => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!file) return;
    setIsUploadingPdf(true);
    try {
      const res = await api.uploadPdf(file);
      setMaterialId(res.material_id);
      notifications.show({ color: "green", message: `PDF 取り込み完了 (${res.chars} chars)` });
    } catch (e: any) {
      console.error('PDF upload error:', e);
      const errorMessage = e?.response?.data?.detail || e?.message || "PDF 取り込み失敗";
      notifications.show({ color: "red", message: errorMessage });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleUrl = async () => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!url) return;
    setIsUploadingUrl(true);
    try {
      const res = await api.uploadUrl(url);
      setMaterialId(res.material_id);
      notifications.show({ color: "green", message: `URL 取り込み完了 (${res.chars} chars)` });
    } catch (e: any) {
      console.error('URL upload error:', e);
      const errorMessage = e?.response?.data?.detail || e?.message || "URL 取り込み失敗";
      notifications.show({ color: "red", message: errorMessage });
    } finally {
      setIsUploadingUrl(false);
    }
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
    if (!materialId) return;
    setIsGenerating(true);
    try {
      // ペルソナの決定
      let finalPersona: string = persona;
      if (persona === "custom") {
        finalPersona = customPersona || "curious";
      }
      
      const res = await api.generateQuestions(materialId, level, finalPersona, questionCount);
      // Save questions to localStorage as per SpecKit requirements
      localStorage.setItem(`questions:${res.session_id}`, JSON.stringify(res.questions));
      // Save persona information to localStorage
      localStorage.setItem(`persona:${res.session_id}`, JSON.stringify({
        type: persona,
        description: persona === "custom" ? customPersona : PERSONAS[persona].description,
        name: persona === "custom" ? "カスタム生徒" : PERSONAS[persona].name
      }));
      window.location.href = `/teach/${res.session_id}`;
    } catch (e: any) {
      console.error('Question generation error:', e);
      let errorMessage = e?.response?.data?.detail || e?.message || "質問生成に失敗しました";
      
      // Gemini APIのクォータ制限エラーの場合
      if (errorMessage.includes("quota") || errorMessage.includes("rate") || errorMessage.includes("limit")) {
        errorMessage = "Gemini APIの1日あたりの使用制限に達しました。24時間後に再度お試しください。";
      }
      
      notifications.show({ color: "red", message: errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Guard showPreview={true}>
      <Container size="lg" py="xl">
        <Stack gap="xl">
        {/* Header Section */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              
              <div>
                <Title order={2} c="blue.7">教材アップロード</Title>
              </div>
            </Group>
          </Group>
        </Card>

        {/* Upload Section */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group align="start" grow>
              <Stack>
                <FileInput 
                  label="PDF を選択" 
                  placeholder="ファイルを選択してください" 
                  value={file} 
                  onChange={setFile}
                  size="md"
                />
                <Button 
                  onClick={handlePdf} 
                  disabled={!file || isUploadingPdf}
                  loading={isUploadingPdf}
                  size="sm"
                  leftSection={<IconUpload size={14} />}
                >
                  {isUploadingPdf ? "取り込み中..." : "PDF 取り込み"}
                </Button>
              </Stack>

              <Stack>
                <TextInput 
                  label="URL を入力" 
                  placeholder="https://example.com/article" 
                  value={url} 
                  onChange={(e) => setUrl(e.currentTarget.value)}
                  size="md"
                />
                <Button 
                  variant="light" 
                  onClick={handleUrl} 
                  disabled={!url || isUploadingUrl}
                  loading={isUploadingUrl}
                  size="sm"
                  leftSection={<IconLink size={14} />}
                >
                  {isUploadingUrl ? "取り込み中..." : "URL 取り込み"}
                </Button>
              </Stack>
            </Group>
          </Stack>
        </Card>

        {materialId && (
          <Alert color="blue" title="教材が登録されました">
            material_id: <b>{materialId}</b>
          </Alert>
        )}

        {materialId && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="lg">
              <Group gap="xs" align="center">
                <ThemeIcon size="sm" radius="xl" variant="light" color="green">
                  <IconBrain size={14} />
                </ThemeIcon>
                <Text fw={600} size="md">AI生徒の設定</Text>
              </Group>
              
              <Stack gap="md">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>ペルソナを選択</Text>
                  <SegmentedControl
                    value={persona}
                    onChange={(value) => setPersona(value as keyof typeof PERSONAS)}
                    data={[
                      { 
                        label: `${PERSONAS.curious.icon} 好奇心旺盛`, 
                        value: "curious" 
                      },
                      { 
                        label: `${PERSONAS.practical.icon} 実践重視`, 
                        value: "practical" 
                      },
                      { 
                        label: `${PERSONAS.analytical.icon} 論理的`, 
                        value: "analytical" 
                      },
                      { 
                        label: `${PERSONAS.custom.icon} カスタム指定`, 
                        value: "custom" 
                      }
                    ]}
                    fullWidth
                  />
                  
                  <Text size="sm" c="dimmed" ta="center">
                    {persona === "custom" && customPersona 
                      ? `カスタム: ${customPersona.substring(0, 30)}${customPersona.length > 30 ? "..." : ""}`
                      : PERSONAS[persona].shortDesc
                    }
                  </Text>
                </Stack>
                
                {persona === "custom" && (
                  <Textarea
                    label="ペルソナの詳細を入力"
                    placeholder="例: 数学が苦手で、視覚的な説明を好む生徒。図やグラフを使った説明を求める。"
                    value={customPersona}
                    onChange={(e) => setCustomPersona(e.currentTarget.value)}
                    minRows={2}
                    maxRows={4}
                  />
                )}

                <Group grow>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>質問レベル</Text>
                    <Select
                      value={level}
                      onChange={(value) => setLevel(value || "beginner")}
                      data={[
                        { label: "初級", value: "beginner" },
                        { label: "中級", value: "intermediate" },
                        { label: "上級", value: "advanced" }
                      ]}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" fw={500}>質問数</Text>
                    <Select
                      value={questionCount.toString()}
                      onChange={(value) => setQuestionCount(parseInt(value || "5"))}
                      data={[
                        { label: "1問", value: "1" },
                        { label: "3問", value: "3" },
                        { label: "5問", value: "5" }
                      ]}
                    />
                  </Stack>
                </Group>

                <Divider />

                <Button 
                  onClick={handleGenerate} 
                  disabled={!materialId || isGenerating}
                  loading={isGenerating}
                  size="lg"
                  fullWidth
                  leftSection={<IconPlayerPlay size={16} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {isGenerating ? "質問生成中..." : "学習を開始"}
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}

        {isGenerating && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" radius="xl" variant="light" color="blue">
                <Loader size={24} />
              </ThemeIcon>
              <div style={{ textAlign: 'center' }}>
                <Text fw={600} size="md" mb="xs">AIが質問を生成中です...</Text>
                <Text size="sm" c="dimmed">
                  教材の内容を分析して、適切な質問を作成しています
                </Text>
              </div>
            </Stack>
          </Card>
        )}
        </Stack>
      </Container>
    </Guard>
  );
}
