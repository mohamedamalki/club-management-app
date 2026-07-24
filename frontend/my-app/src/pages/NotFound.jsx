import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function NotFound() {
    const { isAuthenticated } = useAuth();

    const destination = isAuthenticated
        ? "/dashboard"
        : "/login";

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <section className="text-center">
                <p className="text-7xl font-bold text-blue-600">
                    404
                </p>

                <h1 className="mt-4 text-2xl font-bold text-slate-800">
                    Page not found
                </h1>

                <p className="mt-2 text-slate-500">
                    The page you requested does not exist.
                </p>

                <Link
                    to={destination}
                    replace
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                    {isAuthenticated
                        ? "Return to dashboard"
                        : "Go to login"}
                </Link>
            </section>
        </main>
    );
}
