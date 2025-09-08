import { useEffect, useState } from "react";
import { Button, Card, Group, Stack, Text, Title, Badge } from "@mantine/core";
import Guard from "../components/Guard";
import { useApi } from "../lib/api";
import { Link } from "react-router-dom";

export default function History() {
  const api = useApi();
  const [sessions, setSessions] = useState<
    { session_id: string; material_id: string; level: string; questions: { id: string; question: string }[] }[]
  >([]);

  useEffect(() => {
    api.history().then((d) => setSessions(d.sessions)).catch(() => setSessions([]));
  }, []);

  return (
    <Guard>
      <Stack gap="md">
        <Title order={2}>履歴</Title>
        {sessions.length === 0 && <Text c="dimmed">履歴がありません。</Text>}
        {sessions.map((s) => (
          <Card key={s.session_id} withBorder>
            <Group justify="space-between">
              <Group>
                <Badge>{s.level}</Badge>
                <Text>Material: {s.material_id}</Text>
              </Group>
              <Button component={Link} to={`/teach/${s.session_id}`} variant="light">再開</Button>
            </Group>
            <ul style={{ marginTop: 8 }}>
              {s.questions.slice(0, 3).map((q) => <li key={q.id}><Text size="sm">{q.question}</Text></li>)}
            </ul>
          </Card>
        ))}
      </Stack>
    </Guard>
  );
}
