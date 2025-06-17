// Global event listener for the F1 key
document.addEventListener('keydown', function(event) {
    // Check if the pressed key is F1
    if (event.key === 'F1') {
        // Prevent the default browser action (e.g., opening the browser's help)
        event.preventDefault();
        // Redirect to the Help Page
        window.location.href = '/faq.html'; 
    }
});
