import { renderHook, act } from '@testing-library/react-hooks';
import { useTrialRequest } from '@/hooks/use-trial-request';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FC, ReactNode } from 'react';
import * as React from 'react';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn().mockImplementation(() => ({
    json: () => Promise.resolve({ id: 1, success: true }),
  })),
}));

// Wrapper for the test
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTrialRequest', () => {
  const wrapper = createWrapper();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.privacyAccepted).toBe(false);
    expect(result.current.showSuccessModal).toBe(false);
    expect(result.current.useCustomDate).toBe(false);
    expect(result.current.selectedDateValue).toBeNull();
    expect(result.current.form).toBeDefined();
  });

  it('should update privacyAccepted state when setPrivacyAccepted is called', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    
    act(() => {
      result.current.setPrivacyAccepted(true);
    });
    
    expect(result.current.privacyAccepted).toBe(true);
  });

  it('should update showSuccessModal state when setShowSuccessModal is called', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    
    act(() => {
      result.current.setShowSuccessModal(true);
    });
    
    expect(result.current.showSuccessModal).toBe(true);
  });

  it('should update useCustomDate state when setUseCustomDate is called', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    
    act(() => {
      result.current.setUseCustomDate(true);
    });
    
    expect(result.current.useCustomDate).toBe(true);
  });

  it('should update selectedDateValue when handleDateSelection is called', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    const dateStr = '2023-01-01';
    const timeStr = '10:00';
    
    act(() => {
      result.current.handleDateSelection(dateStr, timeStr);
    });
    
    expect(result.current.selectedDateValue).toBe(dateStr);
    expect(result.current.useCustomDate).toBe(false);
  });

  it('should update form value when handleCustomDateChange is called', () => {
    const { result } = renderHook(() => useTrialRequest(), { wrapper });
    const dateStr = '2023-01-01';
    
    act(() => {
      result.current.handleCustomDateChange(dateStr);
    });
    
    expect(result.current.selectedDateValue).toBeNull();
    expect(result.current.useCustomDate).toBe(true);
  });
});