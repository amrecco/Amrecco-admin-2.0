import LoginForm from "@/src/components/auth/LoginForm";
import Logo from "@/src/components/layout/Logo";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FBF9F4] flex flex-col items-center justify-center px-4">
      
      {/* Logo */}
      <Logo className="mb-10" />

      {/* Login Card */}
      <LoginForm />

    </main>
  );
}
