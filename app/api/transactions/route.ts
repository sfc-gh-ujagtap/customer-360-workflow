import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  try {
    let sql = `
      SELECT 
        t.TRANSACTION_ID, t.CUSTOMER_ID, t.PRODUCT_ID, t.TRANSACTION_DATE,
        t.QUANTITY, t.UNIT_PRICE, t.DISCOUNT, t.TOTAL_AMOUNT, t.PAYMENT_METHOD,
        p.PRODUCT_NAME, p.CATEGORY
      FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS t
      LEFT JOIN CUSTOMER_360_DB.ANALYTICS.PRODUCTS p ON t.PRODUCT_ID = p.PRODUCT_ID
    `;

    if (customerId) {
      sql += ` WHERE t.CUSTOMER_ID = ${customerId}`;
    }

    sql += ` ORDER BY t.TRANSACTION_DATE DESC LIMIT 50`;

    const results = await query(sql);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, productName, category, quantity, unitPrice, paymentMethod } = body;

    const maxTxnResult = await query<{ MAX_ID: number }>("SELECT COALESCE(MAX(TRANSACTION_ID), 0) + 1 AS MAX_ID FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS");
    const newTxnId = maxTxnResult[0]?.MAX_ID || 1;

    const maxProdResult = await query<{ MAX_ID: number }>("SELECT COALESCE(MAX(PRODUCT_ID), 0) + 1 AS MAX_ID FROM CUSTOMER_360_DB.ANALYTICS.PRODUCTS");
    const newProdId = maxProdResult[0]?.MAX_ID || 1;

    await query(`
      INSERT INTO CUSTOMER_360_DB.ANALYTICS.PRODUCTS (PRODUCT_ID, PRODUCT_NAME, CATEGORY, PRICE)
      VALUES (${newProdId}, '${productName}', '${category}', ${unitPrice})
    `);

    const totalAmount = quantity * unitPrice;
    await query(`
      INSERT INTO CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS 
      (TRANSACTION_ID, CUSTOMER_ID, PRODUCT_ID, TRANSACTION_DATE, QUANTITY, UNIT_PRICE, DISCOUNT, TOTAL_AMOUNT, PAYMENT_METHOD)
      VALUES (${newTxnId}, ${customerId}, ${newProdId}, CURRENT_DATE(), ${quantity}, ${unitPrice}, 0, ${totalAmount}, '${paymentMethod}')
    `);

    await query(`
      UPDATE CUSTOMER_360_DB.ANALYTICS.CUSTOMERS 
      SET TOTAL_ORDERS = TOTAL_ORDERS + 1, 
          TOTAL_LIFETIME_VALUE = TOTAL_LIFETIME_VALUE + ${totalAmount},
          LAST_ORDER_DATE = CURRENT_DATE()
      WHERE CUSTOMER_ID = ${customerId}
    `);

    return NextResponse.json({ success: true, transactionId: newTxnId });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}
