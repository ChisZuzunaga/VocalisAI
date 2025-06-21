import React from 'react';
import AudioRecorder from '../pages/AudioRecorder.jsx';
import '../styles/Section.css';

const Section = () => {
  return (
      <div className="container-section">
        <section className="section-left recorder-container">
          <AudioRecorder />
        </section>
        <section className="section-right">
          asdasdasdsad
        </section>
    </div>
  )
}

export default Section;