// System prompt for Gemini Flash ProMode
const systemPrompt = `You are Gemini Flash ProMode, Google's most advanced AI assistant. Follow these enhanced rules:
1. Provide expert-level responses with deeper insights
2. Offer multiple solution approaches when applicable
3. Include ProMode-exclusive tips and optimizations
4. Maintain faster response times with higher accuracy
... [rest of your system prompt] ...`;

// Initialize Marked.js
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
const downloadButton = document.getElementById('downloadButton');
const shareButton = document.getElementById('shareButton');
const installPrompt = document.getElementById('installPrompt');
const installButton = document.getElementById('installButton');
const dismissButton = document.getElementById('dismissInstall');
const loadingScreen = document.getElementById('loadingScreen');

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js', {
            scope: '/',
            updateViaCache: 'none'
        }).then(registration => {
            console.log('ServiceWorker registration successful');
            setInterval(() => registration.update(), 24 * 60 * 60 * 1000);
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Install Prompt Logic
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            installPrompt.style.display = 'flex';
        }
    }, 30000);
});

installButton.addEventListener('click', async () => {
    installPrompt.style.display = 'none';
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
    }
});

dismissButton.addEventListener('click', () => {
    installPrompt.style.display = 'none';
});

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Message Functions
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'} text-rendering`;
    messageDiv.setAttribute('role', isUser ? 'sent-message' : 'received-message');

    if (typeof content === 'string') {
        messageDiv.innerHTML = marked.parse(content);
    } else {
        messageDiv.appendChild(content);
    }

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function showThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'assistant-thinking';
    thinkingDiv.innerHTML = `
        <div class="thinking-dots">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
        </div>
        <span>Gemini is thinking...</span>
    `;
    chatContainer.appendChild(thinkingDiv);
    scrollToBottom();
    return thinkingDiv;
}

async function typeMessage(message, element, typingSpeed = 0.9) {
    let i = 0;
    const text = marked.parse(message);
    element.innerHTML = '';

    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (i < text.length) {
                element.innerHTML = text.substring(0, i);
                i++;
                scrollToBottom();
            } else {
                clearInterval(interval);
                element.classList.remove('text-rendering');
                resolve();
            }
        }, typingSpeed);
    });
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleScroll() {
    if (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight > 100) {
        scrollToBottomBtn.classList.add('visible');
    } else {
        scrollToBottomBtn.classList.remove('visible');
    }
}

// API Functions
const API_KEY = "AIzaSyAzq9A261QxsSJ0NgAEYbPrOHZWrKJWQs0"; // Note: Should be secured in production
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sendPrompt(retryCount = 0) {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendButton.disabled = true;

    addMessage(userMessage, true);
    const thinkingIndicator = showThinkingIndicator();

    try {
        const response = await fetchWithRetry(userMessage);
        const markdownText = response.candidates?.[0]?.content?.parts?.[0]?.text || 
            "No response was generated. Please try again.";

        thinkingIndicator.remove();
        const messageElement = addMessage('');
        await typeMessage(markdownText, messageElement);
        addCodeActions();
    } catch (err) {
        handleError(err, thinkingIndicator, retryCount);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

async function fetchWithRetry(userMessage) {
    const body = {
        contents: [{
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }]
        }],
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            stopSequences: []
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": API_KEY
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API request failed with status ${res.status}`);
    }

    return await res.json();
}

function handleError(err, thinkingIndicator, retryCount) {
    thinkingIndicator.remove();

    let errorMessage = `❌ Error: ${err.message}`;
    if (err.message.includes("quota")) {
        errorMessage = "⚠️ Rate limit exceeded. Please try again later.";
    } else if (err.message.includes("network")) {
        errorMessage = "⚠️ Network error. Please check your connection.";
    }

    const errorElement = addMessage(errorMessage);
    errorElement.className = 'error-message';

    const retryButton = document.createElement('button');
    retryButton.className = 'retry-btn';
    retryButton.textContent = '↻ Try Again';
    retryButton.onclick = () => {
        errorElement.remove();
        sendPrompt();
    };
    errorElement.appendChild(retryButton);

    console.error("API Error:", err);
}

// Code Block Actions
function addCodeActions() {
    document.querySelectorAll('pre').forEach((preElement) => {
        const code = preElement.querySelector('code').innerText;
        const footer = document.createElement('div');
        footer.className = 'code-block-footer';

        const copyBtn = createCodeActionButton('Copy', 'copy', code);
        const downloadBtn = createCodeActionButton('Download', 'download', code);

        footer.appendChild(copyBtn);
        footer.appendChild(downloadBtn);
        preElement.parentNode.insertBefore(footer, preElement.nextSibling);
    });

    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function createCodeActionButton(label, action, code) {
    const button = document.createElement('button');
    button.className = 'code-action-btn';
    
    if (action === 'copy') {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            ${label}
        `;
        button.onclick = () => handleCopyAction(button, code);
    } else {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            ${label}
        `;
        button.onclick = () => handleDownloadAction(code);
    }
    
    return button;
}

function handleCopyAction(button, code) {
    navigator.clipboard.writeText(code)
        .then(() => {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                </svg>
                Copied!
            `;
            setTimeout(() => {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                `;
            }, 2000);
        })
        .catch(err => {
            console.error("Copy failed:", err);
            button.textContent = "Error";
        });
}

function handleDownloadAction(code) {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-code-snippet.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Share and Download Functions
async function shareChat() {
    const messages = Array.from(chatContainer.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        return {
            role: isUser ? 'You' : 'Gemini',
            content: msg.textContent || msg.innerText
        };
    });

    const shareText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'My Gemini Flash ProMode Conversation',
                text: shareText,
            });
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            alert('Conversation copied to clipboard!');
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Conversation copied to clipboard!');
        }
    } catch (err) {
        console.error('Error sharing:', err);
    }
}

function downloadChat() {
    const messages = Array.from(chatContainer.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        return {
            role: isUser ? 'You' : 'Gemini',
            content: msg.textContent || msg.innerText
        };
    });

    const chatText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
    }
});

scrollToBottomBtn.addEventListener('click', scrollToBottom);
chatContainer.addEventListener('scroll', handleScroll);
shareButton.addEventListener('click', shareChat);
downloadButton.addEventListener('click', downloadChat);
sendButton.addEventListener('click', sendPrompt);

// Initialize App
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            
            const now = new Date();
            const hours = now.getHours();
            let greeting;
            
            if (hours < 12) greeting = "Good morning";
            else if (hours < 18) greeting = "Good afternoon";
            else greeting = "Good evening";
            
            const welcomeMessage = `${greeting}! I'm Gemini Flash ProMode, your advanced AI assistant. How can I help you today?`;
            const messageElement = addMessage(welcomeMessage);
            scrollToBottom();
        }, 500);
    }, 1000);
});