import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT } from "./config.js";
import { initDb } from "./db/database.js";
import { seedData } from "./db/seed.js";


// Routes
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import salesRoutes from "./routes/sales.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";

import reportsRoutes from "./routes/reports.js";
import suppliersRoutes from "./routes/suppliers.js";
import customersRoutes from "./routes/customers.js";
import cashSessionsRoutes from "./routes/cash-sessions.js";
import cashFlowRoutes from "./routes/cash-flow.js";
import branchesRoutes from "./routes/branches.js";
import { errorHandler } from "./middleware/errorHandler.js";

async function startServer() {
  // Initialize Database
  initDb();
  seedData();

  const app = express();
  app.set('trust proxy', 1);
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global socket.io instance for routes if needed (e.g. through req.io)
  app.use((req: any, res, next) => {
    req.io = io;
    next();
  });

  // Global mutation emitter
  app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
        io.emit('data_changed');
      }
      return originalJson.call(this, body);
    };
    next();
  });



  // API Routes registration
  app.use("/api/auth", authRoutes);
  app.use("/api", inventoryRoutes); 
  app.use("/api", salesRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", userRoutes);
  app.use("/api", suppliersRoutes);
  app.use("/api", customersRoutes);
  app.use("/api/cash-sessions", cashSessionsRoutes);
  app.use("/api/cash-flow", cashFlowRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/branches", branchesRoutes);
  
  // 404 Handler for API
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Ruta de API no encontrada" });
  });

  // ERROR HANDLER MUST BE LAST
  app.use(errorHandler);


  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.join(process.cwd(), 'vite.config.ts'),
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: "spa",
      root: path.join(process.cwd(), 'client'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please wait for the previous process to release it or restart the dev server.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
