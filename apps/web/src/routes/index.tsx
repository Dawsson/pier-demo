import { createFileRoute } from "@tanstack/react-router";
import { getPublicCounterServerFn } from "@/lib/counter-data";
import { HomePage } from "./-components/home-page";

export const Route = createFileRoute("/")({
  loader: () => getPublicCounterServerFn(),
  component: HomeRoute,
  staleTime: 5_000,
});

function HomeRoute() {
  const initialData = Route.useLoaderData();

  return <HomePage initialData={initialData} />;
}
