/* ============================================
   WENDY MAKEUP STUDIO - Main JavaScript
   ============================================ */

// ============ SUPABASE CONFIG ============
const SUPABASE_URL = 'https://lphlhuyhvntgfrkslews.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGxodXlodm50Z2Zya3NsZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMTg3MzcsImV4cCI6MjA5NTY5NDczN30.Fd875TrmTMu8tJ4xgYvn_NeYtDpE16o3QetSMqp2SHA';
let supabase = null;
function getSupabase() {
    if (SUPABASE_URL.includes('YOUR_PROJECT')) return null;
    if (!supabase && window.supabase) {
        try { supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
        catch(e) { console.warn('Supabase init failed:', e); }
    }
    return supabase;
}

async function supabaseSaveBooking(booking) {
    const client = getSupabase();
    if (!client) return;
    try {
        const { error } = await client.from('bookings').insert({
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
        });
        if (error) console.warn('Supabase save error:', error.message);
    } catch(e) { console.warn('Supabase save failed:', e); }
}

async function supabaseGetBookedSlots(dateStr) {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data } = await client.from('bookings')
            .select('time')
            .eq('date', dateStr)
            .neq('status', 'cancelled');
        return (data || []).map(b => b.time);
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
    { id: 1,  cat: 'bridal',    title: '中式新娘造型', desc: '传统秀禾服造型', img: 'img/中式新娘造型.JPG' },
    { id: 2,  cat: 'bridal',    title: '韩式新娘造型', desc: '水光透亮韩式妆容', img: 'img/韩式新娘造型.JPG' },
    { id: 3,  cat: 'evening',   title: '红毯晚宴妆',   desc: '高级感红毯妆容', img: 'img/红毯晚宴妆.JPG' },
    { id: 4,  cat: 'evening',   title: '年会派对妆',   desc: '闪耀吸睛派对造型', img: 'img/年会派对妆.JPG' },
    { id: 5,  cat: 'evening',   title: '名媛晚宴妆',   desc: '优雅名媛风妆容', img: 'img/名媛晚宴妆.JPG' },
    { id: 6,  cat: 'commercial',title: '时尚杂志妆',   desc: '商业杂志封面妆容', img: 'img/时尚杂志妆.JPG' },
    { id: 7,  cat: 'commercial',title: '品牌广告妆',   desc: '高端品牌广告造型', img: 'img/品牌广告妆.JPG' },
    { id: 8,  cat: 'creative',  title: '创意艺术妆',   desc: '前卫创意妆容设计', img: 'img/创意艺术妆.JPG' },
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
        // 真实照片
        div.innerHTML = `
            <img src="${item.img}" alt="${item.title}" class="portfolio-img" loading="lazy">
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
        text: '十年经验真的不一样！Wendy的手法非常轻柔专业，妆容细腻高级，完全不是那种厚重的影楼风。她还会教很多实用的化妆小技巧，物超所值！',
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

// ============ BLOG CARDS ============
const blogPosts = [
    {
        tag: '新娘妆容',
        title: '2026新娘妆容趋势：高级感轻透妆',
        excerpt: '告别厚重假面感，今年最流行的新娘妆容以清透自然为主，强调肌肤本身的光泽感...',
        date: '2026-05-15',
        color1: '#f5e6e0', color2: '#e8d5cd', icon: '💍'
    },
    {
        tag: '化妆技巧',
        title: '夏季持妆秘籍：8小时不脱妆的秘密',
        excerpt: '夏天到了，如何让妆容在高温下持久服帖？Wendy分享专业持妆技巧，从妆前护肤到定妆步骤全解析...',
        date: '2026-05-08',
        color1: '#e0f0f5', color2: '#c8dce5', icon: '☀️'
    },
    {
        tag: '护肤指南',
        title: '妆前护肤的黄金法则：让妆容更服帖',
        excerpt: '好的妆容从护肤开始。了解妆前护肤的正确步骤和产品选择，让你的妆容质感提升一个档次...',
        date: '2026-04-28',
        color1: '#f0e8f0', color2: '#e0d0e0', icon: '✨'
    },
];

function renderBlogPosts() {
    const grid = $('#blogGrid');
    if (!grid) return;
    grid.innerHTML = blogPosts.map(post => `
        <div class="blog-card">
            <div class="blog-card-image" style="background: linear-gradient(135deg, ${post.color1}, ${post.color2});">
                <span style="font-size:3rem;">${post.icon}</span>
            </div>
            <div class="blog-card-body">
                <span class="blog-card-tag">${post.tag}</span>
                <h4>${post.title}</h4>
                <p>${post.excerpt}</p>
            </div>
            <div class="blog-card-footer">
                <i class="far fa-calendar"></i> ${post.date}
            </div>
        </div>
    `);
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
    renderBlogPosts();
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
    }
});

console.log('%c✨ Wendy Makeup Studio %c网站已就绪',
    'font-size:1.2em;font-family:serif;color:#c9a96e;',
    'font-size:0.9em;color:#888;');
console.log('%c💄 所有功能已加载：在线预约 | 作品展示 | 客户评价 | 联系表单',
    'color:#888;');
