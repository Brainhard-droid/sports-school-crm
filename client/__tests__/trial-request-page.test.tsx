import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrialRequestPage from '@/pages/trial-request';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Мок хука useTrialRequest
jest.mock('@/hooks/use-trial-request', () => {
  const originalModule = jest.requireActual('@/hooks/use-trial-request');
  
  return {
    ...originalModule,
    useTrialRequest: () => ({
      form: {
        control: {},
        handleSubmit: jest.fn(),
        watch: jest.fn().mockImplementation((field) => {
          if (field === 'sectionId') return 1;
          if (field === 'branchId') return 1;
          return null;
        }),
        setValue: jest.fn(),
        trigger: jest.fn().mockReturnValue(true),
        formState: { errors: {} },
      },
      sections: [
        { id: 1, name: 'Художественная гимнастика', description: 'Описание' },
        { id: 2, name: 'Спортивные бальные танцы', description: 'Описание' },
      ],
      sectionsLoading: false,
      branchesForSection: [
        { id: 1, name: 'Филиал 1', address: 'Адрес 1', schedule: '{"monday": [{"start": "09:00", "end": "10:00"}], "wednesday": [{"start": "09:00", "end": "10:00"}]}' },
      ],
      branchesLoading: false,
      createTrialRequestMutation: {
        mutateAsync: jest.fn().mockResolvedValue({ id: 1 }),
        isPending: false,
      },
      showSuccessModal: false,
      setShowSuccessModal: jest.fn(),
      useCustomDate: false,
      setUseCustomDate: jest.fn(),
      selectedDateValue: null,
      setSelectedDateValue: jest.fn(),
      privacyAccepted: true,
      setPrivacyAccepted: jest.fn(),
      handleSubmit: jest.fn(),
      handleDateSelection: jest.fn(),
      handleCustomDateChange: jest.fn(),
      isSubmitting: false,
    }),
  };
});

// Мок сервиса расписания
jest.mock('@/services/ScheduleService', () => ({
  scheduleService: {
    parseSchedule: jest.fn().mockReturnValue({
      monday: [{ start: '09:00', end: '10:00' }],
      wednesday: [{ start: '09:00', end: '10:00' }],
    }),
    getNextSessions: jest.fn().mockReturnValue([
      { date: new Date(), timeLabel: '09:00 - 10:00', day: 'Понедельник' },
    ]),
  },
  SessionInfo: jest.fn(),
}));

describe('TrialRequestPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders without crashing', () => {
    render(<TrialRequestPage />, { wrapper });
    
    expect(screen.getByText('Запись на пробное занятие')).toBeInTheDocument();
  });

  it('displays section and branch selectors', () => {
    render(<TrialRequestPage />, { wrapper });
    
    expect(screen.getByText('Выберите секцию')).toBeInTheDocument();
    expect(screen.getByText('Отправить заявку')).toBeInTheDocument();
  });

  it('displays schedule info when branch is selected', () => {
    render(<TrialRequestPage />, { wrapper });
    
    expect(screen.getByText('Расписание занятий:')).toBeInTheDocument();
    expect(screen.getByText('Понедельник:')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const { getByText } = render(<TrialRequestPage />, { wrapper });
    
    // Click submit button
    const submitButton = getByText('Отправить заявку');
    fireEvent.click(submitButton);
    
    // Verify handleSubmit was called
    await waitFor(() => {
      const mockUseTrialRequest = require('@/hooks/use-trial-request').useTrialRequest;
      expect(mockUseTrialRequest().handleSubmit).toHaveBeenCalled();
    });
  });
});