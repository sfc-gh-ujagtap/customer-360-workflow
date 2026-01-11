import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment");
  const search = searchParams.get("search");

  try {
    let sql = `
      SELECT 
        CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE,
        REGISTRATION_DATE, COUNTRY, CITY, CUSTOMER_SEGMENT,
        TOTAL_LIFETIME_VALUE, TOTAL_ORDERS, LAST_ORDER_DATE
      FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS
      WHERE 1=1
    `;

    if (segment && segment !== "all") {
      sql += ` AND CUSTOMER_SEGMENT = '${segment}'`;
    }

    if (search) {
      sql += ` AND (LOWER(FIRST_NAME) LIKE '%${search.toLowerCase()}%' OR LOWER(LAST_NAME) LIKE '%${search.toLowerCase()}%' OR LOWER(EMAIL) LIKE '%${search.toLowerCase()}%')`;
    }

    sql += ` ORDER BY TOTAL_LIFETIME_VALUE DESC LIMIT 100`;

    const results = await query(sql);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, country, city, segment } = body;

    const maxIdResult = await query<{ MAX_ID: number }>("SELECT COALESCE(MAX(CUSTOMER_ID), 0) + 1 AS MAX_ID FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS");
    const newId = maxIdResult[0]?.MAX_ID || 1;

    const sql = `
      INSERT INTO CUSTOMER_360_DB.ANALYTICS.CUSTOMERS 
      (CUSTOMER_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, REGISTRATION_DATE, COUNTRY, CITY, CUSTOMER_SEGMENT, TOTAL_LIFETIME_VALUE, TOTAL_ORDERS, LAST_ORDER_DATE)
      VALUES (${newId}, '${firstName}', '${lastName}', '${email}', '${phone}', CURRENT_DATE(), '${country}', '${city}', '${segment}', 0, 0, CURRENT_DATE())
    `;

    await query(sql);
    return NextResponse.json({ success: true, customerId: newId });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to add customer" }, { status: 500 });
  }
}
