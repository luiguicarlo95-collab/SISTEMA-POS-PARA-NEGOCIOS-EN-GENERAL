import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Formato de email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  }),
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    code: z.string().optional(),
    description: z.string().optional().nullable(),
    category_id: z.number().int().optional().nullable(),
    purchase_price: z.preprocess((val) => val === null ? undefined : val, z.number().min(0).optional().default(0)),
    sale_price: z.preprocess((val) => val === null ? undefined : val, z.number().min(0).optional().default(0)),
    stock: z.preprocess((val) => val === null ? undefined : val, z.number().int().optional().default(0)),
    min_stock: z.preprocess((val) => val === null ? undefined : val, z.number().int().optional().default(5)),
    unit: z.string().optional().default('unidad'),
    brand: z.string().optional().nullable(),
    supplier_id: z.number().int().optional().nullable(),
    image: z.string().optional().nullable(),
    has_serials: z.union([z.boolean(), z.number()]).optional().transform(v => v === true || v === 1),
    serial_numbers: z.array(z.string()).optional(),
    parent_id: z.number().int().optional().nullable(),
    units_per_package: z.preprocess((val) => val === null ? undefined : val, z.number().int().optional().default(1)),
  }),
});

export const cashSessionSchema = z.object({
  body: z.object({
    opening_balance: z.number().min(0, "El saldo inicial no puede ser negativo").optional(),
    closing_balance: z.number().min(0, "El saldo final no puede ser negativo").optional(),
    description: z.string().optional(),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    prefix: z.string().min(1, "El prefijo es requerido"),
    description: z.string().optional(),
  }),
});

export const supplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    tax_id: z.string().optional(),
  }),
});

export const userSchema = z.object({
  body: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
    role: z.enum(['ADMINISTRADOR', 'ESTANDARD', 'DESARROLLADOR']),
  }),
});

export const saleSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: z.number().int(),
      quantity: z.number().int().min(1),
      price: z.number().min(0),
      subtotal: z.number().min(0),
    })).min(1, "Debe haber al menos un producto en la venta"),
    payment_method: z.string(),
    type: z.enum(['boleta', 'factura', 'proforma', 'nota']).optional(),
    customer_id: z.number().int().nullable().optional(),
    total: z.number().min(0),
    subtotal: z.number().min(0),
    tax: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    cash_received: z.number().min(0).optional(),
    change_amount: z.number().min(0).optional(),
  }),
});
