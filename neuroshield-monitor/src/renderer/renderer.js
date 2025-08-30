// Core modules
const { ipcRenderer } = require('electron');

// DOM Elements
const app = document.getElementById('app');
const mainContent = document.getElementById('main-content');
const loading = document.getElementById('loading');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarToggle = document.getElementById('sidebar-toggle');

// State
let currentRoute = 'dashboard';
let isSidebarOpen = true;

// Initialize the application
async function init() {
  try {
    setupEventListeners();
    loadRoute(currentRoute);
    loading.classList.add('hidden');
    updateAppVersion();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showError('Failed to initialize application');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.getAttribute('data-route');
      if (route) loadRoute(route);
    });
  });

  // Toggle sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }

  // Window controls
  document.getElementById('minimize-btn')?.addEventListener('click', () => window.api.minimize());
  document.getElementById('maximize-btn')?.addEventListener('click', () => window.api.maximize());
  document.getElementById('close-btn')?.addEventListener('click', () => window.api.close());
}

// Toggle sidebar
function toggleSidebar() {
  isSidebarOpen = !isSidebarOpen;
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    sidebar.classList.toggle('-translate-x-full', !isSidebarOpen);
    sidebar.classList.toggle('md:translate-x-0', isSidebarOpen);
  }
}

// Load route
async function loadRoute(route) {
  try {
    currentRoute = route;
    updateActiveNav(route);
    updatePageTitle(route);
    
    mainContent.innerHTML = '';
    loading.classList.remove('hidden');
    
    let content = await getRouteContent(route);
    mainContent.innerHTML = content;
    
  } catch (error) {
    console.error(`Error loading route ${route}:`, error);
    showError(`Failed to load ${route}`);
  } finally {
    loading.classList.add('hidden');
  }
}

// Get route content
async function getRouteContent(route) {
  const routes = {
    'dashboard': `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-6">Dashboard</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Dashboard content will be loaded here -->
        </div>
      </div>
    `,
    'monitoring': `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-6">Monitoring</h2>
        <!-- Monitoring content will be loaded here -->
      </div>
    `,
    'alerts': `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-6">Alerts</h2>
        <!-- Alerts content will be loaded here -->
      </div>
    `,
    'settings': `
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-6">Settings</h2>
        <!-- Settings content will be loaded here -->
      </div>
    `
  };
  
  return routes[route] || '<div class="p-6">Page not found</div>';
}

// Update active navigation
function updateActiveNav(route) {
  navLinks.forEach(link => {
    if (link.getAttribute('data-route') === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Update page title
function updatePageTitle(route) {
  const titles = {
    'dashboard': 'Dashboard',
    'monitoring': 'Monitoring',
    'alerts': 'Alerts',
    'settings': 'Settings'
  };
  pageTitle.textContent = titles[route] || 'NeuroShield';
}

// Update app version
async function updateAppVersion() {
  try {
    const version = await window.api.getAppVersion();
    if (version) {
      document.getElementById('app-version').textContent = version;
    }
  } catch (error) {
    console.error('Error getting app version:', error);
  }
}

// Show error message
function showError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
  errorEl.role = 'alert';
  errorEl.innerHTML = `
    <strong class="font-bold">Error: </strong>
    <span class="block sm:inline">${message}</span>
    <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <title>Close</title>
        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
      </svg>
    </span>
  `;
  
  // Add close button handler
  const closeBtn = errorEl.querySelector('svg');
  closeBtn.addEventListener('click', () => {
    errorEl.remove();
  });
  
  // Add to DOM
  document.body.prepend(errorEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorEl.remove();
  }, 5000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
