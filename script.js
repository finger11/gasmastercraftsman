// script.js
document.addEventListener("DOMContentLoaded", () => {

  async function startExam() {

    // 시작 버튼 숨기기
    const startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.style.display = "none";

    // 문제 JSON 읽기
    const res = await fetch("gas_questions.json?v=" + Date.now());
    const rawData = await res.json();

    // JSON 구조 표준화
    const normalized = rawData
      .map((q, idx) => {
        const stem = String(
          q.question ??
          q.question_text ??
          ""
        );

        let choices = Array.isArray(q.choices) ? q.choices.slice() : [];
        if (choices.length === 0) {
          ["choice1", "choice2", "choice3", "choice4"].forEach(k => {
            if (q[k]) choices.push(String(q[k]));
          });
        }

        const ansRaw = q.answer ?? q.correct ?? q.answer_index;
        const answer = Number(ansRaw);

        const explanation = String(q.explanation ?? q.comment ?? "");

        return {
          id: q.id ?? idx + 1,
          stem,
          choices,
          answer,
          explanation
        };
      })
      .filter(q =>
        q.stem.trim() !== "" &&
        q.choices.length > 0 &&
        Number.isFinite(q.answer)
      );

    // 20문항 랜덤 추출
    const shuffled = [...normalized].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 20);

    const examDiv = document.getElementById("exam");
    examDiv.innerHTML = "";

    // 문제 출력
    selectedQuestions.forEach((q, index) => {

      const stemHtml = String(q.stem).replace(/\n/g, "<br>");

      const choicesHtml = q.choices
        .map((c, i) =>
          `<label><input type="radio" name="q${index}" value="${i + 1}"> ${c}</label>`
        )
        .join("");

      examDiv.innerHTML += `
        <div class="question">
          <p>${index + 1}. ${stemHtml}</p>
          ${choicesHtml}
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
        const selected = sel ? parseInt(sel.value, 10) : null;

        const correct = q.answer;
        const isCorrect = selected === correct;

        if (isCorrect) score += 1;

        results.push({ q, selected, isCorrect });
      });

      showResult(score, results);
    });
  }


  // ====== 결과 표시 ======
  function showResult(score, results) {
    window.scrollTo(0, 0);

    const examDiv = document.getElementById("exam");
    examDiv.style.display = "none";

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    const totalQuestions = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;

    // ***** 합격/점수 제거 — 맞힌 개수만 표시 *****
    resultDiv.innerHTML += `
      <h2>채점 결과</h2>
      <h1>${correctCount} / ${totalQuestions}</h1>
    `;

    // ====== 문항별 해설 ======
    results.forEach((item, idx) => {

      const stemHtml = String(item.q.stem).replace(/\n/g, "<br>");

      let noAnswerMark = "";
      if (item.selected === null) {
        noAnswerMark = `<p style="color:red">[무응답]</p>`;
      }

      const choicesHtml = item.q.choices
        .map((choice, i) => {

          let mark = "";
          let markColor = "";

          if (item.q.answer === i + 1) {
            mark = "[O]";
            markColor = "blue";
          }

          if (
            item.selected !== null &&
            item.selected === i + 1 &&
            item.selected !== item.q.answer
          ) {
            mark = "[X]";
            markColor = "red";
          }

          return `<div>${choice} ${
            mark ? `<span style="color:${markColor}">${mark}</span>` : ""
          }</div>`;
        })
        .join("");

      const explanationHtml = item.q.explanation
        ? `<p><em>해설: ${String(item.q.explanation).replace(/\n/g, "<br>")}</em></p>`
        : "";

      resultDiv.innerHTML += `
        <div>
          <p>${idx + 1}. ${stemHtml}</p>
          ${noAnswerMark}
          ${choicesHtml}
          ${explanationHtml}
        </div>
        <hr>
      `;
    });

    resultDiv.innerHTML += `
      <button class="submit" onclick="window.location.reload()">모의고사 다시풀기</button>
    `;
  }


  // HTML에서 onclick 으로 호출 가능하도록 전역 등록
  window.startExam = startExam;

});

