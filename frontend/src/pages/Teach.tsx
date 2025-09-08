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
    // Load questions from localStorage as per SpecKit requirements
    const cache = localStorage.getItem(`questions:${sessionId}`);
    if (cache) {
      const qs = JSON.parse(cache) as Q[];
      setQuestions(qs);
      setSelected(qs[0]);
    }
    
    // Load persona information from localStorage
    const personaCache = localStorage.getItem(`persona:${sessionId}`);
    if (personaCache) {
      const persona = JSON.parse(personaCache) as PersonaInfo;
      setPersonaInfo(persona);
    }
  }, [sessionId]);

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
      notifications.show({ color: "red", message: e?.message ?? "送信失敗" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Guard showPreview={true}>
      <Container size="xl" p="xl">
        <Stack gap="xl">
          {/* Header Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
  
  <Title order={1} size="h2" fw={700} c="blue.7">
  AI生徒の質問に答えよう
  </Title>
</Group>

              {sessionId && (
                <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  Session: {sessionId.substring(0, 8)}...
                </Badge>
              )}
            </Group>
          </Card>

          {/* Persona Info */}
          {personaInfo && (
            <Alert color="blue" title={`AI生徒: ${personaInfo.name}`} >
            </Alert>
          )}

          {/* Progress Indicator */}
          {questions.length > 0 && (
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">学習進捗</Text>
                  <Text size="sm" c="dimmed">
                    {questions.findIndex(q => q.id === selected?.id) + 1} / {questions.length}
                  </Text>
                </Group>
                <Progress 
                  value={((questions.findIndex(q => q.id === selected?.id) + 1) / questions.length) * 100}
                  size="sm"
                  radius="xl"
                  color="blue"
                />
              </Stack>
            </Card>
          )}

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
                            borderColor: selected?.id === q.id ? "var(--mantine-color-blue-6)" : undefined,
                            backgroundColor: selected?.id === q.id ? "var(--mantine-color-blue-0)" : undefined,
                            transition: "all 0.2s"
                          }}
                        >
                          <Group>
                            <Badge size="sm" variant="light" color="blue">
                              Q{index + 1}
                            </Badge>
                            <Text size="sm" fw={500} style={{ flex: 1 }}>
                              {q.question}
                            </Text>
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
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group>
                      <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                        <IconSend size={20} />
                      </ThemeIcon>
                      <Title order={3}>先生の回答</Title>
                    </Group>
                    
                    <Textarea
                      autosize 
                      minRows={8}
                      placeholder="AI 生徒にわかるように、やさしく・論理的に説明を書いてください。"
                      value={answer}
                      onChange={(e) => setAnswer(e.currentTarget.value)}
                      size="md"
                    />
                    
                    <Button 
                      onClick={submit} 
                      disabled={!canSubmit || isLoading}
                      loading={isLoading}
                      size="lg"
                      fullWidth
                      variant="gradient"
                      gradient={{ from: 'green', to: 'teal' }}
                      leftSection={<IconSend size={16} />}
                    >
                      {isLoading ? "評価中..." : "回答を送信"}
                    </Button>
                  </Stack>
                </Card>

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
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Group>
                          <ThemeIcon size="md" radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                            <IconStar size={16} />
                          </ThemeIcon>
                          <Title order={4}>AI フィードバック</Title>
                        </Group>
                        <Badge 
                          size="lg"
                          variant="gradient"
                          gradient={
                            feedback.score >= 80 ? { from: 'green', to: 'teal' } :
                            feedback.score >= 60 ? { from: 'yellow', to: 'orange' } :
                            feedback.score >= 40 ? { from: 'orange', to: 'red' } : 
                            { from: 'red', to: 'pink' }
                          }
                        >
                          {feedback.score}/100
                        </Badge>
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
