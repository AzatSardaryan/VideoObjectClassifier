// script.js

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

let mediaStream1 = null;
let mediaRecorder1 = null;
let recordedChunks1 = [];

let mediaStream2 = null;
let mediaRecorder2 = null;
let recordedChunks2 = [];

// Track if videos are ready
let video1Ready = false;
let video2Ready = false;

// Load MobileNet model
let mobilenetModel;
async function loadModel() {
    mobilenetModel = await mobilenet.load();
    console.log('MobileNet model loaded');
}
loadModel();

// Function to enable/disable compare button
function updateCompareButton() {
    if (video1Ready && video2Ready) {
        compareButton.disabled = false;
    } else {
        compareButton.disabled = true;
    }
}

// Function to handle video upload
function handleVideoUpload(videoElement, fileInputElement, readyFlag) {
    fileInputElement.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            videoElement.src = url;
            videoElement.controls = true;
            readyFlag = true; // Update ready flag
            updateCompareButton(); // Check if compare button should be enabled
        }
    });
}

// Function to start the camera
async function startCamera(videoElement, startButton, stopButton, captureButton, mediaStream, mediaRecorder, recordedChunks, readyFlag) {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = mediaStream;
        videoElement.controls = false;
        startButton.disabled = true;
        stopButton.disabled = false;
        captureButton.disabled = false;
        readyFlag = true; // Update ready flag
        updateCompareButton(); // Check if compare button should be enabled
        
        return { mediaStream, mediaRecorder, recordedChunks };
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
}

// Function to stop the camera
function stopCamera(videoElement, startButton, stopButton, captureButton, mediaStream) {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
        captureButton.disabled = true;
    }
}

// Function to handle video capture
function captureVideo(videoElement, mediaStream, mediaRecorder, recordedChunks, captureButton) {
    if (mediaStream) {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                videoElement.src = url;
                videoElement.controls = true;
                captureButton.textContent = 'Capture Video';

                // Mark video as ready
                if (videoElement === videoPreview1) {
                    video1Ready = true;
                } else if (videoElement === videoPreview2) {
                    video2Ready = true;
                }
                updateCompareButton(); // Check if compare button should be enabled
            };
            mediaRecorder.start();
            captureButton.textContent = 'Stop Recording';
        } else if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }
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
handleVideoUpload(videoPreview1, videoUpload1, video1Ready);
handleVideoUpload(videoPreview2, videoUpload2, video2Ready);

startCameraButton1.addEventListener('click', async () => {
    ({ mediaStream: mediaStream1, mediaRecorder: mediaRecorder1, recordedChunks: recordedChunks1 } = await startCamera(videoPreview1, startCameraButton1, stopCameraButton1, captureVideoButton1, mediaStream1, mediaRecorder1, recordedChunks1, video1Ready));
});

startCameraButton2.addEventListener('click', async () => {
    ({ mediaStream: mediaStream2, mediaRecorder: mediaRecorder2, recordedChunks: recordedChunks2 } = await startCamera(videoPreview2, startCameraButton2, stopCameraButton2, captureVideoButton2, mediaStream2, mediaRecorder2, recordedChunks2, video2Ready));
});

stopCameraButton1.addEventListener('click', () => {
    stopCamera(videoPreview1, startCameraButton1, stopCameraButton1, captureVideoButton1, mediaStream1);
});

stopCameraButton2.addEventListener('click', () => {
    stopCamera(videoPreview2, startCameraButton2, stopCameraButton2, captureVideoButton2, mediaStream2);
});

captureVideoButton1.addEventListener('click', () => {
    captureVideo(videoPreview1, mediaStream1, mediaRecorder1, recordedChunks1, captureVideoButton1);
});

captureVideoButton2.addEventListener('click', () => {
    captureVideo(videoPreview2, mediaStream2, mediaRecorder2, recordedChunks2, captureVideoButton2);
});

// Ensure compareButton is defined before adding event listener
if (compareButton) {
    compareButton.addEventListener('click', compareVideos);
} else {
    console.error('Compare button not found');
}
