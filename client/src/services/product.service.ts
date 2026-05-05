import { BaseService } from './api.service';
import { Product, Category, Supplier } from '../types';

export class ProductService extends BaseService {
  private static instance: ProductService;

  private constructor() {
    super();
  }

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getAll(branchId?: number | string): Promise<Product[]> {
    const url = branchId ? `/api/products?sucursal_id=${branchId}` : '/api/products';
    return this.get<Product[]>(url);
  }

  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/api/categories');
  }

  async getSuppliers(): Promise<Supplier[]> {
    return this.get<Supplier[]>('/api/suppliers');
  }

  async create(product: Partial<Product>): Promise<Product> {
    return this.post<Product>('/api/products', product);
  }

  async update(id: number, product: Partial<Product>): Promise<Product> {
    return this.put<Product>(`/api/products/${id}`, product);
  }

  async deleteProduct(id: number): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/api/products/${id}`);
  }

  async deleteMany(ids: number[]): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/products/bulk-delete', { ids });
  }

  async getSerialNumbers(productId: number, branchId?: number | string): Promise<any[]> {
    const url = branchId ? `/api/products/${productId}/serials?sucursal_id=${branchId}` : `/api/products/${productId}/serials`;
    return this.get<any[]>(url);
  }
}

export const productService = ProductService.getInstance();
