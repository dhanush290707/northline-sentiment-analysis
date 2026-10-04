export function ProductArt({ motif = "phone", accent = "#9d4528", title = "Product" }) {
  return (
    <svg className="product-art" viewBox="0 0 360 240" role="img" aria-label={title}>
      <rect width="360" height="240" fill="#efe6d8" />
      <circle cx="300" cy="36" r="64" fill={accent} opacity="0.16" />
      {motif === "phone" && (
        <g>
          <rect x="138" y="36" width="84" height="168" rx="16" fill={accent} />
          <rect x="148" y="48" width="64" height="128" rx="6" fill="#f7f1e6" />
          <circle cx="180" cy="188" r="5" fill="#f7f1e6" />
        </g>
      )}
      {motif === "camera" && (
        <g>
          <rect x="78" y="78" width="204" height="112" rx="18" fill={accent} />
          <circle cx="168" cy="134" r="36" fill="#f7f1e6" />
          <circle cx="168" cy="134" r="18" fill={accent} />
          <rect x="214" y="64" width="48" height="22" rx="6" fill={accent} />
        </g>
      )}
      {motif === "headphones" && (
        <g fill="none" stroke={accent} strokeWidth="14">
          <path d="M90 150c0-55 40-90 90-90s90 35 90 90" />
          <rect x="70" y="140" width="36" height="58" rx="12" fill={accent} stroke="none" />
          <rect x="254" y="140" width="36" height="58" rx="12" fill={accent} stroke="none" />
        </g>
      )}
      {motif === "buds" && (
        <g>
          <rect x="128" y="92" width="104" height="78" rx="24" fill={accent} />
          <circle cx="122" cy="86" r="22" fill={accent} />
          <circle cx="238" cy="86" r="22" fill={accent} />
          <circle cx="122" cy="86" r="8" fill="#f7f1e6" />
          <circle cx="238" cy="86" r="8" fill="#f7f1e6" />
        </g>
      )}
      {motif === "watch" && (
        <g>
          <rect x="156" y="28" width="48" height="184" rx="20" fill={accent} />
          <circle cx="180" cy="120" r="42" fill="#f7f1e6" />
          <path d="M180 120l18-16" stroke={accent} strokeWidth="4" />
        </g>
      )}
      {motif === "speaker" && (
        <g>
          <rect x="108" y="42" width="144" height="156" rx="28" fill={accent} />
          <circle cx="180" cy="118" r="42" fill="#f7f1e6" />
          <circle cx="180" cy="118" r="16" fill={accent} />
        </g>
      )}
      {motif === "keyboard" && (
        <g>
          <rect x="48" y="78" width="264" height="96" rx="14" fill={accent} />
          {Array.from({ length: 10 }, (_, index) => (
            <rect key={index} x={64 + index * 24} y="96" width="16" height="16" rx="3" fill="#f7f1e6" />
          ))}
          {Array.from({ length: 9 }, (_, index) => (
            <rect key={`b${index}`} x={76 + index * 24} y="122" width="16" height="16" rx="3" fill="#f7f1e6" />
          ))}
        </g>
      )}
      {motif === "lamp" && (
        <g>
          <path d="M110 150h140l-18-48H128z" fill={accent} />
          <rect x="172" y="150" width="16" height="42" fill={accent} />
          <rect x="142" y="190" width="76" height="12" rx="4" fill={accent} />
        </g>
      )}
      {motif === "tablet" && (
        <g>
          <rect x="70" y="42" width="220" height="156" rx="16" fill={accent} />
          <rect x="86" y="56" width="188" height="128" rx="6" fill="#f7f1e6" />
        </g>
      )}
      {motif === "battery" && (
        <g>
          <rect x="78" y="78" width="190" height="84" rx="16" fill={accent} />
          <rect x="268" y="104" width="16" height="32" rx="4" fill={accent} />
          <rect x="96" y="96" width="90" height="48" rx="8" fill="#f7f1e6" />
        </g>
      )}
    </svg>
  );
}
