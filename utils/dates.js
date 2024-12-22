// Function to format date
function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    
    // Si includeTime es true, agregamos las opciones de hora y minuto (sin segundos)
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleDateString('es-ES', options);  // Usamos 'es-ES' para obtener el mes en español
}

module.exports = { formatDate };
