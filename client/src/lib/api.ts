import { z } from "zod";

/**
 * Универсальная функция для выполнения API-запросов
 * 
 * @param method HTTP метод запроса
 * @param endpoint URL или путь эндпоинта
 * @param data Данные для отправки в теле запроса (для POST, PUT, PATCH)
 * @param options Дополнительные опции fetch API
 * @returns Promise с ответом
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<Response> {
  console.log(`Making ${method} request to ${endpoint}`);
  if (data) console.log('Request data:', data);

  const response = await fetch(endpoint, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...options
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    let errorMessage: string;
    let errorDetails: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        errorMessage = errorData.message || `${response.status}: ${response.statusText}`;
        errorDetails = errorData;
      } else {
        // Если ответ не является JSON, пытаемся получить текст
        errorMessage = await response.text() || `${response.status}: ${response.statusText}`;
        console.log('Error response text:', errorMessage);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      errorMessage = `${response.status}: ${response.statusText}`;
    }
    
    const error = new Error(errorMessage);
    (error as any).details = errorDetails;
    (error as any).status = response.status;
    throw error;
  }

  return response;
}

/**
 * Получить JSON-данные из ответа с автоматической типизацией
 * 
 * @param response Ответ от apiRequest
 * @returns Promise с типизированными данными
 */
export async function getResponseData<T>(response: Response): Promise<T> {
  return await response.json() as T;
}
