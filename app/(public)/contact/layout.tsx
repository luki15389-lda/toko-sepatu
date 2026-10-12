import { NavMarker } from "@/components/store/nav-marker";

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavMarker page="contact" />
      {children}
    </>
  );
}