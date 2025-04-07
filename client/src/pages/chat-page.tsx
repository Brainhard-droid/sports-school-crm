import React from 'react';
import { Layout } from '@/components/layout/navbar';
import Chat from '@/components/chat';
import { useTranslation } from 'react-i18next';

export default function ChatPage() {
  const { t } = useTranslation();

  return (
    <div className="container py-6">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6">{t('chat.title')}</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-2xl">
          {t('chat.description')}
        </p>
        <Chat />
      </div>
    </div>
  );
}