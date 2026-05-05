import { apiFetch } from '../lib/api';

/**
 * Base Service class for common API operations
 * Implements standard error handling and response parsing
 */
export class BaseService {
  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'Error en la operación del servidor';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Error del servidor (${response.status})`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  protected async get<T>(url: string): Promise<T> {
    const response = await apiFetch(url);
    return this.handleResponse<T>(response);
  }

  protected async post<T>(url: string, data?: any): Promise<T> {
    const response = await apiFetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async put<T>(url: string, data?: any): Promise<T> {
    const response = await apiFetch(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async delete<T>(url: string): Promise<T> {
    const response = await apiFetch(url, {
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }
}
