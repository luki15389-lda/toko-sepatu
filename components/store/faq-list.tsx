import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/store/rich-text";

type FaqItem = { question: string; answer: string };

function parseFaq(content: string): { intro: string[]; items: FaqItem[] } {
  const intro: string[] = [];
  const items: FaqItem[] = [];

  for (const block of content.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)) {
    const lines = block.split("\n");
    const match = lines[0].match(/^\*\*(.+)\*\*$/);
    if (match && lines.length > 1) {
      items.push({ question: match[1], answer: lines.slice(1).join("\n") });
    } else {
      intro.push(block);
    }
  }
  return { intro, items };
}

export function FaqList({ content }: { content: string }) {
  const { intro, items } = parseFaq(content);

  return (
    <div>
      {intro.length > 0 && (
        <div className="mb-8">
          <RichText content={intro.join("\n\n")} />
        </div>
      )}

      {items.length > 0 && (
        <div className="divide-y divide-stone-line border-y border-stone-line">
          {items.map((item, i) => (
            <details key={i} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="size-5 shrink-0 transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="pb-5">
                <RichText content={item.answer} />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}