import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultLoginValues, loginFormSchema, LoginFormValues } from "@/schemas/loginSchema";
import { Eye, EyeOff, ShieldAlert, School } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

export default function LoginForm() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: defaultLoginValues,
  });

const onSubmit = async (data: LoginFormValues) => {
  setLoading(true);
  setGeneralError(null);
  clearErrors();

  try {
    //@ts-ignore
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, data);

    if (res.status >= 200 && res.status < 300) {
      const user = res.data.user;        

      localStorage.setItem("token", JSON.stringify(res.data.token));
      localStorage.setItem("role", user.role);
      setUser(user);

      if (user) {
        navigate("/dashboard", { replace: true });
      }
    }

  } catch (error: any) {
    const status = error.response?.status;

    if (status === 422 && error.response.data?.errors) {
      Object.keys(error.response.data.errors).forEach((field) => {
        setError(field as keyof LoginFormValues, {
          message: error.response.data.errors[field][0],
        });
      });
    } else if (status === 401) {
      setGeneralError("Invalid email or password. Please try again.");
    } else if (status === 403) {
      setGeneralError("Your account has been deactivated. Please contact support.");
    } else {
      setGeneralError("Network error. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <Card className="z-10 w-full max-w-md mx-4 rounded-[2rem] bg-[#0B1632]/90 backdrop-blur-xl border-white/5">
      <CardHeader className="text-center space-y-1 pt-8">
        <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
          <School className="text-[#6366F1]" size={24} />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight text-white">Welcome Back</CardTitle>
        <CardDescription className="text-[#9AA4C6]">Sign in to your school account</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pb-8">
        {generalError && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            <ShieldAlert size={16} className="shrink-0" /> {generalError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
            <Input
              type="email"
              placeholder="info@hillside.co.zw"
              className={cn("h-12 bg-[#0F1A37] border-white/5 text-white", errors.email && "border-rose-500/50")}
              {...register("email")}
            />
            {errors.email && <p className="text-rose-500 text-[10px] ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest">Password</Label>
              <Link to="/forgot-password" className="text-xs text-[#6366F1] hover:underline font-bold">Forgot password?</Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={cn("h-12 pr-12 bg-[#0F1A37] border-white/5 text-white", errors.password && "border-rose-500/50")}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA4C6] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-[10px] ml-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl mt-4">
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <p className="text-center text-[#9AA4C6] text-sm pt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#6366F1] font-bold hover:underline">Register your school</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}