function checkGrade(){
    let subjects = ["HTML", "CSS", "JavaScript"];
    let total = 0;
    for (let i=0; i<subjects.length; i++){
        subjects[i] = Number(prompt(`${subjects[i]} 점수를 입력하세요.`))
        if (isNaN(subjects[i])){
            alert("올바른 점수가 입력되지 않아 종료합니다.");
            return;
        }
        total += subjects[i];
    }
    let avg = total / subjects.length;

    let result = "";
    if (avg >= 60) {
        result = "🎉 합격입니다! 우수자로 선정되었습니다.";
    } else {
        result = "❌ 불합격입니다. 다음 기회에 힘내세요!";
    }

    alert(
        "====== 📊 성적 결과표 ======\n" +
        "• 총점: " + total + "점\n" +
        "• 평균: " + avg.toFixed(1) + "점\n" + // toFixed(1)은 소수점 첫째 자리까지만 출력하는 팁입니다.
        "---------------------------\n" +
        "• 결과: " + result
    );
}