const toggle = document.getElementById("toggle");
const body = document.body;

// Apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  toggle.checked = true;
}

toggle.addEventListener("change", () => {
  body.classList.toggle("dark");

  // Save preference
  if (body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});

// Calendar functionality
const calendar = {
    date: new Date(),
    events: {},

    init() {
        this.monthYear = document.getElementById('monthYear');
        this.daysContainer = document.getElementById('days');
        this.selectedDate = document.getElementById('selectedDate');
        this.eventsList = document.getElementById('eventsList');
        
        // Load saved events first
        this.loadEvents();
        
        document.getElementById('prevBtn').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextMonth());
        
        // Show today's events by default
        const today = new Date();
        this.selectedDay = today;
        this.render();
        this.renderEvents(today);
    },

    loadEvents() {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            this.events = JSON.parse(savedEvents);
        }
    },

    saveEvents() {
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    },

    addEvent(date, title, time, description) {
        const dateStr = date.toISOString().split('T')[0];
        if (!this.events[dateStr]) {
            this.events[dateStr] = [];
        }
        
        this.events[dateStr].push({
            id: Date.now(),
            title,
            time,
            description,
            completed: false
        });
        
        this.saveEvents();
        this.renderEvents(date);
    },

    completeEvent(dateStr, eventId) {
        const events = this.events[dateStr];
        if (events) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                event.completed = true;
                this.saveEvents();
                this.renderEvents(new Date(dateStr));
            }
        }
    },

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    render() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        
        this.monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        this.daysContainer.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            this.daysContainer.innerHTML += '<div></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(year, month, day).toISOString().split('T')[0];
            const hasEvents = this.events[dateStr]?.length > 0;
            
            const div = document.createElement('div');
            div.textContent = day;
            
            if (hasEvents) {
                div.classList.add('has-events');
            }
            
            if (this.isToday(year, month, day)) {
                div.classList.add('today');
            }
            
            div.addEventListener('click', () => {
                const clickedDate = new Date(year, month, day);
                this.selectedDay = clickedDate;
                this.renderEvents(clickedDate);
            });
            
            this.daysContainer.appendChild(div);
        }
        
        // Show today's events by default
        this.selectedDate.textContent = this.formatDate(new Date());
        this.renderEvents(new Date());
    },

    renderEvents(date) {
        const dateStr = date.toISOString().split('T')[0];
        const events = this.events[dateStr] || [];
        
        this.selectedDate.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        if (events.length === 0) {
            this.eventsList.innerHTML = `
                <div class="no-events">
                    <span class="event-icon">📅</span>
                    <p>No events scheduled for this day</p>
                </div>
            `;
            return;
        }
        
        this.eventsList.innerHTML = events.map(event => `
            <div class="event-item ${event.completed ? 'completed' : ''}">
                <div class="event-time">${event.time}</div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description || ''}</p>
                ${!event.completed ? `
                    <button class="finish-btn" onclick="calendar.completeEvent('${dateStr}', ${event.id})">
                        Finish
                    </button>
                ` : '<span class="completed-tag">Completed</span>'}
            </div>
        `).join('');

        // Update days with events indicator
        this.updateEventIndicators();
    },

    updateEventIndicators() {
        const days = this.daysContainer.querySelectorAll('div');
        days.forEach(day => {
            if (day.textContent) {
                const date = new Date(this.date.getFullYear(), this.date.getMonth(), parseInt(day.textContent));
                const dateStr = date.toISOString().split('T')[0];
                if (this.events[dateStr]?.length > 0) {
                    day.classList.add('has-events');
                }
            }
        });
    },

    isToday(year, month, day) {
        const today = new Date();
        return year === today.getFullYear() &&
               month === today.getMonth() &&
               day === today.getDate();
    },

    previousMonth() {
        this.date.setMonth(this.date.getMonth() - 1);
        this.render();
    },

    nextMonth() {
        this.date.setMonth(this.date.getMonth() + 1);
        this.render();
    }
};

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    calendar.init();
    window.calendar = calendar;
});

// Ensure events persist through page reloads
window.addEventListener('beforeunload', () => {
    calendar.saveEvents();
});
