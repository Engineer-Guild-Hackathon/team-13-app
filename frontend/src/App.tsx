import { Image, AppShell, Burger, Button, Group, NavLink, Stack, ThemeIcon, Badge, Divider, ActionIcon } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Teach from "./pages/Teach";
import History from "./pages/History";
import Login from "./pages/Login";
import { Text, Title } from "@mantine/core";
import { IconDashboard, IconUpload, IconSchool, IconHistory, IconHome, IconSettings, IconHelp, IconBookmark, IconStar, IconSun, IconMoon, IconLogout } from "@tabler/icons-react";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";


export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, isAuthenticated, user } = useAuth0();

  // 認証状態の変化を監視してlocalStorageをクリア
  useEffect(() => {
    if (!isAuthenticated) {
      // 未認証時はlocalStorageから学習データをクリア
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('questions:') || key.startsWith('persona:'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }, [isAuthenticated]);

  const links = [
    { 
      to: "/dashboard", 
      label: "ダッシュボード", 
      icon: IconDashboard, 
      color: "blue",
      description: "学習の概要"
    },
    { 
      to: "/upload", 
      label: "教材アップロード", 
      icon: IconUpload, 
      color: "green",
      description: "PDF・URLから教材を追加"
    },
    { 
      to: "/teach", 
      label: "学習セッション", 
      icon: IconSchool, 
      color: "orange",
      description: "AI生徒と学習"
    },
    { 
      to: "/history", 
      label: "学習履歴", 
      icon: IconHistory, 
      color: "violet",
      description: "過去の学習記録"
    }
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened }
      }}
      padding="md"
      styles={{
        navbar: {
          borderRight: '1px solid var(--mantine-color-gray-2)'
        },
        header: {
          borderBottom: '1px solid var(--mantine-color-gray-2)'
        }
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
          
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" align="center">
            <Image src="logo.png" w={32} h={32} radius="sm" />
            <Text
            size="5xl"
            fw={1600}
            variant="gradient"
            gradient={{ from: "blue", to: "red", deg: 90 }}
            style={{
            textShadow: "1px 1px 2px rgba(0,0,0,0.25)",
            fontSize: 30 
  }}
>
  UTeach
</Text>
            </Group>
          </Group>
          <Group gap="sm">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={toggleTheme}
              size="md"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
            </ActionIcon>
            {isAuthenticated && (
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                size="md"
                aria-label="Logout"
              >
                <IconLogout size={16} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack gap="xs">
        
          
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.to;
            
            return (
              <NavLink
                key={link.to}
                component={Link}
                to={link.to}
                onClick={close}
                active={isActive}
                data-nav-color={link.color}
                label={
                  <Group gap="sm" align="center">
                    <ThemeIcon 
                      size="md" 
                      radius="xl" 
                      variant={isActive ? "gradient" : "light"}
                      gradient={isActive ? { from: link.color, to: `${link.color}.4` } : undefined}
                      color={isActive ? undefined : link.color}
                      data-icon-color={link.color}
                    >
                      <Icon size={18} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Text fw={isActive ? 600 : 500} size="sm">
                        {link.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {link.description}
                      </Text>
                    </Stack>
                  </Group>
                }
                style={{
                  borderRadius: "8px",
                  padding: "8px 12px",
                  backgroundColor: isActive ? `var(--mantine-color-${link.color}-0)` : 'transparent',
                  border: isActive ? `1px solid var(--mantine-color-${link.color}-3)` : '1px solid var(--mantine-color-gray-2)',
                  transition: "all 0.2s"
                }}
              />
            );
          })}
          
          <Divider my="md" />
          
          <Stack gap="xs">
            
            <NavLink
              component={Link}
              to="/dashboard"
              onClick={close}
              label={
                <Group gap="sm" align="center">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="blue">
                    <IconBookmark size={14} />
                  </ThemeIcon>
                  <Text size="xs" fw={500} c="blue.7">
                    お気に入り教材
                  </Text>
                </Group>
              }
              style={{
                borderRadius: "6px",
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "1px solid transparent"
              }}
            />
            
            <NavLink
              component={Link}
              to="/dashboard"
              onClick={close}
              label={
                <Group gap="sm" align="center">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="orange">
                    <IconStar size={14} />
                  </ThemeIcon>
                  <Text size="xs" fw={500}>
                    学習のコツ
                  </Text>
                </Group>
              }
              style={{
                borderRadius: "6px",
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "1px solid transparent"
              }}
            />
            
            <NavLink
              component={Link}
              to="/dashboard"
              onClick={close}
              label={
                <Group gap="sm" align="center">
                  <ThemeIcon size="sm" radius="xl" variant="light" color="violet">
                    <IconHelp size={14} />
                  </ThemeIcon>
                  <Text size="xs" fw={500}>
                    ヘルプ・FAQ
                  </Text>
                </Group>
              }
              style={{
                borderRadius: "6px",
                padding: "6px 10px",
                backgroundColor: "transparent",
                border: "1px solid transparent"
              }}
            />
          </Stack>
          
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/teach" element={<Teach />} />
          <Route path="/teach/:sessionId" element={<Teach />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
