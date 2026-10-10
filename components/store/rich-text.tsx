import { Fragment } from "react";

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

export function RichText({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-neutral-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n");

        if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.slice(2))}</li>
              ))}
            </ul>
          );
        }

        if (lines.length === 1 && block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 text-xl font-bold text-ink">
              {renderInline(block.slice(3))}
            </h2>
          );
        }

        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}