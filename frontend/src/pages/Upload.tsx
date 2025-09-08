import { useState } from "react";
import { Button, FileInput, Group, Stack, Text, TextInput, Title, SegmentedControl, Alert, Loader, Center } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useApi } from "../lib/api";

export default function Upload() {
  const api = useApi();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [level, setLevel] = useState("beginner");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdf = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadPdf(file);
      setMaterialId(res.material_id);
      notifications.show({ color: "green", message: `PDF 取り込み完了 (${res.chars} chars)` });
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.message ?? "PDF 取り込み失敗" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrl = async () => {
    if (!url) return;
    setIsUploading(true);
    try {
      const res = await api.uploadUrl(url);
      setMaterialId(res.material_id);
      notifications.show({ color: "green", message: `URL 取り込み完了 (${res.chars} chars)` });
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.message ?? "URL 取り込み失敗" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!materialId) return;
    setIsGenerating(true);
    try {
      const res = await api.generateQuestions(materialId, level, 5);
      // Save questions to localStorage as per SpecKit requirements
      localStorage.setItem(`questions:${res.session_id}`, JSON.stringify(res.questions));
      window.location.href = `/teach/${res.session_id}`;
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.message ?? "質問生成に失敗しました" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Stack gap="lg">
        <Title order={2}>教材アップロード</Title>

        <Stack>
          <FileInput label="PDF を選択" placeholder="Choose file" value={file} onChange={setFile} />
          <Group>
            <Button 
              onClick={handlePdf} 
              disabled={!file || isUploading}
              loading={isUploading}
            >
              {isUploading ? "取り込み中..." : "PDF 取り込み"}
            </Button>
          </Group>
        </Stack>

        <Stack>
          <TextInput label="URL を入力" placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.currentTarget.value)} />
          <Group>
            <Button 
              variant="light" 
              onClick={handleUrl} 
              disabled={!url || isUploading}
              loading={isUploading}
            >
              {isUploading ? "取り込み中..." : "URL 取り込み"}
            </Button>
          </Group>
        </Stack>

        {materialId && (
          <Alert color="blue" title="教材が登録されました">
            material_id: <b>{materialId}</b>
          </Alert>
        )}

        <Stack>
          <Text fw={600}>質問レベル</Text>
          <SegmentedControl
            value={level}
            onChange={setLevel}
            data={[
              { label: "初級", value: "beginner" },
              { label: "中級", value: "intermediate" },
              { label: "上級", value: "advanced" }
            ]}
          />
          <Group>
            <Button 
              onClick={handleGenerate} 
              disabled={!materialId || isGenerating}
              loading={isGenerating}
            >
              {isGenerating ? "質問生成中..." : "AI 生徒の質問を生成"}
            </Button>
          </Group>
        </Stack>

        {isGenerating && (
          <Alert color="blue" title="AIが質問を生成中です...">
            <Center p="md">
              <Stack align="center" gap="md">
                <Loader size="lg" color="blue" />
                <Text size="sm" c="dimmed">
                  教材の内容を分析して、適切な質問を作成しています
                </Text>
              </Stack>
            </Center>
          </Alert>
        )}
      </Stack>
  );
}
