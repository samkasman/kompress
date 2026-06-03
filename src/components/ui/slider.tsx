interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Optional formatted value override, e.g. "320 kbps". Defaults to the raw value. */
  valueLabel?: string;
  /** Left-edge caption — describes what the minimum value produces. */
  minLabel: string;
  /** Right-edge caption — describes what the maximum value produces. */
  maxLabel: string;
  onChange: (value: number) => void;
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  valueLabel,
  minLabel,
  maxLabel,
  onChange,
}: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs text-slate-400">
          {label}
        </label>
        <span className="text-xs text-slate-300">{valueLabel ?? value}</span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        className="w-full appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
