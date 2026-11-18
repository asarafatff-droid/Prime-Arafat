import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  COLOR_FAMILIES,
  getColorHex,
  isLightColor,
  WORLD_COLORS,
  type ColorFamily,
} from '../../lib/colors';

interface WorldColorSelectorProps {
  selectedColors: string[];
  onChange: (nextColors: string[]) => void;
  compact?: boolean;
}

export function WorldColorSelector({
  selectedColors,
  onChange,
  compact = false,
}: WorldColorSelectorProps) {
  const [search, setSearch] = useState('');
  const [activeFamily, setActiveFamily] = useState<'ALL' | ColorFamily>('ALL');
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#F85606');

  const selectedSet = useMemo(
    () => new Set(selectedColors.map((c) => c.toLowerCase())),
    [selectedColors]
  );

  const filteredColors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return WORLD_COLORS.filter((c) => {
      if (activeFamily !== 'ALL' && c.family !== activeFamily) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.family.toLowerCase().includes(q) ||
        c.hex.toLowerCase().includes(q)
      );
    });
  }, [search, activeFamily]);

  const toggleColor = (colorName: string) => {
    const exists = selectedColors.some((c) => c.toLowerCase() === colorName.toLowerCase());
    if (exists) {
      onChange(selectedColors.filter((c) => c.toLowerCase() !== colorName.toLowerCase()));
    } else {
      onChange([...selectedColors, colorName]);
    }
  };

  const handleAddCustomColor = () => {
    const label = customName.trim() || customHex;
    if (!label) return;
    if (!selectedColors.some((c) => c.toLowerCase() === label.toLowerCase())) {
      onChange([...selectedColors, label]);
    }
    setCustomName('');
  };

  return (
    <div className="space-y-3 border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
      {/* Selected colors strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-800">
          Selected Product Colors ({selectedColors.length})
        </div>
        {selectedColors.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-red-600 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {selectedColors.length === 0 ? (
        <p className="text-xs text-slate-500">
          Click any color names below to assign one or multiple colors to this product.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selectedColors.map((color) => {
            const hex = getColorHex(color);
            return (
              <span
                key={color}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800"
              >
                <span
                  className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span>{color}</span>
                <button
                  type="button"
                  onClick={() => toggleColor(color)}
                  aria-label={`Remove color ${color}`}
                  className="text-slate-400 hover:text-red-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search + Custom Color Add */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search all ${WORLD_COLORS.length}+ world colors...`}
            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#F85606]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            aria-label="Pick custom color shade"
            className="w-9 h-9 p-0.5 bg-white border border-slate-200 rounded-lg cursor-pointer shrink-0"
          />
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomColor();
              }
            }}
            placeholder="Custom color name..."
            className="flex-1 h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#F85606]"
          />
          <button
            type="button"
            onClick={handleAddCustomColor}
            className="h-9 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Color Family Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveFamily('ALL')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
            activeFamily === 'ALL'
              ? 'bg-[#F85606] text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          All ({WORLD_COLORS.length})
        </button>
        {COLOR_FAMILIES.map((family) => (
          <button
            key={family}
            type="button"
            onClick={() => setActiveFamily(family)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeFamily === family
                ? 'bg-[#F85606] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {family}
          </button>
        ))}
      </div>

      {/* World Color Grid with written color name + swatch */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 overflow-y-auto pr-1 ${
          compact ? 'max-h-44' : 'max-h-64'
        }`}
      >
        {filteredColors.map((c) => {
          const isSelected = selectedSet.has(c.name.toLowerCase());
          const light = isLightColor(c.hex);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleColor(c.name)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors ${
                isSelected
                  ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606] font-semibold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <Check className={`w-2.5 h-2.5 ${light ? 'text-slate-900' : 'text-white'}`} />
                )}
              </span>
              <span className="truncate">{c.name}</span>
            </button>
          );
        })}
        {filteredColors.length === 0 && (
          <p className="col-span-full text-xs text-slate-500 py-4 text-center">
            No preset color matched &ldquo;{search}&rdquo;. Use &ldquo;Custom color name&rdquo; above to add it.
          </p>
        )}
      </div>
    </div>
  );
}
