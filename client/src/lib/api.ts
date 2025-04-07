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
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `${response.status}: ${response.statusText}`;
    } catch (e) {
      // Если ответ не является JSON, пытаемся получить текст
      errorMessage = await response.text() || `${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
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
