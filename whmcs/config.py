import mysql.connector
import json
import os

# Load the configuration from config.json
config_file_path = os.path.join(os.path.dirname(__file__), '../config.json')

try:
    with open(config_file_path, 'r') as config_file:
        config = json.load(config_file)
except FileNotFoundError:
    print("Error: config.json file not found.")
    exit("The application will close.")
except json.JSONDecodeError:
    print("Error: Could not read config.json correctly.")
    exit("The application will close.")

# Get connection details for the WHMCS database
whmcs_config = config['databases']['whmcs']
host_db = whmcs_config['host']
name_db = whmcs_config['database']
user_db = whmcs_config['user']
pass_db = whmcs_config['password']

# Validate connection details for the primary database
if not host_db or not name_db or not user_db or not pass_db:
    print("Error: Missing primary database connection details.")
    exit("The application will close.")

# Establish connection to the primary database
try:
    db = mysql.connector.connect(
        host=host_db,
        user=user_db,
        password=pass_db,
        database=name_db
    )
    print("Successfully connected to the primary database.")
except mysql.connector.Error as err:
    print(f"Error: {err}")
    exit("The application will close.")

# Get connection details for the WhatsApp database
whatsapp_config = config['databases']['whatsapp']
host_db_whatsapp = whatsapp_config['host']
name_db_whatsapp = whatsapp_config['database']
user_db_whatsapp = whatsapp_config['user']
pass_db_whatsapp = whatsapp_config['password']

# Validate connection details for the secondary database
if not host_db_whatsapp or not name_db_whatsapp or not user_db_whatsapp or not pass_db_whatsapp:
    print("Error: Missing secondary database connection details.")
    exit("The application will close.")

# Establish connection to the secondary database (WhatsApp)
try:
    db_whatsapp = mysql.connector.connect(
        host=host_db_whatsapp,
        user=user_db_whatsapp,
        password=pass_db_whatsapp,
        database=name_db_whatsapp
    )
    print("Successfully connected to the WhatsApp database.")
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