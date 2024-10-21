import React from 'react';
import './WelcomeBox.css';

function WelcomeBox() {
  return (
    <div className="welcome-box">
      <h1>KI Kundentrainer</h1>
      <details>
        <summary>Über den KI Kundentrainer</summary>
        <p>
          Willkommen beim KI Kundentrainer für Bankmitarbeiter! Dieser innovative Trainer
          unterstützt Sie dabei, Ihre Fähigkeiten in Kundengesprächen zu verbessern.
          Üben Sie realistische Szenarien, erhalten Sie sofortiges Feedback und
          steigern Sie Ihre Kompetenz in der Kundenberatung. Klicken Sie, um mehr zu erfahren.
        </p>
      </details>
    </div>
  );
}

export default WelcomeBox;