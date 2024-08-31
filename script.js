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

let mediaStream1 = null;
let mediaRecorder1 = null;
let recordedChunks1 = [];

let mediaStream2 = null;
let mediaRecorder2 = null;
let recordedChunks2 = [];

// Handle video upload
videoUpload1.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        videoPreview1.src = url;
        videoPreview1.controls = true;
    }
});

videoUpload2.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        videoPreview2.src = url;
        videoPreview2.controls = true;
    }
});

// Start the camera
startCameraButton1.addEventListener('click', async () => {
    try {
        mediaStream1 = await navigator.mediaDevices.getUserMedia({ video: true });
        videoPreview1.srcObject = mediaStream1;
        videoPreview1.controls = false;
        startCameraButton1.disabled = true;
        stopCameraButton1.disabled = false;
        captureVideoButton1.disabled = false;
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
});

// Start the camera
startCameraButton2.addEventListener('click', async () => {
    try {
        mediaStream2 = await navigator.mediaDevices.getUserMedia({ video: true });
        videoPreview2.srcObject = mediaStream2;
        videoPreview2.controls = false;
        startCameraButton2.disabled = true;
        stopCameraButton2.disabled = false;
        captureVideoButton2.disabled = false;
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
});

// Stop the camera
stopCameraButton1.addEventListener('click', () => {
    if (mediaStream1) {
        mediaStream1.getTracks().forEach(track => track.stop());
        videoPreview1.srcObject = null;
        startCameraButton1.disabled = false;
        stopCameraButton1.disabled = true;
        captureVideoButton1.disabled = true;
    }
});

// Stop the camera 2
stopCameraButton2.addEventListener('click', () => {
    if (mediaStream2) {
        mediaStream2.getTracks().forEach(track => track.stop());
        videoPreview2.srcObject = null;
        startCameraButton2.disabled = false;
        stopCameraButton2.disabled = true;
        captureVideoButton2.disabled = true;
    }
});

// Capture the video 1
captureVideoButton1.addEventListener('click', () => {
    if (mediaStream1) {
        if (!mediaRecorder1 || mediaRecorder1.state === 'inactive') {
            recordedChunks1 = [];
            mediaRecorder1 = new MediaRecorder(mediaStream1);
            mediaRecorder1.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks1.push(event.data);
                }
            };
            mediaRecorder1.onstop = () => {
                const blob = new Blob(recordedChunks1, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                videoPreview1.src = url;
                videoPreview1.controls = true;
            };
            mediaRecorder1.start();
            captureVideoButton1.textContent = 'Stop Recording';
        } else if (mediaRecorder1.state === 'recording') {
            mediaRecorder1.stop();
            captureVideoButton1.textContent = 'Capture Video';
        }
    }
});

// Capture the video 2
captureVideoButton2.addEventListener('click', () => {
    if (mediaStream2) {
        if (!mediaRecorder2 || mediaRecorder2.state === 'inactive') {
            recordedChunks2 = [];
            mediaRecorder2 = new MediaRecorder(mediaStream2);
            mediaRecorder2.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks2.push(event.data);
                }
            };
            mediaRecorder2.onstop = () => {
                const blob = new Blob(recordedChunks2, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                videoPreview2.src = url;
                videoPreview2.controls = true;
            };
            mediaRecorder2.start();
            captureVideoButton2.textContent = 'Stop Recording';
        } else if (mediaRecorder2.state === 'recording') {
            mediaRecorder2.stop();
            captureVideoButton2.textContent = 'Capture Video';
        }
    }
});
