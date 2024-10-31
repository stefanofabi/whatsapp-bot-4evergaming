import mysql.connector
import os

# Primary database connection details from environment variables for security
host_db = os.getenv('DB_WHMCS_HOST')
name_db = os.getenv('DB_WHMCS_NAME')
user_db = os.getenv('DB_WHMCS_USER')
pass_db = os.getenv('DB_WHMCS_PASS')

# Validate primary database connection details
if not host_db or not name_db or not user_db or not pass_db:
    print("Error: Missing primary database connection details")
    exit("The application will close.")

# Establish connection to the primary database
try:
    db = mysql.connector.connect(
        host=host_db,
        user=user_db,
        password=pass_db,
        database=name_db
    )
    print("Connected to the primary database successfully.")
except mysql.connector.Error as err:
    print(f"Error: {err}")
    exit("The application will close.")

# Secondary database (WhatsApp) connection details from environment variables
host_db_whatsapp = os.getenv('DB_WHATSAPP_HOST')
name_db_whatsapp = os.getenv('DB_WHATSAPP_NAME')
user_db_whatsapp = os.getenv('DB_WHATSAPP_USER')
pass_db_whatsapp = os.getenv('DB_WHATSAPP_PASS')

# Validate secondary database connection details
if not host_db_whatsapp or not name_db_whatsapp or not user_db_whatsapp or not pass_db_whatsapp:
    print("Error: Missing secondary database connection details")
    exit("The application will close.")

# Establish connection to the secondary database (WhatsApp)
try:
    db_whatsapp = mysql.connector.connect(
        host=host_db_whatsapp,
        user=user_db_whatsapp,
        password=pass_db_whatsapp,
        database=name_db_whatsapp
    )
    print("Connected to the WhatsApp database successfully.")
except mysql.connector.Error as err:
    print(f"Error: {err}")
    exit("The application will close.")

# Constants
GRUPO_DEBITO_AUTOMATICO = 1

CURRENCY_CODES = {
    "1": "USD",
    "2": "ARS",
    "3": "CLP",
    "4": "URU",
    "5": "BRL",
    "6": "PYG",
    "7": "EUR",
}
