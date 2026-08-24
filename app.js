/* ===== AMRITA STUDENT CLUBS PORTAL - APP.JS ===== */

// ===== CONSTANTS =====
const ADMIN_USERS = {
    'soorya': { password: 'Admin@1', role: 'a1' },
    'maom': { password: 'admin2', role: 'a2' }
};

const CATEGORIES = {
    tech: { name: 'Tech & Innovation', icon: 'fas fa-microchip' },
    ai: { name: 'AI & Robotics', icon: 'fas fa-robot' },
    coding: { name: 'Coding & Dev', icon: 'fas fa-code' },
    science: { name: 'Science & Research', icon: 'fas fa-flask' },
    arts: { name: 'Arts & Design', icon: 'fas fa-palette' },
    music: { name: 'Music & Performance', icon: 'fas fa-music' },
    cultural: { name: 'Cultural', icon: 'fas fa-theater-masks' },
    sports: { name: 'Sports & Wellness', icon: 'fas fa-futbol' },
    media: { name: 'Media & Publications', icon: 'fas fa-newspaper' },
    community: { name: 'Community Service', icon: 'fas fa-hands-helping' },
    literary: { name: 'Literary & Debate', icon: 'fas fa-book-open' },
    entrepreneurship: { name: 'Entrepreneurship', icon: 'fas fa-lightbulb' }
};

const MAX_ACHIEVEMENTS = 15;

// ===== STATE =====
let clubs = [];
let currentAdmin = null; // null, 'a1', 'a2', or 'sub'
let subAdminClubId = null; // club ID for sub-admin access
let currentFilter = 'all';
let currentSearch = '';
let deleteTargetId = null;
let tempLogo = null;
let tempAchievements = new Array(MAX_ACHIEVEMENTS).fill(null);

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadClubs();
        generateAchievementSlots();
        handleRoute();
        setupScrollListener();
        window.addEventListener('hashchange', handleRoute);

        // Close mobile nav on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('nav-links').classList.remove('open');
            });
        });
    } catch (err) {
        console.error('Initialization error:', err);
    }
});

function loadClubs() {
    const stored = localStorage.getItem('amrita_clubs');
    if (stored) {
        clubs = JSON.parse(stored);
    } else {
        clubs = getSeedClubs();
        saveClubs();
    }
    updateStats();
}

function saveClubs() {
    localStorage.setItem('amrita_clubs', JSON.stringify(clubs));
    updateStats();
}

function updateStats() {
    const statEl = document.getElementById('stat-clubs');
    if (statEl) statEl.textContent = clubs.length;

    // Update category counts
    const counts = { all: clubs.length };
    Object.keys(CATEGORIES).forEach(cat => {
        counts[cat] = clubs.filter(c => c.category === cat).length;
    });
    Object.keys(counts).forEach(cat => {
        const el = document.getElementById(`cat-count-${cat}`);
        if (el) el.textContent = counts[cat];
    });
}

// ===== ROUTING =====
function handleRoute() {
    const hash = window.location.hash || '#home';
    const parts = hash.split('/');
    const route = parts[0];

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    if (route === '#club' && parts[1]) {
        showClubDetail(parts[1]);
    } else if (route === '#admin') {
        if (!currentAdmin) {
            openLoginModal();
            showView('home');
            renderClubsGrid();
        } else {
            showView('admin');
            renderAdminTable();
        }
    } else if (route === '#contact') {
        showView('contact');
    } else if (route === '#clubs') {
        showView('home');
        currentFilter = 'all';
        renderClubsGrid();
        // Scroll past hero to clubs section
        setTimeout(() => {
            const clubsSection = document.querySelector('.clubs-section');
            if (clubsSection) clubsSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        showView('home');
        renderClubsGrid();
    }
}

function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const view = document.getElementById(`view-${name}`);
    if (view) view.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-nav') === name || (name === 'home' && l.getAttribute('data-nav') === 'clubs')) {
            // activate based on view
        }
    });

    const navMap = {
        home: 'home',
        admin: 'admin',
        contact: 'contact'
    };
    const navKey = navMap[name];
    if (navKey) {
        const link = document.querySelector(`.nav-link[data-nav="${navKey}"]`);
        if (link) link.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== NAVBAR =====
function setupScrollListener() {
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function toggleMobileNav() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('open');
}

// Mobile nav close handlers are now inside DOMContentLoaded above

// ===== AUTH =====
function openLoginModal() {
    document.getElementById('login-modal').classList.add('show');
    const uInput = document.getElementById('login-username');
    if (uInput) uInput.value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
    if (uInput) uInput.focus();
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('show');
}

function getSubAdminPassword(club) {
    const categoryObj = CATEGORIES[club.category];
    const categoryName = categoryObj ? categoryObj.name : club.category;
    
    const clubPart = club.name.replace(/\s+/g, '').toLowerCase();
    const formattedClub = clubPart.charAt(0).toUpperCase() + clubPart.slice(1);
    const formattedCategory = categoryName.replace(/\s+/g, '').toLowerCase();
    
    return `${formattedClub}@${formattedCategory}`;
}

function checkSubAdminPassword(club, inputPassword) {
    const primary = getSubAdminPassword(club);
    
    const clubPart = club.name.replace(/\s+/g, '').toLowerCase();
    const formattedClub = clubPart.charAt(0).toUpperCase() + clubPart.slice(1);
    const keyFallback = `${formattedClub}@${club.category.toLowerCase()}`;
    
    const categoryObj = CATEGORIES[club.category];
    const categoryName = categoryObj ? categoryObj.name : club.category;
    const cleanCategory = categoryName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanFallback = `${formattedClub}@${cleanCategory}`;

    return inputPassword === primary || inputPassword === keyFallback || inputPassword === cleanFallback;
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const lowerUser = username.toLowerCase();
    const adminAccount = ADMIN_USERS[lowerUser];

    if (adminAccount && adminAccount.password === password) {
        currentAdmin = adminAccount.role;
        subAdminClubId = null;
        closeLoginModal();
        updateAuthUI();
        showToast(`Logged in as ${currentAdmin === 'a1' ? 'Super Admin (soorya)' : 'Club Manager (MAOM)'}`, 'success');
        window.location.hash = '#admin';
        return;
    }

    // Check sub-admin credentials: username matches club name (flexible on case & spaces)
    const matchedClub = clubs.find(c => {
        const cNameLower = c.name.trim().toLowerCase();
        const cNameNoSpaces = c.name.replace(/\s+/g, '').toLowerCase();
        const uLower = username.toLowerCase();
        const uNoSpaces = username.replace(/\s+/g, '').toLowerCase();

        const nameMatches = (uLower === cNameLower || uNoSpaces === cNameNoSpaces);
        return nameMatches && checkSubAdminPassword(c, password);
    });

    if (matchedClub) {
        currentAdmin = 'sub';
        subAdminClubId = matchedClub.id;
        closeLoginModal();
        updateAuthUI();
        showToast(`Logged in as Sub-Admin for ${matchedClub.name}`, 'success');
        window.location.hash = '#admin';
    } else {
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('login-password').value = '';
        const uInput = document.getElementById('login-username');
        if (uInput) uInput.focus();
    }
}

function logout() {
    currentAdmin = null;
    subAdminClubId = null;
    updateAuthUI();
    showToast('Logged out successfully', 'info');
    window.location.hash = '#home';
}

function updateAuthUI() {
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');

    if (currentAdmin) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('login-password');
    const icon = document.querySelector('.toggle-password i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ===== SEARCH & FILTER =====
function handleSearch(query) {
    currentSearch = query.toLowerCase().trim();
    renderClubsGrid();
}

function filterByCategory(category) {
    currentFilter = category;

    // Update UI
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-category') === category) {
            card.classList.add('active');
        }
    });

    // Update section title
    const titleEl = document.getElementById('clubs-section-title');
    const subtitleEl = document.getElementById('clubs-section-subtitle');
    if (category === 'all') {
        titleEl.textContent = 'Featured Clubs';
        subtitleEl.textContent = 'Discover our most popular student organizations';
    } else {
        const cat = CATEGORIES[category];
        titleEl.textContent = cat ? cat.name : category;
        subtitleEl.textContent = `Showing all clubs in ${cat ? cat.name : category}`;
    }

    renderClubsGrid();
}

function getFilteredClubs() {
    let filtered = [...clubs];

    if (currentFilter !== 'all') {
        filtered = filtered.filter(c => c.category === currentFilter);
    }

    if (currentSearch) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(currentSearch) ||
            c.clubHead.toLowerCase().includes(currentSearch) ||
            c.mission.toLowerCase().includes(currentSearch) ||
            (CATEGORIES[c.category]?.name || '').toLowerCase().includes(currentSearch)
        );
    }

    return filtered;
}

// ===== RENDER CLUBS GRID =====
function renderClubsGrid() {
    const grid = document.getElementById('clubs-grid');
    const noResults = document.getElementById('no-results');
    const filtered = getFilteredClubs();

    if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    grid.innerHTML = filtered.map((club, index) => {
        const cat = CATEGORIES[club.category] || { name: club.category, icon: 'fas fa-circle' };
        const logoHTML = club.logo
            ? `<img src="${club.logo}" alt="${club.name} logo">`
            : `<div class="logo-placeholder"><i class="${cat.icon}"></i></div>`;

        return `
            <div class="club-card animate-in" style="animation-delay: ${index * 0.06}s" onclick="navigateToClub('${club.id}')">
                <div class="club-card-logo">
                    ${logoHTML}
                </div>
                <div class="club-card-body">
                    <div class="club-card-category">
                        <i class="${cat.icon}"></i> ${cat.name}
                    </div>
                    <div class="club-card-name">${escapeHTML(club.name)}</div>
                    <div class="club-card-head">
                        <i class="fas fa-user-tie"></i> ${escapeHTML(club.clubHead)}
                    </div>
                    <div class="club-card-footer">
                        <div class="club-card-contact">
                            <i class="fas fa-phone"></i> ${escapeHTML(club.contact)}
                        </div>
                        <div class="club-card-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function navigateToClub(id) {
    window.location.hash = `#club/${id}`;
}

// ===== CLUB DETAIL =====
function showClubDetail(id) {
    const club = clubs.find(c => c.id === id);
    if (!club) {
        showToast('Club not found', 'error');
        window.location.hash = '#home';
        return;
    }

    const container = document.getElementById('club-detail-content');
    const cat = CATEGORIES[club.category] || { name: club.category, icon: 'fas fa-circle' };

    const logoHTML = club.logo
        ? `<img src="${club.logo}" alt="${club.name}">`
        : `<div class="logo-placeholder"><i class="${cat.icon}"></i></div>`;

    let achievementsHTML = '';
    if (club.achievements && club.achievements.some(a => a && a.image)) {
        achievementsHTML = `
            <div class="detail-full-card">
                <h3><i class="fas fa-trophy"></i> Achievements</h3>
                <div class="achievements-gallery">
                    ${club.achievements.filter(a => a && a.image).map(a => `
                        <div class="achievement-card">
                            <img src="${a.image}" alt="${escapeHTML(a.caption || 'Achievement')}">
                            ${a.caption ? `<div class="ach-caption">${escapeHTML(a.caption)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="club-detail-hero">
            <div class="shape"></div>
            <div class="shape"></div>
            <div class="club-detail-nav">
                <button class="back-btn" onclick="window.location.hash='#home'">
                    <i class="fas fa-arrow-left"></i> Back to Clubs
                </button>
            </div>
            <div class="club-detail-header">
                <div class="club-detail-logo">${logoHTML}</div>
                <div class="club-detail-info">
                    <h1>${escapeHTML(club.name)}</h1>
                    <div class="club-detail-meta">
                        <span class="detail-category-badge">
                            <i class="${cat.icon}"></i> ${cat.name}
                        </span>
                        <span class="detail-meta-item">
                            <i class="fas fa-user-tie"></i> ${escapeHTML(club.clubHead)}
                        </span>
                        <span class="detail-meta-item">
                            <i class="fas fa-phone"></i> ${escapeHTML(club.contact)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="club-detail-body">
            <div class="detail-cards-grid">
                <div class="detail-card mission">
                    <div class="detail-card-header">
                        <div class="detail-card-icon"><i class="fas fa-bullseye"></i></div>
                        <h3>Mission</h3>
                    </div>
                    <p>${escapeHTML(club.mission)}</p>
                </div>
                <div class="detail-card vision">
                    <div class="detail-card-header">
                        <div class="detail-card-icon"><i class="fas fa-eye"></i></div>
                        <h3>Vision</h3>
                    </div>
                    <p>${escapeHTML(club.vision)}</p>
                </div>
            </div>

            ${achievementsHTML}

            <div class="detail-full-card">
                <h3><i class="fas fa-door-open"></i> How to Join</h3>
                <div class="joining-content">${escapeHTML(club.joiningProcedure)}</div>
            </div>

            <div class="detail-full-card">
                <h3><i class="fas fa-address-book"></i> Contact Information</h3>
                <div class="detail-contact-grid">
                    <div class="detail-contact-item">
                        <i class="fas fa-user-tie"></i>
                        <span><strong>Club Head:</strong> ${escapeHTML(club.clubHead)}</span>
                    </div>
                    <div class="detail-contact-item">
                        <i class="fas fa-phone-alt"></i>
                        <span><strong>Phone:</strong> ${escapeHTML(club.contact)}</span>
                    </div>
                    <div class="detail-contact-item">
                        <i class="fas fa-layer-group"></i>
                        <span><strong>Category:</strong> ${cat.name}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    showView('club');
}

// ===== ADMIN TABLE =====
function renderAdminTable(searchQuery = '') {
    const tbody = document.getElementById('admin-table-body');
    const noResults = document.getElementById('admin-no-results');
    const tableWrapper = document.querySelector('.admin-table-wrapper');
    const badge = document.getElementById('admin-role-badge');

    // Update badge
    if (currentAdmin === 'a1') {
        badge.textContent = 'Super Admin (A1)';
        badge.className = 'admin-badge';
    } else if (currentAdmin === 'a2') {
        badge.textContent = 'Club Manager (A2)';
        badge.className = 'admin-badge limited';
    } else if (currentAdmin === 'sub') {
        const subClub = clubs.find(c => c.id === subAdminClubId);
        badge.textContent = `Sub-Admin: ${subClub ? subClub.name : 'Club'}`;
        badge.className = 'admin-badge limited';
    }

    // Show/hide add button — sub-admins cannot add
    const addBtn = document.getElementById('admin-add-btn');
    if (addBtn) {
        if (currentAdmin === 'sub') {
            addBtn.classList.add('hidden');
        } else {
            addBtn.classList.remove('hidden');
        }
    }

    let filtered = [...clubs];

    // Sub-admins only see their own club
    if (currentAdmin === 'sub' && subAdminClubId) {
        filtered = filtered.filter(c => c.id === subAdminClubId);
    }

    if (searchQuery) {
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.clubHead.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        noResults.classList.remove('hidden');
        if (tableWrapper) tableWrapper.classList.add('hidden');
        return;
    }

    noResults.classList.add('hidden');
    if (tableWrapper) tableWrapper.classList.remove('hidden');

    tbody.innerHTML = filtered.map(club => {
        const cat = CATEGORIES[club.category] || { name: club.category, icon: 'fas fa-circle' };
        const logoHTML = club.logo
            ? `<img src="${club.logo}" alt="${club.name}" class="admin-table-logo">`
            : `<div class="admin-table-logo-placeholder"><i class="${cat.icon}"></i></div>`;

        const canEdit = currentAdmin === 'a1' || (currentAdmin === 'sub' && subAdminClubId === club.id);
        const canDelete = currentAdmin === 'a1';
        const editBtn = canEdit
            ? `<button class="admin-action-btn edit" title="Edit" onclick="openEditClubModal('${club.id}')"><i class="fas fa-edit"></i></button>`
            : '';
        const deleteBtn = canDelete
            ? `<button class="admin-action-btn delete" title="Delete" onclick="openDeleteModal('${club.id}')"><i class="fas fa-trash"></i></button>`
            : '';

        return `
            <tr>
                <td>${logoHTML}</td>
                <td><strong>${escapeHTML(club.name)}</strong></td>
                <td><span class="category-badge"><i class="${cat.icon}"></i> ${cat.name}</span></td>
                <td>${escapeHTML(club.clubHead)}</td>
                <td>${escapeHTML(club.contact)}</td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-action-btn view" title="View" onclick="navigateToClub('${club.id}')"><i class="fas fa-eye"></i></button>
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function handleAdminSearch(query) {
    renderAdminTable(query);
}

// ===== CLUB CRUD =====
function openAddClubModal() {
    resetClubForm();
    document.getElementById('club-modal-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Club';
    document.getElementById('club-submit-text').textContent = 'Save Club';
    document.getElementById('club-modal').classList.add('show');
}

function openEditClubModal(id) {
    const canEdit = currentAdmin === 'a1' || (currentAdmin === 'sub' && subAdminClubId === id);
    if (!canEdit) {
        showToast('You do not have permission to edit this club', 'error');
        return;
    }

    const club = clubs.find(c => c.id === id);
    if (!club) return;

    resetClubForm();

    document.getElementById('club-modal-title').innerHTML = '<i class="fas fa-edit"></i> Edit Club';
    document.getElementById('club-submit-text').textContent = 'Update Club';
    document.getElementById('club-edit-id').value = club.id;
    document.getElementById('club-name').value = club.name;
    document.getElementById('club-category').value = club.category;
    document.getElementById('club-head').value = club.clubHead;
    document.getElementById('club-contact').value = club.contact;
    document.getElementById('club-mission').value = club.mission;
    document.getElementById('club-vision').value = club.vision;
    document.getElementById('club-joining').value = club.joiningProcedure;

    // Logo
    if (club.logo) {
        tempLogo = club.logo;
        const preview = document.getElementById('logo-preview');
        preview.src = club.logo;
        preview.classList.remove('hidden');
        document.getElementById('logo-placeholder').classList.add('hidden');
    }

    // Achievements
    if (club.achievements) {
        club.achievements.forEach((ach, i) => {
            if (ach && ach.image) {
                tempAchievements[i] = ach.image;
                const preview = document.getElementById(`ach-preview-${i}`);
                preview.src = ach.image;
                preview.classList.remove('hidden');
                document.getElementById(`ach-placeholder-${i}`).classList.add('hidden');
            }
            if (ach && ach.caption) {
                document.getElementById(`ach-caption-${i}`).value = ach.caption;
            }
        });
    }

    document.getElementById('club-modal').classList.add('show');
}

function closeClubModal() {
    document.getElementById('club-modal').classList.remove('show');
    resetClubForm();
}

function resetClubForm() {
    document.getElementById('club-form').reset();
    document.getElementById('club-edit-id').value = '';
    tempLogo = null;
    tempAchievements = new Array(MAX_ACHIEVEMENTS).fill(null);

    // Reset logo preview
    document.getElementById('logo-preview').classList.add('hidden');
    document.getElementById('logo-placeholder').classList.remove('hidden');

    // Reset achievement previews
    for (let i = 0; i < MAX_ACHIEVEMENTS; i++) {
        const preview = document.getElementById(`ach-preview-${i}`);
        const placeholder = document.getElementById(`ach-placeholder-${i}`);
        if (preview) preview.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
    }
}

function handleClubSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('club-edit-id').value;
    const isEdit = !!editId;

    // Check permissions
    const canEdit = currentAdmin === 'a1' || (currentAdmin === 'sub' && subAdminClubId === editId);
    if (isEdit && !canEdit) {
        showToast('You do not have permission to edit this club', 'error');
        return;
    }
    if (!isEdit && currentAdmin === 'sub') {
        showToast('Sub-admins cannot add new clubs', 'error');
        return;
    }

    const clubData = {
        id: isEdit ? editId : generateId(),
        name: document.getElementById('club-name').value.trim(),
        category: document.getElementById('club-category').value,
        logo: tempLogo,
        clubHead: document.getElementById('club-head').value.trim(),
        contact: document.getElementById('club-contact').value.trim(),
        mission: document.getElementById('club-mission').value.trim(),
        vision: document.getElementById('club-vision').value.trim(),
        joiningProcedure: document.getElementById('club-joining').value.trim(),
        achievements: Array.from({ length: MAX_ACHIEVEMENTS }, (_, i) => ({
            image: tempAchievements[i],
            caption: document.getElementById(`ach-caption-${i}`).value.trim()
        }))
    };

    if (isEdit) {
        const index = clubs.findIndex(c => c.id === editId);
        if (index !== -1) {
            clubs[index] = clubData;
            showToast('Club updated successfully!', 'success');
        }
    } else {
        clubs.push(clubData);
        showToast('Club added successfully!', 'success');
    }

    saveClubs();
    closeClubModal();
    renderAdminTable();
    renderClubsGrid();
}

// ===== DELETE =====
function openDeleteModal(id) {
    if (currentAdmin !== 'a1') {
        showToast('You do not have permission to delete clubs', 'error');
        return;
    }

    const club = clubs.find(c => c.id === id);
    if (!club) return;

    deleteTargetId = id;
    document.getElementById('delete-club-name').textContent = club.name;
    document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
    deleteTargetId = null;
}

function confirmDelete() {
    if (!deleteTargetId || currentAdmin !== 'a1') return;

    clubs = clubs.filter(c => c.id !== deleteTargetId);
    saveClubs();
    closeDeleteModal();
    renderAdminTable();
    renderClubsGrid();
    showToast('Club deleted successfully', 'success');
}

// ===== DYNAMIC ACHIEVEMENT SLOTS =====
function generateAchievementSlots() {
    const uploadGrid = document.getElementById('achievements-upload-grid');
    const captionsGrid = document.getElementById('ach-captions-grid');
    if (!uploadGrid || !captionsGrid) return;

    let slotsHTML = '';
    let captionsHTML = '';
    for (let i = 0; i < MAX_ACHIEVEMENTS; i++) {
        slotsHTML += `
            <div class="achievement-slot" id="ach-slot-${i}" onclick="document.getElementById('ach-file-${i}').click()">
                <input type="file" id="ach-file-${i}" accept="image/*" onchange="handleAchievementUpload(event, ${i})" hidden>
                <div class="ach-placeholder" id="ach-placeholder-${i}">
                    <i class="fas fa-plus"></i>
                </div>
                <img id="ach-preview-${i}" class="ach-preview hidden" alt="Achievement ${i + 1}">
            </div>`;
        captionsHTML += `<input type="text" id="ach-caption-${i}" placeholder="Caption ${i + 1}" class="ach-caption-input">`;
    }
    uploadGrid.innerHTML = slotsHTML;
    captionsGrid.innerHTML = captionsHTML;
}

// ===== FILE UPLOADS =====
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file must be under 2MB', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        tempLogo = e.target.result;
        const preview = document.getElementById('logo-preview');
        preview.src = tempLogo;
        preview.classList.remove('hidden');
        document.getElementById('logo-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function handleAchievementUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast('Image file must be under 2MB', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        tempAchievements[index] = e.target.result;
        const preview = document.getElementById(`ach-preview-${index}`);
        preview.src = tempAchievements[index];
        preview.classList.remove('hidden');
        document.getElementById(`ach-placeholder-${index}`).classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== UTILITIES =====
function generateId() {
    return 'club_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== SEED DATA =====
function getSeedClubs() {
    return [
        {
            id: 'seed_001',
            name: 'Amrita Robotics Club',
            category: 'ai',
            logo: null,
            clubHead: 'Dr. Rajesh Kannan',
            contact: '+91 98765 43210',
            mission: 'To inspire innovation and foster practical skills in robotics. We provide a platform for students to compete, collaborate, and excel in the field of robotics and automation.',
            vision: 'To be a leading center for robotic development and a hub for tech excellence at Amrita, empowering students to shape the future of automation.',
            joiningProcedure: 'Step 1: Fill out the online application form on the club portal.\nStep 2: Attend the orientation session held at the beginning of each semester.\nStep 3: Complete a basic robotics aptitude assessment.\nStep 4: Receive your membership confirmation via email.',
            achievements: [
                { image: null, caption: 'Amrita Robotics Competition Winners 2024' },
                { image: null, caption: 'National Robotics Championship Finalists' },
                { image: null, caption: 'Best Innovation Award at TechFest' }
            ]
        },
        {
            id: 'seed_002',
            name: 'IEEE Student Branch',
            category: 'tech',
            logo: null,
            clubHead: 'Prof. Meena Srinivasan',
            contact: '+91 87654 32109',
            mission: 'To advance technology for humanity by connecting students with IEEE global resources, professional development opportunities, and cutting-edge technical knowledge.',
            vision: 'To be the most active and innovative IEEE student branch in South India, fostering a community of future tech leaders.',
            joiningProcedure: 'Step 1: Register on ieee.org as a student member.\nStep 2: Contact the branch coordinator with your IEEE membership number.\nStep 3: Pay the annual branch fee.\nStep 4: Join our WhatsApp/Discord community for updates.',
            achievements: [
                { image: null, caption: 'Best IEEE Student Branch Award 2023' },
                { image: null, caption: 'IEEE Regional Conference Hosts' },
                { image: null, caption: 'Published 15+ research papers' }
            ]
        },
        {
            id: 'seed_003',
            name: 'Veda Music Society',
            category: 'music',
            logo: null,
            clubHead: 'Smt. Lakshmi Priya',
            contact: '+91 76543 21098',
            mission: 'To preserve and promote Indian classical music traditions while embracing contemporary musical expressions, creating a vibrant musical community on campus.',
            vision: 'To make Amrita a center of musical excellence where traditional and modern music forms coexist and inspire future generations of musicians.',
            joiningProcedure: 'Step 1: Attend our weekly open mic sessions.\nStep 2: Audition with a piece of your choice (any genre).\nStep 3: Join our practice sessions and events.\nStep 4: Become a performing member after your first stage performance.',
            achievements: [
                { image: null, caption: 'Winners at Inter-University Music Festival' },
                { image: null, caption: 'Annual Concert with 2000+ attendees' },
                { image: null, caption: 'Collaboration with professional artists' }
            ]
        },
        {
            id: 'seed_004',
            name: 'Arts Society',
            category: 'arts',
            logo: null,
            clubHead: 'Prof. Ananya Krishnan',
            contact: '+91 65432 10987',
            mission: 'To cultivate artistic expression and design thinking among students through workshops, exhibitions, and collaborative art projects.',
            vision: 'To transform the campus into a living gallery that celebrates creativity and empowers students to express themselves through visual arts.',
            joiningProcedure: 'Step 1: Visit our studio during open hours.\nStep 2: Submit a portfolio or attend a creative workshop.\nStep 3: Register as a member through the club portal.\nStep 4: Participate in your first collaborative project.',
            achievements: [
                { image: null, caption: 'Campus Mural Project covering 500 sq ft' },
                { image: null, caption: 'National Level Art Competition Winners' },
                { image: null, caption: 'Annual Art Exhibition' }
            ]
        },
        {
            id: 'seed_005',
            name: 'Coding Club',
            category: 'coding',
            logo: null,
            clubHead: 'Mr. Arun Kumar',
            contact: '+91 54321 09876',
            mission: 'To develop competitive programming skills and build a strong foundation in software development through regular contests, hackathons, and mentorship programs.',
            vision: 'To produce world-class competitive programmers and software engineers who can solve complex problems with elegant code.',
            joiningProcedure: 'Step 1: Solve the entrance challenge on our online judge.\nStep 2: Attend the weekly coding practice sessions.\nStep 3: Participate in at least one internal contest.\nStep 4: Join our mentorship program.',
            achievements: [
                { image: null, caption: 'ICPC Regional Qualifiers - 5 teams' },
                { image: null, caption: 'Google Code Jam top 1000 finishers' },
                { image: null, caption: 'Hosted Hack-a-Thon with 500+ participants' }
            ]
        },
        {
            id: 'seed_006',
            name: 'Sports Club',
            category: 'sports',
            logo: null,
            clubHead: 'Coach Vikram Singh',
            contact: '+91 43210 98765',
            mission: 'To promote physical fitness, sportsmanship, and competitive excellence among students through diverse sporting activities and professional coaching.',
            vision: 'To develop well-rounded athletes who excel in both academics and sports, representing Amrita at national and international sporting events.',
            joiningProcedure: 'Step 1: Choose your sport of interest from our offerings.\nStep 2: Attend trials conducted at the beginning of each semester.\nStep 3: Complete a fitness assessment.\nStep 4: Join the regular training schedule.',
            achievements: [
                { image: null, caption: 'Inter-University Champions in Cricket' },
                { image: null, caption: 'State level Basketball Tournament Winners' },
                { image: null, caption: '15+ National level athletes' }
            ]
        },
        {
            id: 'seed_007',
            name: 'Amritavarshini Cultural Club',
            category: 'cultural',
            logo: null,
            clubHead: 'Dr. Priya Nair',
            contact: '+91 32109 87654',
            mission: 'To celebrate India\'s diverse cultural heritage through dance, drama, festivals, and cultural exchange programs that unite students from all backgrounds.',
            vision: 'To be a vibrant cultural platform that preserves traditions while encouraging creative cultural expressions among youth.',
            joiningProcedure: 'Step 1: Express interest at any of our cultural events.\nStep 2: Attend an orientation and choose your focus area (dance, drama, folk arts).\nStep 3: Participate in rehearsals and training sessions.\nStep 4: Perform at our monthly cultural showcase.',
            achievements: [
                { image: null, caption: 'Best Cultural Program at National Fest' },
                { image: null, caption: 'Annual Onam Celebration with 3000+ audience' },
                { image: null, caption: 'Cultural Exchange with 5 universities' }
            ]
        },
        {
            id: 'seed_008',
            name: 'AI Research Group',
            category: 'ai',
            logo: null,
            clubHead: 'Prof. Suresh Babu',
            contact: '+91 21098 76543',
            mission: 'To explore and advance the frontiers of artificial intelligence through research projects, paper reading groups, and collaborative experiments in machine learning and deep learning.',
            vision: 'To establish Amrita as a hub for AI research and innovation, producing groundbreaking work that impacts society positively.',
            joiningProcedure: 'Step 1: Complete the prerequisite online course on ML fundamentals.\nStep 2: Submit a brief research interest statement.\nStep 3: Join a research reading group.\nStep 4: Propose or join an ongoing project.',
            achievements: [
                { image: null, caption: '10+ papers published in top AI conferences' },
                { image: null, caption: 'Winner at Smart India Hackathon AI Track' },
                { image: null, caption: 'Industry-sponsored AI Lab setup' }
            ]
        },
        {
            id: 'seed_009',
            name: 'Amrita Media Club',
            category: 'media',
            logo: null,
            clubHead: 'Ms. Divya Ramachandran',
            contact: '+91 10987 65432',
            mission: 'To train students in journalism, content creation, photography, and videography while documenting campus life and producing high-quality media content.',
            vision: 'To create a professional media ecosystem on campus that nurtures future journalists, filmmakers, and content creators.',
            joiningProcedure: 'Step 1: Submit a sample work (article, photo, or video).\nStep 2: Attend the media workshop series.\nStep 3: Get assigned to a content team (print, digital, or broadcast).\nStep 4: Complete your first assignment.',
            achievements: [
                { image: null, caption: 'Campus Magazine with 5000+ readers' },
                { image: null, caption: 'Best University Media Award' },
                { image: null, caption: 'Documentary screened at film festival' }
            ]
        },
        {
            id: 'seed_010',
            name: 'Seva Sangha',
            category: 'community',
            logo: null,
            clubHead: 'Dr. Hari Krishnan',
            contact: '+91 98712 34567',
            mission: 'To instill the spirit of selfless service among students by organizing community outreach programs, environmental campaigns, and social welfare initiatives.',
            vision: 'To build a generation of socially conscious leaders who actively contribute to the betterment of underprivileged communities.',
            joiningProcedure: 'Step 1: Attend our monthly community service event.\nStep 2: Sign up as a volunteer.\nStep 3: Complete 10 hours of community service.\nStep 4: Become a core member and lead initiatives.',
            achievements: [
                { image: null, caption: 'Planted 10,000 trees in rural areas' },
                { image: null, caption: 'Taught 500+ underprivileged children' },
                { image: null, caption: 'National Service Award recipients' }
            ]
        },
        {
            id: 'seed_011',
            name: 'Mudhalir Music Club',
            category: 'music',
            logo: null,
            clubHead: 'Mr. Karthik Subramanian',
            contact: '+91 87612 34567',
            mission: 'To bring together musicians of all genres and skill levels, fostering collaboration and providing a platform for original compositions and performances.',
            vision: 'To create a thriving contemporary music scene on campus where students can discover, create, and share music freely.',
            joiningProcedure: 'Step 1: Show up to our jam sessions every Friday.\nStep 2: Play or sing at open mic night.\nStep 3: Register as a member.\nStep 4: Join a band or start your own!',
            achievements: [
                { image: null, caption: 'Battle of the Bands champions' },
                { image: null, caption: 'Released campus music album' },
                { image: null, caption: 'Opened for professional bands at fest' }
            ]
        },
        {
            id: 'seed_012',
            name: 'Cromptre Arts Club',
            category: 'arts',
            logo: null,
            clubHead: 'Ms. Sneha Rajan',
            contact: '+91 76512 34567',
            mission: 'To explore digital arts, graphic design, and multimedia creation, equipping students with industry-standard creative tools and techniques.',
            vision: 'To bridge the gap between traditional artistry and modern digital creativity, producing designers who can lead in the creative industry.',
            joiningProcedure: 'Step 1: Attend our design bootcamp.\nStep 2: Complete a mini design challenge.\nStep 3: Join our Adobe/Figma workspace.\nStep 4: Collaborate on a real project.',
            achievements: [
                { image: null, caption: 'Designed branding for 20+ campus events' },
                { image: null, caption: 'Winners at National Design Competition' },
                { image: null, caption: 'Students placed at top design firms' }
            ]
        },
        {
            id: 'seed_013',
            name: 'Science Research Forum',
            category: 'science',
            logo: null,
            clubHead: 'Dr. Venkatesh Iyer',
            contact: '+91 65412 34567',
            mission: 'To nurture scientific curiosity and research aptitude among undergraduate students through experiments, seminars, and collaborative research projects.',
            vision: 'To create a culture of scientific inquiry where every student has the opportunity to contribute to meaningful research.',
            joiningProcedure: 'Step 1: Attend our monthly science seminar.\nStep 2: Express interest in a research area.\nStep 3: Get paired with a faculty mentor.\nStep 4: Begin your research project.',
            achievements: [
                { image: null, caption: '25+ papers in peer-reviewed journals' },
                { image: null, caption: 'National Science Day best exhibit' },
                { image: null, caption: '3 patents filed by student teams' }
            ]
        },
        {
            id: 'seed_014',
            name: 'Literary Society',
            category: 'literary',
            logo: null,
            clubHead: 'Prof. Kavitha Menon',
            contact: '+91 54312 34567',
            mission: 'To cultivate the art of eloquent expression through debates, creative writing, poetry slams, and literary discussions that sharpen critical thinking.',
            vision: 'To produce confident communicators and thoughtful writers who can articulate ideas powerfully in any arena.',
            joiningProcedure: 'Step 1: Attend a debate or writing workshop.\nStep 2: Submit a writing sample or participate in a debate.\nStep 3: Join our weekly literary circle.\nStep 4: Represent the club at inter-college events.',
            achievements: [
                { image: null, caption: 'Won 12 inter-university debate trophies' },
                { image: null, caption: 'Published student literary magazine' },
                { image: null, caption: 'MUN Best Delegate awards' }
            ]
        },
        {
            id: 'seed_015',
            name: 'E-Cell Amrita',
            category: 'entrepreneurship',
            logo: null,
            clubHead: 'Mr. Ashwin Menon',
            contact: '+91 43212 34567',
            mission: 'To foster an entrepreneurial mindset among students by providing mentorship, funding connections, and hands-on startup experience through incubation programs.',
            vision: 'To make Amrita a launchpad for successful student startups that create jobs and solve real-world problems.',
            joiningProcedure: 'Step 1: Attend our startup bootcamp.\nStep 2: Pitch a business idea (solo or team).\nStep 3: Get matched with a mentor.\nStep 4: Join the incubation program.',
            achievements: [
                { image: null, caption: '5 student startups received funding' },
                { image: null, caption: 'Hosted Startup Weekend with 300+ attendees' },
                { image: null, caption: 'Alumni startup valued at 50 Crore' }
            ]
        }
    ];
}

