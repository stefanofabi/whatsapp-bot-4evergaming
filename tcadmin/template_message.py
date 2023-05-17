# Nombre: {firstName}
# Apellido: {lastName}
# Telefono: {phone}
# Ultimo Inicio de sesion: {lastlogin}
# Ultima IP: {ip}
# Nombre de usuario: {username}

user_login = "Hola *{firstName}* 👋 Detecté un nuevo inicio de sesión en el panel TCAdmin 🚨\n\n*Usuario:* {username} \n*Fecha:* {lastlogin}\n*IP:* {ip}\n\nSi no fuiste vos comunicate inmediatamente con nosotros! tu cuenta puede estar en peligro 😵"
last_activity = "Hola *{firstName}* 👋 Te informo sobre nueva actividad en tu cuenta TCAdmin 🚨🚨\n {tasks} \n\nSi no fuiste vos comunicate inmediatamente con nosotros! tu cuenta puede estar en peligro 😵"
server_started = "Hola *{firstName}* 👋 Quiero comunicarte que detecte un nuevo inicio del servidor: \n\n*ID:* {service_id}\n*IP:* {ip_address}:{game_port}\n*Nombre*: {server_name}\n*Último inicio:* {start_time}\n\nSi este mensaje se repite es posible que el servidor haya fallado. \nSaludos!"