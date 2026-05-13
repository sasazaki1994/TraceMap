import { LoginForm } from "@/components/auth/login-form";
import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
export default function LoginPage() { return <main data-testid="login-page"><PageContainer className="home-grid"><Panel><div className="eyebrow">Public Beta Access</div><h1>Sign in to TraceMap</h1><p className="muted">Sign in to save, revisit, and share investigations.</p><LoginForm /></Panel></PageContainer></main>; }
