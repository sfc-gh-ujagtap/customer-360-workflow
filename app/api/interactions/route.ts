import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  try {
    let sql = `
      SELECT 
        INTERACTION_ID, CUSTOMER_ID, INTERACTION_DATE, INTERACTION_TYPE,
        CHANNEL, SENTIMENT, RESOLUTION_TIME_MINUTES
      FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS
    `;

    if (customerId) {
      sql += ` WHERE CUSTOMER_ID = ${customerId}`;
    }

    sql += ` ORDER BY INTERACTION_DATE DESC LIMIT 50`;

    const results = await query(sql);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, type, channel, sentiment, resolutionTime } = body;

    const maxIdResult = await query<{ MAX_ID: number }>("SELECT COALESCE(MAX(INTERACTION_ID), 0) + 1 AS MAX_ID FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS");
    const newId = maxIdResult[0]?.MAX_ID || 1;

    await query(`
      INSERT INTO CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS 
      (INTERACTION_ID, CUSTOMER_ID, INTERACTION_DATE, INTERACTION_TYPE, CHANNEL, SENTIMENT, RESOLUTION_TIME_MINUTES)
      VALUES (${newId}, ${customerId}, CURRENT_DATE(), '${type}', '${channel}', '${sentiment}', ${resolutionTime})
    `);

    return NextResponse.json({ success: true, interactionId: newId });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to add interaction" }, { status: 500 });
  }
}
