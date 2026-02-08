let openIndex = -1;
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
        
        let cardClass="card";
        
        const examAvg = calcAverage(sub.scores || [0,0,0,0]);
        const final = examAvg * sub.rate + (sub.assignment || 0);
        
        if(final>=60){
            cardClass+=" pass-card";
        }else if(final>0){
            cardClass+=" fail-card";
        }
        
        div.className=cardClass;

        const isOpen = openIndex===i;

        div.innerHTML=`
            <div class="subject-row">
                <b>${sub.name}</b>
                <button class="edit-mini">✏️</button>
                <button class="delete-mini">×</button>
            </div>
            
            ${isOpen ? detailHTML(sub,i) : ""}
        `;

        div.querySelector(".subject-row")
        .addEventListener("click",()=>{
            openIndex = (openIndex===i) ? -1 : i;
            renderList();
        });
        
        // ★ 削除
        div.querySelector(".delete-mini")
        .addEventListener("click",(e)=>{
            e.stopPropagation();
            deleteSubject(i);
        });
        
        // ★ 編集ボタン ←ここ追加！！
        div.querySelector(".edit-mini")
        .addEventListener("click",(e)=>{
            e.stopPropagation();
            editName(i);
        });

        // ★ input触ったときカード閉じるの防止（超重要）
        div.querySelectorAll("input").forEach(input=>{
            input.addEventListener("click",(e)=>{
                e.stopPropagation();
            });
        });

        container.appendChild(div);
    });

    if(openIndex!==-1){
        updateResult(openIndex);
    }
}

function toggleCard(i){

    openIndex = (openIndex===i) ? -1 : i;

    renderList();
}

function editName(i){

    const current = subjects[i].name;

    const newName = prompt("新しい科目名を入力", current);

    if(!newName || newName===current) return;

    subjects[i].name = newName;

    save();
    renderList();
}

function detailHTML(sub,i){
    return `
<hr>

前期中間<input type="number" value="${sub.scores[0]}"
oninput="updateScore(${i},0,this.value)">

前期期末<input type="number" value="${sub.scores[1]}"
oninput="updateScore(${i},1,this.value)">

後期中間<input type="number" value="${sub.scores[2]}"
oninput="updateScore(${i},2,this.value)">

後期期末<input type="number" value="${sub.scores[3]}"
oninput="updateScore(${i},3,this.value)">

課題点<input type="number" value="${sub.assignment}"
oninput="updateAssignment(${i},this.value)">

<div id="result-${i}"></div>
`;
}

function deleteSubject(i){

    if(!confirm("削除しますか？")) return;

    subjects.splice(i,1);

    // 開いていたカード対策
    if(openIndex===i){
        openIndex=-1;
    }else if(openIndex>i){
        openIndex--;
    }

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

    const resultDiv=document.getElementById(`result-${i}`);
    if(!resultDiv) return;

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

new Sortable(document.getElementById("subjects"), {

    animation:150,
    ghostClass:"sortable-ghost",

    delay:150,
    delayOnTouchOnly:true,
    fallbackTolerance:8,

    scroll: false,
    
    preventOnFilter:false, // ←追加

    onEnd:(evt)=>{
        const moved = subjects.splice(evt.oldIndex,1)[0];
        subjects.splice(evt.newIndex,0,moved);
        save();
    }
});

