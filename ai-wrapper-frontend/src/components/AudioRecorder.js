// components/AudioRecorder.js
import React, { useState, useRef } from 'react';

const AudioRecorder = ({ onRecordingComplete, setIsRecording }) => {
  const [isRecording, setIsRecordingLocal] = useState(false);
  const mediaRecorder = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecordingLocal(true);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecordingLocal(false);
      setIsRecording(false);
    }
  };

  return (
    <button style={{marginTop:"10px"}} type="button" onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? 'Spracheingabe stoppen' : 'Spracheingabe starten'}
    </button>
  );
};

export default AudioRecorder;