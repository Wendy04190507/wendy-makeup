/* ============================================
   WENDY MAKEUP STUDIO - Admin Dashboard JS
   ============================================ */

// ============ CONFIGURATION ============
// Supabase 配置 - 部署后会自动更新
const SUPABASE_URL = 'https://lphlhuyhvntgfrkslews.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGxodXlodm50Z2Zya3NsZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTg3MzcsImV4cCI6MjA5NTY5NDczN30.Fd875TrmTMu8tJ4xgYvn_NeYtDpE16o3QetSMqp2SHA';

// 管理密码（首次加载时设置，可通过后台修改）
const DEFAULT_PASSWORD = 'Wendy0419';
const STORAGE_KEY_PASSWORD = 'wendy_admin_password';
const STORAGE_KEY_BOOKINGS = 'wendy_bookings';

// ============ UTILITY ============
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, type = 'info') {
    const container = $('#adminToast');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getPassword() {
    return localStorage.getItem(STORAGE_KEY_PASSWORD) || DEFAULT_PASSWORD;
}

function getBookings() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
    } catch { return []; }
}

function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
}

function formatCurrency(n) { return '¥' + n.toLocaleString(); }

// ============ LOGIN ============
const loginScreen = $('#adminLogin');
const dashboard = $('#adminDashboard');
const loginForm = $('#loginForm');

// Check if already logged in
if (sessionStorage.getItem('wendy_admin_logged_in') === 'true') {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    initDashboard();
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = $('#adminPassword').value.trim();
    const storedPassword = getPassword();

    if (password === storedPassword) {
        sessionStorage.setItem('wendy_admin_logged_in', 'true');
        loginScreen.style.display = 'none';
        dashboard.style.display = 'flex';
        initDashboard();
        showToast('登录成功，欢迎回来！', 'success');
    } else {
        const errorEl = $('.login-error') || document.createElement('p');
        errorEl.className = 'login-error show';
        errorEl.textContent = '密码错误，请重试';
        if (!$('.login-error')) {
            loginForm.insertBefore(errorEl, loginForm.querySelector('.btn-login'));
        }
        $('#adminPassword').value = '';
        $('#adminPassword').focus();
    }
});

// ============ LOGOUT ============
$('#btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem('wendy_admin_logged_in');
    dashboard.style.display = 'none';
    loginScreen.style.display = 'flex';
    $('#adminPassword').value = '';
});

// ============ INIT DASHBOARD ============
function initDashboard() {
    updateTime();
    setInterval(updateTime, 30000);
    initNavigation();
    loadOverview();
    loadAllBookings();
    loadSettings();
}

function updateTime() {
    const now = new Date();
    const str = now.toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
    $('#topbarTime').textContent = str;
}

// ============ NAVIGATION ============
function closeSidebar() {
    $('.sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function openSidebar() {
    $('.sidebar').classList.add('open');
    $('#sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function initNavigation() {
    const navItems = $$('.nav-item');
    const pages = $$('.page-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            $(`#page-${page}`).classList.add('active');
            $('#pageTitle').textContent = item.textContent.trim();

            if (page === 'overview') loadOverview();
            if (page === 'bookings') loadAllBookings();
            if (page === 'calendar') loadCalendarView();
            if (page === 'clients') loadClients();
            if (page === 'analytics') loadAnalytics();
            if (page === 'settings') loadSettings();

            // Close sidebar on mobile after nav click
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Sidebar toggle (mobile)
    $('#btnSidebarToggle').addEventListener('click', () => {
        if ($('.sidebar').classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Close sidebar when clicking overlay
    $('#sidebarOverlay').addEventListener('click', () => {
        closeSidebar();
    });

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && $('.sidebar').classList.contains('open')) {
            closeSidebar();
        }
    });
}

// ============ OVERVIEW PAGE ============
function loadOverview() {
    const bookings = getBookings();
    const now = new Date();
    const todayStr = formatDate(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Stats
    const todayBookings = bookings.filter(b =>
        b.date === todayStr && b.status !== 'cancelled'
    );
    const pending = bookings.filter(b => b.status === 'pending');
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const monthlyBookings = bookings.filter(b => {
        if (b.status === 'cancelled') return false;
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.servicePrice || 0), 0);

    $('#statToday').textContent = todayBookings.length;
    $('#statPending').textContent = pending.length;
    $('#statConfirmed').textContent = confirmed.length;
    $('#statRevenue').textContent = formatCurrency(monthlyRevenue);

    // Recent bookings
    const recent = [...bookings]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
    const recentContainer = $('#recentBookings');
    if (recent.length === 0) {
        recentContainer.innerHTML = '<p class="empty-state">暂无预约记录</p>';
    } else {
        recentContainer.innerHTML = recent.map(b => `
            <div class="recent-booking-item">
                <div class="rb-info">
                    <strong>${b.name} · ${getServiceName(b.service)}</strong>
                    <span>${b.date} ${b.time} | ${b.phone}</span>
                </div>
                <span class="rb-status ${b.status}">${getStatusText(b.status)}</span>
            </div>
        `).join('');
    }

    // Service chart
    const serviceCounts = {};
    bookings.forEach(b => {
        if (b.status === 'cancelled') return;
        const name = getServiceName(b.service);
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    const chartContainer = $('#serviceChart');
    const maxCount = Math.max(...Object.values(serviceCounts), 1);
    const entries = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
        chartContainer.innerHTML = '<p class="empty-state">暂无数据</p>';
    } else {
        chartContainer.innerHTML = entries.map(([name, count]) => `
            <div class="chart-bar-row">
                <span class="chart-bar-label">${name}</span>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.max(count/maxCount*100, 8)}%;">${count}</div>
                </div>
            </div>
        `).join('');
    }
}

// ============ BOOKINGS PAGE ============
let currentFilterStatus = 'all';
let currentFilterService = 'all';
let currentFilterDate = '';
let currentSearch = '';
let currentPage = 1;
const PER_PAGE = 10;

function loadAllBookings() {
    const bookings = getBookings();

    // Apply filters
    let filtered = [...bookings];
    if (currentFilterStatus !== 'all') {
        filtered = filtered.filter(b => b.status === currentFilterStatus);
    }
    if (currentFilterService !== 'all') {
        filtered = filtered.filter(b => b.service === currentFilterService);
    }
    if (currentFilterDate) {
        filtered = filtered.filter(b => b.date === currentFilterDate);
    }
    if (currentSearch) {
        const s = currentSearch.toLowerCase();
        filtered = filtered.filter(b =>
            b.name.toLowerCase().includes(s) ||
            b.phone.includes(s) ||
            (b.id || '').toLowerCase().includes(s)
        );
    }

    // Sort by date desc, then time desc
    filtered.sort((a, b) => {
        const da = `${a.date}T${a.time || '00:00'}`;
        const db = `${b.date}T${b.time || '00:00'}`;
        return db.localeCompare(da);
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    // Render table
    const tbody = $('#bookingsTableBody');
    if (pageItems.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">暂无匹配的预约记录</td></tr>';
    } else {
        tbody.innerHTML = pageItems.map(b => `
            <tr>
                <td><code style="font-size:0.75rem;color:var(--color-primary-dark);">${b.id || '-'}</code></td>
                <td>
                    <strong>${b.name}</strong>
                    <div style="font-size:0.75rem;color:var(--color-text-light);">${b.phone}</div>
                </td>
                <td>${getServiceName(b.service)}</td>
                <td>${b.date}</td>
                <td>${b.time}</td>
                <td>${formatCurrency(b.servicePrice || 0)}</td>
                <td>
                    <select class="status-select" data-id="${b.id}" onchange="updateBookingStatus('${b.id}', this.value)">
                        <option value="pending" ${b.status==='pending'?'selected':''}>待确认</option>
                        <option value="confirmed" ${b.status==='confirmed'?'selected':''}>已确认</option>
                        <option value="completed" ${b.status==='completed'?'selected':''}>已完成</option>
                        <option value="cancelled" ${b.status==='cancelled'?'selected':''}>已取消</option>
                    </select>
                </td>
                <td>
                    <button class="btn-detail" onclick="showBookingDetail('${b.id}')">
                        <i class="fas fa-eye"></i> 详情
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Pagination buttons
    const pagination = $('#pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
    } else {
        let html = '';
        if (currentPage > 1) html += `<button onclick="goToPage(${currentPage-1})"><i class="fas fa-chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i===currentPage?'active':''}" onclick="goToPage(${i})">${i}</button>`;
        }
        if (currentPage < totalPages) html += `<button onclick="goToPage(${currentPage+1})"><i class="fas fa-chevron-right"></i></button>`;
        pagination.innerHTML = html;
    }
}

function goToPage(page) {
    currentPage = page;
    loadAllBookings();
}

// Filter listeners
$('#filterStatus').addEventListener('change', function() {
    currentFilterStatus = this.value;
    currentPage = 1;
    loadAllBookings();
});
$('#filterService').addEventListener('change', function() {
    currentFilterService = this.value;
    currentPage = 1;
    loadAllBookings();
});
$('#filterDate').addEventListener('change', function() {
    currentFilterDate = this.value;
    currentPage = 1;
    loadAllBookings();
});
$('#filterSearch').addEventListener('input', function() {
    currentSearch = this.value.trim();
    currentPage = 1;
    loadAllBookings();
});

// Update booking status
window.updateBookingStatus = function(bookingId, newStatus) {
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx > -1) {
        bookings[idx].status = newStatus;
        saveBookings(bookings);
        showToast(`预约 ${bookingId} 状态已更新为「${getStatusText(newStatus)}」`, 'success');
        loadAllBookings();
        loadOverview();
    }
};

// Show booking detail
window.showBookingDetail = function(bookingId) {
    const bookings = getBookings();
    const b = bookings.find(bk => bk.id === bookingId);
    if (!b) return;

    $('#detailContent').innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <span class="detail-label">预约编号</span>
                <span class="detail-value">${b.id}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">状态</span>
                <span class="detail-value"><span class="booking-status-badge ${b.status}">${getStatusText(b.status)}</span></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">服务项目</span>
                <span class="detail-value">${getServiceName(b.service)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">预估价格</span>
                <span class="detail-value">${formatCurrency(b.servicePrice || 0)} 起</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">预约日期</span>
                <span class="detail-value">${b.date} ${b.time}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">客户姓名</span>
                <span class="detail-value">${b.name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">手机号</span>
                <span class="detail-value">${b.phone}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">微信</span>
                <span class="detail-value">${b.wechat || '未填写'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">邮箱</span>
                <span class="detail-value">${b.email || '未填写'}</span>
            </div>
            <div class="detail-item detail-full">
                <span class="detail-label">服务地址</span>
                <span class="detail-value">${b.location}</span>
            </div>
            ${b.note ? `<div class="detail-item detail-full"><span class="detail-label">客户备注</span><span class="detail-value">${b.note}</span></div>` : ''}
            <div class="detail-item detail-full">
                <span class="detail-label">内部备注</span>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input type="text" id="internalNote_${b.id}" value="${b.internalNote || ''}" placeholder="添加内部备注（仅管理员可见）" style="flex:1;padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:0.85rem;">
                    <button class="btn-detail" onclick="addBookingNote('${b.id}', document.getElementById('internalNote_${b.id}').value)" style="white-space:nowrap;">
                        <i class="fas fa-save"></i> 保存
                    </button>
                </div>
            </div>
            <div class="detail-item detail-full">
                <span class="detail-label">创建时间</span>
                <span class="detail-value">${b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN') : '未知'}</span>
            </div>
        </div>
    `;
    $('#detailModal').classList.add('active');
};

$('#closeDetailModal').addEventListener('click', () => {
    $('#detailModal').classList.remove('active');
});
$('#detailModal').addEventListener('click', (e) => {
    if (e.target === $('#detailModal')) $('#detailModal').classList.remove('active');
});

// Export
$('#btnExport').addEventListener('click', exportToCSV);

function exportToCSV() {
    const bookings = getBookings();
    if (bookings.length === 0) {
        showToast('没有可导出的数据', 'error');
        return;
    }
    const headers = ['预约编号', '客户姓名', '手机号', '微信', '邮箱', '服务项目', '日期', '时间', '地址', '价格', '状态', '备注', '创建时间'];
    const rows = bookings.map(b => [
        b.id, b.name, b.phone, b.wechat || '', b.email || '',
        getServiceName(b.service), b.date, b.time, b.location,
        b.servicePrice || 0, getStatusText(b.status), b.note || '',
        b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN') : ''
    ]);

    const BOM = '﻿';
    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Wendy预约导出_${formatDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('导出成功！', 'success');
}

// ============ SETTINGS PAGE ============
function loadSettings() {
    const bookings = getBookings();
    $('#setTotalBookings').textContent = bookings.length;
}

$('#changePasswordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPw = $('#currentPassword').value.trim();
    const newPw = $('#newPassword').value.trim();
    const confirmPw = $('#confirmPassword').value.trim();
    const storedPw = getPassword();

    if (currentPw !== storedPw) {
        showToast('当前密码不正确', 'error');
        return;
    }
    if (newPw.length < 6) {
        showToast('新密码至少6位', 'error');
        return;
    }
    if (newPw !== confirmPw) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    localStorage.setItem(STORAGE_KEY_PASSWORD, newPw);
    showToast('密码修改成功！请牢记新密码。', 'success');
    $('#changePasswordForm').reset();
});

// ============ HELPERS ============
function getServiceName(service) {
    const names = {
        bridal: '新娘妆容造型', evening: '晚宴/派对妆容',
        commercial: '商业拍摄妆容', personal: '个人形象设计',
        trial: '试妆体验', group: '团体造型服务'
    };
    return names[service] || service || '未知';
}

function getStatusText(status) {
    const texts = {
        pending: '待确认', confirmed: '已确认',
        completed: '已完成', cancelled: '已取消'
    };
    return texts[status] || status;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ($('#detailModal') && $('#detailModal').classList.contains('active')) {
            $('#detailModal').classList.remove('active');
        }
    }
});

// ============ SUPABASE INTEGRATION (raw fetch, no SDK) ============
function supabaseHeaders() {
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    };
}

// Sync bookings from Supabase
async function syncFromSupabase() {
    try {
        const resp = await fetch(
            SUPABASE_URL + '/rest/v1/bookings?select=*&order=created_at.desc',
            { headers: supabaseHeaders() }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        if (data && data.length > 0) {
            // Map Supabase fields to local format
            const mapped = data.map(b => ({
                id: b.id,
                service: b.service,
                serviceName: b.service_name,
                servicePrice: b.price,
                date: b.date,
                time: b.time,
                name: b.name,
                phone: b.phone,
                wechat: b.wechat || '',
                email: b.email || '',
                location: b.location,
                note: b.note || '',
                status: b.status || 'pending',
                createdAt: b.created_at
            }));
            saveBookings(mapped);
        }
    } catch (e) {
        console.warn('Supabase 同步失败:', e.message);
    }
}

// Update booking status in Supabase
async function updateSupabaseStatus(bookingId, status) {
    try {
        await fetch(
            SUPABASE_URL + '/rest/v1/bookings?id=eq.' + encodeURIComponent(bookingId),
            { method: 'PATCH', headers: supabaseHeaders(), body: JSON.stringify({ status: status }) }
        );
    } catch (e) {
        console.warn('Cloud update issue:', e.message);
    }
}

// Override updateBookingStatus to also sync to Supabase
const originalUpdateStatus = window.updateBookingStatus;
window.updateBookingStatus = async function(bookingId, newStatus) {
    originalUpdateStatus(bookingId, newStatus);
    await updateSupabaseStatus(bookingId, newStatus);
};

// Try to sync on load
syncFromSupabase().then(() => {
    if (sessionStorage.getItem('wendy_admin_logged_in') === 'true') {
        loadOverview();
        loadAllBookings();
    }
});

// ============ DARK MODE ============
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark');
        const icon = $('#btnDarkMode').querySelector('i');
        if (icon) { icon.className = 'fas fa-sun'; }
    } else {
        document.body.classList.remove('dark');
        const icon = $('#btnDarkMode').querySelector('i');
        if (icon) { icon.className = 'fas fa-moon'; }
    }
}

$('#btnDarkMode').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    applyDarkMode(!isDark);
    localStorage.setItem('wendy_admin_dark_mode', !isDark ? 'true' : 'false');
});

// Restore dark mode preference
if (localStorage.getItem('wendy_admin_dark_mode') === 'true') {
    applyDarkMode(true);
}

// ============ BULK SELECT & ACTIONS ============
let selectedBookings = new Set();

$('#selectAllBookings').addEventListener('change', function() {
    selectedBookings.clear();
    if (this.checked) {
        const checkboxes = $$('.booking-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedBookings.add(cb.getAttribute('data-id'));
        });
    } else {
        const checkboxes = $$('.booking-checkbox');
        checkboxes.forEach(cb => { cb.checked = false; });
    }
    updateBulkButton();
});

function onCheckboxChange(bookingId, checked) {
    if (checked) {
        selectedBookings.add(bookingId);
    } else {
        selectedBookings.delete(bookingId);
        $('#selectAllBookings').checked = false;
    }
    updateBulkButton();
}

function updateBulkButton() {
    const btn = $('#btnBulkConfirm');
    btn.disabled = selectedBookings.size === 0;
    btn.textContent = selectedBookings.size > 0
        ? `批量确认 (${selectedBookings.size})`
        : '批量确认';
}

$('#btnBulkConfirm').addEventListener('click', async () => {
    if (selectedBookings.size === 0) return;
    if (!confirm(`确认要将 ${selectedBookings.size} 条预约标记为"已确认"吗？`)) return;

    const bookings = getBookings();
    let count = 0;
    for (const id of selectedBookings) {
        const idx = bookings.findIndex(b => b.id === id);
        if (idx > -1 && bookings[idx].status === 'pending') {
            bookings[idx].status = 'confirmed';
            await updateSupabaseStatus(id, 'confirmed');
            count++;
        }
    }
    saveBookings(bookings);
    selectedBookings.clear();
    $('#selectAllBookings').checked = false;
    updateBulkButton();
    showToast(`已确认 ${count} 条预约`, 'success');
    loadAllBookings();
    loadOverview();
});

// ============ CALENDAR VIEW ============
let calViewYear, calViewMonth;
let selectedCalDate = null;

function loadCalendarView() {
    const now = new Date();
    calViewYear = now.getFullYear();
    calViewMonth = now.getMonth();
    renderCalendarGrid();
    setupCalendarNav();
}

function setupCalendarNav() {
    $('#calViewPrev').onclick = () => {
        calViewMonth--;
        if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
        selectedCalDate = null;
        renderCalendarGrid();
    };
    $('#calViewNext').onclick = () => {
        calViewMonth++;
        if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
        selectedCalDate = null;
        renderCalendarGrid();
    };
    $('#calViewToday').onclick = () => {
        const now = new Date();
        calViewYear = now.getFullYear();
        calViewMonth = now.getMonth();
        selectedCalDate = null;
        renderCalendarGrid();
    };
}

function renderCalendarGrid() {
    $('#calViewMonth').textContent = `${calViewYear}年 ${calViewMonth + 1}月`;

    const bookings = getBookings();
    // Group bookings by date
    const dateMap = {};
    bookings.forEach(b => {
        if (!dateMap[b.date]) dateMap[b.date] = [];
        dateMap[b.date].push(b);
    });

    const today = new Date();
    const todayStr = formatDate(today);

    const firstDay = new Date(calViewYear, calViewMonth, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calViewYear, calViewMonth, 0).getDate();

    let html = '';

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const m = calViewMonth === 0 ? 11 : calViewMonth - 1;
        const y = calViewMonth === 0 ? calViewYear - 1 : calViewYear;
        const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        html += renderCalendarDay(day, dateStr, dateMap, todayStr, true);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calViewYear}-${String(calViewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        html += renderCalendarDay(day, dateStr, dateMap, todayStr, false);
    }

    // Next month days (fill remaining grid)
    const totalCells = startDayOfWeek + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remaining; day++) {
        const m = calViewMonth === 11 ? 0 : calViewMonth + 1;
        const y = calViewMonth === 11 ? calViewYear + 1 : calViewYear;
        const dateStr = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        html += renderCalendarDay(day, dateStr, dateMap, todayStr, true);
    }

    $('#calendarGridDays').innerHTML = html;

    // Add click handlers
    $$('.calendar-day-cell:not(.other-month)').forEach(cell => {
        cell.addEventListener('click', () => {
            $$('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            selectedCalDate = cell.getAttribute('data-date');
            renderCalendarDayDetail(selectedCalDate, dateMap);
        });
    });

    // Clear detail
    selectedCalDate = null;
    $('#calendarDayDetail').innerHTML = '<p class="empty-state">点击日期查看当天预约详情</p>';
}

function renderCalendarDay(day, dateStr, dateMap, todayStr, isOtherMonth) {
    const dayBookings = dateMap[dateStr] || [];
    let dotClass = '';
    let dotHtml = '';
    if (dayBookings.length > 0) {
        const statuses = [...new Set(dayBookings.map(b => b.status))];
        dotHtml = statuses.map(s => `<span class="calendar-day-dot ${s}"></span>`).join('');
        if (dayBookings.length > 1) {
            dotHtml += `<span class="calendar-day-count">${dayBookings.length}条</span>`;
        }
    }
    const todayClass = dateStr === todayStr ? ' today' : '';
    const otherClass = isOtherMonth ? ' other-month' : '';
    return `<div class="calendar-day-cell${todayClass}${otherClass}" data-date="${dateStr}">
        <span>${day}</span>
        <div class="calendar-day-dots">${dotHtml}</div>
    </div>`;
}

function renderCalendarDayDetail(dateStr, dateMap) {
    const dayBookings = dateMap[dateStr] || [];
    if (dayBookings.length === 0) {
        $('#calendarDayDetail').innerHTML = `<h4>${dateStr}</h4><p class="empty-state">当天暂无预约</p>`;
        return;
    }
    const sorted = [...dayBookings].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    let html = `<h4>${dateStr} — 共 ${sorted.length} 条预约</h4>`;
    sorted.forEach(b => {
        html += `
            <div class="calendar-booking-item">
                <div class="cb-info">
                    <strong>${b.name} · ${getServiceName(b.service)}</strong>
                    <span>${b.time} | ${b.phone} | <span class="booking-status-badge ${b.status}">${getStatusText(b.status)}</span></span>
                </div>
                <button class="btn-detail" onclick="showBookingDetail('${b.id}')"><i class="fas fa-eye"></i></button>
            </div>`;
    });
    $('#calendarDayDetail').innerHTML = html;
}

// ============ CLIENTS PAGE ============
function loadClients() {
    const bookings = getBookings();
    const searchTerm = ($('#clientSearch') ? $('#clientSearch').value.trim().toLowerCase() : '');

    // Group by phone number
    const clientMap = {};
    bookings.forEach(b => {
        const key = b.phone;
        if (!clientMap[key]) {
            clientMap[key] = {
                name: b.name,
                phone: b.phone,
                wechat: b.wechat || '',
                email: b.email || '',
                bookings: [],
                totalSpent: 0
            };
        }
        clientMap[key].bookings.push(b);
        if (b.status !== 'cancelled') {
            clientMap[key].totalSpent += b.servicePrice || 0;
        }
    });

    let clients = Object.values(clientMap);

    // Filter by search
    if (searchTerm) {
        clients = clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm) ||
            c.wechat.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by total bookings desc
    clients.sort((a, b) => b.bookings.length - a.bookings.length);

    $('#clientCount').textContent = `共 ${clients.length} 位客户`;

    if (clients.length === 0) {
        $('#clientsGrid').innerHTML = '<p class="empty-state">暂无客户数据</p>';
        return;
    }

    $('#clientsGrid').innerHTML = clients.map(c => {
        const services = [...new Set(c.bookings.map(b => getServiceName(b.service)))];
        const lastBooking = c.bookings.sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )[0];
        return `
            <div class="client-card" onclick="showClientDetail('${c.phone}')">
                <div class="client-card-header">
                    <span class="client-card-name">${c.name}</span>
                    <span class="client-card-total">累计 ${formatCurrency(c.totalSpent)}</span>
                </div>
                <div class="client-card-info">
                    <span><i class="fas fa-phone"></i> ${c.phone}</span>
                    ${c.wechat ? `<span><i class="fab fa-weixin"></i> ${c.wechat}</span>` : ''}
                </div>
                <div class="client-card-tags">
                    ${services.map(s => `<span class="client-tag">${s}</span>`).join('')}
                </div>
                <div class="client-card-footer">
                    <span>${c.bookings.length} 次预约</span>
                    <span>最近: ${lastBooking ? lastBooking.date : '无'}</span>
                </div>
            </div>`;
    }).join('');

    // Setup client search
    if ($('#clientSearch')) {
        $('#clientSearch').oninput = () => loadClients();
    }
}

window.showClientDetail = function(phone) {
    const bookings = getBookings().filter(b => b.phone === phone);
    if (bookings.length === 0) return;

    const client = bookings[0];
    const totalSpent = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.servicePrice || 0), 0);
    const sorted = [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let bookingListHtml = sorted.map(b => `
        <tr>
            <td><code style="font-size:0.75rem;">${b.id || '-'}</code></td>
            <td>${getServiceName(b.service)}</td>
            <td>${b.date} ${b.time}</td>
            <td>${formatCurrency(b.servicePrice || 0)}</td>
            <td><span class="booking-status-badge ${b.status}">${getStatusText(b.status)}</span></td>
        </tr>
    `).join('');

    $('#detailContent').innerHTML = `
        <div style="margin-bottom:20px;">
            <h4 style="margin-bottom:4px;">${client.name}</h4>
            <p style="color:var(--color-text-light);font-size:0.85rem;">
                ${client.phone} ${client.wechat ? '· 微信: '+client.wechat : ''}
            </p>
            <p style="color:var(--color-primary);font-weight:600;margin-top:8px;">累计消费: ${formatCurrency(totalSpent)} · ${bookings.length} 次预约</p>
        </div>
        <div style="overflow-x:auto;">
            <table class="bookings-table" style="font-size:0.82rem;">
                <thead>
                    <tr><th>编号</th><th>服务</th><th>日期</th><th>价格</th><th>状态</th></tr>
                </thead>
                <tbody>${bookingListHtml}</tbody>
            </table>
        </div>
    `;
    $('#detailModal').classList.add('active');
};

// ============ ANALYTICS PAGE ============
function loadAnalytics() {
    const bookings = getBookings();
    loadRevenueChart(bookings);
    loadServicePieChart(bookings);
    loadTimeSlotChart(bookings);
    loadConversionRate(bookings);
    loadMonthlySummary(bookings);
}

function loadRevenueChart(bookings) {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const m = now.getMonth() - i;
        const y = now.getFullYear() + (m < 0 ? -1 : 0);
        const month = ((m % 12) + 12) % 12;
        months.push({ year: y + (m < 0 ? -1 : 0), month, label: `${y + (m < 0 ? -1 : 0)}年${month + 1}月` });
    }
    // Fix year for each month
    const fixedMonths = [];
    for (let i = 5; i >= 0; i--) {
        const rawMonth = now.getMonth() - i;
        const y = now.getFullYear() + Math.floor((now.getMonth() - i) / 12);
        const m = ((rawMonth % 12) + 12) % 12;
        fixedMonths.push({ year: y, month: m, label: `${y}年${m + 1}月` });
    }

    const monthlyRevenue = fixedMonths.map(({ year, month, label }) => {
        const total = bookings
            .filter(b => {
                if (b.status === 'cancelled') return false;
                const d = new Date(b.date);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((sum, b) => sum + (b.servicePrice || 0), 0);
        return { label, total };
    });

    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total), 1);
    $('#revenueChart').innerHTML = monthlyRevenue.map(m => `
        <div class="revenue-bar-row">
            <span class="revenue-bar-label">${m.label.slice(5)}</span>
            <div class="revenue-bar-track">
                <div class="revenue-bar-fill" style="width:${Math.max(m.total/maxRevenue*100, 5)}%;">${m.total > 0 ? formatCurrency(m.total) : ''}</div>
            </div>
        </div>
    `).join('');
}

function loadServicePieChart(bookings) {
    const counts = {};
    bookings.forEach(b => {
        if (b.status === 'cancelled') return;
        const name = getServiceName(b.service);
        counts[name] = (counts[name] || 0) + 1;
    });
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    if (total === 0) {
        $('#servicePieChart').innerHTML = '<p class="empty-state">暂无数据</p>';
        return;
    }
    const colors = ['#c9a96e', '#7cb89e', '#b76e79', '#648cc8', '#d4a843', '#9b7ec4'];
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    $('#servicePieChart').innerHTML = `
        <div class="pie-chart-simple">
            ${entries.map(([name, count], i) => `
                <div class="pie-legend-row">
                    <div class="pie-color" style="background:${colors[i % colors.length]};"></div>
                    <span class="pie-label">${name}</span>
                    <span class="pie-value">${count} (${Math.round(count/total*100)}%)</span>
                </div>
            `).join('')}
        </div>
    `;
}

function loadTimeSlotChart(bookings) {
    const slots = { '上午(8-12)': 0, '下午(12-17)': 0, '傍晚(17-20)': 0, '晚间(20-22)': 0 };
    bookings.forEach(b => {
        if (b.status === 'cancelled' || !b.time) return;
        const hour = parseInt(b.time.split(':')[0]);
        if (hour >= 8 && hour < 12) slots['上午(8-12)']++;
        else if (hour >= 12 && hour < 17) slots['下午(12-17)']++;
        else if (hour >= 17 && hour < 20) slots['傍晚(17-20)']++;
        else slots['晚间(20-22)']++;
    });
    const maxCount = Math.max(...Object.values(slots), 1);
    $('#timeSlotChart').innerHTML = Object.entries(slots).map(([label, count]) => `
        <div class="time-slot-item">
            <span style="flex:1;font-size:0.8rem;">${label}</span>
            <span style="font-weight:600;font-size:0.85rem;margin-right:8px;">${count}</span>
            <div class="time-slot-bar" style="width:${Math.max(count/maxCount*60, 2)}%;"></div>
        </div>
    `).join('');
}

function loadConversionRate(bookings) {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
    const rate = total > 0 ? Math.round(confirmed / total * 100) : 0;
    $('#conversionRate').innerHTML = `
        <span class="kpi-value">${rate}%</span>
        <span class="kpi-label">预约→确认转化率 (${confirmed}/${total})</span>
    `;
}

function loadMonthlySummary(bookings) {
    const summary = {};
    bookings.forEach(b => {
        if (!b.date) return;
        const d = new Date(b.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!summary[key]) {
            summary[key] = { total: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 };
        }
        summary[key].total++;
        if (b.status === 'confirmed') { summary[key].confirmed++; summary[key].revenue += b.servicePrice || 0; }
        else if (b.status === 'completed') { summary[key].completed++; summary[key].revenue += b.servicePrice || 0; }
        else if (b.status === 'cancelled') summary[key].cancelled++;
        else if (b.status === 'pending') { /* count in total but not revenue */ }
    });
    const months = Object.entries(summary).sort((a, b) => b[0].localeCompare(a[0]));
    if (months.length === 0) {
        $('#monthlySummaryBody').innerHTML = '<tr class="empty-row"><td colspan="6">暂无数据</td></tr>';
        return;
    }
    $('#monthlySummaryBody').innerHTML = months.map(([month, data]) => `
        <tr>
            <td><strong>${month}</strong></td>
            <td>${data.total}</td>
            <td>${data.confirmed}</td>
            <td>${data.completed}</td>
            <td>${data.cancelled}</td>
            <td>${formatCurrency(data.revenue)}</td>
        </tr>
    `).join('');
}

// ============ UPDATE BOOKING TABLE WITH CHECKBOXES ============
const originalLoadAllBookings = loadAllBookings;
loadAllBookings = function() {
    originalLoadAllBookings();
    // After rendering, add checkboxes to each row and restore selections
    setTimeout(() => {
        const rows = $$('#bookingsTableBody tr:not(.empty-row)');
        rows.forEach(row => {
            const statusSelect = row.querySelector('.status-select');
            if (!statusSelect) return;
            const bookingId = statusSelect.getAttribute('data-id');
            const firstCell = row.querySelector('td');
            if (firstCell && !firstCell.querySelector('.booking-checkbox')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'booking-checkbox';
                checkbox.setAttribute('data-id', bookingId);
                checkbox.checked = selectedBookings.has(bookingId);
                checkbox.addEventListener('change', function() {
                    onCheckboxChange(bookingId, this.checked);
                });
                // Insert checkbox in a wrapper
                const td = document.createElement('td');
                td.appendChild(checkbox);
                row.insertBefore(td, firstCell);
            }
        });
        updateBulkButton();
    }, 0);
};

// Add note field to booking detail and status update
window.addBookingNote = function(bookingId, note) {
    const bookings = getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx > -1) {
        bookings[idx].internalNote = note;
        saveBookings(bookings);
        showToast('备注已保存', 'success');
    }
};

console.log('%c🔐 Wendy 管理后台已就绪 %c| %c数据存储模式：浏览器本地 + Supabase云同步',
    'color:#c9a96e;font-weight:bold;', '', 'color:#888;');
console.log('%c✨ 新功能：日历视图 · 客户管理 · 数据分析 · 暗色模式 · 批量操作',
    'color:#7cb89e;font-size:0.9em;');
