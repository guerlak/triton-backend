import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../config/database";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export class AuthService {
  async login(email: string, passwordPlain: string) {
    const res = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    
    if (res.rowCount === 0) {
      throw new Error("Invalid Credencials.");
    }

    const user = res.rows[0]; 

    const passwordMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    console.log(passwordMatch)

    if (!passwordMatch) {
      throw new Error("Invalid Credencials.");
    }

    // Gera o token JWT com validade de 7 dias
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();