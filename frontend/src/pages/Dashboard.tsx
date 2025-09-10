import { Button, Group, Stack, Text, Title, Container, Card, Avatar, Badge, Grid, Center, ThemeIcon, Loader, ActionIcon, Paper, SimpleGrid, Box, Checkbox } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import Guard from "../components/Guard";
import { useAuth0 } from "@auth0/auth0-react";
import { IconBook, IconHistory, IconUser, IconLogout, IconLogin, IconPlus, IconBrain, IconMessageCircle, IconSettings, IconChartBar, IconPlayerPlay, IconCalendar, IconDots, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import { notifications } from "@mantine/notifications";

export default function Dashboard() {
  const { user, logout, isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const api = useApi();
  const [stats, setStats] = useState({
    materialCount: 0,
    sessionCount: 0,
    answerCount: 0
  });
  const [sessions, setSessions] = useState<
    { session_id: string; material_id: string; material_title: string; notebook_name?: string; level: string; questions: { id: string; question: string }[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  // 選択削除システムを削除

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setSessions([]);
        setStats({ materialCount: 0, sessionCount: 0, answerCount: 0 });
        setIsLoading(false);
        return;
      }

      try {
        // ユーザー固有のlocalStorageキーを使用
        const userHistoryKey = user ? `notebook_history_${user.sub}` : 'notebook_history';
        const localHistory = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
        
        // APIからも履歴を取得（既存のデータと統合）
        const historyData = await api.history();
        const apiSessions = historyData.sessions || [];
        
        // 両方のデータを統合（重複を避ける）
        const allSessions = [...localHistory, ...apiSessions];
        const uniqueSessions = allSessions.filter((session, index, self) => 
          index === self.findIndex(s => s.session_id === session.session_id)
        );
        
        setSessions(uniqueSessions);
        
        // 統計を計算
        const materialCount = new Set(uniqueSessions.map(session => session.material_id)).size;
        const sessionCount = uniqueSessions.length;
        const answerCount = uniqueSessions.reduce((sum, session) => sum + session.questions.length, 0);
        
        setStats({
          materialCount,
          sessionCount,
          answerCount
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // エラーの場合はlocalStorageのデータのみ使用
        const localHistory = JSON.parse(localStorage.getItem('notebook_history') || '[]');
        setSessions(localHistory);
        setStats({
          materialCount: new Set(localHistory.map((s: any) => s.material_id)).size,
          sessionCount: localHistory.length,
          answerCount: localHistory.reduce((sum: number, session: any) => sum + session.questions.length, 0)
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [api, isAuthenticated]);

  const handleCreateNotebook = () => {
    navigate('/notebook/new');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // APIからセッションを削除
      await api.deleteSession(sessionId);
      
      // ユーザー固有のlocalStorageキーを使用
      const userHistoryKey = user ? `notebook_history_${user.sub}` : 'notebook_history';
      const existingHistory = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
      const updatedHistory = existingHistory.filter((session: any) => session.session_id !== sessionId);
      localStorage.setItem(userHistoryKey, JSON.stringify(updatedHistory));
      
      // ノートブックデータも削除
      localStorage.removeItem(`notebook:${sessionId}`);
      
      // ローカル状態を更新
      setSessions(prev => {
        const filtered = prev.filter(session => session.session_id !== sessionId);
        
        // 統計を再計算
        const materialCount = new Set(filtered.map(session => session.material_id)).size;
        const sessionCount = filtered.length;
        const answerCount = filtered.reduce((sum, session) => sum + session.questions.length, 0);
        
        setStats({
          materialCount,
          sessionCount,
          answerCount
        });
        
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      // APIから全履歴を削除（エラーが発生しても続行）
      try {
        await api.clearHistory();
      } catch (apiError) {
        console.warn('API clear failed, continuing with local clear:', apiError);
      }
      
      // ユーザー固有の履歴をクリア
      const userHistoryKey = user ? `notebook_history_${user.sub}` : 'notebook_history';
      localStorage.removeItem(userHistoryKey);
      
      // 全ノートブックデータもクリア（存在しないファイルのデータを削除）
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('notebook:') || key.includes('TED') || key.includes('pdf'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // ローカル状態をリセット
      setSessions([]);
      setStats({
        materialCount: 0,
        sessionCount: 0,
        answerCount: 0
      });
      
      notifications.show({
        title: '履歴をクリアしました',
        message: `ローカルの履歴とノートブックデータが削除されました（${keysToRemove.length}件）`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      notifications.show({
        title: 'エラー',
        message: '履歴の削除に失敗しました',
        color: 'red'
      });
    }
  };

  return (
    <Guard showPreview={true}>
      <Container size="xl" p="lg">
        <Stack gap="xl">
          {/* Header Section */}
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Title order={1} size="h1">
                Recent notebooks
              </Title>
              {isAuthenticated && sessions.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleClearAllHistory}
                >
                  Clear All
                </Button>
              )}
            </Group>
            <Text c="dimmed" size="md">
              {isAuthenticated ? "" : "ログインして学習を始めましょう"}
            </Text>
          </Stack>

          {/* Notebook Grid */}
          <Grid>
            {/* Create New Notebook Card */}
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card 
                shadow="sm" 
                p="xl" 
                radius="md" 
                withBorder 
                h="100%"
                style={{ 
                  cursor: "pointer",
                  backgroundColor: "var(--mantine-color-gray-1)",
                  border: "2px dashed var(--mantine-color-gray-4)",
                  transition: "all 0.2s ease"
                }}
                onClick={handleCreateNotebook}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-2)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-blue-4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-1)";
                  e.currentTarget.style.borderColor = "var(--mantine-color-gray-4)";
                }}
              >
                <Stack align="center" gap="md" h="100%" justify="center">
                  <ThemeIcon size={60} radius="xl" variant="light" color="blue">
                    <IconPlus size={30} />
                  </ThemeIcon>
                  <Text ta="center" fw={500} size="md">
                    Create new notebook
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Recent Notebooks */}
            {isAuthenticated ? (
              isLoading ? (
                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card shadow="sm" p="xl" radius="md" withBorder h="100%">
                    <Center h="100%">
                      <Stack align="center" gap="md">
                        <Loader size="lg" color="blue" />
                        <Text c="dimmed">読み込み中...</Text>
                      </Stack>
                    </Center>
                  </Card>
                </Grid.Col>
              ) : sessions.length === 0 ? (
                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card shadow="sm" p="xl" radius="md" withBorder h="100%">
                    <Center h="100%">
                      <Stack align="center" gap="md">
                        <ThemeIcon size="xl" variant="light" color="gray">
                          <IconBook size={32} />
                        </ThemeIcon>
                        <Text ta="center" c="dimmed">
                          まだNotebookがありません
                        </Text>
                      </Stack>
                    </Center>
                  </Card>
                </Grid.Col>
              ) : (
             sessions.slice(0, 7).map((session) => (
               <Grid.Col key={session.session_id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                 <Card
                   shadow="sm"
                   p="md"
                   radius="md"
                   withBorder
                   h="100%"
                   component={Link}
                   to={`/notebook/${session.session_id}`}
                   style={{
                     cursor: "pointer",
                     backgroundColor: "var(--mantine-color-dark-6)",
                     transition: "all 0.2s ease"
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = "translateY(-2px)";
                     e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = "translateY(0)";
                     e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                   }}
                 >
                   <Stack gap="md" h="100%">
                     {/* Header */}
                     <Group justify="space-between" align="start">
                       <Text size="sm" c="dimmed" fw={500}>
                         {session.notebook_name || 'New notebook'}
                       </Text>
                       <ActionIcon 
                         variant="subtle" 
                         color="red" 
                         size="sm"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           handleDeleteSession(session.session_id);
                         }}
                       >
                         <IconTrash size={14} />
                       </ActionIcon>
                     </Group>

                     {/* Title */}
                     <Text fw={500} size="md" lineClamp={2} c="var(--mantine-color-text)">
                       {session.material_title}
                     </Text>

                     {/* Footer */}
                     <Group justify="space-between" align="center" mt="auto">
                       <Text size="xs" c="dimmed">
                         {new Date().toLocaleDateString('en-US', {
                           day: 'numeric',
                           month: 'short',
                           year: 'numeric'
                         })} • {session.questions.length} sources
                       </Text>
                     </Group>
                   </Stack>
                 </Card>
               </Grid.Col>
             ))
              )
            ) : (
              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card shadow="sm" p="xl" radius="md" withBorder h="100%">
                  <Center h="100%">
                    <Stack align="center" gap="md">
                      <ThemeIcon size="xl" variant="light" color="gray">
                        <IconBook size={32} />
                      </ThemeIcon>
                      <Text ta="center" c="dimmed">
                        ログインしてNotebookを表示
                      </Text>
                      <Button 
                        variant="gradient" 
                        gradient={{ from: 'blue', to: 'cyan' }}
                        leftSection={<IconLogin size={16} />}
                        onClick={() => loginWithRedirect()}
                      >
                        ログイン
                      </Button>
                    </Stack>
                  </Center>
                </Card>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      </Container>
    </Guard>
  );
}
