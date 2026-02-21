import { NextRequest, NextResponse } from "next/server";
import { getManagedStocks, addStock } from "@/lib/stocks/managed-stocks";

export async function GET() {
  const stocks = await getManagedStocks();
  return NextResponse.json({ success: true, stocks });
}

export async function POST(request: NextRequest) {
  let body: { symbol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }

  const { symbol } = body;
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json(
      { success: false, error: "심볼을 입력해주세요" },
      { status: 400 }
    );
  }

  const result = await addStock(symbol);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, stock: result.stock });
}
