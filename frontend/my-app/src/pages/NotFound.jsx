import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function NotFound() {
    const { isAuthenticated } = useAuth();

    const destination = isAuthenticated
        ? "/dashboard"
        : "/login";

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A1330] px-4">
            {/* faint stripe accent, matching the login brand panel */}
            <div
                className="pointer-events-none absolute inset-y-0 -left-24 w-[70%] opacity-[0.15]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(100deg, #A50044 0px, #A50044 46px, #004D98 46px, #004D98 92px)",
                    WebkitMaskImage:
                        "linear-gradient(to right, black 0%, black 30%, transparent 75%)",
                    maskImage:
                        "linear-gradient(to right, black 0%, black 30%, transparent 75%)",
                }}
            />

            <section className="relative z-10 text-center">
                <p className="font-[Barlow_Condensed,Inter,sans-serif] text-9xl font-bold leading-none text-[#A50044]">
                    404
                </p>

                <div className="mx-auto mt-4 h-1 w-16 bg-[#FFED02]" />

                <h1 className="mt-6 font-[Barlow_Condensed,Inter,sans-serif] text-3xl font-bold uppercase tracking-tight text-white">
                    Page not found
                </h1>

                <p className="mt-2 text-white/50">
                    The page you requested does not exist.
                </p>

                <Link
                    to={destination}
                    replace
                    className="mt-8 inline-block rounded-lg bg-[#A50044] px-6 py-3 font-medium text-white transition hover:bg-[#8a0038]"
                >
                    {isAuthenticated
                        ? "Return to dashboard"
                        : "Go to login"}
                </Link>
            </section>
        </main>
    );
}
