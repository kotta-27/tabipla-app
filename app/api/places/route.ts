import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input");
  if (!input || input.trim().length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: input.trim(),
      languageCode: "ja",
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ suggestions: [] }, { status: res.status });
  }

  const data = await res.json();
  const suggestions = (data.suggestions ?? []).map((s: {
    placePrediction?: { text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } }
  }) => ({
    text: s.placePrediction?.text?.text ?? "",
    main: s.placePrediction?.structuredFormat?.mainText?.text ?? "",
    secondary: s.placePrediction?.structuredFormat?.secondaryText?.text ?? "",
  }));

  return NextResponse.json({ suggestions });
}
