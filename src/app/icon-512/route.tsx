import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1210",
          color: "#10B981",
          fontSize: 340,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { width: 512, height: 512 }
  );
}
