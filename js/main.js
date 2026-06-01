/* ============================================
   WENDY MAKEUP STUDIO - Main JavaScript
   ============================================ */

// ============ SUPABASE CONFIG (raw fetch, no SDK) ============
const SUPABASE_URL = 'https://lphlhuyhvntgfrkslews.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGxodXlodm50Z2Zya3NsZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTg3MzcsImV4cCI6MjA5NTY5NDczN30.Fd875TrmTMu8tJ4xgYvn_NeYtDpE16o3QetSMqp2SHA';

function supabaseHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

async function supabaseSaveBooking(booking) {
    try {
        const resp = await fetch(SUPABASE_URL + '/rest/v1/bookings', {
            method: 'POST',
            headers: supabaseHeaders(),
            body: JSON.stringify({
                id: booking.id,
                service: booking.service,
                service_name: booking.serviceName,
                price: booking.servicePrice,
                date: booking.date,
                time: booking.time,
                name: booking.name,
                phone: booking.phone,
                wechat: booking.wechat || '',
                email: booking.email || '',
                location: booking.location,
                note: booking.note || '',
                status: booking.status,
                created_at: booking.createdAt
            })
        });
        if (!resp.ok) console.warn('Cloud save issue:', resp.status);
    } catch(e) { console.warn('Cloud save failed:', e.message); }
}

async function supabaseGetBookedSlots(dateStr) {
    try {
        const resp = await fetch(
            SUPABASE_URL + '/rest/v1/bookings?select=time&date=eq.' + encodeURIComponent(dateStr) + '&status=neq.cancelled',
            { headers: supabaseHeaders() }
        );
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data || []).map(function(b) { return b.time; });
    } catch(e) { return []; }
}

// ============ UTILITY FUNCTIONS ============
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showToast(msg, type = 'info') {
    const container = $('#toastContainer');
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

function generateId() {
    return 'WD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============ PRELOADER ============
function hidePreloader() {
    const preloader = $('#preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
    }
}
// 尽快隐藏：DOM 加载完就可以，不等慢的外部资源
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(hidePreloader, 400);
});
// 兜底：3秒后无论如何强制隐藏
setTimeout(hidePreloader, 3000);
// 正常情况：所有资源加载完隐藏
window.addEventListener('load', () => {
    setTimeout(hidePreloader, 200);
});

// ============ NAVIGATION ============
const navbar = $('#navbar');
const hamburger = $('#hamburger');
const navMenu = $('#navMenu');
const navLinks = $$('.nav-link');

// Scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    updateActiveSection();
    updateBackToTop();
});

// Mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu on link click
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Active section detection
function updateActiveSection() {
    const sections = $$('section[id]');
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        const id = section.getAttribute('id');
        const link = $(`.nav-link[href="#${id}"]`);

        if (link) {
            if (scrollPos >= top && scrollPos < bottom) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        }
    });
}

// ============ HERO PARTICLES ============
function createParticles() {
    const container = $('#heroParticles');
    const count = 30;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = Math.random() * 15 + 10 + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(particle);
    }
}
createParticles();

// ============ COUNTER ANIMATION ============
function animateCounters() {
    const counters = $$('.stat-number[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            counter.textContent = Math.floor(eased * target);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    });
}

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Trigger counter animation when hero stats become visible
            if (entry.target.closest('#home') && entry.target.querySelector('.stat-number[data-target]')) {
                animateCounters();
            }

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

// Also observe hero stats directly
const heroStats = $('.hero-stats');
if (heroStats) {
    const heroObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            heroObserver.unobserve(heroStats);
        }
    }, { threshold: 0.5 });
    heroObserver.observe(heroStats);
}

// ============ BACK TO TOP ============
const backToTopBtn = $('#backToTop');
function updateBackToTop() {
    if (window.scrollY > 600) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============ PORTFOLIO ============
const portfolioData = [
    { id: 1,  cat: 'bridal',    title: '中式新娘造型', desc: '传统秀禾服造型', img: 'img/中式新娘造型.JPG', thumb: 'img/thumb/中式新娘造型-thumb.jpg' },
    { id: 2,  cat: 'bridal',    title: '韩式新娘造型', desc: '水光透亮韩式妆容', img: 'img/韩式新娘造型.JPG', thumb: 'img/thumb/韩式新娘造型-thumb.jpg' },
    { id: 3,  cat: 'evening',   title: '红毯晚宴妆',   desc: '高级感红毯妆容', img: 'img/红毯晚宴妆.JPG', thumb: 'img/thumb/红毯晚宴妆-thumb.jpg' },
    { id: 4,  cat: 'evening',   title: '年会派对妆',   desc: '闪耀吸睛派对造型', img: 'img/年会派对妆.JPG', thumb: 'img/thumb/年会派对妆-thumb.jpg' },
    { id: 5,  cat: 'evening',   title: '名媛晚宴妆',   desc: '优雅名媛风妆容', img: 'img/名媛晚宴妆.JPG', thumb: 'img/thumb/名媛晚宴妆-thumb.jpg' },
    { id: 6,  cat: 'commercial',title: '时尚杂志妆',   desc: '商业杂志封面妆容', img: 'img/时尚杂志妆.JPG', thumb: 'img/thumb/时尚杂志妆-thumb.jpg' },
    { id: 7,  cat: 'commercial',title: '品牌广告妆',   desc: '高端品牌广告造型', img: 'img/品牌广告妆.JPG', thumb: 'img/thumb/品牌广告妆-thumb.jpg' },

    { id: 9,  cat: 'bridal',    title: '西式白纱造型', desc: '经典优雅白纱妆容', color1: '#d4c5c5', color2: '#e8d5d5', icon: 'fa-ring' },
    { id: 10, cat: 'bridal',    title: '户外婚礼造型', desc: '自然清新新娘妆', color1: '#a8c5a0', color2: '#c5d5c0', icon: 'fa-leaf' },
    { id: 11, cat: 'creative',  title: '时装周造型',   desc: 'T台秀场前卫造型', color1: '#16213e', color2: '#e94560', icon: 'fa-feather' },
    { id: 12, cat: 'commercial',title: '电商直播妆',   desc: '高清镜头感妆容', color1: '#fff5f5', color2: '#ffd5d5', icon: 'fa-video' },
];

let portfolioVisible = 6;
let currentFilter = 'all';
let lightboxOpen = false;
let lightboxIndex = 0;
let lightboxItems = [];

function createPortfolioItem(item) {
    const div = document.createElement('div');
    div.className = 'portfolio-item';
    div.setAttribute('data-cat', item.cat);
    if (item.img) {
        // 真实照片：网格用小缩略图，点击灯箱加载大图
        div.innerHTML = `
            <img src="${item.thumb || item.img}" alt="${item.title}" class="portfolio-img" loading="lazy" decoding="async">
            <div class="portfolio-overlay">
                <h4>${item.title}</h4>
                <span>${item.desc}</span>
            </div>
        `;
    } else {
        // 渐变色占位（还没有照片的作品）
        div.innerHTML = `
            <div class="portfolio-img-placeholder" style="background: linear-gradient(135deg, ${item.color1} 0%, ${item.color2} 100%);">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="portfolio-overlay">
                <h4>${item.title}</h4>
                <span>${item.desc}</span>
            </div>
        `;
    }
    div.addEventListener('click', () => openLightbox(item));
    return div;
}

function renderPortfolio(filter = 'all', limit = portfolioVisible) {
    const grid = $('#portfolioGrid');
    const filtered = filter === 'all'
        ? portfolioData
        : portfolioData.filter(item => item.cat === filter);

    grid.innerHTML = '';
    filtered.slice(0, limit).forEach(item => {
        grid.appendChild(createPortfolioItem(item));
    });

    // Update lightbox items
    lightboxItems = filtered.slice(0, limit);

    // Show/hide load more
    const loadMore = $('#loadMorePortfolio');
    if (loadMore) {
        loadMore.style.display = limit >= filtered.length ? 'none' : '';
    }
}

// Filter buttons
$$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        $$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        portfolioVisible = 6;
        renderPortfolio(currentFilter);
    });
});

// Load more
const loadMoreBtn = $('#loadMorePortfolio');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        portfolioVisible += 6;
        renderPortfolio(currentFilter, portfolioVisible);
    });
}

// ============ LIGHTBOX ============
function openLightbox(item) {
    lightboxIndex = lightboxItems.findIndex(i => i.id === item.id);
    updateLightbox();
    $('#lightbox').classList.add('active');
    lightboxOpen = true;
    document.body.style.overflow = 'hidden';
}

function updateLightbox() {
    const item = lightboxItems[lightboxIndex];
    const lightboxImg = $('#lightboxImg');
    const lightboxInfo = $('#lightboxInfo');

    if (item.img) {
        // 真实照片
        lightboxImg.src = item.img;
    } else {
        // 渐变色占位
        lightboxImg.src = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
                <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${item.color1}"/>
                        <stop offset="100%" style="stop-color:${item.color2}"/>
                    </linearGradient>
                </defs>
                <rect fill="url(#g)" width="800" height="600"/>
                <text fill="white" font-size="80" font-family="sans-serif" text-anchor="middle" x="400" y="280" opacity="0.6">
                    <tspan>${item.icon.replace('fa-', '').toUpperCase()}</tspan>
                </text>
                <text fill="white" font-size="24" font-family="sans-serif" text-anchor="middle" x="400" y="340" opacity="0.8">${item.title}</text>
            </svg>
        `)}`;
    }
    lightboxInfo.textContent = `${item.title} — ${item.desc}`;
}

$('#lightboxClose').addEventListener('click', closeLightbox);
$('#lightbox').addEventListener('click', (e) => {
    if (e.target === $('#lightbox')) closeLightbox();
});

$('#lightboxPrev').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightbox();
});

$('#lightboxNext').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    updateLightbox();
});

document.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
        lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
        updateLightbox();
    }
    if (e.key === 'ArrowRight') {
        lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
        updateLightbox();
    }
});

function closeLightbox() {
    $('#lightbox').classList.remove('active');
    lightboxOpen = false;
    document.body.style.overflow = '';
}

// ============ BOOKING SYSTEM ============
let bookingData = {
    service: null,
    serviceName: '',
    servicePrice: 0,
    date: null,
    time: null,
    name: '',
    phone: '',
    wechat: '',
    email: '',
    location: '',
    note: ''
};

let currentStep = 1;
let calendarDate = new Date();
let selectedDate = null;
let selectedTime = null;

// Time slots
const allTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

// Get bookings from localStorage
function getStoredBookings() {
    try {
        return JSON.parse(localStorage.getItem('wendy_bookings') || '[]');
    } catch {
        return [];
    }
}

function saveBookings(bookings) {
    localStorage.setItem('wendy_bookings', JSON.stringify(bookings));
}

async function getBookedSlots(dateStr) {
    const localSlots = getStoredBookings()
        .filter(b => b.date === dateStr && b.status !== 'cancelled')
        .map(b => b.time);
    const cloudSlots = await supabaseGetBookedSlots(dateStr);
    return [...new Set([...localSlots, ...cloudSlots])];
}

// Step navigation
function goToStep(step) {
    $$('.booking-step').forEach(s => s.classList.remove('active'));
    $(`#bStep${step}`).classList.add('active');
    currentStep = step;

    // Update step indicators
    $$('.step-indicator').forEach(ind => {
        const s = parseInt(ind.getAttribute('data-bstep'));
        ind.classList.remove('active', 'completed');
        if (s < step) ind.classList.add('completed');
        if (s === step) ind.classList.add('active');
    });
    $$('.step-line').forEach(line => {
        const l = parseInt(line.getAttribute('data-bline'));
        line.classList.toggle('completed', l < step);
    });

    if (step === 4) updateBookingSummary();
}

// Step 1: Service selection
$$('input[name="service"]').forEach(input => {
    input.addEventListener('change', () => {
        bookingData.service = input.value;
        bookingData.serviceName = input.closest('label').querySelector('strong').textContent;
        bookingData.servicePrice = parseInt(input.getAttribute('data-price'));
        $('#toStep2').disabled = false;
    });
});

$('#toStep2').addEventListener('click', () => {
    if (!bookingData.service) {
        showToast('请先选择服务项目', 'error');
        return;
    }
    goToStep(2);
    renderCalendar();
});

// Step 2: Calendar
function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    $('#calMonthYear').textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysGrid = $('#calendarDays');
    daysGrid.innerHTML = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyBtn = document.createElement('button');
        emptyBtn.className = 'empty';
        emptyBtn.disabled = true;
        daysGrid.appendChild(emptyBtn);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const btn = document.createElement('button');
        btn.textContent = day;

        const dateObj = new Date(year, month, day);
        const dateStr = formatDate(dateObj);

        // Disable past dates
        if (dateObj < today) {
            btn.classList.add('disabled');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => selectDate(dateObj, dateStr, btn));
        }

        // Today marker
        if (dateObj.getTime() === today.getTime()) {
            btn.classList.add('today');
        }

        // Selected date
        if (selectedDate === dateStr) {
            btn.classList.add('selected');
        }

        daysGrid.appendChild(btn);
    }
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function selectDate(dateObj, dateStr, btn) {
    selectedDate = dateStr;
    bookingData.date = dateStr;
    selectedTime = null;
    bookingData.time = null;

    // Update calendar UI
    $$('.calendar-days button.selected').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Render time slots
    renderTimeSlots(dateStr);

    // Update next button
    updateStep2Button();
}

async function renderTimeSlots(dateStr) {
    const grid = $('#timeslotGrid');
    const bookedSlots = await getBookedSlots(dateStr);

    // Filter out past times for today
    const now = new Date();
    const todayStr = formatDate(now);

    grid.innerHTML = '';
    allTimeSlots.forEach(time => {
        const btn = document.createElement('button');
        btn.className = 'timeslot-btn';
        btn.textContent = time;

        const isBooked = bookedSlots.includes(time);
        const isPast = dateStr === todayStr && time <= now.toTimeString().slice(0, 5);

        if (isBooked || isPast) {
            btn.classList.add('booked');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => {
                $$('.timeslot-btn.selected').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedTime = time;
                bookingData.time = time;
                updateStep2Button();

                // Show selected time
                const selectedDisplay = $('#timeslotSelected');
                selectedDisplay.style.display = 'flex';
                selectedDisplay.querySelector('span').textContent = `已选择：${dateStr} ${time}`;
            });
        }

        grid.appendChild(btn);
    });
}

function updateStep2Button() {
    $('#toStep3').disabled = !(selectedDate && selectedTime);
}

$('#calPrev').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
    if (selectedDate) {
        // Re-highlight selected date
        setTimeout(() => {
            const btns = $$('.calendar-days button');
            btns.forEach(b => {
                if (b.textContent && !b.classList.contains('empty') && !b.classList.contains('disabled')) {
                    const d = parseInt(b.textContent);
                    const checkStr = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d));
                    if (checkStr === selectedDate) b.classList.add('selected');
                }
            });
        }, 50);
    }
});

$('#calNext').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
    if (selectedDate) {
        setTimeout(() => {
            const btns = $$('.calendar-days button');
            btns.forEach(b => {
                if (b.textContent && !b.classList.contains('empty') && !b.classList.contains('disabled')) {
                    const d = parseInt(b.textContent);
                    const checkStr = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d));
                    if (checkStr === selectedDate) b.classList.add('selected');
                }
            });
        }, 50);
    }
});

$('#toStep3').addEventListener('click', () => goToStep(3));
$('#backToStep1').addEventListener('click', () => goToStep(1));

// Step 3: Contact info
$('#backToStep2').addEventListener('click', () => goToStep(2));

$('#toStep4').addEventListener('click', () => {
    const name = $('#custName').value.trim();
    const phone = $('#custPhone').value.trim();
    const location = $('#custLocation').value.trim();

    // Validate
    if (!name) { showToast('请输入姓名', 'error'); $('#custName').focus(); return; }
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        showToast('请输入正确的手机号', 'error');
        $('#custPhone').focus();
        return;
    }
    if (!location) { showToast('请输入服务地址', 'error'); $('#custLocation').focus(); return; }

    bookingData.name = name;
    bookingData.phone = phone;
    bookingData.wechat = $('#custWechat').value.trim();
    bookingData.email = $('#custEmail').value.trim();
    bookingData.location = location;
    bookingData.note = $('#custNote').value.trim();

    goToStep(4);
});

// Step 4: Confirmation
function updateBookingSummary() {
    const summary = $('#bookingSummary');
    const serviceNames = {
        bridal: '新娘妆容造型', evening: '晚宴/派对妆容',
        commercial: '商业拍摄妆容', personal: '个人形象设计',
        trial: '试妆体验', group: '团体造型服务'
    };

    summary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">服务项目</span>
            <span class="summary-value">${serviceNames[bookingData.service] || bookingData.service}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">预约日期</span>
            <span class="summary-value">${bookingData.date}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">预约时间</span>
            <span class="summary-value">${bookingData.time}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">姓名</span>
            <span class="summary-value">${bookingData.name}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">手机号</span>
            <span class="summary-value">${bookingData.phone}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">服务地址</span>
            <span class="summary-value">${bookingData.location}</span>
        </div>
        ${bookingData.wechat ? `<div class="summary-row"><span class="summary-label">微信</span><span class="summary-value">${bookingData.wechat}</span></div>` : ''}
        ${bookingData.note ? `<div class="summary-row"><span class="summary-label">备注</span><span class="summary-value">${bookingData.note}</span></div>` : ''}
        <div class="summary-row">
            <span class="summary-label">预估价格</span>
            <span class="summary-value" style="color: var(--color-primary); font-size: 1.2rem;">¥${bookingData.servicePrice.toLocaleString()} 起</span>
        </div>
    `;
}

$('#backToStep3').addEventListener('click', () => goToStep(3));

$('#confirmBooking').addEventListener('click', async () => {
    const bookingId = generateId();
    const newBooking = {
        id: bookingId,
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const bookings = getStoredBookings();
    bookings.push(newBooking);
    saveBookings(bookings);

    // Sync to Supabase cloud
    await supabaseSaveBooking(newBooking);

    // Show success
    $('#modalBookingId').textContent = bookingId;
    $('#bookingSuccessModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset form
    resetBookingForm();
});

$('#closeModal').addEventListener('click', () => {
    $('#bookingSuccessModal').classList.remove('active');
    document.body.style.overflow = '';
});

function resetBookingForm() {
    bookingData = {
        service: null, serviceName: '', servicePrice: 0,
        date: null, time: null, name: '', phone: '',
        wechat: '', email: '', location: '', note: ''
    };
    selectedDate = null;
    selectedTime = null;
    $$('input[name="service"]').forEach(i => i.checked = false);
    $('#toStep2').disabled = true;
    $('#custName').value = '';
    $('#custPhone').value = '';
    $('#custWechat').value = '';
    $('#custEmail').value = '';
    $('#custLocation').value = '';
    $('#custNote').value = '';
    $('#timeslotGrid').innerHTML = '<p class="timeslot-hint">请先在日历中选择日期</p>';
    $('#timeslotSelected').style.display = 'none';
    goToStep(1);
}

// ============ MY BOOKINGS MODAL ============
const floatBookingsBtn = $('#floatMyBookings');
const myBookingsModal = $('#myBookingsModal');
const myBookingsList = $('#myBookingsList');

floatBookingsBtn.addEventListener('click', () => {
    renderMyBookings();
    myBookingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

$('#closeBookingsModal').addEventListener('click', () => {
    myBookingsModal.classList.remove('active');
    document.body.style.overflow = '';
});

myBookingsModal.addEventListener('click', (e) => {
    if (e.target === myBookingsModal) {
        myBookingsModal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

function renderMyBookings() {
    const bookings = getStoredBookings();
    const serviceNames = {
        bridal: '新娘妆容造型', evening: '晚宴/派对妆容',
        commercial: '商业拍摄妆容', personal: '个人形象设计',
        trial: '试妆体验', group: '团体造型服务'
    };

    if (bookings.length === 0) {
        myBookingsList.innerHTML = '<p class="no-bookings">暂无预约记录</p>';
        return;
    }

    myBookingsList.innerHTML = bookings.map(b => `
        <div class="booking-item">
            <div class="booking-item-info">
                <strong>${serviceNames[b.service] || b.service}</strong>
                <span>${b.date} ${b.time} | ${b.location}</span>
                <span style="display:block;font-size:0.75rem;color:var(--color-text-lighter);margin-top:2px;">
                    编号：${b.id}
                </span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="booking-item-status status-${b.status}">
                    ${b.status === 'pending' ? '待确认' : b.status === 'confirmed' ? '已确认' : '已取消'}
                </span>
                ${b.status === 'pending' ? `<button class="btn-cancel-booking" onclick="cancelBooking('${b.id}')">取消</button>` : ''}
            </div>
        </div>
    `).join('');
}

window.cancelBooking = function(bookingId) {
    if (!confirm('确定要取消此预约吗？')) return;
    const bookings = getStoredBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx > -1) {
        bookings[idx].status = 'cancelled';
        saveBookings(bookings);
        renderMyBookings();
        showToast('预约已取消', 'info');
    }
};

// ============ TESTIMONIALS CAROUSEL ============
const testimonials = [
    {
        stars: 5,
        text: '非常感谢Wendy老师！婚礼当天所有人都在夸我的妆容，从试妆到婚礼全程都非常专业和耐心。中式造型和西式白纱都美到不可思议，让我在最重要的日子里成为最美的新娘。',
        name: '李婷婷',
        role: '新娘 · 2026年3月'
    },
    {
        stars: 5,
        text: '公司年会找了Wendy做造型，效果惊艳！她特别擅长根据每个人的气质来设计妆容，不千篇一律。持妆效果也是一流，整晚活动下来妆容依然完美。',
        name: '陈雨萱',
        role: '企业高管 · 2026年1月'
    },
    {
        stars: 5,
        text: '我的皮肤比较敏感，Wendy非常细心地提前了解我的肤质情况，使用的产品也很温和。出来的效果超出预期，朋友们都说我像换了一个人，但又不会认不出来，真的很神奇！',
        name: '王思怡',
        role: '试妆客户 · 2026年4月'
    },
    {
        stars: 5,
        text: '五年经验真的不一样！Wendy的手法非常轻柔专业，妆容细腻高级，完全不是那种厚重的影楼风。她还会教很多实用的化妆小技巧，物超所值！',
        name: '张璐',
        role: '个人形象设计 · 2026年5月'
    },
    {
        stars: 5,
        text: '拍摄广告找的Wendy，她对镜头感的把握太强了。化妆的时候就会考虑到光线、角度，拍出来的照片完全不需要后期修妆容。合作非常愉快，已经是长期合作伙伴了。',
        name: '林摄影师',
        role: '商业合作 · 2025年12月'
    }
];

function createTestimonialCard(t) {
    const starsHTML = Array.from({ length: t.stars }, () => '<i class="fas fa-star"></i>').join('');
    return `
        <div class="testimonial-card">
            <div class="testimonial-card-inner">
                <div class="testimonial-stars">${starsHTML}</div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-author">${t.name}</div>
                <span class="testimonial-role">${t.role}</span>
            </div>
        </div>
    `;
}

let testimonialIndex = 0;
const testimonialTrack = $('#testimonialTrack');
const testimonialDots = $('#testimonialDots');

function initTestimonials() {
    testimonialTrack.innerHTML = testimonials.map(t => createTestimonialCard(t)).join('');
    testimonialDots.innerHTML = testimonials.map((_, i) =>
        `<span class="testimonial-dot${i === 0 ? ' active' : ''}" data-tindex="${i}"></span>`
    ).join('');

    // Dot clicks
    $$('.testimonial-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToTestimonial(parseInt(dot.getAttribute('data-tindex')));
        });
    });
}

function goToTestimonial(index) {
    testimonialIndex = index;
    testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
    $$('.testimonial-dot').forEach((d, i) => d.classList.toggle('active', i === index));
}

$('#testPrev').addEventListener('click', () => {
    const newIndex = (testimonialIndex - 1 + testimonials.length) % testimonials.length;
    goToTestimonial(newIndex);
});

$('#testNext').addEventListener('click', () => {
    const newIndex = (testimonialIndex + 1) % testimonials.length;
    goToTestimonial(newIndex);
});

// Auto-rotate
let testimonialInterval;
function startTestimonialAuto() {
    testimonialInterval = setInterval(() => {
        goToTestimonial((testimonialIndex + 1) % testimonials.length);
    }, 5000);
}
function stopTestimonialAuto() {
    clearInterval(testimonialInterval);
}
$('#testimonialsCarousel').addEventListener('mouseenter', stopTestimonialAuto);
$('#testimonialsCarousel').addEventListener('mouseleave', startTestimonialAuto);

// ============ BLOG ARTICLES ============
const blogArticles = {
    1: {
        tag: '新娘妆容',
        title: '2026新娘妆容趋势：清透裸感高级妆',
        date: '2026年5月20日',
        reads: '2.3k',
        body: `
            <p>准备结婚的准新娘们一定都在纠结：婚礼当天到底化什么妆？2026年的新娘妆容趋势已经非常明朗——<strong>清透裸感高级妆</strong>。告别厚重假面感和过度修图式化妆，今年流行的是"化了像没化，但就是美了十倍"的高级妆感。</p>

            <h3>趋势一：原生光泽肌</h3>
            <p>底妆不再追求完美无瑕的哑光遮盖，而是强调肌肤本身的通透光泽感。关键在于妆前保湿打底要充足，选择轻薄的液态粉底或气垫，用湿润的美妆蛋少量多次拍开，打造"天生好皮"的质感。局部瑕疵用遮瑕膏精准遮盖，保留面部自然的纹理和光泽。</p>
            <div class="tip-box"><strong>💡 Wendy的小提示</strong>妆前敷一片保湿面膜，等待5分钟后按摩吸收再上妆，底妆服帖度能提升一倍。</div>

            <h3>趋势二：柔雾感眼妆</h3>
            <p>浓烈的烟熏妆已经退场，取而代之的是柔和的雾感眼妆。选用奶茶色、杏仁色、干枯玫瑰色系的眼影，大面积晕染在眼窝，边缘过渡自然，没有明显的色块边界。眼线也以深棕色替代纯黑色，用眼线胶笔画出内眼线后再用小刷子晕开，眼神温柔又有神。</p>
            <p>假睫毛方面，不再追求夸张浓密，而是选择单簇的仙子毛分段粘贴在眼尾，自然拉长眼型。</p>

            <h3>趋势三：原生感眉毛</h3>
            <p>野生眉依然是主流，但2026年更强调"梳理感"而非"描画感"。用透明的眉蜡或眉皂顺着眉毛生长方向梳理定型，空缺处用极细眉笔一根根补画，保留毛流感。眉色选择比发色浅一度的灰棕色最自然。</p>

            <h3>趋势四：水光腮红唇</h3>
            <p>腮红和唇妆统一色系是今年的核心法则。选择豆沙粉、蜜桃色或肉桂色的腮红膏，用手指拍在苹果肌并向上晕开到太阳穴位置，再用同色系用在嘴唇上，整体妆容和谐统一。唇妆偏好水光感的唇釉或唇蜜，饱满水润。</p>

            <h3>Wendy给准新娘的3个建议</h3>
            <p><strong>1. 至少提前一个月试妆：</strong>试妆不仅是看效果，更是和化妆师磨合的过程。带上婚纱照片、喜欢的妆容参考图，和化妆师充分沟通。</p>
            <p><strong>2. 婚礼前一周不要做任何面部项目：</strong>包括针清、去角质、尝试新产品等。此时皮肤状态稳定最重要。</p>
            <p><strong>3. 前一天保证充足睡眠：</strong>再好的化妆品也比不上饱满的精神状态。敷个补水面膜，早点休息。</p>
        `
    },
    2: {
        tag: '持妆技巧',
        title: '夏季持妆全攻略：8小时不脱妆的秘密',
        date: '2026年5月8日',
        reads: '1.8k',
        body: `
            <p>夏天化妆最怕什么？<strong>脱妆、浮粉、斑驳、出油。</strong>早上花一小时精心化的妆，出门两小时就面目全非。作为专业化妆师，Wendy今天就把压箱底的持妆秘籍全部公开，从妆前护肤到最后一层定妆，每一步都有讲究。</p>

            <h3>第一步：妆前护肤要做减法</h3>
            <p>很多人觉得夏天出油要多涂控油产品，结果越控越油。原因是皮肤感到干燥反而会分泌更多油脂。正确做法是：<strong>精简护肤步骤，做好基础保湿即可</strong>。水→精华→乳液，每层充分吸收后再涂下一层。护肤完成后等待3-5分钟，用手背贴脸感受——微黏但不油腻，这才是最佳上妆状态。</p>
            <div class="tip-box"><strong>💡 Wendy的小提示</strong>T区爱出油的部位，护肤时乳液只需轻轻带过，不要厚涂。妆前乳也分区域使用：T区用控油型，脸颊用保湿型。</div>

            <h3>第二步：粉底要"少量多次"</h3>
            <p>夏季粉底最忌厚涂。挤出黄豆大小的量，先用手指在脸上点开，再用湿润的美妆蛋从面中向外拍开。注意是"拍"不是"抹"——拍打能让粉底和皮肤融为一体。第一层打底后，需要遮瑕的部位再局部叠加第二层，不要全脸堆叠。</p>
            <p>粉底选择上，夏季推荐防水型或长效持妆型产品。如果本身肤质好，可以直接用带润色效果的防晒+局部遮瑕替代全脸粉底。</p>

            <h3>第三步：定妆也要分区域</h3>
            <p>这是最关键的一步，也是专业化妆师和普通人的区别所在：<strong>不同区域用不同方法定妆</strong>。</p>
            <ul>
                <li><strong>T区（额头+鼻子）：</strong>用粉扑蘸取透明散粉，揉搓均匀后用力按压在皮肤上。不是扫，是按！让粉和底妆"焊"在一起。</li>
                <li><strong>眼下+鼻翼：</strong>用小号刷子蘸取散粉，轻轻按压定妆。这两个地方最容易卡粉积线，粉量一定要少。</li>
                <li><strong>脸颊+下巴：</strong>用大号刷子轻扫即可，保留皮肤自然光泽。</li>
            </ul>

            <h3>第四步：定妆喷雾的正确用法</h3>
            <p>不是简单喷一下就行。正确方法是：底妆完成喷一层→等干→全妆完成再喷一层。喷的时候距离面部30cm左右，呈X形和T形两次喷，均匀覆盖全脸。</p>

            <h3>随身必备补妆三件套</h3>
            <p>再好的定妆也扛不住全天候的考验，补妆技巧同样重要：</p>
            <ul>
                <li><strong>吸油纸（不是吸油面纸）：</strong>出油时先按压吸掉多余油脂，不要直接扑粉——油+粉=搓泥。</li>
                <li><strong>透明蜜粉饼：</strong>吸油后用粉扑蘸取少量，按压在出油区域。</li>
                <li><strong>口红/唇釉：</strong>饭后补涂，保持精致。</li>
            </ul>
        `
    },
    3: {
        tag: '妆前护肤',
        title: '妆前护肤黄金法则：底妆服帖一整天的秘诀',
        date: '2026年4月28日',
        reads: '3.1k',
        body: `
            <p>很多客人问我："Wendy，为什么你化的底妆那么服帖，我自己化总是浮粉卡纹？"答案其实不在化妆品上，<strong>而在化妆前的护肤步骤里</strong>。好的妆容七分靠护肤，三分才靠产品手法。</p>

            <h3>妆前护肤≠日常护肤</h3>
            <p>妆前护肤的目标很明确：<strong>让皮肤水润充盈、表面平滑、不油腻</strong>。这和睡前护肤的"滋养修护"目的完全不同。妆前护肤产品选错了，底妆灾难现场就是必然结果。</p>

            <h3>黄金法则一：清洁到位但不刺激</h3>
            <p>早晨用温和的氨基酸洁面产品洗脸即可，不需要强力清洁或去角质。如果前一晚做好了晚间护肤，早上甚至可以用清水洗。过度清洁会破坏皮脂膜，皮肤反而干燥紧绷，粉底一上去就卡。</p>

            <h3>黄金法则二：化妆水要拍三遍</h3>
            <p>不是夸张，韩国化妆师的"七水法"核心就是这个原理：每次倒少量化妆水在掌心，轻拍至吸收后再拍第二遍，共三遍。皮肤含水量充分后自然饱满，细纹和毛孔都会暂时"隐形"。每一遍之间等10秒让皮肤吸收。</p>
            <div class="tip-box"><strong>💡 Wendy的小提示</strong>选择成分简单的保湿型化妆水即可，避免含酒精、果酸等刺激成分的产品。妆前不是刷酸的时候。</div>

            <h3>黄金法则三：精华选"补水"不选"滋养"</h3>
            <p>妆前精华首选透明质酸（玻尿酸）类补水精华，质地清爽好吸收。粘稠的抗老精华、油状的修复精华留给晚上，白天用会和后续防晒、粉底搓泥。取两泵精华在手心搓开，按压上脸，利用手心的温度帮助吸收。</p>

            <h3>黄金法则四：乳液/面霜看肤质选</h3>
            <p>油皮选乳液，干皮选轻薄面霜。取适量在手心搓开再按压上脸，不要直接在脸上点五坨——那样有的地方多有的地方少，底妆自然不均匀。涂完后等3分钟让产品充分吸收，再摸脸应该是软软的但不粘手。</p>

            <h3>黄金法则五：防晒是最后一步护肤</h3>
            <p>防晒不仅是护肤必需，也是底妆的"底漆"。选一款成膜快、不泛白、不搓泥的防晒霜，涂完后等5-10分钟成膜再上妆前乳和粉底。这一步千万别急——防晒没成膜就上粉底，必搓泥。</p>

            <h3>不同肤质的妆前重点</h3>
            <ul>
                <li><strong>干皮：</strong>重点是补水补油，妆前可以加一滴护肤油混合在粉底里，底妆更贴。</li>
                <li><strong>油皮：</strong>重点是控油不拔干。选择清爽型产品，T区用控油妆前乳局部打底。</li>
                <li><strong>混合皮：</strong>分区护理。脸颊按干皮处理，T区按油皮处理。</li>
                <li><strong>敏感皮：</strong>尽量精简步骤。化妆水+乳液即可，避免含香精酒精的产品。</li>
            </ul>

            <h3>妆前急救：15分钟急救法</h3>
            <p>如果当天皮肤状态特别差（熬夜、干燥、暗沉），可以在洁面后敷一张保湿面膜10分钟，取下后按摩吸收，再用清水冲掉多余精华，然后按正常步骤护肤。这个方法能让皮肤瞬间回到水润状态，是化妆师后台的标配操作。</p>
        `
    }
};

// Blog card click → open article modal
function initBlogCards() {
    $$('.blog-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-article');
            const art = blogArticles[id];
            if (!art) return;
            $('#blogArticleContent').innerHTML = `
                <div class="blog-art-header">
                    <span class="blog-art-tag">${art.tag}</span>
                    <h2 class="blog-art-title">${art.title}</h2>
                    <div class="blog-art-meta">
                        <span><i class="far fa-calendar"></i> ${art.date}</span>
                        <span><i class="far fa-eye"></i> 阅读 ${art.reads}</span>
                    </div>
                </div>
                <div class="blog-art-body">${art.body}</div>
                <div class="blog-art-cta">
                    <p>想让Wendy为你量身打造专属妆容？</p>
                    <a href="#booking" class="btn-primary">立即预约妆容设计</a>
                </div>
            `;
            $('#blogModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    $('#closeBlogModal').addEventListener('click', () => {
        $('#blogModal').classList.remove('active');
        document.body.style.overflow = '';
    });
    $('#blogModal').addEventListener('click', (e) => {
        if (e.target === $('#blogModal')) {
            $('#blogModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ============ FAQ ACCORDION ============
$$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isActive = item.classList.contains('active');

        // Close all
        $$('.faq-item').forEach(fi => fi.classList.remove('active'));

        // Open clicked
        if (!isActive) item.classList.add('active');
    });
});

// ============ CONTACT FORM ============
$('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#contactName').value.trim();
    const phone = $('#contactPhone').value.trim();
    const message = $('#contactMessage').value.trim();

    if (!name || !phone || !message) {
        showToast('请填写所有必填字段', 'error');
        return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
        showToast('请输入正确的手机号', 'error');
        return;
    }

    showToast('消息已发送！Wendy会尽快与您联系。', 'success');
    $('#contactForm').reset();
});

// ============ NEWSLETTER ============
$('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('请输入有效的邮箱地址', 'error');
        return;
    }
    showToast('订阅成功！感谢关注。', 'success');
    e.target.reset();
});

// ============ BOOKING MODAL CLOSE ON OVERLAY CLICK ============
$('#bookingSuccessModal').addEventListener('click', (e) => {
    if (e.target === $('#bookingSuccessModal')) {
        $('#bookingSuccessModal').classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============ INITIALIZATION ============
function init() {
    renderPortfolio();
    initTestimonials();
    initBlogCards();
    startTestimonialAuto();
    // Initialize first FAQ item as open
    const firstFaq = $('.faq-item');
    if (firstFaq) firstFaq.classList.add('active');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============ CLOSE MODALS WITH ESCAPE ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if ($('#bookingSuccessModal').classList.contains('active')) {
            $('#bookingSuccessModal').classList.remove('active');
            document.body.style.overflow = '';
        }
        if ($('#myBookingsModal').classList.contains('active')) {
            $('#myBookingsModal').classList.remove('active');
            document.body.style.overflow = '';
        }
        if ($('#blogModal').classList.contains('active')) {
            $('#blogModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

console.log('%c✨ Wendy Makeup Studio %c网站已就绪',
    'font-size:1.2em;font-family:serif;color:#c9a96e;',
    'font-size:0.9em;color:#888;');
console.log('%c💄 所有功能已加载：在线预约 | 作品展示 | 客户评价 | 联系表单',
    'color:#888;');
