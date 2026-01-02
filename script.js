// script.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const textDisplay = document.getElementById('text-display');
    const textInput = document.getElementById('text-input');
    const wpmElement = document.getElementById('wpm');
    const accuracyElement = document.getElementById('accuracy');
    const timerElement = document.getElementById('timer');
    const errorsElement = document.getElementById('errors');
    const restartBtn = document.getElementById('restart-btn');
    const newTextBtn = document.getElementById('new-text-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const resultsSection = document.getElementById('results');
    const finalWpmElement = document.getElementById('final-wpm');
    const finalAccuracyElement = document.getElementById('final-accuracy');
    const finalErrorsElement = document.getElementById('final-errors');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    // Test variables
    let timeLeft = 60;
    let timerInterval = null;
    let testStarted = false;
    let testCompleted = false;
    let startTime = null;
    let totalKeystrokes = 0;
    let correctKeystrokes = 0;
    let errors = 0;
    let currentText = '';
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let difficulty = 'easy';
    
    // Text samples for different difficulty levels
    const textSamples = {
        easy: [
            "The quick brown fox jumps over the lazy dog. This sentence contains all letters of the alphabet.",
            "Programming is the process of creating a set of instructions that tell a computer how to perform a task.",
            "JavaScript is a popular programming language used for web development. It makes websites interactive.",
            "Practice makes perfect when it comes to typing. Regular practice will help improve your speed and accuracy.",
            "The sun was shining brightly in the clear blue sky. Birds were singing sweetly in the trees."
        ],
        medium: [
            "Asynchronous programming is a form of parallel programming that allows a unit of work to run separately from the primary application thread.",
            "The Document Object Model (DOM) is a programming interface for web documents. It represents the structure of a document as a tree of objects.",
            "Closures are functions that have access to variables from an outer function's scope, even after the outer function has returned.",
            "Regular expressions are patterns used to match character combinations in strings. They are a powerful tool for text processing.",
            "Responsive web design ensures that web applications render well on a variety of devices and window or screen sizes."
        ],
        hard: [
            "The juxtaposition of quantum mechanics and general relativity presents a profound conundrum in theoretical physics, challenging our understanding of the universe's fundamental fabric.",
            "Polymorphism in object-oriented programming enables entities to take on multiple forms, allowing for more flexible and maintainable code architecture.",
            "Antidisestablishmentarianism, a political position originating in 19th-century Britain, opposed proposals to remove the Church of England's status as the state church.",
            "Pseudopseudohypoparathyroidism is an inherited disorder that resembles pseudohypoparathyroidism but without the associated biochemical abnormalities.",
            "The phenomenological hermeneutics of Martin Heidegger fundamentally reconceptualizes the ontological relationship between Dasein and its being-in-the-world."
        ]
    };
    
    // Initialize the test
    initTest();
    
    // Event listeners
    textInput.addEventListener('input', handleTyping);
    textInput.addEventListener('keydown', function(e) {
        // Prevent tab key from moving focus
        if (e.key === 'Tab') {
            e.preventDefault();
            // Insert tab character at cursor position
            const cursorPosition = this.selectionStart;
            const textBefore = this.value.substring(0, cursorPosition);
            const textAfter = this.value.substring(cursorPosition);
            this.value = textBefore + '\t' + textAfter;
            this.selectionStart = this.selectionEnd = cursorPosition + 1;
            handleTyping();
        }
    });
    
    restartBtn.addEventListener('click', restartTest);
    newTextBtn.addEventListener('click', newText);
    tryAgainBtn.addEventListener('click', restartTest);
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Set new difficulty
            difficulty = this.getAttribute('data-level');
            
            // Restart test with new difficulty
            restartTest();
        });
    });
    
    // Functions
    function initTest() {
        // Load initial text
        loadNewText();
        
        // Focus on input area
        textInput.focus();
    }
    
    function loadNewText() {
        // Get random text based on difficulty
        const samples = textSamples[difficulty];
        currentText = samples[Math.floor(Math.random() * samples.length)];
        
        // Display the text with formatting
        displayText();
        
        // Reset test variables
        resetTestVariables();
    }
    
    function displayText() {
        textDisplay.innerHTML = '';
        
        // Split text into words for better formatting
        const words = currentText.split(' ');
        
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            
            // Add each character as a separate span
            for (let i = 0; i < word.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.textContent = word[i];
                charSpan.id = `char-${wordIndex}-${i}`;
                wordSpan.appendChild(charSpan);
            }
            
            textDisplay.appendChild(wordSpan);
            
            // Add space after word (except for the last word)
            if (wordIndex < words.length - 1) {
                const spaceSpan = document.createElement('span');
                spaceSpan.textContent = ' ';
                spaceSpan.id = `space-${wordIndex}`;
                textDisplay.appendChild(spaceSpan);
            }
        });
        
        // Highlight the first character
        highlightCurrentChar();
    }
    
    function highlightCurrentChar() {
        // Remove current class from all characters
        document.querySelectorAll('.current').forEach(el => {
            el.classList.remove('current');
        });
        
        // Add current class to the current character
        const currentChar = document.getElementById(`char-${currentWordIndex}-${currentCharIndex}`);
        if (currentChar) {
            currentChar.classList.add('current');
        }
    }
    
    function resetTestVariables() {
        timeLeft = 60;
        testStarted = false;
        testCompleted = false;
        startTime = null;
        totalKeystrokes = 0;
        correctKeystrokes = 0;
        errors = 0;
        currentWordIndex = 0;
        currentCharIndex = 0;
        
        // Clear input
        textInput.value = '';
        textInput.disabled = false;
        
        // Update UI
        updateStats();
        timerElement.textContent = timeLeft;
        resultsSection.classList.add('hidden');
        
        // Clear timer if it exists
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Reset text display
        displayText();
    }
    
    function handleTyping() {
        const typedText = textInput.value;
        
        // Start the test and timer on first keystroke
        if (!testStarted && typedText.length > 0) {
            startTest();
        }
        
        // Don't process if test is completed
        if (testCompleted) return;
        
        // Calculate stats
        calculateStats(typedText);
        
        // Update the displayed text with correctness highlighting
        updateTextDisplay(typedText);
        
        // Check if test is complete (all text typed)
        checkTestCompletion(typedText);
    }
    
    function startTest() {
        testStarted = true;
        startTime = new Date();
        
        // Start the countdown timer
        timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                finishTest();
            }
        }, 1000);
    }
    
    function calculateStats(typedText) {
        // Reset stats
        totalKeystrokes = typedText.length;
        correctKeystrokes = 0;
        errors = 0;
        
        // Compare typed text with original text
        for (let i = 0; i < typedText.length; i++) {
            if (i < currentText.length) {
                if (typedText[i] === currentText[i]) {
                    correctKeystrokes++;
                } else {
                    errors++;
                }
            } else {
                errors++;
            }
        }
        
        // Calculate WPM (words per minute)
        // Standard: 5 characters = 1 word
        const timeInMinutes = (60 - timeLeft) / 60;
        const wordsTyped = correctKeystrokes / 5;
        const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
        
        // Calculate accuracy
        const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
        
        // Update UI
        wpmElement.textContent = wpm;
        accuracyElement.textContent = accuracy + '%';
        errorsElement.textContent = errors;
    }
    
    function updateTextDisplay(typedText) {
        // Reset all characters to default
        document.querySelectorAll('#text-display span').forEach(el => {
            el.classList.remove('correct', 'incorrect', 'current');
        });
        
        // Compare typed text with original and apply classes
        for (let i = 0; i < typedText.length; i++) {
            if (i < currentText.length) {
                const charElement = getCharElementAtIndex(i);
                if (charElement) {
                    if (typedText[i] === currentText[i]) {
                        charElement.classList.add('correct');
                    } else {
                        charElement.classList.add('incorrect');
                    }
                }
            }
        }
        
        // Find current position in the text
        if (typedText.length < currentText.length) {
            const currentCharElement = getCharElementAtIndex(typedText.length);
            if (currentCharElement) {
                currentCharElement.classList.add('current');
            }
        }
    }
    
    function getCharElementAtIndex(index) {
        // Convert flat index to word and character position
        let charCount = 0;
        const words = currentText.split(' ');
        
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
            for (let charIndex = 0; charIndex < words[wordIndex].length; charIndex++) {
                if (charCount === index) {
                    return document.getElementById(`char-${wordIndex}-${charIndex}`);
                }
                charCount++;
            }
            
            // Account for spaces between words
            if (wordIndex < words.length - 1) {
                if (charCount === index) {
                    return document.getElementById(`space-${wordIndex}`);
                }
                charCount++;
            }
        }
        
        return null;
    }
    
    function checkTestCompletion(typedText) {
        // Test is complete if all text is typed correctly or time is up
        if (typedText === currentText) {
            finishTest();
        }
    }
    
    function finishTest() {
        testCompleted = true;
        clearInterval(timerInterval);
        
        // Disable input
        textInput.disabled = true;
        
        // Calculate final stats
        const timeInMinutes = (60 - timeLeft) / 60;
        const wordsTyped = correctKeystrokes / 5;
        const finalWpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : Math.round(wordsTyped);
        const finalAccuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
        
        // Show results
        finalWpmElement.textContent = finalWpm;
        finalAccuracyElement.textContent = finalAccuracy + '%';
        finalErrorsElement.textContent = errors;
        
        resultsSection.classList.remove('hidden');
    }
    
    function restartTest() {
        resetTestVariables();
        textInput.focus();
    }
    
    function newText() {
        loadNewText();
        textInput.focus();
    }
    
    function updateStats() {
        wpmElement.textContent = '0';
        accuracyElement.textContent = '100%';
        errorsElement.textContent = '0';
    }
});