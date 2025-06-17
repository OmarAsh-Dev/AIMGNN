// auth.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Logout script loaded");

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            console.log("Logout clicked");

            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout failed:', error.message);
            } else {
                console.log("Logged out successfully");
                window.location.href = 'login.html';
            }
        });
    }
});
