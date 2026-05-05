import express from "express";
import { asyncHandler, verifyToken, checkRole, can } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { userSchema } from "../schemas/index.js";
import { UserService, CustomerService } from "../services/UserService.js";
import { AuditService } from "../services/AuditService.js";

const router = express.Router();

// Customers
router.get("/customers", verifyToken, asyncHandler(async (req, res) => {
  res.json(CustomerService.getAll());
}));

router.post("/customers", verifyToken, asyncHandler(async (req, res) => {
  res.json(CustomerService.create(req.body));
}));

// Users (Admin only)
router.get("/users", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), can('manage_users'), asyncHandler(async (req, res) => {
  res.json(UserService.getAllUsers());
}));

router.post("/users", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_users'), validate(userSchema), asyncHandler(async (req: any, res) => {
  const { email, password, name, role } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, message: "La contraseña es obligatoria" });
  }

  // Prevent typical admins from creating developers
  if (role === 'DESARROLLADOR' && req.user.role !== 'DESARROLLADOR') {
    return res.status(403).json({ success: false, message: "No tienes permiso para crear usuarios desarrolladores" });
  }

  const existing = UserService.findByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: "El correo ya está registrado" });
  }

  const result = UserService.createUser(req.body);
  
  AuditService.log({
    userId: req.user.id,
    action: 'CREATE_USER',
    module: 'USERS',
    entityId: result.id,
    details: { email, name, role }
  });

  res.json(result);
}));

router.put("/users/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_users'), validate(userSchema), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { email, name, role } = req.body;

  const user = UserService.findById(id) as any;
  if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

  // Prevent modifying the main developer account unless you are the developer
  if (user.email === 'admin@psg.la' && req.user.role !== 'DESARROLLADOR') {
    return res.status(403).json({ success: false, message: "No puedes modificar la cuenta maestra" });
  }

  // Prevent typical admins from promoting users to developers
  if (role === 'DESARROLLADOR' && user.role !== 'DESARROLLADOR' && req.user.role !== 'DESARROLLADOR') {
    return res.status(403).json({ success: false, message: "No tienes permiso para asignar el rol de desarrollador" });
  }

  const result = UserService.updateUser(id, req.body);

  AuditService.log({
    userId: req.user.id,
    action: 'UPDATE_USER',
    module: 'USERS',
    entityId: id,
    details: { email, name, role }
  });

  res.json(result);
}));

router.delete("/users/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_users'), asyncHandler(async (req: any, res) => {
  const { id } = req.params;

  const user = UserService.findById(id) as any;
  if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

  if (user.email === 'admin@psg.la') {
    return res.status(403).json({ success: false, message: "No se puede eliminar la cuenta maestra" });
  }

  if (user.id === req.user.id) {
    return res.status(400).json({ success: false, message: "No puedes eliminar tu propia cuenta" });
  }

  const result = UserService.deleteUser(id);

  AuditService.log({
    userId: req.user.id,
    action: 'DELETE_USER',
    module: 'USERS',
    entityId: id,
    details: { email: user.email, name: user.name }
  });

  res.json(result);
}));

export default router;
