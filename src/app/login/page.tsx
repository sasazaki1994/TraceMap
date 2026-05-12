import { LoginForm } from "@/components/auth/login-form";
import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
export default function LoginPage() { return <main data-testid="login-page"><PageContainer className="home-grid"><Panel><div className="eyebrow">Closed Beta Access</div><h1>Sign in to TraceMap</h1><p className="muted">TraceMap is currently available to invited beta users only.</p><LoginForm /></Panel></PageContainer></main>; }
