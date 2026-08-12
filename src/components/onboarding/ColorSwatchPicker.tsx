"use client";

export function ColorSwatchPicker({
  label,
  colors,
  value,
  onChange,
}: {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="text-sm font-semibold mb-2">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={`${label}: ${color}`}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className={`h-9 w-9 rounded-full border-2 transition ${
              value === color
                ? "border-[var(--color-app-fg)] scale-110 shadow-md"
                : "border-transparent"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}
