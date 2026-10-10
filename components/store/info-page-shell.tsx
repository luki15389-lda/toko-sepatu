import { Breadcrumb } from "@/components/shared/breadcrumb";

export function InfoPageShell({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-4 py-8 sm:px-6 lg:py-12 ${wide ? "max-w-5xl" : "max-w-3xl"}`}
    >
      <Breadcrumb items={[{ label: "Beranda", href: "/" }, { label: title }]} />
      <h1 className="mb-8 mt-4 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {children}
    </div>
  );
}