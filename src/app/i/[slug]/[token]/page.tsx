import type { Metadata } from "next";
import { invitationMetadata, renderInvitation } from "@/components/invitation/invitation-page";

/** Personal invitation link: /i/<invitation>/<guest code>. */
export async function generateMetadata(props: PageProps<"/i/[slug]/[token]">): Promise<Metadata> {
  return invitationMetadata((await props.params).slug);
}

export default async function PersonalInvitationPage(props: PageProps<"/i/[slug]/[token]">) {
  const { slug, token } = await props.params;
  return renderInvitation(slug, token);
}
