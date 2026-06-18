// Fixed, animated aurora background — three large blurred gradient blobs that slowly
// drift, plus a soft vignette. Rendered once in Layout, behind all content.
export default function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] rounded-full blur-[120px] animate-aurora-1"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)" }}
      />
      <div
        className="absolute right-[-10%] top-[5%] h-[50vh] w-[50vh] rounded-full blur-[120px] animate-aurora-2"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.45), transparent 60%)" }}
      />
      <div
        className="absolute bottom-[-20%] left-[25%] h-[55vh] w-[55vh] rounded-full blur-[130px] animate-aurora-3"
        style={{ background: "radial-gradient(circle, rgba(163,230,53,0.30), transparent 62%)" }}
      />
      {/* Vignette to keep edges grounded. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, transparent 50%, rgba(7,7,16,0.65) 100%)",
        }}
      />
    </div>
  );
}
