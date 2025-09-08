import { Button, Group, Stack, Text, Title, Container, Card, Avatar, Badge, Grid, Center, ThemeIcon, Loader } from "@mantine/core";
import { Link } from "react-router-dom";
import Guard from "../components/Guard";
import { useAuth0 } from "@auth0/auth0-react";
import { IconBook, IconHistory, IconUser, IconLogout, IconLogin } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useApi } from "../lib/api";

export default function Dashboard() {
  const { user, logout, isAuthenticated, loginWithRedirect } = useAuth0();
  const api = useApi();
  const [stats, setStats] = useState({
    materialCount: 0,
    sessionCount: 0,
    answerCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const historyData = await api.history();
        const sessions = historyData.sessions;
        
        // ユニークな教材IDを取得
        const uniqueMaterials = new Set(sessions.map(s => s.material_id));
        
        // 総回答数を計算（各セッションの質問数）
        const totalAnswers = sessions.reduce((sum, session) => sum + session.questions.length, 0);
        
        setStats({
          materialCount: uniqueMaterials.size,
          sessionCount: sessions.length,
          answerCount: totalAnswers
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [api]);

  return (
    <Guard showPreview={true}>
      <Container size="lg" p="xl">
        <Stack gap="xl">
          {/* Header Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Group>
                <Avatar
                  src={isAuthenticated ? user?.picture : undefined}
                  alt={isAuthenticated ? user?.name : "ゲスト"}
                  size="lg"
                  radius="xl"
                >
                  {!isAuthenticated && <IconUser size={24} />}
                </Avatar>
                <Stack gap="xs">
                  <Title order={2} c="blue.7">
                    {isAuthenticated ? `ようこそ、${user?.name ?? "先生"} 先生！` : "UTeach へようこそ"}
                  </Title>
                  <Text c="dimmed" size="lg">
                    {isAuthenticated ? "UTeach で AI 生徒に教えていきましょう" : "AI 生徒との対話で学習を深めましょう"}
                  </Text>
                </Stack>
              </Group>
              {isAuthenticated ? (
                <Button 
                  variant="light" 
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                >
                  ログアウト
                </Button>
              ) : null}
            </Group>
          </Card>

          {/* Quick Actions */}
          <div>
            <Title order={3} mb="md" c="blue.7">クイックアクション</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card 
                  shadow="sm" 
                  padding="xl" 
                  radius="md" 
                  withBorder
                  style={{ 
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    height: "100%"
                  }}
                  component={Link}
                  to="/upload"
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconBook size={32} />
                    </ThemeIcon>
                    <Title order={4} ta="center">教材をアップロード</Title>
                    <Text ta="center" c="dimmed" size="sm">
                      PDFファイルやWebページから教材をアップロードして、AI生徒との学習を始めましょう
                    </Text>
                    <Button 
                      variant="gradient" 
                      gradient={{ from: 'blue', to: 'cyan' }}
                      fullWidth
                      mt="md"
                    >
                      アップロード開始
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Card 
                  shadow="sm" 
                  padding="xl" 
                  radius="md" 
                  withBorder
                  style={{ 
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    height: "100%"
                  }}
                  component={Link}
                  to="/history"
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                      <IconHistory size={32} />
                    </ThemeIcon>
                    <Title order={4} ta="center">学習履歴</Title>
                    <Text ta="center" c="dimmed" size="sm">
                      過去の学習セッションやAI生徒との対話履歴を確認できます
                    </Text>
                    <Button 
                      variant="gradient" 
                      gradient={{ from: 'green', to: 'teal' }}
                      fullWidth
                      mt="md"
                    >
                      履歴を見る
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          </div>

          {/* Stats Section */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md" c="blue.7">
              {isAuthenticated ? "AI生徒の学習統計" : "UTeach の機能"}
            </Title>
            {!isAuthenticated ? (
              <Grid>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        PDF
                      </Badge>
                      <Text fw={500}>教材アップロード</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                        AI
                      </Badge>
                      <Text fw={500}>質問生成</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                        💬
                      </Badge>
                      <Text fw={500}>対話学習</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
              </Grid>
            ) : isLoading ? (
              <Center p="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed">統計を読み込み中...</Text>
                </Stack>
              </Center>
            ) : (
              <Grid>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        {stats.materialCount}
                      </Badge>
                      <Text fw={500}>教材数</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                        {stats.sessionCount}
                      </Badge>
                      <Text fw={500}>学習セッション</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Center>
                    <Stack align="center" gap="xs">
                      <Badge size="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                        {stats.answerCount}
                      </Badge>
                      <Text fw={500}>回答数</Text>
                    </Stack>
                  </Center>
                </Grid.Col>
              </Grid>
            )}
          </Card>
        </Stack>
      </Container>
    </Guard>
  );
}
