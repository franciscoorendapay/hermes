import { FUNIL_MAP_LEGEND, FUNIL_COLORS_MAP } from "@/constants/funil";

export function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {FUNIL_MAP_LEGEND.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: FUNIL_COLORS_MAP[item.id] }}
          />
          <span className="text-xs font-normal text-[#2A2A2A]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
