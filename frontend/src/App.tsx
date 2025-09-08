import { AppShell, Burger, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Teach from "./pages/Teach";
import History from "./pages/History";
import Login from "./pages/Login";
import { Text, Title } from "@mantine/core";


export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload", label: "Upload" },
    { to: "/teach", label: "Teach" },
    { to: "/history", label: "History" }
  ];

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text size="xl" fw={900}>
            UTeach
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        {links.map((l) => (
          <NavLink
            key={l.to}
            component={Link}
            to={l.to}
            label={l.label}
            active={pathname === l.to}
            onClick={close}
          />
        ))}
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
