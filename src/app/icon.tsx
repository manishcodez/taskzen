import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171B26",
          borderRadius: 10,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 44 44" fill="none">
          <rect x="2" y="2" width="40" height="40" rx="14" fill="#2A3444" />
          <path
            d="M12 28C16 24 20 22 24 22C28 22 31 23.5 34 26"
            stroke="#8EB4FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M12 21C15.5 18.5 19 17 23 17C27.5 17 30.5 18.5 33 21"
            stroke="#6E93B8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M12 14C15 12 18.5 11 22 11C26.5 11 29.5 12.2 32 14.5"
            stroke="#E08A67"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="34" cy="14" r="3" fill="#E08A67" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
