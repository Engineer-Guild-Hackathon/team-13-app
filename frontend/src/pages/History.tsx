import { useEffect, useState } from "react";
import { Button, Card, Group, Stack, Text, Title, Badge, Container, ThemeIcon, Grid, Paper } from "@mantine/core";
import { IconHistory, IconBook, IconPlayerPlay, IconCalendar } from "@tabler/icons-react";
import Guard from "../components/Guard";
import { useApi } from "../lib/api";
import { Link } from "react-router-dom";

export default function History() {
  const api = useApi();
  const [sessions, setSessions] = useState<
    { session_id: string; material_id: string; material_title: string; level: string; questions: { id: string; question: string }[] }[]
  >([]);

  useEffect(() => {
    api.history().then((d) => setSessions(d.sessions)).catch(() => setSessions([]));
  }, []);

  return (
    <Guard>
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Header Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="xs" align="center">
                
  
                <div>
                  <Title order={2} c="blue.7">履歴</Title>
                  <Text size="sm" c="dimmed">過去の学習セッションを確認・再開できます</Text>
                </div>
              </Group>
              <Badge size="lg" variant="light" color="blue">
                {sessions.length} セッション
              </Badge>
            </Group>
          </Card>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                  <IconBook size={32} />
                </ThemeIcon>
                <Text size="lg" c="dimmed">履歴がありません</Text>
                <Text size="sm" c="dimmed" ta="center">
                  教材をアップロードして学習を開始しましょう
                </Text>
              </Stack>
            </Card>
          ) : (
            <Grid>
              {sessions.map((s) => (
                <Grid.Col key={s.session_id} span={{ base: 12, md: 6, lg: 4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                    <Stack gap="md" h="100%">
                      {/* Header */}
                      <Group justify="space-between" align="start">
                        <Badge 
                          size="sm" 
                          variant="light" 
                          color={
                            s.level === 'beginner' ? 'green' : 
                            s.level === 'intermediate' ? 'blue' : 'red'
                          }
                        >
                          {s.level === 'beginner' ? '初級' : 
                           s.level === 'intermediate' ? '中級' : '上級'}
                        </Badge>
                        <Button 
                          component={Link} 
                          to={`/teach/${s.session_id}`} 
                          variant="light" 
                          size="xs"
                          leftSection={<IconPlayerPlay size={12} />}
                        >
                          再開
                        </Button>
                      </Group>

                      {/* Title */}
                      <div>
                        <Text fw={600} size="md" lineClamp={2}>
                          {s.material_title}
                        </Text>
                      </div>

                      {/* Questions Preview */}
                      <Paper p="sm" radius="sm" withBorder>
                        <Text size="xs" fw={500} c="dimmed" mb="xs">
                          質問プレビュー
                        </Text>
                        <Stack gap="xs">
                          {s.questions.slice(0, 2).map((q, index) => (
                            <Text key={q.id} size="sm" lineClamp={2}>
                              Q{index + 1}: {q.question}
                            </Text>
                          ))}
                          {s.questions.length > 2 && (
                            <Text size="xs" c="dimmed">
                              +{s.questions.length - 2} 個の質問
                            </Text>
                          )}
                        </Stack>
                      </Paper>

                      {/* Footer */}
                      <Group justify="space-between" align="center" mt="auto">
                        <Group gap="xs">
                          <IconCalendar size={12} />
                          <Text size="xs" c="dimmed">
                            {new Date().toLocaleDateString('ja-JP')}
                          </Text>
                        </Group>
                        <Badge size="xs" variant="light" color="gray">
                          {s.questions.length} 問
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Container>
    </Guard>
  );
}
