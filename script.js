document.addEventListener("DOMContentLoaded", () => {
  async function startExam() {
    // 시작 버튼 숨기기
    const startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.style.display = "none";

    // 문제 JSON 읽기
    const res = await fetch("questions_new.json"); // 파일명 그대로
    const rawData = await res.json();             // 배열이라고 가정

    // JSON 구조 표준화
    const normalized = rawData.map((q, idx) => {
      // 질문 텍스트: question 없으면 question_text 사용
      const stem =
        (q.question !== undefined && q.question !== null
          ? q.question
          : q.question_text !== undefined && q.question_text !== null
          ? q.question_text
          : ""
        ).toString();

      // 선택지: choices 배열이 있으면 그대로 사용
      let choices = Array.isArray(q.choices) ? q.choices.slice() : [];
      // 혹시 choice1~4 형식이면 거기서 구성
      if (choices.length === 0) {
        ["choice1", "choice2", "choice3", "choice4"].forEach((k) => {
          if (q[k]) choices.push(q[k].toString());
        });
      }

      // 정답: answer, correct, answer_index 중 하나 사용
      const ansRaw = q.answer ?? q.correct ?? q.answer_index;
      const answer = ansRaw !== undefined && ansRaw !== null ? Number(ansRaw) : NaN;

      // 해설
      const explanation =
        (q.explanation ?? q.comment ?? "").toString();

      return {
        id: q.id ?? idx + 1,
        stem,
        choices,
        answer,
        explanation,
      };
    }).filter((q) => q.stem && q.choices.length > 0 && !Number.isNaN(q.answer));

    // 랜덤으로 20문제 추출
    const SHUFFLED = [...normalized].sort(() => Math.random() - 0.5);
    const selectedQuestions = SHUFFLED.slice(0, 20);

    const examDiv = document.getElementById("exam");
    examDiv.innerHTML = "";

    // 문제 출력
    selectedQuestions.forEach((q, index) => {
      const stemHtml = q.stem.replace(/\n/g, "<br>");
      examDiv.innerHTML += `
        <div class="question">
          <p>${index + 1}. ${stemHtml}</p>
          ${q.choices
            .map(
              (c, i) =>
                `<label><input type="radio" name="q${index}" value="${i + 1}"> ${c}</label>`
            )
            .join("")}
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

        if (isCorrect) score += 5; // 1문항당 5점

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
    const correctCount = results.filter((r) => r.isCorrect).length;

    const totalScore = Math.round(score);
    const isPass = totalScore >= 60;
    const passFail = isPass ? "합격" : "불합격";
    const passFailColor = isPass ? "blue" : "red";

    resultDiv.innerHTML += `
      <h2>채점 결과</h2>
      <h1 style="color:${passFailColor}">
        ${correctCount}/${totalQuestions} (${totalScore}점, ${passFail})
      </h1>
    `;

    results.forEach((item, idx) => {
      let noAnswerMark = "";
      if (item.selected === null) {
        noAnswerMark = `<p style="color:red">[무응답]</p>`;
      }

      const stemHtml = item.q.stem.replace(/\n/g, "<br>");

      let choicesHtml = item.q.choices
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

      resultDiv.innerHTML += `
        <div>
          <p>${idx + 1}. ${stemHtml}</p>
          ${noAnswerMark}
          ${choicesHtml}
          ${
            item.q.explanation
              ? `<p><em>해설: ${item.q.explanation.replace(/\n/g, "<br>")}</em></p>`
              : ""
          }
        </div>
        <hr>
      `;
    });

    resultDiv.innerHTML += `
      <button class="submit" onclick="window.location.reload()">모의고사 다시풀기</button>
    `;
  }

  // HTML의 onclick에서 사용
  window.startExam = startExam;
});
