import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultResetPasswordValues, resetPasswordFormSchema, ResetPasswordFormValues } from "@/schemas/resetPasswordSchema";
import { Eye, EyeOff, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosClient from "@/axiosClient";
import { cn } from "@/lib/utils";

export default function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: defaultResetPasswordValues,
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setGeneralError("Invalid or missing reset token.");
      return;
    }
    setLoading(true);
    setGeneralError(null);
    try {
      await axiosClient.post(`/auth/reset-password`, {
        token,
        newPassword: data.newPassword,
      });
      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setGeneralError("Link expired or invalid. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="z-10 w-full max-w-md mx-4 rounded-[2rem] bg-[#0B1632]/90 backdrop-blur-xl border-white/5">
      <CardHeader className="text-center space-y-1 pt-8">
        <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="text-[#6366F1]" size={24} />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight text-white">Reset Password</CardTitle>
        <CardDescription className="text-[#9AA4C6]">Set your new security credentials</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pb-8">
        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 size={16} /> {successMessage}
          </div>
        )}
        {generalError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <ShieldAlert size={16} /> {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={cn("h-12 pr-12 bg-[#0F1A37] border-white/5 text-white", errors.newPassword && "border-rose-500/50")}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA4C6] hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-rose-500 text-[10px] ml-1">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={cn("h-12 pr-12 bg-[#0F1A37] border-white/5 text-white", errors.newPasswordConfirmation && "border-rose-500/50")}
                {...register("newPasswordConfirmation")}
              />
            </div>
            {errors.newPasswordConfirmation && <p className="text-rose-500 text-[10px] ml-1">{errors.newPasswordConfirmation.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl mt-4">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}