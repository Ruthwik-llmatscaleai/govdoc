import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
};

export function AppLogo({ size = 64, className }: Props) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-label="LLM at Scale.AI"
    >
      <Image
        src="/llm-at-scale-logo.png"
        alt="LLM at Scale.AI"
        width={size}
        height={size}
        priority
      />
    </div>
  );
}
