// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);  // Usamos 'es-ES' para obtener el mes en español
}

module.exports = { formatDate };
