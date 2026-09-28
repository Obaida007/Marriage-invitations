import type { Metadata } from "next";
import { invitationMetadata, renderInvitation } from "@/components/invitation/invitation-page";

export async function generateMetadata(props: PageProps<"/i/[slug]">): Promise<Metadata> {
  return invitationMetadata((await props.params).slug);
}

export default async function InvitationPage(props: PageProps<"/i/[slug]">) {
  const { slug } = await props.params;
  // Legacy personal links used ?g=<code>; new ones are /i/<slug>/<code>.
  const { g } = await props.searchParams;
  return renderInvitation(slug, typeof g === "string" ? g : undefined);
}
