
(function(){
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('start');
  const form = document.getElementById('frames-form');
  const steps = document.querySelectorAll('.verification-step');

  function updateStatus(text, type = 'info') {
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' : 'info-circle';
    statusEl.innerHTML = `
      <span class="badge bg-${type === 'success' ? 'success' : 'dark'} text-${type === 'error' ? 'danger' : 'warning'} px-3 py-2">
        <i class="fas fa-${icon} me-2"></i>${text}
      </span>
    `;
  }

  function updateStep(stepIndex) {
    steps.forEach((step, index) => {
      if (index === stepIndex) {
        step.classList.add('active');
        step.classList.add('animate__animated', 'animate__pulse');
      } else {
        step.classList.remove('active');
        step.classList.remove('animate__animated', 'animate__pulse');
      }
    });
  }

  async function getStream() {
    const cameraStatus = document.getElementById('camera-status');
    const loadingOverlay = document.querySelector('.camera-loading');

    try {
      // Show loading state
      loadingOverlay.classList.add('active');
      cameraStatus.innerHTML = `
        <i class="fas fa-circle-notch fa-spin me-1"></i>
        <span>Requesting camera access...</span>
      `;

      // Request camera with specific constraints
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      console.log('Requesting camera stream...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);

      // Set the stream to the video element
      video.srcObject = stream;
      
      // Force video element to be visible
      video.style.display = 'block';
      video.style.visibility = 'visible';
      video.style.opacity = '1';

      console.log('Setting up video element events...');
      
      // Add event listeners for video element
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        video.play().catch(e => console.error('Error playing video:', e));
      };

      // Wait for video to actually start playing
      await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.warn('Video play timeout - continuing anyway');
          resolve();
        }, 5000);

        video.onplaying = () => {
          console.log('Video started playing');
          clearTimeout(timeoutId);
          resolve();
        };

        console.log('Attempting to play video...');
        video.play().catch(e => {
          console.error('Error during video.play():', e);
          // Don't resolve here, let the timeout handle it
        });
      });

      // Update status once camera is ready
      loadingOverlay.classList.remove('active');
      cameraStatus.innerHTML = `
        <i class="fas fa-check-circle me-1"></i>
        <span>Camera ready</span>
      `;
      
      updateStatus("Center your face in the circle and click Start", 'info');
      updateStep(0);

      // Wait a bit then hide the status
      setTimeout(() => {
        cameraStatus.style.opacity = '0';
        setTimeout(() => cameraStatus.style.display = 'none', 300);
      }, 2000);

    } catch (e) {
      console.error('Camera initialization error:', e);
      loadingOverlay.classList.remove('active');
      
      let errorMessage = 'Camera access denied';
      if (e.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device';
      } else if (e.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use';
      } else if (e.name === 'OverconstrainedError') {
        errorMessage = 'Camera cannot meet required constraints';
      } else if (e.name === 'TypeError') {
        errorMessage = 'Camera API not supported in this browser';
      }
      
      cameraStatus.innerHTML = `
        <i class="fas fa-exclamation-circle me-1"></i>
        <span>${errorMessage}</span>
      `;
      cameraStatus.classList.remove('bg-warning');
      cameraStatus.classList.add('bg-danger', 'text-white');
      cameraStatus.classList.add('bg-danger', 'text-white');
      
      updateStatus("Please allow camera access and refresh the page.", 'error');
      throw e;
    }
  }

  function captureFrame() {
    const w = canvas.width, h = canvas.height;
    ctx.drawImage(video, 0, 0, w, h);
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Failed to capture"));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }

  async function blobToFileInput(blob, inputId, filename) {
    const file = new File([blob], filename, { type: 'image/jpeg' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const el = document.getElementById(inputId);
    el.files = dt.files;
  }

  async function promptStep(text, ms) {
    updateStatus(text, 'info');
    await new Promise(r => setTimeout(r, ms));
  }

  async function validateFrame() {
    const base = document.getElementById('frame_base');
    
    if (!base || !base.files.length) {
      throw new Error("Missing face image. Please try again.");
    }
  }

  async function run() {
    startBtn.disabled = true;
    startBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      Verifying...
    `;

    try {
      // Make sure canvas size matches video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Initialize camera if not already running
      if (!video.srcObject) {
        await getStream();
      }
      
      // Capture face frame
      updateStep(0);
      await promptStep("Position your face in the center of the circle", 2000);
      await promptStep("Stay still, capturing image in 3...", 1000);
      await promptStep("2...", 1000);
      await promptStep("1...", 1000);
      const faceFrame = await captureFrame();
      await blobToFileInput(faceFrame, 'frame_base', 'face.jpg');
      
      // Validate frame before submission
      await validateFrame();
      updateStatus("Face captured successfully!", 'success');

      // Final step: Submit
      updateStep(2);
      await promptStep("Verifying your identity...", 1500);
      updateStatus("Processing verification...", 'info');
      
      // Add success animation before form submission
      startBtn.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        Verification Complete
      `;
      startBtn.classList.remove('btn-warning');
      startBtn.classList.add('btn-success');
      
      // Submit the form after a short delay to show the success state
      setTimeout(() => form.submit(), 1000);

    } catch(e) {
      console.error(e);
      updateStatus(e.message || "Verification failed. Please try again.", 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = `
        <i class="fas fa-camera-retro me-2"></i>
        Retry Verification
      `;
    }
  }

  // Initialize everything when the page loads
  async function initialize() {
    try {
      // Start the camera
      await getStream();
      
      // Enable the start button once camera is ready
      startBtn.disabled = false;
      startBtn.innerHTML = `
        <i class="fas fa-camera-retro me-2"></i>
        Start Verification
      `;
    } catch (error) {
      console.error('Initialization failed:', error);
      startBtn.disabled = true;
      startBtn.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        Camera Error
      `;
    }
  }

  // Initialize when page loads
  initialize();

  // Attach click handler
  startBtn.onclick = run;

  // Cleanup when page is unloaded
  window.addEventListener('beforeunload', () => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  });
})();
