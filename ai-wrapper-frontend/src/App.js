import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import LoadingBar from './components/LoadingBar';
import WelcomeBox from './components/WelcomeBox';
import AudioRecorder from './components/AudioRecorder'; // Neue Komponente

function App() {
  const [prompt, setPrompt] = useState('');
  const [dialog, setDialog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const dialogRef = useRef(null);

  const handleSubmit = async (e, audioBlob = null) => {
    e.preventDefault();
    if ((prompt.trim() === '' && !audioBlob) || isLoading) return;
    setIsLoading(true);

    let userInput = prompt;

    if (audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        const transcriptionResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/speech-to-text`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        userInput = transcriptionResponse.data.text;
      } catch (error) {
        console.error('Transcription error:', error);
        setDialog((prev) => [...prev, { type: 'error', text: 'Fehler bei der Audiotranskription.' }]);
        setIsLoading(false);
        return;
      }
    }

    setDialog((prev) => [...prev, { type: 'user', text: userInput }]);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/llm`, {
        prompt: `Du bist ein erfahrener Trainer namens Tom Turbo für Kundengespräche in Banken. Deine Aufgabe ist es, Bankmitarbeiter durch Rollenspiele und Feedback in der Kunst der Kundenberatung zu schulen. Befolge diese Anweisungen:
        Stelle dich zu Beginn vor und erkläre kurz deine Rolle als Trainer.
        Frage den Benutzer, ob er als Kunde oder als Bankmitarbeiter agieren möchte.
        Führe Rollenspiele durch, die typische Kundengespräche in einer Bank simulieren. Nutze dabei das Wissen aus dem beigefügten Dokument für Kundengespräche.
        Wenn der Benutzer den Bankmitarbeiter spielt:
        Stelle verschiedene Kundentypen dar (z.B. unzufriedene, neugierige oder eilige Kunden).
        Bewerte die Antworten des Benutzers und gib konstruktives Feedback zur Verbesserung der Kommunikation.
        Wenn der Benutzer den Kunden spielt:
        Verkörpere einen kompetenten und einfühlsamen Bankmitarbeiter.
        Demonstriere Best Practices in der Kundenberatung.
        Passe deine Sprache und deinen Ton an die Situation an, um realistische Szenarien zu schaffen.
        Biete nach jedem Rollenspiel eine kurze Analyse an und hebe Stärken sowie Verbesserungspotenziale hervor.
        Sei bereit, spezifische Fragen zu Bankprodukten, Dienstleistungen oder Kundenkommunikation zu beantworten, basierend auf den Informationen im FAQ-Dokument.
        Ermuntere den Benutzer, verschiedene Szenarien auszuprobieren und aus den Rollenspielen zu lernen.
        Bleibe stets in deiner Rolle als Trainer und passe dich an die Bedürfnisse und den Fortschritt des Benutzers an.`,
        userPrompt: userInput,
        conversationId: conversationId
      });
      setDialog((prev) => [...prev, { type: 'ai', text: res.data.output }]);
      setConversationId(res.data.conversationId);
    } catch (error) {
      console.error('Error:', error);
      setDialog((prev) => [...prev, { type: 'error', text: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' }]);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAudioRecordingComplete = async (audioBlob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const transcriptionResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/speech-to-text`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPrompt(transcriptionResponse.data.text);
      handleSubmit({ preventDefault: () => {} });
    } catch (error) {
      console.error('Transcription error:', error);
      setDialog((prev) => [...prev, { type: 'error', text: 'Fehler bei der Audiotranskription.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = dialogRef.current.scrollHeight;
    }
  }, [dialog]);

  return (
    <div className="App">
      <WelcomeBox />
      <div className="content-wrapper">
        <div className="dialog-container" ref={dialogRef}>
          {dialog.map((entry, index) => (
            <p key={index} className={entry.type}>{entry.text}</p>
          ))}
        </div>
        <div className="form-container">
          {isLoading && <LoadingBar />}
          <form onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Gib deine Anfrage ein..."
            />
            <div className="button-container">
              <button type="submit" disabled={isLoading || prompt.trim() === ''}>
                {isLoading ? 'Lädt...' : 'Nachricht senden'}
              </button>
              <AudioRecorder onRecordingComplete={handleAudioRecordingComplete} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;