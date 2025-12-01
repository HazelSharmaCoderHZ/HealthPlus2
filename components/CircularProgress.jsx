// components/CircularProgress.jsx
export default function CircularProgress({ value = 0, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {/* background track */}
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#b1faeeff"
        strokeWidth={stroke}
        fill="none"
      />
      {/* progress stroke */}
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#034645ff" /* cyan/blue */
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 400ms ease" }}
      />
      {/* center text */}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="font-semibold" style={{fontSize: size*0.18, fill: "#075985"}}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}
