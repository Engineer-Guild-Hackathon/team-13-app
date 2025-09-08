import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, Group, Stack, Text, Textarea, Title, Badge, Paper, Loader, Center, Alert, Container, Grid, ThemeIcon, Divider, Progress } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Guard from "../components/Guard";
import { useApi } from "../lib/api";
import { IconMessageCircle, IconSend, IconCheck, IconX, IconStar } from "@tabler/icons-react";

type Q = { id: string; question: string };
type PersonaInfo = { type: string; description: string; name: string };

export default function Teach() {
  const { sessionId } = useParams();
  const api = useApi();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [selected, setSelected] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<null | {
    score: number; strengths: string[]; suggestions: string[]; model_answer: string;
  }>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [personaInfo, setPersonaInfo] = useState<PersonaInfo | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    
    // Load questions from localStorage as per SpecKit requirements
    const cache = localStorage.getItem(`questions:${sessionId}`);
    if (cache) {
      try {
        const qs = JSON.parse(cache) as Q[];
        if (qs && qs.length > 0) {
          setQuestions(qs);
          
          // 保存された選択された質問を復元
          const savedSelectedId = localStorage.getItem(`selectedQuestion:${sessionId}`);
          if (savedSelectedId) {
            const savedQuestion = qs.find(q => q.id === savedSelectedId);
            if (savedQuestion) {
              setSelected(savedQuestion);
            } else {
              setSelected(qs[0]);
            }
          } else {
            setSelected(qs[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing questions from localStorage:', error);
      }
    }
    
    // Load persona information from localStorage
    const personaCache = localStorage.getItem(`persona:${sessionId}`);
    if (personaCache) {
      try {
        const persona = JSON.parse(personaCache) as PersonaInfo;
        setPersonaInfo(persona);
      } catch (error) {
        console.error('Error parsing persona from localStorage:', error);
      }
    }

    // Load saved answer from localStorage
    const savedAnswer = localStorage.getItem(`answer:${sessionId}`);
    if (savedAnswer) {
      setAnswer(savedAnswer);
    }
  }, [sessionId]);

  // 状態の永続化 - 質問が変更されたときにlocalStorageに保存
  useEffect(() => {
    if (sessionId && questions.length > 0) {
      localStorage.setItem(`questions:${sessionId}`, JSON.stringify(questions));
    }
  }, [questions, sessionId]);

  // 選択された質問の永続化
  useEffect(() => {
    if (sessionId && selected) {
      localStorage.setItem(`selectedQuestion:${sessionId}`, selected.id);
    }
  }, [selected, sessionId]);

  // 回答の永続化
  useEffect(() => {
    if (sessionId && answer) {
      localStorage.setItem(`answer:${sessionId}`, answer);
    }
  }, [answer, sessionId]);

  const canSubmit = useMemo(() => !!(sessionId && selected && answer.trim().length > 0), [sessionId, selected, answer]);

  const submit = async () => {
    if (!sessionId || !selected) return;
    setIsLoading(true);
    setFeedback(null); // 前のフィードバックをクリア
    try {
      const res = await api.submitAnswer(sessionId, selected.id, answer);
      setFeedback(res.feedback);
      notifications.show({ color: "green", message: "フィードバックを受信しました" });
    } catch (e: any) {
      console.error('Submit answer error:', e);
      let errorMessage = e?.response?.data?.detail || e?.message || "送信失敗";
      
      // Gemini APIのクォータ制限エラーの場合
      if (errorMessage.includes("quota") || errorMessage.includes("rate") || errorMessage.includes("limit")) {
        errorMessage = "Gemini APIの1日あたりの使用制限に達しました。24時間後に再度お試しください。";
      }
      
      notifications.show({ color: "red", message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Guard showPreview={true}>
      <Container size="xl" p="xl">
        <Stack gap="xl">
          {/* Header Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ 
            background: "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-cyan-0) 100%)",
            borderColor: "var(--mantine-color-blue-3)"
          }}>
            <Group justify="space-between" align="center">
              <Group gap="md" align="center">
                
                <Stack gap="xs">
                  <Title order={1} size="h2" fw={700} >
                    🎓AI生徒の質問に答えよう
                  </Title>
                  <Text size="sm" c="blue.1" fw={500}>
                    選択した質問に分かりやすく回答してください
                  </Text>
                </Stack>
              </Group>

              
            </Group>
          </Card>

          <Grid>
            {/* Questions Panel */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group>
                    <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconMessageCircle size={20} />
                    </ThemeIcon>
                    <Title order={3}>AI生徒の質問</Title>
                  </Group>
                  
                  {questions.length === 0 ? (
                    <Center p="xl">
                      <Stack align="center" gap="md">
                        <Text c="dimmed" ta="center">
                          質問が表示されない場合、Upload から新しい質問を生成してください。
                        </Text>
                      </Stack>
                    </Center>
                  ) : (
                    <Stack gap="sm">
                      {questions.map((q, index) => (
                        <Card
                          key={q.id}
                          withBorder
                          padding="md"
                          radius="md"
                          onClick={() => {
                            setSelected(q);
                            setFeedback(null);
                            setIsLoading(false);
                          }}
                          style={{ 
                            cursor: "pointer", 
                            borderColor: selected?.id === q.id ? "var(--mantine-color-blue-4)" : "var(--mantine-color-gray-3)",
                            borderWidth: selected?.id === q.id ? "2px" : "1px",
                            backgroundColor: selected?.id === q.id ? "var(--mantine-color-blue-0)" : "transparent",
                            transition: "all 0.3s ease",
                            transform: selected?.id === q.id ? "translateY(-2px)" : "translateY(0)",
                            boxShadow: selected?.id === q.id ? "0 4px 12px rgba(34, 139, 34, 0.15)" : "0 1px 3px rgba(0, 0, 0, 0.1)"
                          }}
                          onMouseEnter={(e) => {
                            if (selected?.id !== q.id) {
                              e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-0)";
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selected?.id !== q.id) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                            }
                          }}
                        >
                          <Group gap="sm" align="flex-start">
                            <Badge 
                              size="lg" 
                              variant={selected?.id === q.id ? "filled" : "light"} 
                              color={selected?.id === q.id ? "blue" : "gray"}
                              style={{
                                minWidth: "40px",
                                textAlign: "center"
                              }}
                            >
                              {index + 1}
                            </Badge>
                            <Stack gap="xs" style={{ flex: 1 }}>
                              <Text 
                                size="sm" 
                                fw={selected?.id === q.id ? 600 : 500}
                                style={{
                                  lineHeight: 1.4,
                                  color: selected?.id === q.id ? "var(--mantine-color-blue-8)" : "var(--mantine-color-gray-8)"
                                }}
                              >
                                {q.question}
                              </Text>
                              {selected?.id === q.id && (
                                <Text size="xs" c="blue" fw={500}>
                                  選択中 - この質問に回答してください
                                </Text>
                              )}
                            </Stack>
                            {selected?.id === q.id && (
                              <ThemeIcon size="sm" color="blue" variant="light">
                                <IconCheck size={14} />
                              </ThemeIcon>
                            )}
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            {/* Answer Panel */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="md">
                {selected ? (
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Group>
                          <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                            <IconSend size={20} />
                          </ThemeIcon>
                          <Title order={3}>先生の回答</Title>
                        </Group>
                        <Badge size="lg" variant="light" color="green">
                          質問 {questions.findIndex(q => q.id === selected.id) + 1} / {questions.length}
                        </Badge>
                      </Group>
                      
                      {/* Selected Question Display */}
                      
                      
                      <Textarea
                        autosize 
                        minRows={8}
                        placeholder="AI 生徒にわかるように、やさしく・論理的に説明を書いてください。"
                        value={answer}
                        onChange={(e) => setAnswer(e.currentTarget.value)}
                        size="md"
                        style={{
                          border: answer.trim() ? "2px solid var(--mantine-color-green-4)" : undefined,
                          transition: "border-color 0.3s ease"
                        }}
                      />
                      
                      {/* Character count and tips */}
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          {answer.length} 文字
                        </Text>
                        <Text size="xs" c="dimmed">
                          💡 具体的な例や図解があると理解しやすくなります
                        </Text>
                      </Group>
                      
                      <Button 
                        onClick={submit} 
                        disabled={!canSubmit || isLoading}
                        loading={isLoading}
                        size="lg"
                        fullWidth
                        variant="gradient"
                        gradient={{ from: 'green', to: 'teal' }}
                        leftSection={<IconSend size={16} />}
                        style={{
                          transform: canSubmit ? "scale(1)" : "scale(0.98)",
                          transition: "transform 0.2s ease"
                        }}
                      >
                        {isLoading ? "評価中..." : "回答を送信"}
                      </Button>
                    </Stack>
                  </Card>
                ) : (
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Center p="xl">
                      <Stack align="center" gap="md">
                        <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                          <IconMessageCircle size={32} />
                        </ThemeIcon>
                        <Text size="lg" fw={600} c="dimmed">
                          質問を選択してください
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          左側の質問リストから回答したい質問をクリックしてください
                        </Text>
                      </Stack>
                    </Center>
                  </Card>
                )}

                {isLoading && (
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Center p="xl">
                      <Stack align="center" gap="md">
                        <Loader size="xl" color="blue" />
                        <Text size="lg" fw={600} c="blue">
                          🤖 AIが回答を評価中です...
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          しばらくお待ちください
                        </Text>
                      </Stack>
                    </Center>
                  </Card>
                )}

                {feedback && (
                  <Card shadow="lg" padding="lg" radius="md" withBorder style={{ 
                    borderColor: feedback.score >= 80 ? "var(--mantine-color-green-4)" : 
                                 feedback.score >= 60 ? "var(--mantine-color-yellow-4)" : 
                                 feedback.score >= 40 ? "var(--mantine-color-orange-4)" : "var(--mantine-color-red-4)",
                    borderWidth: "2px"
                  }}>
                    <Stack gap="md">
                      <Group justify="space-between" align="center">
                        <Group>
                          <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                            <IconStar size={20} />
                          </ThemeIcon>
                          <Title order={3}>🤖 AI フィードバック</Title>
                        </Group>
                        <Stack align="center" gap="xs">
                          <Badge 
                            size="xl"
                            variant="gradient"
                            gradient={
                              feedback.score >= 80 ? { from: 'green', to: 'teal' } :
                              feedback.score >= 60 ? { from: 'yellow', to: 'orange' } :
                              feedback.score >= 40 ? { from: 'orange', to: 'red' } : 
                              { from: 'red', to: 'pink' }
                            }
                            style={{ fontSize: "16px", fontWeight: 700 }}
                          >
                            {feedback.score}/100
                          </Badge>
                          <Text size="xs" c="dimmed" ta="center">
                            {feedback.score >= 80 ? "素晴らしい！" : 
                             feedback.score >= 60 ? "良い回答です" : 
                             feedback.score >= 40 ? "もう少し改善を" : "頑張りましょう"}
                          </Text>
                        </Stack>
                      </Group>

                      <Grid>
                        {feedback.strengths?.length > 0 && (
                          <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Paper p="sm" radius="md" bg="green.0" withBorder>
                              <Stack gap="xs">
                                <Group gap="xs">
                                  <IconCheck size={16} color="var(--mantine-color-green-6)" />
                                  <Text fw={600} c="green" size="sm">✅ 良い点</Text>
                                </Group>
                                <Stack gap="xs">
                                  {feedback.strengths.slice(0, 2).map((strength, i) => (
                                    <Text key={i} size="xs" c="green.7">
                                      • {strength}
                                    </Text>
                                  ))}
                                  {feedback.strengths.length > 2 && (
                                    <Text size="xs" c="green.6" fw={500}>
                                      +{feedback.strengths.length - 2}件
                                    </Text>
                                  )}
                                </Stack>
                              </Stack>
                            </Paper>
                          </Grid.Col>
                        )}

                        {feedback.suggestions?.length > 0 && (
                          <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Paper p="sm" radius="md" bg="blue.0" withBorder>
                              <Stack gap="xs">
                                <Group gap="xs">
                                  <IconMessageCircle size={16} color="var(--mantine-color-blue-6)" />
                                  <Text fw={600} c="blue" size="sm">改善提案</Text>
                                </Group>
                                <Stack gap="xs">
                                  {feedback.suggestions.slice(0, 2).map((suggestion, i) => (
                                    <Text key={i} size="xs" c="blue.7">
                                      • {suggestion}
                                    </Text>
                                  ))}
                                  {feedback.suggestions.length > 2 && (
                                    <Text size="xs" c="blue.6" fw={500}>
                                      +{feedback.suggestions.length - 2}件
                                    </Text>
                                  )}
                                </Stack>
                              </Stack>
                            </Paper>
                          </Grid.Col>
                        )}
                      </Grid>

                      {feedback.model_answer && (
                        <Paper p="sm" radius="md" bg="violet.0" withBorder>
                          <Stack gap="xs">
                            <Group gap="xs">
                              <IconStar size={16} color="var(--mantine-color-violet-6)" />
                              <Text fw={600} c="violet" size="sm">模範解答</Text>
                            </Group>
                            <Text size="xs" c="violet.8" lineClamp={3}>
                              {feedback.model_answer}
                            </Text>
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </Guard>
  );
}
