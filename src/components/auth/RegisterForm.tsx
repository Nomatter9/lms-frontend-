import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defaultRegisterValues, registerFormSchema, RegisterFormValues } from "@/schemas/registerSchema";
import { CheckCircle2, ShieldAlert, School, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosClient from "@/axiosClient";
import { cn } from "@/lib/utils";

const PROVINCES = [
  "Bulawayo",
  "Harare",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands",
];

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors }, setError } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      ...defaultRegisterValues,
      province: "Matabeleland South",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setGeneralError(null);
    try {
      const formData = new FormData();
      formData.append('schoolName', data.schoolName);
      formData.append('address', data.address);
      formData.append('province', data.province);
      formData.append('schoolPhone', data.schoolPhone);
      formData.append('schoolEmail', data.schoolEmail);
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);

      await axiosClient.post(`/auth/school/register`, formData);
      setSuccessMessage("School registered! Check your email to verify your account before logging in.");
      reset();
    } catch (error: any) {
      if (error.response?.status === 422) {
        Object.keys(error.response.data.errors).forEach((field) => {
          setError(field as keyof RegisterFormValues, {
            message: error.response.data.errors[field][0],
          });
        });
      } else if (error.response?.status === 409) {
        setGeneralError("A school with this email already exists.");
      } else {
        setGeneralError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn("h-12 bg-[#0A1228] border text-white placeholder:text-[#4A5578] rounded-xl transition-colors focus:border-[#6366F1] focus:ring-0",
      hasError ? "border-rose-500/60" : "border-[#1E2D50] hover:border-[#2E3D60]"
    );

  return (
    <Card className="z-10 w-full max-w-2xl mx-4 rounded-[2rem] bg-[#0B1632]/95 backdrop-blur-xl border border-[#1E2D50] shadow-2xl">
      <CardHeader className="text-center space-y-2 pt-10 pb-2">
        <div className="mx-auto w-14 h-14 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center mb-2 border border-[#6366F1]/20">
          <School className="text-[#6366F1]" size={26} />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight text-white">Register Your School</CardTitle>
        <CardDescription className="text-[#6B7BA4]">
          Your login credentials will be sent to the school email
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pb-10 px-8">

        {successMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {generalError && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* School Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 bg-[#6366F1] rounded-full" />
              <h3 className="text-[#6366F1] text-xs font-bold uppercase tracking-widest">School Information</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">School Name</Label>
              <Input
                placeholder="e.g. Hillside Primary School"
                className={inputClass(!!errors.schoolName)}
                {...register("schoolName")}
              />
              {errors.schoolName && <p className="text-rose-400 text-[11px] ml-1">{errors.schoolName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">Address</Label>
              <Input
                placeholder="123 Main Street, Harare"
                className={inputClass(!!errors.address)}
                {...register("address")}
              />
              {errors.address && <p className="text-rose-400 text-[11px] ml-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">Province</Label>
                <div className="relative">
                  <select
                    value={watch("province")}
                    onChange={(e) => setValue("province", e.target.value)}
                    className={cn(
                      "w-full h-12 px-3 pr-10 rounded-xl text-sm appearance-none cursor-pointer bg-[#0A1228] text-white border transition-colors focus:outline-none focus:border-[#6366F1]",
                      errors.province ? "border-rose-500/60" : "border-[#1E2D50] hover:border-[#2E3D60]"
                    )}
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} className="bg-[#0A1228] text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5578] pointer-events-none" />
                </div>
                {errors.province && <p className="text-rose-400 text-[11px] ml-1">{errors.province.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">School Phone</Label>
                <Input
                  placeholder="+263 712 345 678"
                  className={inputClass(!!errors.schoolPhone)}
                  {...register("schoolPhone")}
                />
                {errors.schoolPhone && <p className="text-rose-400 text-[11px] ml-1">{errors.schoolPhone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">School Email</Label>
              <Input
                type="email"
                placeholder="info@hillside.co.zw"
                className={inputClass(!!errors.schoolEmail)}
                {...register("schoolEmail")}
              />
              {errors.schoolEmail && <p className="text-rose-400 text-[11px] ml-1">{errors.schoolEmail.message}</p>}
            </div>
          </div>

          {/* Headmaster Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 bg-[#6366F1] rounded-full" />
              <h3 className="text-[#6366F1] text-xs font-bold uppercase tracking-widest">Headmaster Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">First Name</Label>
                <Input
                  placeholder="John"
                  className={inputClass(!!errors.firstName)}
                  {...register("firstName")}
                />
                {errors.firstName && <p className="text-rose-400 text-[11px] ml-1">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[#9AA4C6] text-xs font-semibold uppercase tracking-wider ml-1">Last Name</Label>
                <Input
                  placeholder="Moyo"
                  className={inputClass(!!errors.lastName)}
                  {...register("lastName")}
                />
                {errors.lastName && <p className="text-rose-400 text-[11px] ml-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#6366F1]/5 border border-[#6366F1]/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] shrink-0" />
              <p className="text-[#6B7BA4] text-xs">
                Login email will be <span className="text-[#6366F1] font-semibold">the school email</span> above. A temporary password will be sent to that email.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl text-sm tracking-wide transition-all duration-200 shadow-lg shadow-[#6366F1]/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </span>
            ) : "Register School"}
          </Button>

          <p className="text-center text-[#6B7BA4] text-sm">
            Already registered?{" "}
            <Link to="/login" className="text-[#6366F1] font-bold hover:underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}