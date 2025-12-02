import Image from "next/image";

export function ChatbotAvatar() {
  return (
    <svg
    viewBox="0 0 600 600"
    className="h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <style>
        {`
        #bot-wrapper {
          transform-origin: 300px 260px;
          animation: walkBody 2s ease-in-out infinite;
        }
        .leg-left {
          transform-origin: 255px 405px;
          animation: legLeft 0.5s ease-in-out infinite alternate;
        }
        .leg-right {
          transform-origin: 345px 405px;
          animation: legRight 0.5s ease-in-out infinite alternate;
        }
        .eye {
          transform-origin: center;
          animation: blink 4s ease-in-out infinite;
        }
        .dot-typing {
          animation: typing 1.2s ease-in-out infinite;
        }
        .dot-typing:nth-child(2) { animation-delay: 0.2s; }
        .dot-typing:nth-child(3) { animation-delay: 0.4s; }
        #glow {
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes walkBody {
          0%   { transform: translateX(0)    rotate(-10deg); }
          50%  { transform: translateX(10px) rotate(-10deg); }
          100% { transform: translateX(0)    rotate(-10deg); }
        }
        @keyframes legLeft {
          0%   { transform: rotate(18deg); }
          100% { transform: rotate(-6deg); }
        }
        @keyframes legRight {
          0%   { transform: rotate(-18deg); }
          100% { transform: rotate(6deg); }
        }
        @keyframes blink {
          0%, 8%, 100% { transform: scaleY(1); }
          4%           { transform: scaleY(0.05); }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.7;  transform: scale(1.08); }
        }
        `}
      </style>
    </defs>

    <circle
      id="glow"
      cx="300"
      cy="260"
      r="210"
      fill="url(#glowGradient)"
      opacity="0.6"
    />

    <defs>
      <radialGradient id="glowGradient" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="45%" stopColor="#fbbf24" />
        <stop offset="80%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>

      <linearGradient id="botBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
    </defs>

    <ellipse
      cx="300"
      cy="440"
      rx="130"
      ry="20"
      fill="#1e293b"
      opacity="0.08"
    />

    <g id="bot-wrapper">
      <line
        x1="300"
        y1="120"
        x2="300"
        y2="168"
        stroke="#b45309"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="300" cy="108" r="15" fill="#b45309" />

      <rect
        x="180"
        y="168"
        width="240"
        height="200"
        rx="60"
        ry="60"
        fill="url(#botBody)"
        stroke="#fed7aa"
        strokeWidth="8"
      />

      <rect
        x="205"
        y="195"
        width="190"
        height="100"
        rx="32"
        ry="32"
        fill="#0f172a"
      />

      <g className="eye">
        <circle cx="250" cy="240" r="12" fill="#b45309" />
        <circle cx="340" cy="240" r="12" fill="#b45309" />
      </g>

      <path
        d="M250 270 Q300 305 350 270"
        fill="none"
        stroke="#22c55e"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <rect
        x="235"
        y="315"
        width="130"
        height="55"
        rx="24"
        ry="24"
        fill="#fefce8"
        stroke="#fed7aa"
        strokeWidth="6"
      />

      <g transform="translate(355,165)">
        <rect
          x="0"
          y="0"
          width="120"
          height="75"
          rx="26"
          ry="26"
          fill="#ffffff"
          stroke="#fed7aa"
          strokeWidth="5"
        />
        <path
          d="M30 75 Q26 90 17 98 Q34 93 47 84"
          fill="#ffffff"
          stroke="#fed7aa"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <g transform="translate(58,40)">
          <circle className="dot-typing" cx="-18" cy="0" r="5" fill="#fbbf24" />
          <circle className="dot-typing" cx="0" cy="0" r="5" fill="#b45309" />
          <circle className="dot-typing" cx="18" cy="0" r="5" fill="#fbbf24" />
        </g>
      </g>

      <g className="leg-left">
        <rect
          x="255"
          y="320"
          width="22"
          height="60"
          rx="11"
          ry="11"
          fill="#e5e7eb"
        />
        <rect
          x="255"
          y="375"
          width="22"
          height="55"
          rx="11"
          ry="11"
          fill="#fde68a"
        />
        <rect
          x="245"
          y="425"
          width="42"
          height="16"
          rx="8"
          ry="8"
          fill="#b45309"
        />
      </g>

      <g className="leg-right">
        <rect
          x="323"
          y="320"
          width="22"
          height="60"
          rx="11"
          ry="11"
          fill="#e5e7eb"
        />
        <rect
          x="323"
          y="375"
          width="22"
          height="55"
          rx="11"
          ry="11"
          fill="#fde68a"
        />
        <rect
          x="313"
          y="425"
          width="42"
          height="16"
          rx="8"
          ry="8"
          fill="#b45309"
        />
      </g>
    </g>
  </svg>
  
     
      
    
  );
}

