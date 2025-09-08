import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import Guard from "../components/Guard";
import { useAuth0 } from "@auth0/auth0-react";

export default function Dashboard() {
  const { user, logout } = useAuth0();

  return (
    <Guard>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Dashboard</Title>
          <Button variant="light" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Logout
          </Button>
        </Group>
        <Text>ようこそ、{user?.name ?? "先生"}！UTeach で AI 生徒に教えていきましょう。</Text>
        <Group>
          <Button component={Link} to="/upload">教材をアップロード</Button>
          <Button component={Link} to="/history" variant="light">履歴を見る</Button>
        </Group>
      </Stack>
    </Guard>
  );
}
