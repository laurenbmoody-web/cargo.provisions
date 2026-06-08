/** Brand loading spinner — the Cargo mark, gently rotating. */
export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <img
      className="brand-spinner"
      src="/cargo-mark.svg"
      alt="Loading"
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
