import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AuthPage = () => {
  const { mode } = useParams<{ mode: string }>();
  const isLogin = mode !== "signup";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md space-y-6"
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">EventSphere</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tighter">
            Orchestrate with <span className="text-gradient">Precision</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join thousands of organizers creating unforgettable experiences with real-time tools, AI recommendations, and seamless check-in systems.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="lg:hidden mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold tracking-tight">EventSphere</span>
            </Link>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? "Sign in to your EventSphere account"
                : "Get started with EventSphere today"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Full Name</label>
                <Input placeholder="John Doe" className="h-10" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="you@example.com" className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 active-press gap-2">
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              to={isLogin ? "/auth/signup" : "/auth/login"}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
