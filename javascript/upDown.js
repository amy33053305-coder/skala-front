function startGame() {
    var computerNum = Math.floor(Math.random()*50 + 1);
    var count = 0;

    console.log(`컴퓨터가 생각한 숫자는 ${computerNum}입니다.`);

    while (true){
        let inputNumber = Number(prompt("컴퓨터가 생각한 숫자를 추측해보세요!(1부터 50까지, 0을 누르면 종료됩니다.)"));
        
        if (inputNumber === 0){
            alert("게임이 취소되었습니다.");
            break;
        }

        count += 1;

        if (inputNumber < computerNum){
            alert("Up!");
        } else if (inputNumber > computerNum) {
            alert("Down!")
        } else if (inputNumber === computerNum){
            alert(`축하합니다! ${count}번 만에 맞추셨습니다.`)
            break;
        } else{
           alert("올바르지 않은 입력입니다. 다시 입력해주세요.") 
        }
    }
}