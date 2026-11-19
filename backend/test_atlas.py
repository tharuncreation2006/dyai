from database import check_database_connection

try:
    check_database_connection()
    print("Atlas connection successful!")
except Exception as e:
    print("Atlas connection failed:", e)