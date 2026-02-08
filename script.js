let subjects = JSON.parse(localStorage.getItem("subjects") || "[]");

function save(){
    localStorage.setItem("subjects",JSON.stringify(subjects));
}

// ===== 科目追加 =====
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
    renderList();

    document.getElementById("name").value="";
    document.getElementById("rate").value="";
}

// ===== 一覧表示 =====
function renderList(){

    const container=document.getElementById("subjects");
    container.innerHTML="";

    subjects.forEach((sub,i)=>{

        const div=document.createElement("div");
        div.className="card";

        div.innerHTML=`
            <div class="subject-row">
                <b>${sub.name}</b>
                <button class="delete-mini">×</button>
            </div>
        `;

        div.querySelector(".delete-mini")
        .addEventListener("click",(e)=>{
            e.stopPropagation(); // ← 親のクリックを止める
            deleteSubject(i);
        });

        // 詳細
        div.addEventListener("click",()=>{
            openDetail(i);
        });

        container.appendChild(div);

        new Sortable(document.getElementById("subjects"), {
            animation:150,
            ghostClass:"sortable-ghost",

            onEnd:(evt)=>{
                const moved = subjects.splice(evt.oldIndex,1)[0];
                subjects.splice(evt.newIndex,0,moved);
                save();
            }
        });
    });
}

function deleteSubject(i,event){

    event.stopPropagation(); // ←超重要

    if(!confirm("削除しますか？")) return;

    subjects.splice(i,1);

    save();
    renderList();
}

function moveUp(i,event){

    event.stopPropagation();

    if(i===0) return;

    [subjects[i-1],subjects[i]]=[subjects[i],subjects[i-1]];

    save();
    renderList();
}

function moveDown(i,event){

    event.stopPropagation();

    if(i===subjects.length-1) return;

    [subjects[i+1],subjects[i]]=[subjects[i],subjects[i+1]];

    save();
    renderList();
}

// ===== 詳細画面 =====
function openDetail(i){

    const sub=subjects[i];
    const container=document.getElementById("subjects");

    container.innerHTML="";

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
<h2>${sub.name}</h2>

前期中間<input type="number" inputmode="numeric" value="${sub.scores[0]}" oninput="updateScore(${i},0,this.value)">
前期期末<input type="number" inputmode="numeric" value="${sub.scores[1]}" oninput="updateScore(${i},1,this.value)">
後期中間<input type="number" inputmode="numeric" value="${sub.scores[2]}" oninput="updateScore(${i},2,this.value)">
後期期末<input type="number" inputmode="numeric" value="${sub.scores[3]}" oninput="updateScore(${i},3,this.value)">
課題点<input type="number" inputmode="numeric" value="${sub.assignment}" oninput="updateAssignment(${i},this.value)">

<div id="result"></div>

<button onclick="renderList()">← 戻る</button>
`;

    container.appendChild(card);

    updateResult(i);
}

// ===== 平均計算 =====
function calcAverage(scores){
    const valid=scores.filter(s=>s>0);
    if(!valid.length) return 0;

    return valid.reduce((a,b)=>a+b,0)/valid.length;
}

// ===== 結果更新（DOMだけ変更）=====
function updateResult(i){

    const sub=subjects[i];

    const examAvg=calcAverage(sub.scores);
    const final=examAvg*sub.rate+sub.assignment;
    const remaining=Math.max(0,60-final);
    const pass=final>=60;

    const resultDiv=document.getElementById("result");

    resultDiv.className="result " + (pass ? "pass" : "fail");

    resultDiv.innerHTML=`
試験平均：${examAvg.toFixed(1)}<br>
最終成績：${final.toFixed(1)}<br>
${pass?"✅ 合格！":"❌ 残り "+remaining.toFixed(1)+" 点"}
`;
}

// ===== 更新 =====
function updateScore(i,index,value){
    subjects[i].scores[index]=parseFloat(value)||0;
    save();
    updateResult(i);
}

function updateAssignment(i,value){
    subjects[i].assignment=parseFloat(value)||0;
    save();
    updateResult(i);
}

// 初期表示
renderList();
