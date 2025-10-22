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
