import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginRequestSchema, LoginRequest } from "@/features/auth/auth.schemas";
import { useAuthStore } from "@/features/auth/auth.store";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoggingIn } = useAuthStore();
  const [setupMode, setSetupMode] = useState(false);
  const { isInstalled, canInstall, installPwa } = usePwaInstall();

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema)
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && useAuthStore.getState().user) {
      const user = useAuthStore.getState().user;
      const role = user?.role || 'comercial';

      let target = "/dashboard"; // Default (Comercial)

      if (role === 'admin') {
        target = "/admin";
      } else if (role === 'regional' || role === 'nacional' || role === 'diretor') {
        target = "/gestao";
      } else if (role === 'logistica') {
        target = "/logistica";
      }

      // If there is a specific 'from' location, prioritize it, UNLESS it's just root/login
      const fromState = (location.state as any)?.from?.pathname;
      const finalTarget = fromState && fromState !== "/" && fromState !== "/login" ? fromState : target;

      navigate(finalTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data: LoginRequest) => {
    if (setupMode) {
      try {
        // Dynamically import to avoid circular dependency issues if any, or just import at top.
        // Importing at top is better, but I need to make sure I add the import line.
        const { authService } = await import("@/features/auth/auth.service");
        await authService.setupPassword(data.email, data.password);
        toast.success("Senha definida com sucesso! Entrando...");

        // Auto login
        const result = await login(data);
        if (!result.success) {
          toast.error("Erro ao fazer login automático. Tente entrar novamente.");
          setSetupMode(false);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Erro ao definir senha");
      }
      return;
    }

    const result = await login(data);

    if (result.success) {
      toast.success("Login realizado com sucesso!");
      // Navigation is handled by useEffect
    } else {
      if (result.type === 'PASSWORD_SETUP_REQUIRED') {
        setSetupMode(true);
        toast.info("Primeiro acesso: Por favor, crie sua senha.");
        setValue("email", data.email);
      } else {
        toast.error(result.error || "Erro ao fazer login");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-5">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src="/hermes-logo.png"
            alt="Hermes Opay"
            className="h-24 w-auto object-contain"
          />
        </div>

        {/* Welcome text */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {setupMode ? "Criar Senha" : "Bem-vindo de volta!"}
          </h2>
          <p className="text-base text-muted-foreground">
            {setupMode
              ? "Defina uma senha segura para acessar sua conta."
              : "Acompanhe seus leads, suas metas e progressões."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold text-secondary-foreground">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              className={`p-4 h-14 text-base font-semibold text-secondary-foreground bg-transparent border-border rounded-lg placeholder:text-secondary-foreground/60 ${errors.email ? "border-destructive" : ""}`}
              autoCapitalize="none"
              {...register("email")}
              readOnly={setupMode}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-semibold text-secondary-foreground">
              {setupMode ? "Nova Senha" : "Senha"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 caracteres"
              className={`p-4 h-14 text-base font-semibold text-secondary-foreground bg-transparent border-border rounded-lg placeholder:text-secondary-foreground/60 ${errors.password ? "border-destructive" : ""}`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              setupMode ? "Salvar e Entrar" : "Entrar"
            )}
          </Button>

          {setupMode && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setSetupMode(false)}
            >
              Cancelar
            </Button>
          )}
        </form>
      </div>

      {/* PWA Install Prompt */}
      <PwaInstallPrompt
        show={canInstall && !isInstalled}
        onInstall={installPwa}
        onDismiss={() => { }}
      />
    </div>
  );
}
