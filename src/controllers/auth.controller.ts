import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const { email, password } = req.body;
      console.log(email)

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Informe o e-mail e a senha.",
        });
        return;
      }

      const result = await authService.login(email, password);
      console.log(result)

      res.json({
        success: true,
        message: "Login realizado com sucesso.",
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Erro ao realizar login.",
      });
    }
  }

  async me(req: any, res: Response): Promise<void> {
    res.json({
      success: true,
      data: req.user,
    });
  }
}

export const authController = new AuthController();