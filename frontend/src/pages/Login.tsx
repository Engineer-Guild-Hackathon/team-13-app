import { Button, Center, Stack, Text } from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
  const { loginWithRedirect } = useAuth0();
  return (
    <Center>
      <Stack align="center" gap="sm">
        <Text size="lg">UTeach へようこそ</Text>
        <Button onClick={() => loginWithRedirect()}>Auth0 でログイン</Button>
      </Stack>
    </Center>
  );
}
