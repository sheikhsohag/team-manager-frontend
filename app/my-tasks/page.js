'use client';
import AppShell from '@/components/AppShell';
import MyTasksScreen from '@/components/screens/MyTasks';

export default function Page() {
  return <AppShell title="My Tasks"><MyTasksScreen /></AppShell>;
}
