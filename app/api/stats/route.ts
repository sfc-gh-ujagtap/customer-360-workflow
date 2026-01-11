import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let dateFilter = "";
    if (from && to) {
      dateFilter = `WHERE REGISTRATION_DATE BETWEEN '${from}' AND '${to}'`;
    }

    let txnDateFilter = "";
    if (from && to) {
      txnDateFilter = `WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}'`;
    }

    let intDateFilter = "";
    if (from && to) {
      intDateFilter = `WHERE INTERACTION_DATE BETWEEN '${from}' AND '${to}'`;
    }

    const [customers, transactions, interactions, segments, sentiment] = await Promise.all([
      query(`SELECT COUNT(*) as COUNT FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS ${dateFilter}`),
      query(`SELECT COUNT(*) as COUNT, COALESCE(SUM(TOTAL_AMOUNT), 0) as TOTAL_REVENUE FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS ${txnDateFilter}`),
      query(`SELECT COUNT(*) as COUNT FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS ${intDateFilter}`),
      query(`SELECT CUSTOMER_SEGMENT, COUNT(*) as COUNT FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS ${dateFilter} GROUP BY CUSTOMER_SEGMENT`),
      query(`SELECT SENTIMENT, COUNT(*) as COUNT FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS ${intDateFilter} GROUP BY SENTIMENT`),
    ]);

    return NextResponse.json({
      totalCustomers: (customers as Array<{COUNT: number}>)[0]?.COUNT || 0,
      totalTransactions: (transactions as Array<{COUNT: number, TOTAL_REVENUE: number}>)[0]?.COUNT || 0,
      totalRevenue: (transactions as Array<{COUNT: number, TOTAL_REVENUE: number}>)[0]?.TOTAL_REVENUE || 0,
      totalInteractions: (interactions as Array<{COUNT: number}>)[0]?.COUNT || 0,
      segments,
      sentiment,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
