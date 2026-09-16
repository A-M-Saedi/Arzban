const API_BASE = '';

/* ─── Downloaded image maps ─────────────────────────────── */
const COIN_IMAGES = {
    'بیت کوین': '/static/pricess/images/crypto/bitcoin.png',
    'اتریوم':   '/static/pricess/images/crypto/ethereum.png',
    'تتر':      '/static/pricess/images/crypto/tether.png',
    'ترون':     '/static/pricess/images/crypto/tron.png',
    'ریپل':     '/static/pricess/images/crypto/ripple.png',
};

const FLAG_IMAGES = {
    'دلار آمریکا':  '/static/pricess/images/flags/us.png',
    'یورو':         '/static/pricess/images/flags/eu.png',
    'پوند':         '/static/pricess/images/flags/gb.png',
    'دلار کانادا':  '/static/pricess/images/flags/ca.png',
    'لیر ترکیه':    '/static/pricess/images/flags/tr.png',
    'درهم امارات':  '/static/pricess/images/flags/ae.png',
    'یوان چین':     '/static/pricess/images/flags/cn.png',
    'فرانک سوئیس':  '/static/pricess/images/flags/ch.png',
    'روپیه هند':    '/static/pricess/images/flags/in.png',
    'دینار عراق':   '/static/pricess/images/flags/iq.png',
    'ریال عربستان': '/static/pricess/images/flags/sa.png',
};

const SECTION_IMAGES = {
    'currency': '/static/pricess/images/nav/currency.png',
    'gold':     '/static/pricess/images/nav/gold.png',
    'crypto':   '/static/pricess/images/nav/crypto.png',
    'oil':      '/static/pricess/images/nav/oil.png',
};

function getItemIconHtml(name) {
    const src = COIN_IMAGES[name] || FLAG_IMAGES[name];
    if (src) {
        return `<img src="${src}" class="item-icon" alt="${name}" loading="lazy">`;
    }
    return `<i class="${getIconForName(name)}" aria-hidden="true" style="color: var(--color3); margin-left: 8px;"></i>`;
}

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching:', endpoint, error);
        return [];
    }
}

async function updateTicker() {
    const tickerList = document.getElementById('tickerList');
    if (!tickerList) return;

    const importantItems = ['دلار آمریکا', 'یورو', 'سکه امامی', 'طلای ۱۸ عیار', 'بیت کوین', 'انس طلا'];
    const allData = await fetchAPI('/api/home-items/');

    const tickerItems = allData.filter(item => importantItems.includes(item.name));

    if (tickerItems.length > 0) {
        let html = '';
        tickerItems.forEach(item => {
            const changeClass = item.change > 0 ? 'positive' : item.change < 0 ? 'negative' : '';
            const arrow = item.change > 0 ? '▲' : item.change < 0 ? '▼' : '—';
            const changeText = item.change ? `${Math.abs(item.change)}%` : '';

            html += `
                <li class="price-list-item">
                    ${item.name}
                    <span class="price-list-price">${item.numeric_value.toLocaleString()}</span> ریال
                    ${changeText ? `<span class="${changeClass}"><em class="change-arrow">${arrow}</em>${changeText}</span>` : ''}
                </li>
            `;
        });
        // Duplicate for seamless infinite scroll
        tickerList.innerHTML = html + html;
    } else {
        tickerList.innerHTML = '<li class="price-list-item">در حال بارگذاری...</li>';
    }
}

function getIconForName(name) {
    if (name.includes('دلار')) return 'fas fa-dollar-sign';
    if (name.includes('یورو')) return 'fas fa-euro-sign';
    if (name.includes('پوند')) return 'fas fa-pound-sign';
    if (name.includes('لیر')) return 'fas fa-lira-sign';
    if (name.includes('طلا') || name.includes('سکه')) return 'fas fa-gem';
    if (name.includes('بیت')) return 'fas fa-coins';  
    if (name.includes('اتریوم')) return 'fas fa-coins';
    if (name.includes('تتر')) return 'fas fa-dollar-sign';
    if (name.includes('نفت')) return 'fas fa-oil-can';
    return 'fas fa-chart-line';
}

function renderTable(data, title, headerIcon, category) {
    if (!data || data.length === 0) {
        return `
            <div class="table-section">
                <div class="table-header">
                    <i class="fas ${headerIcon}" style="font-size: 28px; color: var(--color3);"></i>
                    <h3>${title}</h3>
                </div>
                <p style="color: var(--color5); text-align: center; padding: 20px;">اطلاعاتی برای نمایش وجود ندارد</p>
            </div>
        `;
    }
    
    let currencyUnit = 'ریال';
    if (category === 'crypto' || category === 'oil') {
        currencyUnit = 'دلار';
    }
    
    const tableId = `table-${category}`;
    const tblSectionImg = SECTION_IMAGES[category];
    const tblHeaderIcon = tblSectionImg
        ? `<img src="${tblSectionImg}" class="table-section-icon" alt="${title}">`
        : `<i class="fas ${headerIcon}" style="font-size:28px;color:var(--color3);" aria-hidden="true"></i>`;
    let html = `
        <div class="table-section">
            <div class="table-header">
                ${tblHeaderIcon}
                <h3>${title}</h3>
            </div>
            <div class="price-search-wrap" style="margin-bottom:14px;">
                <img src="/static/pricess/images/nav/search.png" class="search-icon-img" alt="">
                <input class="price-search" type="text" placeholder="جستجو..." data-table="${tableId}" aria-label="جستجو در ${title}">
            </div>
            <p class="no-results" data-noresults="${tableId}" role="status">نتیجه‌ای یافت نشد</p>
            <div class="table-responsive">
                <table class="prices-table" id="${tableId}">
                    <thead>
                        <tr>
                            <th scope="col">نام</th>
                            <th scope="col">قیمت (${currencyUnit})</th>
                            <th scope="col">تغییرات</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.forEach(item => {
        const hasChange = item.change !== null && item.change !== undefined && item.change !== 0;
        const changeClass = hasChange ? (item.change >= 0 ? 'positive' : 'negative') : '';
        const arrow = hasChange ? (item.change >= 0 ? '▲' : '▼') : '';
        const changeText = hasChange
            ? `<em class="change-arrow">${arrow}</em>${Math.abs(item.change)}%`
            : '<span style="opacity:0.4">——</span>';
        html += `
            <tr>
                <td>
                    <span class="td-name-cell">
                        ${getItemIconHtml(item.name)}
                        <span>${item.name}</span>
                    </span>
                </td>
                <td>${item.numeric_value.toLocaleString()} ${currencyUnit}</td>
                <td class="${changeClass}">${changeText}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

async function renderHomePage() {
    const [currencyData, goldData, cryptoData, oilData] = await Promise.all([
        fetchAPI('/api/currency/'),
        fetchAPI('/api/gold/'),
        fetchAPI('/api/crypto/'),
        fetchAPI('/api/oil/')
    ]);
    
    const hasData = (currencyData && currencyData.length > 0) || 
                    (goldData && goldData.length > 0) || 
                    (cryptoData && cryptoData.length > 0) || 
                    (oilData && oilData.length > 0);
    
    if (!hasData) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: var(--color4); margin-top: 20px;">در حال بارگذاری داده‌ها...</p>
            </div>
        `;
    }
    
    let html = `
        <div class="home-container">
            <h1 style="text-align: center; margin-bottom: 15px; color: var(--color4);">
                <img src="/static/pricess/images/nav/chart.png" style="width:36px;height:36px;vertical-align:middle;margin-left:10px;" alt="">
                قیمت زنده بازارهای مالی
            </h1>
            <p style="text-align: center; margin-bottom: 40px; color: var(--color5);">آخرین نرخ‌های ارز، طلا، کریپتو و نفت به صورت لحظه‌ای</p>

            <div class="tables-wrapper">
    `;

    html += renderTable(currencyData, 'نرخ ارزها', 'fa-exchange-alt', 'currency');
    html += renderTable(goldData, 'طلا و سکه', 'fa-coins', 'gold');
    html += renderTable(cryptoData, 'ارزهای دیجیتال', 'fa-coins', 'crypto');
    html += renderTable(oilData, 'نفت و انرژی', 'fa-chart-pie', 'oil');
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}


const CHART_PERIODS = [
    { key: '24h', label: '۲۴ ساعت' },
    { key: '7d',  label: 'هفتگی' },
    { key: '30d', label: '۳۰ روزه' },
    { key: 'all', label: 'کلی' }
];

function drawChart(canvasId, prices) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !prices || prices.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    const step = width / (prices.length - 1);
    
    for (let i = 0; i < prices.length; i++) {
        const x = i * step;
        const y = height - ((prices[i] - minPrice) / (range || 1)) * (height - 20) - 10;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    const isUp = prices[prices.length - 1] > prices[0];
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    ctx.fill();
}

function formatChangeBadge(prices) {
    if (!prices || prices.length < 2 || !prices[0]) return null;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const pct = ((last - first) / first) * 100;
    const direction = pct > 0.001 ? 'up' : pct < -0.001 ? 'down' : 'flat';
    const sign = pct > 0 ? '+' : '';
    const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
    return { text: `${arrow} ${sign}${pct.toFixed(2)}٪`, direction };
}

function updateChartChangeBadge(badge, prices) {
    if (!badge) return;
    const change = formatChangeBadge(prices);
    if (!change) {
        badge.textContent = '';
        badge.className = 'chart-change-badge';
        return;
    }
    badge.textContent = change.text;
    badge.className = `chart-change-badge ${change.direction}`;
}

function positionChartIndicator(toolbar, activeBtn) {
    const indicator = toolbar && toolbar.querySelector('.chart-toolbar-indicator');
    if (!indicator || !activeBtn) return;
    const toolbarRect = toolbar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    indicator.style.width = btnRect.width + 'px';
    indicator.style.left = (btnRect.left - toolbarRect.left) + 'px';
}

function buildChartHtml(canvasId) {
    const tabs = CHART_PERIODS.map((p, i) =>
        `<button class="chart-tab${i === 0 ? ' active' : ''}" data-period="${p.key}" type="button">${p.label}</button>`
    ).join('');

    return `
        <div class="custom-chart">
            <div class="chart-toolbar" role="tablist" aria-label="بازه زمانی نمودار">
                <span class="chart-toolbar-indicator"></span>
                ${tabs}
            </div>
            <div class="chart-canvas-wrap">
                <canvas id="${canvasId}" width="300" height="80"></canvas>
                <div class="chart-loading-overlay" hidden><span class="chart-spinner"></span></div>
            </div>
            <div class="chart-change-badge"></div>
        </div>
    `;
}

async function activateChartPeriod(placeholder, period) {
    const state = placeholder._chartState;
    if (!state) return;

    const toolbar = placeholder.querySelector('.chart-toolbar');
    const canvas = placeholder.querySelector('canvas');
    const overlay = placeholder.querySelector('.chart-loading-overlay');
    const badge = placeholder.querySelector('.chart-change-badge');
    const activeBtn = toolbar ? toolbar.querySelector(`.chart-tab[data-period="${period}"]`) : null;

    if (toolbar && activeBtn) {
        toolbar.querySelectorAll('.chart-tab').forEach(btn => btn.classList.toggle('active', btn === activeBtn));
        positionChartIndicator(toolbar, activeBtn);
    }

    state.period = period;

    if (state.cache[period]) {
        drawChart(canvas.id, state.cache[period]);
        updateChartChangeBadge(badge, state.cache[period]);
        return;
    }

    if (overlay) overlay.hidden = false;

    try {
        const response = await fetch(`/api/chart/${encodeURIComponent(state.itemName)}/?period=${encodeURIComponent(period)}`);
        const data = await response.json();

        if (data.status === 'success' && data.data && data.data.prices && data.data.prices.length > 0) {
            state.cache[period] = data.data.prices;
            drawChart(canvas.id, data.data.prices);
            updateChartChangeBadge(badge, data.data.prices);
        } else if (badge) {
            badge.textContent = 'داده‌ای برای این بازه موجود نیست';
            badge.className = 'chart-change-badge flat';
        }
    } catch (error) {
        console.error('Chart period load error:', error);
        if (badge) {
            badge.textContent = 'خطا در دریافت اطلاعات';
            badge.className = 'chart-change-badge flat';
        }
    } finally {
        if (overlay) overlay.hidden = true;
    }
}

async function loadCharts() {
    const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
    
    for (let placeholder of chartPlaceholders) {
        if (placeholder.getAttribute('data-loaded') === 'true') continue;
        
        let itemName = '';
        const card = placeholder.closest('.crypto-card');
        if (card) {
            const nameElem = card.querySelector('.header h2');
            if (nameElem) itemName = nameElem.textContent.trim();
        }
        
        if (!itemName) continue;

        const canvasId = `chart-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        placeholder.innerHTML = buildChartHtml(canvasId);
        placeholder.classList.add('chart-ready');
        placeholder._chartState = { itemName, cache: {}, period: '24h' };
        placeholder.setAttribute('data-loaded', 'true');

        const toolbar = placeholder.querySelector('.chart-toolbar');
        if (toolbar) {
            toolbar.querySelectorAll('.chart-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.classList.contains('active')) return;
                    activateChartPeriod(placeholder, btn.getAttribute('data-period'));
                });
            });
        }

        await activateChartPeriod(placeholder, '24h');
    }
}

function initChartResizeSync() {
    window.addEventListener('resize', () => {
        document.querySelectorAll('.chart-toolbar').forEach(toolbar => {
            const active = toolbar.querySelector('.chart-tab.active');
            positionChartIndicator(toolbar, active);
        });
    });
}

async function renderCategoryPage(category, title, icon) {
    let endpoint = '';
    if (category === 'currency') endpoint = '/api/currency/';
    else if (category === 'gold') endpoint = '/api/gold/';
    else if (category === 'crypto') endpoint = '/api/crypto/';
    else if (category === 'oil') endpoint = '/api/oil/';
    else return '<p style="color:var(--color4); text-align:center;">دسته‌بندی نامعتبر</p>';
    
    const data = await fetchAPI(endpoint);
    
    if (!data || data.length === 0) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: var(--color4);">در حال بارگذاری...</p>
            </div>
        `;
    }
    
    let currencyUnit = 'ریال';
    if (category === 'crypto' || category === 'oil') {
        currencyUnit = 'دلار';
    }
    
    const cardsId = `cards-${category}`;
    const sectionImg = SECTION_IMAGES[category];
    const headerIconHtml = sectionImg
        ? `<img src="${sectionImg}" class="section-icon" alt="${title}">`
        : `<i class="fas ${icon}" style="font-size: 50px; color: var(--color3);" aria-hidden="true"></i>`;

    let html = `
        <div class="category-header">
            ${headerIconHtml}
            <h1>${title}</h1>
            <p>آخرین قیمت‌های لحظه‌ای ${title}</p>
        </div>

        <div class="price-search-wrap">
            <img src="/static/pricess/images/nav/search.png" class="search-icon-img" alt="">
            <input class="price-search" type="text" placeholder="جستجو در ${title}..." data-cards="${cardsId}">
        </div>
        <p class="no-results" data-noresults="${cardsId}">نتیجه‌ای یافت نشد</p>

        <div class="category-cards-container" id="${cardsId}">
    `;
    
    data.forEach(item => {
        const hasChange = item.change !== null && item.change !== undefined && item.change !== 0;
        const changeClass = hasChange ? (item.change >= 0 ? 'positive' : 'negative') : '';
        const arrow = hasChange ? (item.change >= 0 ? '▲' : '▼') : '';
        const changeText = hasChange
            ? `<em class="change-arrow">${arrow}</em>${Math.abs(item.change)}%`
            : '<span style="opacity:0.4">——</span>';
        const cardIconHtml = (COIN_IMAGES[item.name] || FLAG_IMAGES[item.name])
            ? `<img src="${COIN_IMAGES[item.name] || FLAG_IMAGES[item.name]}" class="item-icon" style="width:44px;height:44px;padding:4px;" alt="${item.name}" loading="lazy">`
            : `<i class="${getIconForName(item.name)}" style="font-size: 40px; color: var(--color3);" aria-hidden="true"></i>`;
        html += `
            <div class="crypto-card" data-item-name="${item.name}">
                <div class="header">
                    ${cardIconHtml}
                    <h2>${item.name}</h2>
                </div>
                <div class="price">${item.numeric_value.toLocaleString()} ${currencyUnit}</div>
                <div class="change ${changeClass}" style="font-size: 16px; margin: 8px 0;">${changeText}</div>
                <div class="chart-placeholder" data-item-name="${item.name}" aria-label="نمودار قیمت ${item.name}">
                    <div class="chart-loading">در حال بارگذاری نمودار...</div>
                </div>
                <div class="description">آخرین به‌روزرسانی: لحظه‌ای</div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

async function renderConverterPage() {
    const allData = await fetchAPI('/api/all-prices/');

    if (!allData || allData.length === 0) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: var(--color4); margin-top: 20px;">در حال بارگذاری...</p>
            </div>
        `;
    }

    const categoryOrder = [
        ['currency', 'ارز'],
        ['gold', 'طلا'],
        ['crypto', 'کریپتو'],
        ['oil', 'نفت'],
    ];

    let optionsHtml = '';
    for (const [cat, label] of categoryOrder) {
        const items = allData.filter(d => d.category === cat);
        if (items.length > 0) {
            optionsHtml += `<optgroup label="${label}">`;
            items.forEach(item => {
                optionsHtml += `<option value="${item.name}">${item.name}</option>`;
            });
            optionsHtml += `</optgroup>`;
        }
    }

    return `
        <div class="converter-container">
            <div class="category-header">
                <img src="/static/pricess/images/gold/chart.png" class="section-icon" alt="مبدل ارز">
                <h1>مبدل ارز</h1>
                <p>تبدیل بین ارزها، طلا، کریپتو و نفت</p>
            </div>

            <div class="converter-card">
                <div class="converter-row">
                    <label class="converter-label">مقدار</label>
                    <input type="number" id="converterAmount" class="converter-input"
                           value="1" min="0.000001" step="any" placeholder="مقدار را وارد کنید">
                </div>

                <div class="converter-row">
                    <label class="converter-label">از</label>
                    <select id="converterFrom" class="converter-select">
                        ${optionsHtml}
                    </select>
                </div>

                <div class="converter-swap">
                    <button id="converterSwapBtn" class="converter-swap-btn" title="جابجایی">
                        <i class="fas fa-arrows-alt-v"></i>
                    </button>
                </div>

                <div class="converter-row">
                    <label class="converter-label">به</label>
                    <select id="converterTo" class="converter-select">
                        ${optionsHtml}
                    </select>
                </div>

                <button id="converterSubmitBtn" class="converter-btn">
                    <i class="fas fa-calculator"></i>&nbsp; محاسبه
                </button>

                <div id="converterResult" class="converter-result" style="display:none;"></div>
            </div>
        </div>
    `;
}

function formatConverterNumber(num) {
    if (num === 0) return '۰';
    const decimals = Math.abs(num) >= 1 ? 4 : 8;
    return num.toLocaleString('fa-IR', { maximumFractionDigits: decimals });
}

async function doConvert() {
    const amount = parseFloat(document.getElementById('converterAmount').value);
    const from = document.getElementById('converterFrom').value;
    const to = document.getElementById('converterTo').value;
    const resultBox = document.getElementById('converterResult');

    if (!from || !to || isNaN(amount) || amount <= 0) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<p class="converter-error">لطفاً مقدار و ارزهای معتبر انتخاب کنید.</p>';
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<p style="color:var(--color5);text-align:center;">در حال محاسبه...</p>';

    try {
        const url = `/api/convert/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`;
        const resp = await fetch(url);
        const json = await resp.json();

        if (json.status === 'success') {
            const d = json.data;
            const resultFormatted = formatConverterNumber(d.result);
            const rateFormatted = formatConverterNumber(d.result / amount);
            resultBox.innerHTML = `
                <div class="result-label">نتیجه تبدیل</div>
                <div class="result-value">
                    ${formatConverterNumber(amount)} ${from}
                    <br>
                    = <strong>${resultFormatted}</strong> ${to}
                </div>
                <div class="result-detail">نرخ: ۱ ${from} = ${rateFormatted} ${to}</div>
            `;
        } else {
            resultBox.innerHTML = `<p class="converter-error">${json.message || 'خطا در محاسبه'}</p>`;
        }
    } catch (err) {
        resultBox.innerHTML = '<p class="converter-error">خطا در اتصال به سرور</p>';
    }
}

function setupConverter() {
    const submitBtn = document.getElementById('converterSubmitBtn');
    const swapBtn = document.getElementById('converterSwapBtn');
    const amountInput = document.getElementById('converterAmount');
    const fromSelect = document.getElementById('converterFrom');
    const toSelect = document.getElementById('converterTo');

    if (toSelect && toSelect.options.length > 1) {
        toSelect.selectedIndex = 1;
    }

    if (submitBtn) submitBtn.addEventListener('click', doConvert);

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const tmp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = tmp;
        });
    }

    if (amountInput) {
        amountInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') doConvert();
        });
    }
}

let currentPage = 'home';

async function loadPage(pageId) {
    currentPage = pageId;
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // Fade out
    mainContent.classList.add('page-leaving');
    await new Promise(r => setTimeout(r, 200));
    mainContent.classList.remove('page-leaving');

    mainContent.innerHTML = `
        <div style="text-align:center;padding:50px;">
            <i class="fas fa-spinner fa-spin" style="font-size:50px;color:var(--color3);"></i>
            <p style="color:var(--color4);margin-top:16px;">در حال بارگذاری...</p>
        </div>
    `;

    let content = '';
    switch (pageId) {
        case 'home':      content = await renderHomePage(); break;
        case 'currency':  content = await renderCategoryPage('currency', 'نرخ ارز', 'fa-exchange-alt'); break;
        case 'gold':      content = await renderCategoryPage('gold', 'طلا و سکه', 'fa-coins'); break;
        case 'crypto':    content = await renderCategoryPage('crypto', 'ارزهای دیجیتال', 'fa-coins'); break;
        case 'oil':       content = await renderCategoryPage('oil', 'نفت و انرژی', 'fa-chart-pie'); break;
        case 'converter': content = await renderConverterPage(); break;
        default:          content = await renderHomePage();
    }

    mainContent.innerHTML = content;
    animateTableRows();

    if (pageId === 'converter') {
        setupConverter();
    } else {
        attachSearchHandlers();
        setTimeout(loadCharts, 500);
    }

    startAutoRefresh();
}

/* ─── Staggered row entrance ─────────────────────────────── */
function animateTableRows() {
    document.querySelectorAll('.prices-table tbody tr').forEach((row, i) => {
        row.style.animationDelay = `${i * 30}ms`;
    });
    document.querySelectorAll('.crypto-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 50}ms`;
    });
}

/* ─── Search / filter ────────────────────────────────────── */
function attachSearchHandlers() {
    document.querySelectorAll('.price-search').forEach(input => {
        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            const tableId = input.dataset.table;
            const cardsId = input.dataset.cards;

            if (tableId) {
                const tbody = document.querySelector(`#${tableId} tbody`);
                if (!tbody) return;
                let visible = 0;
                tbody.querySelectorAll('tr').forEach(row => {
                    const name = row.querySelector('td')?.textContent.toLowerCase() || '';
                    const show = name.includes(q);
                    row.style.display = show ? '' : 'none';
                    if (show) visible++;
                });
                const noRes = document.querySelector(`[data-noresults="${tableId}"]`);
                if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
            }

            if (cardsId) {
                const grid = document.getElementById(cardsId);
                if (!grid) return;
                let visible = 0;
                grid.querySelectorAll('.crypto-card').forEach(card => {
                    const name = (card.querySelector('h2')?.textContent || '').toLowerCase();
                    const show = name.includes(q);
                    card.style.display = show ? '' : 'none';
                    if (show) visible++;
                });
                const noRes = document.querySelector(`[data-noresults="${cardsId}"]`);
                if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
            }
        });
    });
}

/* ─── Auto-refresh countdown ─────────────────────────────── */
let _refreshTimer = null;
let _refreshSecondsLeft = 300;

function startAutoRefresh() {
    clearInterval(_refreshTimer);
    _refreshSecondsLeft = 300;
    updateRefreshUI();

    _refreshTimer = setInterval(() => {
        _refreshSecondsLeft--;
        updateRefreshUI();
        if (_refreshSecondsLeft <= 0) {
            clearInterval(_refreshTimer);
            triggerRefresh();
        }
    }, 1000);
}

function updateRefreshUI() {
    const el = document.getElementById('refreshCountdown');
    if (!el) return;
    const m = Math.floor(_refreshSecondsLeft / 60);
    const s = _refreshSecondsLeft % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

async function triggerRefresh() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.classList.add('spinning');
    await loadPage(currentPage);
    if (btn) {
        setTimeout(() => btn.classList.remove('spinning'), 700);
    }
}

/* ─── Toast notifications ─────────────────────────────────── */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'times-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast--visible'));
    });
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 320);
    }, 2600);
}

/* ─── Copy to clipboard ──────────────────────────────────── */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast('شماره کپی شد!'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); showToast('شماره کپی شد!'); }
        catch { showToast('کپی ناموفق', 'error'); }
        document.body.removeChild(ta);
    }
}

/* ─── Scroll to top ──────────────────────────────────────── */
function initScrollToTop() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

let _modernMenuAPI = null;

function initModernMenu() {
    const nav = document.querySelector('.modern-menu');
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll('.modern-menu-item'));
    const highlight = nav.querySelector('.modern-menu-highlight');

    function moveHighlightTo(item, animate) {
        if (!item || !highlight) return;
        const btn = item.querySelector('button');
        if (!btn) return;
        const navRect = nav.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        if (!animate) highlight.style.transition = 'none';

        highlight.style.width = btnRect.width + 'px';
        highlight.style.height = btnRect.height + 'px';
        highlight.style.left = (btnRect.left - navRect.left) + 'px';
        highlight.style.top = (btnRect.top - navRect.top) + 'px';

        if (!animate) {
            void highlight.offsetWidth;
            highlight.style.transition = '';
        }
    }

    function setActive(pageId, options) {
        const opts = options || {};
        const navigate = opts.navigate !== false;
        const item = items.find(i => i.getAttribute('data-page') === pageId);
        if (!item || item.classList.contains('active')) return;
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        moveHighlightTo(item, true);
        if (navigate) loadPage(pageId);
    }

    // Event delegation on the nav itself — robust regardless of which
    // inner element (icon/label/button) the click actually lands on.
    nav.addEventListener('click', (e) => {
        const item = e.target.closest('.modern-menu-item');
        if (item && nav.contains(item)) setActive(item.getAttribute('data-page'));
    });

    const initialActive = nav.querySelector('.modern-menu-item.active') || items[0];
    moveHighlightTo(initialActive, false);

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.modern-menu-item.active');
        moveHighlightTo(current, false);
    });

    _modernMenuAPI = { setActive };
}

function setPersianDate() {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    const dateElement = document.getElementById('persianDate');
    if (dateElement) dateElement.innerHTML = persianDate;
}

function initBanner() {
    const closeBanner = document.getElementById('closeBannerBtn');
    const bannerContainer = document.getElementById('bannerContainer');
    
    if (closeBanner && bannerContainer) {
        const lastClosedTime = localStorage.getItem('bannerLastClosed');
        const currentTime = Date.now();
        const twoMinutes = 2 * 60 * 1000;
        
        if (!lastClosedTime || (currentTime - parseInt(lastClosedTime)) >= twoMinutes) {
            bannerContainer.style.display = 'block';
        } else {
            bannerContainer.style.display = 'none';
        }
        
        closeBanner.addEventListener('click', function() {
            bannerContainer.style.display = 'none';
            localStorage.setItem('bannerLastClosed', Date.now().toString());
        });
    }
}
 
async function waitForFetch() {
    let initial;
    try {
        const res = await fetch('/api/fetch-status/');
        const json = await res.json();
        initial = json.data;
    } catch (e) {
        return; // can't reach API, just load the page
    }

    if (initial.done) return; // data already ready, skip overlay

    const overlay = document.getElementById('fetchOverlay');
    const bar = document.getElementById('fetchProgressBar');
    const currentItem = document.getElementById('fetchCurrentItem');
    const counter = document.getElementById('fetchCounter');

    overlay.style.display = 'flex';

    await new Promise(resolve => {
        const poll = setInterval(async () => {
            let s;
            try {
                const res = await fetch('/api/fetch-status/');
                s = (await res.json()).data;
            } catch (e) {
                clearInterval(poll);
                resolve();
                return;
            }

            const pct = s.total > 0 ? (s.progress / s.total) * 100 : 0;
            bar.style.width = pct + '%';
            currentItem.textContent = s.current_item
                ? 'دریافت: ' + s.current_item
                : 'در حال اتصال...';
            counter.textContent = s.progress + ' / ' + s.total;

            if (s.done) {
                clearInterval(poll);
                bar.style.width = '100%';
                currentItem.textContent = 'آماده ✓';
                setTimeout(() => {
                    overlay.classList.add('fade-out');
                    setTimeout(() => { overlay.style.display = 'none'; }, 500);
                    resolve();
                }, 500);
            }
        }, 350);
    });
}

function initDevModal() {
    const btn = document.getElementById('devBtn');
    const overlay = document.getElementById('devModal');
    const closeBtn = document.getElementById('devModalClose');

    if (!btn || !overlay) return;

    btn.addEventListener('click', () => overlay.classList.add('active'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    // Copy phone numbers on click
    overlay.querySelectorAll('.dev-phone-number').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            copyToClipboard(el.textContent.trim());
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') overlay.classList.remove('active');
    });
}

/* ─── Dark / Light theme toggle ───────────────────────────── */
function spawnThemeRipple(btn, clientX, clientY) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.4;
    const ripple = document.createElement('span');
    ripple.className = 'theme-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

function initThemeToggle() {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggleBtn');
    const tooltip = document.getElementById('themeTooltip');
    if (!btn) return;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function reflectTheme(theme) {
        if (tooltip) tooltip.textContent = theme === 'light' ? 'حالت شب' : 'حالت روز';
        btn.setAttribute('aria-label', theme === 'light' ? 'فعال‌سازی حالت شب' : 'فعال‌سازی حالت روز');
        const metaColor = document.getElementById('themeColorMeta');
        if (metaColor) metaColor.setAttribute('content', theme === 'light' ? '#eef1fb' : '#22223B');
    }

    function persistTheme(theme) {
        try { localStorage.setItem('arzban-theme', theme); } catch (e) {}
    }

    function playSettlePulse() {
        document.body.classList.add('theme-pulse');
        setTimeout(() => document.body.classList.remove('theme-pulse'), 600);
    }

    function applyThemeSwap(next) {
        root.setAttribute('data-theme', next);
        reflectTheme(next);
        persistTheme(next);
        playSettlePulse();
    }

    reflectTheme(currentTheme());

    btn.addEventListener('click', (e) => {
        const next = currentTheme() === 'light' ? 'dark' : 'light';
        const rect = btn.getBoundingClientRect();
        const x = e.clientX || (rect.left + rect.width / 2);
        const y = e.clientY || (rect.top + rect.height / 2);
        spawnThemeRipple(btn, x, y);

        // Fallback for browsers without the View Transitions API
        if (!document.startViewTransition) {
            applyThemeSwap(next);
            return;
        }

        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => applyThemeSwap(next));

        transition.ready.then(() => {
            root.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 650,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        }).catch(() => {});
    });
}

function initRefreshButton() {
    const btn = document.getElementById('refreshBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        _refreshSecondsLeft = 0; // triggers immediately on next tick
        triggerRefresh();
    });
}


/* ──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
    setPersianDate();
    initBanner();
    initDevModal();
    initScrollToTop();
    initRefreshButton();
    initThemeToggle();
    initChartResizeSync();
    initModernMenu();
    await waitForFetch();
    updateTicker();
    loadPage('home');
    setInterval(updateTicker, 60000);
    setInterval(setPersianDate, 3600000);
});