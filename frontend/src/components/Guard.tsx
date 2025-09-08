import { Button, Center, Stack, Text } from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";
import { ReactNode } from "react";

export default function Guard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();

  if (isLoading) return <Center><Text>Loading...</Text></Center>;
  if (!isAuthenticated)
    return (
      <Center>
        <Stack align="center" gap="sm">
          <Text>ログインが必要です。</Text>
          <Button onClick={() => loginWithRedirect()}>Auth0 でログイン</Button>
        </Stack>
      </Center>
    );

  return <>{children}</>;
}
