import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultForgotPasswordValues, forgotPasswordFormSchema, ForgotPasswordFormValues } from "@/schemas/forgotPasswordSchema";
import { ShieldAlert, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosClient from "@/axiosClient";
import { cn } from "@/lib/utils";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: defaultForgotPasswordValues,
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setSuccessMessage(null);
    setGeneralError(null);
    try {
      await axiosClient.post(`/auth/forgot-password`, data);
      setSuccessMessage("If an account exists, you will receive a reset link shortly.");
    } catch {
      setGeneralError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="z-10 w-full max-w-md mx-4 rounded-[2rem] bg-[#0B1632]/90 backdrop-blur-xl border-white/5">
      <CardHeader className="text-center space-y-1 pt-8">
        <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
          <Mail className="text-[#6366F1]" size={24} />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight text-white">Password Recovery</CardTitle>
        <CardDescription className="text-[#9AA4C6]">Enter your email to receive a reset link</CardDescription>
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
            <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
            <Input
              type="email"
              placeholder="you@school.co.zw"
              className={cn("h-12 bg-[#0F1A37] border-white/5 text-white", errors.email && "border-rose-500/50")}
              {...register("email")}
            />
            {errors.email && <p className="text-rose-500 text-[10px] ml-1">{errors.email.message}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl mt-4">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <p className="text-center text-[#9AA4C6] text-sm pt-4">
            <Link to="/login" className="text-[#6366F1] font-bold hover:underline">Back to login</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}