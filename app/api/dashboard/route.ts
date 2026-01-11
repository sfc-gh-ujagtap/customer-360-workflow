import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "2020-01-01";
    const to = searchParams.get("to") || "2025-12-31";

    const [
      stats,
      revenueByMonth,
      revenueByCategory,
      paymentMethods,
      customersByCountry,
      monthlyCustomers,
    ] = await Promise.all([
      query(`
        SELECT 
          (SELECT COUNT(*) FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS WHERE REGISTRATION_DATE BETWEEN '${from}' AND '${to}') as TOTAL_CUSTOMERS,
          (SELECT COALESCE(SUM(TOTAL_AMOUNT), 0) FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}') as TOTAL_REVENUE,
          (SELECT COUNT(*) FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}') as TOTAL_ORDERS,
          (SELECT COUNT(*) FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMER_INTERACTIONS WHERE INTERACTION_DATE BETWEEN '${from}' AND '${to}') as TOTAL_INTERACTIONS,
          (SELECT AVG(TOTAL_AMOUNT) FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}') as AVG_ORDER_VALUE
      `),
      query(`
        SELECT 
          TO_CHAR(TRANSACTION_DATE, 'YYYY-MM') as MONTH,
          SUM(TOTAL_AMOUNT) as REVENUE,
          COUNT(*) as ORDERS
        FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS
        WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}'
        GROUP BY TO_CHAR(TRANSACTION_DATE, 'YYYY-MM')
        ORDER BY MONTH
      `),
      query(`
        SELECT 
          p.CATEGORY,
          SUM(t.TOTAL_AMOUNT) as REVENUE
        FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS t
        JOIN CUSTOMER_360_DB.ANALYTICS.PRODUCTS p ON t.PRODUCT_ID = p.PRODUCT_ID
        WHERE t.TRANSACTION_DATE BETWEEN '${from}' AND '${to}'
        GROUP BY p.CATEGORY
        ORDER BY REVENUE DESC
      `),
      query(`
        SELECT 
          PAYMENT_METHOD,
          COUNT(*) as COUNT,
          SUM(TOTAL_AMOUNT) as REVENUE
        FROM CUSTOMER_360_DB.ANALYTICS.TRANSACTIONS
        WHERE TRANSACTION_DATE BETWEEN '${from}' AND '${to}'
        GROUP BY PAYMENT_METHOD
      `),
      query(`
        SELECT 
          COUNTRY,
          COUNT(*) as COUNT,
          SUM(TOTAL_LIFETIME_VALUE) as TOTAL_VALUE
        FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS
        WHERE REGISTRATION_DATE BETWEEN '${from}' AND '${to}'
        GROUP BY COUNTRY
        ORDER BY COUNT DESC
        LIMIT 10
      `),
      query(`
        SELECT 
          TO_CHAR(REGISTRATION_DATE, 'YYYY-MM') as MONTH,
          COUNT(*) as NEW_CUSTOMERS
        FROM CUSTOMER_360_DB.ANALYTICS.CUSTOMERS
        WHERE REGISTRATION_DATE BETWEEN '${from}' AND '${to}'
        GROUP BY TO_CHAR(REGISTRATION_DATE, 'YYYY-MM')
        ORDER BY MONTH
      `),
    ]);

    return NextResponse.json({
      stats: (stats as Array<Record<string, number>>)[0] || {},
      revenueByMonth,
      revenueByCategory,
      paymentMethods,
      customersByCountry,
      monthlyCustomers,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
