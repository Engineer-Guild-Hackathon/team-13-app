import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Group, Stack, Text, Textarea, Title, Badge, Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Guard from "../components/Guard";
import { useApi } from "../lib/api";

type Q = { id: string; question: string };

export default function Teach() {
  const { sessionId } = useParams();
  const api = useApi();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [selected, setSelected] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<null | {
    score: number; strengths: string[]; suggestions: string[]; model_answer: string;
  }>(null);

  useEffect(() => {
    // Load questions from localStorage as per SpecKit requirements
    const cache = localStorage.getItem(`questions:${sessionId}`);
    if (cache) {
      const qs = JSON.parse(cache) as Q[];
      setQuestions(qs);
      setSelected(qs[0]);
    }
  }, [sessionId]);

  const canSubmit = useMemo(() => !!(sessionId && selected && answer.trim().length > 0), [sessionId, selected, answer]);

  const submit = async () => {
    if (!sessionId || !selected) return;
    try {
      const res = await api.submitAnswer(sessionId, selected.id, answer);
      setFeedback(res.feedback);
      notifications.show({ color: "green", message: "フィードバックを受信しました" });
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.message ?? "送信失敗" });
    }
  };

  return (
    <Guard>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Teach セッション</Title>
          {sessionId && <Badge>Session: {sessionId}</Badge>}
        </Group>

        <Group align="start" wrap="nowrap">
          <Stack w="40%" gap="xs">
            {questions.length === 0 && <Text c="dimmed">質問が表示されない場合、Upload から新しい質問を生成してください。</Text>}
            {questions.map((q) => (
              <Card
                key={q.id}
                withBorder
                onClick={() => setSelected(q)}
                style={{ cursor: "pointer", borderColor: selected?.id === q.id ? "var(--mantine-color-blue-6)" : undefined }}
              >
                <Text>{q.question}</Text>
              </Card>
            ))}
          </Stack>

          <Stack w="60%" gap="sm">
            <Card withBorder>
              <Title order={4}>先生の回答</Title>
              <Textarea
                autosize minRows={6}
                placeholder="AI 生徒にわかるように、やさしく・論理的に説明を書いてください。"
                value={answer}
                onChange={(e) => setAnswer(e.currentTarget.value)}
              />
              <Group justify="end" mt="sm">
                <Button onClick={submit} disabled={!canSubmit}>送信</Button>
              </Group>
            </Card>

            {feedback && (
              <Card withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={4}>AI フィードバック</Title>
                  <Badge 
                    color={
                      feedback.score >= 80 ? "green" : 
                      feedback.score >= 60 ? "yellow" : 
                      feedback.score >= 40 ? "orange" : "red"
                    }
                    size="lg"
                  >
                    Score: {feedback.score}/100
                  </Badge>
                </Group>

                {feedback.strengths?.length > 0 && (
                  <Stack gap="sm" mb="md">
                    <Text fw={600} c="green" size="lg">✅ 良い点</Text>
                    <Stack gap="xs" pl="md">
                      {feedback.strengths.map((strength, i) => (
                        <Text key={i} size="sm" c="gray.2">
                          • {strength}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                )}

                {feedback.suggestions?.length > 0 && (
                  <Stack gap="sm" mb="md">
                    <Text fw={600} c="blue" size="lg">改善提案</Text>
                    <Stack gap="xs" pl="md">
                      {feedback.suggestions.map((suggestion, i) => (
                        <Text key={i} size="sm" c="gray.2">
                          • {suggestion}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                )}

                {feedback.model_answer && (
                  <Stack gap="sm">
                    <Text fw={600} c="violet" size="lg">模範解答</Text>
                     <Paper p="md" withBorder radius="md" bg="blue.9">
                      <Text size="sm" c="blue.1">{feedback.model_answer}</Text>
                    </Paper>

                  </Stack>
                )}
              </Card>
            )}
          </Stack>
        </Group>
      </Stack>
    </Guard>
  );
}
