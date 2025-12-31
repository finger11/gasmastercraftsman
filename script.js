document.addEventListener("DOMContentLoaded", () => {
  async function startExam() {
    // 시작 버튼 숨기기
    document.getElementById("startBtn").style.display = "none";

    // 문제 JSON 읽기
    const res = await fetch("questions_new.json");
    const data = await res.json(); // 전체 182문항 정도

    // 전체에서 20문제 랜덤 추출
    const SHUFFLED = [...data].sort(() => Math.random() - 0.5);
    const selectedQuestions = SHUFFLED.slice(0, 20);

    const examDiv = document.getElementById("exam");
    examDiv.innerHTML = "";

    selectedQuestions.forEach((q, index) => {
      examDiv.innerHTML += `
        <div class="question">
          <p>${index + 1}. ${q.question.replace(/\n/g, "<br>")}</p>
          ${q.choices.map((c, i) =>
            `<label><input type="radio" name="q${index}" value="${i + 1}"> ${c}</label>`
          ).join("")}
        </div>
        <hr>
      `;
    });

    examDiv.innerHTML += `<button class="submit" id="submitBtn">제출</button>`;

    document.getElementById("submitBtn").addEventListener("click", () => {
      let score = 0;
      const results = [];

      selectedQuestions.forEach((q, index) => {
        const sel = document.querySelector(`input[name='q${index}']:checked`);
        const selected = sel ? parseInt(sel.value) : null;
        const correct = q.answer;
        const isCorrect = selected === correct;

        // 채점 방식은 이전과 동일하게 1문항당 5점이라면 5씩 더해도 됨
        if (isCorrect) score += 5;

        results.push({ q, selected, isCorrect });
      });

      showResult(score, results);
    });
  }

  function showResult(score, results) {
    window.scrollTo(0, 0);
    const examDiv = document.getElementById("exam");
    examDiv.style.display = "none";

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    const totalQuestions = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;

    const totalScore = Math.round(score); // 정수 점수
    const isPass = totalScore >= 60;      // 기준점수는 필요에 따라 조정
    const passFail = isPass ? "합격" : "불합격";
    const passFailColor = isPass ? "blue" : "red";

    resultDiv.innerHTML += `
      <h2>채점 결과</h2>
      <h1 style="color:${passFailColor}">
        ${correctCount}/${totalQuestions} (${totalScore}점, ${passFail})
      </h1>
    `;

    // 문항별 해설
    results.forEach((item, idx) => {
      let noAnswerMark = "";
      if (item.selected === null) {
        noAnswerMark = `<p style="color:red">[무응답]</p>`;
      }

      let choicesHtml = item.q.choices.map((choice, i) => {
        let mark = "";
        let markColor = "";

        if (item.q.answer === i + 1) {
          // 정답
          mark = "[O]";
          markColor = "blue";
        }

        if (item.selected !== null && item.selected === i + 1 && item.selected !== item.q.answer) {
          // 사용자가 선택한 오답
          mark = "[X]";
          markColor = "red";
        }

        return `<div>${choice} ${mark ? `<span style="color:${markColor}">${mark}</span>` : ""}</div>`;
      }).join("");

      resultDiv.innerHTML += `
        <div>
          <p>${idx + 1}. ${item.q.question.replace(/\n/g, "<br>")}</p>
          ${noAnswerMark}
          ${choicesHtml}
          ${item.q.explanation
            ? `<p><em>해설: ${item.q.explanation.replace(/\n/g, "<br>")}</em></p>`
            : ""}
        </div>
        <hr>
      `;
    });

    resultDiv.innerHTML += `
      <button class="submit" onclick="window.location.reload()">모의고사 다시풀기</button>
    `;
  }

  // 전역으로 노출 (HTML의 onclick에서 사용)
  window.startExam = startExam;
});
