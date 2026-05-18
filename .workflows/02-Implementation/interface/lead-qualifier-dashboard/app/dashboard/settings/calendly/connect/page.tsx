import { CalendlyConnectClient } from "./CalendlyConnectClient";

export default async function CalendlyConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <CalendlyConnectClient success={params.success} error={params.error} />;
}
