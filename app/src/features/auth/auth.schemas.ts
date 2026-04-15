import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['comercial', 'regional', 'nacional', 'diretor', 'logistica', 'admin']).default('comercial'),
  // Add other user fields as needed based on API response
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.preprocess(
  (data: any) => {
    if (data && typeof data === 'object') {
      return {
        ...data,
        accessToken: data.accessToken || data.access_token || data.token,
        refreshToken: data.refreshToken || data.refresh_token,
      };
    }
    return data;
  },
  z.object({
    user: UserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  })
);

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshResponseSchema = z.preprocess(
  (data: any) => {
    if (data && typeof data === 'object') {
      return {
        ...data,
        accessToken: data.accessToken || data.access_token || data.token,
        refreshToken: data.refreshToken || data.refresh_token,
      };
    }
    return data;
  },
  z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(), // Server might rotate refresh token
  })
);

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
