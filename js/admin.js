/* ============================================
   WENDY MAKEUP STUDIO - Admin Dashboard JS
   ============================================ */

// ============ CONFIGURATION ============
// Supabase 配置 - 部署后会自动更新
const SUPABASE_URL = 'https://lphlhuyhvntgfrkslews.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGxodXlodm50Z2Zya3NsZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTg3MzcsImV4cCI6MjA5NTY5NDczN30.Fd875TrmTMu8tJ4xgYvn_NeYtDpE16o3QetSMqp2SHA';

// 管理密码（首次加载时设置，可通过后台修改）
const DEFAULT_PASSWORD = 'wendy2026';
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
            if (page === 'settings') loadSettings();
        });
    });

    // Sidebar toggle (mobile)
    $('#btnSidebarToggle').addEventListener('click', () => {
        $('.sidebar').classList.toggle('open');
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
            ${b.note ? `<div class="detail-item detail-full"><span class="detail-label">备注</span><span class="detail-value">${b.note}</span></div>` : ''}
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

// ============ SUPABASE INTEGRATION (when configured) ============
let supabase = null;
async function initSupabase() {
    if (SUPABASE_URL.includes('YOUR_PROJECT')) return null; // Not configured yet
    if (supabase) return supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabase;
    } catch (e) {
        console.warn('Supabase 未配置，使用本地存储模式');
        return null;
    }
}

// Sync bookings from Supabase (if available)
async function syncFromSupabase() {
    const client = await initSupabase();
    if (!client) return;
    try {
        const { data, error } = await client.from('bookings').select('*').order('created_at', { ascending: false });
        if (error) throw error;
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
    const client = await initSupabase();
    if (!client) return;
    try {
        await client.from('bookings').update({ status }).eq('id', bookingId);
    } catch (e) {
        console.warn('Supabase 更新失败:', e.message);
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

console.log('%c🔐 Wendy 管理后台已就绪 %c| %c数据存储模式：浏览器本地 + Supabase云同步',
    'color:#c9a96e;font-weight:bold;', '', 'color:#888;');
