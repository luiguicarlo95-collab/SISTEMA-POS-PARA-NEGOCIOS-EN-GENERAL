import { query } from "../db/database.js";
import { ProductRepository } from "../repositories/ProductRepository.js";

export class ProductService {
  static getCategories() {
    return ProductRepository.findAllCategories();
  }

  static createCategory(data: { name: string; prefix?: string; description?: string }) {
    const id = ProductRepository.createCategory(data);
    return { id };
  }

  static getAllProducts() {
    const products = ProductRepository.findAll() as any[];
    
    return products.map(p => ({
      ...p,
      stock: p.tipo_stock === 'serie' || p.has_serials ? p.dynamic_stock : p.stock
    }));
  }

  static createProduct(data: any) {
    const { 
      code, has_serials, serial_numbers
    } = data;

    let productCode = code;
    if (!productCode) {
      productCode = 'P' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }

    const transaction = query.transaction(() => {
      const productId = ProductRepository.create({ ...data, code: productCode });

      if ((has_serials || data.tipo_stock === 'serie') && serial_numbers && Array.isArray(serial_numbers)) {
        for (const sn of serial_numbers) {
          ProductRepository.createItem(productId as number, sn);
        }
      }

      return { id: productId, code: productCode };
    });

    return transaction();
  }

  static updateProduct(id: string | number, data: any) {
    const { 
      has_serials, serial_numbers
    } = data;

    const transaction = query.transaction(() => {
      ProductRepository.update(id, data);

      if ((has_serials || data.tipo_stock === 'serie') && serial_numbers && Array.isArray(serial_numbers)) {
        const existingSerials = ProductRepository.findItemsByProductId(id).map((s: any) => s.serial_number);
        const newSerials = serial_numbers.filter(sn => !existingSerials.includes(sn));
        
        for (const sn of newSerials) {
          ProductRepository.createItem(id, sn);
        }
      }
      return { success: true };
    });

    return transaction();
  }

  static deleteProduct(id: string | number) {
    return ProductRepository.delete(id);
  }

  static bulkDeleteProducts(ids: number[]) {
    return ProductRepository.bulkDelete(ids);
  }

  static getProductItems(productId: string | number) {
    return ProductRepository.findItemsByProductId(productId);
  }

  static getProductBySerial(serial: string) {
    return ProductRepository.findItemBySerialNumber(serial);
  }

  static getProductByCode(code: string) {
    return ProductRepository.findByCode(code);
  }

  static searchInventory(q: string) {
    // Search by product name or code
    const products = query.all(`
      SELECT p.*, 'product' as type
      FROM products p
      WHERE name LIKE ? OR code LIKE ?
      LIMIT 10
    `, `%${q}%`, `%${q}%`);

    // Search by serial number
    const serials = query.all(`
      SELECT p.id, p.name, p.code, pi.serial_number, 'serial' as type
      FROM product_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.serial_number LIKE ? AND pi.status = 'available'
      LIMIT 10
    `, `%${q}%`);

    // Merge results
    return [...products, ...serials];
  }
}
