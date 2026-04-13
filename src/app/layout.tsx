import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'TaskFlow — Task Management',
  description: 'Collaborative Trello-like task management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-base-100 text-base-content font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
