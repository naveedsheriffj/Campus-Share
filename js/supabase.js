// ============================================
// SUPABASE CONFIGURATION
// ============================================

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://oxdidpnlnvzblvjtxygh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZGlkcG5sbnZ6Ymx2anR4eWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjM5MDgsImV4cCI6MjEwMjE5OTkwOH0.BaRQn-aIRiHnF6YhDjLlXC8oPq4JyGtiFhP3XEpg02Q';

// College email domain configuration
const COLLEGE_EMAIL_DOMAIN = 'rajalakshmi.edu.in'; // Change this to your college domain

// Initialize Supabase client
window.supabaseClient = null;
window.COLLEGE_EMAIL_DOMAIN = COLLEGE_EMAIL_DOMAIN;

function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
    } else {
        console.error('Supabase library not loaded. Please check the CDN script.');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}
