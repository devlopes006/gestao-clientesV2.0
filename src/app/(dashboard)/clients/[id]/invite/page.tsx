import { redirect } from "next/navigation";

interface ClientInvitePageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientInvitePage({ params }: ClientInvitePageProps) {
  const { id } = await params;
  redirect(`/admin/members?fromClient=${encodeURIComponent(id)}`);
}
