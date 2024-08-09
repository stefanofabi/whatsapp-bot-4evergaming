# Nombre: {firstName}
# Apellido: {lastName}
# Telefono: {phone}
# Ultimo Inicio de sesion: {lastlogin}
# Ultima IP: {ip}
# Nombre de usuario: {username}

user_login = """
🤖 Nuevo inicio de sesión en el panel TCAdmin 🚨\n\n

*Usuario:* {username} \n
*Fecha:* {lastlogin}\n
*IP:* {ip}
"""

last_activity = """
🤖 Nueva actividad en TCAdmin \n

{tasks}
"""

server_started = """
🤖 Nuevo inicio del servidor \n\n

*IP:* {ip_address}:{game_port}\n
*Nombre:* {server_name}\n
*Último inicio:* {start_time}
"""