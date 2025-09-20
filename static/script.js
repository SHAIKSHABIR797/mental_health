// Mental Health Chatbot JavaScript
class MentalHealthChatbot {
  constructor() {
    this.isRecording = false;
    this.isCameraActive = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.analysisHistory = [];

    this.initializeElements();
    this.setupEventListeners();
    this.setupWebRTC();
  }

  initializeElements() {
    // Chat elements
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendMessage");
    this.chatMessages = document.getElementById("chatMessages");
    this.moodIndicator = document.getElementById("moodIndicator");

    // Camera elements
    this.videoElement = document.getElementById("videoElement");
    this.canvasElement = document.getElementById("canvasElement");
    this.toggleCameraButton = document.getElementById("toggleCamera");
    this.captureImageButton = document.getElementById("captureImage");
    this.facialResults = document.getElementById("facialResults");

    // Audio elements
    this.toggleRecordingButton = document.getElementById("toggleRecording");
    this.recordingStatus = document.getElementById("recordingStatus");
    this.voiceResults = document.getElementById("voiceResults");

    // Other elements
    this.recommendationsContent = document.getElementById(
      "recommendationsContent"
    );
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.analysisModal = document.getElementById("analysisModal");
    this.modalBody = document.getElementById("modalBody");
    this.viewAllResourcesButton = document.getElementById("viewAllResources");
  }

  setupEventListeners() {
    // Chat functionality
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Camera functionality
    this.toggleCameraButton.addEventListener("click", () =>
      this.toggleCamera()
    );
    this.captureImageButton.addEventListener("click", () =>
      this.captureImage()
    );

    // Audio functionality
    this.toggleRecordingButton.addEventListener("click", () =>
      this.toggleRecording()
    );

    // Emergency resources
    this.viewAllResourcesButton.addEventListener("click", () =>
      this.showEmergencyResources()
    );

    // Modal functionality
    const closeModal = document.querySelector(".close");
    if (closeModal) {
      closeModal.addEventListener("click", () => this.closeModal());
    }

    window.addEventListener("click", (e) => {
      if (e.target === this.analysisModal) {
        this.closeModal();
      }
    });
  }

  async setupWebRTC() {
    try {
      // Check for WebRTC support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("WebRTC not supported");
        this.showError(
          "Camera and microphone features require a modern browser with WebRTC support."
        );
        return;
      }
    } catch (error) {
      console.error("WebRTC setup error:", error);
    }
  }

  async toggleCamera() {
    if (!this.isCameraActive) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        this.videoElement.srcObject = this.stream;
        this.isCameraActive = true;
        this.toggleCameraButton.innerHTML =
          '<i class="fas fa-camera-slash"></i> Stop Camera';
        this.captureImageButton.disabled = false;
        this.showSuccess("Camera activated successfully!");
      } catch (error) {
        console.error("Camera access error:", error);
        this.showError("Unable to access camera. Please check permissions.");
      }
    } else {
      this.stopCamera();
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
    this.isCameraActive = false;
    this.toggleCameraButton.innerHTML =
      '<i class="fas fa-camera"></i> Start Camera';
    this.captureImageButton.disabled = true;
  }

  captureImage() {
    if (!this.isCameraActive) return;

    const canvas = this.canvasElement;
    const context = canvas.getContext("2d");

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    context.drawImage(this.videoElement, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    this.analyzeFacialExpression(imageData);
  }

  async toggleRecording() {
    if (!this.isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          this.analyzeVoiceEmotion(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.toggleRecordingButton.innerHTML =
          '<i class="fas fa-stop"></i> Stop Recording';
        this.recordingStatus.textContent = "Recording... Speak now";
        this.recordingStatus.classList.add("recording");

        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, 10000);
      } catch (error) {
        console.error("Microphone access error:", error);
        this.showError(
          "Unable to access microphone. Please check permissions."
        );
      }
    } else {
      this.stopRecording();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.toggleRecordingButton.innerHTML =
        '<i class="fas fa-microphone"></i> Start Recording';
      this.recordingStatus.textContent = "Processing audio...";
      this.recordingStatus.classList.remove("recording");
    }
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message) return;

    // Disable send button to avoid spamming
    this.sendButton.disabled = true;

    // Add user message to chat
    this.addMessageToChat(message, "user");
    this.messageInput.value = "";

    // Show loading
    this.showLoading(true);

    try {
      // Prepare analysis data
      const analysisData = {
        message: message,
        image: this.isCameraActive ? this.getCurrentImageData() : null,
        audio: null, // Audio will be handled separately
      };

      // Send to backend for analysis
      const response = await fetch("/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData),
      });

      const result = await response.json();

      if (result.success) {
        // Add bot response to chat
        this.addMessageToChat(result.chatbot_response, "bot");

        // Update mood indicator
        this.updateMoodIndicator(result.analysis);

        // Show recommendations
        this.displayRecommendations(result.recommendations);

        // Store analysis history
        this.analysisHistory.push(result);

        // Update facial results if available
        if (result.analysis.facial) {
          this.displayFacialResults(result.analysis.facial);
        }
      } else {
        this.showError("Analysis failed: " + result.error);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      this.showError("Unable to analyze message. Please try again.");
    } finally {
      this.showLoading(false);
      this.sendButton.disabled = false;
    }
  }

  getCurrentImageData() {
    if (!this.isCameraActive) return null;

    const canvas = this.canvasElement;
    const context = canvas.getContext("2d");

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    context.drawImage(this.videoElement, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async analyzeFacialExpression(imageData) {
    this.showLoading(true);

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "",
          image: imageData,
          audio: null,
        }),
      });

      const result = await response.json();

      if (result.success && result.analysis.facial) {
        this.displayFacialResults(result.analysis.facial);
        this.updateMoodIndicator(result.analysis);
      } else {
        this.showError("Facial analysis failed");
      }
    } catch (error) {
      console.error("Facial analysis error:", error);
      this.showError("Unable to analyze facial expression");
    } finally {
      this.showLoading(false);
    }
  }

  async analyzeVoiceEmotion(audioBlob) {
    this.showLoading(true);

    try {
      // Convert audio blob to base64 for sending
      const reader = new FileReader();
      reader.onload = async () => {
        const audioData = reader.result;

        const response = await fetch("/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "",
            image: null,
            audio: audioData,
          }),
        });

        const result = await response.json();

        if (result.success && result.analysis.voice) {
          this.displayVoiceResults(result.analysis.voice);
          this.updateMoodIndicator(result.analysis);
        } else {
          this.showError("Voice analysis failed");
        }

        this.showLoading(false);
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Voice analysis error:", error);
      this.showError("Unable to analyze voice emotion");
      this.showLoading(false);
    }
  }

  addMessageToChat(message, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const avatarDiv = document.createElement("div");
    avatarDiv.className = "message-avatar";
    avatarDiv.innerHTML =
      sender === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = `<p>${message}</p>`;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  updateMoodIndicator(analysis) {
    let mood = "Neutral";
    let emoji = "😊";

    if (analysis.text && analysis.text.sentiment) {
      const sentiment = analysis.text.sentiment.label;
      if (sentiment === "POSITIVE") {
        mood = "Positive";
        emoji = "😊";
      } else if (sentiment === "NEGATIVE") {
        mood = "Needs Support";
        emoji = "😔";
      }
    }

    if (analysis.facial && analysis.facial.dominant_emotion) {
      const emotion = analysis.facial.dominant_emotion;
      if (emotion === "happy") {
        mood = "Happy";
        emoji = "😄";
      } else if (emotion === "sad") {
        mood = "Sad";
        emoji = "😢";
      } else if (emotion === "angry") {
        mood = "Frustrated";
        emoji = "😠";
      } else if (emotion === "fear") {
        mood = "Anxious";
        emoji = "😰";
      }
    }

    this.moodIndicator.textContent = `${emoji} ${mood}`;
  }

  displayFacialResults(facialData) {
    if (facialData.faces_detected === 0) {
      this.facialResults.innerHTML =
        "<p>No face detected. Please ensure you are visible in the camera.</p>";
      return;
    }

    let html = `<h4>Detected Emotions:</h4>`;

    if (facialData.emotions && Object.keys(facialData.emotions).length > 0) {
      for (const [emotion, score] of Object.entries(facialData.emotions)) {
        const percentage = (score * 100).toFixed(1);
        html += `
                    <div class="emotion-result">
                        <span>${
                          emotion.charAt(0).toUpperCase() + emotion.slice(1)
                        }: ${percentage}%</span>
                        <div class="emotion-bar">
                            <div class="emotion-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
      }
    }

    html += `<p><strong>Dominant Emotion:</strong> ${facialData.dominant_emotion}</p>`;
    this.facialResults.innerHTML = html;
  }

  displayVoiceResults(voiceData) {
    let html = `<h4>Voice Emotion Analysis:</h4>`;

    if (voiceData.emotions && Object.keys(voiceData.emotions).length > 0) {
      for (const [emotion, score] of Object.entries(voiceData.emotions)) {
        const percentage = (score * 100).toFixed(1);
        html += `
                    <div class="emotion-result">
                        <span>${
                          emotion.charAt(0).toUpperCase() + emotion.slice(1)
                        }: ${percentage}%</span>
                        <div class="emotion-bar">
                            <div class="emotion-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
      }
    }

    html += `<p><strong>Dominant Emotion:</strong> ${voiceData.dominant_emotion}</p>`;
    this.voiceResults.innerHTML = html;

    // Clear recording status
    this.recordingStatus.textContent = "";
  }

  displayRecommendations(recommendations) {
    let html = "";

    if (
      recommendations.immediate_actions &&
      recommendations.immediate_actions.length > 0
    ) {
      html += `
                <div class="recommendation-category">
                    <h4><i class="fas fa-exclamation-circle"></i> Immediate Actions</h4>
                    <ul class="recommendation-list">
                        ${recommendations.immediate_actions
                          .map((action) => `<li>${action}</li>`)
                          .join("")}
                    </ul>
                </div>
            `;
    }

    if (recommendations.activities && recommendations.activities.length > 0) {
      html += `
                <div class="recommendation-category">
                    <h4><i class="fas fa-heart"></i> Suggested Activities</h4>
                    <ul class="recommendation-list">
                        ${recommendations.activities
                          .map((activity) => `<li>${activity}</li>`)
                          .join("")}
                    </ul>
                </div>
            `;
    }

    if (
      recommendations.therapy_options &&
      recommendations.therapy_options.length > 0
    ) {
      html += `
                <div class="recommendation-category">
                    <h4><i class="fas fa-stethoscope"></i> Therapy Options</h4>
                    <ul class="recommendation-list">
                        ${recommendations.therapy_options
                          .map((option) => `<li>${option}</li>`)
                          .join("")}
                    </ul>
                </div>
            `;
    }

    this.recommendationsContent.innerHTML = html;
  }

  async showEmergencyResources() {
    this.showLoading(true);

    try {
      const response = await fetch("/emergency");
      const data = await response.json();

      if (data.success) {
        let html = `<h3>Emergency Resources</h3><ul>`;

        data.resources.forEach((resource) => {
          html += `
                        <li>
                            <a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.name}</a><br/>
                            <small>${resource.description}</small>
                        </li>
                    `;
        });

        html += "</ul>";

        this.modalBody.innerHTML = html;
        this.analysisModal.style.display = "block";
      } else {
        this.showError("Failed to load emergency resources");
      }
    } catch (error) {
      console.error("Emergency resources fetch error:", error);
      this.showError(
        "Unable to load emergency resources. Please try again later."
      );
    } finally {
      this.showLoading(false);
    }
  }

  closeModal() {
    this.analysisModal.style.display = "none";
  }

  showLoading(show) {
    if (show) {
      this.loadingOverlay.style.display = "flex";
    } else {
      this.loadingOverlay.style.display = "none";
    }
  }

  showError(message) {
    // Simple alert for errors - customize or use a modal/snackbar for production
    alert(`Error: ${message}`);
    console.error(message);
  }

  showSuccess(message) {
    // Simple console log for success - customize for UI feedback
    console.log(`Success: ${message}`);
  }
}

// Initialize the chatbot once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const chatbot = new MentalHealthChatbot();
});
