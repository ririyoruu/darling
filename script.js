document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const currentMonthEl = document.getElementById('current-month');
    const calendarDays = document.getElementById('calendar-days');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const viewOptionBtns = document.querySelectorAll('.view-option');
    const calendarViews = document.querySelectorAll('.calendar-view');
    const upcomingEventsList = document.getElementById('upcoming-events-list');
    const eventModal = document.getElementById('event-modal');
    const addEventBtn = document.getElementById('add-event-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const eventForm = document.getElementById('event-form');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeNotificationBtn = document.querySelector('.notification-close');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Current date
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let events = JSON.parse(localStorage.getItem('events')) || [];
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

    // Initialize calendar
    initCalendar();

    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        initCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        initCalendar();
    });

    viewOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewOptionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            calendarViews.forEach(view => view.classList.remove('active'));
            document.querySelector(`.${btn.dataset.view}-view`).classList.add('active');
            
            if (btn.dataset.view === 'week') {
                renderWeekView();
            } else if (btn.dataset.view === 'day') {
                renderDayView();
            }
        });
    });

    addEventBtn.addEventListener('click', () => {
        openEventModal();
    });

    closeModalBtn.addEventListener('click', () => {
        closeEventModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            closeEventModal();
        }
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });

    closeNotificationBtn.addEventListener('click', () => {
        hideNotification();
    });

    themeToggleBtn.addEventListener('click', toggleTheme);

    // Check for notifications every minute
    setInterval(checkNotifications, 60000);

    // Check notifications on load
    checkNotifications();

    // Functions
    function initCalendar() {
        renderMonth();
        renderUpcomingEvents();
    }

    function renderMonth() {
        // Set month and year in header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        // Get first day of month and total days in month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        // Clear calendar
        calendarDays.innerHTML = '';

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.classList.add('day', 'other-month');
            day.textContent = daysInPrevMonth - i;
            calendarDays.appendChild(day);
        }

        // Current month days
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.classList.add('day');
            
            // Highlight today
            if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                day.classList.add('today');
            }
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            day.appendChild(dayNumber);
            
            // Events container
            const dayEvents = document.createElement('div');
            dayEvents.classList.add('day-events');
            day.appendChild(dayEvents);
            
            // Add events for this day
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEventsData = events.filter(event => event.date === dateStr);
            
            dayEventsData.forEach(event => {
                const eventPreview = document.createElement('div');
                eventPreview.classList.add('event-preview');
                eventPreview.textContent = event.title;
                eventPreview.style.backgroundColor = event.color;
                eventPreview.dataset.eventId = event.id;
                dayEvents.appendChild(eventPreview);
                
                // Click event to view details
                eventPreview.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEventModal(event);
                });
            });
            
            // Click day to add event
            day.addEventListener('click', () => {
                const date = new Date(currentYear, currentMonth, i);
                openEventModal(null, date);
            });
            
            calendarDays.appendChild(day);
        }

        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
        
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.classList.add('day', 'other-month');
            day.textContent = i;
            calendarDays.appendChild(day);
        }
    }

    function renderWeekView() {
        const weekDaysContainer = document.querySelector('.week-days');
        const timeSlotsContainer = document.querySelector('.time-slots');
        const weekEventsContainer = document.querySelector('.week-events');
        
        // Clear containers
        weekDaysContainer.innerHTML = '';
        timeSlotsContainer.innerHTML = '';
        weekEventsContainer.innerHTML = '';
        
        // Get current date and start of week (Sunday)
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        
        // Create week days header
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            
            const weekDay = document.createElement('div');
            weekDay.classList.add('week-day');
            
            // Highlight today
            if (day.toDateString() === currentDate.toDateString()) {
                weekDay.classList.add('today');
            }
            
            weekDay.innerHTML = `
                <div>${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div>${day.getDate()}</div>
            `;
            
            weekDaysContainer.appendChild(weekDay);
        }
        
        // Create time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.textContent = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            timeSlotsContainer.appendChild(timeSlot);
        }
        
        // Add events to week view
        const weekStart = new Date(startOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekStart.getDate() + 7);
        weekEnd.setHours(0, 0, 0, 0);
        
        const weekEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            if (event.startTime) {
                const [hours, minutes] = event.startTime.split(':');
                eventDate.setHours(parseInt(hours), parseInt(minutes));
            }
            return eventDate >= weekStart && eventDate < weekEnd;
        });
        
        weekEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const dayOfWeek = eventDate.getDay();
            
            if (event.startTime && event.endTime) {
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                
                const startPosition = startHours * 40 + (startMinutes / 60) * 40;
                const endPosition = endHours * 40 + (endMinutes / 60) * 40;
                const height = endPosition - startPosition;
                
                const weekEvent = document.createElement('div');
                weekEvent.classList.add('week-event');
                weekEvent.style.gridColumn = dayOfWeek + 1;
                weekEvent.style.gridRow = `span ${height / 40}`;
                weekEvent.style.top = `${startPosition}px`;
                weekEvent.style.backgroundColor = event.color;
                weekEvent.textContent = event.title;
                weekEvent.dataset.eventId = event.id;
                
                weekEvent.addEventListener('click', () => {
                    openEventModal(event);
                });
                
                weekEventsContainer.appendChild(weekEvent);
            }
        });
    }

    function renderDayView() {
        const dayHeader = document.querySelector('.day-header h3');
        const timeSlotsContainer = document.querySelector('.day-time-slots');
        const dayEventsContainer = document.querySelector('.day-events');
        
        // Clear containers
        timeSlotsContainer.innerHTML = '';
        dayEventsContainer.innerHTML = '';
        
        // Set day header
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dayHeader.textContent = currentDate.toLocaleDateString('en-US', options);
        
        // Create time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('day-time-slot');
            timeSlot.textContent = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            timeSlotsContainer.appendChild(timeSlot);
        }
        
        // Add events to day view
        const dayStr = currentDate.toISOString().split('T')[0];
        const dayEvents = events.filter(event => event.date === dayStr);
        
        dayEvents.forEach(event => {
            if (event.startTime && event.endTime) {
                const [startHours, startMinutes] = event.startTime.split(':').map(Number);
                const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                
                const startPosition = startHours * 60 + (startMinutes / 60) * 60;
                const endPosition = endHours * 60 + (endMinutes / 60) * 60;
                const height = endPosition - startPosition;
                
                const dayEvent = document.createElement('div');
                dayEvent.classList.add('day-event');
                dayEvent.style.top = `${startPosition}px`;
                dayEvent.style.height = `${height}px`;
                dayEvent.style.backgroundColor = event.color;
                dayEvent.innerHTML = `
                    <strong>${event.title}</strong>
                    <div>${event.startTime} - ${event.endTime}</div>
                `;
                dayEvent.dataset.eventId = event.id;
                
                dayEvent.addEventListener('click', () => {
                    openEventModal(event);
                });
                
                dayEventsContainer.appendChild(dayEvent);
            }
        });
    }

    function renderUpcomingEvents() {
        upcomingEventsList.innerHTML = '';
        
        // Get today's date and filter upcoming events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today;
        }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
        
        if (upcomingEvents.length === 0) {
            upcomingEventsList.innerHTML = '<p>No upcoming events, darling!</p>';
            return;
        }
        
        upcomingEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.classList.add('event-item');
            eventItem.style.borderLeftColor = event.color;
            
            const eventDate = new Date(event.date);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const timeStr = event.startTime ? ` • ${formatTime(event.startTime)}` : '';
            
            eventItem.innerHTML = `
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${eventDate.toLocaleDateString('en-US', options)}${timeStr}</div>
                </div>
                <div class="event-actions">
                    <button class="edit-event" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-event" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Add event listeners to buttons
            const editBtn = eventItem.querySelector('.edit-event');
            const deleteBtn = eventItem.querySelector('.delete-event');
            
            editBtn.addEventListener('click', () => {
                openEventModal(event);
            });
            
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this event?')) {
                    deleteEvent(event.id);
                }
            });
            
            upcomingEventsList.appendChild(eventItem);
        });
    }

    function openEventModal(event = null, date = null) {
        if (event) {
            // Edit existing event
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-date').value = event.date;
            document.getElementById('event-start-time').value = event.startTime || '';
            document.getElementById('event-end-time').value = event.endTime || '';
            document.getElementById('event-color').value = event.color;
            document.getElementById('event-notes').value = event.notes || '';
            document.getElementById('event-notification').value = event.notification || '15';
            
            // Store event ID in form
            eventForm.dataset.eventId = event.id;
        } else {
            // Add new event
            document.getElementById('event-title').value = '';
            document.getElementById('event-date').value = date ? date.toISOString().split('T')[0] : '';
            document.getElementById('event-start-time').value = '';
            document.getElementById('event-end-time').value = '';
            document.getElementById('event-color').value = '#ff9aa2';
	document.getElementById('event-notes').value = '';
	document.getElementById('event-notification').value = '15';

        // Remove event ID from form if it exists
        if (eventForm.dataset.eventId) {
            delete eventForm.dataset.eventId;
        }
    }
    
    eventModal.style.display = 'flex';
}

function closeEventModal() {
    eventModal.style.display = 'none';
}

function saveEvent() {
    // Get form values
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const startTime = document.getElementById('event-start-time').value;
    const endTime = document.getElementById('event-end-time').value;
    const color = document.getElementById('event-color').value;
    const notes = document.getElementById('event-notes').value.trim();
    const notification = document.getElementById('event-notification').value;
    
    // Validate form
    if (!title) {
        alert('Please enter an event title');
        return;
    }
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (startTime && !endTime) {
        alert('Please select an end time');
        return;
    }
    
    if (endTime && !startTime) {
        alert('Please select a start time');
        return;
    }
    
    if (startTime && endTime && startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }
    
    // Create or update event
    const eventId = eventForm.dataset.eventId || generateId();
    const event = {
        id: eventId,
        title,
        date,
        startTime,
        endTime,
        color,
        notes,
        notification
    };
    
    if (eventForm.dataset.eventId) {
        // Update existing event
        const index = events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            events[index] = event;
        }
    } else {
        // Add new event
        events.push(event);
    }
    
    // Save to localStorage
    localStorage.setItem('events', JSON.stringify(events));
    
    // Update UI
    initCalendar();
    renderUpcomingEvents();
    
    // Set notification if applicable
    if (notification !== '0') {
        setNotification(event);
    } else {
        // Remove notification if it exists
        notifications = notifications.filter(n => n.eventId !== eventId);
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
    // Close modal
    closeEventModal();
    
    // Show confirmation
    showNotification('Event saved successfully!');
}

function deleteEvent(eventId) {
    events = events.filter(event => event.id !== eventId);
    localStorage.setItem('events', JSON.stringify(events));
    
    // Remove notification if it exists
    notifications = notifications.filter(n => n.eventId !== eventId);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Update UI
    initCalendar();
    renderUpcomingEvents();
    
    // Show confirmation
    showNotification('Event deleted successfully!');
}

function setNotification(event) {
    if (!event.notification || event.notification === '0') return;
    
    const notificationMinutes = parseInt(event.notification);
    const eventDate = new Date(event.date);
    
    if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const notificationTime = new Date(eventDate.getTime() - notificationMinutes * 60000);
    
    // Remove existing notification for this event if it exists
    notifications = notifications.filter(n => n.eventId !== event.id);
    
    // Add new notification
    notifications.push({
        eventId: event.id,
        notifyAt: notificationTime.getTime(),
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        notified: false
    });
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function checkNotifications() {
    const now = new Date().getTime();
    
    notifications.forEach(notification => {
        if (!notification.notified && notification.notifyAt <= now) {
            showEventNotification(notification);
            
            // Mark as notified
            notification.notified = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }
    });
}

function showEventNotification(notification) {
    let message = `Upcoming: ${notification.title}`;
    
    const eventDate = new Date(notification.date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    message += `\nDate: ${eventDate.toLocaleDateString('en-US', options)}`;
    
    if (notification.startTime) {
        message += `\nTime: ${formatTime(notification.startTime)}`;
    }
    
    showNotification(message, true);
}

function showNotification(message, isEvent = false) {
    notificationMessage.textContent = message;
    
    if (isEvent) {
        notification.style.backgroundColor = '#ff9aa2';
    } else {
        notification.style.backgroundColor = '#4CAF50';
    }
    
    notification.classList.add('show');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function hideNotification() {
    notification.classList.remove('show');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = themeToggleBtn.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Helper functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${ampm}`;
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Set correct icon for theme toggle
const icon = themeToggleBtn.querySelector('i');
icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});