import { getStoreSettings } from "@/lib/data/store";

export async function AnnouncementBar() {
  const settings = await getStoreSettings();
  if (!settings.announcementText) return null;

  return (
    <div className="bg-ink px-4 py-2 text-center text-xs font-medium tracking-wide text-paper">
      {settings.announcementText}
    </div>
  );
}