import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileMenu } from '../mobile-menu';
import { AuthContext } from '@/hooks/use-auth';
import * as wouter from 'wouter';

// Мок для wouter
jest.mock('wouter', () => ({
  ...jest.requireActual('wouter'),
  useLocation: jest.fn(),
  Link: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <div onClick={onClick}>{children}</div>
  ),
}));

// Мок для i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Просто возвращаем ключ как текст
  }),
}));

describe('MobileMenu Component', () => {
  // Настройка моков перед каждым тестом
  beforeEach(() => {
    jest.clearAllMocks();
    (wouter.useLocation as jest.Mock).mockReturnValue(['/']);
  });

  // Тест: Меню должно отображаться с иконкой бургера
  test('renders menu button with burger icon', () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: {} as any,
          registerMutation: {} as any,
        }}
      >
        <MobileMenu />
      </AuthContext.Provider>
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  // Тест: Меню должно открываться при клике на кнопку
  test('opens menu when button is clicked', async () => {
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: {} as any,
          registerMutation: {} as any,
        }}
      >
        <MobileMenu />
      </AuthContext.Provider>
    );

    // Нажимаем на кнопку меню
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);

    // Проверяем, что содержимое меню отображается
    await waitFor(() => {
      expect(screen.getByText('Sports School CRM')).toBeInTheDocument();
    });
  });

  // Тест: Отображает навигационные элементы в зависимости от состояния аутентификации
  test('renders navigation items based on authentication state', async () => {
    // Рендерим с пользователем
    const { unmount } = render(
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
        <MobileMenu />
      </AuthContext.Provider>
    );

    // Открываем меню
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);

    // Проверяем наличие защищенных элементов
    await waitFor(() => {
      expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
      expect(screen.getByText('navigation.students')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Размонтируем и рендерим без пользователя
    unmount();
    render(
      <AuthContext.Provider
        value={{
          user: null,
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: {} as any,
          registerMutation: {} as any,
        }}
      >
        <MobileMenu />
      </AuthContext.Provider>
    );

    // Открываем меню
    const menuButtonNew = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButtonNew);

    // Проверяем наличие только общедоступных элементов
    await waitFor(() => {
      expect(screen.queryByText('navigation.dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('navigation.trialRequest')).toBeInTheDocument();
    });
  });

  // Тест: Кнопка выхода должна вызывать метод logoutMutation.mutate
  test('logout button calls logoutMutation.mutate', async () => {
    const mockLogout = jest.fn();
    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'admin' },
          isLoading: false,
          error: null,
          loginMutation: {} as any,
          logoutMutation: { mutate: mockLogout } as any,
          registerMutation: {} as any,
        }}
      >
        <MobileMenu />
      </AuthContext.Provider>
    );

    // Открываем меню
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);

    // Нажимаем на кнопку выхода
    await waitFor(() => {
      const logoutButton = screen.getByText('navigation.signOut');
      fireEvent.click(logoutButton);
    });

    // Проверяем, что функция выхода была вызвана
    expect(mockLogout).toHaveBeenCalled();
  });
});