# Nombre: {firstName}
# Apellido: {lastName}
# Telefono: {phone}
# Ultimo Inicio de sesion: {lastlogin}
# Ultima IP: {ip}
# Nombre de usuario: {username}

user_login = """🤖 Nuevo inicio de sesión en el panel TCAdmin

*Usuario:* {username} 
*Fecha:* {lastlogin}
*IP:* {ip}
"""

last_activity = """🤖 Nueva actividad en TCAdmin 

{tasks}
"""

server_started = """🤖 Nuevo inicio del servidor

*IP:* {ip_address}:{game_port}
*Nombre:* {server_name}
*Último inicio:* {start_time}
"""