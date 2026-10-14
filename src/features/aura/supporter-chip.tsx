export function SupporterChip({
  supporter,
}: {
  supporter: { earnedAura: number; tier: { id: string; name: string } };
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
      {supporter.tier.name}
      <span className="opacity-75">· {supporter.earnedAura}</span>
    </span>
  );
}
