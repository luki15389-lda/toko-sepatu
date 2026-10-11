function shortDate(d: string) {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

export function BarChart({
  title,
  data,
  format,
}: {
  title: string;
  data: { label: string; value: number }[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const first = data[0]?.label;
  const last = data[data.length - 1]?.label;

  return (
    <figure className="rounded-2xl border border-stone-line bg-white p-6">
      <figcaption className="mb-4 text-sm font-bold">{title}</figcaption>

      <div
        role="img"
        aria-label={`${title}. Nilai tertinggi ${format(max)}.`}
        className="flex h-40 items-end gap-[2px]"
      >
        {data.map((d) => (
          <div
            key={d.label}
            title={`${shortDate(d.label)}: ${format(d.value)}`}
            className="flex-1 rounded-t bg-ink/80 transition hover:bg-accent"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
        <span>{first ? shortDate(first) : ""}</span>
        <span>{last ? shortDate(last) : ""}</span>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}