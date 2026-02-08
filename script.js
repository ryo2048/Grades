let subjects = JSON.parse(localStorage.getItem("subjects") || "[]");

function save(){
    localStorage.setItem("subjects",JSON.stringify(subjects));
}

function addSubject(){

    const name=document.getElementById("name").value;
    const rate=parseFloat(document.getElementById("rate").value);

    if(!name || isNaN(rate)){
        alert("入力してください！");
        return;
    }

    subjects.push({
        name,
        rate,
        scores:[0,0,0,0],
        assignment:0
    });

    save();
    render();

    document.getElementById("name").value="";
    document.getElementById("rate").value="";
}

function updateScore(i,index,value){
    subjects[i].scores[index]=parseFloat(value)||0;
    save();
    render();
}

function updateAssignment(i,value){
    subjects[i].assignment=parseFloat(value)||0;
    save();
    render();
}

function deleteSubject(i){
    subjects.splice(i,1);
    save();
    render();
}

function render(){

    const container=document.getElementById("subjects");
    container.innerHTML="";

    subjects.forEach((sub,i)=>{

        const examAvg=(sub.scores.reduce((a,b)=>a+b,0))/4;
        const final=examAvg*sub.rate+sub.assignment;
        const remaining=Math.max(0,60-final);
        const pass=final>=60;

        const card=document.createElement("div");
        card.className="card";

        card.innerHTML=`

<div class="subject-title">${sub.name}</div>

<label>前期中間</label>
<input type="number" value="${sub.scores[0]}" 
oninput="updateScore(${i},0,this.value)">

<label>前期期末</label>
<input type="number" value="${sub.scores[1]}" 
oninput="updateScore(${i},1,this.value)">

<label>後期中間</label>
<input type="number" value="${sub.scores[2]}" 
oninput="updateScore(${i},2,this.value)">

<label>後期期末</label>
<input type="number" value="${sub.scores[3]}" 
oninput="updateScore(${i},3,this.value)">

<label>課題点</label>
<input type="number" value="${sub.assignment}"
oninput="updateAssignment(${i},this.value)">

<div class="result ${pass?"pass":"fail"}">
試験平均：${examAvg.toFixed(1)}<br>
最終成績：${final.toFixed(1)}<br>
${pass?"✅ 合格！":"❌ 単位まで残り "+remaining.toFixed(1)+" 点"}
</div>

<button class="delete" onclick="deleteSubject(${i})">
科目を削除
</button>
`;

        container.appendChild(card);
    });
}

render();
