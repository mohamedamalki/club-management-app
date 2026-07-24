import  useAuth  from "../hooks/useAuth";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <section>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    Dashboard
                </h1>

                <p className="mt-1 text-slate-500">
                    Welcome back, {user?.name}.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardCard
                    title="Teams"
                    value="0"
                />

                <DashboardCard
                    title="Players"
                    value="0"
                />

                <DashboardCard
                    title="Coaches"
                    value="0"
                />

                <DashboardCard
                    title="Active season"
                    value="None"
                />
            </div>
        </section>
    );
}

function DashboardCard({ title, value }) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
                {title}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-800">
                {value}
            </p>
        </article>
    );
}
