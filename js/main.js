// ==========================
// API ENDPOINTS
// ==========================
const AUDIT_API = "https://opensheet.elk.sh/1xOsZd0i8KPGzr_e3X24QY3m-hKi7Ip3RFDtbsr__ph0/audit";
const PRODUCTION_API = "https://opensheet.elk.sh/1xOsZd0i8KPGzr_e3X24QY3m-hKi7Ip3RFDtbsr__ph0/production";
const EVENT_API = "https://opensheet.elk.sh/1xOsZd0i8KPGzr_e3X24QY3m-hKi7Ip3RFDtbsr__ph0/event";
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx1gdt2s3PRAgG3mW8RFRKS7NKatcSvncPDVO-YZggRcYCAUHLTB0wArZbTgQ-V8UY/exec";

let chart;

// ==========================
// LOAD CALENDAR (dari dashboard-full.html)
// ==========================
async function loadCalendar() {
    const calendar = document.getElementById("calendar");
    const monthText = document.getElementById("calendar-month");
    const todayEvent = document.getElementById("today-event");
    
    if (!calendar) {
        console.log("Calendar element not found");
        return;
    }
    
    try {
        // Fetch events
        const response = await fetch(EVENT_API);
        const events = await response.json();
        console.log("Events loaded:", events);
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const monthName = now.toLocaleString('default', { month: 'long' });
        
        if (monthText) monthText.innerText = `${monthName} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        // Clear calendar
        calendar.innerHTML = "";
        if (todayEvent) todayEvent.innerHTML = "";
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendar.innerHTML += `<div class="bg-slate-800/40 rounded-xl p-2 min-h-[100px] border border-slate-700/50"></div>`;
        }
        
        let hasTodayEvent = false;
        
        // Date cells with events
        for (let day = 1; day <= lastDate; day++) {
            const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const event = events.find(e => e.date === fullDate);
            const isToday = day === today;
            
            let eventHTML = "";
            if (event) {
                let icon = "📌";
                if (event.type === "audit") icon = "🔍";
                else if (event.type === "visit") icon = "👥";
                else if (event.type === "training") icon = "📚";
                
                eventHTML = `<div class="text-[10px] mt-1 text-cyan-400">${icon} ${event.title}</div>`;
                
                // Add to today's events
                if (isToday && todayEvent) {
                    hasTodayEvent = true;
                    todayEvent.innerHTML += `
                        <div class="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-2">
                            <div class="flex items-center gap-2">
                                <div class="text-xl">${icon}</div>
                                <div>
                                    <h4 class="text-cyan-400 font-bold text-sm">${event.title}</h4>
                                    <p class="text-slate-400 text-xs">Type: ${event.type}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
            
            calendar.innerHTML += `
                <div class="bg-slate-800/40 rounded-xl p-2 min-h-[100px] border ${isToday ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700/50'}">
                    <span class="text-sm font-bold ${isToday ? 'text-cyan-400' : 'text-white'}">${day}</span>
                    ${eventHTML}
                </div>
            `;
        }
        
        if (todayEvent && !hasTodayEvent) {
            todayEvent.innerHTML = '<p class="text-slate-500 text-sm">No events today</p>';
        }
        
        console.log("Calendar loaded");
    } catch (error) {
        console.error("Calendar Error:", error);
        calendar.innerHTML = '<div class="col-span-7 text-center text-red-400">Error loading calendar</div>';
    }
}

// ==========================
// GET AUDIT DATA
// ==========================
async function getAuditData() {
    try {
        const response = await fetch(AUDIT_API);
        const data = await response.json();
        console.log("Audit data:", data);
        
        let openCount = 0;
        let alertText = "";
        let inProgressCount = 0;
        let closeCount = 0;
        
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                if (item.status === "OPEN") {
                    openCount++;
                    alertText += `⚠ OPEN: ${item.finding} - ${item.area} | `;
                } else if (item.status === "IN PROGRESS") {
                    inProgressCount++;
                } else if (item.status === "CLOSE") {
                    closeCount++;
                }
            });
        }
        
        // Update KPI
        const openFindingElem = document.getElementById("open-finding");
        if (openFindingElem) openFindingElem.innerText = openCount;
        
        // Update running alert
        const alertElem = document.getElementById("running-alert");
        if (alertElem) {
            alertElem.innerHTML = `<marquee behavior="scroll" direction="left" class="text-red-400 text-sm font-medium">${alertText || "✅ No Open Finding Today"}</marquee>`;
        }
        
        // Update audit container (untuk halaman audit.html)
        const auditContainer = document.getElementById("audit-container");
        if (auditContainer) {
            auditContainer.innerHTML = "";
            if (data && Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    let statusColor = "";
                    let statusBg = "";
                    if (item.status === "OPEN") {
                        statusColor = "text-red-400";
                        statusBg = "bg-red-500/10";
                    } else if (item.status === "IN PROGRESS") {
                        statusColor = "text-yellow-400";
                        statusBg = "bg-yellow-500/10";
                    } else {
                        statusColor = "text-green-400";
                        statusBg = "bg-green-500/10";
                    }
                    
                    auditContainer.innerHTML += `
                        <div class="bg-slate-800 border border-slate-700 rounded-xl p-3">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-xs text-slate-500">#${item.id || '-'}</span>
                                        <span class="text-xs text-slate-500">📅 ${item.date || '-'}</span>
                                    </div>
                                    <p class="font-medium text-white text-sm">${item.finding || '-'}</p>
                                    <p class="text-slate-400 text-xs mt-1">Area: ${item.area || '-'} | PIC: ${item.pic || '-'}</p>
                                </div>
                                <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColor} ${statusBg}">${item.status || '-'}</span>
                            </div>
                        </div>
                    `;
                });
            } else {
                auditContainer.innerHTML = '<p class="text-slate-500 text-center py-8">No findings available</p>';
            }
        }
        
        // Update stats on audit page
        const openCountElem = document.getElementById("open-count");
        if (openCountElem) openCountElem.innerText = openCount;
        
        const inProgressCountElem = document.getElementById("inprogress-count");
        if (inProgressCountElem) inProgressCountElem.innerText = inProgressCount;
        
        const closeCountElem = document.getElementById("close-count");
        if (closeCountElem) closeCountElem.innerText = closeCount;
        
    } catch (error) {
        console.error("Audit Error:", error);
    }
}

// ==========================
// LOAD PRODUCTION CHART
// ==========================
async function loadChart() {
    try {
        const response = await fetch(PRODUCTION_API);
        const data = await response.json();
        console.log("Production data:", data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log("No production data");
            return;
        }
        
        const labels = data.map(item => item.day || '-');
        const values = data.map(item => Number(item.output) || 0);
        
        const ctx = document.getElementById("productionChart");
        if (!ctx) return;
        
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Production Output",
                    data: values,
                    borderColor: "#22d3ee",
                    backgroundColor: "rgba(34,211,238,0.1)",
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "#22d3ee",
                    pointBorderColor: "#ffffff",
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: "white" } }
                },
                scales: {
                    x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
                    y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } }
                }
            }
        });
        
        // Update KPI production
        const totalOutput = values.reduce((a, b) => a + b, 0);
        const avgOutput = (totalOutput / values.length).toFixed(0);
        
        const avgProdElem = document.querySelector('.avg-production');
        if (avgProdElem) avgProdElem.innerText = avgOutput;
        
        const totalProdElem = document.querySelector('.total-production');
        if (totalProdElem) totalProdElem.innerText = totalOutput;
        
    } catch (error) {
        console.error("Chart Error:", error);
    }
}

// ==========================
// SUBMIT AUDIT
// ==========================
async function submitAudit() {
    const area = document.getElementById("area")?.value;
    const finding = document.getElementById("finding")?.value;
    const status = document.getElementById("status")?.value;
    const pic = document.getElementById("pic")?.value;
    const date = new Date().toISOString().split('T')[0];
    
    if (!area || !finding) {
        alert("Please fill Area and Finding");
        return;
    }
    
    const url = APPS_SCRIPT_URL + 
        "?action=insert" +
        "&area=" + encodeURIComponent(area) +
        "&finding=" + encodeURIComponent(finding) +
        "&status=" + encodeURIComponent(status) +
        "&pic=" + encodeURIComponent(pic || '') +
        "&date=" + encodeURIComponent(date);
    
    try {
        await fetch(url);
        alert("Finding Submitted!");
        if (document.getElementById("area")) document.getElementById("area").value = "";
        if (document.getElementById("finding")) document.getElementById("finding").value = "";
        if (document.getElementById("pic")) document.getElementById("pic").value = "";
        await getAuditData();
    } catch (error) {
        console.error("Submit Error:", error);
        alert("Error submitting");
    }
}

// ==========================
// REALTIME CLOCK
// ==========================
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const date = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const clockElem = document.getElementById("clock");
    const dateElem = document.getElementById("date");
    
    if (clockElem) clockElem.innerText = time;
    if (dateElem) dateElem.innerText = date;
}

// ==========================
// INITIALIZE
// ==========================
async function init() {
    console.log("Initializing dashboard...");
    await Promise.all([
        loadCalendar(),
        getAuditData()
    ]);
    
    if (document.getElementById("productionChart")) {
        await loadChart();
    }
    
    updateClock();
}

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Auto refresh every 10 seconds
setInterval(() => {
    loadCalendar();
    getAuditData();
    if (document.getElementById("productionChart")) {
        loadChart();
    }
}, 10000);

setInterval(updateClock, 1000);