import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(formData);
            navigate("/dashboard");
        } catch (error) {
            if (error.response?.status === 401) {
                setError("The email or password is incorrect.");
            } else if (error.response?.status === 422) {
                setError("Please enter a valid email and password.");
            } else if (error.response?.status === 429) {
                setError("Too many attempts. Please wait one minute.");
            } else {
                setError(
                    "Unable to connect to the server. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen w-full bg-[#F5F4F1] font-[Inter,sans-serif]">
            {/* LEFT: brand panel */}
            <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#0A1330] px-14 py-12 lg:flex">
                {/* blaugrana stripes, restrained to a corner accent */}
                <div
                    className="pointer-events-none absolute inset-y-0 -left-24 w-[130%] opacity-90"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(100deg, #A50044 0px, #A50044 46px, #004D98 46px, #004D98 92px)",
                        WebkitMaskImage:
                            "linear-gradient(to right, black 0%, black 22%, transparent 60%)",
                        maskImage:
                            "linear-gradient(to right, black 0%, black 22%, transparent 60%)",
                    }}
                />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#FFED02] bg-[#0A1330] text-sm font-bold tracking-wide text-[#FFED02]">
                        CM
                    </div>
                    <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
                        Club Management
                    </span>
                </div>

                <div className="relative z-10 max-w-md">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FFED02]">
                        Administration
                    </p>
                    <h1 className="font-[Barlow_Condensed,Inter,sans-serif] text-6xl font-bold uppercase leading-[0.95] text-white">
                        Fc Barcelona
                        <br />
                        More Than just
                        <br />
                        a Team.
                    </h1>
                    <div className="mt-6 h-1 w-16 bg-[#FFED02]" />
                    <p className="mt-6 text-sm leading-relaxed text-white/60">
                        Members, fixtures, and finances for the whole club,
                        in one dashboard.
                    </p>
                </div>

                <p className="relative z-10 text-xs text-white/40">
                    © {new Date().getFullYear()} Club Management. All rights reserved.
                </p>
            </section>

            {/* RIGHT: form panel */}
            <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    {/* mobile-only crest, since the brand panel is hidden below lg */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A50044] text-sm font-bold text-white">
                            CM
                        </div>
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A1330]">
                            Club Management
                        </span>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-[Barlow_Condensed,Inter,sans-serif] text-3xl font-bold uppercase tracking-tight text-[#0A1330]">
                            Sign in
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Access the administration dashboard.
                        </p>
                    </div>

                    {error && (
                        <div
                            className="mb-6 flex items-start gap-2 rounded-lg border border-[#A50044]/20 bg-[#A50044]/5 px-4 py-3 text-sm text-[#A50044]"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-[#0A1330]"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                placeholder="admin@club.com"
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[#0A1330] outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-[#0A1330]"
                                >
                                    Password
                                </label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs font-medium text-[#004D98] hover:text-[#A50044]"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[#0A1330] outline-none transition focus:border-[#004D98] focus:ring-2 focus:ring-[#004D98]/15"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#A50044] px-4 py-3 font-semibold text-white transition hover:bg-[#8a0038] disabled:cursor-not-allowed disabled:bg-[#A50044]/50"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default Login;
