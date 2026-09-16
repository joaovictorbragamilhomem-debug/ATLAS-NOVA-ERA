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
          background: "#090E17",
          color: "#2DD4A8",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size }
  );
}
