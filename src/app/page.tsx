import { redirect } from "next/navigation";
import { getAuthenticatedUserId, getAndTickOwnAvatar } from "@/lib/avatarService";

export default async function RootPage() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }
  const avatar = await getAndTickOwnAvatar();
  redirect(avatar ? "/pet" : "/onboarding");
}
