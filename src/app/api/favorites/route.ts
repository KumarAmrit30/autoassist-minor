import { NextRequest, NextResponse } from "next/server";
const disabledResponse = () =>
  NextResponse.json(
    {
      error: "Favorites API is temporarily disabled while authentication is offline.",
    },
    { status: 503 }
  );

export async function GET() {
  return disabledResponse();
}

export async function POST(request: NextRequest) {
  void request;
  return disabledResponse();
}

export async function DELETE(request: NextRequest) {
  void request;
  return disabledResponse();
}
