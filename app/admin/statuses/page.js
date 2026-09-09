'use client';
import AppShell from '@/components/AppShell';
import StatusesScreen from '@/components/screens/Statuses';

export default function Page() {
  return <AppShell title="Task Statuses"><StatusesScreen /></AppShell>;
}
