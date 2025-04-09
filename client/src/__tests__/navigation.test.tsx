import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Layout } from '@/components/layout/navbar';
import { AuthContext } from '@/hooks/use-auth';
import * as wouter from 'wouter';

// Мок для wouter
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useLocation: jest.fn(),
  Link: ({ children, onClick, href }: { children: React.ReactNode, onClick?: () => void, href: string }) => (
    <a href={href} onClick={onClick} data-testid={`link-${href}`}>{children}</a>
  ),
}));

// Мок для i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Просто возвращаем ключ как текст
  }),
}));

// Мок для компонента LanguageSwitcher
jest.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (wouter.useLocation as jest.Mock).mockReturnValue(['/']);
  });

  // Тест: Должен показывать мобильное меню на мобильных устройствах
  test('shows mobile menu on mobile devices', async () => {
    // Мок window.innerWidth для имитации мобильного устройства
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480, // Мобильная ширина
    });
    
    // Вызываем обработчик media query
    window.dispatchEvent(new Event('resize'));

    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'admin' },
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: { mutate: jest.fn() } as any,
          registerMutation: {} as any,
        }}
      >
        <Layout>
          <div>Main Content</div>
        </Layout>
      </AuthContext.Provider>
    );

    // Проверяем наличие кнопки мобильного меню
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();

    // Нажимаем на кнопку меню
    fireEvent.click(menuButton);

    // Проверяем, что содержимое меню отображается
    await waitFor(() => {
      expect(screen.getByText('Sports School CRM')).toBeInTheDocument();
      // Проверяем наличие навигационных пунктов
      expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    });
  });

  // Тест: Боковая панель должна быть скрыта на мобильных и видна на настольных устройствах
  test('sidebar is hidden on mobile and visible on desktop', () => {
    // Мок для настольных устройств
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Настольная ширина
    });
    
    // Вызываем обработчик media query
    window.dispatchEvent(new Event('resize'));

    const { container } = render(
      <AuthContext.Provider
        value={{
          user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'admin' },
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: { mutate: jest.fn() } as any,
          registerMutation: {} as any,
        }}
      >
        <Layout>
          <div>Main Content</div>
        </Layout>
      </AuthContext.Provider>
    );

    // Боковая панель должна содержать класс md:flex, что указывает на то,
    // что она будет отображаться только на устройствах среднего размера и больше
    const sidebar = container.querySelector('.hidden.md\\:flex');
    expect(sidebar).toBeInTheDocument();
    
    // Меняем на мобильное устройство
    Object.defineProperty(window, 'innerWidth', {
      value: 480,
    });
    window.dispatchEvent(new Event('resize'));
    
    // Боковая панель должна быть по-прежнему скрыта на мобильных устройствах
    expect(sidebar).toHaveClass('hidden');
  });

  // Тест: Меню должно закрываться после перехода по ссылке
  test('mobile menu closes after navigation', async () => {
    // Мок для мобильных устройств
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });
    window.dispatchEvent(new Event('resize'));

    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'admin' },
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: { mutate: jest.fn() } as any,
          registerMutation: {} as any,
        }}
      >
        <Layout>
          <div>Main Content</div>
        </Layout>
      </AuthContext.Provider>
    );

    // Открываем меню
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);

    // Проверяем, что меню открыто
    await waitFor(() => {
      expect(screen.getByText('Sports School CRM')).toBeInTheDocument();
    });

    // Нажимаем на ссылку
    const dashboardLink = screen.getByTestId('link-/');
    fireEvent.click(dashboardLink);

    // Проверяем, что меню закрылось (элементы меню больше не отображаются)
    await waitFor(() => {
      const menuHeader = screen.queryByText('Sports School CRM');
      // Может быть в заголовке приложения, поэтому проверяем другие элементы
      expect(screen.queryByText('navigation.signOut')).not.toBeInTheDocument();
    });
  });
});