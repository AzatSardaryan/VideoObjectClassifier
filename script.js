
const VIDEO1_KEY = 'video1';
const VIDEO2_KEY = 'video2';

// Get references to the HTML elements
const videoPreview1 = document.getElementById('videoPreview1');
const videoUpload1 = document.getElementById('videoUpload1');
const startCameraButton1 = document.getElementById('startCamera1');
const stopCameraButton1 = document.getElementById('stopCamera1');
const captureVideoButton1 = document.getElementById('captureVideo1');
const videoPreview2 = document.getElementById('videoPreview2');
const videoUpload2 = document.getElementById('videoUpload2');
const startCameraButton2 = document.getElementById('startCamera2');
const stopCameraButton2 = document.getElementById('stopCamera2');
const captureVideoButton2 = document.getElementById('captureVideo2');
const compareButton = document.getElementById('compareVideos');
const resultsDiv = document.getElementById('results');

// Set up the initial states of the media
let mediaStream1 = null;
let mediaRecorder1 = null;
let recordedChunks1 = [];
let mediaStream2 = null;
let mediaRecorder2 = null;
let recordedChunks2 = [];

// Track if videos are ready
const videoReady = {
    [VIDEO1_KEY]: false,
    [VIDEO2_KEY]: false
};

// Load MobileNet model
let mobilenetModel;
async function loadModel() {
    mobilenetModel = await mobilenet.load();
    console.log('MobileNet model loaded');
}
loadModel();

// Function to check if we need to enable the compare button
function updateCompareButton() {
    if (videoReady[VIDEO1_KEY] && videoReady[VIDEO2_KEY]) {
        compareButton.disabled = false;
    } else {
        compareButton.disabled = true;
    }
}

// Function to handle video upload
function handleVideoUpload(videoElement, fileInputElement, videoKey) {
    fileInputElement.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            videoElement.src = url;
            videoElement.controls = true;
            videoReady[videoKey] = true; // Update ready flag
            updateCompareButton(); // Check if compare button should be enabled
        }
    });
}

// Function to start the camera
async function startCamera(videoElement, startButton, stopButton, captureButton, videoKey) {
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = mediaStream;
        videoElement.controls = false;
        startButton.disabled = true;
        stopButton.disabled = false;
        captureButton.disabled = false;
        videoReady[videoKey] = false;
        updateCompareButton();
        return mediaStream;
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
}

// Function to stop the camera
function stopCamera(videoElement, startButton, stopButton, captureButton, mediaStream) {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop()); // Stop all tracks of the media stream
        videoElement.srcObject = null; // Clear the video element
        startButton.disabled = false; // Re-enable the start camera button
        stopButton.disabled = true; // Disable the stop camera button
        captureButton.disabled = true; // Disable the capture video button
    }
}

function captureVideo(videoElement, mediaStream, mediaRecorder, recordedChunks, captureButton, videoKey) {
    if (mediaStream) {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            recordedChunks.length = 0; // Clear recorded chunks
            mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                // Stop the camera feed before displaying the recorded video
                mediaStream.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null; // Disconnect the live feed

                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                videoElement.src = url;
                videoElement.controls = true;
                videoElement.play(); // Automatically play the recorded video
                captureButton.textContent = 'Capture Video';
                captureButton.disabled = true; // Disable capture button after recording is complete
                videoReady[videoKey] = true;
                updateCompareButton();
            };
            mediaRecorder.start();
            captureButton.textContent = 'Stop Recording';
        } else if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Stop the recording
        }
    }
    return mediaRecorder; // Return the mediaRecorder to keep its state
}

// Function to extract a frame from the video
function extractFrame(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas;
}

// Function to classify video frames
async function classifyFrame(frame) {
    const img = tf.browser.fromPixels(frame);
    const predictions = await mobilenetModel.classify(img);
    return predictions;
}

// Function to compare videos
async function compareVideos() {
    if (!mobilenetModel) {
        console.error('MobileNet model is not loaded');
        return;
    }

    const frame1 = extractFrame(videoPreview1);
    const frame2 = extractFrame(videoPreview2);

    const predictions1 = await classifyFrame(frame1);
    const predictions2 = await classifyFrame(frame2);

    console.log('Predictions for Video 1:', predictions1);
    console.log('Predictions for Video 2:', predictions2);

    const result = comparePredictions(predictions1, predictions2);
    resultsDiv.textContent = `Comparison Result: ${result}`;
}

// Function to compare predictions
function comparePredictions(predictions1, predictions2) {
    const topPrediction1 = predictions1[0] ? predictions1[0].className : 'Unknown';
    const topPrediction2 = predictions2[0] ? predictions2[0].className : 'Unknown';
    return topPrediction1 === topPrediction2 ? 'Match' : 'No Match';
}

// Set up event listeners for video upload and camera controls
handleVideoUpload(videoPreview1, videoUpload1, VIDEO1_KEY);
handleVideoUpload(videoPreview2, videoUpload2, VIDEO2_KEY);

startCameraButton1.addEventListener('click', async () => {
    mediaStream1 = await startCamera(videoPreview1, startCameraButton1, stopCameraButton1, captureVideoButton1, VIDEO1_KEY);
});

startCameraButton2.addEventListener('click', async () => {
    mediaStream2 = await startCamera(videoPreview2, startCameraButton2, stopCameraButton2, captureVideoButton2, VIDEO2_KEY);
});

stopCameraButton1.addEventListener('click', () => {
    stopCamera(videoPreview1, startCameraButton1, stopCameraButton1, captureVideoButton1, mediaStream1);
    mediaStream1 = null; // Reset the mediaStream to null after stopping the camera
    mediaRecorder1 = null; // Reset the mediaRecorder to null after stopping the camera
});

stopCameraButton2.addEventListener('click', () => {
    stopCamera(videoPreview2, startCameraButton2, stopCameraButton2, captureVideoButton2, mediaStream2);
    mediaStream2 = null; // Reset the mediaStream to null after stopping the camera
    mediaRecorder2 = null; // Reset the mediaRecorder to null after stopping the camera
});

captureVideoButton1.addEventListener('click', () => {
    mediaRecorder1 = captureVideo(videoPreview1, mediaStream1, mediaRecorder1, recordedChunks1, captureVideoButton1, VIDEO1_KEY);
});

captureVideoButton2.addEventListener('click', () => {
    mediaRecorder2 = captureVideo(videoPreview2, mediaStream2, mediaRecorder2, recordedChunks2, captureVideoButton2, VIDEO2_KEY);
});

// Ensure compareButton is defined before adding event listener
if (compareButton) {
    compareButton.addEventListener('click', compareVideos);
} else {
    console.error('Compare button not found');
}
