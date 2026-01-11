import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phone, country, city, segment } = body;

    const sql = `
      UPDATE CUSTOMER_360_DB.ANALYTICS.CUSTOMERS 
      SET FIRST_NAME = '${firstName}', LAST_NAME = '${lastName}', EMAIL = '${email}', 
          PHONE = '${phone}', COUNTRY = '${country}', CITY = '${city}', CUSTOMER_SEGMENT = '${segment}'
      WHERE CUSTOMER_ID = ${id}
    `;

    await query(sql);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await query(`DELETE FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS WHERE CUSTOMER_ID = ${id}`);
    await query(`DELETE FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS WHERE CUSTOMER_ID = ${id}`);
    await query(`DELETE FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS WHERE CUSTOMER_ID = ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
