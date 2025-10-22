

let data = JSON.parse(localStorage.getItem("calendarData")) || {
    timetable: {},
    events: []
  };
  
  function saveData() {
    localStorage.setItem("calendarData", JSON.stringify(data));
    renderTimetable();
    renderEvents();
  }
  
  // Timetable form
  document.getElementById("timetableForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const day = document.getElementById("day").value;
    const subject = document.getElementById("subject").value;
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
  
    if (!data.timetable[day]) data.timetable[day] = [];
    data.timetable[day].push({ subject, start, end });
    saveData();
  
    e.target.reset();
  });
  
  // Event form
  document.getElementById("eventForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("eventTitle").value;
    const date = document.getElementById("eventDate").value;
    const time = document.getElementById("eventTime").value;
    const description = document.getElementById("eventDesc").value;
  
    data.events.push({ title, date, time, description });
    saveData();
  
    e.target.reset();
  });
  
  // Render Timetable
  function renderTimetable() {
    const display = document.getElementById("timetableDisplay");
    display.innerHTML = "";
  
    Object.keys(data.timetable).forEach((day) => {
      const classes = data.timetable[day].map(
        (c) =>
          `<div class="class">${day}: ${c.subject} (${c.start} - ${c.end})</div>`
      );
      display.innerHTML += classes.join("");
    });
  }
  
  // Render Events
  function renderEvents() {
    const display = document.getElementById("eventDisplay");
    display.innerHTML = "";
  
    data.events.forEach((ev) => {
      display.innerHTML += `
        <div class="event">
          <strong>${ev.title}</strong><br/>
          ${ev.date} ${ev.time}<br/>
          ${ev.description}
        </div>
      `;
    });
  }
  
  renderTimetable();
  renderEvents();
  
  function renderTimetable() {
    const display = document.getElementById("timetableDisplay");
    display.innerHTML = "";
  
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
    dayOrder.forEach((day) => {
      const dayClasses = data.timetable[day];
      if (dayClasses && dayClasses.length > 0) {
        const dayBlock = document.createElement("div");
        dayBlock.classList.add("class");
  
        const title = document.createElement("strong");
        title.innerText = day;
        dayBlock.appendChild(title);
        dayBlock.appendChild(document.createElement("br"));
  
        dayClasses.forEach((c, index) => {
          const entry = document.createElement("div");
          entry.classList.add("timetable-entry");
          entry.innerHTML = `📘 ${c.subject} (${c.start} - ${c.end})`;
  
          const delBtn = document.createElement("button");
          delBtn.innerText = "🗑️";
          delBtn.classList.add("delete-btn");
          delBtn.onclick = () => {
            data.timetable[day].splice(index, 1);
            if (data.timetable[day].length === 0) delete data.timetable[day];
            saveData();
          };
  
          entry.appendChild(delBtn);
          dayBlock.appendChild(entry);
        });
  
        display.appendChild(dayBlock);
      }
    });
  }
  function renderEvents() {
    const display = document.getElementById("eventDisplay");
    display.innerHTML = "";
  
    data.events.forEach((ev, index) => {
      const eventDiv = document.createElement("div");
      eventDiv.classList.add("event");
  
      eventDiv.innerHTML = `
        <strong>${ev.title}</strong><br/>
        ${ev.date} ${ev.time}<br/>
        ${ev.description}
      `;
  
      // Create delete button
      const delBtn = document.createElement("button");
      delBtn.innerText = "🗑️";
      delBtn.classList.add("delete-btn");
      delBtn.onclick = () => {
        // Delete the event from the array
        data.events.splice(index, 1);
        saveData();
      };
  
      // Append the delete button to the event
      eventDiv.appendChild(delBtn);
  
      // Append the event to the display
      display.appendChild(eventDiv);
    });
  }
  
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
