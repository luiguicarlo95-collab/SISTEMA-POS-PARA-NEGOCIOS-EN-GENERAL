import { BaseService } from './api.service';

export class SaleService extends BaseService {
  private static instance: SaleService;

  private constructor() {
    super();
  }

  public static getInstance(): SaleService {
    if (!SaleService.instance) {
      SaleService.instance = new SaleService();
    }
    return SaleService.instance;
  }

  async getActiveSession(): Promise<any> {
    return this.get<any>('/api/cash-sessions/active');
  }

  async getLastClosedSession(): Promise<any> {
    return this.get<any>('/api/cash-sessions/last-closed');
  }

  async openSession(data: { opening_balance: number; description: string; branch_id: number }): Promise<any> {
    return this.post<any>('/api/cash-sessions/open', data);
  }

  async closeSession(data: { closing_balance: number; description: string }): Promise<any> {
    return this.post<any>('/api/cash-sessions/close', data);
  }

  async registerManualMovement(data: { type: 'income' | 'expense'; amount: number; description: string }): Promise<any> {
    return this.post<any>('/api/cash-flow', data);
  }

  async getCustomers(): Promise<any[]> {
    return this.get<any[]>('/api/customers');
  }

  async createSale(saleData: any): Promise<any> {
    return this.post<any>('/api/sales', saleData);
  }
}

export const saleService = SaleService.getInstance();
