import mysql.connector

host_db = ''
name_db = ''
user_db = ''
pass_db = ''

if not host_db or not name_db or not user_db:
  print("Error: faltan datos de conexión")
  exit("La aplicación se cerrará.")

api_endpoint = 'http://127.0.0.1:8080'

api_token = '';

if not api_token:
  print("Error: debe ingresar el token de acceso")
  exit("La aplicación se cerrará.")

db = mysql.connector.connect(
  host = host_db,
  user = user_db,
  password = pass_db,
  database = name_db
)
