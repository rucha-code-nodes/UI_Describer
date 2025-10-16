

import React, { useState, useCallback } from 'react';



// Debounce function to limit how often a function can run.
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- React Components ---

const IconCamera = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

const IconCopy = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const LoadingSpinner = ({ text }) => (
    <div className="spinner-container">
        <div className="spinner"></div>
        <p>{text}</p>
    </div>
);

const App = () => {
    const [url, setUrl] = useState('');
    const [image, setImage] = useState(null);
    const [imageBase64, setImageBase64] = useState('');
    const [prompt, setPrompt] = useState('');
    const [description, setDescription] = useState('');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);

    const handleThemeToggle = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleCapture = async () => {
        if (!url) {
            setError('Please enter a website URL.');
            return;
        }
        
        setIsCapturing(true);
        setError('');
        setImage(null);
        setImageBase64('');
        setDescription('');

       
        const PAGE_SPEED_API_KEY = "YOUR_PAGESPEED_API_KEY"; 
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=DESKTOP&screenshot=true&key=${PAGE_SPEED_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                throw new Error(`Google PageSpeed API Error: ${data.error.message}. Ensure the URL is correct and publicly accessible.`);
            }

            const screenshotData = data.lighthouseResult?.audits?.['final-screenshot']?.details?.data;
            if (!screenshotData) {
                throw new Error("Screenshot could not be generated for this URL.");
            }
            
            // Convert Google's base64 format to standard base64
            const formattedImage = screenshotData.replace(/_/g, '/').replace(/-/g, '+');
            setImage(formattedImage);
            setImageBase64(formattedImage.split(',')[1]); // Keep only the raw base64 for Gemini

        } catch (err) {
            setError(err.message);
            console.error(err);
        } finally {
            setIsCapturing(false);
        }
    };


    const debouncedSetPrompt = useCallback(debounce((value) => setPrompt(value), 300), []);

    const handleAnalyze = async () => {
        if (!imageBase64) {
            setError('Please capture a screenshot first.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setDescription('');
        setCopySuccess('');

      
       const url = "http://localhost:5000/api/ui/analyze";


        const fullPrompt = `As a world-class UI/UX designer, provide a detailed analysis of the user interface in this screenshot. Describe the layout, color scheme, typography, key components (like navigation, buttons, cards), visual hierarchy, and overall style. ${prompt ? `The user added this specific request: "${prompt}"` : ''}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: fullPrompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: imageBase64
                            }
                        }
                    ]
                }
            ]
        };
        
        try {
             let response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
             
             if (result.candidates && result.candidates.length > 0) {
                 const generatedText = result.candidates[0].content.parts[0].text;
                 setDescription(generatedText);
             } else {
                 setError('Analysis failed. The model did not return a valid response. Please try again.');
             }
        } catch (err) {
            setError(`An error occurred: ${err.message}. Please check your connection and try again.`);
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const copyToClipboard = () => {
        if (description) {
            // Using document.execCommand as a fallback for iFrame compatibility
            const textArea = document.createElement("textarea");
            textArea.value = description;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess('Copied to clipboard!');
                setTimeout(() => setCopySuccess(''), 2000);
            } catch (err) {
                setCopySuccess('Failed to copy!');
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
<style>{`
/* --- Global Styles & Resets --- */
:root {
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --timing-fast: 0.25s;
}

/* Light Mode Colors */
.light-mode {
    --bg-primary: #f0f4f8;
    --bg-secondary: rgba(255, 255, 255, 0.1);
    --text-primary: #1c1e21;
    --text-secondary: #4b4f56;
    --border-color: rgba(200, 200, 200, 0.2);
    --accent-primary: #007bff;
    --accent-primary-hover: #0056b3;
    --accent-secondary: rgba(0, 123, 255, 0.2);
    --shadow-color: rgba(0, 0, 0, 0.08);
}

/* Dark Mode Colors */
.dark-mode {
    --bg-primary: #0f3434;
    --bg-secondary: rgba(30, 30, 30, 0.15);
    --text-primary: #e4e6eb;
    --text-secondary: #b0b3b8;
    --border-color: rgba(100, 100, 100, 0.2);
    --accent-primary: #00ffc6;
    --accent-primary-hover: #00e6b0;
    --accent-secondary: rgba(0, 255, 198, 0.2);
    --shadow-color: rgba(0, 0, 0, 0.5);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: var(--font-sans);
    transition: all 0.3s ease;
}

/* Body */
body {
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

/* --- App Layout --- */
.app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1rem;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f3434, #062626);
}

.main-content {
    width: 100%;
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* --- Header --- */
header {
    text-align: center;
    margin-bottom: 1rem;
}

h1 {
    font-size: 3rem;
    font-weight: 900;
    color: var(--text-primary);
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.subtitle {
    font-size: 1.2rem;
    color: var(--text-secondary);
    max-width: 550px;
    margin: 0.5rem auto 0;
}

/* --- Card / Glassmorphism --- */
.card {
    background: var(--bg-secondary);
    backdrop-filter: blur(12px);
    border-radius: 18px;
    padding: 2rem;
    box-shadow: 0 8px 32px var(--shadow-color);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 36px var(--shadow-color);
}

/* --- Theme Toggle --- */
.theme-toggle {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.6rem;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.theme-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 0 12px var(--accent-primary);
}

/* --- URL Input Area --- */
.url-input-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.url-input {
    padding: 0.85rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background-color: rgba(255,255,255,0.05);
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.3s ease, box-shadow 0.3s ease;
}

.url-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 10px var(--accent-primary), 0 0 20px var(--accent-secondary);
}

/* --- Capture Button --- */
.capture-button {
    padding: 0.85rem 1.5rem;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #28a745, #1e7e34);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease, box-shadow 0.3s ease;
}

.capture-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 12px #28a745, 0 0 24px #1e7e34;
}

.capture-button:disabled {
    background-color: var(--text-secondary);
    cursor: not-allowed;
}

/* --- Image Preview --- */
.image-preview {
    margin-top: 1.5rem;
    text-align: center;
}

.image-preview img {
    max-width: 100%;
    max-height: 450px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px var(--shadow-color);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.image-preview img:hover {
    transform: scale(1.02);
    box-shadow: 0 0 16px var(--accent-primary), 0 0 32px var(--accent-secondary);
}

/* --- Prompt Input --- */
.prompt-input {
    width: 100%;
    padding: 1rem 1.2rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background-color: rgba(255,255,255,0.05);
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.3s ease, box-shadow 0.3s ease;
    min-height: 80px;
    resize: vertical;
}

.prompt-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 12px var(--accent-primary), 0 0 24px var(--accent-secondary);
}

/* --- Analyze Button --- */
.analyze-button {
    width: 100%;
    padding: 1rem;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover));
    color: white;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease, box-shadow 0.3s ease;
    margin-top: 1rem;
}

.analyze-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 0 12px var(--accent-primary), 0 0 24px var(--accent-secondary);
}

.analyze-button:disabled {
    background-color: var(--text-secondary);
    cursor: not-allowed;
}

/* --- Results Area --- */
.result-card {
    min-height: 120px;
    background: rgba(0,0,0,0.15);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px var(--shadow-color);
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.result-header h3 {
    color: var(--text-primary);
    font-size: 1.4rem;
    font-weight: 700;
}

.copy-button {
    background-color: var(--accent-secondary);
    color: var(--accent-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.copy-button:hover {
    background-color: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
}

/* --- Success & Error Messages --- */
.copy-success-message {
    color: var(--accent-primary);
    font-size: 0.95rem;
    font-weight: 500;
    text-align: right;
    height: 1rem;
}

.description-text {
    white-space: pre-wrap;
    color: var(--text-primary);
    font-size: 1rem;
    line-height: 1.7;
}

.error-message {
    color: #ff4b5c;
    font-weight: 600;
    background-color: rgba(255, 75, 92, 0.1);
    padding: 1rem;
    border-radius: 12px;
    text-align: center;
    margin-top: 1rem;
}

/* --- Loading Spinner --- */
.spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary);
    padding: 2rem 0;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 6px solid var(--accent-secondary);
    border-bottom-color: var(--accent-primary);
    border-radius: 50%;
    animation: rotation 1s linear infinite;
}

@keyframes rotation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* --- Responsive --- */
@media (max-width: 600px) {
    h1 { font-size: 2.2rem; }
    .card { padding: 1.5rem; }
    .app-container { padding: 1.5rem 1rem; }
}
`}</style>


            <button className="theme-toggle" onClick={handleThemeToggle} aria-label="Toggle theme">
                {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="main-content">
                <header>
                    <h1>UI Auditor</h1>
                    <p className="subtitle">Paste the image, and let AI provide a complete UI/UX analysis.</p>
                </header>

                <div className="card">
    <div
        className="url-input-container"
        onPaste={async (e) => {
            const items = e.clipboardData.items;
            const imageItem = Array.from(items).find(item => item.type.startsWith("image/"));
            if (!imageItem) return;

            const file = imageItem.getAsFile();
            if (!file) return;

            setIsCapturing(true);
            setError('');
            setImage(null);
            setImageBase64('');
            setDescription('');

            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Data = reader.result;
                    setImage(base64Data);
                    setImageBase64(base64Data.split(',')[1]); // raw base64 for AI
                };
                reader.readAsDataURL(file);
            } catch (err) {
                setError('Failed to load pasted image.');
                console.error(err);
            } finally {
                setIsCapturing(false);
            }
        }}
        style={{
            border: '2px dashed var(--border-color)',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'text'
        }}
    >
        {image ? (
            <img src={image} alt="Pasted preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
        ) : (
            <p>Paste an image here (Ctrl+V or Cmd+V)</p>
        )}
    </div>
    {isCapturing && <LoadingSpinner text="Loading image..." />}
</div>


                <div className="card">
                     <textarea
                        className="prompt-input"
                        placeholder="Optional: Add a specific focus for the analysis (e.g., 'focus on the mobile usability')..."
                        onChange={(e) => debouncedSetPrompt(e.target.value)}
                    />
                </div>
                
                <button className="analyze-button" onClick={handleAnalyze} disabled={isAnalyzing || isCapturing || !image}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze UI'}
                </button>
                
                {error && <p className="error-message">{error}</p>}

                {(isAnalyzing || description) && (
                    <div className="card result-card">
                        {isAnalyzing ? (
                            <LoadingSpinner text="Analyzing UI... This may take a moment." />
                        ) : (
                            description && (
                                <div>
                                    <div className="result-header">
                                        <h3>Analysis Result</h3>
                                        <button onClick={copyToClipboard} className="copy-button">
                                            <IconCopy /> Copy
                                        </button>
                                    </div>
                                    <div className="copy-success-message">{copySuccess}</div>
                                    <p className="description-text">{description}</p>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;





