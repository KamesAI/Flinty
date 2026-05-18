import { LinkedInConnectClient } from "./LinkedInConnectClient";

export default async function LinkedInConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LinkedInConnectClient success={params.success} error={params.error} />;
}
