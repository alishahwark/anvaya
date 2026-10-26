import { redirect } from "next/navigation";

// The stakeholder explorer now lives on each policy page.
export default function ImpactRedirect() {
  redirect("/policies/dpdp-act-2023#affected");
}
