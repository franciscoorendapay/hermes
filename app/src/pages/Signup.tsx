import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate inputs
    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((error) => {
        if (error.path[0] === "email") fieldErrors.email = error.message;
        if (error.path[0] === "password") fieldErrors.password = error.message;
        if (error.path[0] === "confirmPassword") fieldErrors.confirmPassword = error.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signup(email, password);
    
    if (error) {
      setIsLoading(false);
      
      // Handle specific error messages
      if (error.message.includes("User already registered")) {
        toast.error("Este e-mail já está cadastrado", {
          description: "Tente fazer login ou use outro e-mail"
        });
      } else if (error.message.includes("Password should be at least")) {
        toast.error("Senha muito fraca", {
          description: "Use uma senha com pelo menos 6 caracteres"
        });
      } else {
        toast.error("Erro ao criar conta", { description: error.message });
      }
      return;
    }
    
    toast.success("Conta criada com sucesso!", {
      description: "Você já pode começar a usar o sistema"
    });
    navigate("/dashboard");
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-5">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <h1 className="text-4xl font-bold text-primary tracking-tight">HERMES</h1>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Criar conta
          </h2>
          <p className="text-base text-muted-foreground">
            Crie sua conta para começar a gerenciar seus leads.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold text-secondary-foreground">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`p-4 h-14 text-base font-semibold text-secondary-foreground bg-transparent border-border rounded-lg placeholder:text-secondary-foreground/60 ${errors.email ? "border-destructive" : ""}`}
              autoCapitalize="none"
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-semibold text-secondary-foreground">
              Senha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`p-4 h-14 text-base font-semibold text-secondary-foreground bg-transparent border-border rounded-lg placeholder:text-secondary-foreground/60 ${errors.password ? "border-destructive" : ""}`}
              required
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base font-semibold text-secondary-foreground">
              Confirmar Senha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`p-4 h-14 text-base font-semibold text-secondary-foreground bg-transparent border-border rounded-lg placeholder:text-secondary-foreground/60 ${errors.confirmPassword ? "border-destructive" : ""}`}
              required
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/" className="text-primary font-semibold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
