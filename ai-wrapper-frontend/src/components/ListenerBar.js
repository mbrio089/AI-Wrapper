// components/ListenerBar.js
import React from 'react';
import './ListenerBar.css';

const ListenerBar = ({ isRecording }) => {
  if (!isRecording) return null;

  return (
    <div className="listener-bar">
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
  );
};

export default ListenerBar;