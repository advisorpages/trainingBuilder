// Debug script to clear authentication data
// Open browser console and run this code if needed

console.log('Current auth state:');
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('refreshToken:', localStorage.getItem('refreshToken'));
console.log('user:', localStorage.getItem('user'));

// Clear all auth data
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');

console.log('Auth data cleared. Refreshing page...');
window.location.reload();