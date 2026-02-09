const levelButtons = document.querySelectorAll(".level-button");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const questionText = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const levelLabel = document.getElementById("levelLabel");
const scoreLabel = document.getElementById("scoreLabel");
const streakLabel = document.getElementById("streakLabel");
const timerLabel = document.getElementById("timerLabel");
const logList = document.getElementById("logList");
const missionCounter = document.getElementById("missionCounter");

let currentLevel = "private";
let questions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let timer = null;
let timeLeft = 30;
let isActive = false;
let isLoading = false;

const levelNames = {
  private: "Private Pilot",
  commercial: "Commercial Pilot",
  cfi: "CFI"
};

const resetGame = () => {
  currentIndex = 0;
  score = 0;
  streak = 0;
  timeLeft = 30;
  isActive = false;
  clearInterval(timer);
  updateScoreboard();
  questionText.textContent = "Choose a level and hit Start Mission to begin.";
  choicesEl.innerHTML = "";
  missionCounter.textContent = "Mission 1 of 5";
  timerLabel.textContent = `${timeLeft}s`;
  logList.innerHTML = "";
};

const updateScoreboard = () => {
  scoreLabel.textContent = score;
  streakLabel.textContent = streak;
  levelLabel.textContent = levelNames[currentLevel];
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const startTimer = () => {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft -= 1;
    timerLabel.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleAnswer(-1);
    }
  }, 1000);
};

const fetchQuestions = async (level) => {
  isLoading = true;
  startBtn.disabled = true;
  questionText.textContent = "Loading questions...";

  try {
    const response = await fetch(`/api/questions?level=${level}`);
    if (!response.ok) {
      throw new Error("API unavailable");
    }
    const data = await response.json();
    questions = shuffle(data.questions);
  } catch (error) {
    try {
      const fallbackResponse = await fetch("data/questions.json");
      if (!fallbackResponse.ok) {
        throw new Error("Unable to load fallback questions.");
      }
      const fallbackData = await fallbackResponse.json();
      questions = shuffle(fallbackData[level] || []);
    } catch (fallbackError) {
      questions = [];
      questionText.textContent = "Unable to load questions. Please try again.";
    }
  } finally {
    isLoading = false;
    startBtn.disabled = false;
  }
};

const loadQuestion = () => {
  const current = questions[currentIndex];
  if (!current) {
    questionText.textContent = "Mission complete! Review your flight log or switch levels to continue training.";
    choicesEl.innerHTML = "";
    timerLabel.textContent = "0s";
    isActive = false;
    return;
  }

  questionText.textContent = current.question;
  choicesEl.innerHTML = "";
  current.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "choice-btn";
    button.type = "button";
    button.textContent = choice;
    button.setAttribute("role", "listitem");
    button.addEventListener("click", () => handleAnswer(index));
    choicesEl.appendChild(button);
  });

  missionCounter.textContent = `Mission ${currentIndex + 1} of ${questions.length}`;
  timeLeft = 30;
  timerLabel.textContent = `${timeLeft}s`;
  startTimer();
};

const logEntry = (text) => {
  const li = document.createElement("li");
  li.textContent = text;
  logList.prepend(li);
};

const handleAnswer = (selectedIndex) => {
  if (!isActive) return;
  isActive = false;
  clearInterval(timer);

  const current = questions[currentIndex];
  const buttons = Array.from(document.querySelectorAll(".choice-btn"));
  const isCorrect = selectedIndex === current.answer;

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === current.answer) {
      button.classList.add("correct");
    }
    if (index === selectedIndex && !isCorrect) {
      button.classList.add("incorrect");
    }
  });

  if (isCorrect) {
    const timeBonus = Math.max(timeLeft, 0);
    streak += 1;
    score += 100 + timeBonus + streak * 10;
    logEntry(`✅ ${current.explanation}`);
  } else {
    streak = 0;
    logEntry(`❌ ${current.explanation}`);
  }

  updateScoreboard();

  setTimeout(() => {
    currentIndex += 1;
    isActive = true;
    loadQuestion();
  }, 1800);
};

levelButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    levelButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentLevel = button.dataset.level;
    resetGame();
    updateScoreboard();
    await fetchQuestions(currentLevel);
  });
});

startBtn.addEventListener("click", async () => {
  if (isLoading) return;
  if (questions.length === 0) {
    await fetchQuestions(currentLevel);
  }
  if (questions.length === 0) {
    questionText.textContent = "No questions available yet. Please try again.";
    return;
  }
  isActive = true;
  currentIndex = 0;
  loadQuestion();
});

resetBtn.addEventListener("click", () => {
  resetGame();
});

resetGame();
