import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldAlert, Loader2, Eye, EyeOff, School } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/axiosClient";
import axios from "axios";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token');
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }
      try {
        await axiosClient.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed.');
      }
    };
    verify();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
        //@ts-ignore
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
      localStorage.setItem("token", JSON.stringify(res.data.token));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === 'headmaster') navigate("/dashboard", { replace: true });
      else if (role === 'admin') navigate("/dashboard/admin", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401) setLoginError("Invalid email or password.");
      else if (status === 403) setLoginError("Your account has been deactivated.");
      else setLoginError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) { toast.error('Please enter your school email'); return; }
    setResendLoading(true);
    try {
      await axiosClient.post('/auth/resend-verification', { email: resendEmail });
      toast.success('Verification email sent! Check your inbox.');
      setResendEmail('');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to resend. Try again.';
      if (error.response?.status === 400 && msg.includes('already verified')) {
        toast.error(msg);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(msg);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060D1F] p-4">
      <Card className="w-full max-w-md rounded-[2rem] bg-[#0B1632]/90 backdrop-blur-xl border-white/5">
        <CardHeader className="text-center space-y-1 pt-8">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
            <School className="text-[#6366F1]" size={24} />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white">
            {status === 'success' ? 'Email Verified!' : 'Email Verification'}
          </CardTitle>
          <CardDescription className="text-[#9AA4C6]">
            {status === 'success' ? 'Your credentials have been sent to your email' : 'Verifying your school account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8 text-center">

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="text-[#6366F1] animate-spin" size={48} />
              <p className="text-[#9AA4C6]">Verifying your email...</p>
            </div>
          )}

          {/* Success — show login form */}
          {status === 'success' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 size={16} />
                <span>Account verified! Check your email for your password, then login below.</span>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  <ShieldAlert size={16} /> {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                  <Input
                    type="email"
                    placeholder="info@yourschool.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-[#0F1A37] border-white/5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#E6EEF8] text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 bg-[#0F1A37] border-white/5 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9AA4C6] hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl"
                >
                  {loginLoading ? (
                    <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Signing in...</span>
                  ) : 'Sign In'}
                </Button>
              </form>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <ShieldAlert className="text-rose-400" size={48} />
              <p className="text-rose-400 font-bold">{message}</p>
              <div className="w-full bg-[#0F1A37] border border-white/10 rounded-xl p-4 space-y-3 text-left">
                <p className="text-[#9AA4C6] text-xs uppercase tracking-widest font-bold">Resend Verification Email</p>
                <p className="text-[#9AA4C6] text-xs">Enter your school email to get a new verification link.</p>
                <Input
                  type="email"
                  placeholder="info@yourschool.co.zw"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="h-11 bg-[#0B1632] border-white/5 text-white"
                />
                <Button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full h-11 bg-[#6366F1] hover:bg-[#5558E3] text-white font-bold rounded-xl"
                >
                  {resendLoading ? (
                    <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Sending...</span>
                  ) : 'Resend Verification Email'}
                </Button>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={() => navigate('/login')}
                  className="flex-1 border-white/10 text-[#9AA4C6] hover:text-white hover:bg-white/5">
                  Try Login
                </Button>
                <Button variant="outline" onClick={() => navigate('/register')}
                  className="flex-1 border-white/10 text-[#9AA4C6] hover:text-white hover:bg-white/5">
                  Register
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}