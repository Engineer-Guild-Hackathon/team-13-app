import { Button, Center, Stack, Text, Alert, ThemeIcon, Group } from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";
import { ReactNode } from "react";
import { IconLock } from "@tabler/icons-react";

interface GuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  showPreview?: boolean;
}

export default function Guard({ children, requireAuth = true, showPreview = false }: GuardProps) {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0();

  if (isLoading) return <Center><Text>Loading...</Text></Center>;
  
  if (!isAuthenticated && requireAuth) {
    if (showPreview) {
      return (
        <>
          <Alert 
            color="blue" 
            title="ログインが必要です" 
            icon={<IconLock size={16} />}
            mb="md"
          >
            <Stack gap="sm">
              <Text size="sm">
                この機能を使用するにはログインが必要です。ログインすると、教材のアップロードや質問生成ができるようになります。
              </Text>
              <Button onClick={() => loginWithRedirect()} size="sm">
                Auth0 でログイン
              </Button>
            </Stack>
          </Alert>
          {children}
        </>
      );
    }
    
    return (
      <Center>
        <Stack align="center" gap="sm">
          <Text>ログインが必要です。</Text>
          <Button onClick={() => loginWithRedirect()}>Auth0 でログイン</Button>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}
