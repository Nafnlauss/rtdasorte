export default function LogoRT({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 200 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ticket com trevo */}
      <g transform="translate(100, 20)">
        {/* Ticket */}
        <rect 
          x="-25" 
          y="-15" 
          width="50" 
          height="30" 
          rx="2" 
          fill="#f59e0b" 
          stroke="#16a34a" 
          strokeWidth="3"
          transform="rotate(10)"
        />
        
        {/* Trevo de 4 folhas */}
        <g transform="translate(0, 0) rotate(10)">
          <circle cx="-5" cy="-5" r="4" fill="#16a34a" />
          <circle cx="5" cy="-5" r="4" fill="#16a34a" />
          <circle cx="-5" cy="5" r="4" fill="#16a34a" />
          <circle cx="5" cy="5" r="4" fill="#16a34a" />
        </g>
      </g>
      
      {/* Texto RT */}
      <text 
        x="25" 
        y="45" 
        fontFamily="Arial Black, sans-serif" 
        fontSize="36" 
        fontWeight="900" 
        fill="#f59e0b" 
        stroke="#16a34a" 
        strokeWidth="2"
      >
        RT
      </text>
      
      {/* Banner "DA SORTE" */}
      <g transform="translate(100, 65)">
        <path 
          d="M -60 0 Q -60 -8, -50 -8 L 50 -8 Q 60 -8, 60 0 L 60 8 Q 60 16, 50 16 L -50 16 Q -60 16, -60 8 Z" 
          fill="#16a34a"
        />
        <text 
          x="0" 
          y="8" 
          fontFamily="Arial Black, sans-serif" 
          fontSize="18" 
          fontWeight="700" 
          fill="#fef3c7" 
          textAnchor="middle"
        >
          DA SORTE
        </text>
      </g>
    </svg>
  )
}