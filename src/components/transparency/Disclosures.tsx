export function Disclosures() {
  return (
    <section className="border border-border rounded-2xl p-6 bg-card space-y-4">
      <h2 className="text-lg font-semibold">Disclosures</h2>
      <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <li className="flex gap-3">
          <span className="text-primary mt-1">•</span>
          <span>
            APY is a rolling estimate derived from price-per-share changes; actual returns vary based on underlying receivable performance and repayment timing.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-primary mt-1">•</span>
          <span>
            Liquidity buffer is held in wSOL to satisfy withdrawals during the 2-day delay period; see Parameters for current buffer allocation.
          </span>
        </li>
      </ul>
    </section>
  );
}
