CREATE SERVICE CUSTOMER_360_DB.ANALYTICS.CUSTOMER_360_SERVICE
  IN COMPUTE POOL CUSTOMER_360_POOL
  FROM SPECIFICATION $$
spec:
  containers:
  - name: customer360
    image: /customer_360_db/analytics/customer_360_repo/customer360:latest
    env:
      SNOWFLAKE_CONNECTION_NAME: pm
    readinessProbe:
      port: 8080
      path: /
  endpoints:
  - name: app
    port: 8080
    public: true
$$
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1
  AUTO_SUSPEND_SECS = 0;
