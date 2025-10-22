const apiKey = "AIzaSyADTohyi_aVEuT2rjcd1u4HCXy8PadHH2k"; 
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const startSpeechButton = document.getElementById("start-speech");

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };

    recognition.onstart = function () {
        console.log("Speech recognition started");
        startSpeechButton.classList.add("recording");
    };

    recognition.onend = function () {
        console.log("Speech recognition ended");
        startSpeechButton.classList.remove("recording");
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        startSpeechButton.classList.remove("recording");
    };
} else {
    console.log("Speech recognition not supported in this browser.");
    document.getElementById("start-speech").style.display = "none";
}

function startSpeechRecognition() {
    if (recognition) {
        recognition.start();
    }
}

let isTyping = false;
let typingTimeout;
let currentElement;
let currentText;
let currentSpeed;
let userScrolled = false; // Track if the user has manually scrolled

async function sendMessage() {
    const userInputText = userInput.value;
    if (!userInputText) return;

    if (isTyping) {
        stopTyping();
        return;
    }

    // Append user message
    const userMsgElement = document.createElement("div");
    userMsgElement.classList.add("user-message");
    userMsgElement.textContent = userInputText;
    chatBox.appendChild(userMsgElement);
    autoScroll();

    // Append loading indicator
    const loadingIndicator = createLoadingIndicator();
    chatBox.appendChild(loadingIndicator);
    autoScroll();

    userInput.value = "";

    try {
        userInput.classList.add("disabled");
        sendButton.classList.add("typing");
        sendButton.onclick = stopTyping;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userInputText }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            appendMessage(`Bot: Error ${response.status} - ${errorData.error.message}`, 'bot', loadingIndicator);
            console.error("Fetch error:", errorData);
            return;
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No response from AI";
        appendMessage("Bot: " + reply, 'bot', loadingIndicator);
    } catch (error) {
        appendMessage("Bot: Error fetching response. Please try again.", 'bot', loadingIndicator);
        console.error("Fetch error:", error);
    } finally {
        userInput.classList.remove("disabled");
        sendButton.classList.remove("typing");
        sendButton.onclick = sendMessage;
    }
}

function appendMessage(message, sender, loadingIndicator) {
    if (sender === 'bot') {
        const msgElement = document.createElement("div");
        msgElement.classList.add("bot-message");
        chatBox.appendChild(msgElement);
        autoScroll();
        const botPrefix = "Bot: ";
        let botMessageText = message.startsWith(botPrefix) ? message.slice(botPrefix.length) : message;

        // Apply formatting
        let formattedNodes = [];
        let parts = botMessageText.split('\n');
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i].trim();
            if (part.startsWith("*") && part.length > 1) {
                const bullet = document.createElement("br");
                formattedNodes.push(bullet);
                const bulletPoint = document.createTextNode(`• ${part.substring(1).trim()}`);
                formattedNodes.push(bulletPoint);
                const bulletBreak = document.createElement("br");
                formattedNodes.push(bulletBreak);
            } else if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
                const boldText = document.createElement("strong");
                const boldContent = document.createTextNode(part.substring(2, part.length - 2));
                boldText.appendChild(boldContent);
                formattedNodes.push(boldText);
            }
             else {
                const textNode = document.createTextNode(part);
                formattedNodes.push(textNode);
            }
        }
        
        typeWriter(msgElement, formattedNodes, 10, loadingIndicator, () => {
        }); // 10ms delay for typing effect
    }
}

function typeWriter(element, nodes, speed, loadingIndicator, callback) {
    let i = 0;
    isTyping = true;
    currentElement = element;
    currentText = nodes;
    currentSpeed = speed;
    chatBox.removeChild(loadingIndicator);
    element.innerHTML = ""; // Clear the element

    function type() {
        if (!isTyping) {
             for (let node of nodes) {
                element.appendChild(node);
            }
            return;
        }

        if (i < nodes.length) {
            if (nodes[i].nodeType === 3) { // Text node
                let nodeText = nodes[i].textContent;
                if (nodeText.length > 0) {
                    let charIndex = 0;
                    function typeTextNode() {
                        if (!isTyping) {
                            element.appendChild(document.createTextNode(nodeText));
                            return;
                        }

                        if (charIndex < nodeText.length) {
                            element.appendChild(document.createTextNode(nodeText[charIndex]));
                            charIndex++;
                            typingTimeout = setTimeout(typeTextNode, speed);
                            autoScroll();
                        } else {
                            i++;
                            if (i < nodes.length) {
                                type(); // Move to the next node
                            } else {
                                isTyping = false;
                                userInput.classList.remove("disabled");
                                sendButton.classList.remove("typing");
                                sendButton.onclick = sendMessage;
                                callback();
                            }
                        }
                    }
                    typeTextNode();
                } else {
                    i++;
                     if (i < nodes.length) {
                        type(); // Move to the next node
                    } else {
                        isTyping = false;
                        userInput.classList.remove("disabled");
                        sendButton.classList.remove("typing");
                        sendButton.onclick = sendMessage;
                        callback();
                    }
                }
            } else { // Element node (e.g., <strong>)
                element.appendChild(nodes[i]);
                i++;
                if (i < nodes.length) {
                    type(); // Move to the next node
                } else {
                    isTyping = false;
                    userInput.classList.remove("disabled");
                    sendButton.classList.remove("typing");
                    sendButton.onclick = sendMessage;
                    callback();
                }
            }
            
            autoScroll(); // Ensure auto-scroll during typing
        } else {
            isTyping = false;
            userInput.classList.remove("disabled");
            sendButton.classList.remove("typing");
            sendButton.onclick = sendMessage;
            callback();
        }
    }

    type();
}

function stopTyping() {
    clearTimeout(typingTimeout);
    isTyping = false;
    userInput.classList.remove("disabled");
    sendButton.classList.remove("typing");
    sendButton.onclick = sendMessage;
     for (let node of currentText) {
        currentElement.appendChild(node);
    }
}

function handleKeyDown(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function autoScroll() {
    if (!userScrolled) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

chatBox.addEventListener('scroll', function () {
    if (chatBox.scrollTop + chatBox.clientHeight < chatBox.scrollHeight) {
        userScrolled = true; // User has scrolled up
    } else {
        userScrolled = false; // User is at the bottom
    }
});

function createLoadingIndicator() {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.classList.add("loading-indicator");

    for (let i = 0; i < 3; i++) {
        const circle = document.createElement("span");
        loadingIndicator.appendChild(circle);
    }

    return loadingIndicator;
}

const toggle = document.getElementById("toggle");
const body = document.body;

// Apply saved theme on load
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  toggle.checked = true;
}

toggle.addEventListener("change", () => {
  body.classList.toggle("dark");

  // Save preference
  if (body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});

function scrollToBottom() {
    const chatBox = document.querySelector('.chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Add this to your message handling function
function addMessage(message, isUser = false) {
    // ...existing message addition code...
    
    scrollToBottom();
}
