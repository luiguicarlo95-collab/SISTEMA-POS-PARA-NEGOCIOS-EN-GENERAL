import { Response, NextFunction, Request } from "express";
import { z, ZodError } from "zod";

export const validate = (schema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Error de validación",
          details: error.issues.map(err => ({
            path: err.path,
            message: err.message
          }))
        });
      }
      return res.status(500).json({ error: "Error interno durante la validación" });
    }
  };
};
