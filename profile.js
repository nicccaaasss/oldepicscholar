const followBtn = document.getElementById("followBtn");
const photoInput = document.getElementById("photoInput");
const videoInput = document.getElementById("videoInput");
const gallery = document.getElementById("gallery");

// Follow button toggle
followBtn.addEventListener("click", () => {
  if (followBtn.textContent === "Follow") {
    followBtn.textContent = "Following";
    followBtn.style.background = "#ffffff";
    followBtn.style.color = "#000";
  } else {
    followBtn.textContent = "Follow";
    followBtn.style.background = "linear-gradient(to right, #00f7ff, #0088ff)";
    followBtn.style.color = "#000";
  }
});

// Add uploaded image to gallery
photoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      gallery.prepend(img);
    };
    reader.readAsDataURL(file);
  }
});

// Add uploaded video to gallery
videoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("video/")) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const video = document.createElement("video");
      video.src = event.target.result;
      video.controls = true;
      gallery.prepend(video);
    };
    reader.readAsDataURL(file);
  }
});

// Initialize grade chart
const ctx = document.getElementById('gradeChart').getContext('2d');
const gradeChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
        datasets: [{
            label: 'GPA',
            data: [8.5, 8.8, 9.2, 9.5, 9.8],
            borderColor: '#007aff',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(0, 122, 255, 0.1)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 7,
                max: 10
            }
        }
    }
});

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        // Add content switching logic here
    });
});

// Profile photo upload and storage
document.getElementById('photo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (!file) {
        console.error('No file selected');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(event) {
        if (!event.target || !event.target.result) {
            console.error('Error reading file');
            return;
        }

        const imageData = event.target.result;
        const profileImage = document.getElementById('profile-image');
        
        if (profileImage) {
            profileImage.src = imageData;
            localStorage.setItem('profilePhoto', imageData);
            console.log('Profile photo updated successfully');
        }
    };

    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error uploading image. Please try again.');
    };

    reader.readAsDataURL(file);
});

// Edit modal functionality
const modal = document.getElementById('editModal');
const editForm = document.getElementById('profile-edit-form');

document.querySelector('.edit-profile').addEventListener('click', () => {
    modal.style.display = 'block';
    // Populate form with current values
    document.getElementById('edit-name').value = document.querySelector('.profile-name-section h1').textContent;
    const bioLines = document.querySelectorAll('.profile-bio p');
    document.getElementById('edit-bio-1').value = bioLines[0]?.textContent || '';
    document.getElementById('edit-bio-2').value = bioLines[1]?.textContent || '';
    document.getElementById('edit-bio-3').value = bioLines[2]?.textContent || '';
});

document.querySelector('.cancel-btn').addEventListener('click', () => {
    modal.style.display = 'none';
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Update profile with new values
    document.querySelector('.profile-name-section h1').textContent = document.getElementById('edit-name').value;
    
    const bioContainer = document.querySelector('.profile-bio');
    bioContainer.innerHTML = '';
    ['edit-bio-1', 'edit-bio-2', 'edit-bio-3'].forEach(id => {
        const value = document.getElementById(id).value;
        if (value) {
            const p = document.createElement('p');
            p.textContent = value;
            bioContainer.appendChild(p);
        }
    });

    // Save to localStorage
    localStorage.setItem('profileData', JSON.stringify({
        name: document.getElementById('edit-name').value,
        bio1: document.getElementById('edit-bio-1').value,
        bio2: document.getElementById('edit-bio-2').value,
        bio3: document.getElementById('edit-bio-3').value
    }));

    modal.style.display = 'none';
});

// Load saved data on page load
window.addEventListener('load', () => {
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
        document.getElementById('profile-image').src = savedPhoto;
    }

    const savedData = localStorage.getItem('profileData');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.querySelector('.profile-name-section h1').textContent = data.name;
        const bioContainer = document.querySelector('.profile-bio');
        bioContainer.innerHTML = '';
        [data.bio1, data.bio2, data.bio3].forEach(bio => {
            if (bio) {
                const p = document.createElement('p');
                p.textContent = bio;
                bioContainer.appendChild(p);
            }
        });
    }
});

function setGradeWidths() {
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach(card => {
        const gradeText = card.querySelector('.grade').textContent;
        const [obtained, total] = gradeText.split('/').map(Number);
        const percentage = (obtained / total) * 100;
        card.style.setProperty('--grade-width', `${percentage}%`);
    });
}

// Call when page loads
document.addEventListener('DOMContentLoaded', setGradeWidths);
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>